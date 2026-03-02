<?php

namespace App\Jobs;

use App\Models\Modification;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendNotificationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public function __construct(
        private string $notificationType,
        private int $modificationId,
    ) {}

    public function handle(): void
    {
        $modification = Modification::with('coffret', 'user', 'validatedBy')
            ->findOrFail($this->modificationId);

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

        match ($this->notificationType) {
            'nouvelle_demande' => $this->notifyNewRequest($modification, $typeLabel, $coffretNom),
            'demande_validee' => $this->notifyApproved($modification, $typeLabel, $coffretNom),
            'demande_rejetee' => $this->notifyRejected($modification, $typeLabel, $coffretNom),
            'demande_revision' => $this->notifyReviewRequest($modification, $typeLabel, $coffretNom),
            'intervention_baie' => $this->notifyInterventionStarted($modification, $typeLabel, $coffretNom),
        };
    }

    private function notifyNewRequest(Modification $modification, string $typeLabel, string $coffretNom): void
    {
        $userName = $modification->user->name ?? "Utilisateur #{$modification->user_id}";

        $recipients = User::role(['Super Admin', 'Administrateur'])
            ->where('is_active', true)
            ->get();

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

    private function notifyApproved(Modification $modification, string $typeLabel, string $coffretNom): void
    {
        $validatorName = $modification->validatedBy->name ?? 'Un administrateur';

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

    private function notifyRejected(Modification $modification, string $typeLabel, string $coffretNom): void
    {
        $validatorName = $modification->validatedBy->name ?? 'Un administrateur';
        $raison = $modification->commentaire_validation ?? 'Aucune raison spécifiée';

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

    private function notifyReviewRequest(Modification $modification, string $typeLabel, string $coffretNom): void
    {
        $validatorName = $modification->validatedBy->name ?? 'Un administrateur';
        $commentaire = $modification->commentaire_validation ?? 'Des informations supplémentaires sont requises';

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

    private function notifyInterventionStarted(Modification $modification, string $typeLabel, string $coffretNom): void
    {
        $userName = $modification->user->name ?? "Utilisateur #{$modification->user_id}";

        $recipients = User::role(['Super Admin', 'Administrateur'])
            ->where('is_active', true)
            ->get();

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
