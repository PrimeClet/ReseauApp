<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class System extends Model
{
    protected $fillable = [
        'name', 'type', 'description', 'vendor','endpoint', 'monitored_scope', 'status'
    ];
}
