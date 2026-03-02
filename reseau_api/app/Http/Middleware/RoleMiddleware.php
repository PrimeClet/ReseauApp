<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     * Vérifie si l'utilisateur a l'un des rôles Spatie spécifiés.
     *
     * Usage: middleware('role:Super Admin|Administrateur|Technicien')
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $roles): Response
    {
        if (! auth()->check()) {
            return response()->json(['message' => 'Non authentifié'], 401);
        }

        $user = auth()->user();

        // Parser les rôles (séparés par | ou ,)
        $rolesArray = preg_split('/[|,]/', $roles);
        $rolesArray = array_map('trim', $rolesArray);

        // Vérifier avec Spatie hasAnyRole
        if (! $user->hasAnyRole($rolesArray)) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        return $next($request);
    }
}
