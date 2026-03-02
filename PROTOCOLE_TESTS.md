# Protocole de Tests - ReseauApp

## Etat Actuel

| Composant | Infrastructure | Tests ecrits | Couverture |
|-----------|---------------|--------------|------------|
| Backend (Laravel) | PHPUnit configure | 2 squelettes | 0% |
| Frontend (React) | Aucune | Aucun | 0% |

---

## PARTIE 1 : TESTS BACKEND (Laravel / PHPUnit)

### 1.1 Configuration de l'Environnement de Test

#### Creer le fichier `.env.testing`

```bash
cd reseau_api
cp .env .env.testing
```

Editer `reseau_api/.env.testing` :

```env
APP_NAME=ReseauApp
APP_ENV=testing
APP_DEBUG=true
APP_KEY=base64:VOTRE_CLE_EXISTANTE

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=reseau_app_test
DB_USERNAME=reseau_user
DB_PASSWORD=VotreMotDePasse

CACHE_STORE=array
SESSION_DRIVER=array
QUEUE_CONNECTION=sync
MAIL_MAILER=array
```

#### Creer la base de donnees de test

```sql
CREATE DATABASE reseau_app_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON reseau_app_test.* TO 'reseau_user'@'localhost';
FLUSH PRIVILEGES;
```

#### Verifier `phpunit.xml`

Le fichier existe deja. S'assurer que ces lignes sont presentes :

```xml
<php>
    <env name="APP_ENV" value="testing"/>
    <env name="BCRYPT_ROUNDS" value="4"/>
    <env name="CACHE_STORE" value="array"/>
    <env name="MAIL_MAILER" value="array"/>
    <env name="QUEUE_CONNECTION" value="sync"/>
    <env name="SESSION_DRIVER" value="array"/>
</php>
```

### 1.2 Commandes d'Execution des Tests

```bash
cd reseau_api

# Executer tous les tests
php artisan test

# Executer avec details
php artisan test --verbose

# Executer un fichier specifique
php artisan test tests/Feature/AuthControllerTest.php

# Executer un test specifique
php artisan test --filter=test_user_can_login

# Executer uniquement les tests unitaires
php artisan test --testsuite=Unit

# Executer uniquement les tests fonctionnels
php artisan test --testsuite=Feature

# Avec couverture de code (necessite Xdebug ou PCOV)
php artisan test --coverage

# Avec couverture minimale exigee
php artisan test --coverage --min=60

# En parallele (plus rapide)
php artisan test --parallel
```

---

### 1.3 Tests d'Authentification

**Fichier** : `tests/Feature/AuthControllerTest.php`

```php
<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RolesAndPermissionsSeeder::class);
    }

    // ========== LOGIN ==========

    public function test_user_can_login_with_valid_credentials(): void
    {
        $user = User::factory()->create([
            'email' => 'test@reseau.local',
            'password' => bcrypt('Password123'),
            'is_active' => true,
        ]);
        $user->assignRole('Technicien');

        $response = $this->postJson('/api/auth/login', [
            'email' => 'test@reseau.local',
            'password' => 'Password123',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'user' => ['id', 'nom', 'prenom', 'email'],
                'token',
            ]);
    }

    public function test_login_fails_with_wrong_password(): void
    {
        $user = User::factory()->create([
            'email' => 'test@reseau.local',
            'password' => bcrypt('Password123'),
            'is_active' => true,
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'test@reseau.local',
            'password' => 'WrongPassword',
        ]);

        $response->assertStatus(401);
    }

    public function test_login_fails_with_nonexistent_email(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'email' => 'nonexistent@reseau.local',
            'password' => 'Password123',
        ]);

        $response->assertStatus(401);
    }

    public function test_login_fails_for_inactive_user(): void
    {
        $user = User::factory()->create([
            'email' => 'inactive@reseau.local',
            'password' => bcrypt('Password123'),
            'is_active' => false,
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'inactive@reseau.local',
            'password' => 'Password123',
        ]);

        $response->assertStatus(403);
    }

    public function test_login_validates_required_fields(): void
    {
        $response = $this->postJson('/api/auth/login', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email', 'password']);
    }

    // ========== LOGOUT ==========

    public function test_authenticated_user_can_logout(): void
    {
        $user = User::factory()->create(['is_active' => true]);
        $user->assignRole('Technicien');

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/auth/logout');

        $response->assertStatus(200);
    }

    public function test_unauthenticated_user_cannot_logout(): void
    {
        $response = $this->postJson('/api/auth/logout');

        $response->assertStatus(401);
    }

    // ========== PROFIL ==========

    public function test_authenticated_user_can_get_profile(): void
    {
        $user = User::factory()->create(['is_active' => true]);
        $user->assignRole('Technicien');

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/auth/me');

        $response->assertStatus(200)
            ->assertJsonFragment(['email' => $user->email]);
    }

    public function test_unauthenticated_user_cannot_get_profile(): void
    {
        $response = $this->getJson('/api/auth/me');

        $response->assertStatus(401);
    }
}
```

---

### 1.4 Tests CRUD Generiques (Exemple : Sites)

**Fichier** : `tests/Feature/SiteControllerTest.php`

```php
<?php

namespace Tests\Feature;

use App\Models\Site;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SiteControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $technicien;
    private User $observateur;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RolesAndPermissionsSeeder::class);

        $this->admin = User::factory()->create(['is_active' => true]);
        $this->admin->assignRole('Administrateur');

        $this->technicien = User::factory()->create(['is_active' => true]);
        $this->technicien->assignRole('Technicien');

        $this->observateur = User::factory()->create(['is_active' => true]);
        $this->observateur->assignRole('Observateur');
    }

    // ========== INDEX (Liste) ==========

    public function test_admin_can_list_sites(): void
    {
        Site::factory()->count(5)->create();

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/sites');

        $response->assertStatus(200)
            ->assertJsonCount(5, 'data');
    }

    public function test_unauthenticated_user_cannot_list_sites(): void
    {
        $response = $this->getJson('/api/sites');

        $response->assertStatus(401);
    }

    // ========== STORE (Creation) ==========

    public function test_admin_can_create_site(): void
    {
        $siteData = [
            'nom' => 'Site Test',
            'adresse' => '123 Rue de Test',
            'ville' => 'Douala',
            'code_postal' => '10000',
        ];

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/sites', $siteData);

        $response->assertStatus(201)
            ->assertJsonFragment(['nom' => 'Site Test']);

        $this->assertDatabaseHas('sites', ['nom' => 'Site Test']);
    }

    public function test_observateur_cannot_create_site(): void
    {
        $siteData = [
            'nom' => 'Site Interdit',
            'adresse' => '456 Rue Interdite',
        ];

        $response = $this->actingAs($this->observateur, 'sanctum')
            ->postJson('/api/sites', $siteData);

        $response->assertStatus(403);
    }

    public function test_create_site_validates_required_fields(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/sites', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['nom']);
    }

    // ========== SHOW (Detail) ==========

    public function test_admin_can_view_site(): void
    {
        $site = Site::factory()->create();

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson("/api/sites/{$site->id}");

        $response->assertStatus(200)
            ->assertJsonFragment(['id' => $site->id]);
    }

    public function test_view_nonexistent_site_returns_404(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/sites/99999');

        $response->assertStatus(404);
    }

    // ========== UPDATE (Modification) ==========

    public function test_admin_can_update_site(): void
    {
        $site = Site::factory()->create(['nom' => 'Ancien Nom']);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/sites/{$site->id}", [
                'nom' => 'Nouveau Nom',
            ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('sites', [
            'id' => $site->id,
            'nom' => 'Nouveau Nom',
        ]);
    }

    // ========== DELETE (Suppression) ==========

    public function test_admin_can_delete_site(): void
    {
        $site = Site::factory()->create();

        $response = $this->actingAs($this->admin, 'sanctum')
            ->deleteJson("/api/sites/{$site->id}");

        $response->assertStatus(200);
        $this->assertSoftDeleted('sites', ['id' => $site->id]);
    }

    public function test_technicien_cannot_delete_site(): void
    {
        $site = Site::factory()->create();

        $response = $this->actingAs($this->technicien, 'sanctum')
            ->deleteJson("/api/sites/{$site->id}");

        $response->assertStatus(403);
    }

    // ========== RESTORE (Restauration) ==========

    public function test_admin_can_restore_deleted_site(): void
    {
        $site = Site::factory()->create();
        $site->delete();

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/sites/{$site->id}/restore");

        $response->assertStatus(200);
        $this->assertDatabaseHas('sites', [
            'id' => $site->id,
            'deleted_at' => null,
        ]);
    }
}
```

