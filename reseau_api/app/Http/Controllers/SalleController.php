<?php

namespace App\Http\Controllers;

use App\Models\Salle;
use Illuminate\Http\Request;

class SalleController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Salle::with('batiment');

        if ($request->has('etat')) {
            $query->where('etat', $request->etat);
        }

        if ($request->has('batiment_id')) {
            $query->where('batiment_id', $request->batiment_id);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nom', 'like', "%{$search}%")
                  ->orWhere('etage', 'like', "%{$search}%")
                  ->orWhere('type', 'like', "%{$search}%");
            });
        }

        $perPage = (int) $request->get('per_page', 15);
        $perPage = $perPage > 0 && $perPage <= 100 ? $perPage : 15;

        $salles = $query->orderBy('nom')->paginate($perPage);

        return response()->json($salles);
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
            'nom' => 'required|string|max:255',
            'batiment_id' => 'required|exists:batiments,id',
            'etage' => 'required|string|max:255',
            'capacite' => 'required|integer|min:1',
            'type' => 'required|string|max:255',
            'etat' => 'required|in:Actif,Inactif,Maintenance',
            'description' => 'nullable|string',
        ]);

        $salle = Salle::create($request->all());
        $salle->load('batiment');

        return response()->json([
            'message' => 'Salle créée avec succès.',
            'data' => $salle,
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Salle $salle)
    {
        $salle->load('batiment');
        
        return response()->json([
            'data' => $salle,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Salle $salle)
    {
        if (!auth()->user()->isAdministrator()) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }
        
        $request->validate([
            'nom' => 'sometimes|string|max:255',
            'batiment_id' => 'sometimes|exists:batiments,id',
            'etage' => 'sometimes|string|max:255',
            'capacite' => 'sometimes|integer|min:1',
            'type' => 'sometimes|string|max:255',
            'etat' => 'sometimes|in:Actif,Inactif,Maintenance',
            'description' => 'nullable|string',
        ]);

        $salle->update($request->all());
        $salle->load('batiment');

        return response()->json([
            'message' => 'Salle mise à jour avec succès.',
            'data' => $salle,
        ], 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Salle $salle)
    {
        if (!auth()->user()->isAdministrator()) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $salle->delete();

        return response()->json([
            'message' => 'Salle supprimée avec succès.',
        ], 200);
    }
}

