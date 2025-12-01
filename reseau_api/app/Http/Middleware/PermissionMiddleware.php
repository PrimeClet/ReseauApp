<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class PermissionMiddleware
{
    /**
     * Gère une requête entrante en vérifiant qu'un utilisateur
     * authentifié dispose de la permission demandée.
     *
     * Utilisation dans les routes :
     *  Route::middleware(['auth:sanctum', 'permission:view_inventory'])->get(...);
     */
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        if (!auth()->check()) {
            return response()->json(['message' => 'Non authentifié'], 401);
        }

        $user = auth()->user();
        $role = $user->role ?? null;

        if (!$role) {
            return response()->json(['message' => 'Rôle non défini pour cet utilisateur'], 403);
        }

        $permissionsForRole = config('permissions.roles.' . $role, []);

        if (!in_array($permission, $permissionsForRole, true)) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        return $next($request);
    }
}


