<?php

namespace App\Http\Controllers;

use App\Http\Requests\System\StoreSystemRequest;
use App\Http\Requests\System\UpdateSystemRequest;
use App\Models\System;
use App\Services\SystemService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SystemController extends Controller
{
    public function __construct(
        private readonly SystemService $systemService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        return $this->paginatedResponse($this->systemService->list($request));
    }

    public function store(StoreSystemRequest $request): JsonResponse
    {
        $system = $this->systemService->create($request->validated());

        return $this->successResponse($system, 'Système créé avec succès.', 201);
    }

    public function show(System $system): JsonResponse
    {
        return $this->successResponse($system);
    }

    public function update(UpdateSystemRequest $request, System $system): JsonResponse
    {
        $system = $this->systemService->update($system, $request->validated());

        return $this->successResponse($system, 'Système mis à jour avec succès.');
    }

    public function destroy(System $system): JsonResponse
    {
        $this->systemService->delete($system);

        return $this->successResponse(message: 'Système supprimé avec succès.');
    }
}
