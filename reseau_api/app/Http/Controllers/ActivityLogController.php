<?php

namespace App\Http\Controllers;

use App\Services\ActivityLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    public function __construct(
        private readonly ActivityLogService $activityLogService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        return $this->successResponse($this->activityLogService->list($request));
    }

    public function show($id): JsonResponse
    {
        return $this->successResponse($this->activityLogService->find($id));
    }

    public function stats(Request $request): JsonResponse
    {
        return $this->successResponse($this->activityLogService->stats($request));
    }

    public function modelLogs(Request $request, $modelType, $modelId): JsonResponse
    {
        return $this->successResponse($this->activityLogService->modelLogs($modelType, (int) $modelId));
    }

    public function cleanup(Request $request): JsonResponse
    {
        $request->validate([
            'days' => 'required|integer|min:1',
        ]);

        $deletedCount = $this->activityLogService->cleanup($request->days);

        return $this->successResponse(['deleted_count' => $deletedCount], 'Nettoyage effectué avec succès');
    }
}
