<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Liaison extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * Les colonnes qui peuvent être remplies via des requêtes.
     */
    protected $fillable = [
        'from',
        'to',
        'label',
        'media',
        'length',
        'status',
    ];

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

    
}
