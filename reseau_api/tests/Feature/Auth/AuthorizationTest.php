<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AuthorizationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create permissions
        $permissions = [
            'armoires.voir', 'armoires.creer', 'armoires.modifier', 'armoires.supprimer',
            'equipements.voir', 'equipements.creer', 'equipements.modifier', 'equipements.supprimer',
            'ports.voir', 'ports.creer',
            'dashboard.voir', 'dashboard.statistiques',
        ];

        foreach ($permissions as $perm) {
            Permission::create(['name' => $perm, 'guard_name' => 'web']);
        }

        // Create roles
        $admin = Role::create(['name' => 'Super Admin', 'guard_name' => 'web']);
        $admin->syncPermissions(Permission::all());

        $observateur = Role::create(['name' => 'Observateur', 'guard_name' => 'web']);
        $observateur->syncPermissions([
            'armoires.voir', 'equipements.voir', 'ports.voir', 'dashboard.voir',
        ]);

        $technicien = Role::create(['name' => 'Technicien', 'guard_name' => 'web']);
        $technicien->syncPermissions([
            'armoires.voir', 'armoires.creer', 'armoires.modifier',
            'equipements.voir', 'equipements.creer', 'equipements.modifier',
            'ports.voir', 'ports.creer',
            'dashboard.voir',
        ]);
    }

    public function test_observateur_cannot_create_resources(): void
    {
        $user = User::factory()->create();
        $user->assignRole('Observateur');

        $response = $this->actingAs($user)
            ->postJson('/api/v1/coffrets', [
                'nom' => 'Test Coffret',
            ]);

        $response->assertStatus(403);
    }

    public function test_admin_can_access_all_resources(): void
    {
        $user = User::factory()->create();
        $user->assignRole('Super Admin');

        $response = $this->actingAs($user)
            ->getJson('/api/v1/coffrets');

        $response->assertSuccessful();
    }

    public function test_response_includes_correlation_id(): void
    {
        $user = User::factory()->create();
        $user->assignRole('Super Admin');

        $response = $this->actingAs($user)
            ->getJson('/api/v1/coffrets');

        $response->assertHeader('X-Correlation-ID');
    }

    public function test_custom_correlation_id_is_preserved(): void
    {
        $user = User::factory()->create();
        $user->assignRole('Super Admin');

        $customId = 'test-correlation-123';

        $response = $this->actingAs($user)
            ->withHeader('X-Correlation-ID', $customId)
            ->getJson('/api/v1/coffrets');

        $response->assertHeader('X-Correlation-ID', $customId);
    }
}
