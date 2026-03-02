<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Liaison extends Model
{
    use HasFactory, LogsActivity, SoftDeletes;

    protected $logLabel = 'Liaison';

    protected $logIdentifier = 'label';

    /**
     * Les colonnes qui peuvent être remplies via des requêtes.
     */
    protected $fillable = [
        'from',
        'to',
        'direction',
        'label',
        'media',
        'cable_type',
        'description',
        'length',
        'status',
    ];

    /**
     * Les attributs qui doivent être castés.
     */
    protected $casts = [
        'status' => 'boolean',
        'length' => 'integer',
    ];

    /**
     * Constantes pour les directions
     */
    const DIRECTION_UP = 'up';

    const DIRECTION_DOWN = 'down';

    /**
     * Relation avec le modèle Port (source).
     */
    public function fromPort()
    {
        return $this->belongsTo(Port::class, 'from');
    }

    /**
     * Relation avec le modèle Port (destination).
     */
    public function toPort()
    {
        return $this->belongsTo(Port::class, 'to');
    }

    /**
     * Relations avec les équipements via les ports (pour compatibilité).
     */
    public function fromEquipement()
    {
        return $this->hasOneThrough(Equipement::class, Port::class, 'id', 'id', 'from', 'equipement_id');
    }

    public function toEquipement()
    {
        return $this->hasOneThrough(Equipement::class, Port::class, 'id', 'id', 'to', 'equipement_id');
    }

    /**
     * Vérifie si la liaison est de type UP (vers la source)
     */
    public function isUpstream(): bool
    {
        return $this->direction === self::DIRECTION_UP;
    }

    /**
     * Vérifie si la liaison est de type DOWN (vers la distribution)
     */
    public function isDownstream(): bool
    {
        return $this->direction === self::DIRECTION_DOWN;
    }

    /**
     * Retourne l'équipement source (celui qui DONNE le réseau)
     */
    public function getSourceEquipement()
    {
        return $this->direction === self::DIRECTION_DOWN
            ? $this->fromEquipement
            : $this->toEquipement;
    }

    /**
     * Retourne l'équipement destination (celui qui REÇOIT le réseau)
     */
    public function getDestinationEquipement()
    {
        return $this->direction === self::DIRECTION_DOWN
            ? $this->toEquipement
            : $this->fromEquipement;
    }

    /**
     * Scope pour les liaisons upstream
     */
    public function scopeUpstream($query)
    {
        return $query->where('direction', self::DIRECTION_UP);
    }

    /**
     * Scope pour les liaisons downstream
     */
    public function scopeDownstream($query)
    {
        return $query->where('direction', self::DIRECTION_DOWN);
    }
}
