<?php

namespace App\Services;

use Spatie\Permission\Models\Role;

class RoleService
{
    /**
     * System roles that cannot be deleted.
     */
    private const SYSTEM_ROLES = ['Super Admin', 'Administrateur', 'Technicien', 'Observateur'];

    /**
     * Get all roles with permissions and counts, optionally filtered by search.
     */
    public function list(?string $search = null): \Illuminate\Support\Collection
    {
        $query = Role::with('permissions');

        if ($search) {
            $query->where('name', 'like', "%{$search}%");
        }

        $roles = $query->orderBy('name')->get();

        return $roles->map(function ($role) {
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
    }

    /**
     * Show a single role with detailed permissions and users.
     */
    public function find(int $id): array
    {
        $role = Role::with('permissions')->findOrFail($id);

        return [
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
        ];
    }

    /**
     * Create a new role with optional permissions.
     */
    public function create(array $validated): array
    {
        $role = Role::create([
            'name' => $validated['name'],
            'guard_name' => 'web',
        ]);

        if (! empty($validated['permissions'])) {
            $role->syncPermissions($validated['permissions']);
        }

        return [
            'id' => $role->id,
            'name' => $role->name,
            'permissions' => $role->permissions->pluck('name'),
        ];
    }

    /**
     * Update an existing role with system-role protection.
     *
     * @return array{success: bool, data?: array, message?: string}
     */
    public function update(int $id, array $validated): array
    {
        $role = Role::findOrFail($id);

        // Protect Super Admin role from non-Super Admin users
        if ($role->name === 'Super Admin' && ! auth()->user()->hasRole('Super Admin')) {
            return [
                'success' => false,
                'message' => 'Vous ne pouvez pas modifier le rôle Super Admin.',
            ];
        }

        if (isset($validated['name'])) {
            $role->name = $validated['name'];
            $role->save();
        }

        if (isset($validated['permissions'])) {
            $role->syncPermissions($validated['permissions']);
        }

        return [
            'success' => true,
            'data' => [
                'id' => $role->id,
                'name' => $role->name,
                'permissions' => $role->permissions->pluck('name'),
            ],
        ];
    }

    /**
     * Delete a role with system-role and user-assignment protection.
     *
     * @return array{success: bool, message: string, status?: int}
     */
    public function delete(int $id): array
    {
        $role = Role::findOrFail($id);

        if (in_array($role->name, self::SYSTEM_ROLES)) {
            return [
                'success' => false,
                'message' => 'Impossible de supprimer un rôle système.',
                'status' => 403,
            ];
        }

        if ($role->users()->count() > 0) {
            return [
                'success' => false,
                'message' => 'Impossible de supprimer ce rôle car des utilisateurs y sont assignés.',
                'status' => 400,
            ];
        }

        $role->delete();

        return [
            'success' => true,
            'message' => 'Rôle supprimé avec succès.',
        ];
    }

    /**
     * Assign (sync) permissions to a role.
     */
    public function assignPermissions(int $id, array $permissions): array
    {
        $role = Role::findOrFail($id);
        $role->syncPermissions($permissions);

        return [
            'id' => $role->id,
            'name' => $role->name,
            'permissions' => $role->permissions->pluck('name'),
        ];
    }
}
