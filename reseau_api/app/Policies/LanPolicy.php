<?php

namespace App\Policies;

use App\Models\Lan;
use App\Models\User;

class LanPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('lans.voir');
    }

    public function view(User $user, Lan $lan): bool
    {
        return $user->can('lans.voir');
    }

    public function create(User $user): bool
    {
        return $user->can('lans.creer');
    }

    public function update(User $user, Lan $lan): bool
    {
        return $user->can('lans.modifier');
    }

    public function delete(User $user, Lan $lan): bool
    {
        return $user->can('lans.supprimer');
    }
}
