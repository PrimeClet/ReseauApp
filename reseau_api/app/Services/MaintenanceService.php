<?php

namespace App\Services;

use App\Models\Maintenance;
use Illuminate\Http\Request;

class MaintenanceService
{
    /**
     * Get a paginated, filtered list of maintenances.
     */
    public function list(Request $request): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        $query = Maintenance::query();

        if ($request->has('statut')) {
            $query->where('statut', $request->statut);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('type', 'like', "%{$search}%")
                    ->orWhere('technicien', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $perPage = $this->resolvePerPage($request);

        return $query->with('equipement')
            ->orderBy('date_debut', 'desc')
            ->paginate($perPage);
    }

    /**
     * Show a single maintenance with its relationships.
     */
    public function find(Maintenance $maintenance): Maintenance
    {
        return $maintenance->load('equipement');
    }

    /**
     * Create a new maintenance with data normalization.
     */
    public function create(array $validated): Maintenance
    {
        $data = $this->normalizeData($validated);

        \Log::info('Creating maintenance with data: '.json_encode($data));

        $maintenance = Maintenance::create($data);

        return $maintenance->load('equipement');
    }

    /**
     * Update an existing maintenance.
     */
    public function update(Maintenance $maintenance, array $validated): Maintenance
    {
        $maintenance->update($validated);

        return $maintenance->load('equipement');
    }

    /**
     * Delete a maintenance.
     */
    public function delete(Maintenance $maintenance): void
    {
        $maintenance->delete();
    }

    /**
     * Normalize maintenance data before persistence.
     *
     * - Default status to 'planifiee' when missing
     * - Nullify empty equipement_id
     * - Truncate heure_debut to H:i format
     */
    private function normalizeData(array $data): array
    {
        if (! isset($data['statut']) || empty($data['statut'])) {
            $data['statut'] = 'planifiee';
        }

        if (! isset($data['equipement_id']) || $data['equipement_id'] === '' || $data['equipement_id'] === 0) {
            $data['equipement_id'] = null;
        }

        if (isset($data['heure_debut']) && strlen($data['heure_debut']) > 5) {
            $data['heure_debut'] = substr($data['heure_debut'], 0, 5);
        }

        return $data;
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
