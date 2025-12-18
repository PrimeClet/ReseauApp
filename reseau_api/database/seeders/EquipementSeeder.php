<?php

namespace Database\Seeders;

use App\Models\Equipement;
use Illuminate\Database\Seeder;

class EquipementSeeder extends Seeder
{
    public function run(): void
    {
        $equipements = [
            // Baie Principale DC (coffret_id: 1)
            [
                'equipement_code' => 'SW-CORE-001',
                'name' => 'Switch Core Cisco Nexus',
                'type' => 'switch',
                'description' => 'Switch coeur de réseau 48 ports 10G',
                'direction_in_out' => 'in',
                'vlan' => '1',
                'ip_address' => '10.0.0.1',
                'coffret_id' => 1,
                'batiment_id' => 2,
                'salle_id' => 5,
                'status' => 'active',
            ],
            [
                'equipement_code' => 'SW-DIST-001',
                'name' => 'Switch Distribution 1',
                'type' => 'switch',
                'description' => 'Switch de distribution 24 ports 1G',
                'direction_in_out' => 'out',
                'vlan' => '10',
                'ip_address' => '10.0.1.1',
                'coffret_id' => 1,
                'batiment_id' => 2,
                'salle_id' => 5,
                'status' => 'active',
            ],
            [
                'equipement_code' => 'FW-MAIN-001',
                'name' => 'Firewall Principal',
                'type' => 'firewall',
                'description' => 'Pare-feu Fortinet FortiGate',
                'direction_in_out' => 'in',
                'vlan' => '1',
                'ip_address' => '10.0.0.254',
                'coffret_id' => 1,
                'batiment_id' => 2,
                'salle_id' => 5,
                'status' => 'active',
            ],

            // Baie Serveurs Web (coffret_id: 2)
            [
                'equipement_code' => 'SRV-WEB-001',
                'name' => 'Serveur Web Production',
                'type' => 'server',
                'description' => 'Serveur Dell PowerEdge R740',
                'direction_in_out' => 'out',
                'vlan' => '20',
                'ip_address' => '10.0.20.10',
                'coffret_id' => 2,
                'batiment_id' => 2,
                'salle_id' => 5,
                'status' => 'active',
            ],
            [
                'equipement_code' => 'SRV-WEB-002',
                'name' => 'Serveur Web Backup',
                'type' => 'server',
                'description' => 'Serveur Dell PowerEdge R740',
                'direction_in_out' => 'out',
                'vlan' => '20',
                'ip_address' => '10.0.20.11',
                'coffret_id' => 2,
                'batiment_id' => 2,
                'salle_id' => 5,
                'status' => 'active',
            ],
            [
                'equipement_code' => 'SRV-DB-001',
                'name' => 'Serveur Base de Données',
                'type' => 'server',
                'description' => 'Serveur HP ProLiant DL380',
                'direction_in_out' => 'out',
                'vlan' => '30',
                'ip_address' => '10.0.30.10',
                'coffret_id' => 2,
                'batiment_id' => 2,
                'salle_id' => 5,
                'status' => 'active',
            ],

            // Baie Stockage SAN (coffret_id: 3)
            [
                'equipement_code' => 'SAN-001',
                'name' => 'Baie SAN NetApp',
                'type' => 'storage',
                'description' => 'Stockage SAN NetApp FAS8200',
                'direction_in_out' => 'out',
                'vlan' => '40',
                'ip_address' => '10.0.40.10',
                'coffret_id' => 3,
                'batiment_id' => 2,
                'salle_id' => 5,
                'status' => 'active',
            ],
            [
                'equipement_code' => 'SW-SAN-001',
                'name' => 'Switch SAN FC',
                'type' => 'switch',
                'description' => 'Switch Fibre Channel Brocade',
                'direction_in_out' => 'in',
                'vlan' => '40',
                'ip_address' => '10.0.40.1',
                'coffret_id' => 3,
                'batiment_id' => 2,
                'salle_id' => 5,
                'status' => 'active',
            ],

            // Armoire Réseau Principal (coffret_id: 4)
            [
                'equipement_code' => 'RTR-WAN-001',
                'name' => 'Routeur WAN Principal',
                'type' => 'router',
                'description' => 'Routeur Cisco ISR 4451',
                'direction_in_out' => 'in',
                'vlan' => '1',
                'ip_address' => '192.168.1.1',
                'coffret_id' => 4,
                'batiment_id' => 2,
                'salle_id' => 6,
                'status' => 'active',
            ],
            [
                'equipement_code' => 'SW-ACC-001',
                'name' => 'Switch Access Réseau',
                'type' => 'switch',
                'description' => 'Switch Cisco Catalyst 9300',
                'direction_in_out' => 'out',
                'vlan' => '100',
                'ip_address' => '10.0.100.1',
                'coffret_id' => 4,
                'batiment_id' => 2,
                'salle_id' => 6,
                'status' => 'active',
            ],

            // Armoire Admin (coffret_id: 5)
            [
                'equipement_code' => 'SW-ADM-001',
                'name' => 'Switch Administration',
                'type' => 'switch',
                'description' => 'Switch HP Aruba 2930F',
                'direction_in_out' => 'out',
                'vlan' => '50',
                'ip_address' => '10.0.50.1',
                'coffret_id' => 5,
                'batiment_id' => 1,
                'salle_id' => 1,
                'status' => 'active',
            ],
            [
                'equipement_code' => 'AP-WIFI-001',
                'name' => 'Point Accès WiFi Admin',
                'type' => 'access_point',
                'description' => 'Cisco Meraki MR46',
                'direction_in_out' => 'out',
                'vlan' => '60',
                'ip_address' => '10.0.60.10',
                'coffret_id' => 5,
                'batiment_id' => 1,
                'salle_id' => 1,
                'status' => 'active',
            ],

            // Armoire Labo R&D (coffret_id: 6)
            [
                'equipement_code' => 'SW-LAB-001',
                'name' => 'Switch Laboratoire',
                'type' => 'switch',
                'description' => 'Switch Juniper EX3400',
                'direction_in_out' => 'out',
                'vlan' => '70',
                'ip_address' => '10.0.70.1',
                'coffret_id' => 6,
                'batiment_id' => 3,
                'salle_id' => 8,
                'status' => 'active',
            ],
            [
                'equipement_code' => 'SRV-DEV-001',
                'name' => 'Serveur Développement',
                'type' => 'server',
                'description' => 'Serveur de développement VMware',
                'direction_in_out' => 'out',
                'vlan' => '70',
                'ip_address' => '10.0.70.20',
                'coffret_id' => 6,
                'batiment_id' => 3,
                'salle_id' => 8,
                'status' => 'active',
            ],

            // Armoire Technique D (coffret_id: 7 - en maintenance)
            [
                'equipement_code' => 'SW-TEC-D01',
                'name' => 'Switch Technique D',
                'type' => 'switch',
                'description' => 'Switch Cisco Catalyst 2960',
                'direction_in_out' => 'out',
                'vlan' => '80',
                'ip_address' => '10.0.80.1',
                'coffret_id' => 7,
                'batiment_id' => 4,
                'salle_id' => 12,
                'status' => 'maintenance',
            ],
        ];

        foreach ($equipements as $equipement) {
            Equipement::create($equipement);
        }
    }
}
