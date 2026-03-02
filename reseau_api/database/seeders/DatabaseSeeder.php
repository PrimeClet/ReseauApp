<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            // 1. Rôles et permissions en premier (requis pour les utilisateurs)
            RolesAndPermissionsSeeder::class,
            // 2. Utilisateurs avec leurs rôles
            UserSeeder::class,
            // 3. Hiérarchie géographique
            SiteSeeder::class,
            ZoneSeeder::class,
            BatimentSeeder::class,
            SalleSeeder::class,
            // 4. Infrastructure réseau
            CoffretSeeder::class,
            EquipementSeeder::class,
            PortSeeder::class,
            LiaisonSeeder::class,
            LanSeeder::class,
            // 5. Opérations
            MaintenanceSeeder::class,
        ]);
    }
}
