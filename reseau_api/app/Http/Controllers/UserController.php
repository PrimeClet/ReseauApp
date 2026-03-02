<?php

namespace App\Http\Controllers;

use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Services\UserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function __construct(
        private readonly UserService $userService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        return $this->successResponse($this->userService->list($request));
    }

    public function show($id): JsonResponse
    {
        return $this->successResponse($this->userService->find($id));
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        $data = $this->userService->create($request->validated());

        return $this->successResponse($data, 'Utilisateur créé avec succès.', 201);
    }

    public function update(UpdateUserRequest $request, $id): JsonResponse
    {
        $data = $this->userService->update($id, $request->validated());

        return $this->successResponse($data, 'Utilisateur mis à jour avec succès.');
    }

    public function destroy($id): JsonResponse
    {
        $this->userService->delete($id, auth()->id());

        return $this->successResponse(message: 'Utilisateur supprimé avec succès.');
    }

    public function toggleStatus($id): JsonResponse
    {
        $result = $this->userService->toggleStatus($id, auth()->id());

        return $this->successResponse($result);
    }

    public function assignRoles(Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'roles' => 'required|array',
            'roles.*' => 'exists:roles,name',
        ]);

        $data = $this->userService->assignRoles($id, $validated['roles']);

        return $this->successResponse($data, 'Rôles assignés avec succès.');
    }

    public function assignPermissions(Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'permissions' => 'required|array',
            'permissions.*' => 'exists:permissions,name',
        ]);

        $data = $this->userService->assignPermissions($id, $validated['permissions']);

        return $this->successResponse($data, 'Permissions assignées avec succès.');
    }
}
