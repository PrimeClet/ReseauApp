<?php

namespace App\Http\Controllers;

use App\Http\Requests\Role\StoreRoleRequest;
use App\Http\Requests\Role\UpdateRoleRequest;
use App\Services\RoleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RoleController extends Controller
{
    public function __construct(
        private readonly RoleService $roleService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        return $this->successResponse($this->roleService->list($request->search));
    }

    public function show($id): JsonResponse
    {
        return $this->successResponse($this->roleService->find($id));
    }

    public function store(StoreRoleRequest $request): JsonResponse
    {
        $data = $this->roleService->create($request->validated());

        return $this->successResponse($data, 'Rôle créé avec succès.', 201);
    }

    public function update(UpdateRoleRequest $request, $id): JsonResponse
    {
        $result = $this->roleService->update($id, $request->validated());

        if (! $result['success']) {
            return $this->errorResponse($result['message'], 403);
        }

        return $this->successResponse($result['data'], 'Rôle mis à jour avec succès.');
    }

    public function destroy($id): JsonResponse
    {
        $result = $this->roleService->delete($id);

        if (! $result['success']) {
            return $this->errorResponse($result['message'], $result['status']);
        }

        return $this->successResponse(message: $result['message']);
    }

    public function assignPermissions(Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'permissions' => 'required|array',
            'permissions.*' => 'exists:permissions,name',
        ]);

        $data = $this->roleService->assignPermissions($id, $validated['permissions']);

        return $this->successResponse($data, 'Permissions assignées avec succès.');
    }
}
