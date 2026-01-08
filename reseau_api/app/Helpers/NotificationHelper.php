<?php

namespace App\Helpers;

use App\Models\Notification;
use App\Models\User;

class NotificationHelper
{
    /**
     * Créer une notification pour les responsables réseau (administrateurs et directeurs)
     * lorsqu'une nouvelle demande de modification est créée
     */
    public static function notifyNewModificationRequest($modification)
    {
        // Récupérer tous les responsables réseau (administrateurs et directeurs)
        $recipients = User::whereIn('role', ['administrator', 'directeur'])
            ->get();

        $typeLabels = [
            'ajout_port' => "Ajout d'un port",
            'ajout_equipement' => "Ajout d'un équipement",
            'modification_connexion' => "Modification d'une connexion",
            'suppression_port' => "Suppression d'un port",
            'suppression_equipement' => "Suppression d'un équipement",
            'changement_statut_port' => "Changement de statut d'un port",
        ];

        $typeLabel = $typeLabels[$modification->type_modification] ?? $modification->type_modification;
        $coffretNom = $modification->coffret->nom ?? "Coffret #{$modification->coffret_id}";
        $userName = $modification->user->name ?? "Utilisateur #{$modification->user_id}";

        foreach ($recipients as $recipient) {
            Notification::create([
                'user_id' => $recipient->id,
                'type' => 'nouvelle_demande',
                'title' => 'Nouvelle demande de modification',
                'message' => "Une nouvelle demande de {$typeLabel} a été soumise sur le coffret {$coffretNom} par {$userName}.",
                'data' => [
                    'modification_id' => $modification->id,
                    'coffret_id' => $modification->coffret_id,
                    'type_modification' => $modification->type_modification,
                ],
            ]);
        }
    }

    /**
     * Notifier le demandeur lorsqu'une demande est approuvée
     */
    public static function notifyModificationApproved($modification)
    {
        $typeLabels = [
            'ajout_port' => "Ajout d'un port",
            'ajout_equipement' => "Ajout d'un équipement",
            'modification_connexion' => "Modification d'une connexion",
            'suppression_port' => "Suppression d'un port",
            'suppression_equipement' => "Suppression d'un équipement",
            'changement_statut_port' => "Changement de statut d'un port",
        ];

        $typeLabel = $typeLabels[$modification->type_modification] ?? $modification->type_modification;
        $coffretNom = $modification->coffret->nom ?? "Coffret #{$modification->coffret_id}";
        $validatorName = $modification->validatedBy->name ?? "Un administrateur";

        Notification::create([
            'user_id' => $modification->user_id,
            'type' => 'demande_validee',
            'title' => 'Demande de modification approuvée',
            'message' => "Votre demande de {$typeLabel} sur le coffret {$coffretNom} a été approuvée par {$validatorName}.",
            'data' => [
                'modification_id' => $modification->id,
                'coffret_id' => $modification->coffret_id,
                'type_modification' => $modification->type_modification,
            ],
        ]);
    }

    /**
     * Notifier le demandeur lorsqu'une demande est rejetée
     */
    public static function notifyModificationRejected($modification)
    {
        $typeLabels = [
            'ajout_port' => "Ajout d'un port",
            'ajout_equipement' => "Ajout d'un équipement",
            'modification_connexion' => "Modification d'une connexion",
            'suppression_port' => "Suppression d'un port",
            'suppression_equipement' => "Suppression d'un équipement",
            'changement_statut_port' => "Changement de statut d'un port",
        ];

        $typeLabel = $typeLabels[$modification->type_modification] ?? $modification->type_modification;
        $coffretNom = $modification->coffret->nom ?? "Coffret #{$modification->coffret_id}";
        $validatorName = $modification->validatedBy->name ?? "Un administrateur";
        $raison = $modification->commentaire_validation ?? "Aucune raison spécifiée";

        Notification::create([
            'user_id' => $modification->user_id,
            'type' => 'demande_rejetee',
            'title' => 'Demande de modification rejetée',
            'message' => "Votre demande de {$typeLabel} sur le coffret {$coffretNom} a été rejetée par {$validatorName}. Raison : {$raison}",
            'data' => [
                'modification_id' => $modification->id,
                'coffret_id' => $modification->coffret_id,
                'type_modification' => $modification->type_modification,
                'commentaire' => $raison,
            ],
        ]);
    }

    /**
     * Notifier le demandeur lorsqu'une demande nécessite plus d'informations
     */
    public static function notifyModificationReviewRequest($modification)
    {
        $typeLabels = [
            'ajout_port' => "Ajout d'un port",
            'ajout_equipement' => "Ajout d'un équipement",
            'modification_connexion' => "Modification d'une connexion",
            'suppression_port' => "Suppression d'un port",
            'suppression_equipement' => "Suppression d'un équipement",
            'changement_statut_port' => "Changement de statut d'un port",
        ];

        $typeLabel = $typeLabels[$modification->type_modification] ?? $modification->type_modification;
        $coffretNom = $modification->coffret->nom ?? "Coffret #{$modification->coffret_id}";
        $validatorName = $modification->validatedBy->name ?? "Un administrateur";
        $commentaire = $modification->commentaire_validation ?? "Des informations supplémentaires sont requises";

        Notification::create([
            'user_id' => $modification->user_id,
            'type' => 'demande_revision',
            'title' => 'Demande mise en révision',
            'message' => "Votre demande de {$typeLabel} sur le coffret {$coffretNom} nécessite plus d'informations. {$validatorName} : {$commentaire}",
            'data' => [
                'modification_id' => $modification->id,
                'coffret_id' => $modification->coffret_id,
                'type_modification' => $modification->type_modification,
                'commentaire' => $commentaire,
            ],
        ]);
    }

    /**
     * Notifier les responsables réseau lorsqu'une intervention commence sur une baie
     */
    public static function notifyInterventionStarted($modification)
    {
        // Cette notification peut être déclenchée lorsque la date d'intervention arrive
        // ou lorsque l'utilisateur marque l'intervention comme commencée
        $recipients = User::whereIn('role', ['administrator', 'directeur'])
            ->get();

        $typeLabels = [
            'ajout_port' => "Ajout d'un port",
            'ajout_equipement' => "Ajout d'un équipement",
            'modification_connexion' => "Modification d'une connexion",
            'suppression_port' => "Suppression d'un port",
            'suppression_equipement' => "Suppression d'un équipement",
            'changement_statut_port' => "Changement de statut d'un port",
        ];

        $typeLabel = $typeLabels[$modification->type_modification] ?? $modification->type_modification;
        $coffretNom = $modification->coffret->nom ?? "Coffret #{$modification->coffret_id}";
        $userName = $modification->user->name ?? "Utilisateur #{$modification->user_id}";

        foreach ($recipients as $recipient) {
            Notification::create([
                'user_id' => $recipient->id,
                'type' => 'intervention_baie',
                'title' => 'Intervention en cours',
                'message' => "Une intervention de {$typeLabel} est en cours sur le coffret {$coffretNom} par {$userName}.",
                'data' => [
                    'modification_id' => $modification->id,
                    'coffret_id' => $modification->coffret_id,
                    'type_modification' => $modification->type_modification,
                ],
            ]);
        }
    }
}

