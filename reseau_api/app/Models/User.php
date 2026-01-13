<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens, HasRoles;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'surname',
        'username',
        'phone',
        'email',
        'is_active',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $appends = ['full_name'];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Vérifie si l'utilisateur est administrateur (a le rôle Super Admin)
     */
    public function isAdministrator(): bool
    {
        return $this->hasRole('Super Admin');
    }

    /**
     * Vérifie si l'utilisateur est actif
     */
    public function isActive(): bool
    {
        return $this->is_active === true;
    }

    /**
     * Retourne le nom complet de l'utilisateur (name + surname)
     */
    public function getFullNameAttribute(): string
    {
        $name = trim($this->name ?? '');
        $surname = trim($this->surname ?? '');
        
        if ($name && $surname) {
            return $name . ' ' . $surname;
        }
        
        if ($name) {
            return $name;
        }
        
        if ($surname) {
            return $surname;
        }
        
        return $this->username ?? 'Utilisateur';
    }
}
