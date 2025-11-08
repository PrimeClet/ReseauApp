<?php

namespace App\Http\Controllers;

use App\Models\Metric;
use Illuminate\Http\Request;

class MetricController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Metric::all();

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%");
            });
        }

        $metrics = $query->orderBy('name')->paginate(15);

        return response()->json($metrics);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string|max:255',
            'description' => 'nullable|string',
            'last_value' => 'nullable|string|max:255',
            'coffret_id' => 'required|exists:coffrets,id',
            'status' => 'required|boolean',
        ]);

        $metric = Metric::create($request->all());

        return response()->json([
            'message' => 'Metric créée avec succès.',
            'metric' => $metric,
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Metric $metric)
    {
        return response()->json($metric);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Metric $metric)
    {
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'type' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'last_value' => 'nullable|string|max:255',
            'coffret_id' => 'sometimes|exists:coffrets,id',
            'status' => 'sometimes|boolean',
        ]);

        $metric->update($request->all());

        return response()->json([
            'message' => 'Metric mise à jour avec succès.',
            'metric' => $metric,
        ], 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Metric $metric)
    {
        $metric->delete();

        return response()->json([
            'message' => 'Metric supprimée avec succès.',
        ], 200);
    }
}
