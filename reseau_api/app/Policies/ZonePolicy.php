<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Zone;

class ZonePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('zones.voir');
    }

    public function view(User $user, Zone $zone): bool
    {
        return $user->can('zones.voir');
    }

    public function create(User $user): bool
    {
        return $user->can('zones.creer');
    }

    public function update(User $user, Zone $zone): bool
    {
        return $user->can('zones.modifier');
    }

    public function delete(User $user, Zone $zone): bool
    {
        return $user->can('zones.supprimer');
    }

    public function restore(User $user, Zone $zone): bool
    {
        return $user->can('zones.supprimer');
    }

    public function forceDelete(User $user, Zone $zone): bool
    {
        return $user->isAdministrator();
    }
}
