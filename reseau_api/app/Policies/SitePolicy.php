<?php

namespace App\Policies;

use App\Models\Site;
use App\Models\User;

class SitePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('batiments.voir');
    }

    public function view(User $user, Site $site): bool
    {
        return $user->can('batiments.voir');
    }

    public function create(User $user): bool
    {
        return $user->can('batiments.creer');
    }

    public function update(User $user, Site $site): bool
    {
        return $user->can('batiments.modifier');
    }

    public function delete(User $user, Site $site): bool
    {
        return $user->can('batiments.supprimer');
    }

    public function restore(User $user, Site $site): bool
    {
        return $user->can('batiments.supprimer');
    }

    public function forceDelete(User $user, Site $site): bool
    {
        return $user->isAdministrator();
    }
}
