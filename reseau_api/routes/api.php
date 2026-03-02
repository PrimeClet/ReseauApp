<?php

use App\Http\Controllers\ActivityLogController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BatimentController;
use App\Http\Controllers\CartographyController;
use App\Http\Controllers\CoffretController;
use App\Http\Controllers\EquipementsController;
use App\Http\Controllers\ImportController;
use App\Http\Controllers\LanController;
use App\Http\Controllers\LiaisonController;
use App\Http\Controllers\MaintenanceController;
use App\Http\Controllers\MetricController;
use App\Http\Controllers\ModificationController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PermissionController;
use App\Http\Controllers\PortController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\SalleController;
use App\Http\Controllers\SiteController;
use App\Http\Controllers\StatistiqueController;
use App\Http\Controllers\SystemController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ZoneController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:login');

Route::get('/', function () {
    return response()->json([
        'name' => 'Reseau Inventaire App API',
        'Version' => '1.0.0',
        'Decription' => 'api du Reseau Inventaire realisé par JOBS-Conseil',
    ]);
});

Route::middleware(['auth:sanctum', 'throttle:api'])->group(function () {

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

    // Toutes les routes suivantes nécessitent un rôle avec accès étendu
    // Rôles Spatie: Super Admin, Administrateur, Technicien, Observateur
    Route::middleware('role:Super Admin|Administrateur|Technicien|Observateur')->group(function () {

        // Statistiques globales (lecture seule)
        Route::middleware('permission:dashboard.statistiques')->group(function () {
            Route::get('/stats/global', [StatistiqueController::class, 'globalStats']);
            Route::get('/stats/systems-by-type', [StatistiqueController::class, 'systemsByType']);
            Route::get('/stats/equipements-by-coffret', [StatistiqueController::class, 'equipementsByCoffret']);
            Route::get('/stats/ports-by-vlan', [StatistiqueController::class, 'portsByVlan']);
            Route::get('/stats/modifications', [StatistiqueController::class, 'modificationsStats']);
        });

        // INVENTAIRE : lecture (toutes les routes de lecture)
        Route::middleware('permission:armoires.voir|equipements.voir|ports.voir|dashboard.voir')->group(function () {
            // Coffrets
            Route::get('/coffrets', [CoffretController::class, 'index']);
            Route::get('/coffrets/{coffret}', [CoffretController::class, 'show']);
            Route::get('/coffrets/{coffret}/photo', [CoffretController::class, 'photo']);

            // Équipements
            Route::get('/equipements', [EquipementsController::class, 'index']);
            Route::get('/equipements/find-by-code', [EquipementsController::class, 'findByCode']);
            Route::get('/equipements/manageable-switches', [EquipementsController::class, 'getManageableSwitches']);
            Route::get('/equipements/{equipement}', [EquipementsController::class, 'show']);
            Route::get('/equipements/{equipement}/dependency-chain', [EquipementsController::class, 'getDependencyChain']);
            Route::get('/equipements/{equipement}/impact-analysis', [EquipementsController::class, 'getImpactAnalysis']);
            Route::get('/equipements/{equipement}/vlans', [EquipementsController::class, 'getVlans']);
            Route::get('/coffrets/{coffretId}/principal-switch', [EquipementsController::class, 'getPrincipalSwitch']);

            // Prises murales
            Route::get('/prises-murales', [EquipementsController::class, 'getPrisesMurales']);
            Route::get('/prises-murales/stats', [EquipementsController::class, 'getPrisesMuralesStats']);

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
            Route::get('/sites/trashed', [SiteController::class, 'trashed']);
            Route::get('/sites/{site}', [SiteController::class, 'show']);

            // Zones
            Route::get('/zones', [ZoneController::class, 'index']);
            Route::get('/zones/trashed', [ZoneController::class, 'trashed']);
            Route::get('/zones/{zone}', [ZoneController::class, 'show']);

            // Modifications
            Route::get('/modifications', [ModificationController::class, 'index']);

            // Validation des modifications (administrateurs uniquement) - DOIT être avant /modifications/{modification}
            Route::get('/modifications/pending', [ModificationController::class, 'pending'])->middleware('role:Super Admin|Administrateur');
            Route::post('/modifications/{modification}/approve', [ModificationController::class, 'approve'])->middleware('role:Super Admin|Administrateur');
            Route::post('/modifications/{modification}/reject', [ModificationController::class, 'reject'])->middleware('role:Super Admin|Administrateur');
            Route::post('/modifications/{modification}/request-more-info', [ModificationController::class, 'requestMoreInfo'])->middleware('role:Super Admin|Administrateur');

            Route::get('/modifications/{modification}', [ModificationController::class, 'show']);
            Route::get('/modifications/{modification}/photo/avant', [ModificationController::class, 'photoAvant']);
            Route::get('/modifications/{modification}/photo/apres', [ModificationController::class, 'photoApres']);

            // Historique des modifications par coffret
            Route::get('/coffrets/{coffret}/history', [ModificationController::class, 'history']);
            Route::get('/coffrets/{coffret}/history/export/csv', [ModificationController::class, 'exportHistoryCsv']);
            Route::get('/coffrets/{coffret}/history/export/pdf', [ModificationController::class, 'exportHistoryPdf']);

            // Rollback
            Route::post('/modifications/{modification}/rollback', [ModificationController::class, 'rollback'])->middleware('role:Super Admin|Administrateur');
        });

        // INVENTAIRE : écriture (création / modification / suppression)
        // Accessible aux rôles qui peuvent créer/modifier
        Route::middleware('permission:armoires.creer|equipements.creer|ports.creer')->group(function () {
            // Coffrets
            Route::post('/coffrets', [CoffretController::class, 'store']);
            Route::put('/coffrets/{coffret}', [CoffretController::class, 'update']);
            Route::delete('/coffrets/{coffret}', [CoffretController::class, 'destroy']);
            Route::post('/coffrets/{id}/restore', [CoffretController::class, 'restore']);
            Route::post('/coffrets/import', [CoffretController::class, 'import']);

            // Équipements
            Route::post('/equipements', [EquipementsController::class, 'store']);
            Route::put('/equipements/{equipement}', [EquipementsController::class, 'update']);
            Route::delete('/equipements/{equipement}', [EquipementsController::class, 'destroy']);
            Route::post('/equipements/{equipement}/set-principal', [EquipementsController::class, 'setAsPrincipal']);
            // VLANs des équipements (switchs manageables)
            Route::post('/equipements/{equipement}/vlans', [EquipementsController::class, 'attachVlan']);
            Route::put('/equipements/{equipement}/vlans', [EquipementsController::class, 'updateVlanConfig']);
            Route::delete('/equipements/{equipement}/vlans', [EquipementsController::class, 'detachVlan']);

            // Prises murales
            Route::post('/prises-murales/bulk', [EquipementsController::class, 'storePrisesMuralesBulk']);
            Route::post('/prises-murales', [EquipementsController::class, 'storePriseMurale']);
            Route::put('/prises-murales/{equipement}', [EquipementsController::class, 'updatePriseMurale']);
            Route::delete('/prises-murales/{equipement}', [EquipementsController::class, 'destroy']);

            // Ports
            Route::post('/ports', [PortController::class, 'store']);
            Route::put('/ports/{port}', [PortController::class, 'update']);
            Route::delete('/ports/{port}', [PortController::class, 'destroy']);
            Route::post('/ports/{id}/restore', [PortController::class, 'restore']);

            // Metrics
            Route::post('/metrics', [MetricController::class, 'store']);
            Route::put('/metrics/{metric}', [MetricController::class, 'update']);
            Route::delete('/metrics/{metric}', [MetricController::class, 'destroy']);

            // Liaisons
            Route::post('/liaisons', [LiaisonController::class, 'store']);
            Route::put('/liaisons/{liaison}', [LiaisonController::class, 'update']);
            Route::delete('/liaisons/{liaison}', [LiaisonController::class, 'destroy']);
            Route::post('/liaisons/{id}/restore', [LiaisonController::class, 'restore']);

            // Systèmes
            Route::post('/systems', [SystemController::class, 'store']);
            Route::put('/systems/{system}', [SystemController::class, 'update']);
            Route::delete('/systems/{system}', [SystemController::class, 'destroy']);

            // Bâtiments
            Route::post('/batiments', [BatimentController::class, 'store']);
            Route::put('/batiments/{batiment}', [BatimentController::class, 'update']);
            Route::delete('/batiments/{batiment}', [BatimentController::class, 'destroy']);
            Route::post('/batiments/{id}/restore', [BatimentController::class, 'restore']);
            Route::delete('/batiments/{id}/force', [BatimentController::class, 'forceDelete']);
            Route::post('/batiments/import', [BatimentController::class, 'import']);

            // Salles
            Route::post('/salles', [SalleController::class, 'store']);
            Route::put('/salles/{salle}', [SalleController::class, 'update']);
            Route::delete('/salles/{salle}', [SalleController::class, 'destroy']);
            Route::post('/salles/{id}/restore', [SalleController::class, 'restore']);
            Route::post('/salles/import', [SalleController::class, 'import']);

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
            Route::post('/sites/{id}/restore', [SiteController::class, 'restore']);
            Route::delete('/sites/{id}/force', [SiteController::class, 'forceDelete']);

            // Zones
            Route::post('/zones', [ZoneController::class, 'store']);
            Route::put('/zones/{zone}', [ZoneController::class, 'update']);
            Route::delete('/zones/{zone}', [ZoneController::class, 'destroy']);
            Route::post('/zones/{id}/restore', [ZoneController::class, 'restore']);
            Route::delete('/zones/{id}/force', [ZoneController::class, 'forceDelete']);

            // Modifications
            Route::post('/modifications', [ModificationController::class, 'store']);
            Route::put('/modifications/{modification}', [ModificationController::class, 'update']);
            Route::delete('/modifications/{modification}', [ModificationController::class, 'destroy']);
        });

        // Routes pour la cartographie (LANs)
        Route::middleware('permission:cartographie.voir')->group(function () {
            Route::get('/cartography/lans', [CartographyController::class, 'index']);
            Route::get('/cartography/lans/{id}', [CartographyController::class, 'show']);
            Route::get('/cartography/topology', [CartographyController::class, 'getTopology']);
            Route::get('/cartography/batiments', [CartographyController::class, 'getBatiments']);
            Route::get('/cartography/salles', [CartographyController::class, 'getSalles']);
        });

        // Import CSV
        Route::middleware('permission:equipements.importer')->group(function () {
            Route::post('/import', [ImportController::class, 'import']);
            Route::get('/import/template/{type}', [ImportController::class, 'template']);
        });

        // Gestion des utilisateurs
        Route::get('/users', [UserController::class, 'index']);
        Route::get('/users/{id}', [UserController::class, 'show']);
        Route::post('/users', [UserController::class, 'store']);
        Route::put('/users/{id}', [UserController::class, 'update']);
        Route::delete('/users/{id}', [UserController::class, 'destroy']);
        Route::post('/users/{id}/toggle-status', [UserController::class, 'toggleStatus']);
        Route::post('/users/{id}/roles', [UserController::class, 'assignRoles']);
        Route::post('/users/{id}/permissions', [UserController::class, 'assignPermissions']);

        // Gestion des rôles
        Route::get('/roles', [RoleController::class, 'index']);
        Route::get('/roles/{id}', [RoleController::class, 'show']);
        Route::post('/roles', [RoleController::class, 'store']);
        Route::put('/roles/{id}', [RoleController::class, 'update']);
        Route::delete('/roles/{id}', [RoleController::class, 'destroy']);
        Route::post('/roles/{id}/permissions', [RoleController::class, 'assignPermissions']);

        // Gestion des permissions
        Route::get('/permissions', [PermissionController::class, 'index']);
        Route::get('/permissions/modules', [PermissionController::class, 'modules']);
        Route::get('/permissions/{id}', [PermissionController::class, 'show']);

        // Logs d'activité (admin uniquement)
        Route::get('/activity-logs', [ActivityLogController::class, 'index']);
        Route::get('/activity-logs/stats', [ActivityLogController::class, 'stats']);
        Route::get('/activity-logs/{id}', [ActivityLogController::class, 'show']);
        Route::get('/activity-logs/model/{modelType}/{modelId}', [ActivityLogController::class, 'modelLogs']);
        Route::post('/activity-logs/cleanup', [ActivityLogController::class, 'cleanup']);
    });
});
