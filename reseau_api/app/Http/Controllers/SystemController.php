<?php

namespace App\Http\Controllers;

use App\Models\System;
use Illuminate\Http\Request;

class SystemController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = System::all();

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%");
            });
        }

        $count = 15;

        if ($request->has('count')) {
            $count = $request->count;
        }

        $systems = $query->orderBy('name')->paginate($count);

        return response()->json($systems);
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
            'type' => 'required|string|max:255',
            'description' => 'nullable|string',
            'vendor' => 'nullable|string',
            'endpoint' => 'nullable|string',
            'monitored_scope' => 'nullable|string',
            'coffret_id' => 'required|exists:coffrets,id',
            'status' => 'required|boolean',
        ]);

        $system = System::create($request->all());

        return response()->json([
            'message' => 'Système créé avec succès.',
            'system' => $system,
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(System $system)
    {
        return response()->json($system);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, System $system)
    {
        if (!auth()->user()->isAdministrator()) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'type' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'vendor' => 'nullable|string',
            'endpoint' => 'nullable|string',
            'monitored_scope' => 'nullable|string',
            'coffret_id' => 'sometimes|exists:coffrets,id',
            'status' => 'sometimes|boolean',
        ]);

        $system->update($request->all());

        return response()->json([
            'message' => 'Système mis à jour avec succès.',
            'system' => $system,
        ], 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(System $system)
    {
        if (!auth()->user()->isAdministrator()) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $system->delete();

        return response()->json([
            'message' => 'Système supprimé avec succès.',
        ], 200);
    }
}
