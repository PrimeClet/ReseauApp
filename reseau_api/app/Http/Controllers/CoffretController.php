<?php

namespace App\Http\Controllers;

use App\Models\Coffret;
use Illuminate\Http\Request;

class CoffretController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Coffret::with('equipments', 'metrics')->get();

         // Filtrage par statut et recherche par nom

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%");
            });
        }

        $zone = $query->orderBy('name')->paginate(15);

        return response()->json($zone);
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
            'name' => 'required|string|max:255',
            'piece' => 'required|string',
            'long' => 'required|numeric',
            'lat' => 'required|numeric',
            'status' => 'sometimes|in:active,inactive,maintenance',
        ]);

        $coffret = Coffret::create([
            'name' => $request->name,
            'piece' => $request->piece,
            'long' => $request->long,
            'lat' => $request->lat,
            'status' => $request->status ?? 'active', // Valeur par défaut si non fournie
        ]);
    
        // Retourner une réponse JSON
        return response()->json([
            'message' => 'Coffret créé avec succès.',
            'coffret' => $coffret,
        ], 201);

    }

    /**
     * Display the specified resource.
     */
    public function show(Coffret $coffret)
    {
        return response()->json($coffret);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Coffret $coffret)
    {
        if (!auth()->user()->isAdministrator()) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }
        
         // Validation des données
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'piece' => 'sometimes|string',
            'long' => 'sometimes|numeric',
            'lat' => 'sometimes|numeric',
            'status' => 'sometimes|in:active,inactive,maintenance',
        ]);

        // Mise à jour des champs fournis
        $coffret->update($request->only(['name', 'piece', 'long', 'lat', 'status']));

        // Retourner une réponse JSON
        return response()->json([
            'message' => 'Coffret mis à jour avec succès.',
            'coffret' => $coffret,
        ], 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Coffret $coffret)
    {
        $coffret->delete();

        // Retourner une réponse JSON
        return response()->json([
            'message' => 'Coffret supprimé avec succès.',
        ], 200);  
    }
}
