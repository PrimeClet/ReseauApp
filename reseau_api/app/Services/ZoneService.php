<?php

namespace App\Services;

use App\Models\Zone;
use Illuminate\Http\Request;

class ZoneService
{
    /**
     * Get a paginated, filtered list of zones.
     */
    public function list(Request $request): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        $query = Zone::with('site')->withCount('batiments');

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

        $perPage = $this->resolvePerPage($request);

        return $query->orderBy('id', 'desc')->paginate($perPage);
    }

    /**
     * Get a paginated list of soft-deleted zones.
     */
    public function trashed(Request $request): \Illuminate\Contracts\Pagination\LengthAwarePaginator
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

        $perPage = $this->resolvePerPage($request);

        return $query->orderBy('deleted_at', 'desc')->paginate($perPage);
    }

    /**
     * Show a single zone with its relationships.
     */
    public function find(Zone $zone): Zone
    {
        $zone->load('site');
        $zone->loadCount('batiments');

        return $zone;
    }

    /**
     * Create a new zone.
     */
    public function create(array $validated): Zone
    {
        $zone = Zone::create($validated);
        $zone->load('site');
        $zone->loadCount('batiments');

        return $zone;
    }

    /**
     * Update an existing zone.
     */
    public function update(Zone $zone, array $validated): Zone
    {
        $zone->update($validated);
        $zone->load('site');
        $zone->loadCount('batiments');

        return $zone;
    }

    /**
     * Soft-delete a zone after checking for batiment dependencies.
     *
     * @return array{success: bool, message: string, batiments_count?: int}
     */
    public function delete(Zone $zone): array
    {
        if ($zone->hasBatiments()) {
            $batimentsCount = $zone->batimentsCount();

            return [
                'success' => false,
                'message' => "Impossible de supprimer cette zone car elle contient {$batimentsCount} bâtiment(s). Veuillez d'abord supprimer les bâtiments associés.",
                'batiments_count' => $batimentsCount,
                'error' => 'has_batiments',
            ];
        }

        $zone->delete();

        return [
            'success' => true,
            'message' => 'Zone supprimée avec succès. Elle peut être restaurée depuis la corbeille.',
        ];
    }

    /**
     * Restore a soft-deleted zone.
     */
    public function restore(int $id): Zone
    {
        $zone = Zone::onlyTrashed()->findOrFail($id);
        $zone->restore();
        $zone->load('site');
        $zone->loadCount('batiments');

        return $zone;
    }

    /**
     * Permanently delete a soft-deleted zone after checking for batiment dependencies.
     *
     * @return array{success: bool, message: string, batiments_count?: int}
     */
    public function forceDelete(int $id): array
    {
        $zone = Zone::onlyTrashed()->findOrFail($id);

        if ($zone->hasBatiments()) {
            $batimentsCount = $zone->batimentsCount();

            return [
                'success' => false,
                'message' => "Impossible de supprimer définitivement cette zone car elle contient encore {$batimentsCount} bâtiment(s).",
                'batiments_count' => $batimentsCount,
                'error' => 'has_batiments',
            ];
        }

        $zone->forceDelete();

        return [
            'success' => true,
            'message' => 'Zone supprimée définitivement.',
        ];
    }

    /**
     * Resolve a safe per_page value from the request.
     */
    private function resolvePerPage(Request $request, int $default = 15): int
    {
        $perPage = (int) $request->get('per_page', $default);

        return $perPage > 0 && $perPage <= 100 ? $perPage : $default;
    }
}
