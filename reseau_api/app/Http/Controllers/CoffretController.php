<?php

namespace App\Http\Controllers;

use App\Http\Requests\Coffret\StoreCoffretRequest;
use App\Http\Requests\Coffret\UpdateCoffretRequest;
use App\Models\Coffret;
use App\Services\CoffretService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Annotations as OA;

/**
 * @OA\Tag(
 *     name="Coffrets",
 *     description="Gestion des coffrets (armoires / baies réseau)"
 * )
 */
class CoffretController extends Controller
{
    public function __construct(
        private readonly CoffretService $coffretService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        return $this->paginatedResponse($this->coffretService->list($request));
    }

    public function store(StoreCoffretRequest $request): JsonResponse
    {
        $coffret = $this->coffretService->create(
            $request->validated(),
            $request->file('photo')
        );

        return $this->successResponse($coffret, 'Coffret créé avec succès.', 201);
    }

    public function show(Coffret $coffret): JsonResponse
    {
        return $this->successResponse($this->coffretService->find($coffret));
    }

    public function update(UpdateCoffretRequest $request, Coffret $coffret): JsonResponse
    {
        $coffret = $this->coffretService->update(
            $coffret,
            $request->validated(),
            $request->file('photo')
        );

        return $this->successResponse($coffret, 'Coffret mis à jour avec succès.');
    }

    public function photo(Coffret $coffret)
    {
        if (! $coffret->photo) {
            return $this->errorResponse('Photo non trouvée', 404);
        }

        $path = storage_path('app/public/'.$coffret->photo);

        if (! file_exists($path)) {
            return $this->errorResponse('Fichier image non trouvé', 404);
        }

        $mimeType = mime_content_type($path) ?: 'image/jpeg';

        return response()->file($path, [
            'Content-Type' => $mimeType,
            'Cache-Control' => 'public, max-age=31536000',
        ]);
    }

    public function destroy(Coffret $coffret): JsonResponse
    {
        $this->coffretService->delete($coffret);

        return $this->successResponse(message: 'Coffret supprimé avec succès.');
    }

    public function restore($id): JsonResponse
    {
        $coffret = $this->coffretService->restore($id);

        return $this->successResponse($coffret, 'Coffret restauré avec succès.');
    }

    public function import(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt|max:2048',
        ]);

        try {
            $result = $this->coffretService->import($request->file('file'));

            return $this->successResponse($result, 'Import terminé.');
        } catch (\RuntimeException $e) {
            return $this->errorResponse($e->getMessage(), 400);
        }
    }
}
