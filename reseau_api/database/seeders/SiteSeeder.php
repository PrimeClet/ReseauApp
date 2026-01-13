<?php

namespace Database\Seeders;

use App\Models\Site;
use Illuminate\Database\Seeder;

class SiteSeeder extends Seeder
{
    public function run(): void
    {
        $sites = [
            [
                'libelle' => 'Site Principal - Paris',
                'description' => 'Site principal situé à Paris, centre administratif et technique',
            ],
            [
                'libelle' => 'Site Secondaire - Lyon',
                'description' => 'Site secondaire à Lyon pour la redondance et le backup',
            ],
            [
                'libelle' => 'Site Tertiaire - Marseille',
                'description' => 'Site tertiaire à Marseille pour les opérations régionales',
            ],
        ];

        foreach ($sites as $site) {
            Site::create($site);
        }
    }
}
