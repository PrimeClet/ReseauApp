<?php

namespace App\Http\Controllers;

use App\Models\Equipement;
use App\Models\Equipements;
use Illuminate\Http\Request;

class EquipementsController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Equipement::all();

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%");
            });
        }

        $equipement = $query->orderBy('name')->paginate(15);

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
            'equipement_code' => 'required|string|max:255|unique',
            'name' => 'required|string|max:255',
            'type' => 'required|string|max:255',
            'description' => 'nullable|string',
            'direction_in_out' => 'nullable|string',
            'vlan' => 'nullable|string',
            'ip_address' => 'nullable|ip',
            'coffret_id' => 'required|exists:coffrets,id',
            'status' => 'required|in:active,inactive,maintenance',
        ]);

        $equipement = Equipement::create($request->all());

        return response()->json([
            'message' => 'Équipement créé avec succès.',
            'equipement' => $equipement,
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Equipement $equipement)
    {
        return response()->json($equipement->load('coffret', 'ports'));
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
            'equipement_code' => 'sometimes|string|max:255|unique',
            'name' => 'sometimes|string|max:255',
            'type' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'direction_in_out' => 'nullable|string',
            'vlan' => 'nullable|string',
            'ip_address' => 'nullable|ip',
            'coffret_id' => 'sometimes|exists:coffrets,id',
            'status' => 'sometimes|in:active,inactive,maintenance',
        ]);

        $equipement->update($request->all());

        return response()->json([
            'message' => 'Équipement mis à jour avec succès.',
            'equipement' => $equipement,
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
