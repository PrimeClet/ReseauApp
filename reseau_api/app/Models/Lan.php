<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Lan extends Model
{
    use HasFactory, LogsActivity;

    protected $logLabel = 'LAN';

    protected $logIdentifier = 'name';

    protected $fillable = [
        'name',
        'vlan_id',
        'subnet',
        'gateway',
        'site',
        'status',
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

    /**
     * Relation avec les équipements (switchs manageables)
     */
    public function equipements()
    {
        return $this->belongsToMany(Equipement::class, 'equipement_lan')
            ->withPivot(['is_tagged', 'ports'])
            ->withTimestamps();
    }

    /**
     * Récupère uniquement les switchs manageables associés à ce VLAN
     */
    public function switches()
    {
        return $this->equipements()->where('type', 'switch')->where('is_manageable', true);
    }
}
