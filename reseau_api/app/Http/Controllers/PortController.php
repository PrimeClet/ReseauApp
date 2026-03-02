<?php

namespace App\Http\Controllers;

use App\Http\Requests\Port\StorePortRequest;
use App\Http\Requests\Port\UpdatePortRequest;
use App\Models\Port;
use App\Services\PortService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PortController extends Controller
{
    public function __construct(
        private readonly PortService $portService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $ports = $this->portService->list($request);

        return $this->successResponse($ports);
    }

    public function store(StorePortRequest $request): JsonResponse
    {
        $port = $this->portService->create($request->validated());

        return $this->successResponse($port, 'Port créé avec succès.', 201);
    }

    public function show(Port $port): JsonResponse
    {
        return $this->successResponse($this->portService->find($port));
    }

    public function update(UpdatePortRequest $request, Port $port): JsonResponse
    {
        $port = $this->portService->update($port, $request->validated());

        return $this->successResponse($port, 'Port mis à jour avec succès.');
    }

    public function destroy(Port $port): JsonResponse
    {
        $this->portService->delete($port);

        return $this->successResponse(message: 'Port supprimé avec succès.');
    }

    public function restore($id): JsonResponse
    {
        $port = $this->portService->restore($id);

        return $this->successResponse($port, 'Port restauré avec succès.');
    }
}
