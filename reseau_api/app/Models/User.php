<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Testing\Fluent\Concerns\Has;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens;

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
        'role',
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
        ];
    }


    public function isAdministrator(): bool
    {
        return $this->role === 'administrator';
    }

    /**
     * Vérifie si l'utilisateur dispose d'une permission donnée
     * sur la base de son rôle et de la configuration permissions.php.
     */
    public function hasPermission(string $permission): bool
    {
        $role = $this->role ?? null;
        if (!$role) {
            return false;
        }

        $permissionsForRole = config('permissions.roles.' . $role, []);

        return in_array($permission, $permissionsForRole, true);
    }
}
