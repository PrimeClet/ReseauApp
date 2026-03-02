<?php

namespace App\Http\Controllers;

use App\Http\Requests\Batiment\ImportBatimentRequest;
use App\Http\Requests\Batiment\StoreBatimentRequest;
use App\Http\Requests\Batiment\UpdateBatimentRequest;
use App\Models\Batiment;
use App\Services\BatimentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BatimentController extends Controller
{
    public function __construct(
        private readonly BatimentService $batimentService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        return $this->successResponse($this->batimentService->list($request));
    }

    public function store(StoreBatimentRequest $request): JsonResponse
    {
        $batiment = $this->batimentService->create($request->validated());

        return $this->successResponse($batiment, 'Bâtiment créé avec succès.', 201);
    }

    public function show(Batiment $batiment): JsonResponse
    {
        return $this->successResponse($this->batimentService->find($batiment));
    }

    public function update(UpdateBatimentRequest $request, Batiment $batiment): JsonResponse
    {
        $batiment = $this->batimentService->update($batiment, $request->validated());

        return $this->successResponse($batiment, 'Bâtiment mis à jour avec succès.');
    }

    public function destroy(Batiment $batiment): JsonResponse
    {
        $this->batimentService->delete($batiment);

        return $this->successResponse(message: 'Bâtiment supprimé avec succès.');
    }

    public function restore($id): JsonResponse
    {
        $batiment = $this->batimentService->restore($id);

        return $this->successResponse($batiment, 'Bâtiment restauré avec succès.');
    }

    public function forceDelete($id): JsonResponse
    {
        $this->batimentService->forceDelete($id);

        return $this->successResponse(message: 'Bâtiment supprimé définitivement.');
    }

    public function import(ImportBatimentRequest $request): JsonResponse
    {
        $result = $this->batimentService->importFromCsv($request->file('file'));

        return $this->successResponse($result, 'Import terminé.');
    }
}