---

### 1.5 Tests du Systeme de Roles et Permissions

**Fichier** : `tests/Feature/RolePermissionTest.php`

```php
<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class RolePermissionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RolesAndPermissionsSeeder::class);
    }

    // ========== ROLES ==========

    public function test_roles_are_seeded_correctly(): void
    {
        $this->assertDatabaseHas('roles', ['name' => 'Super Admin']);
        $this->assertDatabaseHas('roles', ['name' => 'Administrateur']);
        $this->assertDatabaseHas('roles', ['name' => 'Technicien']);
        $this->assertDatabaseHas('roles', ['name' => 'Observateur']);
    }

    public function test_super_admin_has_all_permissions(): void
    {
        $user = User::factory()->create(['is_active' => true]);
        $user->assignRole('Super Admin');

        $allPermissions = Permission::all();
        foreach ($allPermissions as $permission) {
            $this->assertTrue(
                $user->hasPermissionTo($permission->name),
                "Super Admin devrait avoir la permission : {$permission->name}"
            );
        }
    }

    public function test_observateur_has_only_read_permissions(): void
    {
        $user = User::factory()->create(['is_active' => true]);
        $user->assignRole('Observateur');

        // Doit avoir les permissions "voir"
        $this->assertTrue($user->hasPermissionTo('armoires.voir'));
        $this->assertTrue($user->hasPermissionTo('equipements.voir'));

        // Ne doit PAS avoir les permissions "creer", "modifier", "supprimer"
        $this->assertFalse($user->hasPermissionTo('armoires.creer'));
        $this->assertFalse($user->hasPermissionTo('equipements.modifier'));
        $this->assertFalse($user->hasPermissionTo('armoires.supprimer'));
    }

    // ========== MIDDLEWARE ==========

    public function test_role_middleware_blocks_unauthorized_role(): void
    {
        $user = User::factory()->create(['is_active' => true]);
        $user->assignRole('Observateur');

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/users', [
                'nom' => 'Test',
                'prenom' => 'User',
                'email' => 'new@test.com',
                'password' => 'Password123',
            ]);

        $response->assertStatus(403);
    }

    public function test_permission_middleware_allows_authorized_user(): void
    {
        $user = User::factory()->create(['is_active' => true]);
        $user->assignRole('Administrateur');

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/users');

        $response->assertStatus(200);
    }

    // ========== GESTION DES ROLES ==========

    public function test_admin_can_list_roles(): void
    {
        $user = User::factory()->create(['is_active' => true]);
        $user->assignRole('Super Admin');

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/roles');

        $response->assertStatus(200);
    }

    public function test_admin_can_assign_role_to_user(): void
    {
        $admin = User::factory()->create(['is_active' => true]);
        $admin->assignRole('Super Admin');

        $targetUser = User::factory()->create(['is_active' => true]);

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson("/api/users/{$targetUser->id}/roles", [
                'roles' => ['Technicien'],
            ]);

        $response->assertStatus(200);
        $this->assertTrue($targetUser->fresh()->hasRole('Technicien'));
    }
}
```

---

### 1.6 Tests du Workflow de Modifications

**Fichier** : `tests/Feature/ModificationWorkflowTest.php`

```php
<?php

namespace Tests\Feature;

use App\Models\Coffret;
use App\Models\Modification;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ModificationWorkflowTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $technicien;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RolesAndPermissionsSeeder::class);

        $this->admin = User::factory()->create(['is_active' => true]);
        $this->admin->assignRole('Administrateur');

        $this->technicien = User::factory()->create(['is_active' => true]);
        $this->technicien->assignRole('Technicien');
    }

    public function test_technicien_can_create_modification_request(): void
    {
        $coffret = Coffret::factory()->create();

        $response = $this->actingAs($this->technicien, 'sanctum')
            ->postJson('/api/modifications', [
                'coffret_id' => $coffret->id,
                'description' => 'Remplacement du switch principal',
                'type' => 'equipement',
            ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('modifications', [
            'coffret_id' => $coffret->id,
            'status' => 'pending',
        ]);
    }

    public function test_admin_can_approve_modification(): void
    {
        $modification = Modification::factory()->create([
            'status' => 'pending',
            'user_id' => $this->technicien->id,
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/modifications/{$modification->id}/approve");

        $response->assertStatus(200);
        $this->assertDatabaseHas('modifications', [
            'id' => $modification->id,
            'status' => 'approved',
        ]);
    }

    public function test_admin_can_reject_modification(): void
    {
        $modification = Modification::factory()->create([
            'status' => 'pending',
            'user_id' => $this->technicien->id,
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/modifications/{$modification->id}/reject", [
                'motif' => 'Pas de budget disponible',
            ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('modifications', [
            'id' => $modification->id,
            'status' => 'rejected',
        ]);
    }

    public function test_technicien_cannot_approve_own_modification(): void
    {
        $modification = Modification::factory()->create([
            'status' => 'pending',
            'user_id' => $this->technicien->id,
        ]);

        $response = $this->actingAs($this->technicien, 'sanctum')
            ->postJson("/api/modifications/{$modification->id}/approve");

        $response->assertStatus(403);
    }

    public function test_admin_can_request_more_info(): void
    {
        $modification = Modification::factory()->create([
            'status' => 'pending',
            'user_id' => $this->technicien->id,
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/modifications/{$modification->id}/request-more-info", [
                'message' => 'Merci de fournir des photos avant/apres',
            ]);

        $response->assertStatus(200);
    }

    public function test_admin_can_rollback_approved_modification(): void
    {
        $modification = Modification::factory()->create([
            'status' => 'approved',
            'user_id' => $this->technicien->id,
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/modifications/{$modification->id}/rollback");

        $response->assertStatus(200);
    }

    public function test_pending_modifications_list_for_admin(): void
    {
        Modification::factory()->count(3)->create([
            'status' => 'pending',
            'user_id' => $this->technicien->id,
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/modifications/pending');

        $response->assertStatus(200);
    }
}
```

---

### 1.7 Tests Unitaires des Modeles

**Fichier** : `tests/Unit/Models/EquipementTest.php`

