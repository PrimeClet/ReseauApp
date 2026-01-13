<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RoleController extends Controller
{
    /**
     * Liste tous les rôles avec leurs permissions
     */
    public function index(Request $request)
    {
        $query = Role::with('permissions');

        if ($request->has('search')) {
            $search = $request->search;
            $query->where('name', 'like', "%{$search}%");
        }

        $roles = $query->orderBy('name')->get();

        $data = $roles->map(function ($role) {
            return [
                'id' => $role->id,
                'name' => $role->name,
                'guard_name' => $role->guard_name,
                'permissions' => $role->permissions->pluck('name'),
                'permissions_count' => $role->permissions->count(),
                'users_count' => $role->users()->count(),
                'created_at' => $role->created_at,
                'updated_at' => $role->updated_at,
            ];
        });

        return response()->json([
            'data' => $data
        ]);
    }

    /**
     * Affiche un rôle spécifique
     */
    public function show($id)
    {
        $role = Role::with('permissions')->findOrFail($id);

        return response()->json([
            'data' => [
                'id' => $role->id,
                'name' => $role->name,
                'guard_name' => $role->guard_name,
                'permissions' => $role->permissions->map(function ($perm) {
                    return [
                        'id' => $perm->id,
                        'name' => $perm->name,
                    ];
                }),
                'users' => $role->users->map(function ($user) {
                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                    ];
                }),
                'created_at' => $role->created_at,
                'updated_at' => $role->updated_at,
            ]
        ]);
    }

    /**
     * Crée un nouveau rôle
     */
    public function store(Request $request)
    {
        if (!auth()->user()->can('roles.creer')) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:roles,name',
            'permissions' => 'nullable|array',
            'permissions.*' => 'exists:permissions,name',
        ]);

        $role = Role::create([
            'name' => $validated['name'],
            'guard_name' => 'web',
        ]);

        if (isset($validated['permissions']) && !empty($validated['permissions'])) {
            $role->syncPermissions($validated['permissions']);
        }

        return response()->json([
            'message' => 'Rôle créé avec succès.',
            'data' => [
                'id' => $role->id,
                'name' => $role->name,
                'permissions' => $role->permissions->pluck('name'),
            ]
        ], 201);
    }

    /**
     * Met à jour un rôle
     */
    public function update(Request $request, $id)
    {
        if (!auth()->user()->can('roles.modifier')) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $role = Role::findOrFail($id);

        // Empêcher la modification du rôle Super Admin
        if ($role->name === 'Super Admin' && !auth()->user()->hasRole('Super Admin')) {
            return response()->json(['message' => 'Vous ne pouvez pas modifier le rôle Super Admin.'], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255|unique:roles,name,' . $id,
            'permissions' => 'nullable|array',
            'permissions.*' => 'exists:permissions,name',
        ]);

        if (isset($validated['name'])) {
            $role->name = $validated['name'];
            $role->save();
        }

        if (isset($validated['permissions'])) {
            $role->syncPermissions($validated['permissions']);
        }

        return response()->json([
            'message' => 'Rôle mis à jour avec succès.',
            'data' => [
                'id' => $role->id,
                'name' => $role->name,
                'permissions' => $role->permissions->pluck('name'),
            ]
        ]);
    }

    /**
     * Supprime un rôle
     */
    public function destroy($id)
    {
        if (!auth()->user()->can('roles.supprimer')) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $role = Role::findOrFail($id);

        // Empêcher la suppression des rôles système
        $systemRoles = ['Super Admin', 'Administrateur', 'Technicien', 'Observateur'];
        if (in_array($role->name, $systemRoles)) {
            return response()->json(['message' => 'Impossible de supprimer un rôle système.'], 403);
        }

        // Vérifier si des utilisateurs ont ce rôle
        if ($role->users()->count() > 0) {
            return response()->json([
                'message' => 'Impossible de supprimer ce rôle car des utilisateurs y sont assignés.'
            ], 400);
        }

        $role->delete();

        return response()->json([
            'message' => 'Rôle supprimé avec succès.'
        ]);
    }

    /**
     * Assigne des permissions à un rôle
     */
    public function assignPermissions(Request $request, $id)
    {
        if (!auth()->user()->can('permissions.attribuer')) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $role = Role::findOrFail($id);

        $validated = $request->validate([
            'permissions' => 'required|array',
            'permissions.*' => 'exists:permissions,name',
        ]);

        $role->syncPermissions($validated['permissions']);

        return response()->json([
            'message' => 'Permissions assignées avec succès.',
            'data' => [
                'id' => $role->id,
                'name' => $role->name,
                'permissions' => $role->permissions->pluck('name'),
            ]
        ]);
    }
}
