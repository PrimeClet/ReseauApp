<?php

namespace Database\Seeders;

use App\Models\Batiment;
use App\Models\Zone;
use Illuminate\Database\Seeder;

class BatimentSeeder extends Seeder
{
    public function run(): void
    {
        $firstZone = Zone::first();
        $secondZone = Zone::skip(1)->first() ?? $firstZone;

        if (! $firstZone) {
            $this->command->warn('Aucune zone trouvée. Création des bâtiments ignorée.');

            return;
        }

        $batiments = [
            [
                'nom' => 'Bâtiment A - Administration',
                'description' => 'Bâtiment principal administratif',
                'zone_id' => $firstZone->id,
            ],
            [
                'nom' => 'Bâtiment B - Technique',
                'description' => 'Bâtiment technique et datacenter',
                'zone_id' => $firstZone->id,
            ],
            [
                'nom' => 'Bâtiment C - R&D',
                'description' => 'Centre de Recherche et Développement',
                'zone_id' => $secondZone->id,
            ],
            [
                'nom' => 'Bâtiment D - Stockage',
                'description' => 'Entrepôt et stockage matériel',
                'zone_id' => $secondZone->id,
            ],
        ];

        foreach ($batiments as $batiment) {
            Batiment::create($batiment);
        }

        $this->command->info(count($batiments).' bâtiments créés.');
    }
}
