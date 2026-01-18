<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Zone extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'site_id',
        'libelle',
        'description',
    ];

    protected $dates = ['deleted_at'];

    public function site()
    {
        return $this->belongsTo(Site::class);
    }

    public function batiments()
    {
        return $this->hasMany(Batiment::class);
    }

    /**
     * Check if the zone has any batiments
     */
    public function hasBatiments(): bool
    {
        return $this->batiments()->count() > 0;
    }

    /**
     * Get count of batiments for this zone
     */
    public function batimentsCount(): int
    {
        return $this->batiments()->count();
    }
}
