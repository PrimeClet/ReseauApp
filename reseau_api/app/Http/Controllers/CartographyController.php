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
                'name' => $lan->nom,
                'subnet' => $lan->sous_reseau,
                'vlan' => $lan->vlan,
                'description' => $lan->description ?? "Topologie du LAN {$lan->nom}",
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
        // Un équipement est associé si :
        // 1. Il est dans le même bâtiment et la même salle que le LAN
        // 2. OU son VLAN correspond au VLAN du LAN
        $equipements = Equipement::with(['coffret', 'batiment', 'salle', 'ports'])
            ->where(function ($query) use ($lan) {
                // Équipements dans le même bâtiment et salle
                if ($lan->batiment_id && $lan->salle_id) {
                    $query->where(function ($q) use ($lan) {
                        $q->where('batiment_id', $lan->batiment_id)
                          ->where('salle_id', $lan->salle_id);
                    });
                }
                // OU équipements avec le même VLAN (si le LAN a un VLAN)
                if ($lan->vlan) {
                    $query->orWhere('vlan', $lan->vlan);
                }
                // Si aucun critère n'est rempli, retourner tous les équipements (pour une vue globale)
                if (!$lan->batiment_id && !$lan->salle_id && !$lan->vlan) {
                    $query->orWhereRaw('1 = 1'); // Toujours vrai
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

            $role = $this->mapEquipementTypeToRole($equipement->type);
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
                'icon' => '/placeholder.svg',
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
                'vlan' => $fromPort->vlan ?? $toPort->vlan ?? $lan->vlan ?? '',
                'status' => $liaison->status ? 'up' : 'down',
                'bandwidth' => $bandwidth,
                'fromPort' => $fromPort->port_label,
                'toPort' => $toPort->port_label,
            ];
        }

        return [
            'id' => (string) $lan->id,
            'name' => $lan->nom,
            'subnet' => $lan->sous_reseau,
            'vlan' => $lan->vlan,
            'description' => $lan->description ?? "Topologie du LAN {$lan->nom}",
            'nodes' => $nodes,
            'links' => $links,
        ];
    }

    /**
     * Mappe le champ "type" de l’équipement vers un rôle de nœud logique.
     */
    protected function mapEquipementTypeToRole(?string $type): string
    {
        $type = strtolower((string) $type);

        if (str_contains($type, 'core')) {
            return 'core';
        }

        if (str_contains($type, 'dist') || str_contains($type, 'distribution')) {
            return 'distribution';
        }

        if (str_contains($type, 'ap') || str_contains($type, 'wifi') || str_contains($type, 'endpoint')) {
            return 'endpoint';
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

            $role = $this->mapEquipementTypeToRole($equipement->type);
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
                'icon' => '/placeholder.svg',
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


