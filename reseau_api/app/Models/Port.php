<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Port extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'port_label',
        'device_name',
        'poe_enabled',
        'vlan',
        'speed',
        'type_reseau',
        'statut',
        'connexion_type',
        'uplink',
        'downlink',
        'equipement_id',
        'connected_equipment_id',
        'status',
    ];

    public function equipement()
    {
        return $this->belongsTo(Equipement::class, 'equipement_id');
    }

    public function connectedEquipment()
    {
        return $this->belongsTo(Equipement::class, 'connected_equipment_id');
    }

    public function liaisonsFrom()
    {
        return $this->hasMany(Liaison::class, 'from');
    }

    public function liaisonsTo()
    {
        return $this->hasMany(Liaison::class, 'to');
    }
}
