<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Modification extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'coffret_id',
        'port_id',
        'equipement_id',
        'type_modification',
        'description',
        'raison',
        'photo_avant',
        'photo_apres',
        'date_intervention',
        'heure_intervention',
        'statut',
        'commentaire_validation',
        'validated_by',
        'validated_at',
    ];

    protected $casts = [
        'date_intervention' => 'date',
        'validated_at' => 'datetime',
    ];

    protected $appends = ['photo_avant_url', 'photo_apres_url'];

    protected $hidden = [];

    protected $visible = [];

    protected $with = [];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function coffret()
    {
        return $this->belongsTo(Coffret::class);
    }

    public function port()
    {
        return $this->belongsTo(Port::class);
    }

    public function equipement()
    {
        return $this->belongsTo(Equipement::class);
    }

    public function validatedBy()
    {
        return $this->belongsTo(User::class, 'validated_by');
    }

    public function getPhotoAvantUrlAttribute(): ?string
    {
        if (! $this->photo_avant) {
            return null;
        }
        $baseUrl = config('app.url', 'http://127.0.0.1:8000');
        $baseUrl = rtrim($baseUrl, '/');

        return $baseUrl.'/api/modifications/'.$this->id.'/photo/avant';
    }

    public function getPhotoApresUrlAttribute(): ?string
    {
        if (! $this->photo_apres) {
            return null;
        }
        $baseUrl = config('app.url', 'http://127.0.0.1:8000');
        $baseUrl = rtrim($baseUrl, '/');

        return $baseUrl.'/api/modifications/'.$this->id.'/photo/apres';
    }
}
