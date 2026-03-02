<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class UserTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            'utilisateurs.voir', 'utilisateurs.creer', 'utilisateurs.modifier', 'utilisateurs.supprimer',
            'roles.voir',
            'permissions.voir',
            'armoires.voir', 'equipements.voir', 'ports.voir',
            'dashboard.voir', 'dashboard.statistiques',
        ];

        foreach ($permissions as $perm) {
            Permission::create(['name' => $perm, 'guard_name' => 'web']);
        }

        $adminRole = Role::create(['name' => 'Super Admin', 'guard_name' => 'web']);
        $adminRole->syncPermissions(Permission::all());

        Role::create(['name' => 'Technicien', 'guard_name' => 'web']);
        Role::create(['name' => 'Observateur', 'guard_name' => 'web']);

        $this->admin = User::factory()->create();
        $this->admin->assignRole('Super Admin');
    }

    public function test_admin_can_list_users(): void
    {
        User::factory()->count(3)->create();

        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/users');

        $response->assertSuccessful();
    }

    public function test_admin_can_create_user(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/v1/users', [
                'name' => 'Nouveau',
                'surname' => 'Utilisateur',
                'username' => 'nouveau.utilisateur',
                'email' => 'nouveau@test.com',
                'phone' => '+237 690 000 099',
                'password' => 'Password@123',
                'password_confirmation' => 'Password@123',
            ]);

        $response->assertSuccessful();
    }

    public function test_admin_can_view_single_user(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($this->admin)
            ->getJson("/api/v1/users/{$user->id}");

        $response->assertSuccessful();
    }

    public function test_admin_can_list_roles(): void
    {
        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/roles');

        $response->assertSuccessful();
    }

    public function test_admin_can_list_permissions(): void
    {
        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/permissions');

        $response->assertSuccessful();
    }

    public function test_passwords_are_hidden_in_response(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($this->admin)
            ->getJson("/api/v1/users/{$user->id}");

        $response->assertSuccessful()
            ->assertJsonMissing(['password']);
    }
}
