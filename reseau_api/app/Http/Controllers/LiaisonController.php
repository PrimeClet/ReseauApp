<?php

namespace App\Http\Controllers;

use App\Http\Requests\Liaison\StoreLiaisonRequest;
use App\Http\Requests\Liaison\UpdateLiaisonRequest;
use App\Models\Liaison;
use App\Services\LiaisonService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LiaisonController extends Controller
{
    public function __construct(
        private readonly LiaisonService $liaisonService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        return $this->successResponse($this->liaisonService->list($request));
    }

    public function store(StoreLiaisonRequest $request): JsonResponse
    {
        $liaison = $this->liaisonService->create($request->validated());

        return $this->successResponse($liaison, 'Liaison créée avec succès.', 201);
    }

    public function show(Liaison $liaison): JsonResponse
    {
        return $this->successResponse($this->liaisonService->find($liaison));
    }

    public function update(UpdateLiaisonRequest $request, Liaison $liaison): JsonResponse
    {
        $liaison = $this->liaisonService->update($liaison, $request->validated());

        return $this->successResponse($liaison, 'Liaison mise à jour avec succès.');
    }

    public function destroy(Liaison $liaison): JsonResponse
    {
        $this->liaisonService->delete($liaison);

        return $this->successResponse(message: 'Liaison supprimée avec succès.');
    }

    public function restore($id): JsonResponse
    {
        $liaison = $this->liaisonService->restore($id);

        return $this->successResponse($liaison, 'Liaison restaurée avec succès.');
    }
}
