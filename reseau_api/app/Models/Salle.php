<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Salle extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'nom',
        'batiment_id',
        'etage',
        'capacite',
        'type',
        'etat',
        'description',
    ];

    /**
     * Relation avec le bâtiment
     */
    public function batiment()
    {
        return $this->belongsTo(Batiment::class);
    }

    /**
     * Relation avec les équipements
     */
    public function equipements()
    {
        return $this->hasMany(Equipement::class);
    }

    /**
     * Relation avec les coffrets
     */
    public function coffrets()
    {
        return $this->hasMany(Coffret::class);
    }

    /**
     * Relation avec les LANs
     */
    public function lans()
    {
        return $this->hasMany(Lan::class);
    }
}

