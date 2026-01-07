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
        'modele',
        'fabricant',
        'numero_serie',
        'type_reseau',
        'nb_ports_fibre',
        'nb_ports_rj45',
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

    /**
     * Relation avec les maintenances
     */
    public function maintenances()
    {
        return $this->hasMany(Maintenance::class);
    }

    /**
     * Relation avec les liaisons (via les ports)
     */
    public function liaisons()
    {
        return Liaison::whereIn('from', $this->ports()->pluck('id'))
            ->orWhereIn('to', $this->ports()->pluck('id'));
    }
}
