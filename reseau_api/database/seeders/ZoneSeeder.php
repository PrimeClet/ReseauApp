<?php

namespace Database\Seeders;

use App\Models\Site;
use App\Models\Zone;
use Illuminate\Database\Seeder;

class ZoneSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $firstSite = Site::first();
        if (! $firstSite) {
            return;
        }

        $zones = [
            [
                'site_id' => $firstSite->id,
                'libelle' => 'Zone A',
                'description' => 'Zone principale du site',
            ],
            [
                'site_id' => $firstSite->id,
                'libelle' => 'Zone B',
                'description' => 'Zone secondaire',
            ],
        ];

        foreach ($zones as $zone) {
            Zone::create($zone);
        }
    }
}
