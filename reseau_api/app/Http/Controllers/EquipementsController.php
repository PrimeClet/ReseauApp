<?php

namespace App\Http\Controllers;

use App\Models\Equipement;
use Illuminate\Http\Request;

class EquipementsController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Equipement::query();

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%");
            });
        }

        $perPage = (int) $request->get('per_page', 15);
        $perPage = $perPage > 0 && $perPage <= 100 ? $perPage : 15;

        $equipement = $query->with('coffret.batiment', 'coffret.salle', 'batiment', 'salle', 'ports')->orderBy('name')->paginate($perPage);

        return response()->json($equipement);
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
            'equipement_code' => 'nullable|string|max:255|unique:equipements,equipement_code',
            'name' => 'required|string|max:255',
            'type' => 'required|string|max:255',
            'description' => 'nullable|string',
            'direction_in_out' => 'nullable|string',
            'vlan' => 'nullable|string',
            'ip_address' => 'nullable|ip',
            'coffret_id' => 'required|exists:coffrets,id',
            'batiment_id' => 'nullable|exists:batiments,id',
            'salle_id' => 'nullable|exists:salles,id',
            'status' => 'required|in:active,inactive,maintenance',
        ]);

        // Générer automatiquement le code équipement s'il n'est pas fourni
        $equipementCode = $request->equipement_code;
        if (empty($equipementCode)) {
            $equipementCode = $this->generateEquipementCode();
        }

        $equipementData = $request->all();
        $equipementData['equipement_code'] = $equipementCode;

        $equipement = Equipement::create($equipementData);

        return response()->json([
            'message' => 'Équipement créé avec succès.',
            'data' => $equipement,
        ], 201);
    }

    /**
     * Génère un code équipement unique au format EQ-001, EQ-002, etc.
     */
    private function generateEquipementCode(): string
    {
        // Récupérer tous les équipements avec un code au format EQ-XXX
        $equipements = Equipement::where('equipement_code', 'like', 'EQ-%')
            ->get();

        $maxNumber = 0;
        
        foreach ($equipements as $equipement) {
            // Extraire le numéro du code (après "EQ-")
            $code = $equipement->equipement_code;
            if (preg_match('/^EQ-(\d+)$/', $code, $matches)) {
                $number = (int) $matches[1];
                if ($number > $maxNumber) {
                    $maxNumber = $number;
                }
            }
        }

        // Incrémenter pour obtenir le prochain numéro
        $newNumber = $maxNumber + 1;

        // Formater avec des zéros à gauche (EQ-001, EQ-002, etc.)
        return 'EQ-' . str_pad($newNumber, 3, '0', STR_PAD_LEFT);
    }

    /**
     * Display the specified resource.
     */
    public function show(Equipement $equipement)
    {
        return response()->json([
            'data' => $equipement->load('coffret.batiment', 'coffret.salle', 'batiment', 'salle', 'ports')
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Equipement $equipement)
    {
        if (!auth()->user()->isAdministrator()) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }
        
        $request->validate([
            'equipement_code' => 'sometimes|string|max:255|unique:equipements,equipement_code,' . $equipement->id,
            'name' => 'sometimes|string|max:255',
            'type' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'direction_in_out' => 'nullable|string',
            'vlan' => 'nullable|string',
            'ip_address' => 'nullable|ip',
            'coffret_id' => 'sometimes|exists:coffrets,id',
            'batiment_id' => 'nullable|exists:batiments,id',
            'salle_id' => 'nullable|exists:salles,id',
            'status' => 'sometimes|in:active,inactive,maintenance',
        ]);

        $equipement->update($request->all());

        return response()->json([
            'message' => 'Équipement mis à jour avec succès.',
            'data' => $equipement,
        ], 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Equipement $equipement)
    {
        $equipement->delete();

        return response()->json([
            'message' => 'Équipement supprimé avec succès.',
        ], 200);
    }
}
