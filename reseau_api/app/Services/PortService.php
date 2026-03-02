<?php

namespace App\Services;

use App\Models\Port;
use Illuminate\Http\Request;

class PortService
{
    /**
     * Get a paginated, filtered list of ports with error-resilient relation loading.
     */
    public function list(Request $request): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        $query = Port::query();

        if ($request->get('with_trashed') === 'true') {
            $query->withTrashed();
        }

        if ($request->get('only_trashed') === 'true') {
            $query->onlyTrashed();
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('port_label', 'like', "%{$search}%")
                    ->orWhere('device_name', 'like', "%{$search}%");
            });
        }

        $perPage = $this->resolvePerPage($request);

        try {
            return $query->with(['equipement', 'connectedEquipment'])
                ->orderBy('id', 'desc')
                ->paginate($perPage);
        } catch (\Exception $e) {
            \Log::error('Error in PortService@list: '.$e->getMessage());
            \Log::error('File: '.$e->getFile().' Line: '.$e->getLine());
            \Log::error('Stack trace: '.$e->getTraceAsString());

            // Fallback: try without relations
            return $query->orderBy('id', 'desc')->paginate($perPage);
        }
    }

    /**
     * Show a single port with its relationships.
     */
    public function find(Port $port): Port
    {
        return $port->load('equipement', 'connectedEquipment');
    }

    /**
     * Create a new port with boolean/null normalization.
     */
    public function create(array $validated): Port
    {
        $data = $this->normalizeData($validated);

        $port = Port::create($data);

        return $port->load('equipement', 'connectedEquipment');
    }

    /**
     * Update an existing port.
     */
    public function update(Port $port, array $validated): Port
    {
        $port->update($validated);

        return $port->load('equipement', 'connectedEquipment');
    }

    /**
     * Delete a port (soft-delete).
     */
    public function delete(Port $port): void
    {
        $port->delete();
    }

    /**
     * Restore a soft-deleted port.
     */
    public function restore(int $id): Port
    {
        $port = Port::withTrashed()->findOrFail($id);
        $port->restore();

        return $port->load('equipement', 'connectedEquipment');
    }

    /**
     * Normalize port data before persistence.
     *
     * - Cast poe_enabled to boolean
     * - Nullify empty connected_equipment_id
     * - Default status to 'active'
     */
    private function normalizeData(array $data): array
    {
        if (isset($data['poe_enabled'])) {
            $data['poe_enabled'] = filter_var($data['poe_enabled'], FILTER_VALIDATE_BOOLEAN);
        }

        if (! isset($data['connected_equipment_id']) || $data['connected_equipment_id'] === '') {
            $data['connected_equipment_id'] = null;
        }

        if (! isset($data['status'])) {
            $data['status'] = 'active';
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
