<?php

namespace Tests\Feature\Api;

use App\Models\Coffret;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class StatistiqueTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(\Database\Seeders\RolesAndPermissionsSeeder::class);

        $this->admin = User::factory()->create(['is_active' => true]);
        $this->admin->assignRole('Super Admin');
    }

    public function test_can_get_global_stats(): void
    {
        Coffret::factory()->count(3)->create(['status' => 'active']);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/statistiques/global');

        $response->assertOk()
            ->assertJsonStructure([
                'success',
                'data' => [
                    'coffrets' => ['total', 'active', 'inactive'],
                    'equipements' => ['total', 'active', 'inactive'],
                    'ports' => ['total', 'poe_enabled'],
                ],
            ]);
    }

    public function test_global_stats_are_cached(): void
    {
        Cache::shouldReceive('remember')
            ->once()
            ->andReturn([
                'coffrets' => ['total' => 5, 'active' => 3, 'inactive' => 2],
                'equipements' => ['total' => 10, 'active' => 8, 'inactive' => 2],
                'ports' => ['total' => 20, 'poe_enabled' => 5],
                'metrics' => ['total' => 0, 'active' => 0, 'inactive' => 0],
                'liaisons' => ['total' => 0, 'active' => 0, 'inactive' => 0],
                'systems' => ['total' => 0, 'active' => 0, 'inactive' => 0],
            ]);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/statistiques/global');

        $response->assertOk();
    }

    public function test_can_get_modifications_stats(): void
    {
        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/statistiques/modifications');

        $response->assertOk()
            ->assertJsonStructure([
                'success',
                'data' => ['total', 'en_cours', 'en_attente'],
            ]);
    }

    public function test_unauthenticated_cannot_access_stats(): void
    {
        $response = $this->getJson('/api/v1/statistiques/global');

        $response->assertUnauthorized();
    }
}
