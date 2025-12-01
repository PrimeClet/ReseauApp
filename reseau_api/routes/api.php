<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\StatistiqueController;
use App\Http\Controllers\CoffretController;
use App\Http\Controllers\EquipementsController;
use App\Http\Controllers\PortController;
use App\Http\Controllers\MetricController;
use App\Http\Controllers\LiaisonController;
use App\Http\Controllers\SystemController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\CartographyController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::post('/auth/login', [AuthController::class, 'login']);

Route::get('/', function(){
    return response()->json([
        'name' => 'Reseau Inventaire App API',
        'Version' => '1.0.0',
        'Decription' => 'api du Reseau Inventaire realisé par JOBS-Conseil'
    ]);
});

Route::middleware('auth:sanctum')->group(function () {

    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    // Toutes les routes suivantes nécessitent un rôle (administrator ou directeur)
    Route::middleware('role:administrator,directeur')->group(function () {

        // Statistiques globales (lecture seule)
        Route::middleware('permission:view_stats')->group(function () {
            Route::get('/stats/global', [StatistiqueController::class, 'globalStats']);
            Route::get('/stats/systems-by-type', [StatistiqueController::class, 'systemsByType']);
            Route::get('/stats/equipements-by-coffret', [StatistiqueController::class, 'equipementsByCoffret']);
            Route::get('/stats/ports-by-vlan', [StatistiqueController::class, 'portsByVlan']);
        });

        // INVENTAIRE : lecture
        Route::middleware('permission:view_inventory')->group(function () {
            // Coffrets
            Route::get('/coffrets', [CoffretController::class, 'index']);
            Route::get('/coffrets/{coffret}', [CoffretController::class, 'show']);

            // Équipements
            Route::get('/equipements', [EquipementsController::class, 'index']);
            Route::get('/equipements/{equipement}', [EquipementsController::class, 'show']);

            // Ports
            Route::get('/ports', [PortController::class, 'index']);
            Route::get('/ports/{port}', [PortController::class, 'show']);

            // Metrics
            Route::get('/metrics', [MetricController::class, 'index']);
            Route::get('/metrics/{metric}', [MetricController::class, 'show']);

            // Liaisons
            Route::get('/liaisons', [LiaisonController::class, 'index']);
            Route::get('/liaisons/{liaison}', [LiaisonController::class, 'show']);

            // Systèmes
            Route::get('/systems', [SystemController::class, 'index']);
            Route::get('/systems/{system}', [SystemController::class, 'show']);
        });

        // INVENTAIRE : écriture (création / modification / suppression)
        Route::middleware('permission:manage_inventory')->group(function () {
            // Coffrets
            Route::post('/coffrets', [CoffretController::class, 'store']);
            Route::put('/coffrets/{coffret}', [CoffretController::class, 'update']);
            Route::delete('/coffrets/{coffret}', [CoffretController::class, 'destroy']);

            // Équipements
            Route::post('/equipements', [EquipementsController::class, 'store']);
            Route::put('/equipements/{equipement}', [EquipementsController::class, 'update']);
            Route::delete('/equipements/{equipement}', [EquipementsController::class, 'destroy']);

            // Ports
            Route::post('/ports', [PortController::class, 'store']);
            Route::put('/ports/{port}', [PortController::class, 'update']);
            Route::delete('/ports/{port}', [PortController::class, 'destroy']);

            // Metrics
            Route::post('/metrics', [MetricController::class, 'store']);
            Route::put('/metrics/{metric}', [MetricController::class, 'update']);
            Route::delete('/metrics/{metric}', [MetricController::class, 'destroy']);

            // Liaisons
            Route::post('/liaisons', [LiaisonController::class, 'store']);
            Route::put('/liaisons/{liaison}', [LiaisonController::class, 'update']);
            Route::delete('/liaisons/{liaison}', [LiaisonController::class, 'destroy']);

            // Systèmes
            Route::post('/systems', [SystemController::class, 'store']);
            Route::put('/systems/{system}', [SystemController::class, 'update']);
            Route::delete('/systems/{system}', [SystemController::class, 'destroy']);
        });

        // Exemple futur : routes pour la cartographie (LANs)
        Route::middleware('permission:view_cartography')->group(function () {
            Route::get('/cartography/lans', [CartographyController::class, 'index']);
            Route::get('/cartography/lans/{id}', [CartographyController::class, 'show']);
        });

        // Routes pour les utilisateurs (à activer si nécessaire)
        // Route::middleware('permission:manage_users')->group(function () {
        //     Route::get('/users', [UserController::class, 'index']);
        //     Route::post('/users', [UserController::class, 'store']);
        //     Route::get('/users/{user}', [UserController::class, 'show']);
        //     Route::put('/users/{user}', [UserController::class, 'update']);
        //     Route::delete('/users/{user}', [UserController::class, 'destroy']);
        // });
    });
});