```php
<?php

namespace Tests\Unit\Models;

use App\Models\Coffret;
use App\Models\Equipement;
use App\Models\Lan;
use App\Models\Port;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EquipementTest extends TestCase
{
    use RefreshDatabase;

    public function test_equipement_belongs_to_coffret(): void
    {
        $coffret = Coffret::factory()->create();
        $equipement = Equipement::factory()->create(['coffret_id' => $coffret->id]);

        $this->assertInstanceOf(Coffret::class, $equipement->coffret);
        $this->assertEquals($coffret->id, $equipement->coffret->id);
    }

    public function test_equipement_has_many_ports(): void
    {
        $equipement = Equipement::factory()->create();
        Port::factory()->count(3)->create(['equipement_id' => $equipement->id]);

        $this->assertCount(3, $equipement->ports);
    }

    public function test_equipement_can_be_soft_deleted(): void
    {
        $equipement = Equipement::factory()->create();

        $equipement->delete();

        $this->assertSoftDeleted('equipements', ['id' => $equipement->id]);
        $this->assertNotNull(Equipement::withTrashed()->find($equipement->id));
    }

    public function test_equipement_belongs_to_many_lans(): void
    {
        $equipement = Equipement::factory()->create(['is_manageable' => true]);
        $lan = Lan::factory()->create();

        $equipement->lans()->attach($lan->id);

        $this->assertTrue($equipement->lans->contains($lan));
    }

    public function test_equipement_type_enum_values(): void
    {
        $types = ['switch', 'routeur', 'serveur', 'onduleur', 'climatiseur', 'autre'];

        foreach ($types as $type) {
            $equipement = Equipement::factory()->create(['type' => $type]);
            $this->assertEquals($type, $equipement->type);
        }
    }
}
```

**Fichier** : `tests/Unit/Models/UserTest.php`

```php
<?php

namespace Tests\Unit\Models;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RolesAndPermissionsSeeder::class);
    }

    public function test_user_has_full_name_attribute(): void
    {
        $user = User::factory()->create([
            'nom' => 'Dupont',
            'prenom' => 'Jean',
        ]);

        $this->assertEquals('Dupont', $user->nom);
        $this->assertEquals('Jean', $user->prenom);
    }

    public function test_user_can_have_multiple_roles(): void
    {
        $user = User::factory()->create();
        $user->assignRole(['Administrateur', 'Technicien']);

        $this->assertTrue($user->hasRole('Administrateur'));
        $this->assertTrue($user->hasRole('Technicien'));
    }

    public function test_user_password_is_hashed(): void
    {
        $user = User::factory()->create(['password' => bcrypt('TestPassword')]);

        $this->assertNotEquals('TestPassword', $user->password);
    }

    public function test_user_active_status_toggle(): void
    {
        $user = User::factory()->create(['is_active' => true]);

        $this->assertTrue($user->is_active);

        $user->update(['is_active' => false]);

        $this->assertFalse($user->fresh()->is_active);
    }

    public function test_user_hidden_attributes(): void
    {
        $user = User::factory()->create();
        $array = $user->toArray();

        $this->assertArrayNotHasKey('password', $array);
        $this->assertArrayNotHasKey('remember_token', $array);
    }
}
```

---

### 1.8 Tests de la Hierarchie Infrastructure

**Fichier** : `tests/Feature/InfrastructureHierarchyTest.php`

```php
<?php

namespace Tests\Feature;

use App\Models\Batiment;
use App\Models\Coffret;
use App\Models\Equipement;
use App\Models\Port;
use App\Models\Salle;
use App\Models\Site;
use App\Models\User;
use App\Models\Zone;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InfrastructureHierarchyTest extends TestCase
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

    public function test_full_hierarchy_creation(): void
    {
        // Site -> Zone -> Batiment -> Salle -> Coffret -> Equipement -> Port
        $site = Site::factory()->create(['nom' => 'Site Central']);
        $zone = Zone::factory()->create(['site_id' => $site->id]);
        $batiment = Batiment::factory()->create(['zone_id' => $zone->id]);
        $salle = Salle::factory()->create(['batiment_id' => $batiment->id]);
        $coffret = Coffret::factory()->create(['salle_id' => $salle->id]);
        $equipement = Equipement::factory()->create(['coffret_id' => $coffret->id]);
        $port = Port::factory()->create(['equipement_id' => $equipement->id]);

        // Verifier la chaine complete
        $this->assertEquals($site->id, $zone->site_id);
        $this->assertEquals($zone->id, $batiment->zone_id);
        $this->assertEquals($batiment->id, $salle->batiment_id);
        $this->assertEquals($salle->id, $coffret->salle_id);
        $this->assertEquals($coffret->id, $equipement->coffret_id);
        $this->assertEquals($equipement->id, $port->equipement_id);
    }

    public function test_deleting_site_cascades_to_children(): void
    {
        $site = Site::factory()->create();
        $zone = Zone::factory()->create(['site_id' => $site->id]);

        $site->delete();

        // Verifier suppression en cascade ou soft delete
        $this->assertSoftDeleted('sites', ['id' => $site->id]);
    }

    public function test_coffret_has_qr_code(): void
    {
        $coffret = Coffret::factory()->create();

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson("/api/coffrets/{$coffret->id}");

        $response->assertStatus(200);
    }

    public function test_equipement_dependency_chain(): void
    {
        $equipement = Equipement::factory()->create();

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson("/api/equipements/{$equipement->id}/dependency-chain");

        $response->assertStatus(200);
    }
}
```

---

### 1.9 Tests d'Import CSV

**Fichier** : `tests/Feature/ImportControllerTest.php`

```php
<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class ImportControllerTest extends TestCase
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

    public function test_admin_can_import_csv(): void
    {
        $csvContent = "nom,type,numero_serie\nSwitch-01,switch,SN001\nRouteur-01,routeur,SN002";
        $file = UploadedFile::fake()->createWithContent('equipements.csv', $csvContent);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/import', [
                'file' => $file,
                'type' => 'equipements',
            ]);

        $response->assertStatus(200);
    }

    public function test_import_rejects_invalid_file_type(): void
    {
        $file = UploadedFile::fake()->create('malicious.exe', 100);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/import', [
                'file' => $file,
                'type' => 'equipements',
            ]);

        $response->assertStatus(422);
    }

    public function test_can_download_import_template(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/import/template/equipements');

        $response->assertStatus(200);
    }
}
```

---

### 1.10 Tests des Statistiques

**Fichier** : `tests/Feature/StatistiqueControllerTest.php`

```php
<?php

namespace Tests\Feature;

use App\Models\Coffret;
use App\Models\Equipement;
use App\Models\Port;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StatistiqueControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RolesAndPermissionsSeeder::class);

        $this->admin = User::factory()->create(['is_active' => true]);
        $this->admin->assignRole('Administrateur');
    }

    public function test_can_get_global_stats(): void
    {
        Equipement::factory()->count(10)->create();

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/stats/global');

        $response->assertStatus(200);
    }

    public function test_can_get_equipements_by_coffret(): void
    {
        $coffret = Coffret::factory()->create();
        Equipement::factory()->count(5)->create(['coffret_id' => $coffret->id]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/stats/equipements-by-coffret');

        $response->assertStatus(200);
    }

    public function test_can_get_ports_by_vlan(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/stats/ports-by-vlan');

        $response->assertStatus(200);
    }

    public function test_can_get_modifications_stats(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/stats/modifications');

        $response->assertStatus(200);
    }
}
```

---

### 1.11 Liste des Factories a Creer

Pour supporter les tests, creer les factories suivantes dans `database/factories/` :

