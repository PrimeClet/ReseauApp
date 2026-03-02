<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Batiment extends Model
{
    use HasFactory, LogsActivity, SoftDeletes;

    protected $logLabel = 'Bâtiment';

    protected $logIdentifier = 'nom';

    protected $fillable = [
        'nom',
        'description',
        'zone_id',
    ];

    /**
     * Relation avec la zone
     */
    public function zone()
    {
        return $this->belongsTo(Zone::class);
    }

    /**
     * Relation avec les salles
     */
    public function salles()
    {
        return $this->hasMany(Salle::class);
    }

    /**
     * Relation avec les équipements
     */
    public function equipements()
    {
        return $this->hasMany(Equipement::class);
    }

    /**
     * Relation avec les coffrets
     */
    public function coffrets()
    {
        return $this->hasMany(Coffret::class);
    }

    /**
     * Relation avec les LANs
     */
    public function lans()
    {
        return $this->hasMany(Lan::class);
    }
}
