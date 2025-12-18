<?php

namespace Database\Seeders;

use App\Models\Batiment;
use Illuminate\Database\Seeder;

class BatimentSeeder extends Seeder
{
    public function run(): void
    {
        $batiments = [
            [
                'nom' => 'Bâtiment A - Administration',
                'adresse' => '10 Rue de la République',
                'ville' => 'Paris',
                'code_postal' => '75001',
                'description' => 'Bâtiment principal administratif',
                'etat' => 'Actif',
            ],
            [
                'nom' => 'Bâtiment B - Technique',
                'adresse' => '12 Rue de la République',
                'ville' => 'Paris',
                'code_postal' => '75001',
                'description' => 'Bâtiment technique et datacenter',
                'etat' => 'Actif',
            ],
            [
                'nom' => 'Bâtiment C - R&D',
                'adresse' => '15 Avenue des Sciences',
                'ville' => 'Paris',
                'code_postal' => '75002',
                'description' => 'Centre de Recherche et Développement',
                'etat' => 'Actif',
            ],
            [
                'nom' => 'Bâtiment D - Stockage',
                'adresse' => '20 Rue du Commerce',
                'ville' => 'Paris',
                'code_postal' => '75003',
                'description' => 'Entrepôt et stockage matériel',
                'etat' => 'Maintenance',
            ],
        ];

        foreach ($batiments as $batiment) {
            Batiment::create($batiment);
        }
    }
}
