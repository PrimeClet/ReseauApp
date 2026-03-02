<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class LoginTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        Role::create(['name' => 'Super Admin', 'guard_name' => 'web']);
        Role::create(['name' => 'Technicien', 'guard_name' => 'web']);
    }

    public function test_user_can_login_with_valid_credentials(): void
    {
        $user = User::factory()->create([
            'username' => 'testuser',
            'password' => bcrypt('TestPassword@123'),
            'is_active' => true,
        ]);
        $user->assignRole('Technicien');

        $response = $this->postJson('/api/v1/auth/login', [
            'username' => 'testuser',
            'password' => 'TestPassword@123',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'data' => ['user', 'token'],
                'message',
            ]);
    }

    public function test_user_cannot_login_with_invalid_credentials(): void
    {
        $user = User::factory()->create([
            'username' => 'testuser',
            'password' => bcrypt('TestPassword@123'),
        ]);
        $user->assignRole('Technicien');

        $response = $this->postJson('/api/v1/auth/login', [
            'username' => 'testuser',
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 401,
            ]);
    }

    public function test_login_requires_username_and_password(): void
    {
        $response = $this->postJson('/api/v1/auth/login', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['username', 'password']);
    }

    public function test_inactive_user_cannot_login(): void
    {
        $user = User::factory()->inactive()->create([
            'username' => 'inactiveuser',
            'password' => bcrypt('TestPassword@123'),
        ]);
        $user->assignRole('Technicien');

        $response = $this->postJson('/api/v1/auth/login', [
            'username' => 'inactiveuser',
            'password' => 'TestPassword@123',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 403,
            ]);
    }

    public function test_login_rate_limiting(): void
    {
        for ($i = 0; $i < 6; $i++) {
            $response = $this->postJson('/api/v1/auth/login', [
                'username' => 'nonexistent',
                'password' => 'password',
            ]);
        }

        $response->assertStatus(429);
    }

    public function test_authenticated_user_can_logout(): void
    {
        $user = User::factory()->create();
        $user->assignRole('Technicien');

        $response = $this->actingAs($user)
            ->postJson('/api/v1/auth/logout');

        $response->assertStatus(200);
    }

    public function test_authenticated_user_can_get_profile(): void
    {
        $user = User::factory()->create();
        $user->assignRole('Technicien');

        $response = $this->actingAs($user)
            ->getJson('/api/v1/auth/me');

        $response->assertStatus(200)
            ->assertJsonFragment([
                'email' => $user->email,
            ]);
    }

    public function test_unauthenticated_user_cannot_access_protected_routes(): void
    {
        $response = $this->getJson('/api/v1/auth/me');

        $response->assertStatus(401);
    }
}
