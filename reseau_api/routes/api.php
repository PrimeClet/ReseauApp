<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\StatistiqueController;
use App\Http\Controllers\CoffretController;
use App\Http\Controllers\EquipementsController;
use App\Http\Controllers\PortController;
use App\Http\Controllers\MetricController;
use App\Http\Controllers\LiaisonController;
use App\Http\Controllers\SystemController;
use App\Http\Controllers\BatimentController;
use App\Http\Controllers\SalleController;
use App\Http\Controllers\LanController;
use App\Http\Controllers\MaintenanceController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\CartographyController;
use App\Http\Controllers\ImportController;
use App\Http\Controllers\SiteController;
use App\Http\Controllers\ZoneController;
use App\Http\Controllers\ModificationController;
use App\Http\Controllers\NotificationController;
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

    // Notifications (accessible à tous les utilisateurs authentifiés)
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::get('/notifications/unread', [NotificationController::class, 'unread']);
    Route::post('/notifications/{notification}/read', [NotificationController::class, 'markAsRead']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::get('/notifications/{notification}', [NotificationController::class, 'show']);
    Route::delete('/notifications/{notification}', [NotificationController::class, 'destroy']);

    // Toutes les routes suivantes nécessitent un rôle (administrator ou directeur)
    Route::middleware('role:administrator,directeur')->group(function () {

        // Statistiques globales (lecture seule)
        Route::middleware('permission:view_stats')->group(function () {
            Route::get('/stats/global', [StatistiqueController::class, 'globalStats']);
            Route::get('/stats/systems-by-type', [StatistiqueController::class, 'systemsByType']);
            Route::get('/stats/equipements-by-coffret', [StatistiqueController::class, 'equipementsByCoffret']);
            Route::get('/stats/ports-by-vlan', [StatistiqueController::class, 'portsByVlan']);
            Route::get('/stats/modifications', [StatistiqueController::class, 'modificationsStats']);
        });

        // INVENTAIRE : lecture
        Route::middleware('permission:view_inventory')->group(function () {
            // Coffrets
            Route::get('/coffrets', [CoffretController::class, 'index']);
            Route::get('/coffrets/{coffret}', [CoffretController::class, 'show']);
            Route::get('/coffrets/{coffret}/photo', [CoffretController::class, 'photo']);

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

            // Bâtiments
            Route::get('/batiments', [BatimentController::class, 'index']);
            Route::get('/batiments/{batiment}', [BatimentController::class, 'show']);

            // Salles
            Route::get('/salles', [SalleController::class, 'index']);
            Route::get('/salles/{salle}', [SalleController::class, 'show']);

            // LANs
            Route::get('/lans', [LanController::class, 'index']);
            Route::get('/lans/{lan}', [LanController::class, 'show']);

            // Maintenances
            Route::get('/maintenances', [MaintenanceController::class, 'index']);
            Route::get('/maintenances/{maintenance}', [MaintenanceController::class, 'show']);

            // Sites
            Route::get('/sites', [SiteController::class, 'index']);
            Route::get('/sites/{site}', [SiteController::class, 'show']);

            // Zones
            Route::get('/zones', [ZoneController::class, 'index']);
            Route::get('/zones/{zone}', [ZoneController::class, 'show']);

            // Modifications
            Route::get('/modifications', [ModificationController::class, 'index']);
            
            // Validation des modifications (administrateurs uniquement) - DOIT être avant /modifications/{modification}
            Route::get('/modifications/pending', [ModificationController::class, 'pending'])->middleware('role:administrator');
            Route::post('/modifications/{modification}/approve', [ModificationController::class, 'approve'])->middleware('role:administrator');
            Route::post('/modifications/{modification}/reject', [ModificationController::class, 'reject'])->middleware('role:administrator');
            Route::post('/modifications/{modification}/request-more-info', [ModificationController::class, 'requestMoreInfo'])->middleware('role:administrator');
            
            Route::get('/modifications/{modification}', [ModificationController::class, 'show']);
            Route::get('/modifications/{modification}/photo/avant', [ModificationController::class, 'photoAvant']);
            Route::get('/modifications/{modification}/photo/apres', [ModificationController::class, 'photoApres']);
            
            // Historique des modifications par coffret
            Route::get('/coffrets/{coffret}/history', [ModificationController::class, 'history']);
            Route::get('/coffrets/{coffret}/history/export/csv', [ModificationController::class, 'exportHistoryCsv']);
            Route::get('/coffrets/{coffret}/history/export/pdf', [ModificationController::class, 'exportHistoryPdf']);
            
            // Rollback
            Route::post('/modifications/{modification}/rollback', [ModificationController::class, 'rollback'])->middleware('role:administrator,directeur');
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

            // Bâtiments
            Route::post('/batiments', [BatimentController::class, 'store']);
            Route::put('/batiments/{batiment}', [BatimentController::class, 'update']);
            Route::delete('/batiments/{batiment}', [BatimentController::class, 'destroy']);

            // Salles
            Route::post('/salles', [SalleController::class, 'store']);
            Route::put('/salles/{salle}', [SalleController::class, 'update']);
            Route::delete('/salles/{salle}', [SalleController::class, 'destroy']);

            // LANs
            Route::post('/lans', [LanController::class, 'store']);
            Route::put('/lans/{lan}', [LanController::class, 'update']);
            Route::delete('/lans/{lan}', [LanController::class, 'destroy']);

            // Maintenances
            Route::post('/maintenances', [MaintenanceController::class, 'store']);
            Route::put('/maintenances/{maintenance}', [MaintenanceController::class, 'update']);
            Route::delete('/maintenances/{maintenance}', [MaintenanceController::class, 'destroy']);

            // Sites
            Route::post('/sites', [SiteController::class, 'store']);
            Route::put('/sites/{site}', [SiteController::class, 'update']);
            Route::delete('/sites/{site}', [SiteController::class, 'destroy']);

            // Zones
            Route::post('/zones', [ZoneController::class, 'store']);
            Route::put('/zones/{zone}', [ZoneController::class, 'update']);
            Route::delete('/zones/{zone}', [ZoneController::class, 'destroy']);

            // Modifications
            Route::post('/modifications', [ModificationController::class, 'store']);
            Route::put('/modifications/{modification}', [ModificationController::class, 'update']);
            Route::delete('/modifications/{modification}', [ModificationController::class, 'destroy']);
        });

        // Exemple futur : routes pour la cartographie (LANs)
        Route::middleware('permission:view_cartography')->group(function () {
            Route::get('/cartography/lans', [CartographyController::class, 'index']);
            Route::get('/cartography/lans/{id}', [CartographyController::class, 'show']);
            Route::get('/cartography/topology', [CartographyController::class, 'getTopology']);
            Route::get('/cartography/batiments', [CartographyController::class, 'getBatiments']);
            Route::get('/cartography/salles', [CartographyController::class, 'getSalles']);
        });

        // Import CSV
        Route::middleware('permission:manage_inventory')->group(function () {
            Route::post('/import', [ImportController::class, 'import']);
            Route::get('/import/template/{type}', [ImportController::class, 'template']);
        });

        // Import CSV
        Route::middleware('permission:manage_inventory')->group(function () {
            Route::post('/import', [ImportController::class, 'import']);
            Route::get('/import/template/{type}', [ImportController::class, 'template']);
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