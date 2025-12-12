<?php

namespace App\Http\Controllers;

use App\Models\Lan;
use Illuminate\Http\Request;

class LanController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Lan::query();

        if ($request->has('statut')) {
            $query->where('statut', $request->statut);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nom', 'like', "%{$search}%")
                  ->orWhere('sous_reseau', 'like', "%{$search}%")
                  ->orWhere('vlan', 'like', "%{$search}%")
                  ->orWhere('site', 'like', "%{$search}%");
            });
        }

        $perPage = (int) $request->get('per_page', 15);
        $perPage = $perPage > 0 && $perPage <= 100 ? $perPage : 15;

        $lans = $query->with('batiment', 'salle')->orderBy('nom')->paginate($perPage);

        return response()->json($lans);
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
            'sous_reseau' => 'required|string|max:255',
            'vlan' => 'required|string|max:255',
            'site' => 'required|string|max:255',
            'statut' => 'required|in:Actif,Inactif,Maintenance',
            'description' => 'nullable|string',
            'batiment_id' => 'required|exists:batiments,id',
            'salle_id' => 'required|exists:salles,id',
        ]);

        $lan = Lan::create($request->all());

        return response()->json([
            'message' => 'LAN créé avec succès.',
            'data' => $lan->load('batiment', 'salle'),
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Lan $lan)
    {
        return response()->json([
            'data' => $lan->load('batiment', 'salle'),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Lan $lan)
    {
        if (!auth()->user()->isAdministrator()) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }
        
        $request->validate([
            'nom' => 'sometimes|string|max:255',
            'sous_reseau' => 'sometimes|string|max:255',
            'vlan' => 'sometimes|string|max:255',
            'site' => 'sometimes|string|max:255',
            'statut' => 'sometimes|in:Actif,Inactif,Maintenance',
            'description' => 'nullable|string',
            'batiment_id' => 'sometimes|exists:batiments,id',
            'salle_id' => 'sometimes|exists:salles,id',
        ]);

        $lan->update($request->all());

        return response()->json([
            'message' => 'LAN mis à jour avec succès.',
            'data' => $lan->load('batiment', 'salle'),
        ], 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Lan $lan)
    {
        if (!auth()->user()->isAdministrator()) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $lan->delete();

        return response()->json([
            'message' => 'LAN supprimé avec succès.',
        ], 200);
    }
}
