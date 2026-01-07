<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Coffret extends Model
{
    use HasFactory;
    
    protected $fillable = [
        'code', 'nom', 'modele', 'photo', 'piece', 'emplacement', 'long', 'lat', 'status', 'batiment_id', 'salle_id', 'site_id', 'zone_id', 'qr_code'
    ];

    protected $appends = ['photo_url'];

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

    public function site()
    {
        return $this->belongsTo(Site::class);
    }

    public function zone()
    {
        return $this->belongsTo(Zone::class);
    }

    public function getPhotoUrlAttribute(): ?string
    {
        if (!$this->photo) {
            return null;
        }
        // If already an absolute URL, return as-is
        if (preg_match('#^https?://#i', $this->photo)) {
            return $this->photo;
        }
        // Return the API endpoint URL for the photo
        $baseUrl = config('app.url', 'http://127.0.0.1:8000');
        $baseUrl = rtrim($baseUrl, '/');
        return $baseUrl . '/api/coffrets/' . $this->id . '/photo';
    }
}
