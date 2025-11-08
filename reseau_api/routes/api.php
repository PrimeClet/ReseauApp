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


    Route::middleware('role:administrator,directeur')->group(function () {
        Route::get('/stats/global', [StatistiqueController::class, 'globalStats']);
        Route::get('/stats/systems-by-type', [StatistiqueController::class, 'systemsByType']);
        Route::get('/stats/equipements-by-coffret', [StatistiqueController::class, 'equipementsByCoffret']);
        Route::get('/stats/ports-by-vlan', [StatistiqueController::class, 'portsByVlan']);

        // Routes pour les coffrets
        Route::get('/coffrets', [CoffretController::class, 'index']);
        Route::post('/coffrets', [CoffretController::class, 'store']);
        Route::get('/coffrets/{coffret}', [CoffretController::class, 'show']);
        Route::put('/coffrets/{coffret}', [CoffretController::class, 'update']);
        Route::delete('/coffrets/{coffret}', [CoffretController::class, 'destroy']);

        // Routes pour les équipements
        Route::get('/equipements', [EquipementsController::class, 'index']);
        Route::post('/equipements', [EquipementsController::class, 'store']);
        Route::get('/equipements/{equipement}', [EquipementsController::class, 'show']);
        Route::put('/equipements/{equipement}', [EquipementsController::class, 'update']);
        Route::delete('/equipements/{equipement}', [EquipementsController::class, 'destroy']);

        // Routes pour les ports
        Route::get('/ports', [PortController::class, 'index']);
        Route::post('/ports', [PortController::class, 'store']);
        Route::get('/ports/{port}', [PortController::class, 'show']);
        Route::put('/ports/{port}', [PortController::class, 'update']);
        Route::delete('/ports/{port}', [PortController::class, 'destroy']);

        // Routes pour les metrics
        Route::get('/metrics', [MetricController::class, 'index']);
        Route::post('/metrics', [MetricController::class, 'store']);
        Route::get('/metrics/{metric}', [MetricController::class, 'show']);
        Route::put('/metrics/{metric}', [MetricController::class, 'update']);
        Route::delete('/metrics/{metric}', [MetricController::class, 'destroy']);

        // Routes pour les liaisons
        Route::get('/liaisons', [LiaisonController::class, 'index']);
        Route::post('/liaisons', [LiaisonController::class, 'store']);
        Route::get('/liaisons/{liaison}', [LiaisonController::class, 'show']);
        Route::put('/liaisons/{liaison}', [LiaisonController::class, 'update']);
        Route::delete('/liaisons/{liaison}', [LiaisonController::class, 'destroy']);

        // Routes pour les systèmes
        Route::get('/systems', [SystemController::class, 'index']);
        Route::post('/systems', [SystemController::class, 'store']);
        Route::get('/systems/{system}', [SystemController::class, 'show']);
        Route::put('/systems/{system}', [SystemController::class, 'update']);
        Route::delete('/systems/{system}', [SystemController::class, 'destroy']);

        // Routes pour les utilisateurs
        // Route::get('/users', [UserController::class, 'index']);
        // Route::post('/users', [UserController::class, 'store']);
        // Route::get('/users/{user}', [UserController::class, 'show']);
        // Route::put('/users/{user}', [UserController::class, 'update']);
        // Route::delete('/users/{user}', [UserController::class, 'destroy']);
    });

    
   

});