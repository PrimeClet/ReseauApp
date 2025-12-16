<?php

namespace App\Http\Controllers;

use App\Models\Maintenance;
use Illuminate\Http\Request;

class MaintenanceController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Maintenance::query();

        if ($request->has('statut')) {
            $query->where('statut', $request->statut);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('type', 'like', "%{$search}%")
                  ->orWhere('technicien', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $perPage = (int) $request->get('per_page', 15);
        $perPage = $perPage > 0 && $perPage <= 100 ? $perPage : 15;

        $maintenances = $query->with('equipement')->orderBy('date_debut', 'desc')->paginate($perPage);

        return response()->json($maintenances);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        if (!auth()->user()->isAdministrator()) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $request->validate([
            'equipement_id' => 'nullable|exists:equipements,id',
            'type' => 'required|string|max:255',
            'date_debut' => 'required|date',
            'heure_debut' => 'required|date_format:H:i',
            'duree' => 'required|string|max:255',
            'technicien' => 'required|string|max:255',
            'priorite' => 'required|in:basse,moyenne,haute,critique',
            'description' => 'required|string',
            'statut' => 'sometimes|in:planifiee,en_cours,terminee,annulee',
        ]);

        try {
            $data = $request->all();
            
            // S'assurer que le statut est défini
            if (!isset($data['statut']) || empty($data['statut'])) {
                $data['statut'] = 'planifiee';
            }
            
            // S'assurer que equipement_id est null si non fourni ou vide
            if (!isset($data['equipement_id']) || $data['equipement_id'] === '' || $data['equipement_id'] === 0) {
                $data['equipement_id'] = null;
            }
            
            // S'assurer que l'heure est au bon format (H:i)
            if (isset($data['heure_debut']) && strlen($data['heure_debut']) > 5) {
                $data['heure_debut'] = substr($data['heure_debut'], 0, 5);
            }
            
            \Log::info('Creating maintenance with data: ' . json_encode($data));
            
            $maintenance = Maintenance::create($data);
        } catch (\Exception $e) {
            \Log::error('Error creating maintenance: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            \Log::error('Request data: ' . json_encode($request->all()));
            return response()->json([
                'message' => 'Erreur lors de la création de la maintenance',
                'error' => $e->getMessage()
            ], 500);
        }

        return response()->json([
            'message' => 'Maintenance créée avec succès.',
            'data' => $maintenance->load('equipement'),
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Maintenance $maintenance)
    {
        return response()->json([
            'data' => $maintenance->load('equipement')
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Maintenance $maintenance)
    {
        if (!auth()->user()->isAdministrator()) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $request->validate([
            'equipement_id' => 'nullable|exists:equipements,id',
            'type' => 'sometimes|string|max:255',
            'date_debut' => 'sometimes|date',
            'heure_debut' => 'sometimes|date_format:H:i',
            'duree' => 'sometimes|string|max:255',
            'technicien' => 'sometimes|string|max:255',
            'priorite' => 'sometimes|in:basse,moyenne,haute,critique',
            'description' => 'sometimes|string',
            'statut' => 'sometimes|in:planifiee,en_cours,terminee,annulee',
        ]);

        $maintenance->update($request->all());

        return response()->json([
            'message' => 'Maintenance mise à jour avec succès.',
            'data' => $maintenance->load('equipement'),
        ], 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Maintenance $maintenance)
    {
        if (!auth()->user()->isAdministrator()) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $maintenance->delete();

        return response()->json([
            'message' => 'Maintenance supprimée avec succès.',
        ], 200);
    }
}
