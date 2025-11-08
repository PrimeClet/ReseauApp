<?php

namespace App\Http\Controllers;

use App\Models\Port;
use Illuminate\Http\Request;

class PortController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        if (!auth()->user()->isAdministrator()) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }
        $query = Port::all();

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
            'port_label' => 'required|string|max:255',
            'device_name' => 'required|string|max:255',
            'poe_enabled' => 'required|boolean',
            'vlan' => 'nullable|string|max:255',
            'speed' => 'nullable|string|max:255',
            'connected_equipment_id' => 'nullable|exists:equipements,id',
        ]);

        $port = Port::create($request->all());

        return response()->json([
            'message' => 'Port créé avec succès.',
            'port' => $port,
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Port $port)
    {
        return response()->json($port);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Port $port)
    {
        if (!auth()->user()->isAdministrator()) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }
        
        $request->validate([
            'port_label' => 'sometimes|string|max:255',
            'device_name' => 'sometimes|string|max:255',
            'poe_enabled' => 'sometimes|boolean',
            'vlan' => 'nullable|string|max:255',
            'speed' => 'nullable|string|max:255',
            'connected_equipment_id' => 'nullable|exists:equipements,id',
        ]);

        $port->update($request->all());

        return response()->json([
            'message' => 'Port mis à jour avec succès.',
            'port' => $port,
        ], 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Port $port)
    {
        $port->delete();

        return response()->json([
            'message' => 'Port supprimé avec succès.',
        ], 200);
    }
}
