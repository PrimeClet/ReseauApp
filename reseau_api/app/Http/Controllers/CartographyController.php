<?php

namespace App\Http\Controllers;

use App\Models\Batiment;
use App\Models\Equipement;
use App\Models\Lan;
use App\Models\Liaison;
use App\Models\Salle;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CartographyController extends Controller
{
    public function index(): JsonResponse
    {
        $lans = Lan::with('batiment', 'salle')->get();

        $topologies = $lans->map(fn ($lan) => [
            'id' => (string) $lan->id,
            'name' => $lan->name,
            'subnet' => $lan->subnet,
            'vlan' => $lan->vlan_id,
            'description' => $lan->description ?? "Topologie du LAN {$lan->name}",
            'batiment_id' => $lan->batiment_id,
            'salle_id' => $lan->salle_id,
        ]);

        return $this->successResponse($topologies);
    }

    public function getBatiments(): JsonResponse
    {
        $batiments = Batiment::all()->map(fn ($b) => ['id' => $b->id, 'nom' => $b->nom]);

        return $this->successResponse($batiments);
    }

    public function getSalles(Request $request): JsonResponse
    {
        $query = Salle::query();

        if ($request->has('batiment_id')) {
            $query->where('batiment_id', $request->batiment_id);
        }

        $salles = $query->with('batiment')->get()->map(fn ($s) => [
            'id' => $s->id,
            'nom' => $s->nom,
            'batiment_id' => $s->batiment_id,
            'batiment_nom' => $s->batiment?->nom,
        ]);

        return $this->successResponse($salles);
    }

    public function show(string $id): JsonResponse
    {
        $lan = Lan::with('batiment', 'salle')->find($id);

        if (! $lan) {
            return $this->errorResponse('LAN introuvable', 404);
        }

        return $this->successResponse($this->buildTopologyForLan($lan));
    }

    public function getTopology(Request $request): JsonResponse
    {
        $batimentId = $request->get('batiment_id') ? (int) $request->get('batiment_id') : null;
        $salleId = $request->get('salle_id') ? (int) $request->get('salle_id') : null;
        $lanId = $request->get('lan_id') ? (int) $request->get('lan_id') : null;

        if ($lanId) {
            $lan = Lan::with('batiment', 'salle')->find($lanId);

            if (! $lan) {
                return $this->errorResponse('LAN introuvable', 404);
            }

            $topology = $this->buildTopologyForLan($lan);
        } else {
            $topology = $this->buildTopologyByFilters($batimentId, $salleId);
        }

        return $this->successResponse($topology);
    }

    protected function buildTopologyForLan(Lan $lan): array
    {
        $vlanId = (string) $lan->vlan_id;

        $equipements = Equipement::with(['coffret', 'batiment', 'salle', 'ports'])
            ->where(function ($query) use ($lan, $vlanId) {
                if ($vlanId) {
                    $query->where('vlan', $vlanId);
                    if ($vlanId !== '1') {
                        $query->orWhere(function ($q) use ($lan) {
                            $q->where('vlan', '1')
                                ->where('type', 'switch')
                                ->where(function ($sub) use ($lan) {
                                    if ($lan->batiment_id) {
                                        $sub->where('batiment_id', $lan->batiment_id);
                                    }
                                });
                        });
                    }
                } else {
                    if ($lan->batiment_id && $lan->salle_id) {
                        $query->where('batiment_id', $lan->batiment_id)->where('salle_id', $lan->salle_id);
                    } elseif ($lan->batiment_id) {
                        $query->where('batiment_id', $lan->batiment_id);
                    }
                }
            })
            ->get();

        [$nodes, $links] = $this->buildNodesAndLinks($equipements);

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

    protected function buildTopologyByFilters(?int $batimentId = null, ?int $salleId = null): array
    {
        $query = Equipement::with(['coffret', 'batiment', 'salle', 'ports']);

        if ($batimentId) {
            $query->where('batiment_id', $batimentId);
        }
        if ($salleId) {
            $query->where('salle_id', $salleId);
        }

        $equipements = $query->get();

        [$nodes, $links] = $this->buildNodesAndLinks($equipements);

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
            'description' => 'Topologie filtrée',
            'nodes' => $nodes,
            'links' => $links,
        ];
    }

    private function buildNodesAndLinks($equipements): array
    {
        $portIds = [];
        foreach ($equipements as $equipement) {
            foreach ($equipement->ports as $port) {
                $portIds[] = $port->id;
            }
        }

        $liaisons = Liaison::with(['fromPort.equipement', 'toPort.equipement'])
            ->where(function ($query) use ($portIds) {
                $query->whereIn('from', $portIds)->orWhereIn('to', $portIds);
            })
            ->get();

        $nodes = [];
        $index = 0;
        $equipementIds = $equipements->pluck('id')->toArray();

        foreach ($equipements as $equipement) {
            $row = intdiv($index, 5);
            $col = $index % 5;
            $site = $equipement->salle?->nom ?? $equipement->batiment?->nom ?? $equipement->coffret?->piece ?? 'Inconnu';

            $ports = $equipement->ports->map(fn ($p) => [
                'id' => (string) $p->id,
                'label' => $p->port_label,
                'device_name' => $p->device_name,
                'vlan' => $p->vlan,
                'speed' => $p->speed,
                'poe_enabled' => $p->poe_enabled,
            ])->toArray();

            $nodes[] = [
                'id' => (string) $equipement->id,
                'name' => $equipement->name,
                'role' => $this->mapEquipementTypeToRole($equipement->type, $equipement->name),
                'status' => $this->mapStatusToLanStatus($equipement->status),
                'position' => ['x' => 10 + $col * 20, 'y' => 10 + $row * 20],
                'site' => $site,
                'ip' => $equipement->ip_address ?? '',
                'model' => $equipement->type ?? '',
                'notes' => $equipement->description,
                'icon' => $this->getEquipementIcon($equipement->type, $equipement->name),
                'ports' => $ports,
            ];

            $index++;
        }

        $links = [];
        foreach ($liaisons as $liaison) {
            $fromPort = $liaison->fromPort;
            $toPort = $liaison->toPort;

            if (! $fromPort?->equipement || ! $toPort?->equipement) {
                continue;
            }
            if (! in_array($fromPort->equipement->id, $equipementIds) || ! in_array($toPort->equipement->id, $equipementIds)) {
                continue;
            }

            $links[] = [
                'id' => (string) $liaison->id,
                'from' => (string) $fromPort->equipement->id,
                'to' => (string) $toPort->equipement->id,
                'type' => $this->mapMediaToLinkType($liaison->media),
                'vlan' => $fromPort->vlan ?? $toPort->vlan ?? '',
                'status' => $liaison->status ? 'up' : 'down',
                'bandwidth' => $fromPort->speed ?? $toPort->speed ?? 'N/A',
                'fromPort' => $fromPort->port_label,
                'toPort' => $toPort->port_label,
            ];
        }

        return [$nodes, $links];
    }

    protected function getEquipementIcon(?string $type, ?string $name = null): string
    {
        $type = strtolower((string) $type);
        $name = strtolower((string) $name);

        if (str_contains($name, 'core') || str_contains($name, 'nexus')) {
            return '/icons/switch-core.svg';
        }
        if (str_contains($name, 'dist') || str_contains($type, 'distribution')) {
            return '/icons/switch-distribution.svg';
        }
        if (str_contains($type, 'router') || str_contains($name, 'routeur')) {
            return '/icons/device-router.svg';
        }
        if (str_contains($type, 'firewall') || str_contains($name, 'firewall')) {
            return '/icons/device-firewall.svg';
        }
        if (str_contains($type, 'server') || str_contains($name, 'serveur')) {
            return '/icons/device-server.svg';
        }
        if (str_contains($type, 'switch') && str_contains($name, 'san')) {
            return '/icons/switch-san.svg';
        }
        if (str_contains($type, 'storage') || str_contains($name, 'baie')) {
            return '/icons/device-storage.svg';
        }
        if (str_contains($type, 'wifi') || str_contains($name, 'wifi') || str_contains($name, 'ap-')) {
            return '/icons/device-wifi.svg';
        }
        if (str_contains($type, 'switch') || str_contains($name, 'switch')) {
            return '/icons/switch-access.svg';
        }

        return '/icons/device-generic.svg';
    }

    protected function mapEquipementTypeToRole(?string $type, ?string $name = null): string
    {
        $type = strtolower((string) $type);
        $name = strtolower((string) $name);

        if (str_contains($type, 'core') || str_contains($name, 'core') || str_contains($name, 'nexus')) {
            return 'core';
        }
        if (str_contains($type, 'dist') || str_contains($name, 'dist') || str_contains($type, 'router')) {
            return 'distribution';
        }
        if (str_contains($type, 'server') || str_contains($type, 'wifi') || str_contains($type, 'storage')) {
            return 'endpoint';
        }

        return 'access';
    }

    protected function mapStatusToLanStatus(?string $status): string
    {
        return match ($status) {
            'active' => 'up',
            'inactive' => 'down',
            'maintenance' => 'maintenance',
            default => 'warn',
        };
    }

    protected function mapMediaToLinkType(?string $media): string
    {
        $media = strtolower((string) $media);
        if (str_contains($media, 'fibre') || str_contains($media, 'fiber')) {
            return 'fiber';
        }
        if (str_contains($media, 'cuivre') || str_contains($media, 'copper') || str_contains($media, 'rj45')) {
            return 'copper';
        }

        return 'wireless';
    }
}
