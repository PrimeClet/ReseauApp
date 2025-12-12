<?php

namespace App\Http\Controllers;

use App\Models\Batiment;
use Illuminate\Http\Request;

class BatimentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Batiment::query();

        if ($request->has('etat')) {
            $query->where('etat', $request->etat);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nom', 'like', "%{$search}%")
                  ->orWhere('adresse', 'like', "%{$search}%")
                  ->orWhere('ville', 'like', "%{$search}%");
            });
        }

        $perPage = (int) $request->get('per_page', 15);
        $perPage = $perPage > 0 && $perPage <= 100 ? $perPage : 15;

        $batiments = $query->orderBy('nom')->paginate($perPage);

        return response()->json($batiments);
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
            'adresse' => 'required|string|max:255',
            'ville' => 'required|string|max:255',
            'code_postal' => 'required|string|max:10',
            'etat' => 'required|in:Actif,Inactif,Maintenance',
            'description' => 'nullable|string',
        ]);

        $batiment = Batiment::create($request->all());

        return response()->json([
            'message' => 'Bâtiment créé avec succès.',
            'data' => $batiment,
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Batiment $batiment)
    {
        // Compter le nombre de salles si la relation existe
        // $batiment->loadCount('salles');
        
        return response()->json([
            'data' => $batiment,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Batiment $batiment)
    {
        if (!auth()->user()->isAdministrator()) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }
        
        $request->validate([
            'nom' => 'sometimes|string|max:255',
            'adresse' => 'sometimes|string|max:255',
            'ville' => 'sometimes|string|max:255',
            'code_postal' => 'sometimes|string|max:10',
            'etat' => 'sometimes|in:Actif,Inactif,Maintenance',
            'description' => 'nullable|string',
        ]);

        $batiment->update($request->all());

        return response()->json([
            'message' => 'Bâtiment mis à jour avec succès.',
            'data' => $batiment,
        ], 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Batiment $batiment)
    {
        if (!auth()->user()->isAdministrator()) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $batiment->delete();

        return response()->json([
            'message' => 'Bâtiment supprimé avec succès.',
        ], 200);
    }
}