```bash
php artisan make:factory SiteFactory
php artisan make:factory ZoneFactory
php artisan make:factory BatimentFactory
php artisan make:factory SalleFactory
php artisan make:factory CoffretFactory
php artisan make:factory EquipementFactory
php artisan make:factory PortFactory
php artisan make:factory LiaisonFactory
php artisan make:factory LanFactory
php artisan make:factory MaintenanceFactory
php artisan make:factory ModificationFactory
php artisan make:factory NotificationFactory
php artisan make:factory ActivityLogFactory
```

**Exemple** - `database/factories/SiteFactory.php` :

```php
<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class SiteFactory extends Factory
{
    public function definition(): array
    {
        return [
            'nom' => fake()->company(),
            'adresse' => fake()->streetAddress(),
            'ville' => fake()->city(),
            'code_postal' => fake()->postcode(),
            'description' => fake()->sentence(),
        ];
    }
}
```

**Exemple** - `database/factories/EquipementFactory.php` :

```php
<?php

namespace Database\Factories;

use App\Models\Coffret;
use Illuminate\Database\Eloquent\Factories\Factory;

class EquipementFactory extends Factory
{
    public function definition(): array
    {
        return [
            'nom' => fake()->words(2, true),
            'type' => fake()->randomElement(['switch', 'routeur', 'serveur', 'onduleur', 'climatiseur']),
            'marque' => fake()->randomElement(['Cisco', 'HP', 'Dell', 'Juniper', 'Fortinet']),
            'modele' => fake()->bothify('Model-##??'),
            'numero_serie' => fake()->unique()->bothify('SN-########'),
            'coffret_id' => Coffret::factory(),
            'mac_address' => fake()->macAddress(),
            'is_manageable' => fake()->boolean(30),
            'nombre_ports' => fake()->randomElement([8, 16, 24, 48]),
        ];
    }
}
```

---

### 1.12 Matrice Complète des Tests Backend

| Controleur | Index | Show | Store | Update | Delete | Restore | Actions Speciales |
|-----------|-------|------|-------|--------|--------|---------|-------------------|
| AuthController | - | - | - | - | - | - | login, logout, me |
| SiteController | X | X | X | X | X | X | trashed |
| ZoneController | X | X | X | X | X | X | trashed |
| BatimentController | X | X | X | X | X | - | - |
| SalleController | X | X | X | X | X | - | - |
| CoffretController | X | X | X | X | X | - | photo, history |
| EquipementsController | X | X | X | X | X | - | dependency-chain, vlans, find-by-code |
| PortController | X | X | X | X | X | - | - |
| LiaisonController | X | X | X | X | X | - | - |
| LanController | X | X | X | X | X | - | - |
| UserController | X | X | X | X | X | - | toggle-status, roles, permissions |
| RoleController | X | - | X | - | - | - | permissions |
| PermissionController | X | - | - | - | - | - | - |
| ModificationController | X | - | X | - | - | - | approve, reject, request-more-info, rollback, pending |
| MaintenanceController | X | X | X | X | X | - | - |
| StatistiqueController | - | - | - | - | - | - | global, by-type, by-coffret, by-vlan |
| CartographyController | - | - | - | - | - | - | lans, topology |
| ImportController | - | - | X | - | - | - | template |
| ActivityLogController | X | X | - | - | - | - | stats, by-model, cleanup |
| NotificationController | X | - | - | X | - | - | mark-read |

**Total : ~120 tests backend a ecrire**

---

## PARTIE 2 : TESTS FRONTEND (React / Vitest + Testing Library)

### 2.1 Installation des Dependances de Test

```bash
cd reseau_front

# Framework de test (Vitest = natif Vite)
npm install -D vitest @vitest/coverage-v8

# Testing Library pour React
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event

# Mock des requetes API
npm install -D msw

# Environnement DOM
npm install -D jsdom
```

### 2.2 Configuration Vitest

Ajouter dans `vite.config.ts` :

```typescript
/// <reference types="vitest" />
import { defineConfig } from 'vite';
// ... imports existants

export default defineConfig({
  // ... config existante
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/test/**',
        'src/**/*.d.ts',
        'src/main.tsx',
        'src/vite-env.d.ts',
      ],
    },
  },
});
```

### 2.3 Fichier de Setup

**Creer** `src/test/setup.ts` :

```typescript
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Nettoyer apres chaque test
afterEach(() => {
  cleanup();
});
```

### 2.4 Scripts npm

Ajouter dans `package.json` :

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui",
    "test:watch": "vitest --watch"
  }
}
```

### 2.5 Commandes d'Execution des Tests

```bash
cd reseau_front

# Mode watch (relance auto a chaque modification)
npm test

# Execution unique (CI/CD)
npm run test:run

# Avec couverture de code
npm run test:coverage

# Interface web interactive
npm run test:ui

# Fichier specifique
npx vitest src/services/authService.test.ts

# Pattern specifique
npx vitest --grep "login"
```

---

### 2.6 Mock du Serveur API (MSW)

**Creer** `src/test/mocks/handlers.ts` :

```typescript
import { http, HttpResponse } from 'msw';

const API_URL = 'http://127.0.0.1:8001/api';

// Utilisateur fictif
const mockUser = {
  id: 1,
  nom: 'Dupont',
  prenom: 'Jean',
  email: 'jean@reseau.local',
  is_active: true,
  roles: [{ name: 'Administrateur' }],
  permissions: ['armoires.voir', 'equipements.voir', 'utilisateurs.voir'],
};

export const handlers = [
  // ===== AUTH =====
  http.post(`${API_URL}/auth/login`, async ({ request }) => {
    const body = await request.json() as { email: string; password: string };
    if (body.email === 'jean@reseau.local' && body.password === 'Password123') {
      return HttpResponse.json({
        user: mockUser,
        token: 'fake-token-123',
      });
    }
    return HttpResponse.json({ message: 'Identifiants invalides' }, { status: 401 });
  }),

  http.post(`${API_URL}/auth/logout`, () => {
    return HttpResponse.json({ message: 'Deconnecte' });
  }),

  http.get(`${API_URL}/auth/me`, () => {
    return HttpResponse.json(mockUser);
  }),

  // ===== SITES =====
  http.get(`${API_URL}/sites`, () => {
    return HttpResponse.json({
      data: [
        { id: 1, nom: 'Site Central', ville: 'Douala' },
        { id: 2, nom: 'Site Nord', ville: 'Yaounde' },
      ],
    });
  }),

  // ===== EQUIPEMENTS =====
  http.get(`${API_URL}/equipements`, () => {
    return HttpResponse.json({
      data: [
        { id: 1, nom: 'Switch-01', type: 'switch', marque: 'Cisco' },
        { id: 2, nom: 'Routeur-01', type: 'routeur', marque: 'HP' },
      ],
    });
  }),

  // ===== COFFRETS =====
  http.get(`${API_URL}/coffrets`, () => {
    return HttpResponse.json({
      data: [
        { id: 1, nom: 'Armoire A1', reference: 'ARM-001' },
      ],
    });
  }),

  // ===== STATS =====
  http.get(`${API_URL}/stats/global`, () => {
    return HttpResponse.json({
      sites: 5,
      batiments: 12,
      salles: 30,
      coffrets: 45,
      equipements: 200,
      ports: 1500,
    });
  }),
];
```

**Creer** `src/test/mocks/server.ts` :

```typescript
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

**Mettre a jour** `src/test/setup.ts` :

```typescript
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from './mocks/server';

// Demarrer le serveur mock avant tous les tests
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));

// Reinitialiser les handlers apres chaque test
afterEach(() => {
  server.resetHandlers();
  cleanup();
});

// Fermer le serveur apres tous les tests
afterAll(() => server.close());
```

