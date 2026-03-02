<?php

namespace App\Http\Controllers;

use App\Http\Requests\Salle\ImportSalleRequest;
use App\Http\Requests\Salle\StoreSalleRequest;
use App\Http\Requests\Salle\UpdateSalleRequest;
use App\Models\Salle;
use App\Services\SalleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SalleController extends Controller
{
    public function __construct(
        private readonly SalleService $salleService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        return $this->successResponse($this->salleService->list($request));
    }

    public function store(StoreSalleRequest $request): JsonResponse
    {
        $salle = $this->salleService->create($request->validated());

        return $this->successResponse($salle, 'Salle créée avec succès.', 201);
    }

    public function show(Salle $salle): JsonResponse
    {
        return $this->successResponse($this->salleService->find($salle));
    }

    public function update(UpdateSalleRequest $request, Salle $salle): JsonResponse
    {
        $salle = $this->salleService->update($salle, $request->validated());

        return $this->successResponse($salle, 'Salle mise à jour avec succès.');
    }

    public function destroy(Salle $salle): JsonResponse
    {
        $this->salleService->delete($salle);

        return $this->successResponse(message: 'Salle supprimée avec succès.');
    }

    public function restore($id): JsonResponse
    {
        $salle = $this->salleService->restore($id);

        return $this->successResponse($salle, 'Salle restaurée avec succès.');
    }

    public function import(ImportSalleRequest $request): JsonResponse
    {
        $result = $this->salleService->importFromCsv($request->file('file'));

        return $this->successResponse($result, 'Import terminé.');
    }
}
