<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class PermissionMiddleware
{
    /**
     * Gère une requête entrante en vérifiant qu'un utilisateur
     * authentifié dispose de l'une des permissions demandées (Spatie).
     *
     * Utilisation dans les routes :
     *  Route::middleware('permission:armoires.voir')->get(...);
     *  Route::middleware('permission:armoires.voir|equipements.voir')->get(...);
     */
    public function handle(Request $request, Closure $next, string $permissions): Response
    {
        if (! auth()->check()) {
            return response()->json(['message' => 'Non authentifié'], 401);
        }

        $user = auth()->user();

        // Parser les permissions (séparées par | ou ,)
        $permissionsArray = preg_split('/[|,]/', $permissions);
        $permissionsArray = array_map('trim', $permissionsArray);

        // Vérifier avec Spatie hasAnyPermission
        if (! $user->hasAnyPermission($permissionsArray)) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        return $next($request);
    }
}
