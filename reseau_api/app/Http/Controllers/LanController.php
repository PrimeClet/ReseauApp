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

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('subnet', 'like', "%{$search}%")
                  ->orWhere('vlan_id', 'like', "%{$search}%")
                  ->orWhere('site', 'like', "%{$search}%");
            });
        }

        $perPage = (int) $request->get('per_page', 15);
        $perPage = $perPage > 0 && $perPage <= 100 ? $perPage : 15;

        $lans = $query->with('batiment', 'salle')->orderBy('name')->paginate($perPage);

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
            'name' => 'required|string|max:255',
            'subnet' => 'required|string|max:255',
            'vlan_id' => 'required|integer',
            'site' => 'required|string|max:255',
            'status' => 'required|in:active,inactive,maintenance',
            'description' => 'nullable|string',
            'gateway' => 'nullable|string|max:255',
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
            'name' => 'sometimes|string|max:255',
            'subnet' => 'sometimes|string|max:255',
            'vlan_id' => 'sometimes|integer',
            'site' => 'sometimes|string|max:255',
            'status' => 'sometimes|in:active,inactive,maintenance',
            'description' => 'nullable|string',
            'gateway' => 'nullable|string|max:255',
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
