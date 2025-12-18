<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Batiment extends Model
{
    use HasFactory;
    
    protected $fillable = [
        'nom',
        'adresse',
        'ville',
        'code_postal',
        'etat',
        'description',
    ];

    /**
     * Relation avec les salles
     */
    public function salles()
    {
        return $this->hasMany(Salle::class);
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

