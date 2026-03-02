<?php

namespace App\Helpers;

use App\Jobs\SendNotificationJob;

class NotificationHelper
{
    public static function notifyNewModificationRequest($modification): void
    {
        SendNotificationJob::dispatch('nouvelle_demande', $modification->id);
    }

    public static function notifyModificationApproved($modification): void
    {
        SendNotificationJob::dispatch('demande_validee', $modification->id);
    }

    public static function notifyModificationRejected($modification): void
    {
        SendNotificationJob::dispatch('demande_rejetee', $modification->id);
    }

    public static function notifyModificationReviewRequest($modification): void
    {
        SendNotificationJob::dispatch('demande_revision', $modification->id);
    }

    public static function notifyInterventionStarted($modification): void
    {
        SendNotificationJob::dispatch('intervention_baie', $modification->id);
    }
}
