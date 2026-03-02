<?php

namespace App\Policies;

use App\Models\Maintenance;
use App\Models\User;

class MaintenancePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('maintenances.voir');
    }

    public function view(User $user, Maintenance $maintenance): bool
    {
        return $user->can('maintenances.voir');
    }

    public function create(User $user): bool
    {
        return $user->can('maintenances.creer');
    }

    public function update(User $user, Maintenance $maintenance): bool
    {
        return $user->can('maintenances.modifier');
    }

    public function delete(User $user, Maintenance $maintenance): bool
    {
        return $user->can('maintenances.supprimer') || $user->isAdministrator();
    }
}
