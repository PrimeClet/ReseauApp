<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Permission;

class PermissionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $permissions = Permission::orderBy('name')->get();

        $grouped = $permissions->groupBy(function ($permission) {
            $parts = explode('.', $permission->name);

            return $parts[0] ?? 'other';
        });

        $data = [];
        foreach ($grouped as $module => $perms) {
            $data[] = [
                'module' => $module,
                'module_label' => $this->getModuleLabel($module),
                'permissions' => $perms->map(function ($perm) {
                    $parts = explode('.', $perm->name);

                    return [
                        'id' => $perm->id,
                        'name' => $perm->name,
                        'action' => $parts[1] ?? $perm->name,
                        'action_label' => $this->getActionLabel($parts[1] ?? ''),
                    ];
                })->values(),
            ];
        }

        return $this->successResponse([
            'grouped' => $data,
            'all_permissions' => $permissions->pluck('name'),
        ]);
    }

    public function show($id): JsonResponse
    {
        $permission = Permission::findOrFail($id);

        return $this->successResponse([
            'id' => $permission->id,
            'name' => $permission->name,
            'guard_name' => $permission->guard_name,
            'roles' => $permission->roles->pluck('name'),
            'created_at' => $permission->created_at,
        ]);
    }

    public function modules(): JsonResponse
    {
        $modules = [
            ['id' => 'utilisateurs', 'label' => 'Utilisateurs', 'icon' => 'users'],
            ['id' => 'roles', 'label' => 'Rôles', 'icon' => 'shield'],
            ['id' => 'permissions', 'label' => 'Permissions', 'icon' => 'key'],
            ['id' => 'batiments', 'label' => 'Bâtiments', 'icon' => 'building'],
            ['id' => 'salles', 'label' => 'Salles', 'icon' => 'door-open'],
            ['id' => 'armoires', 'label' => 'Armoires', 'icon' => 'server'],
            ['id' => 'equipements', 'label' => 'Équipements', 'icon' => 'hard-drive'],
            ['id' => 'ports', 'label' => 'Ports', 'icon' => 'plug'],
            ['id' => 'liaisons', 'label' => 'Liaisons', 'icon' => 'cable'],
            ['id' => 'lans', 'label' => 'LANs', 'icon' => 'network'],
            ['id' => 'maintenance', 'label' => 'Maintenance', 'icon' => 'wrench'],
            ['id' => 'cartographie', 'label' => 'Cartographie', 'icon' => 'map'],
            ['id' => 'dashboard', 'label' => 'Tableau de bord', 'icon' => 'layout-dashboard'],
        ];

        return $this->successResponse($modules);
    }

    private function getModuleLabel(string $module): string
    {
        $labels = [
            'utilisateurs' => 'Utilisateurs',
            'roles' => 'Rôles',
            'permissions' => 'Permissions',
            'batiments' => 'Bâtiments',
            'salles' => 'Salles',
            'armoires' => 'Armoires',
            'equipements' => 'Équipements',
            'ports' => 'Ports',
            'liaisons' => 'Liaisons',
            'lans' => 'LANs',
            'maintenance' => 'Maintenance',
            'cartographie' => 'Cartographie',
            'dashboard' => 'Tableau de bord',
        ];

        return $labels[$module] ?? ucfirst($module);
    }

    private function getActionLabel(string $action): string
    {
        $labels = [
            'voir' => 'Voir',
            'creer' => 'Créer',
            'modifier' => 'Modifier',
            'supprimer' => 'Supprimer',
            'restaurer' => 'Restaurer',
            'importer' => 'Importer',
            'exporter' => 'Exporter',
            'attribuer' => 'Attribuer',
            'statistiques' => 'Statistiques',
        ];

        return $labels[$action] ?? ucfirst($action);
    }
}
