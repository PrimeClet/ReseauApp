<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Lan extends Model
{
    use HasFactory;

    protected $fillable = [
        'nom',
        'sous_reseau',
        'vlan',
        'site',
        'statut',
        'description',
        'batiment_id',
        'salle_id',
    ];

    public function batiment()
    {
        return $this->belongsTo(Batiment::class);
    }

    public function salle()
    {
        return $this->belongsTo(Salle::class);
    }
}
