<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Zone extends Model
{
    use HasFactory;

    protected $fillable = [
        'site_id',
        'libelle',
        'description',
    ];

    public function site()
    {
        return $this->belongsTo(Site::class);
    }
}
