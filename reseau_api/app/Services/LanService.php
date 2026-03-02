<?php

namespace App\Services;

use App\Models\Equipement;
use App\Models\Lan;
use Illuminate\Http\Request;

class LanService
{
    /**
     * Get a paginated, filtered list of LANs.
     */
    public function list(Request $request): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        $query = Lan::query();

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('subnet', 'like', "%{$search}%")
                    ->orWhere('vlan_id', 'like', "%{$search}%")
                    ->orWhere('site', 'like', "%{$search}%");
            });
        }

        $perPage = $this->resolvePerPage($request);

        return $query->with('batiment', 'salle')
            ->orderBy('id', 'desc')
            ->paginate($perPage);
    }

    /**
     * Show a single LAN with its relationships.
     */
    public function find(Lan $lan): Lan
    {
        return $lan->load('batiment', 'salle');
    }

    /**
     * Create a new LAN, auto-detecting batiment/salle from equipment if provided.
     */
    public function create(array $validated): Lan
    {
        $data = collect($validated)->except('equipement_id')->toArray();
        $equipementId = $validated['equipement_id'] ?? null;

        if ($equipementId) {
            $data = $this->enrichDataFromEquipement($data, $equipementId);
        }

        $lan = Lan::create($data);

        if ($equipementId) {
            $lan->equipements()->attach($equipementId, [
                'is_tagged' => true,
                'ports' => null,
            ]);
        }

        return $lan->load('batiment', 'salle', 'equipements');
    }

    /**
     * Update an existing LAN.
     */
    public function update(Lan $lan, array $validated): Lan
    {
        $lan->update($validated);

        return $lan->load('batiment', 'salle');
    }

    /**
     * Delete a LAN.
     */
    public function delete(Lan $lan): void
    {
        $lan->delete();
    }

    /**
     * Enrich LAN data with batiment/salle info from an equipment's coffret.
     */
    private function enrichDataFromEquipement(array $data, int $equipementId): array
    {
        $equipement = Equipement::with('coffret.batiment', 'coffret.salle')->find($equipementId);

        if ($equipement && $equipement->coffret) {
            $data['batiment_id'] = $equipement->coffret->batiment_id ?? $data['batiment_id'] ?? null;
            $data['salle_id'] = $equipement->coffret->salle_id ?? $data['salle_id'] ?? null;

            if (! isset($data['site']) && $equipement->coffret->batiment) {
                $data['site'] = $equipement->coffret->batiment->nom ?? 'N/A';
            }
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
