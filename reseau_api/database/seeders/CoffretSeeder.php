<?php

namespace Database\Seeders;

use App\Models\Coffret;
use Illuminate\Database\Seeder;

class CoffretSeeder extends Seeder
{
    public function run(): void
    {
        $coffrets = [
            // Datacenter Principal (Bâtiment B, Salle B1-DC)
            [
                'code' => 'COF-DC-001',
                'nom' => 'Baie Principale DC',
                'piece' => 'Datacenter Principal',
                'long' => 2.3488,
                'lat' => 48.8566,
                'status' => 'active',
                'batiment_id' => 2,
                'salle_id' => 5,
            ],
            [
                'code' => 'COF-DC-002',
                'nom' => 'Baie Serveurs Web',
                'piece' => 'Datacenter Principal',
                'long' => 2.3490,
                'lat' => 48.8567,
                'status' => 'active',
                'batiment_id' => 2,
                'salle_id' => 5,
            ],
            [
                'code' => 'COF-DC-003',
                'nom' => 'Baie Stockage SAN',
                'piece' => 'Datacenter Principal',
                'long' => 2.3492,
                'lat' => 48.8568,
                'status' => 'active',
                'batiment_id' => 2,
                'salle_id' => 5,
            ],

            // Salle Réseau B1 (Bâtiment B)
            [
                'code' => 'COF-NET-001',
                'nom' => 'Armoire Réseau Principal',
                'piece' => 'Salle Réseau B1',
                'long' => 2.3485,
                'lat' => 48.8565,
                'status' => 'active',
                'batiment_id' => 2,
                'salle_id' => 6,
            ],

            // Salle Serveur A1 (Bâtiment A)
            [
                'code' => 'COF-SRV-A01',
                'nom' => 'Armoire Admin',
                'piece' => 'Salle Serveur A1',
                'long' => 2.3480,
                'lat' => 48.8560,
                'status' => 'active',
                'batiment_id' => 1,
                'salle_id' => 1,
            ],

            // Laboratoire R&D (Bâtiment C)
            [
                'code' => 'COF-LAB-001',
                'nom' => 'Armoire Labo R&D',
                'piece' => 'Laboratoire R&D',
                'long' => 2.3495,
                'lat' => 48.8570,
                'status' => 'active',
                'batiment_id' => 3,
                'salle_id' => 8,
            ],

            // Local Technique D (en maintenance)
            [
                'code' => 'COF-TEC-D01',
                'nom' => 'Armoire Technique D',
                'piece' => 'Local Technique D',
                'long' => 2.3500,
                'lat' => 48.8575,
                'status' => 'maintenance',
                'batiment_id' => 4,
                'salle_id' => 12,
            ],
        ];

        foreach ($coffrets as $coffret) {
            Coffret::create($coffret);
        }
    }
}
