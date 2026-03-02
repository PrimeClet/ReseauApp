<?php

namespace App\Http\Controllers;

use App\Models\Metric;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MetricController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Metric::query();

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

        $metrics = $query->orderBy('name')->paginate($perPage);

        return $this->paginatedResponse($metrics);
    }

    public function store(Request $request): JsonResponse
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

        return $this->successResponse($metric, 'Metric créée avec succès.', 201);
    }

    public function show(Metric $metric): JsonResponse
    {
        return $this->successResponse($metric);
    }

    public function update(Request $request, Metric $metric): JsonResponse
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

        return $this->successResponse($metric, 'Metric mise à jour avec succès.');
    }

    public function destroy(Metric $metric): JsonResponse
    {
        $metric->delete();

        return $this->successResponse(message: 'Metric supprimée avec succès.');
    }
}
