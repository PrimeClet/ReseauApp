<?php

namespace App\Http\Controllers;

use App\Http\Requests\Zone\StoreZoneRequest;
use App\Http\Requests\Zone\UpdateZoneRequest;
use App\Models\Zone;
use App\Services\ZoneService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ZoneController extends Controller
{
    public function __construct(
        private readonly ZoneService $zoneService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        return $this->successResponse($this->zoneService->list($request));
    }

    public function trashed(Request $request): JsonResponse
    {
        return $this->successResponse($this->zoneService->trashed($request));
    }

    public function store(StoreZoneRequest $request): JsonResponse
    {
        $zone = $this->zoneService->create($request->validated());

        return $this->successResponse($zone, 'Zone créée avec succès.', 201);
    }

    public function show(Zone $zone): JsonResponse
    {
        return $this->successResponse($this->zoneService->find($zone));
    }

    public function update(UpdateZoneRequest $request, Zone $zone): JsonResponse
    {
        $zone = $this->zoneService->update($zone, $request->validated());

        return $this->successResponse($zone, 'Zone mise à jour avec succès.');
    }

    public function destroy(Zone $zone): JsonResponse
    {
        $result = $this->zoneService->delete($zone);

        if (! $result['success']) {
            return $this->errorResponse($result['message'], 422, [
                'batiments_count' => $result['batiments_count'],
                'error' => $result['error'],
            ]);
        }

        return $this->successResponse(message: $result['message']);
    }

    public function restore($id): JsonResponse
    {
        $zone = $this->zoneService->restore($id);

        return $this->successResponse($zone, 'Zone restaurée avec succès.');
    }

    public function forceDelete($id): JsonResponse
    {
        $result = $this->zoneService->forceDelete($id);

        if (! $result['success']) {
            return $this->errorResponse($result['message'], 422, [
                'batiments_count' => $result['batiments_count'],
                'error' => $result['error'],
            ]);
        }

        return $this->successResponse(message: $result['message']);
    }
}