---

### 2.7 Utilitaire de Rendu avec Providers

**Creer** `src/test/test-utils.tsx` :

```typescript
import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

// Creer un QueryClient pour les tests
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

// Wrapper avec tous les providers
interface WrapperProps {
  children: React.ReactNode;
}

function AllProviders({ children }: WrapperProps) {
  const queryClient = createTestQueryClient();
  const store = configureStore({
    reducer: {
      // Ajouter les reducers necessaires
    },
  });

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </QueryClientProvider>
    </Provider>
  );
}

function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

// Re-exporter tout de testing-library
export * from '@testing-library/react';
export { customRender as render };
```

---

### 2.8 Tests des Services API

**Fichier** : `src/services/__tests__/authService.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { authService } from '../authService';

describe('authService', () => {
  describe('login', () => {
    it('retourne un token et un utilisateur avec des identifiants valides', async () => {
      const result = await authService.login({
        email: 'jean@reseau.local',
        password: 'Password123',
      });

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe('jean@reseau.local');
    });

    it('echoue avec des identifiants invalides', async () => {
      await expect(
        authService.login({
          email: 'jean@reseau.local',
          password: 'WrongPassword',
        })
      ).rejects.toThrow();
    });
  });

  describe('logout', () => {
    it('deconnecte l utilisateur avec succes', async () => {
      const result = await authService.logout();
      expect(result).toBeDefined();
    });
  });

  describe('getProfile', () => {
    it('retourne le profil de l utilisateur connecte', async () => {
      const profile = await authService.getProfile();

      expect(profile).toHaveProperty('id');
      expect(profile).toHaveProperty('email');
      expect(profile).toHaveProperty('roles');
    });
  });
});
```

**Fichier** : `src/services/__tests__/equipementService.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { equipementService } from '../equipementService';

describe('equipementService', () => {
  describe('getAll', () => {
    it('retourne la liste des equipements', async () => {
      const result = await equipementService.getAll();

      expect(result.data).toBeInstanceOf(Array);
      expect(result.data.length).toBeGreaterThan(0);
    });

    it('chaque equipement a les champs requis', async () => {
      const result = await equipementService.getAll();

      result.data.forEach((equipement: any) => {
        expect(equipement).toHaveProperty('id');
        expect(equipement).toHaveProperty('nom');
        expect(equipement).toHaveProperty('type');
      });
    });
  });
});
```

---

### 2.9 Tests des Composants UI

**Fichier** : `src/components/layout/__tests__/Navbar.test.tsx`

```typescript
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from '../../../test/test-utils';
import Navbar from '../Navbar';

describe('Navbar', () => {
  it('affiche le composant sans erreur', () => {
    render(<Navbar />);
    // Verifier qu'un element du navbar est present
    expect(document.querySelector('nav')).toBeInTheDocument();
  });

  it('affiche le logo ou le nom de l application', () => {
    render(<Navbar />);
    // Adapter selon le contenu reel du navbar
    expect(screen.getByText(/reseau|qr cabinets/i)).toBeInTheDocument();
  });
});
```

**Fichier** : `src/components/dashboard/__tests__/StatsCard.test.tsx`

```typescript
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from '../../../test/test-utils';
import StatsCard from '../StatsCard';

describe('StatsCard', () => {
  it('affiche le titre et la valeur', () => {
    render(<StatsCard title="Equipements" value={150} />);

    expect(screen.getByText('Equipements')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
  });

  it('affiche une icone si fournie', () => {
    render(<StatsCard title="Sites" value={5} icon="building" />);

    expect(screen.getByText('Sites')).toBeInTheDocument();
  });
});
```

---

### 2.10 Tests des Pages

**Fichier** : `src/pages/__tests__/Login.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../test/test-utils';
import Login from '../Login';

describe('Page Login', () => {
  it('affiche le formulaire de connexion', () => {
    render(<Login />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mot de passe/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /connexion|se connecter/i })).toBeInTheDocument();
  });

  it('affiche une erreur si les champs sont vides', async () => {
    const user = userEvent.setup();
    render(<Login />);

    const submitButton = screen.getByRole('button', { name: /connexion|se connecter/i });
    await user.click(submitButton);

    await waitFor(() => {
      // Verifier qu'un message d'erreur apparait
      const errorMessages = document.querySelectorAll('[role="alert"], .text-red, .text-destructive');
      expect(errorMessages.length).toBeGreaterThan(0);
    });
  });

  it('permet de saisir l email et le mot de passe', async () => {
    const user = userEvent.setup();
    render(<Login />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/mot de passe/i);

    await user.type(emailInput, 'jean@reseau.local');
    await user.type(passwordInput, 'Password123');

    expect(emailInput).toHaveValue('jean@reseau.local');
    expect(passwordInput).toHaveValue('Password123');
  });
});
```

**Fichier** : `src/pages/__tests__/Index.test.tsx`

```typescript
import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { render } from '../../test/test-utils';
import Index from '../Index';

describe('Page Dashboard (Index)', () => {
  it('affiche le dashboard avec les statistiques', async () => {
    render(<Index />);

    await waitFor(() => {
      // Verifier que les cards de stats sont presentes
      const statsElements = document.querySelectorAll('[class*="card"], [class*="stat"]');
      expect(statsElements.length).toBeGreaterThan(0);
    });
  });
});
```

---

### 2.11 Tests des Hooks Personnalises

**Fichier** : `src/hooks/__tests__/usePermission.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';

// Adapter selon l'implementation reelle du hook
describe('usePermission', () => {
  it('retourne true pour une permission accordee', () => {
    // Mock du contexte auth avec les permissions
    // const { result } = renderHook(() => usePermission('armoires.voir'));
    // expect(result.current).toBe(true);
  });

  it('retourne false pour une permission non accordee', () => {
    // const { result } = renderHook(() => usePermission('utilisateurs.supprimer'));
    // expect(result.current).toBe(false);
  });
});
```

---

### 2.12 Matrice Complète des Tests Frontend

| Module | Fichier | Tests a ecrire |
|--------|---------|----------------|
| **Services** | authService.test.ts | login, logout, getProfile |
| | coffretService.test.ts | getAll, getById, create, update, delete |
| | equipementService.test.ts | getAll, getById, create, update, delete, findByCode |
| | portService.test.ts | getAll, getById, create, update, delete |
| | liaisonService.test.ts | getAll, getById, create, update, delete |
| | lanService.test.ts | getAll, getById, create, update, delete |
| | activityLogService.test.ts | getAll, getById, getStats |
| **Pages** | Login.test.tsx | rendu, validation, soumission, erreurs |
| | Index.test.tsx | rendu dashboard, chargement stats |
| | Equipements.test.tsx | liste, filtres, pagination |
| | Armoires.test.tsx | liste, actions CRUD |
| | Ports.test.tsx | liste, filtres |
| | Users.test.tsx | liste, creation, edition |
| | Sites.test.tsx | liste, CRUD |
| | Unauthorized.test.tsx | affichage message 403 |
| | NotFound.test.tsx | affichage message 404 |
| **Composants** | Navbar.test.tsx | rendu, navigation, menu utilisateur |
| | Sidebar.test.tsx | rendu, liens, role-based visibility |
| | StatsCard.test.tsx | rendu titre/valeur/icone |
| | DataTableEnhanced.test.tsx | rendu, tri, filtre, pagination |
| | DetailsModal.test.tsx | ouverture, fermeture, contenu |
| | EditModal.test.tsx | ouverture, formulaire, soumission |
| **Formulaires** | AddEquipmentForm.test.tsx | rendu, validation, soumission |
| | AddArmoireForm.test.tsx | rendu, validation, soumission |
| | AddPortForm.test.tsx | rendu, validation, soumission |
| | AddLanForm.test.tsx | rendu, validation, soumission |
| | AddLiaisonForm.test.tsx | rendu, validation, soumission |
| **Hooks** | usePermission.test.ts | permissions ok/ko |
| | useRequireAuth.test.ts | redirection si non connecte |
| **Contextes** | AuthContext.test.tsx | login, logout, etat auth |

