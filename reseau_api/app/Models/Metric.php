<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Metric extends Model
{
    use HasFactory;

    /**
     * Les colonnes qui peuvent être remplies via des requêtes.
     */
    protected $fillable = [
        'name',
        'type',
        'description',
        'last_value',
        'coffret_id',
        'status',
    ];

    /**
     * Relation avec le modèle Coffret.
     */
    public function coffret()
    {
        return $this->belongsTo(Coffret::class);
    }
}
