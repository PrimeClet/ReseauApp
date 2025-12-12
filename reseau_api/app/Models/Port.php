<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Port extends Model
{

    use HasFactory;

    protected $fillable = [
        'port_label',
        'device_name',
        'poe_enabled',
        'vlan',
        'speed',
        'equipement_id',
        'connected_equipment_id',
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