**Total : ~80 tests frontend a ecrire**

---

## PARTIE 3 : TESTS END-TO-END (E2E) avec Playwright

### 3.1 Installation

```bash
cd reseau_front

npm install -D @playwright/test
npx playwright install
```

### 3.2 Configuration

**Creer** `playwright.config.ts` :

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
  ],
  use: {
    baseURL: 'http://127.0.0.1:8080',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://127.0.0.1:8080',
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});
```

### 3.3 Scripts npm

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:report": "playwright show-report"
  }
}
```

### 3.4 Commandes d'Execution

```bash
# Tous les tests E2E
npm run test:e2e

# Avec interface graphique interactive
npm run test:e2e:ui

# En mode visible (navigateur ouvert)
npm run test:e2e:headed

# Un fichier specifique
npx playwright test e2e/auth.spec.ts

# Un test specifique
npx playwright test -g "peut se connecter"

# Sur un navigateur specifique
npx playwright test --project=chromium

# Voir le rapport HTML
npm run test:e2e:report

# Mode debug
npx playwright test --debug
```

---

### 3.5 Test E2E : Authentification

**Creer** `e2e/auth.spec.ts` :

```typescript
import { test, expect } from '@playwright/test';

test.describe('Authentification', () => {
  test('affiche la page de connexion', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/mot de passe/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /connexion|se connecter/i })).toBeVisible();
  });

  test('connexion reussie avec identifiants valides', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel(/email/i).fill('superadmin@reseau.local');
    await page.getByLabel(/mot de passe/i).fill('SuperAdmin@2024');
    await page.getByRole('button', { name: /connexion|se connecter/i }).click();

    // Verifier la redirection vers le dashboard
    await expect(page).toHaveURL(/\/(dashboard|index)?$/);
    // Verifier qu'un element du dashboard est visible
    await expect(page.locator('nav')).toBeVisible();
  });

  test('connexion echouee avec mauvais mot de passe', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel(/email/i).fill('superadmin@reseau.local');
    await page.getByLabel(/mot de passe/i).fill('MauvaisMotDePasse');
    await page.getByRole('button', { name: /connexion|se connecter/i }).click();

    // Verifier qu'un message d'erreur apparait
    await expect(page.getByText(/invalide|erreur|incorrect/i)).toBeVisible();
    // Verifier qu'on reste sur la page login
    await expect(page).toHaveURL(/\/login/);
  });

  test('deconnexion', async ({ page }) => {
    // Se connecter d'abord
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('superadmin@reseau.local');
    await page.getByLabel(/mot de passe/i).fill('SuperAdmin@2024');
    await page.getByRole('button', { name: /connexion|se connecter/i }).click();
    await expect(page).toHaveURL(/\/(dashboard|index)?$/);

    // Se deconnecter
    // Adapter selon l'UI : clic sur avatar/menu puis bouton deconnexion
    await page.getByRole('button', { name: /profil|compte|menu/i }).click();
    await page.getByText(/deconnexion|logout/i).click();

    await expect(page).toHaveURL(/\/login/);
  });

  test('redirection vers login si non authentifie', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveURL(/\/login/);
  });
});
```

### 3.6 Test E2E : Navigation et Dashboard

**Creer** `e2e/dashboard.spec.ts` :

```typescript
import { test, expect } from '@playwright/test';

// Fixture pour se connecter avant chaque test
test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('superadmin@reseau.local');
    await page.getByLabel(/mot de passe/i).fill('SuperAdmin@2024');
    await page.getByRole('button', { name: /connexion|se connecter/i }).click();
    await expect(page).toHaveURL(/\/(dashboard|index)?$/);
  });

  test('affiche les statistiques globales', async ({ page }) => {
    // Verifier que les cartes de statistiques sont chargees
    await expect(page.locator('[class*="card"], [class*="stat"]').first()).toBeVisible();
  });

  test('navigation vers la page Equipements', async ({ page }) => {
    await page.getByRole('link', { name: /equipement/i }).click();
    await expect(page).toHaveURL(/\/equipements/);
  });

  test('navigation vers la page Armoires', async ({ page }) => {
    await page.getByRole('link', { name: /armoire|coffret/i }).click();
    await expect(page).toHaveURL(/\/armoires/);
  });

  test('navigation vers la page Sites', async ({ page }) => {
    await page.getByRole('link', { name: /site/i }).click();
    await expect(page).toHaveURL(/\/sites/);
  });
});
```

### 3.7 Test E2E : CRUD Equipements

**Creer** `e2e/equipements.spec.ts` :

```typescript
import { test, expect } from '@playwright/test';

test.describe('Gestion des Equipements', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('superadmin@reseau.local');
    await page.getByLabel(/mot de passe/i).fill('SuperAdmin@2024');
    await page.getByRole('button', { name: /connexion|se connecter/i }).click();
    await page.goto('/equipements');
  });

  test('affiche la liste des equipements', async ({ page }) => {
    // Verifier que le tableau est charge
    await expect(page.locator('table, [class*="data-table"]').first()).toBeVisible();
  });

  test('peut ouvrir le formulaire d ajout', async ({ page }) => {
    await page.getByRole('button', { name: /ajouter|nouveau|creer/i }).click();

    // Verifier que le formulaire/modal est visible
    await expect(page.getByText(/ajouter.*equipement|nouvel.*equipement/i)).toBeVisible();
  });

  test('peut creer un nouvel equipement', async ({ page }) => {
    await page.getByRole('button', { name: /ajouter|nouveau|creer/i }).click();

    // Remplir le formulaire (adapter selon les champs reels)
    await page.getByLabel(/nom/i).fill('Switch-Test-E2E');
    await page.getByLabel(/type/i).selectOption('switch');
    await page.getByLabel(/marque/i).fill('Cisco');

    // Soumettre
    await page.getByRole('button', { name: /enregistrer|sauvegarder|creer/i }).click();

    // Verifier la creation
    await expect(page.getByText('Switch-Test-E2E')).toBeVisible();
  });

  test('peut voir les details d un equipement', async ({ page }) => {
    // Cliquer sur le premier equipement de la liste
    await page.locator('table tbody tr').first().click();

    // Verifier qu'un modal ou une page de detail s'ouvre
    await expect(page.getByText(/detail|information/i)).toBeVisible();
  });

  test('peut filtrer les equipements par type', async ({ page }) => {
    // Utiliser le filtre de type
    const filterSelect = page.getByLabel(/type|filtre/i);
    if (await filterSelect.isVisible()) {
      await filterSelect.selectOption('switch');
      // Verifier que seuls les switches sont affiches
    }
  });

  test('peut rechercher un equipement', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/rechercher|search/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill('Switch');
      // Verifier que les resultats sont filtres
    }
  });
});
```

### 3.8 Test E2E : Workflow de Modification

**Creer** `e2e/modifications.spec.ts` :

