<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Liaison extends Model
{
    use HasFactory;

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
     * Relation avec le modèle Equipement (source).
     */
    public function fromEquipement()
    {
        return $this->belongsTo(Equipement::class, 'from');
    }

    /**
     * Relation avec le modèle Equipement (destination).
     */
    public function toEquipement()
    {
        return $this->belongsTo(Equipement::class, 'to');
    }

    
}
