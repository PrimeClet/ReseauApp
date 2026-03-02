<?php

namespace App\Http\Controllers;

use App\Services\StatistiqueService;
use Illuminate\Http\JsonResponse;

class StatistiqueController extends Controller
{
    public function __construct(
        private readonly StatistiqueService $statistiqueService,
    ) {}

    public function globalStats(): JsonResponse
    {
        return $this->successResponse($this->statistiqueService->globalStats());
    }

    public function systemsByType(): JsonResponse
    {
        return $this->successResponse($this->statistiqueService->systemsByType());
    }

    public function equipementsByCoffret(): JsonResponse
    {
        return $this->successResponse($this->statistiqueService->equipementsByCoffret());
    }

    public function portsByVlan(): JsonResponse
    {
        return $this->successResponse($this->statistiqueService->portsByVlan());
    }

    public function modificationsStats(): JsonResponse
    {
        return $this->successResponse($this->statistiqueService->modificationsStats());
    }
}
