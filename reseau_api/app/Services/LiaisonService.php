<?php

namespace App\Services;

use App\Models\Liaison;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Validation\ValidationException;

class LiaisonService
{
    /**
     * List liaisons with filters, search, and pagination.
     */
    public function list(Request $request): LengthAwarePaginator
    {
        $query = Liaison::query();

        if ($request->get('with_trashed') === 'true') {
            $query->withTrashed();
        }

        if ($request->get('only_trashed') === 'true') {
            $query->onlyTrashed();
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('label', 'like', "%{$search}%")
                    ->orWhere('media', 'like', "%{$search}%");
            });
        }

        $perPage = (int) $request->get('per_page', 15);
        $perPage = $perPage > 0 && $perPage <= 100 ? $perPage : 15;

        return $query->with(['fromPort.equipement', 'toPort.equipement'])
            ->orderBy('id', 'desc')
            ->paginate($perPage);
    }

    /**
     * Show a single liaison with its relationships.
     */
    public function find(Liaison $liaison): Liaison
    {
        return $liaison->load(['fromPort.equipement', 'toPort.equipement']);
    }

    /**
     * Create a new liaison after validating port availability.
     *
     * @throws ValidationException
     */
    public function create(array $data): Liaison
    {
        $this->validatePortsAreDifferent($data['from'], $data['to']);
        $this->validatePortAvailability($data['from'], 'from');
        $this->validatePortAvailability($data['to'], 'to');

        $liaison = Liaison::create($data);

        return $liaison->load(['fromPort.equipement', 'toPort.equipement']);
    }

    /**
     * Update an existing liaison after validating port availability.
     *
     * @throws ValidationException
     */
    public function update(Liaison $liaison, array $data): Liaison
    {
        $fromPort = $data['from'] ?? $liaison->from;
        $toPort = $data['to'] ?? $liaison->to;

        $this->validatePortsAreDifferent($fromPort, $toPort);

        if (isset($data['from']) && $data['from'] !== $liaison->from) {
            $this->validatePortAvailability($data['from'], 'from', $liaison->id);
        }

        if (isset($data['to']) && $data['to'] !== $liaison->to) {
            $this->validatePortAvailability($data['to'], 'to', $liaison->id);
        }

        $liaison->update($data);

        return $liaison->load(['fromPort.equipement', 'toPort.equipement']);
    }

    /**
     * Soft-delete a liaison.
     */
    public function delete(Liaison $liaison): void
    {
        $liaison->delete();
    }

    /**
     * Restore a soft-deleted liaison.
     */
    public function restore(int $id): Liaison
    {
        $liaison = Liaison::withTrashed()->findOrFail($id);
        $liaison->restore();

        return $liaison->load(['fromPort.equipement', 'toPort.equipement']);
    }

    /**
     * Validate that from and to ports are not the same.
     *
     * @throws ValidationException
     */
    private function validatePortsAreDifferent(int $from, int $to): void
    {
        if ($from === $to) {
            throw ValidationException::withMessages([
                'to' => ['Le port de destination doit être différent du port d\'origine.'],
            ]);
        }
    }

    /**
     * Validate that a port is not already used in another liaison.
     *
     * @throws ValidationException
     */
    private function validatePortAvailability(int $portId, string $field, ?int $excludeLiaisonId = null): void
    {
        $query = Liaison::where(function ($q) use ($portId) {
            $q->where('from', $portId)
                ->orWhere('to', $portId);
        });

        if ($excludeLiaisonId) {
            $query->where('id', '!=', $excludeLiaisonId);
        }

        if ($query->exists()) {
            $label = $field === 'from' ? 'origine' : 'destination';
            throw ValidationException::withMessages([
                $field => ['Ce port est déjà connecté à une autre liaison.'],
            ]);
        }
    }
}
