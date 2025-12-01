<?php

namespace App\Http\Controllers;

use App\Models\Coffret;
use App\Models\Equipement;
use App\Models\Liaison;
use Illuminate\Http\JsonResponse;

class CartographyController extends Controller
{
    /**
     * Retourne la liste des topologies LAN disponibles.
     * Pour l'instant, on expose une seule topologie globale.
     */
    public function index(): JsonResponse
    {
        return response()->json([
            [
                'id' => 'lan-global',
                'name' => 'Topologie globale LAN',
                'subnet' => null,
                'vlan' => null,
                'description' => 'Vue globale générée automatiquement à partir des équipements et liaisons.',
            ],
        ]);
    }

    /**
     * Retourne le détail d'une topologie LAN.
     * Actuellement, seul l’identifiant "lan-global" est supporté.
     */
    public function show(string $id): JsonResponse
    {
        if ($id !== 'lan-global') {
            return response()->json([
                'message' => 'Topologie introuvable',
            ], 404);
        }

        $topology = $this->buildGlobalTopology();

        return response()->json($topology);
    }

    /**
     * Construit une topologie globale "nodes/links" basée sur
     * les équipements, coffrets et liaisons présents en base.
     *
     * Le format est aligné sur ce qu’attend la page LanCartography côté front.
     */
    protected function buildGlobalTopology(): array
    {
        $equipements = Equipement::with('coffret')->get();
        $liaisons = Liaison::all();

        // Construction des nœuds
        $nodes = [];
        $index = 0;

        foreach ($equipements as $equipement) {
            /** @var Equipement $equipement */
            $coffret = $equipement->coffret instanceof Coffret ? $equipement->coffret : null;

            $role = $this->mapEquipementTypeToRole($equipement->type);
            $status = $this->mapStatusToLanStatus($equipement->status);

            // Position "auto" très simple : en grille
            $row = intdiv($index, 5);
            $col = $index % 5;
            $nodes[] = [
                'id' => (string) $equipement->id,
                'name' => $equipement->name,
                'role' => $role,
                'status' => $status,
                'position' => [
                    'x' => 10 + $col * 20,
                    'y' => 10 + $row * 20,
                ],
                'site' => $coffret?->piece ?? 'Inconnu',
                'ip' => $equipement->ip_address,
                'model' => $equipement->type,
                'notes' => null,
                'icon' => '/placeholder.svg',
            ];

            $index++;
        }

        // Construction des liens
        $links = [];

        foreach ($liaisons as $liaison) {
            /** @var Liaison $liaison */

            // On ne garde que les liaisons avec un from/to renseignés
            if (!$liaison->from || !$liaison->to) {
                continue;
            }

            $links[] = [
                'id' => (string) $liaison->id,
                'from' => (string) $liaison->from,
                'to' => (string) $liaison->to,
                'type' => $this->mapMediaToLinkType($liaison->media),
                'vlan' => '', // à enrichir si besoin (ex: depuis les équipements connectés)
                'status' => $liaison->status ? 'up' : 'down',
                'bandwidth' => $liaison->length ? $liaison->length . ' m' : 'N/A',
                'fromPort' => null,
                'toPort' => null,
            ];
        }

        return [
            'id' => 'lan-global',
            'name' => 'Topologie globale LAN',
            'subnet' => null,
            'vlan' => null,
            'description' => 'Vue globale générée automatiquement à partir des équipements et liaisons.',
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
}


