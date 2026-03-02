<?php

namespace App\Http\Controllers;

use App\Http\Requests\Lan\StoreLanRequest;
use App\Http\Requests\Lan\UpdateLanRequest;
use App\Models\Lan;
use App\Services\LanService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LanController extends Controller
{
    public function __construct(
        private readonly LanService $lanService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        return $this->successResponse($this->lanService->list($request));
    }

    public function store(StoreLanRequest $request): JsonResponse
    {
        $lan = $this->lanService->create($request->validated());

        return $this->successResponse($lan, 'LAN créé avec succès.', 201);
    }

    public function show(Lan $lan): JsonResponse
    {
        return $this->successResponse($this->lanService->find($lan));
    }

    public function update(UpdateLanRequest $request, Lan $lan): JsonResponse
    {
        $lan = $this->lanService->update($lan, $request->validated());

        return $this->successResponse($lan, 'LAN mis à jour avec succès.');
    }

    public function destroy(Lan $lan): JsonResponse
    {
        $this->lanService->delete($lan);

        return $this->successResponse(message: 'LAN supprimé avec succès.');
    }
}
