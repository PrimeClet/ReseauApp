<?php

use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        apiPrefix: 'api/v1',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->alias([
            'role' => \App\Http\Middleware\RoleMiddleware::class,
            'permission' => \App\Http\Middleware\PermissionMiddleware::class,
        ]);

        // Note: statefulApi() désactivé car l'API utilise uniquement des tokens Bearer
        // Si vous voulez utiliser l'authentification par cookie (SPA sur même domaine),
        // décommentez la ligne suivante et ajoutez SANCTUM_STATEFUL_DOMAINS dans .env
        // $middleware->statefulApi();

        // Ajouter le middleware CORS, Correlation ID et logging pour les requêtes API
        $middleware->api(prepend: [
            \Illuminate\Http\Middleware\HandleCors::class,
            \App\Http\Middleware\CorrelationId::class,
            \App\Http\Middleware\LogRequests::class,
        ]);

        // Configurer la redirection pour les requêtes non authentifiées API vers une réponse JSON
        $middleware->redirectGuestsTo(function (Request $request) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return null; // Ne pas rediriger, laisser l'exception être gérée
            }

            return '/login';
        });
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Gérer les exceptions d'authentification pour les API
        $exceptions->render(function (AuthenticationException $e, Request $request) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'message' => 'Non authentifié.',
                ], 401);
            }
        });
    })->create();
