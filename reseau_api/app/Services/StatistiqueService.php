<?php

namespace App\Services;

use App\Models\Coffret;
use App\Models\Equipement;
use App\Models\Liaison;
use App\Models\Metric;
use App\Models\Modification;
use App\Models\Port;
use App\Models\System;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class StatistiqueService
{
    private const CACHE_TTL = 600; // 10 minutes

    /**
     * Get global statistics for all major entities.
     */
    public function globalStats(): array
    {
        return Cache::remember('stats.global', self::CACHE_TTL, function () {
            return [
                'coffrets' => [
                    'total' => Coffret::count(),
                    'active' => Coffret::where('status', 'active')->count(),
                    'inactive' => Coffret::where('status', 'inactive')->count(),
                ],
                'equipements' => [
                    'total' => Equipement::count(),
                    'active' => Equipement::where('status', 'active')->count(),
                    'inactive' => Equipement::where('status', 'inactive')->count(),
                ],
                'ports' => [
                    'total' => Port::count(),
                    'poe_enabled' => Port::where('poe_enabled', true)->count(),
                ],
                'metrics' => [
                    'total' => Metric::count(),
                    'active' => Metric::where('status', true)->count(),
                    'inactive' => Metric::where('status', false)->count(),
                ],
                'liaisons' => [
                    'total' => Liaison::count(),
                    'active' => Liaison::where('status', true)->count(),
                    'inactive' => Liaison::where('status', false)->count(),
                ],
                'systems' => [
                    'total' => System::count(),
                    'active' => System::where('status', true)->count(),
                    'inactive' => System::where('status', false)->count(),
                ],
            ];
        });
    }

    /**
     * Get systems grouped by type with count.
     */
    public function systemsByType(): Collection
    {
        return Cache::remember('stats.systems_by_type', self::CACHE_TTL, function () {
            return System::select('type', DB::raw('count(*) as total'))
                ->groupBy('type')
                ->get();
        });
    }

    /**
     * Get equipements grouped by coffret with eager-loaded coffret name.
     */
    public function equipementsByCoffret(): Collection
    {
        return Cache::remember('stats.equipements_by_coffret', self::CACHE_TTL, function () {
            return Equipement::select('coffret_id', DB::raw('count(*) as total'))
                ->groupBy('coffret_id')
                ->with('coffret:id,name')
                ->get();
        });
    }

    /**
     * Get ports grouped by VLAN with count.
     */
    public function portsByVlan(): Collection
    {
        return Cache::remember('stats.ports_by_vlan', self::CACHE_TTL, function () {
            return Port::select('vlan', DB::raw('count(*) as total'))
                ->groupBy('vlan')
                ->get();
        });
    }

    /**
     * Get modification request statistics by status.
     */
    public function modificationsStats(): array
    {
        return Cache::remember('stats.modifications', 300, function () {
            $total = Modification::count();
            $enAttente = Modification::where('statut', 'en_attente')->count();
            $enRevision = Modification::where('statut', 'en_revision')->count();
            $approuvee = Modification::where('statut', 'approuvee')->count();
            $rejetee = Modification::where('statut', 'rejetee')->count();
            $enCours = $enAttente + $enRevision;

            return [
                'total' => $total,
                'en_cours' => $enCours,
                'en_attente' => $enAttente,
                'en_revision' => $enRevision,
                'approuvee' => $approuvee,
                'rejetee' => $rejetee,
            ];
        });
    }

    /**
     * Invalidate all statistics caches.
     */
    public static function clearCache(): void
    {
        Cache::forget('stats.global');
        Cache::forget('stats.systems_by_type');
        Cache::forget('stats.equipements_by_coffret');
        Cache::forget('stats.ports_by_vlan');
        Cache::forget('stats.modifications');
    }
}
