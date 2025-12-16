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
}

