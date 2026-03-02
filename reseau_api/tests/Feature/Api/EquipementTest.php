<?php

namespace Tests\Feature\Api;

use App\Models\Equipement;
use App\Models\Salle;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EquipementTest extends TestCase
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

    public function test_can_list_equipements(): void
    {
        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/equipements');

        $response->assertOk()
            ->assertJsonStructure(['success', 'data']);
    }

    public function test_can_create_equipement(): void
    {
        $salle = Salle::factory()->create();

        $response = $this->actingAs($this->admin)
            ->postJson('/api/v1/equipements', [
                'name' => 'Switch Test',
                'type' => 'switch',
                'salle_id' => $salle->id,
                'status' => 'active',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('equipements', ['name' => 'Switch Test']);
    }

    public function test_can_show_equipement(): void
    {
        $equipement = Equipement::factory()->create();

        $response = $this->actingAs($this->admin)
            ->getJson("/api/v1/equipements/{$equipement->id}");

        $response->assertOk()
            ->assertJsonPath('success', true);
    }

    public function test_can_update_equipement(): void
    {
        $equipement = Equipement::factory()->create();

        $response = $this->actingAs($this->admin)
            ->putJson("/api/v1/equipements/{$equipement->id}", [
                'name' => 'Switch Updated',
            ]);

        $response->assertOk();
        $this->assertDatabaseHas('equipements', ['id' => $equipement->id, 'name' => 'Switch Updated']);
    }

    public function test_can_delete_equipement(): void
    {
        $equipement = Equipement::factory()->create();

        $response = $this->actingAs($this->admin)
            ->deleteJson("/api/v1/equipements/{$equipement->id}");

        $response->assertOk();
    }

    public function test_validation_fails_without_required_fields(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/v1/equipements', []);

        $response->assertStatus(422);
    }
}
