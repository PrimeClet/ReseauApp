<?php

namespace App\Services;

use Spatie\Permission\Models\Permission;

class PermissionService
{
    /**
     * List all permissions grouped by module with labels.
     */
    public function listGroupedByModule(): array
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

        return [
            'data' => $data,
            'all_permissions' => $permissions->pluck('name'),
        ];
    }

    /**
     * Get a single permission with its associated roles.
     */
    public function show(int $id): array
    {
        $permission = Permission::findOrFail($id);

        return [
            'id' => $permission->id,
            'name' => $permission->name,
            'guard_name' => $permission->guard_name,
            'roles' => $permission->roles->pluck('name'),
            'created_at' => $permission->created_at,
        ];
    }

    /**
     * Get the static list of available modules.
     */
    public function getModules(): array
    {
        return [
            ['id' => 'utilisateurs', 'label' => 'Utilisateurs', 'icon' => 'users'],
            ['id' => 'roles', 'label' => 'Roles', 'icon' => 'shield'],
            ['id' => 'permissions', 'label' => 'Permissions', 'icon' => 'key'],
            ['id' => 'batiments', 'label' => 'Batiments', 'icon' => 'building'],
            ['id' => 'salles', 'label' => 'Salles', 'icon' => 'door-open'],
            ['id' => 'armoires', 'label' => 'Armoires', 'icon' => 'server'],
            ['id' => 'equipements', 'label' => 'Equipements', 'icon' => 'hard-drive'],
            ['id' => 'ports', 'label' => 'Ports', 'icon' => 'plug'],
            ['id' => 'liaisons', 'label' => 'Liaisons', 'icon' => 'cable'],
            ['id' => 'lans', 'label' => 'LANs', 'icon' => 'network'],
            ['id' => 'maintenance', 'label' => 'Maintenance', 'icon' => 'wrench'],
            ['id' => 'cartographie', 'label' => 'Cartographie', 'icon' => 'map'],
            ['id' => 'dashboard', 'label' => 'Tableau de bord', 'icon' => 'layout-dashboard'],
        ];
    }

    /**
     * Get the French label for a module.
     */
    private function getModuleLabel(string $module): string
    {
        $labels = [
            'utilisateurs' => 'Utilisateurs',
            'roles' => 'Roles',
            'permissions' => 'Permissions',
            'batiments' => 'Batiments',
            'salles' => 'Salles',
            'armoires' => 'Armoires',
            'equipements' => 'Equipements',
            'ports' => 'Ports',
            'liaisons' => 'Liaisons',
            'lans' => 'LANs',
            'maintenance' => 'Maintenance',
            'cartographie' => 'Cartographie',
            'dashboard' => 'Tableau de bord',
        ];

        return $labels[$module] ?? ucfirst($module);
    }

    /**
     * Get the French label for an action.
     */
    private function getActionLabel(string $action): string
    {
        $labels = [
            'voir' => 'Voir',
            'creer' => 'Creer',
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
