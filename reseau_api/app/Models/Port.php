<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Port extends Model
{
    use HasFactory, LogsActivity, SoftDeletes;

    protected $logLabel = 'Port';

    protected $logIdentifier = 'port_label';

    protected $fillable = [
        'port_label',
        'device_name',
        'poe_enabled',
        'vlan',
        'speed',
        'type_reseau',
        'statut',
        'connexion_type',
        'port_genre',
        'uplink',
        'downlink',
        'equipement_id',
        'connected_equipment_id',
        'status',
    ];

    /**
     * Constantes pour les genres de port
     */
    const GENRE_UPLINK = 'uplink';

    const GENRE_DOWNLINK = 'downlink';

    /**
     * Vérifie si le port est un uplink
     */
    public function isUplink(): bool
    {
        return $this->port_genre === self::GENRE_UPLINK;
    }

    /**
     * Vérifie si le port est un downlink
     */
    public function isDownlink(): bool
    {
        return $this->port_genre === self::GENRE_DOWNLINK;
    }

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

    /**
     * Alias pour les liaisons où ce port est la destination
     */
    public function liaisonsAsDestination()
    {
        return $this->hasMany(Liaison::class, 'to');
    }

    /**
     * Alias pour les liaisons où ce port est la source
     */
    public function liaisonsAsSource()
    {
        return $this->hasMany(Liaison::class, 'from');
    }
}
