<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Equipement extends Model
{
    use HasFactory;
    
    protected $fillable = [
        'equipement_code',
        'name',
        'type',
        'description',
        'direction_in_out',
        'vlan',
        'ip_address',
        'coffret_id',
        'batiment_id',
        'salle_id',
        'status'
    ];

    public function coffret()
    {
        return $this->belongsTo(Coffret::class);
    }

    public function batiment()
    {
        return $this->belongsTo(Batiment::class);
    }

    public function salle()
    {
        return $this->belongsTo(Salle::class);
    }

    public function ports()
    {
        return $this->hasMany(Port::class, 'equipement_id');
    }
}
