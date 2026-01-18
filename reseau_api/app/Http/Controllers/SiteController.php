<?php

namespace App\Http\Controllers;

use App\Models\Site;
use Illuminate\Http\Request;

class SiteController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Site::query()->withCount('zones');

        // Include trashed if requested
        if ($request->boolean('with_trashed')) {
            $query->withTrashed();
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

        $sites = $query->orderBy('libelle')->paginate($perPage);

        return response()->json($sites);
    }

    /**
     * Display a listing of trashed sites.
     */
    public function trashed(Request $request)
    {
        $query = Site::onlyTrashed()->withCount('zones');

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('libelle', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $perPage = (int) $request->get('per_page', 15);
        $perPage = $perPage > 0 && $perPage <= 100 ? $perPage : 15;

        $sites = $query->orderBy('deleted_at', 'desc')->paginate($perPage);

        return response()->json($sites);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'libelle' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $site = Site::create($request->only(['libelle', 'description']));
        $site->loadCount('zones');

        return response()->json([
            'message' => 'Site créé avec succès.',
            'data' => $site,
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Site $site)
    {
        $site->loadCount('zones');
        return response()->json([
            'data' => $site,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Site $site)
    {
        $request->validate([
            'libelle' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
        ]);

        $site->update($request->only(['libelle', 'description']));
        $site->loadCount('zones');

        return response()->json([
            'message' => 'Site mis à jour avec succès.',
            'data' => $site,
        ], 200);
    }

    /**
     * Remove the specified resource from storage (soft delete).
     */
    public function destroy(Site $site)
    {
        // Check if site has zones
        if ($site->hasZones()) {
            $zonesCount = $site->zonesCount();
            return response()->json([
                'message' => "Impossible de supprimer ce site car il contient {$zonesCount} zone(s). Veuillez d'abord supprimer les zones associées.",
                'zones_count' => $zonesCount,
                'error' => 'has_zones',
            ], 422);
        }

        $site->delete();

        return response()->json([
            'message' => 'Site supprimé avec succès. Il peut être restauré depuis la corbeille.',
        ], 200);
    }

    /**
     * Restore a soft-deleted site.
     */
    public function restore($id)
    {
        $site = Site::onlyTrashed()->findOrFail($id);
        $site->restore();
        $site->loadCount('zones');

        return response()->json([
            'message' => 'Site restauré avec succès.',
            'data' => $site,
        ], 200);
    }

    /**
     * Permanently delete a site.
     */
    public function forceDelete($id)
    {
        $site = Site::onlyTrashed()->findOrFail($id);

        // Check if site has zones even in trash
        if ($site->hasZones()) {
            $zonesCount = $site->zonesCount();
            return response()->json([
                'message' => "Impossible de supprimer définitivement ce site car il contient encore {$zonesCount} zone(s).",
                'zones_count' => $zonesCount,
                'error' => 'has_zones',
            ], 422);
        }

        $site->forceDelete();

        return response()->json([
            'message' => 'Site supprimé définitivement.',
        ], 200);
    }
}
