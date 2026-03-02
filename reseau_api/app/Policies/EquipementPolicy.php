<?php

namespace App\Policies;

use App\Models\Equipement;
use App\Models\User;

class EquipementPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('equipements.voir');
    }

    public function view(User $user, Equipement $equipement): bool
    {
        return $user->can('equipements.voir');
    }

    public function create(User $user): bool
    {
        return $user->can('equipements.creer');
    }

    public function update(User $user, Equipement $equipement): bool
    {
        return $user->can('equipements.modifier');
    }

    public function delete(User $user, Equipement $equipement): bool
    {
        return $user->can('equipements.supprimer');
    }

    public function restore(User $user, Equipement $equipement): bool
    {
        return $user->can('equipements.supprimer');
    }

    public function forceDelete(User $user, Equipement $equipement): bool
    {
        return $user->isAdministrator();
    }
}
