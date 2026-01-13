<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\User;

class RolesAndPermissionsSeeder extends Seeder
{
    /**
     * Les modules de l'application avec leurs permissions CRUD
     */
    private array $modules = [
        'utilisateurs' => ['voir', 'creer', 'modifier', 'supprimer'],
        'roles' => ['voir', 'creer', 'modifier', 'supprimer'],
        'permissions' => ['voir', 'attribuer'],
        'batiments' => ['voir', 'creer', 'modifier', 'supprimer'],
        'salles' => ['voir', 'creer', 'modifier', 'supprimer'],
        'armoires' => ['voir', 'creer', 'modifier', 'supprimer'],
        'equipements' => ['voir', 'creer', 'modifier', 'supprimer', 'importer'],
        'ports' => ['voir', 'creer', 'modifier', 'supprimer', 'restaurer'],
        'liaisons' => ['voir', 'creer', 'modifier', 'supprimer', 'restaurer'],
        'lans' => ['voir', 'creer', 'modifier', 'supprimer'],
        'maintenance' => ['voir', 'creer', 'modifier', 'supprimer'],
        'cartographie' => ['voir', 'exporter'],
        'dashboard' => ['voir', 'statistiques'],
    ];

    /**
     * Les rôles par défaut avec leurs permissions
     */
    private array $roles = [
        'Super Admin' => '*', // Toutes les permissions
        'Administrateur' => [
            'utilisateurs.voir', 'utilisateurs.creer', 'utilisateurs.modifier',
            'roles.voir',
            'permissions.voir',
            'batiments.*',
            'salles.*',
            'armoires.*',
            'equipements.*',
            'ports.*',
            'liaisons.*',
            'lans.*',
            'maintenance.*',
            'cartographie.*',
            'dashboard.*',
        ],
        'Technicien' => [
            'batiments.voir',
            'salles.voir',
            'armoires.voir', 'armoires.modifier',
            'equipements.voir', 'equipements.creer', 'equipements.modifier',
            'ports.voir', 'ports.creer', 'ports.modifier',
            'liaisons.voir', 'liaisons.creer', 'liaisons.modifier',
            'lans.voir',
            'maintenance.voir', 'maintenance.creer', 'maintenance.modifier',
            'cartographie.voir',
            'dashboard.voir',
        ],
        'Observateur' => [
            'batiments.voir',
            'salles.voir',
            'armoires.voir',
            'equipements.voir',
            'ports.voir',
            'liaisons.voir',
            'lans.voir',
            'maintenance.voir',
            'cartographie.voir',
            'dashboard.voir',
        ],
    ];

    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Créer toutes les permissions
        $allPermissions = [];
        foreach ($this->modules as $module => $actions) {
            foreach ($actions as $action) {
                $permissionName = "{$module}.{$action}";
                $permission = Permission::firstOrCreate(
                    ['name' => $permissionName, 'guard_name' => 'web'],
                    ['name' => $permissionName, 'guard_name' => 'web']
                );
                $allPermissions[$permissionName] = $permission;
            }
        }

        $this->command->info('Permissions créées: ' . count($allPermissions));

        // Créer les rôles et leur attribuer les permissions
        foreach ($this->roles as $roleName => $permissions) {
            $role = Role::firstOrCreate(
                ['name' => $roleName, 'guard_name' => 'web'],
                ['name' => $roleName, 'guard_name' => 'web']
            );

            if ($permissions === '*') {
                // Super Admin a toutes les permissions
                $role->syncPermissions(array_values($allPermissions));
                $this->command->info("Rôle '{$roleName}' créé avec TOUTES les permissions");
            } else {
                $rolePermissions = [];
                foreach ($permissions as $perm) {
                    if (str_ends_with($perm, '.*')) {
                        // Wildcard: ajouter toutes les permissions du module
                        $module = str_replace('.*', '', $perm);
                        foreach ($allPermissions as $permName => $permObj) {
                            if (str_starts_with($permName, $module . '.')) {
                                $rolePermissions[] = $permObj;
                            }
                        }
                    } elseif (isset($allPermissions[$perm])) {
                        $rolePermissions[] = $allPermissions[$perm];
                    }
                }
                $role->syncPermissions($rolePermissions);
                $this->command->info("Rôle '{$roleName}' créé avec " . count($rolePermissions) . " permissions");
            }
        }

        // Assigner le rôle Super Admin au premier utilisateur (admin par défaut)
        $adminUser = User::where('email', 'admin@reseau.local')->first();
        if ($adminUser) {
            $adminUser->assignRole('Super Admin');
            $this->command->info("Rôle 'Super Admin' assigné à l'utilisateur admin@reseau.local");
        }

        // Migrer les utilisateurs existants vers les nouveaux rôles Spatie
        $this->migrateExistingUsers();
    }

    /**
     * Migrer les utilisateurs existants avec l'ancien système de rôles
     */
    private function migrateExistingUsers(): void
    {
        $roleMapping = [
            'administrator' => 'Super Admin',
            'admin' => 'Administrateur',
            'technicien' => 'Technicien',
            'technician' => 'Technicien',
            'user' => 'Observateur',
            'observer' => 'Observateur',
            'observateur' => 'Observateur',
        ];

        $users = User::whereNotNull('role')->get();
        $migratedCount = 0;

        foreach ($users as $user) {
            $oldRole = strtolower($user->role ?? '');
            if (isset($roleMapping[$oldRole])) {
                $newRole = $roleMapping[$oldRole];
                if (!$user->hasRole($newRole)) {
                    $user->assignRole($newRole);
                    $migratedCount++;
                }
            }
        }

        if ($migratedCount > 0) {
            $this->command->info("Migration: {$migratedCount} utilisateurs migrés vers les nouveaux rôles Spatie");
        }
    }
}
