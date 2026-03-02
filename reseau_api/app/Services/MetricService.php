<?php

namespace App\Services;

use App\Models\Metric;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\Request;

class MetricService
{
    /**
     * List metrics with optional filters, search, and pagination.
     */
    public function list(Request $request): LengthAwarePaginator
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

        return $query->orderBy('name')->paginate($perPage);
    }

    /**
     * Create a new metric.
     */
    public function create(array $data): Metric
    {
        return Metric::create($data);
    }

    /**
     * Update an existing metric.
     */
    public function update(Metric $metric, array $data): Metric
    {
        $metric->update($data);

        return $metric;
    }

    /**
     * Delete a metric.
     */
    public function delete(Metric $metric): void
    {
        $metric->delete();
    }
}
