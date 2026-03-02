<?php

namespace App\Http\Controllers;

use App\Http\Requests\Maintenance\StoreMaintenanceRequest;
use App\Http\Requests\Maintenance\UpdateMaintenanceRequest;
use App\Models\Maintenance;
use App\Services\MaintenanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MaintenanceController extends Controller
{
    public function __construct(
        private readonly MaintenanceService $maintenanceService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        return $this->successResponse($this->maintenanceService->list($request));
    }

    public function store(StoreMaintenanceRequest $request): JsonResponse
    {
        $maintenance = $this->maintenanceService->create($request->validated());

        return $this->successResponse($maintenance, 'Maintenance créée avec succès.', 201);
    }

    public function show(Maintenance $maintenance): JsonResponse
    {
        return $this->successResponse($this->maintenanceService->find($maintenance));
    }

    public function update(UpdateMaintenanceRequest $request, Maintenance $maintenance): JsonResponse
    {
        $maintenance = $this->maintenanceService->update($maintenance, $request->validated());

        return $this->successResponse($maintenance, 'Maintenance mise à jour avec succès.');
    }

    public function destroy(Maintenance $maintenance): JsonResponse
    {
        $this->maintenanceService->delete($maintenance);

        return $this->successResponse(message: 'Maintenance supprimée avec succès.');
    }
}
