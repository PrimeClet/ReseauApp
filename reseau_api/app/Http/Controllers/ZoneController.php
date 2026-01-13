<?php

namespace App\Http\Controllers;

use App\Models\Zone;
use Illuminate\Http\Request;

class ZoneController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Zone::with('site');

        if ($request->has('site_id')) {
            $query->where('site_id', $request->site_id);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('libelle', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $perPage = (int) $request->get('per_page', 15);
        $perPage = $perPage > 0 && $perPage <= 100 ? $perPage : 15;

        $zones = $query->orderBy('libelle')->paginate($perPage);

        return response()->json($zones);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'site_id' => 'required|exists:sites,id',
            'libelle' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $zone = Zone::create($request->all());

        return response()->json([
            'message' => 'Zone créée avec succès.',
            'data' => $zone->load('site'),
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Zone $zone)
    {
        return response()->json([
            'data' => $zone->load('site'),
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Zone $zone)
    {
        $request->validate([
            'site_id' => 'sometimes|exists:sites,id',
            'libelle' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
        ]);

        $zone->update($request->all());

        return response()->json([
            'message' => 'Zone mise à jour avec succès.',
            'data' => $zone->load('site'),
        ], 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Zone $zone)
    {
        $zone->delete();

        return response()->json([
            'message' => 'Zone supprimée avec succès.',
        ], 200);
    }
}
