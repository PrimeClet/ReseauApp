<?php

namespace Database\Seeders;

use App\Models\Maintenance;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class MaintenanceSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        $maintenances = [
            // Maintenances terminées
            [
                'equipement_id' => 1,
                'type' => 'Préventive',
                'date_debut' => $now->copy()->subDays(30)->format('Y-m-d'),
                'heure_debut' => '02:00:00',
                'duree' => '2 heures',
                'technicien' => 'Jean Dupont',
                'priorite' => 'haute',
                'description' => 'Mise à jour du firmware Cisco Nexus vers la dernière version stable. Redémarrage planifié réalisé.',
                'statut' => 'terminee',
            ],
            [
                'equipement_id' => 7,
                'type' => 'Corrective',
                'date_debut' => $now->copy()->subDays(15)->format('Y-m-d'),
                'heure_debut' => '10:00:00',
                'duree' => '2 heures',
                'technicien' => 'Marie Martin',
                'priorite' => 'critique',
                'description' => 'Remplacement préventif d\'un disque en état dégradé sur le SAN NetApp. Rebuild RAID terminé.',
                'statut' => 'terminee',
            ],
            [
                'equipement_id' => null,
                'type' => 'Préventive',
                'date_debut' => $now->copy()->subDays(7)->format('Y-m-d'),
                'heure_debut' => '08:00:00',
                'duree' => '8 heures',
                'technicien' => 'Pierre Durand',
                'priorite' => 'basse',
                'description' => 'Nettoyage annuel de la salle serveur et vérification climatisation. Filtres remplacés.',
                'statut' => 'terminee',
            ],

            // Maintenances en cours
            [
                'equipement_id' => 15,
                'type' => 'Corrective',
                'date_debut' => $now->copy()->subDays(2)->format('Y-m-d'),
                'heure_debut' => '09:00:00',
                'duree' => '3 jours',
                'technicien' => 'Jean Dupont',
                'priorite' => 'moyenne',
                'description' => 'Diagnostic et réparation du switch en panne. Alimentation défectueuse identifiée.',
                'statut' => 'en_cours',
            ],
            [
                'equipement_id' => 13,
                'type' => 'Évolutive',
                'date_debut' => $now->copy()->subDays(1)->format('Y-m-d'),
                'heure_debut' => '14:00:00',
                'duree' => '3 jours',
                'technicien' => 'Marie Martin',
                'priorite' => 'moyenne',
                'description' => 'Reconfiguration des VLANs pour le nouveau laboratoire R&D. Tests en cours.',
                'statut' => 'en_cours',
            ],

            // Maintenances planifiées
            [
                'equipement_id' => 3,
                'type' => 'Préventive',
                'date_debut' => $now->copy()->addDays(3)->format('Y-m-d'),
                'heure_debut' => '02:00:00',
                'duree' => '4 heures',
                'technicien' => 'Pierre Durand',
                'priorite' => 'haute',
                'description' => 'Mise à jour majeure du firewall Fortinet avec nouvelles règles de sécurité.',
                'statut' => 'planifiee',
            ],
            [
                'equipement_id' => null,
                'type' => 'Évolutive',
                'date_debut' => $now->copy()->addDays(7)->format('Y-m-d'),
                'heure_debut' => '08:00:00',
                'duree' => '10 heures',
                'technicien' => 'Jean Dupont',
                'priorite' => 'moyenne',
                'description' => 'Remplacement des câbles fibre optique entre le datacenter et le bâtiment C.',
                'statut' => 'planifiee',
            ],
            [
                'equipement_id' => null,
                'type' => 'Préventive',
                'date_debut' => $now->copy()->addDays(14)->format('Y-m-d'),
                'heure_debut' => '09:00:00',
                'duree' => '3 jours',
                'technicien' => 'Externe - SecureNet',
                'priorite' => 'haute',
                'description' => 'Audit annuel de sécurité du réseau par prestataire externe.',
                'statut' => 'planifiee',
            ],
            [
                'equipement_id' => 7,
                'type' => 'Évolutive',
                'date_debut' => $now->copy()->addDays(21)->format('Y-m-d'),
                'heure_debut' => '10:00:00',
                'duree' => '6 heures',
                'technicien' => 'Marie Martin',
                'priorite' => 'moyenne',
                'description' => 'Extension capacité SAN: ajout de 8 disques SSD 4TB (+32TB).',
                'statut' => 'planifiee',
            ],
            [
                'equipement_id' => 11,
                'type' => 'Évolutive',
                'date_debut' => $now->copy()->addDays(30)->format('Y-m-d'),
                'heure_debut' => '20:00:00',
                'duree' => '3 heures',
                'technicien' => 'Pierre Durand',
                'priorite' => 'basse',
                'description' => 'Remplacement du switch HP Aruba par un modèle Aruba 6300.',
                'statut' => 'planifiee',
            ],

            // Maintenance annulée
            [
                'equipement_id' => 4,
                'type' => 'Évolutive',
                'date_debut' => $now->copy()->subDays(5)->format('Y-m-d'),
                'heure_debut' => '22:00:00',
                'duree' => '1 heure',
                'technicien' => 'Jean Dupont',
                'priorite' => 'basse',
                'description' => 'Upgrade RAM serveur web - Annulée: migration cloud prévue.',
                'statut' => 'annulee',
            ],
        ];

        foreach ($maintenances as $maintenance) {
            Maintenance::create($maintenance);
        }
    }
}
