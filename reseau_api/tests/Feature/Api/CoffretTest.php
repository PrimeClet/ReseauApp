<?php

namespace Tests\Feature\Api;

use App\Models\Batiment;
use App\Models\Salle;
use App\Models\Site;
use App\Models\User;
use App\Models\Zone;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class CoffretTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $observateur;

    protected function setUp(): void
    {
        parent::setUp();

        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            'armoires.voir', 'armoires.creer', 'armoires.modifier', 'armoires.supprimer',
            'equipements.voir', 'equipements.creer',
            'ports.voir', 'ports.creer',
            'dashboard.voir', 'dashboard.statistiques',
        ];

        foreach ($permissions as $perm) {
            Permission::create(['name' => $perm, 'guard_name' => 'web']);
        }

        $adminRole = Role::create(['name' => 'Super Admin', 'guard_name' => 'web']);
        $adminRole->syncPermissions(Permission::all());

        $obsRole = Role::create(['name' => 'Observateur', 'guard_name' => 'web']);
        $obsRole->syncPermissions(['armoires.voir', 'equipements.voir', 'ports.voir', 'dashboard.voir']);

        $this->admin = User::factory()->create();
        $this->admin->assignRole('Super Admin');

        $this->observateur = User::factory()->create();
        $this->observateur->assignRole('Observateur');
    }

    public function test_can_list_coffrets(): void
    {
        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/coffrets');

        $response->assertSuccessful();
    }

    public function test_can_create_coffret(): void
    {
        $site = Site::create(['nom' => 'Site Test', 'adresse' => '123 rue test']);
        $zone = Zone::create(['nom' => 'Zone Test', 'site_id' => $site->id]);
        $batiment = Batiment::create(['nom' => 'Batiment Test', 'zone_id' => $zone->id]);
        $salle = Salle::create(['nom' => 'Salle Test', 'batiment_id' => $batiment->id]);

        $response = $this->actingAs($this->admin)
            ->postJson('/api/v1/coffrets', [
                'nom' => 'Coffret Test',
                'batiment_id' => $batiment->id,
                'salle_id' => $salle->id,
            ]);

        $response->assertSuccessful();
    }

    public function test_observateur_cannot_create_coffret(): void
    {
        $response = $this->actingAs($this->observateur)
            ->postJson('/api/v1/coffrets', [
                'nom' => 'Coffret Test',
            ]);

        $response->assertStatus(403);
    }

    public function test_unauthenticated_cannot_list_coffrets(): void
    {
        $response = $this->getJson('/api/v1/coffrets');

        $response->assertStatus(401);
    }
}
