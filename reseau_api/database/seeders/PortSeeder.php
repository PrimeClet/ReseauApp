<?php

namespace Database\Seeders;

use App\Models\Port;
use Illuminate\Database\Seeder;

class PortSeeder extends Seeder
{
    public function run(): void
    {
        $ports = [
            // Switch Core (equipement_id: 1)
            ['port_label' => 'Gi1/0/1', 'device_name' => 'SW-CORE-001', 'poe_enabled' => false, 'vlan' => '1', 'speed' => '10000', 'equipement_id' => 1],
            ['port_label' => 'Gi1/0/2', 'device_name' => 'SW-CORE-001', 'poe_enabled' => false, 'vlan' => '10', 'speed' => '10000', 'equipement_id' => 1],
            ['port_label' => 'Gi1/0/3', 'device_name' => 'SW-CORE-001', 'poe_enabled' => false, 'vlan' => '20', 'speed' => '10000', 'equipement_id' => 1],
            ['port_label' => 'Gi1/0/4', 'device_name' => 'SW-CORE-001', 'poe_enabled' => false, 'vlan' => '30', 'speed' => '10000', 'equipement_id' => 1],
            ['port_label' => 'Gi1/0/5', 'device_name' => 'SW-CORE-001', 'poe_enabled' => false, 'vlan' => '40', 'speed' => '10000', 'equipement_id' => 1],
            ['port_label' => 'Gi1/0/6', 'device_name' => 'SW-CORE-001', 'poe_enabled' => false, 'vlan' => '20', 'speed' => '10000', 'equipement_id' => 1], // Vers SRV-WEB-002

            // Switch Distribution (equipement_id: 2)
            ['port_label' => 'Gi0/1', 'device_name' => 'SW-DIST-001', 'poe_enabled' => true, 'vlan' => '10', 'speed' => '1000', 'equipement_id' => 2],
            ['port_label' => 'Gi0/2', 'device_name' => 'SW-DIST-001', 'poe_enabled' => true, 'vlan' => '10', 'speed' => '1000', 'equipement_id' => 2],
            ['port_label' => 'Gi0/3', 'device_name' => 'SW-DIST-001', 'poe_enabled' => true, 'vlan' => '10', 'speed' => '1000', 'equipement_id' => 2],
            ['port_label' => 'Gi0/24', 'device_name' => 'SW-DIST-001', 'poe_enabled' => false, 'vlan' => '1', 'speed' => '10000', 'equipement_id' => 2],

            // Firewall (equipement_id: 3)
            ['port_label' => 'WAN1', 'device_name' => 'FW-MAIN-001', 'poe_enabled' => false, 'vlan' => '1', 'speed' => '1000', 'equipement_id' => 3],
            ['port_label' => 'LAN1', 'device_name' => 'FW-MAIN-001', 'poe_enabled' => false, 'vlan' => '1', 'speed' => '10000', 'equipement_id' => 3],
            ['port_label' => 'DMZ', 'device_name' => 'FW-MAIN-001', 'poe_enabled' => false, 'vlan' => '99', 'speed' => '1000', 'equipement_id' => 3],

            // Serveur Web Production (equipement_id: 4)
            ['port_label' => 'eth0', 'device_name' => 'SRV-WEB-001', 'poe_enabled' => false, 'vlan' => '20', 'speed' => '10000', 'equipement_id' => 4],
            ['port_label' => 'eth1', 'device_name' => 'SRV-WEB-001', 'poe_enabled' => false, 'vlan' => '20', 'speed' => '10000', 'equipement_id' => 4],

            // Serveur Web Backup (equipement_id: 5)
            ['port_label' => 'eth0', 'device_name' => 'SRV-WEB-002', 'poe_enabled' => false, 'vlan' => '20', 'speed' => '10000', 'equipement_id' => 5],

            // Serveur DB (equipement_id: 6)
            ['port_label' => 'eth0', 'device_name' => 'SRV-DB-001', 'poe_enabled' => false, 'vlan' => '30', 'speed' => '10000', 'equipement_id' => 6],
            ['port_label' => 'eth1', 'device_name' => 'SRV-DB-001', 'poe_enabled' => false, 'vlan' => '40', 'speed' => '10000', 'equipement_id' => 6],

            // SAN NetApp (equipement_id: 7)
            ['port_label' => 'e0a', 'device_name' => 'SAN-001', 'poe_enabled' => false, 'vlan' => '40', 'speed' => '10000', 'equipement_id' => 7],
            ['port_label' => 'e0b', 'device_name' => 'SAN-001', 'poe_enabled' => false, 'vlan' => '40', 'speed' => '10000', 'equipement_id' => 7],

            // Switch SAN FC (equipement_id: 8)
            ['port_label' => 'fc1/1', 'device_name' => 'SW-SAN-001', 'poe_enabled' => false, 'vlan' => '40', 'speed' => '16000', 'equipement_id' => 8],
            ['port_label' => 'fc1/2', 'device_name' => 'SW-SAN-001', 'poe_enabled' => false, 'vlan' => '40', 'speed' => '16000', 'equipement_id' => 8],

            // Routeur WAN (equipement_id: 9)
            ['port_label' => 'Gi0/0/0', 'device_name' => 'RTR-WAN-001', 'poe_enabled' => false, 'vlan' => '1', 'speed' => '1000', 'equipement_id' => 9],
            ['port_label' => 'Gi0/0/1', 'device_name' => 'RTR-WAN-001', 'poe_enabled' => false, 'vlan' => '1', 'speed' => '1000', 'equipement_id' => 9],

            // Switch Access (equipement_id: 10)
            ['port_label' => 'Gi1/0/1', 'device_name' => 'SW-ACC-001', 'poe_enabled' => true, 'vlan' => '100', 'speed' => '1000', 'equipement_id' => 10],
            ['port_label' => 'Gi1/0/2', 'device_name' => 'SW-ACC-001', 'poe_enabled' => true, 'vlan' => '100', 'speed' => '1000', 'equipement_id' => 10],
            ['port_label' => 'Gi1/0/3', 'device_name' => 'SW-ACC-001', 'poe_enabled' => true, 'vlan' => '100', 'speed' => '1000', 'equipement_id' => 10],
            ['port_label' => 'Gi1/0/48', 'device_name' => 'SW-ACC-001', 'poe_enabled' => false, 'vlan' => '1', 'speed' => '10000', 'equipement_id' => 10],

            // Switch Admin (equipement_id: 11)
            ['port_label' => '1', 'device_name' => 'SW-ADM-001', 'poe_enabled' => true, 'vlan' => '50', 'speed' => '1000', 'equipement_id' => 11],
            ['port_label' => '2', 'device_name' => 'SW-ADM-001', 'poe_enabled' => true, 'vlan' => '50', 'speed' => '1000', 'equipement_id' => 11],
            ['port_label' => '24', 'device_name' => 'SW-ADM-001', 'poe_enabled' => false, 'vlan' => '1', 'speed' => '10000', 'equipement_id' => 11],

            // AP WiFi (equipement_id: 12)
            ['port_label' => 'LAN', 'device_name' => 'AP-WIFI-001', 'poe_enabled' => false, 'vlan' => '60', 'speed' => '1000', 'equipement_id' => 12],

            // Switch Labo (equipement_id: 13)
            ['port_label' => 'ge-0/0/0', 'device_name' => 'SW-LAB-001', 'poe_enabled' => true, 'vlan' => '70', 'speed' => '1000', 'equipement_id' => 13],
            ['port_label' => 'ge-0/0/1', 'device_name' => 'SW-LAB-001', 'poe_enabled' => true, 'vlan' => '70', 'speed' => '1000', 'equipement_id' => 13],
            ['port_label' => 'ge-0/0/47', 'device_name' => 'SW-LAB-001', 'poe_enabled' => false, 'vlan' => '1', 'speed' => '10000', 'equipement_id' => 13],

            // Serveur Dev (equipement_id: 14)
            ['port_label' => 'vmnic0', 'device_name' => 'SRV-DEV-001', 'poe_enabled' => false, 'vlan' => '70', 'speed' => '10000', 'equipement_id' => 14],

            // Switch Technique D (equipement_id: 15)
            ['port_label' => 'Fa0/1', 'device_name' => 'SW-TEC-D01', 'poe_enabled' => true, 'vlan' => '80', 'speed' => '100', 'equipement_id' => 15],
            ['port_label' => 'Fa0/24', 'device_name' => 'SW-TEC-D01', 'poe_enabled' => false, 'vlan' => '1', 'speed' => '1000', 'equipement_id' => 15],
        ];

        foreach ($ports as $port) {
            Port::create($port);
        }
    }
}
