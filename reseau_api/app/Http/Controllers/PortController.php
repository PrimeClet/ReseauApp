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
        $query = Port::query();

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('port_label', 'like', "%{$search}%")
                  ->orWhere('device_name', 'like', "%{$search}%");
            });
        }

        $perPage = (int) $request->get('per_page', 15);
        $perPage = $perPage > 0 && $perPage <= 100 ? $perPage : 15;

        try {
            $ports = $query->with(['equipement', 'connectedEquipment'])
                ->orderBy('device_name')
                ->paginate($perPage);
            
            return response()->json($ports);
        } catch (\Exception $e) {
            \Log::error('Error in PortController@index: ' . $e->getMessage());
            \Log::error('File: ' . $e->getFile() . ' Line: ' . $e->getLine());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            
            // Essayer sans relations pour voir si c'est le problème
            try {
                $ports = $query->orderBy('device_name')->paginate($perPage);
                return response()->json($ports);
            } catch (\Exception $e2) {
                return response()->json([
                    'message' => 'Erreur lors de la récupération des ports',
                    'error' => $e->getMessage(),
                    'error2' => $e2->getMessage(),
                    'file' => $e->getFile(),
                    'line' => $e->getLine()
                ], 500);
            }
        }
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
            'type_reseau' => 'nullable|in:IT,OT',
            'statut' => 'nullable|in:actif,inactif,reserve',
            'connexion_type' => 'nullable|in:fibre,cuivre',
            'uplink' => 'nullable|string|max:255',
            'downlink' => 'nullable|string|max:255',
            'equipement_id' => 'required|exists:equipements,id',
            'connected_equipment_id' => 'nullable|exists:equipements,id',
        ]);

        $portData = $request->all();
        // S'assurer que poe_enabled est un booléen
        if (isset($portData['poe_enabled'])) {
            $portData['poe_enabled'] = filter_var($portData['poe_enabled'], FILTER_VALIDATE_BOOLEAN);
        }
        
        // S'assurer que connected_equipment_id est null si non fourni
        if (!isset($portData['connected_equipment_id']) || $portData['connected_equipment_id'] === '') {
            $portData['connected_equipment_id'] = null;
        }

        $port = Port::create($portData);

        return response()->json([
            'message' => 'Port créé avec succès.',
            'data' => $port->load('equipement', 'connectedEquipment'),
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Port $port)
    {
        return response()->json([
            'data' => $port->load('equipement', 'connectedEquipment')
        ]);
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
            'type_reseau' => 'sometimes|in:IT,OT|nullable',
            'statut' => 'sometimes|in:actif,inactif,reserve|nullable',
            'connexion_type' => 'sometimes|in:fibre,cuivre|nullable',
            'uplink' => 'sometimes|string|max:255|nullable',
            'downlink' => 'sometimes|string|max:255|nullable',
            'equipement_id' => 'sometimes|exists:equipements,id',
            'connected_equipment_id' => 'nullable|exists:equipements,id',
        ]);

        $port->update($request->all());

        return response()->json([
            'message' => 'Port mis à jour avec succès.',
            'data' => $port->load('equipement', 'connectedEquipment'),
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
