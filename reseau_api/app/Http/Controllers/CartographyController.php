<?php

namespace App\Http\Controllers;

use App\Models\Coffret;
use App\Models\Equipement;
use App\Models\Liaison;
use App\Models\Lan;
use App\Models\Port;
use App\Models\Batiment;
use App\Models\Salle;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CartographyController extends Controller
{
    /**
     * Retourne la liste des topologies LAN disponibles.
     * Retourne tous les LANs de la base de données.
     */
    public function index(): JsonResponse
    {
        $lans = Lan::with('batiment', 'salle')->get();
        
        $topologies = $lans->map(function ($lan) {
            return [
                'id' => (string) $lan->id,
                'name' => $lan->name,
                'subnet' => $lan->subnet,
                'vlan' => $lan->vlan_id,
                'description' => $lan->description ?? "Topologie du LAN {$lan->name}",
                'batiment_id' => $lan->batiment_id,
                'salle_id' => $lan->salle_id,
            ];
        });

        return response()->json([
            'data' => $topologies,
        ]);
    }

    /**
     * Retourne la liste des bâtiments disponibles.
     */
    public function getBatiments(): JsonResponse
    {
        $batiments = Batiment::all();
        
        return response()->json([
            'data' => $batiments->map(function ($batiment) {
                return [
                    'id' => $batiment->id,
                    'nom' => $batiment->nom,
                ];
            }),
        ]);
    }

    /**
     * Retourne la liste des salles disponibles, optionnellement filtrées par bâtiment.
     */
    public function getSalles(Request $request): JsonResponse
    {
        $query = Salle::query();
        
        if ($request->has('batiment_id')) {
            $query->where('batiment_id', $request->batiment_id);
        }
        
        $salles = $query->with('batiment')->get();
        
        return response()->json([
            'data' => $salles->map(function ($salle) {
                return [
                    'id' => $salle->id,
                    'nom' => $salle->nom,
                    'batiment_id' => $salle->batiment_id,
                    'batiment_nom' => $salle->batiment?->nom,
                ];
            }),
        ]);
    }

    /**
     * Retourne le détail d'une topologie LAN.
     * Construit la topologie à partir des équipements, ports et liaisons associés au LAN.
     */
    public function show(string $id): JsonResponse
    {
        $lan = Lan::with('batiment', 'salle')->find($id);
        
        if (!$lan) {
            return response()->json([
                'message' => 'LAN introuvable',
            ], 404);
        }

        $topology = $this->buildTopologyForLan($lan);

        return response()->json([
            'data' => $topology,
        ]);
    }

    /**
     * Retourne une topologie filtrée par bâtiment et/ou salle.
     */
    public function getTopology(Request $request): JsonResponse
    {
        $batimentId = $request->get('batiment_id') ? (int) $request->get('batiment_id') : null;
        $salleId = $request->get('salle_id') ? (int) $request->get('salle_id') : null;
        $lanId = $request->get('lan_id') ? (int) $request->get('lan_id') : null;

        // Si un LAN est spécifié, utiliser la méthode existante
        if ($lanId) {
            $lan = Lan::with('batiment', 'salle')->find($lanId);
            
            if (!$lan) {
                return response()->json([
                    'message' => 'LAN introuvable',
                ], 404);
            }

            $topology = $this->buildTopologyForLan($lan);
        } else {
            // Construire la topologie selon les filtres
            $topology = $this->buildTopologyByFilters($batimentId, $salleId);
        }

        return response()->json([
            'data' => $topology,
        ]);
    }

    /**
     * Construit une topologie pour un LAN spécifique.
     * Récupère les équipements associés au LAN (par batiment/salle ou par vlan),
     * leurs ports, et les liaisons entre ces ports.
     */
    protected function buildTopologyForLan(Lan $lan): array
    {
        // Récupérer les équipements associés au LAN
        // Stratégie : Filtrer par VLAN pour obtenir les équipements du segment réseau
        // + Inclure les équipements d'interconnexion (VLAN 1 = management)

        $vlanId = (string) $lan->vlan_id;

        $equipements = Equipement::with(['coffret', 'batiment', 'salle', 'ports'])
            ->where(function ($query) use ($lan, $vlanId) {
                // Équipements avec le même VLAN que le LAN
                if ($vlanId) {
                    $query->where('vlan', $vlanId);

                    // Inclure le switch core (VLAN 1) pour montrer les interconnexions
                    // seulement si le LAN n'est pas déjà le VLAN 1
                    if ($vlanId !== '1') {
                        $query->orWhere(function ($q) use ($lan) {
                            $q->where('vlan', '1')
                              ->where('type', 'switch')
                              ->where(function ($sub) use ($lan) {
                                  // Même bâtiment/salle ou équipement core
                                  if ($lan->batiment_id) {
                                      $sub->where('batiment_id', $lan->batiment_id);
                                  }
                              });
                        });
                    }
                } else {
                    // Si pas de VLAN défini, filtrer par bâtiment/salle
                    if ($lan->batiment_id && $lan->salle_id) {
                        $query->where('batiment_id', $lan->batiment_id)
                              ->where('salle_id', $lan->salle_id);
                    } elseif ($lan->batiment_id) {
                        $query->where('batiment_id', $lan->batiment_id);
                    } else {
                        // Retourner tous les équipements si aucun critère
                        $query->whereRaw('1 = 1');
                    }
                }
            })
            ->get();

        // Récupérer tous les ports de ces équipements
        $portIds = [];
        foreach ($equipements as $equipement) {
            foreach ($equipement->ports as $port) {
                $portIds[] = $port->id;
            }
        }

        // Récupérer les liaisons qui utilisent ces ports
        $liaisons = Liaison::with(['fromPort.equipement', 'toPort.equipement'])
            ->where(function ($query) use ($portIds) {
                $query->whereIn('from', $portIds)
                      ->orWhereIn('to', $portIds);
            })
            ->get();

        // Construction des nœuds (équipements)
        $nodes = [];
        $equipementMap = new \SplObjectStorage(); // Pour mapper équipement -> index
        $index = 0;

        foreach ($equipements as $equipement) {
            $coffret = $equipement->coffret;
            $batiment = $equipement->batiment;
            $salle = $equipement->salle;

            $role = $this->mapEquipementTypeToRole($equipement->type, $equipement->name);
            $status = $this->mapStatusToLanStatus($equipement->status);

            // Position auto en grille
            $row = intdiv($index, 5);
            $col = $index % 5;

            $site = $salle?->nom ?? $batiment?->nom ?? $coffret?->piece ?? 'Inconnu';

            // Récupérer les ports de l'équipement
            $ports = $equipement->ports->map(function ($port) {
                return [
                    'id' => (string) $port->id,
                    'label' => $port->port_label,
                    'device_name' => $port->device_name,
                    'vlan' => $port->vlan,
                    'speed' => $port->speed,
                    'poe_enabled' => $port->poe_enabled,
                ];
            })->toArray();

            $nodes[] = [
                'id' => (string) $equipement->id,
                'name' => $equipement->name,
                'role' => $role,
                'status' => $status,
                'position' => [
                    'x' => 10 + $col * 20,
                    'y' => 10 + $row * 20,
                ],
                'site' => $site,
                'ip' => $equipement->ip_address ?? '',
                'model' => $equipement->type ?? '',
                'notes' => $equipement->description,
                'icon' => $this->getEquipementIcon($equipement->type, $equipement->name),
                'ports' => $ports, // Ajouter les ports à chaque nœud
            ];

            $equipementMap[$equipement] = $index;
            $index++;
        }

        // Construction des liens (liaisons)
        $links = [];
        $equipementIds = $equipements->pluck('id')->toArray();

        foreach ($liaisons as $liaison) {
            $fromPort = $liaison->fromPort;
            $toPort = $liaison->toPort;

            if (!$fromPort || !$toPort) {
                continue;
            }

            $fromEquipement = $fromPort->equipement;
            $toEquipement = $toPort->equipement;

            // Ne garder que les liaisons entre équipements de ce LAN
            if (!$fromEquipement || !$toEquipement) {
                continue;
            }

            if (!in_array($fromEquipement->id, $equipementIds) || !in_array($toEquipement->id, $equipementIds)) {
                continue;
            }

            // Déterminer la bande passante depuis la vitesse du port
            $bandwidth = $fromPort->speed ?? $toPort->speed ?? ($liaison->length ? $liaison->length . ' m' : 'N/A');

            $links[] = [
                'id' => (string) $liaison->id,
                'from' => (string) $fromEquipement->id,
                'to' => (string) $toEquipement->id,
                'type' => $this->mapMediaToLinkType($liaison->media),
                'vlan' => $fromPort->vlan ?? $toPort->vlan ?? $lan->vlan_id ?? '',
                'status' => $liaison->status ? 'up' : 'down',
                'bandwidth' => $bandwidth,
                'fromPort' => $fromPort->port_label,
                'toPort' => $toPort->port_label,
            ];
        }

        return [
            'id' => (string) $lan->id,
            'name' => $lan->name,
            'subnet' => $lan->subnet,
            'vlan' => $lan->vlan_id,
            'description' => $lan->description ?? "Topologie du LAN {$lan->name}",
            'nodes' => $nodes,
            'links' => $links,
        ];
    }

    /**
     * Retourne l'icône SVG correspondant au type d'équipement.
     */
    protected function getEquipementIcon(?string $type, ?string $name = null): string
    {
        $type = strtolower((string) $type);
        $name = strtolower((string) $name);

        // Switch Core / Nexus
        if (str_contains($name, 'core') || str_contains($name, 'nexus')) {
            return '/icons/switch-core.svg';
        }

        // Switch Distribution
        if (str_contains($name, 'dist') || str_contains($type, 'distribution')) {
            return '/icons/switch-distribution.svg';
        }

        // Routeur / WAN
        if (str_contains($type, 'router') || str_contains($name, 'routeur') || str_contains($name, 'wan')) {
            return '/icons/device-router.svg';
        }

        // Firewall
        if (str_contains($type, 'firewall') || str_contains($name, 'firewall')) {
            return '/icons/device-firewall.svg';
        }

        // Serveur
        if (str_contains($type, 'server') || str_contains($type, 'serveur') ||
            str_contains($name, 'server') || str_contains($name, 'serveur')) {
            return '/icons/device-server.svg';
        }

        // Switch SAN / FC (avant stockage pour éviter confusion avec "san" dans le nom)
        if (str_contains($name, 'sw-san') || str_contains($name, 'switch san') ||
            (str_contains($type, 'switch') && str_contains($name, 'san'))) {
            return '/icons/switch-san.svg';
        }

        // Stockage / SAN / NAS
        if (str_contains($type, 'storage') || str_contains($type, 'stockage') ||
            str_contains($name, 'baie') || str_contains($name, 'netapp') ||
            (str_contains($name, 'san') && !str_contains($type, 'switch'))) {
            return '/icons/device-storage.svg';
        }

        // Point d'accès WiFi
        if (str_contains($type, 'access_point') || str_contains($type, 'ap') || str_contains($type, 'wifi') ||
            str_contains($name, 'wifi') || str_contains($name, 'ap-') || str_contains($name, 'point')) {
            return '/icons/device-wifi.svg';
        }

        // Switch générique (access, lab, admin, etc.)
        if (str_contains($type, 'switch') || str_contains($name, 'switch') || str_contains($name, 'sw-')) {
            return '/icons/switch-access.svg';
        }

        // Défaut
        return '/icons/device-generic.svg';
    }

    /**
     * Mappe le champ "type" de l'équipement vers un rôle de nœud logique.
     */
    protected function mapEquipementTypeToRole(?string $type, ?string $name = null): string
    {
        $type = strtolower((string) $type);
        $name = strtolower((string) $name);

        // Core : switch/routeur principal, core
        if (str_contains($type, 'core') || str_contains($name, 'core') || str_contains($name, 'nexus')) {
            return 'core';
        }

        // Distribution : switch de distribution, routeur WAN
        if (str_contains($type, 'dist') || str_contains($type, 'distribution') ||
            str_contains($name, 'dist') || str_contains($type, 'router') ||
            str_contains($name, 'routeur') || str_contains($name, 'wan')) {
            return 'distribution';
        }

        // Endpoint : serveurs, points d'accès WiFi, stockage, équipements finaux
        if (str_contains($type, 'server') || str_contains($type, 'serveur') ||
            str_contains($type, 'ap') || str_contains($type, 'wifi') ||
            str_contains($type, 'storage') || str_contains($type, 'stockage') ||
            str_contains($name, 'serveur') || str_contains($name, 'server') ||
            str_contains($name, 'baie') || str_contains($name, 'wifi') ||
            str_contains($name, 'point') || str_contains($type, 'endpoint') ||
            str_contains($name, 'netapp')) {
            return 'endpoint';
        }

        // Access : switch d'accès, firewall, switch SAN
        if (str_contains($type, 'switch') || str_contains($type, 'firewall') ||
            str_contains($name, 'switch') || str_contains($name, 'firewall')) {
            return 'access';
        }

        return 'access';
    }

    /**
     * Mappe le statut métier vers un statut de topologie.
     */
    protected function mapStatusToLanStatus(?string $status): string
    {
        return match ($status) {
            'active' => 'up',
            'inactive' => 'down',
            'maintenance' => 'maintenance',
            default => 'warn',
        };
    }

    /**
     * Mappe le champ "media" de la liaison vers un type de lien logique.
     */
    protected function mapMediaToLinkType(?string $media): string
    {
        $media = strtolower((string) $media);

        if (str_contains($media, 'fiber') || str_contains($media, 'fibre')) {
            return 'fiber';
        }

        if (str_contains($media, 'cuivre') || str_contains($media, 'copper') || str_contains($media, 'rj45')) {
            return 'copper';
        }

        return 'wireless';
    }

    /**
     * Construit une topologie selon les filtres bâtiment et/ou salle.
     */
    protected function buildTopologyByFilters(?int $batimentId = null, ?int $salleId = null): array
    {
        // Récupérer les équipements selon les filtres
        $query = Equipement::with(['coffret', 'batiment', 'salle', 'ports']);

        if ($batimentId) {
            $query->where('batiment_id', $batimentId);
        }

        if ($salleId) {
            $query->where('salle_id', $salleId);
        }

        $equipements = $query->get();

        // Récupérer tous les ports de ces équipements
        $portIds = [];
        foreach ($equipements as $equipement) {
            foreach ($equipement->ports as $port) {
                $portIds[] = $port->id;
            }
        }

        // Récupérer les liaisons qui utilisent ces ports
        $liaisons = Liaison::with(['fromPort.equipement', 'toPort.equipement'])
            ->where(function ($query) use ($portIds) {
                $query->whereIn('from', $portIds)
                      ->orWhereIn('to', $portIds);
            })
            ->get();

        // Construction des nœuds (équipements)
        $nodes = [];
        $index = 0;

        foreach ($equipements as $equipement) {
            $coffret = $equipement->coffret;
            $batiment = $equipement->batiment;
            $salle = $equipement->salle;

            $role = $this->mapEquipementTypeToRole($equipement->type, $equipement->name);
            $status = $this->mapStatusToLanStatus($equipement->status);

            // Position auto en grille
            $row = intdiv($index, 5);
            $col = $index % 5;

            $site = $salle?->nom ?? $batiment?->nom ?? $coffret?->piece ?? 'Inconnu';

            // Récupérer les ports de l'équipement
            $ports = $equipement->ports->map(function ($port) {
                return [
                    'id' => (string) $port->id,
                    'label' => $port->port_label,
                    'device_name' => $port->device_name,
                    'vlan' => $port->vlan,
                    'speed' => $port->speed,
                    'poe_enabled' => $port->poe_enabled,
                ];
            })->toArray();

            $nodes[] = [
                'id' => (string) $equipement->id,
                'name' => $equipement->name,
                'role' => $role,
                'status' => $status,
                'position' => [
                    'x' => 10 + $col * 20,
                    'y' => 10 + $row * 20,
                ],
                'site' => $site,
                'ip' => $equipement->ip_address ?? '',
                'model' => $equipement->type ?? '',
                'notes' => $equipement->description,
                'icon' => $this->getEquipementIcon($equipement->type, $equipement->name),
                'ports' => $ports,
            ];

            $index++;
        }

        // Construction des liens (liaisons)
        $links = [];
        $equipementIds = $equipements->pluck('id')->toArray();

        foreach ($liaisons as $liaison) {
            $fromPort = $liaison->fromPort;
            $toPort = $liaison->toPort;

            if (!$fromPort || !$toPort) {
                continue;
            }

            $fromEquipement = $fromPort->equipement;
            $toEquipement = $toPort->equipement;

            if (!$fromEquipement || !$toEquipement) {
                continue;
            }

            if (!in_array($fromEquipement->id, $equipementIds) || !in_array($toEquipement->id, $equipementIds)) {
                continue;
            }

            // Déterminer la bande passante depuis la vitesse du port
            $bandwidth = $fromPort->speed ?? $toPort->speed ?? ($liaison->length ? $liaison->length . ' m' : 'N/A');

            $links[] = [
                'id' => (string) $liaison->id,
                'from' => (string) $fromEquipement->id,
                'to' => (string) $toEquipement->id,
                'type' => $this->mapMediaToLinkType($liaison->media),
                'vlan' => $fromPort->vlan ?? $toPort->vlan ?? '',
                'status' => $liaison->status ? 'up' : 'down',
                'bandwidth' => $bandwidth,
                'fromPort' => $fromPort->port_label,
                'toPort' => $toPort->port_label,
            ];
        }

        // Déterminer le nom de la topologie
        $name = 'Cartographie réseau';
        if ($batimentId && $salleId) {
            $salle = Salle::with('batiment')->find($salleId);
            $name = $salle ? "{$salle->batiment->nom} - {$salle->nom}" : $name;
        } elseif ($batimentId) {
            $batiment = Batiment::find($batimentId);
            $name = $batiment ? $batiment->nom : $name;
        }

        return [
            'id' => 'filtered',
            'name' => $name,
            'subnet' => null,
            'vlan' => null,
            'description' => "Topologie filtrée par " . ($batimentId ? "bâtiment" : "") . ($salleId ? " salle" : ""),
            'nodes' => $nodes,
            'links' => $links,
        ];
    }
}


