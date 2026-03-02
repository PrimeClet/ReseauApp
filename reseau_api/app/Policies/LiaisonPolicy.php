<?php

namespace App\Policies;

use App\Models\Liaison;
use App\Models\User;

class LiaisonPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('liaisons.voir');
    }

    public function view(User $user, Liaison $liaison): bool
    {
        return $user->can('liaisons.voir');
    }

    public function create(User $user): bool
    {
        return $user->can('liaisons.creer');
    }

    public function update(User $user, Liaison $liaison): bool
    {
        return $user->can('liaisons.modifier');
    }

    public function delete(User $user, Liaison $liaison): bool
    {
        return $user->can('liaisons.supprimer') || $user->isAdministrator();
    }
}
