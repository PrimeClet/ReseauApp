<?php

namespace App\Services;

use App\Models\System;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\Request;

class SystemService
{
    /**
     * List systems with optional filters, search, and pagination.
     */
    public function list(Request $request): LengthAwarePaginator
    {
        $query = System::query();

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%");
            });
        }

        $perPage = (int) $request->get('per_page', $request->get('count', 15));
        $perPage = $perPage > 0 && $perPage <= 100 ? $perPage : 15;

        return $query->orderBy('name')->paginate($perPage);
    }

    /**
     * Create a new system.
     */
    public function create(array $data): System
    {
        return System::create($data);
    }

    /**
     * Update an existing system.
     */
    public function update(System $system, array $data): System
    {
        $system->update($data);

        return $system;
    }

    /**
     * Delete a system.
     */
    public function delete(System $system): void
    {
        $system->delete();
    }
}
