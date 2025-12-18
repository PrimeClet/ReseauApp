<?php

namespace Database\Seeders;

use App\Models\Liaison;
use Illuminate\Database\Seeder;

class LiaisonSeeder extends Seeder
{
    public function run(): void
    {
        // IDs des ports après ajout du port Gi1/0/6 sur SW-CORE:
        // SW-CORE: 1(Gi1/0/1), 2(Gi1/0/2), 3(Gi1/0/3), 4(Gi1/0/4), 5(Gi1/0/5), 6(Gi1/0/6)
        // SW-DIST: 7(Gi0/1), 8(Gi0/2), 9(Gi0/3), 10(Gi0/24)
        // FW: 11(WAN1), 12(LAN1), 13(DMZ)
        // SRV-WEB-001: 14(eth0), 15(eth1)
        // SRV-WEB-002: 16(eth0)
        // SRV-DB: 17(eth0), 18(eth1)
        // SAN: 19(e0a), 20(e0b)
        // SW-SAN: 21(fc1/1), 22(fc1/2)
        // RTR-WAN: 23(Gi0/0/0), 24(Gi0/0/1)
        // SW-ACC: 25(Gi1/0/1), 26(Gi1/0/2), 27(Gi1/0/3), 28(Gi1/0/48)
        // SW-ADM: 29(1), 30(2), 31(24)
        // AP-WIFI: 32(LAN)
        // SW-LAB: 33(ge-0/0/0), 34(ge-0/0/1), 35(ge-0/0/47)
        // SRV-DEV: 36(vmnic0)
        // SW-TEC: 37(Fa0/1), 38(Fa0/24)

        $liaisons = [
            // === DATACENTER PRINCIPAL (Bâtiment 2, Salle 5) ===

            // Core to Distribution (VLAN 10)
            [
                'from' => 2,   // SW-CORE Gi1/0/2
                'to' => 10,    // SW-DIST Gi0/24
                'label' => 'Core-Distribution Link',
                'media' => 'fibre',
                'length' => 5,
                'status' => true,
            ],

            // Core to Firewall (VLAN 1)
            [
                'from' => 1,   // SW-CORE Gi1/0/1
                'to' => 12,    // FW LAN1
                'label' => 'Core-Firewall Link',
                'media' => 'fibre',
                'length' => 2,
                'status' => true,
            ],

            // Core to Serveur Web 1 (VLAN 20)
            [
                'from' => 3,   // SW-CORE Gi1/0/3
                'to' => 14,    // SRV-WEB-001 eth0
                'label' => 'Core-WebServer1 Link',
                'media' => 'fibre',
                'length' => 3,
                'status' => true,
            ],

            // Core to Serveur Web 2 Backup (VLAN 20)
            [
                'from' => 6,   // SW-CORE Gi1/0/6
                'to' => 16,    // SRV-WEB-002 eth0
                'label' => 'Core-WebServer2 Link',
                'media' => 'fibre',
                'length' => 3,
                'status' => true,
            ],

            // Core to Serveur DB (VLAN 30)
            [
                'from' => 4,   // SW-CORE Gi1/0/4
                'to' => 17,    // SRV-DB eth0
                'label' => 'Core-DBServer Link',
                'media' => 'fibre',
                'length' => 3,
                'status' => true,
            ],

            // Core to SAN Switch (VLAN 40)
            [
                'from' => 5,   // SW-CORE Gi1/0/5
                'to' => 21,    // SW-SAN fc1/1
                'label' => 'Core-SAN Link',
                'media' => 'fibre',
                'length' => 4,
                'status' => true,
            ],

            // SAN Switch to Storage (VLAN 40)
            [
                'from' => 22,  // SW-SAN fc1/2
                'to' => 19,    // SAN-001 e0a
                'label' => 'SAN-Storage Link',
                'media' => 'fibre',
                'length' => 1,
                'status' => true,
            ],

            // === SALLE RESEAU (Bâtiment 2, Salle 6) ===

            // Firewall to Router WAN (VLAN 1)
            [
                'from' => 11,  // FW WAN1
                'to' => 23,    // RTR-WAN Gi0/0/0
                'label' => 'Firewall-WAN Link',
                'media' => 'cuivre',
                'length' => 2,
                'status' => true,
            ],

            // Router to Access Switch (VLAN 100)
            [
                'from' => 24,  // RTR-WAN Gi0/0/1
                'to' => 28,    // SW-ACC Gi1/0/48
                'label' => 'Router-Access Link',
                'media' => 'fibre',
                'length' => 10,
                'status' => true,
            ],

            // === BATIMENT ADMINISTRATION (Bâtiment 1) ===

            // Access to Admin Switch (VLAN 50)
            [
                'from' => 25,  // SW-ACC Gi1/0/1
                'to' => 31,    // SW-ADM port 24
                'label' => 'Access-Admin Link',
                'media' => 'cuivre',
                'length' => 25,
                'status' => true,
            ],

            // Admin Switch to WiFi AP (VLAN 60)
            [
                'from' => 29,  // SW-ADM port 1
                'to' => 32,    // AP-WIFI LAN
                'label' => 'Admin-WiFi Link',
                'media' => 'cuivre',
                'length' => 15,
                'status' => true,
            ],

            // === LABORATOIRE R&D (Bâtiment 3) ===

            // Access to Lab Switch (VLAN 70)
            [
                'from' => 26,  // SW-ACC Gi1/0/2
                'to' => 35,    // SW-LAB ge-0/0/47
                'label' => 'Access-Lab Link',
                'media' => 'fibre',
                'length' => 50,
                'status' => true,
            ],

            // Lab Switch to Dev Server (VLAN 70)
            [
                'from' => 33,  // SW-LAB ge-0/0/0
                'to' => 36,    // SRV-DEV vmnic0
                'label' => 'Lab-DevServer Link',
                'media' => 'cuivre',
                'length' => 3,
                'status' => true,
            ],

            // === BATIMENT TECHNIQUE (Bâtiment 4) - En maintenance ===

            // Access to Technical Switch (VLAN 80) - inactive
            [
                'from' => 27,  // SW-ACC Gi1/0/3
                'to' => 38,    // SW-TEC Fa0/24
                'label' => 'Access-Technical Link',
                'media' => 'cuivre',
                'length' => 100,
                'status' => false,
            ],
        ];

        foreach ($liaisons as $liaison) {
            Liaison::create($liaison);
        }
    }
}
