<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Salle extends Model
{
    use HasFactory;
    
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
}

