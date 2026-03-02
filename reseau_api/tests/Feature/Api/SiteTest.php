<?php

namespace Tests\Feature\Api;

use App\Models\Site;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SiteTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $observer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(\Database\Seeders\RolesAndPermissionsSeeder::class);

        $this->admin = User::factory()->create(['is_active' => true]);
        $this->admin->assignRole('Super Admin');

        $this->observer = User::factory()->create(['is_active' => true]);
        $this->observer->assignRole('Observateur');
    }

    public function test_admin_can_list_sites(): void
    {
        Site::factory()->count(3)->create();

        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/sites');

        $response->assertOk()
            ->assertJsonStructure(['success', 'data']);
    }

    public function test_admin_can_create_site(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/v1/sites', [
                'libelle' => 'Site Test',
                'description' => 'Description test',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('sites', ['libelle' => 'Site Test']);
    }

    public function test_admin_can_update_site(): void
    {
        $site = Site::factory()->create();

        $response = $this->actingAs($this->admin)
            ->putJson("/api/v1/sites/{$site->id}", [
                'libelle' => 'Site Updated',
            ]);

        $response->assertOk();
        $this->assertDatabaseHas('sites', ['id' => $site->id, 'libelle' => 'Site Updated']);
    }

    public function test_admin_can_delete_site(): void
    {
        $site = Site::factory()->create();

        $response = $this->actingAs($this->admin)
            ->deleteJson("/api/v1/sites/{$site->id}");

        $response->assertOk();
        $this->assertSoftDeleted('sites', ['id' => $site->id]);
    }

    public function test_observer_can_list_sites(): void
    {
        $response = $this->actingAs($this->observer)
            ->getJson('/api/v1/sites');

        $response->assertOk();
    }

    public function test_search_filters_sites(): void
    {
        Site::factory()->create(['libelle' => 'Paris Nord']);
        Site::factory()->create(['libelle' => 'Lyon Sud']);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/sites?search=Paris');

        $response->assertOk();
    }
}
