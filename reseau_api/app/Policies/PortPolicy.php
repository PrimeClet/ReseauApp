<?php

namespace App\Policies;

use App\Models\Port;
use App\Models\User;

class PortPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('ports.voir');
    }

    public function view(User $user, Port $port): bool
    {
        return $user->can('ports.voir');
    }

    public function create(User $user): bool
    {
        return $user->can('ports.creer');
    }

    public function update(User $user, Port $port): bool
    {
        return $user->can('ports.modifier') || $user->can('ports.creer');
    }

    public function delete(User $user, Port $port): bool
    {
        return $user->can('ports.supprimer') || $user->isAdministrator();
    }
}
