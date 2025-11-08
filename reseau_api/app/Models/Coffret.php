<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Coffret extends Model
{
    use HasFactory;
    
    protected $fillable = [
        'code', 'nom', 'piece', 'long', 'lat', 'status'
    ];

    public function equipments()
    {
        return $this->hasMany(Equipement::class);
    }

    public function metrics()
    {
        return $this->hasMany(Metric::class);
    }
}
