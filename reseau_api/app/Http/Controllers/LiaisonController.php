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
        $query = Liaison::query();

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

        $liaisons = $query->with(['fromPort.equipement', 'toPort.equipement'])->orderBy('label')->paginate($perPage);

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
            'from' => 'required|exists:ports,id',
            'to' => 'required|exists:ports,id',
            'label' => 'required|string|max:255',
            'media' => 'required|string|max:255',
            'length' => 'nullable|integer',
            'status' => 'required|boolean',
        ]);

        $liaison = Liaison::create($request->all());

        return response()->json([
            'message' => 'Liaison créée avec succès.',
            'data' => $liaison->load(['fromPort.equipement', 'toPort.equipement']),
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Liaison $liaison)
    {
        $liaison->load(['fromPort.equipement', 'toPort.equipement']);
        return response()->json([
            'data' => $liaison
        ]);
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
            'from' => 'sometimes|exists:ports,id',
            'to' => 'sometimes|exists:ports,id',
            'label' => 'sometimes|string|max:255',
            'media' => 'sometimes|string|max:255',
            'length' => 'nullable|integer',
            'status' => 'sometimes|boolean',
        ]);

        $liaison->update($request->all());

        return response()->json([
            'message' => 'Liaison mise à jour avec succès.',
            'data' => $liaison->load(['fromPort.equipement', 'toPort.equipement']),
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
