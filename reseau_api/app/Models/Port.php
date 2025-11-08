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
        'connected_equipment_id',
    ];

    public function equipment()
    {
        return $this->belongsTo(Equipement::class, 'connected_equipment_id');
    }

    public function connectedEquipment()
    {
        return $this->belongsTo(Equipement::class, 'connected_equipment_id');
    }
}
