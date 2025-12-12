<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Maintenance extends Model
{
    use HasFactory;

    protected $fillable = [
        'equipement_id',
        'type',
        'date_debut',
        'heure_debut',
        'duree',
        'technicien',
        'priorite',
        'description',
        'statut',
    ];

    protected $casts = [
        'date_debut' => 'date',
    ];

    public function equipement()
    {
        return $this->belongsTo(Equipement::class);
    }
}
