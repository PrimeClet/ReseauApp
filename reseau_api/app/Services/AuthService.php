<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class AuthService
{
    /**
     * Role name mapping for frontend compatibility.
     */
    private const ROLE_MAPPING = [
        'Super Admin' => 'administrator',
        'Administrateur' => 'administrator',
        'Technicien' => 'technicien',
        'Observateur' => 'observateur',
    ];

    /**
     * Attempt to log in a user with the given credentials.
     *
     * @return array{success: bool, data: array, message: string}
     */
    public function login(string $identifier, string $password): array
    {
        Log::info("Login attempt for: {$identifier}");

        $isEmail = filter_var($identifier, FILTER_VALIDATE_EMAIL);

        $user = User::where(function ($query) use ($identifier, $isEmail) {
            if ($isEmail) {
                $query->where('email', $identifier);
            } else {
                $query->where('username', $identifier);
            }
        })
            ->where('is_active', true)
            ->first();

        Log::info($user);

        if (! $user || ! Hash::check($password, $user->password)) {
            Log::info('dedans');

            return [
                'success' => false,
                'data' => [],
                'message' => 'Les informations d\'identification fournies sont incorrectes.',
            ];
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        Log::info($token);

        ActivityLog::log(
            'login',
            "Connexion réussie de l'utilisateur {$user->name}",
            'App\\Models\\User',
            $user->id
        );

        $user->load('roles.permissions');

        return [
            'success' => true,
            'data' => [
                'user' => $this->formatUserWithRole($user),
                'token' => $token,
            ],
            'message' => 'Connexion réussie',
        ];
    }

    /**
     * Log out the current user by revoking their token.
     */
    public function logout(User $user): void
    {
        ActivityLog::log(
            'logout',
            "Déconnexion de l'utilisateur {$user->name}",
            'App\\Models\\User',
            $user->id
        );

        $user->currentAccessToken()->delete();
    }

    /**
     * Get the authenticated user's profile with roles and permissions.
     */
    public function getProfile(User $user): array
    {
        $user->load('roles.permissions');

        return $this->formatUserWithRole($user);
    }

    /**
     * Format a user with legacy role mapping and permissions.
     */
    private function formatUserWithRole(User $user): array
    {
        $primaryRole = $user->roles->first()?->name ?? 'user';
        $legacyRole = self::ROLE_MAPPING[$primaryRole] ?? 'user';

        return [
            'id' => $user->id,
            'name' => $user->name,
            'surname' => $user->surname,
            'username' => $user->username,
            'email' => $user->email,
            'phone' => $user->phone,
            'is_active' => $user->is_active,
            'role' => $legacyRole,
            'roles' => $user->roles->pluck('name'),
            'permissions' => $user->getAllPermissions()->pluck('name'),
        ];
    }
}
