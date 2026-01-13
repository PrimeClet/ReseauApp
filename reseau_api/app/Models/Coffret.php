<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Coffret extends Model
{
    use HasFactory, SoftDeletes;
    
    protected $fillable = [
        'code', 'nom', 'piece', 'long', 'lat', 'status', 'batiment_id', 'salle_id', 'qr_code'
    ];

    public function equipements()
    {
        return $this->hasMany(Equipement::class);
    }

    public function metrics()
    {
        return $this->hasMany(Metric::class);
    }

    public function batiment()
    {
        return $this->belongsTo(Batiment::class);
    }

    public function salle()
    {
        return $this->belongsTo(Salle::class);
    }
}
