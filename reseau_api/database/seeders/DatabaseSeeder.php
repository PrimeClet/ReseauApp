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
            UserSeeder::class,
            SiteSeeder::class,
            ZoneSeeder::class,
            BatimentSeeder::class,
            SalleSeeder::class,
            CoffretSeeder::class,
            EquipementSeeder::class,
            PortSeeder::class,
            LiaisonSeeder::class,
            LanSeeder::class,
            MaintenanceSeeder::class,
        ]);
    }
}
