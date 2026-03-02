<?php

namespace App\Policies;

use App\Models\Coffret;
use App\Models\User;

class CoffretPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('armoires.voir');
    }

    public function view(User $user, Coffret $coffret): bool
    {
        return $user->can('armoires.voir');
    }

    public function create(User $user): bool
    {
        return $user->can('armoires.creer');
    }

    public function update(User $user, Coffret $coffret): bool
    {
        return $user->can('armoires.modifier');
    }

    public function delete(User $user, Coffret $coffret): bool
    {
        return $user->can('armoires.supprimer');
    }

    public function restore(User $user, Coffret $coffret): bool
    {
        return $user->can('armoires.supprimer');
    }

    public function forceDelete(User $user, Coffret $coffret): bool
    {
        return $user->isAdministrator();
    }
}
