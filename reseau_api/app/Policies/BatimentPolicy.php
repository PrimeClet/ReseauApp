<?php

namespace App\Policies;

use App\Models\Batiment;
use App\Models\User;

class BatimentPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('batiments.voir');
    }

    public function view(User $user, Batiment $batiment): bool
    {
        return $user->can('batiments.voir');
    }

    public function create(User $user): bool
    {
        return $user->can('batiments.creer');
    }

    public function update(User $user, Batiment $batiment): bool
    {
        return $user->can('batiments.modifier');
    }

    public function delete(User $user, Batiment $batiment): bool
    {
        return $user->can('batiments.supprimer');
    }

    public function restore(User $user, Batiment $batiment): bool
    {
        return $user->can('batiments.supprimer');
    }

    public function forceDelete(User $user, Batiment $batiment): bool
    {
        return $user->isAdministrator();
    }
}
