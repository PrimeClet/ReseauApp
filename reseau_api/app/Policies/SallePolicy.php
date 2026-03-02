<?php

namespace App\Policies;

use App\Models\Salle;
use App\Models\User;

class SallePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('salles.voir');
    }

    public function view(User $user, Salle $salle): bool
    {
        return $user->can('salles.voir');
    }

    public function create(User $user): bool
    {
        return $user->can('salles.creer');
    }

    public function update(User $user, Salle $salle): bool
    {
        return $user->can('salles.modifier');
    }

    public function delete(User $user, Salle $salle): bool
    {
        return $user->can('salles.supprimer');
    }

    public function restore(User $user, Salle $salle): bool
    {
        return $user->can('salles.supprimer');
    }

    public function forceDelete(User $user, Salle $salle): bool
    {
        return $user->isAdministrator();
    }
}
