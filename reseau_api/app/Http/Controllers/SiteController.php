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
        $query = Site::query();

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
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'libelle' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $site = Site::create($request->all());

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

        $site->update($request->all());

        return response()->json([
            'message' => 'Site mis à jour avec succès.',
            'data' => $site,
        ], 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Site $site)
    {
        $site->delete();

        return response()->json([
            'message' => 'Site supprimé avec succès.',
        ], 200);
    }
}
