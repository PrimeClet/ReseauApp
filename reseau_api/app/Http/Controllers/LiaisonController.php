<?php

namespace App\Http\Controllers;

use App\Models\Liaison;
use Illuminate\Http\Request;

class LiaisonController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Liaison::all();

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%");
            });
        }

        $liaisons = $query->orderBy('name')->paginate(15);

        return response()->json($liaisons);
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
            'from' => 'required|exists:equipements,id',
            'to' => 'required|exists:equipements,id',
            'label' => 'required|string|max:255',
            'media' => 'required|string|max:255',
            'length' => 'nullable|integer',
            'status' => 'required|boolean',
        ]);

        $liaison = Liaison::create($request->all());

        return response()->json([
            'message' => 'Liaison créée avec succès.',
            'liaison' => $liaison,
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Liaison $liaison)
    {
        $liaison->load(['fromEquipement', 'toEquipement']);
        return response()->json($liaison);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Liaison $liaison)
    {
        if (!auth()->user()->isAdministrator()) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $request->validate([
            'from' => 'sometimes|exists:equipements,id',
            'to' => 'sometimes|exists:equipements,id',
            'label' => 'sometimes|string|max:255',
            'media' => 'sometimes|string|max:255',
            'length' => 'nullable|integer',
            'status' => 'sometimes|boolean',
        ]);

        $liaison->update($request->all());

        return response()->json([
            'message' => 'Liaison mise à jour avec succès.',
            'liaison' => $liaison,
        ], 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Liaison $liaison)
    {
        if (!auth()->user()->isAdministrator()) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $liaison->delete();

        return response()->json([
            'message' => 'Liaison supprimée avec succès.',
        ], 200);
    }
}
