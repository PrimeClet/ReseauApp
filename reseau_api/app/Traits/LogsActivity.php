<?php

namespace App\Traits;

use App\Models\ActivityLog;

trait LogsActivity
{
    /**
     * Boot le trait pour écouter les événements du modèle
     */
    protected static function bootLogsActivity()
    {
        // Log la création d'un modèle
        static::created(function ($model) {
            $model->logActivity('create', "{$model->getModelLabel()} créé(e): {$model->getIdentifier()}", null, $model->getLoggableAttributes());
        });

        // Log la mise à jour d'un modèle
        static::updated(function ($model) {
            $changes = $model->getChanges();
            if (! empty($changes)) {
                $model->logActivity(
                    'update',
                    "{$model->getModelLabel()} modifié(e): {$model->getIdentifier()}",
                    $model->getOriginal(),
                    $changes
                );
            }
        });

        // Log la suppression d'un modèle
        static::deleted(function ($model) {
            // Vérifier si le modèle utilise SoftDeletes
            $usesSoftDeletes = in_array('Illuminate\Database\Eloquent\SoftDeletes', class_uses_recursive(get_class($model)));

            if ($usesSoftDeletes && method_exists($model, 'isForceDeleting')) {
                $action = $model->isForceDeleting() ? 'force_delete' : 'delete';
                $description = $model->isForceDeleting()
                    ? "{$model->getModelLabel()} supprimé(e) définitivement: {$model->getIdentifier()}"
                    : "{$model->getModelLabel()} supprimé(e): {$model->getIdentifier()}";
            } else {
                $action = 'delete';
                $description = "{$model->getModelLabel()} supprimé(e): {$model->getIdentifier()}";
            }

            $model->logActivity($action, $description, $model->getLoggableAttributes(), null);
        });

        // Log la restauration d'un modèle soft-deleted (uniquement si le modèle utilise SoftDeletes)
        $usesSoftDeletes = in_array('Illuminate\Database\Eloquent\SoftDeletes', class_uses_recursive(static::class));
        if ($usesSoftDeletes) {
            static::restored(function ($model) {
                $model->logActivity('restore', "{$model->getModelLabel()} restauré(e): {$model->getIdentifier()}", null, $model->getLoggableAttributes());
            });
        }
    }

    /**
     * Créer un log d'activité pour ce modèle
     */
    protected function logActivity(string $action, string $description, ?array $oldValues = null, ?array $newValues = null)
    {
        ActivityLog::log(
            $action,
            $description,
            get_class($this),
            $this->id,
            $oldValues,
            $newValues
        );
    }

    /**
     * Obtenir le label du modèle pour les logs
     */
    protected function getModelLabel(): string
    {
        return property_exists($this, 'logLabel')
            ? $this->logLabel
            : class_basename(get_class($this));
    }

    /**
     * Obtenir l'identifiant du modèle pour les logs
     */
    protected function getIdentifier(): string
    {
        $identifierField = property_exists($this, 'logIdentifier')
            ? $this->logIdentifier
            : 'name';

        return $this->$identifierField ?? $this->id ?? 'N/A';
    }

    /**
     * Obtenir les attributs à logger
     */
    protected function getLoggableAttributes(): array
    {
        if (property_exists($this, 'loggable')) {
            return array_intersect_key(
                $this->getAttributes(),
                array_flip($this->loggable)
            );
        }

        return $this->getAttributes();
    }
}
