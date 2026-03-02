<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class UserSeeder extends Seeder
{
    /**
     * Utilisateurs tests avec leurs rôles Spatie
     *
     * Logique:
     * - Super Admin: Accès total au système
     * - Administrateur: Crée maintenances, valide modifications
     * - Technicien: Exécute maintenances, soumet modifications (terrain)
     * - Observateur: Consultation seule
     */
    private array $users = [
        // Super Admin - Accès total
        [
            'name' => 'Super',
            'surname' => 'Admin',
            'username' => 'superadmin',
            'phone' => '+237 690 000 001',
            'email' => 'superadmin@reseau.local',
            'password' => 'SuperAdmin@2024',
            'is_active' => true,
            'spatie_role' => 'Super Admin',
        ],
        // Administrateur - Gestion maintenances et validation modifications
        [
            'name' => 'Jean',
            'surname' => 'Directeur',
            'username' => 'jean.directeur',
            'phone' => '+237 690 000 002',
            'email' => 'jean.directeur@reseau.local',
            'password' => 'Admin@2024',
            'is_active' => true,
            'spatie_role' => 'Administrateur',
        ],
        [
            'name' => 'Marie',
            'surname' => 'Gestionnaire',
            'username' => 'marie.gestionnaire',
            'phone' => '+237 690 000 003',
            'email' => 'marie.gestionnaire@reseau.local',
            'password' => 'Admin@2024',
            'is_active' => true,
            'spatie_role' => 'Administrateur',
        ],
        // Techniciens - Terrain, exécution maintenances, soumission modifications
        [
            'name' => 'Paul',
            'surname' => 'Technicien',
            'username' => 'paul.technicien',
            'phone' => '+237 690 000 004',
            'email' => 'paul.technicien@reseau.local',
            'password' => 'Tech@2024',
            'is_active' => true,
            'spatie_role' => 'Technicien',
        ],
        [
            'name' => 'Sophie',
            'surname' => 'Technicienne',
            'username' => 'sophie.technicienne',
            'phone' => '+237 690 000 005',
            'email' => 'sophie.technicienne@reseau.local',
            'password' => 'Tech@2024',
            'is_active' => true,
            'spatie_role' => 'Technicien',
        ],
        [
            'name' => 'Marc',
            'surname' => 'Installateur',
            'username' => 'marc.installateur',
            'phone' => '+237 690 000 006',
            'email' => 'marc.installateur@reseau.local',
            'password' => 'Tech@2024',
            'is_active' => true,
            'spatie_role' => 'Technicien',
        ],
        // Observateurs - Consultation seule
        [
            'name' => 'Alice',
            'surname' => 'Observatrice',
            'username' => 'alice.observatrice',
            'phone' => '+237 690 000 007',
            'email' => 'alice.observatrice@reseau.local',
            'password' => 'Obs@2024',
            'is_active' => true,
            'spatie_role' => 'Observateur',
        ],
        [
            'name' => 'Pierre',
            'surname' => 'Consultant',
            'username' => 'pierre.consultant',
            'phone' => '+237 690 000 008',
            'email' => 'pierre.consultant@reseau.local',
            'password' => 'Obs@2024',
            'is_active' => false, // Compte désactivé pour test
            'spatie_role' => 'Observateur',
        ],
    ];

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        foreach ($this->users as $userData) {
            $spatieRole = $userData['spatie_role'];
            unset($userData['spatie_role']);

            $userData['password'] = Hash::make($userData['password']);

            $user = User::firstOrCreate(
                ['email' => $userData['email']],
                $userData
            );

            // Assigner le rôle Spatie si le rôle existe
            if (Role::where('name', $spatieRole)->exists()) {
                $user->syncRoles([$spatieRole]);
                $this->command->info("Utilisateur '{$user->username}' créé avec le rôle '{$spatieRole}'");
            } else {
                $this->command->warn("Rôle '{$spatieRole}' non trouvé pour l'utilisateur '{$user->username}'");
            }
        }

        $this->command->info('');
        $this->command->info('=== Comptes de test créés ===');
        $this->command->table(
            ['Rôle', 'Email', 'Mot de passe'],
            [
                ['Super Admin', 'superadmin@reseau.local', 'SuperAdmin@2024'],
                ['Administrateur', 'jean.directeur@reseau.local', 'Admin@2024'],
                ['Technicien', 'paul.technicien@reseau.local', 'Tech@2024'],
                ['Observateur', 'alice.observatrice@reseau.local', 'Obs@2024'],
            ]
        );
    }
}
