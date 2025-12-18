<?php

namespace Database\Seeders;

use App\Models\Lan;
use Illuminate\Database\Seeder;

class LanSeeder extends Seeder
{
    public function run(): void
    {
        $lans = [
            [
                'name' => 'LAN Management',
                'vlan_id' => '1',
                'subnet' => '10.0.0.0/24',
                'gateway' => '10.0.0.254',
                'description' => 'Réseau de gestion des équipements',
                'site' => 'Datacenter Principal',
                'batiment_id' => 2,
                'salle_id' => 5,
                'status' => 'active',
            ],
            [
                'name' => 'LAN Distribution',
                'vlan_id' => '10',
                'subnet' => '10.0.1.0/24',
                'gateway' => '10.0.1.254',
                'description' => 'Réseau de distribution interne',
                'site' => 'Datacenter Principal',
                'batiment_id' => 2,
                'salle_id' => 5,
                'status' => 'active',
            ],
            [
                'name' => 'LAN Serveurs Web',
                'vlan_id' => '20',
                'subnet' => '10.0.20.0/24',
                'gateway' => '10.0.20.254',
                'description' => 'Réseau des serveurs web de production',
                'site' => 'Datacenter Principal',
                'batiment_id' => 2,
                'salle_id' => 5,
                'status' => 'active',
            ],
            [
                'name' => 'LAN Base de Données',
                'vlan_id' => '30',
                'subnet' => '10.0.30.0/24',
                'gateway' => '10.0.30.254',
                'description' => 'Réseau isolé pour les bases de données',
                'site' => 'Datacenter Principal',
                'batiment_id' => 2,
                'salle_id' => 5,
                'status' => 'active',
            ],
            [
                'name' => 'LAN Stockage SAN',
                'vlan_id' => '40',
                'subnet' => '10.0.40.0/24',
                'gateway' => '10.0.40.254',
                'description' => 'Réseau SAN pour le stockage',
                'site' => 'Datacenter Principal',
                'batiment_id' => 2,
                'salle_id' => 5,
                'status' => 'active',
            ],
            [
                'name' => 'LAN Administration',
                'vlan_id' => '50',
                'subnet' => '10.0.50.0/24',
                'gateway' => '10.0.50.254',
                'description' => 'Réseau bureautique administration',
                'site' => 'Bâtiment A',
                'batiment_id' => 1,
                'salle_id' => 1,
                'status' => 'active',
            ],
            [
                'name' => 'LAN WiFi Corporate',
                'vlan_id' => '60',
                'subnet' => '10.0.60.0/24',
                'gateway' => '10.0.60.254',
                'description' => 'Réseau WiFi entreprise',
                'site' => 'Tous bâtiments',
                'batiment_id' => 1,
                'salle_id' => null,
                'status' => 'active',
            ],
            [
                'name' => 'LAN Laboratoire R&D',
                'vlan_id' => '70',
                'subnet' => '10.0.70.0/24',
                'gateway' => '10.0.70.254',
                'description' => 'Réseau isolé pour la R&D',
                'site' => 'Bâtiment C',
                'batiment_id' => 3,
                'salle_id' => 8,
                'status' => 'active',
            ],
            [
                'name' => 'LAN Technique',
                'vlan_id' => '80',
                'subnet' => '10.0.80.0/24',
                'gateway' => '10.0.80.254',
                'description' => 'Réseau technique secondaire',
                'site' => 'Bâtiment D',
                'batiment_id' => 4,
                'salle_id' => 12,
                'status' => 'maintenance',
            ],
            [
                'name' => 'LAN DMZ',
                'vlan_id' => '99',
                'subnet' => '192.168.99.0/24',
                'gateway' => '192.168.99.254',
                'description' => 'Zone démilitarisée pour services publics',
                'site' => 'Datacenter Principal',
                'batiment_id' => 2,
                'salle_id' => 5,
                'status' => 'active',
            ],
            [
                'name' => 'LAN Utilisateurs',
                'vlan_id' => '100',
                'subnet' => '10.0.100.0/24',
                'gateway' => '10.0.100.254',
                'description' => 'Réseau des postes utilisateurs',
                'site' => 'Tous bâtiments',
                'batiment_id' => null,
                'salle_id' => null,
                'status' => 'active',
            ],
        ];

        foreach ($lans as $lan) {
            Lan::create($lan);
        }
    }
}
