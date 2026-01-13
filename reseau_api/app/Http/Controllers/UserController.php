<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    /**
     * Liste tous les utilisateurs avec leurs rôles
     */
    public function index(Request $request)
    {
        $query = User::with('roles');

        // Recherche
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('surname', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('username', 'like', "%{$search}%");
            });
        }

        // Filtre par rôle
        if ($request->has('role')) {
            $query->whereHas('roles', function ($q) use ($request) {
                $q->where('name', $request->role);
            });
        }

        // Filtre par statut actif
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $perPage = (int) $request->get('per_page', 15);
        $perPage = $perPage > 0 && $perPage <= 100 ? $perPage : 15;

        $users = $query->orderBy('name')->paginate($perPage);

        // Transformer les données pour inclure les rôles
        $users->getCollection()->transform(function ($user) {
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
        });

        return response()->json($users);
    }

    /**
     * Affiche un utilisateur spécifique
     */
    public function show($id)
    {
        $user = User::with('roles.permissions')->findOrFail($id);

        return response()->json([
            'data' => [
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
            ]
        ]);
    }

    /**
     * Crée un nouvel utilisateur
     */
    public function store(Request $request)
    {
        // Vérifier les permissions
        if (!auth()->user()->can('utilisateurs.creer')) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'surname' => 'nullable|string|max:255',
            'username' => 'required|string|max:255|unique:users',
            'email' => 'required|string|email|max:255|unique:users',
            'phone' => 'nullable|string|max:20',
            'password' => ['required', 'confirmed', Password::defaults()],
            'is_active' => 'boolean',
            'roles' => 'nullable|array',
            'roles.*' => 'exists:roles,name',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'surname' => $validated['surname'] ?? null,
            'username' => $validated['username'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'password' => Hash::make($validated['password']),
            'is_active' => $validated['is_active'] ?? true,
        ]);

        // Assigner les rôles
        if (isset($validated['roles']) && !empty($validated['roles'])) {
            $user->syncRoles($validated['roles']);
        }

        return response()->json([
            'message' => 'Utilisateur créé avec succès.',
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'surname' => $user->surname,
                'username' => $user->username,
                'email' => $user->email,
                'phone' => $user->phone,
                'is_active' => $user->is_active,
                'roles' => $user->roles->pluck('name'),
            ]
        ], 201);
    }

    /**
     * Met à jour un utilisateur
     */
    public function update(Request $request, $id)
    {
        // Vérifier les permissions
        if (!auth()->user()->can('utilisateurs.modifier')) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'surname' => 'nullable|string|max:255',
            'username' => 'sometimes|string|max:255|unique:users,username,' . $id,
            'email' => 'sometimes|string|email|max:255|unique:users,email,' . $id,
            'phone' => 'nullable|string|max:20',
            'password' => ['nullable', 'confirmed', Password::defaults()],
            'is_active' => 'boolean',
            'roles' => 'nullable|array',
            'roles.*' => 'exists:roles,name',
        ]);

        // Mettre à jour les champs
        if (isset($validated['name'])) $user->name = $validated['name'];
        if (array_key_exists('surname', $validated)) $user->surname = $validated['surname'];
        if (isset($validated['username'])) $user->username = $validated['username'];
        if (isset($validated['email'])) $user->email = $validated['email'];
        if (array_key_exists('phone', $validated)) $user->phone = $validated['phone'];
        if (isset($validated['is_active'])) $user->is_active = $validated['is_active'];
        if (!empty($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }

        $user->save();

        // Mettre à jour les rôles si fournis
        if (isset($validated['roles'])) {
            $user->syncRoles($validated['roles']);
        }

        return response()->json([
            'message' => 'Utilisateur mis à jour avec succès.',
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'surname' => $user->surname,
                'username' => $user->username,
                'email' => $user->email,
                'phone' => $user->phone,
                'is_active' => $user->is_active,
                'roles' => $user->roles->pluck('name'),
            ]
        ]);
    }

    /**
     * Supprime un utilisateur
     */
    public function destroy($id)
    {
        // Vérifier les permissions
        if (!auth()->user()->can('utilisateurs.supprimer')) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $user = User::findOrFail($id);

        // Empêcher la suppression de son propre compte
        if ($user->id === auth()->id()) {
            return response()->json(['message' => 'Vous ne pouvez pas supprimer votre propre compte.'], 403);
        }

        // Retirer tous les rôles avant suppression
        $user->syncRoles([]);
        $user->delete();

        return response()->json([
            'message' => 'Utilisateur supprimé avec succès.'
        ]);
    }

    /**
     * Active/désactive un utilisateur
     */
    public function toggleStatus($id)
    {
        if (!auth()->user()->can('utilisateurs.modifier')) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $user = User::findOrFail($id);

        // Empêcher de se désactiver soi-même
        if ($user->id === auth()->id()) {
            return response()->json(['message' => 'Vous ne pouvez pas désactiver votre propre compte.'], 403);
        }

        $user->is_active = !$user->is_active;
        $user->save();

        return response()->json([
            'message' => $user->is_active ? 'Utilisateur activé.' : 'Utilisateur désactivé.',
            'data' => [
                'id' => $user->id,
                'is_active' => $user->is_active,
            ]
        ]);
    }

    /**
     * Assigne des rôles à un utilisateur
     */
    public function assignRoles(Request $request, $id)
    {
        if (!auth()->user()->can('roles.modifier')) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $user = User::findOrFail($id);

        $validated = $request->validate([
            'roles' => 'required|array',
            'roles.*' => 'exists:roles,name',
        ]);

        $user->syncRoles($validated['roles']);

        return response()->json([
            'message' => 'Rôles assignés avec succès.',
            'data' => [
                'id' => $user->id,
                'roles' => $user->roles->pluck('name'),
            ]
        ]);
    }

    /**
     * Assigne des permissions directes à un utilisateur
     */
    public function assignPermissions(Request $request, $id)
    {
        if (!auth()->user()->can('permissions.attribuer')) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $user = User::findOrFail($id);

        $validated = $request->validate([
            'permissions' => 'required|array',
            'permissions.*' => 'exists:permissions,name',
        ]);

        $user->syncPermissions($validated['permissions']);

        return response()->json([
            'message' => 'Permissions assignées avec succès.',
            'data' => [
                'id' => $user->id,
                'direct_permissions' => $user->getDirectPermissions()->pluck('name'),
            ]
        ]);
    }
}
