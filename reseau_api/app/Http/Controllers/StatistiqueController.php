<?php

namespace App\Http\Controllers;

use App\Models\Coffret;
use App\Models\Equipement;
use App\Models\Port;
use App\Models\Metric;
use App\Models\Liaison;
use App\Models\System;
use App\Models\Modification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StatistiqueController extends Controller
{
    /**
     * Obtenir les statistiques générales pour toutes les entités.
     */
    public function globalStats()
    {
        return response()->json([
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
        ]);
    }

    /**
     * Obtenir les statistiques des systèmes par type.
     */
    public function systemsByType()
    {
        $systemsByType = System::select('type', DB::raw('count(*) as total'))
            ->groupBy('type')
            ->get();

        return response()->json($systemsByType);
    }

    /**
     * Obtenir les statistiques des équipements par coffret.
     */
    public function equipementsByCoffret()
    {
        $equipementsByCoffret = Equipement::select('coffret_id', DB::raw('count(*) as total'))
            ->groupBy('coffret_id')
            ->with('coffret:id,name') // Charger les noms des coffrets
            ->get();

        return response()->json($equipementsByCoffret);
    }

    /**
     * Obtenir les statistiques des ports par VLAN.
     */
    public function portsByVlan()
    {
        $portsByVlan = Port::select('vlan', DB::raw('count(*) as total'))
            ->groupBy('vlan')
            ->get();

        return response()->json($portsByVlan);
    }

    /**
     * Obtenir les statistiques des demandes de modification.
     */
    public function modificationsStats()
    {
        $total = Modification::count();
        $enAttente = Modification::where('statut', 'en_attente')->count();
        $enRevision = Modification::where('statut', 'en_revision')->count();
        $approuvee = Modification::where('statut', 'approuvee')->count();
        $rejetee = Modification::where('statut', 'rejetee')->count();
        $enCours = $enAttente + $enRevision;

        return response()->json([
            'total' => $total,
            'en_cours' => $enCours,
            'en_attente' => $enAttente,
            'en_revision' => $enRevision,
            'approuvee' => $approuvee,
            'rejetee' => $rejetee,
        ]);
    }
}