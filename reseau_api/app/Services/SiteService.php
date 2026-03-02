<?php

namespace App\Services;

use App\Models\Site;
use Illuminate\Http\Request;

class SiteService
{
    /**
     * Get a paginated, filtered list of sites.
     */
    public function list(Request $request): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        $query = Site::query()->withCount('zones');

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

        $perPage = $this->resolvePerPage($request);

        return $query->orderBy('id', 'desc')->paginate($perPage);
    }

    /**
     * Get a paginated list of soft-deleted sites.
     */
    public function trashed(Request $request): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        $query = Site::onlyTrashed()->withCount('zones');

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
     * Show a single site with its zones count.
     */
    public function find(Site $site): Site
    {
        $site->loadCount('zones');

        return $site;
    }

    /**
     * Create a new site.
     */
    public function create(array $validated): Site
    {
        $site = Site::create($validated);
        $site->loadCount('zones');

        return $site;
    }

    /**
     * Update an existing site.
     */
    public function update(Site $site, array $validated): Site
    {
        $site->update($validated);
        $site->loadCount('zones');

        return $site;
    }

    /**
     * Soft-delete a site after checking for zone dependencies.
     *
     * @return array{success: bool, message: string, zones_count?: int}
     */
    public function delete(Site $site): array
    {
        if ($site->hasZones()) {
            $zonesCount = $site->zonesCount();

            return [
                'success' => false,
                'message' => "Impossible de supprimer ce site car il contient {$zonesCount} zone(s). Veuillez d'abord supprimer les zones associées.",
                'zones_count' => $zonesCount,
                'error' => 'has_zones',
            ];
        }

        $site->delete();

        return [
            'success' => true,
            'message' => 'Site supprimé avec succès. Il peut être restauré depuis la corbeille.',
        ];
    }

    /**
     * Restore a soft-deleted site.
     */
    public function restore(int $id): Site
    {
        $site = Site::onlyTrashed()->findOrFail($id);
        $site->restore();
        $site->loadCount('zones');

        return $site;
    }

    /**
     * Permanently delete a soft-deleted site after checking for zone dependencies.
     *
     * @return array{success: bool, message: string, zones_count?: int}
     */
    public function forceDelete(int $id): array
    {
        $site = Site::onlyTrashed()->findOrFail($id);

        if ($site->hasZones()) {
            $zonesCount = $site->zonesCount();

            return [
                'success' => false,
                'message' => "Impossible de supprimer définitivement ce site car il contient encore {$zonesCount} zone(s).",
                'zones_count' => $zonesCount,
                'error' => 'has_zones',
            ];
        }

        $site->forceDelete();

        return [
            'success' => true,
            'message' => 'Site supprimé définitivement.',
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
