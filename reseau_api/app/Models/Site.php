<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Site extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'libelle',
        'description',
    ];

    protected $dates = ['deleted_at'];

    public function zones()
    {
        return $this->hasMany(Zone::class);
    }

    /**
     * Check if the site has any zones
     */
    public function hasZones(): bool
    {
        return $this->zones()->count() > 0;
    }

    /**
     * Get count of zones for this site
     */
    public function zonesCount(): int
    {
        return $this->zones()->count();
    }
}