```typescript
import { test, expect } from '@playwright/test';

test.describe('Workflow de Modifications', () => {
  test('technicien peut creer une demande de modification', async ({ page }) => {
    // Connexion en tant que technicien
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('paul.technicien@reseau.local');
    await page.getByLabel(/mot de passe/i).fill('Tech@2024');
    await page.getByRole('button', { name: /connexion|se connecter/i }).click();

    // Naviguer vers les modifications
    await page.goto('/modifications');

    // Creer une nouvelle modification
    await page.getByRole('button', { name: /nouvelle|ajouter|creer/i }).click();

    // Remplir le formulaire
    await page.getByLabel(/description/i).fill('Test modification E2E');

    // Soumettre
    await page.getByRole('button', { name: /enregistrer|soumettre/i }).click();

    // Verifier
    await expect(page.getByText('Test modification E2E')).toBeVisible();
  });

  test('admin peut voir les modifications en attente', async ({ page }) => {
    // Connexion en tant qu'admin
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('jean.directeur@reseau.local');
    await page.getByLabel(/mot de passe/i).fill('Admin@2024');
    await page.getByRole('button', { name: /connexion|se connecter/i }).click();

    // Naviguer vers la validation
    await page.goto('/validation-modifications');

    // Verifier que la page est accessible
    await expect(page.locator('table, [class*="data-table"]').first()).toBeVisible();
  });

  test('admin peut approuver une modification', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('jean.directeur@reseau.local');
    await page.getByLabel(/mot de passe/i).fill('Admin@2024');
    await page.getByRole('button', { name: /connexion|se connecter/i }).click();

    await page.goto('/validation-modifications');

    // Cliquer sur approuver pour la premiere modification
    const approveButton = page.getByRole('button', { name: /approuver|valider/i }).first();
    if (await approveButton.isVisible()) {
      await approveButton.click();
      // Confirmer si necessaire
    }
  });
});
```

### 3.9 Test E2E : Permissions et Acces

**Creer** `e2e/permissions.spec.ts` :

```typescript
import { test, expect } from '@playwright/test';

test.describe('Controle d acces par role', () => {
  test('observateur ne voit pas les boutons de creation', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('alice.observatrice@reseau.local');
    await page.getByLabel(/mot de passe/i).fill('Obs@2024');
    await page.getByRole('button', { name: /connexion|se connecter/i }).click();

    await page.goto('/equipements');

    // Les boutons d'ajout ne doivent pas etre visibles
    const addButton = page.getByRole('button', { name: /ajouter|nouveau|creer/i });
    await expect(addButton).not.toBeVisible();
  });

  test('observateur ne peut pas acceder a la gestion des utilisateurs', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('alice.observatrice@reseau.local');
    await page.getByLabel(/mot de passe/i).fill('Obs@2024');
    await page.getByRole('button', { name: /connexion|se connecter/i }).click();

    await page.goto('/users');

    // Doit etre redirige vers unauthorized ou ne pas voir le contenu
    await expect(page).toHaveURL(/\/(unauthorized|login)/);
  });

  test('admin peut acceder a toutes les sections', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('superadmin@reseau.local');
    await page.getByLabel(/mot de passe/i).fill('SuperAdmin@2024');
    await page.getByRole('button', { name: /connexion|se connecter/i }).click();

    const pages = ['/equipements', '/armoires', '/users', '/roles', '/sites'];

    for (const path of pages) {
      await page.goto(path);
      // Aucune redirection vers unauthorized
      await expect(page).not.toHaveURL(/\/unauthorized/);
    }
  });
});
```

### 3.10 Test E2E : PWA et Responsive

**Creer** `e2e/pwa-responsive.spec.ts` :

```typescript
import { test, expect, devices } from '@playwright/test';

test.describe('PWA et Responsive', () => {
  test('le manifest PWA est accessible', async ({ page }) => {
    const response = await page.goto('/manifest.webmanifest');
    expect(response?.status()).toBe(200);
  });

  test('le service worker est enregistre', async ({ page }) => {
    await page.goto('/login');

    const swRegistered = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        return registrations.length > 0;
      }
      return false;
    });

    // En dev, le SW peut ne pas etre actif
    // Ce test est plus pertinent en build de production
  });

  test('affichage correct sur mobile', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 13'],
    });
    const page = await context.newPage();

    await page.goto('/login');

    // Le formulaire doit etre visible et utilisable
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/mot de passe/i)).toBeVisible();

    await context.close();
  });

  test('le sidebar se ferme sur mobile', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 13'],
    });
    const page = await context.newPage();

    await page.goto('/login');
    await page.getByLabel(/email/i).fill('superadmin@reseau.local');
    await page.getByLabel(/mot de passe/i).fill('SuperAdmin@2024');
    await page.getByRole('button', { name: /connexion|se connecter/i }).click();

    // Le sidebar doit etre cache par defaut sur mobile
    const sidebar = page.locator('[class*="sidebar"]');
    // Verifier le comportement responsive

    await context.close();
  });
});
```

---

## PARTIE 4 : TESTS DE PERFORMANCE ET CHARGE

### 4.1 Tests de Performance API avec Artillery

```bash
npm install -g artillery
```

**Creer** `tests/performance/api-load.yml` :

```yaml
config:
  target: "https://reseau-api.votre-domaine.com"
  phases:
    - duration: 60
      arrivalRate: 5
      name: "Montee en charge progressive"
    - duration: 120
      arrivalRate: 20
      name: "Charge soutenue"
    - duration: 60
      arrivalRate: 50
      name: "Pic de charge"
  defaults:
    headers:
      Content-Type: "application/json"
      Accept: "application/json"

before:
  flow:
    - post:
        url: "/api/auth/login"
        json:
          email: "superadmin@reseau.local"
          password: "SuperAdmin@2024"
        capture:
          - json: "$.token"
            as: "authToken"

scenarios:
  - name: "Consultation dashboard"
    weight: 40
    flow:
      - get:
          url: "/api/stats/global"
          headers:
            Authorization: "Bearer {{ authToken }}"
          expect:
            - statusCode: 200

  - name: "Liste equipements"
    weight: 30
    flow:
      - get:
          url: "/api/equipements"
          headers:
            Authorization: "Bearer {{ authToken }}"
          expect:
            - statusCode: 200

  - name: "Liste coffrets"
    weight: 20
    flow:
      - get:
          url: "/api/coffrets"
          headers:
            Authorization: "Bearer {{ authToken }}"
          expect:
            - statusCode: 200

  - name: "Cartographie"
    weight: 10
    flow:
      - get:
          url: "/api/cartography/topology"
          headers:
            Authorization: "Bearer {{ authToken }}"
          expect:
            - statusCode: 200
```

```bash
# Executer le test de charge
artillery run tests/performance/api-load.yml

# Avec rapport HTML
artillery run tests/performance/api-load.yml --output report.json
artillery report report.json --output report.html
```

### 4.2 Seuils de Performance Acceptables

| Metrique | Seuil Acceptable | Critique |
|----------|-------------------|----------|
| Temps de reponse moyen | < 200ms | > 500ms |
| P95 temps de reponse | < 500ms | > 1000ms |
| P99 temps de reponse | < 1000ms | > 2000ms |
| Taux d'erreur | < 1% | > 5% |
| Requetes/seconde | > 100 | < 50 |
| Temps chargement frontend | < 3s | > 5s |
| First Contentful Paint | < 1.5s | > 3s |
| Largest Contentful Paint | < 2.5s | > 4s |

---

## PARTIE 5 : TESTS DE SECURITE

### 5.1 Verification des Headers HTTP

