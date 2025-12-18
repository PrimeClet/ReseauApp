<?php

namespace Database\Seeders;

use App\Models\Salle;
use Illuminate\Database\Seeder;

class SalleSeeder extends Seeder
{
    public function run(): void
    {
        $salles = [
            // Bâtiment A
            ['nom' => 'Salle Serveur A1', 'etage' => '0', 'capacite' => 10, 'type' => 'Technique', 'batiment_id' => 1, 'description' => 'Salle serveur principale', 'etat' => 'Actif'],
            ['nom' => 'Bureau Direction', 'etage' => '2', 'capacite' => 15, 'type' => 'Bureau', 'batiment_id' => 1, 'description' => 'Bureaux de la direction', 'etat' => 'Actif'],
            ['nom' => 'Salle Réunion A', 'etage' => '1', 'capacite' => 30, 'type' => 'Réunion', 'batiment_id' => 1, 'description' => 'Grande salle de réunion', 'etat' => 'Actif'],
            ['nom' => 'Open Space A', 'etage' => '3', 'capacite' => 50, 'type' => 'Bureau', 'batiment_id' => 1, 'description' => 'Espace de travail ouvert', 'etat' => 'Actif'],

            // Bâtiment B
            ['nom' => 'Datacenter Principal', 'etage' => '0', 'capacite' => 5, 'type' => 'Datacenter', 'batiment_id' => 2, 'description' => 'Datacenter principal avec climatisation', 'etat' => 'Actif'],
            ['nom' => 'Salle Réseau B1', 'etage' => '1', 'capacite' => 5, 'type' => 'Technique', 'batiment_id' => 2, 'description' => 'Local technique réseau', 'etat' => 'Actif'],
            ['nom' => 'Atelier Technique', 'etage' => '2', 'capacite' => 20, 'type' => 'Atelier', 'batiment_id' => 2, 'description' => 'Atelier de maintenance', 'etat' => 'Actif'],

            // Bâtiment C
            ['nom' => 'Laboratoire R&D', 'etage' => '1', 'capacite' => 25, 'type' => 'Laboratoire', 'batiment_id' => 3, 'description' => 'Laboratoire de recherche', 'etat' => 'Actif'],
            ['nom' => 'Salle Tests', 'etage' => '2', 'capacite' => 15, 'type' => 'Laboratoire', 'batiment_id' => 3, 'description' => 'Salle de tests et validations', 'etat' => 'Actif'],
            ['nom' => 'Bureau Ingénieurs', 'etage' => '3', 'capacite' => 30, 'type' => 'Bureau', 'batiment_id' => 3, 'description' => 'Bureaux des ingénieurs', 'etat' => 'Actif'],

            // Bâtiment D
            ['nom' => 'Entrepôt Principal', 'etage' => '0', 'capacite' => 100, 'type' => 'Stockage', 'batiment_id' => 4, 'description' => 'Entrepôt de stockage matériel', 'etat' => 'Maintenance'],
            ['nom' => 'Local Technique D', 'etage' => '1', 'capacite' => 5, 'type' => 'Technique', 'batiment_id' => 4, 'description' => 'Local technique secondaire', 'etat' => 'Inactif'],
        ];

        foreach ($salles as $salle) {
            Salle::create($salle);
        }
    }
}
