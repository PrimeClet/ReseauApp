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
        $query = Zone::with('site')->withCount('batiments');

        // Include trashed if requested
        if ($request->boolean('with_trashed')) {
            $query->withTrashed();
        }

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
     * Display a listing of trashed zones.
     */
    public function trashed(Request $request)
    {
        $query = Zone::onlyTrashed()->with('site')->withCount('batiments');

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

        $zones = $query->orderBy('deleted_at', 'desc')->paginate($perPage);

        return response()->json($zones);
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

        $zone = Zone::create($request->only(['site_id', 'libelle', 'description']));
        $zone->load('site');
        $zone->loadCount('batiments');

        return response()->json([
            'message' => 'Zone créée avec succès.',
            'data' => $zone,
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Zone $zone)
    {
        $zone->load('site');
        $zone->loadCount('batiments');
        return response()->json([
            'data' => $zone,
        ]);
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

        $zone->update($request->only(['site_id', 'libelle', 'description']));
        $zone->load('site');
        $zone->loadCount('batiments');

        return response()->json([
            'message' => 'Zone mise à jour avec succès.',
            'data' => $zone,
        ], 200);
    }

    /**
     * Remove the specified resource from storage (soft delete).
     */
    public function destroy(Zone $zone)
    {
        // Check if zone has batiments
        if ($zone->hasBatiments()) {
            $batimentsCount = $zone->batimentsCount();
            return response()->json([
                'message' => "Impossible de supprimer cette zone car elle contient {$batimentsCount} bâtiment(s). Veuillez d'abord supprimer les bâtiments associés.",
                'batiments_count' => $batimentsCount,
                'error' => 'has_batiments',
            ], 422);
        }

        $zone->delete();

        return response()->json([
            'message' => 'Zone supprimée avec succès. Elle peut être restaurée depuis la corbeille.',
        ], 200);
    }

    /**
     * Restore a soft-deleted zone.
     */
    public function restore($id)
    {
        $zone = Zone::onlyTrashed()->findOrFail($id);
        $zone->restore();
        $zone->load('site');
        $zone->loadCount('batiments');

        return response()->json([
            'message' => 'Zone restaurée avec succès.',
            'data' => $zone,
        ], 200);
    }

    /**
     * Permanently delete a zone.
     */
    public function forceDelete($id)
    {
        $zone = Zone::onlyTrashed()->findOrFail($id);

        // Check if zone has batiments even in trash
        if ($zone->hasBatiments()) {
            $batimentsCount = $zone->batimentsCount();
            return response()->json([
                'message' => "Impossible de supprimer définitivement cette zone car elle contient encore {$batimentsCount} bâtiment(s).",
                'batiments_count' => $batimentsCount,
                'error' => 'has_batiments',
            ], 422);
        }

        $zone->forceDelete();

        return response()->json([
            'message' => 'Zone supprimée définitivement.',
        ], 200);
    }
}
