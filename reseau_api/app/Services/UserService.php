<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Hash;

class UserService
{
    /**
     * List users with filters, search, role filtering, and transformed output.
     */
    public function list(Request $request): LengthAwarePaginator
    {
        $query = User::with('roles');

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('surname', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('username', 'like', "%{$search}%");
            });
        }

        if ($request->has('role')) {
            $query->whereHas('roles', function ($q) use ($request) {
                $q->where('name', $request->role);
            });
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $perPage = (int) $request->get('per_page', 15);
        $perPage = $perPage > 0 && $perPage <= 100 ? $perPage : 15;

        $users = $query->orderBy('id', 'desc')->paginate($perPage);

        $users->getCollection()->transform(function ($user) {
            return $this->transformUser($user);
        });

        return $users;
    }

    /**
     * Show a single user with roles and permissions.
     */
    public function find(int $id): array
    {
        $user = User::with('roles.permissions')->findOrFail($id);

        return [
            'id' => $user->id,
            'name' => $user->name,
            'surname' => $user->surname,
            'username' => $user->username,
            'email' => $user->email,
            'phone' => $user->phone,
            'is_active' => $user->is_active,
            'roles' => $user->roles->map(function ($role) {
                return [
                    'id' => $role->id,
                    'name' => $role->name,
                    'permissions' => $role->permissions->pluck('name'),
                ];
            }),
            'direct_permissions' => $user->getDirectPermissions()->pluck('name'),
            'all_permissions' => $user->getAllPermissions()->pluck('name'),
            'created_at' => $user->created_at,
            'updated_at' => $user->updated_at,
        ];
    }

    /**
     * Create a new user with role assignment.
     */
    public function create(array $validated): array
    {
        $user = User::create([
            'name' => $validated['name'],
            'surname' => $validated['surname'] ?? null,
            'username' => $validated['username'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'password' => Hash::make($validated['password']),
            'is_active' => $validated['is_active'] ?? true,
        ]);

        if (! empty($validated['roles'])) {
            $user->syncRoles($validated['roles']);
        }

        return [
            'id' => $user->id,
            'name' => $user->name,
            'surname' => $user->surname,
            'username' => $user->username,
            'email' => $user->email,
            'phone' => $user->phone,
            'is_active' => $user->is_active,
            'roles' => $user->roles->pluck('name'),
        ];
    }

    /**
     * Update an existing user with optional password hashing and role sync.
     */
    public function update(int $id, array $validated): array
    {
        $user = User::findOrFail($id);

        if (isset($validated['name'])) {
            $user->name = $validated['name'];
        }
        if (array_key_exists('surname', $validated)) {
            $user->surname = $validated['surname'];
        }
        if (isset($validated['username'])) {
            $user->username = $validated['username'];
        }
        if (isset($validated['email'])) {
            $user->email = $validated['email'];
        }
        if (array_key_exists('phone', $validated)) {
            $user->phone = $validated['phone'];
        }
        if (isset($validated['is_active'])) {
            $user->is_active = $validated['is_active'];
        }
        if (! empty($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }

        $user->save();

        if (isset($validated['roles'])) {
            $user->syncRoles($validated['roles']);
        }

        return [
            'id' => $user->id,
            'name' => $user->name,
            'surname' => $user->surname,
            'username' => $user->username,
            'email' => $user->email,
            'phone' => $user->phone,
            'is_active' => $user->is_active,
            'roles' => $user->roles->pluck('name'),
        ];
    }

    /**
     * Delete a user after self-deletion check.
     *
     * @throws \Illuminate\Http\Exceptions\HttpResponseException
     */
    public function delete(int $id, int $authUserId): void
    {
        $user = User::findOrFail($id);

        if ($user->id === $authUserId) {
            abort(403, 'Vous ne pouvez pas supprimer votre propre compte.');
        }

        $user->syncRoles([]);
        $user->delete();
    }

    /**
     * Toggle user active status with self-toggle check.
     *
     * @throws \Illuminate\Http\Exceptions\HttpResponseException
     */
    public function toggleStatus(int $id, int $authUserId): array
    {
        $user = User::findOrFail($id);

        if ($user->id === $authUserId) {
            abort(403, 'Vous ne pouvez pas désactiver votre propre compte.');
        }

        $user->is_active = ! $user->is_active;
        $user->save();

        return [
            'message' => $user->is_active ? 'Utilisateur activé.' : 'Utilisateur désactivé.',
            'data' => [
                'id' => $user->id,
                'is_active' => $user->is_active,
            ],
        ];
    }

    /**
     * Assign roles to a user.
     */
    public function assignRoles(int $id, array $roles): array
    {
        $user = User::findOrFail($id);
        $user->syncRoles($roles);

        return [
            'id' => $user->id,
            'roles' => $user->roles->pluck('name'),
        ];
    }

    /**
     * Assign direct permissions to a user.
     */
    public function assignPermissions(int $id, array $permissions): array
    {
        $user = User::findOrFail($id);
        $user->syncPermissions($permissions);

        return [
            'id' => $user->id,
            'direct_permissions' => $user->getDirectPermissions()->pluck('name'),
        ];
    }

    /**
     * Transform a user model to the standard API output format.
     */
    private function transformUser(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'surname' => $user->surname,
            'username' => $user->username,
            'email' => $user->email,
            'phone' => $user->phone,
            'is_active' => $user->is_active,
            'roles' => $user->roles->pluck('name'),
            'permissions' => $user->getAllPermissions()->pluck('name'),
            'created_at' => $user->created_at,
            'updated_at' => $user->updated_at,
        ];
    }
}