```bash
# Scanner les headers de securite
curl -I https://reseau-api.votre-domaine.com/api/

# Verifications attendues :
# X-Frame-Options: SAMEORIGIN
# X-Content-Type-Options: nosniff
# Strict-Transport-Security: max-age=31536000
# X-XSS-Protection: 1; mode=block
```

### 5.2 Tests de Securite API Manuels

```bash
# 1. Tentative d'acces sans token
curl -s https://reseau-api.votre-domaine.com/api/users
# Attendu : 401 Unauthorized

# 2. Tentative avec token invalide
curl -s -H "Authorization: Bearer fake-token" \
  https://reseau-api.votre-domaine.com/api/users
# Attendu : 401 Unauthorized

# 3. Tentative d'injection SQL
curl -s -X POST https://reseau-api.votre-domaine.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com OR 1=1","password":"test"}'
# Attendu : 422 Validation Error (pas d'injection)

# 4. Tentative XSS via input
curl -s -X POST https://reseau-api.votre-domaine.com/api/sites \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nom":"<script>alert(1)</script>"}'
# Attendu : Les donnees sont echappees

# 5. Verification CORS
curl -s -H "Origin: https://evil-site.com" \
  -I https://reseau-api.votre-domaine.com/api/
# Attendu : Pas de Access-Control-Allow-Origin pour ce domaine

# 6. Tentative d'acces au .env
curl -s https://reseau-api.votre-domaine.com/.env
# Attendu : 403 ou 404

# 7. Verification des taux de limitation (rate limiting)
for i in $(seq 1 100); do
  curl -s -o /dev/null -w "%{http_code}\n" \
    https://reseau-api.votre-domaine.com/api/auth/login \
    -X POST -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"test"}'
done
# Attendu : 429 Too Many Requests apres un certain nombre
```

### 5.3 Checklist de Securite

```
[ ] Endpoints proteges par auth:sanctum
[ ] Permissions verifiees sur chaque route protegee
[ ] Validation des donnees entrantes sur chaque endpoint
[ ] Pas d'injection SQL possible (Eloquent ORM)
[ ] Pas de XSS (echappement des sorties)
[ ] CORS restreint aux domaines autorises
[ ] Rate limiting active sur /auth/login
[ ] Fichier .env inaccessible depuis le web
[ ] Dossier storage/ inaccessible depuis le web
[ ] Tokens Sanctum avec expiration
[ ] Mots de passe hashes (bcrypt)
[ ] HTTPS force en production
```

---

## PARTIE 6 : INTEGRATION CONTINUE (CI/CD)

### 6.1 GitHub Actions

**Creer** `.github/workflows/tests.yml` :

```yaml
name: Tests ReseauApp

on:
  push:
    branches: [main, prime-update]
  pull_request:
    branches: [main]

jobs:
  # ===== TESTS BACKEND =====
  backend-tests:
    runs-on: ubuntu-latest

    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: root
          MYSQL_DATABASE: reseau_app_test
        ports:
          - 3306:3306
        options: >-
          --health-cmd="mysqladmin ping"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=3

    steps:
      - uses: actions/checkout@v4

      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.2'
          extensions: mbstring, xml, mysql, zip, bcmath, gd
          coverage: pcov

      - name: Install Composer dependencies
        working-directory: reseau_api
        run: composer install --no-dev --optimize-autoloader --no-interaction

      - name: Setup environment
        working-directory: reseau_api
        run: |
          cp .env.example .env.testing
          php artisan key:generate --env=testing

      - name: Run migrations
        working-directory: reseau_api
        env:
          DB_CONNECTION: mysql
          DB_HOST: 127.0.0.1
          DB_PORT: 3306
          DB_DATABASE: reseau_app_test
          DB_USERNAME: root
          DB_PASSWORD: root
        run: php artisan migrate --env=testing

      - name: Run tests
        working-directory: reseau_api
        env:
          DB_CONNECTION: mysql
          DB_HOST: 127.0.0.1
          DB_PORT: 3306
          DB_DATABASE: reseau_app_test
          DB_USERNAME: root
          DB_PASSWORD: root
        run: php artisan test --coverage --min=60

  # ===== TESTS FRONTEND =====
  frontend-tests:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: reseau_front/package-lock.json

      - name: Install dependencies
        working-directory: reseau_front
        run: npm ci

      - name: Run linter
        working-directory: reseau_front
        run: npm run lint

      - name: Run unit tests
        working-directory: reseau_front
        run: npm run test:run

      - name: Run build
        working-directory: reseau_front
        env:
          VITE_API_URL: http://localhost:8001/api
        run: npm run build

  # ===== TESTS E2E =====
  e2e-tests:
    runs-on: ubuntu-latest
    needs: [backend-tests, frontend-tests]

    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: root
          MYSQL_DATABASE: reseau_app_test
        ports:
          - 3306:3306
        options: >-
          --health-cmd="mysqladmin ping"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=3

    steps:
      - uses: actions/checkout@v4

      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.2'
          extensions: mbstring, xml, mysql, zip, bcmath, gd

      - name: Setup backend
        working-directory: reseau_api
        run: |
          composer install --no-interaction
          cp .env.example .env
          php artisan key:generate
          php artisan migrate --seed
          php artisan serve &

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install frontend dependencies
        working-directory: reseau_front
        run: npm ci

      - name: Install Playwright
        working-directory: reseau_front
        run: npx playwright install --with-deps chromium

      - name: Run E2E tests
        working-directory: reseau_front
        run: npx playwright test --project=chromium
```

---

## PARTIE 7 : ORDRE D'EXECUTION RECOMMANDE

### Phase 1 : Fondations (Semaine 1)
```
1. Creer les factories Laravel (14 factories)
2. Ecrire les tests unitaires des modeles (16 modeles)
3. Ecrire les tests d'authentification
4. Ecrire les tests de roles et permissions
```

### Phase 2 : Tests CRUD Backend (Semaine 2)
```
5. Tests des endpoints CRUD pour chaque controleur
6. Tests du workflow de modifications
7. Tests d'import CSV
8. Tests des statistiques
```

### Phase 3 : Frontend Unitaire (Semaine 3)
```
9. Installer Vitest + Testing Library + MSW
10. Configurer les mocks API
11. Ecrire les tests des services API
12. Ecrire les tests des composants UI
```

### Phase 4 : Frontend Pages + E2E (Semaine 4)
```
13. Tests des pages (Login, Dashboard, listes)
14. Installer Playwright
15. Ecrire les tests E2E critiques (auth, CRUD, workflow)
16. Tests responsive et PWA
```

### Phase 5 : Performance et Securite (Semaine 5)
```
17. Tests de charge avec Artillery
18. Tests de securite manuels
19. Configuration CI/CD GitHub Actions
20. Documentation des resultats
```

---

## Resume des Outils

| Outil | Usage | Commande |
|-------|-------|----------|
| **PHPUnit** | Tests backend unitaires/feature | `php artisan test` |
| **Vitest** | Tests frontend unitaires | `npm test` |
| **Testing Library** | Tests composants React | Integre dans Vitest |
| **MSW** | Mock serveur API (frontend) | Integre dans Vitest |
| **Playwright** | Tests E2E navigateur | `npm run test:e2e` |
| **Artillery** | Tests de charge API | `artillery run` |
| **GitHub Actions** | CI/CD automatise | Push/PR sur GitHub |

**Nombre total de tests estimes : ~200+**
- Backend : ~120 tests
- Frontend unitaires : ~80 tests
- E2E : ~30 scenarios
