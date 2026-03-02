<?php

namespace App\Http\Controllers;

use App\Http\Requests\Site\StoreSiteRequest;
use App\Http\Requests\Site\UpdateSiteRequest;
use App\Models\Site;
use App\Services\SiteService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SiteController extends Controller
{
    public function __construct(
        private readonly SiteService $siteService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $sites = $this->siteService->list($request);

        return $this->successResponse($sites);
    }

    public function trashed(Request $request): JsonResponse
    {
        $sites = $this->siteService->trashed($request);

        return $this->successResponse($sites);
    }

    public function store(StoreSiteRequest $request): JsonResponse
    {
        $site = $this->siteService->create($request->validated());

        return $this->successResponse($site, 'Site créé avec succès.', 201);
    }

    public function show(Site $site): JsonResponse
    {
        return $this->successResponse($this->siteService->find($site));
    }

    public function update(UpdateSiteRequest $request, Site $site): JsonResponse
    {
        $site = $this->siteService->update($site, $request->validated());

        return $this->successResponse($site, 'Site mis à jour avec succès.');
    }

    public function destroy(Site $site): JsonResponse
    {
        $result = $this->siteService->delete($site);

        if (! $result['success']) {
            return $this->errorResponse($result['message'], 422, [
                'zones_count' => $result['zones_count'],
                'error' => $result['error'],
            ]);
        }

        return $this->successResponse(message: $result['message']);
    }

    public function restore($id): JsonResponse
    {
        $site = $this->siteService->restore($id);

        return $this->successResponse($site, 'Site restauré avec succès.');
    }

    public function forceDelete($id): JsonResponse
    {
        $result = $this->siteService->forceDelete($id);

        if (! $result['success']) {
            return $this->errorResponse($result['message'], 422, [
                'zones_count' => $result['zones_count'],
                'error' => $result['error'],
            ]);
        }

        return $this->successResponse(message: $result['message']);
    }
}
