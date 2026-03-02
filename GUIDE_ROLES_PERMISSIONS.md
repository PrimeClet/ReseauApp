# Guide de gestion des rôles et permissions

## Architecture actuelle

Votre application utilise le package **Spatie Laravel Permission** pour gérer les rôles et permissions de manière granulaire.

### Composants clés

1. **RolesAndPermissionsSeeder** - Définit tous les rôles et permissions
2. **RoleMiddleware** - Protège les routes par rôle
3. **PermissionMiddleware** - Protège les routes par permission
4. **User Model** - Utilise le trait `HasRoles` de Spatie

---

## Les 4 rôles par défaut

### 1. Super Admin
**Accès complet** à toutes les fonctionnalités

**Permissions**: Toutes (`*`)

**Cas d'usage**: Administrateur système principal

---

### 2. Administrateur
**Gestion complète** avec limitations sur certaines opérations terrain

**Permissions**:
- ✅ Utilisateurs (voir, créer, modifier)
- ✅ Rôles (voir)
- ✅ Permissions (voir)
- ✅ Infrastructure complète (batiments, salles, armoires, equipements, ports, liaisons, lans)
- ✅ Maintenance (créer, assigner) - mais PAS exécuter/rapporter
- ✅ Modifications (voir, valider, historique) - mais PAS créer
- ✅ Cartographie et Dashboard

**Workflow**:
- Crée des **maintenances** et les assigne aux techniciens
- **Valide** les modifications soumises par les techniciens
- Gère les utilisateurs et l'infrastructure

---

### 3. Technicien
**Opérations terrain** et gestion du réseau

**Permissions**:
- ✅ Infrastructure (voir tout, modifier armoires/equipements/ports/liaisons)
- ✅ Maintenance (voir les siennes, exécuter, rapporter)
- ✅ Modifications (créer, modifier les siennes, voir historique)
- ✅ Cartographie et Dashboard (lecture)

**Workflow**:
- **Exécute** les maintenances assignées
- **Soumet** des modifications après scan QR
- Modifie l'infrastructure réseau

---

### 4. Observateur
**Lecture seule** sur toute l'application

**Permissions**:
- ✅ Lecture uniquement (`.voir` sur tous les modules)

**Cas d'usage**: Auditeurs, managers, consultants

---

## Comment ajouter un nouveau module avec permissions

### Étape 1: Définir le module dans RolesAndPermissionsSeeder

```php
// reseau_api/database/seeders/RolesAndPermissionsSeeder.php

private array $modules = [
    // ... modules existants
    'nouveau_module' => ['voir', 'creer', 'modifier', 'supprimer', 'exporter'],
];
```

### Étape 2: Attribuer les permissions aux rôles

```php
private array $roles = [
    'Super Admin' => '*', // A déjà tout
    'Administrateur' => [
        // ... permissions existantes
        'nouveau_module.*', // Toutes les permissions du module
    ],
    'Technicien' => [
        // ... permissions existantes
        'nouveau_module.voir',
        'nouveau_module.creer',
    ],
    'Observateur' => [
        // ... permissions existantes
        'nouveau_module.voir',
    ],
];
```

### Étape 3: Exécuter le seeder

```bash
cd reseau_api
php artisan db:seed --class=RolesAndPermissionsSeeder
```

---

## Comment protéger les routes

### Méthode 1: Protection par rôle

```php
// routes/api.php

// Une seule rôle
Route::middleware('role:Super Admin')->group(function () {
    Route::delete('/users/{user}/force', [UserController::class, 'forceDelete']);
});

// Plusieurs rôles (OR - l'un des rôles suffit)
Route::middleware('role:Super Admin|Administrateur')->group(function () {
    Route::post('/modifications/{modification}/approve', [ModificationController::class, 'approve']);
});
```

### Méthode 2: Protection par permission (RECOMMANDÉ)

```php
// Protection par permission spécifique
Route::middleware('permission:armoires.creer')->group(function () {
    Route::post('/coffrets', [CoffretController::class, 'store']);
});

// Plusieurs permissions (OR - l'une des permissions suffit)
Route::middleware('permission:armoires.voir|equipements.voir|dashboard.voir')->group(function () {
    Route::get('/coffrets', [CoffretController::class, 'index']);
});
```

### Méthode 3: Combinaison rôle + permission

```php
Route::middleware(['role:Technicien', 'permission:maintenance.executer'])->group(function () {
    Route::post('/maintenances/{maintenance}/execute', [MaintenanceController::class, 'execute']);
});
```

---

## Vérification dans les contrôleurs

### Vérifier un rôle

```php
// Dans un contrôleur
if (auth()->user()->hasRole('Super Admin')) {
    // Action autorisée
}

// Vérifier plusieurs rôles (OR)
if (auth()->user()->hasAnyRole(['Super Admin', 'Administrateur'])) {
    // Action autorisée
}

// Vérifier tous les rôles (AND)
if (auth()->user()->hasAllRoles(['Super Admin', 'Administrateur'])) {
    // Action autorisée
}
```

### Vérifier une permission

```php
// Vérifier une permission
if (auth()->user()->can('armoires.creer')) {
    // Action autorisée
}

// Vérifier plusieurs permissions (OR)
if (auth()->user()->hasAnyPermission(['armoires.creer', 'equipements.creer'])) {
    // Action autorisée
}

// Vérifier toutes les permissions (AND)
if (auth()->user()->hasAllPermissions(['armoires.creer', 'armoires.modifier'])) {
    // Action autorisée
}
```

### Méthode helper dans User Model

```php
// reseau_api/app/Models/User.php

public function isAdministrator(): bool
{
    return $this->hasAnyRole(['Super Admin', 'Administrateur']);
}

// Utilisation
if (auth()->user()->isAdministrator()) {
    // Action admin
}
```

---

## Vérification côté Frontend

### Dans AuthContext (React)

```typescript
// reseau_front/src/contexts/AuthContext.tsx

// L'utilisateur retourné par /auth/me contient:
{
  id: 1,
  name: "Admin",
  email: "admin@reseau.local",
  roles: ["Super Admin"],
  permissions: ["armoires.voir", "armoires.creer", ...],
  all_permissions: ["*"] // Pour Super Admin
}
```

### Vérifier les permissions

```typescript
// Dans un composant React
import { useAuth } from '@/contexts/AuthContext';

function MonComposant() {
  const { user } = useAuth();

  // Vérifier un rôle
  const isAdmin = user?.roles?.includes('Super Admin') ||
                  user?.roles?.includes('Administrateur');

  // Vérifier une permission
  const canCreateArmoire = user?.all_permissions?.includes('armoires.creer') ||
                           user?.all_permissions?.includes('*');

  return (
    <>
      {canCreateArmoire && (
        <Button onClick={handleCreate}>Ajouter une armoire</Button>
      )}
    </>
  );
}
```

### Hook personnalisé pour les permissions

```typescript
// reseau_front/src/hooks/usePermission.ts (À CRÉER)

import { useAuth } from '@/contexts/AuthContext';

export function usePermission(permission: string): boolean {
  const { user } = useAuth();

  if (!user) return false;

  // Super Admin a toutes les permissions
  if (user.all_permissions?.includes('*')) return true;

  // Vérifier la permission spécifique
  return user.all_permissions?.includes(permission) || false;
}

export function useHasAnyPermission(permissions: string[]): boolean {
  const { user } = useAuth();

  if (!user) return false;
  if (user.all_permissions?.includes('*')) return true;

  return permissions.some(perm =>
    user.all_permissions?.includes(perm)
  );
}

// Utilisation
function MonComposant() {
  const canCreate = usePermission('armoires.creer');
  const canModify = usePermission('armoires.modifier');
  const canAccess = useHasAnyPermission(['armoires.voir', 'dashboard.voir']);

  return (
    <>
      {canCreate && <Button>Créer</Button>}
      {canModify && <Button>Modifier</Button>}
    </>
  );
}
```

---

## Ajouter un nouveau rôle

### Exemple: Ajouter un rôle "Manager"

```php
// reseau_api/database/seeders/RolesAndPermissionsSeeder.php

private array $roles = [
    'Super Admin' => '*',
    'Administrateur' => [ /* ... */ ],
    'Technicien' => [ /* ... */ ],
    'Observateur' => [ /* ... */ ],

    // NOUVEAU RÔLE
    'Manager' => [
        'batiments.voir',
        'salles.voir',
        'armoires.voir',
        'equipements.voir',
        'ports.voir',
        'liaisons.voir',
        'lans.voir',
        'maintenance.voir', 'maintenance.creer', 'maintenance.assigner',
        'modifications.voir', 'modifications.historique',
        'cartographie.voir', 'cartographie.exporter',
        'dashboard.*',
    ],
];
```

Puis:
```bash
cd reseau_api
php artisan db:seed --class=RolesAndPermissionsSeeder
```

---

## Workflow: Maintenance vs Modifications

### Maintenance (Top-Down)

```
1. Administrateur CRÉE une maintenance
   ├─ Permission: maintenance.creer
   └─ Action: Planifie une intervention

2. Administrateur ASSIGNE à un technicien
   ├─ Permission: maintenance.assigner
   └─ Action: Notifie le technicien

3. Technicien EXÉCUTE la maintenance
   ├─ Permission: maintenance.executer
   └─ Action: Fait les travaux

4. Technicien RAPPORTE les résultats
   ├─ Permission: maintenance.rapporter
   └─ Action: Upload photos, commentaires
```

### Modifications (Bottom-Up)

```
1. Technicien CRÉE une modification (après scan QR)
   ├─ Permission: modifications.creer
   └─ Action: Soumet les changements

2. Administrateur VOIT les modifications en attente
   ├─ Permission: modifications.voir
   └─ Route: GET /modifications/pending

3. Administrateur VALIDE ou REJETTE
   ├─ Permission: modifications.valider
   ├─ Routes: POST /modifications/{id}/approve
   └─         POST /modifications/{id}/reject

4. Tous peuvent voir L'HISTORIQUE
   ├─ Permission: modifications.historique
   └─ Route: GET /coffrets/{id}/history
```

---

## Bonnes pratiques

### ✅ DO (À faire)

1. **Utiliser les permissions plutôt que les rôles** dans les routes
   ```php
   // BIEN
   Route::middleware('permission:armoires.creer')->post('/coffrets', ...);

   // ÉVITER (trop rigide)
   Route::middleware('role:Administrateur')->post('/coffrets', ...);
   ```

2. **Nommer les permissions selon le pattern**: `module.action`
   - `armoires.voir`
   - `equipements.creer`
   - `modifications.valider`

3. **Utiliser les wildcards pour simplifier**:
   ```php
   'Administrateur' => [
       'batiments.*', // Toutes les actions sur batiments
   ]
   ```

4. **Vérifier les permissions dans les contrôleurs** pour la logique métier:
   ```php
   if (!auth()->user()->can('maintenance.assigner')) {
       abort(403, 'Non autorisé à assigner des maintenances');
   }
   ```

5. **Afficher conditionnellement les boutons** dans le frontend:
   ```tsx
   {canDelete && <Button onClick={handleDelete}>Supprimer</Button>}
   ```

---

### ❌ DON'T (À éviter)

1. **Ne pas hard-coder les rôles** partout dans le code
   ```php
   // MAUVAIS
   if (auth()->user()->role === 'admin') { }

   // BON
   if (auth()->user()->can('armoires.creer')) { }
   ```

2. **Ne pas donner trop de permissions** à un rôle
   - Principe du moindre privilège
   - Un technicien n'a pas besoin de supprimer des utilisateurs

3. **Ne pas oublier de reseed** après modification des rôles
   ```bash
   php artisan db:seed --class=RolesAndPermissionsSeeder
   ```

4. **Ne pas utiliser les rôles dans la logique métier**
   ```php
   // MAUVAIS
   if ($user->hasRole('Technicien')) {
       // Logique spécifique
   }

   // BON
   if ($user->can('maintenance.executer')) {
       // Logique basée sur la capacité
   }
   ```

---

## Commandes utiles

### Afficher tous les rôles et permissions

```bash
cd reseau_api
php artisan tinker
```

```php
// Lister tous les rôles
\Spatie\Permission\Models\Role::with('permissions')->get();

// Lister toutes les permissions
\Spatie\Permission\Models\Permission::all();

// Permissions d'un utilisateur
$user = \App\Models\User::find(1);
$user->getAllPermissions();

// Assigner un rôle manuellement
$user->assignRole('Technicien');

// Retirer un rôle
$user->removeRole('Technicien');

// Donner une permission directe
$user->givePermissionTo('armoires.creer');
```

### Nettoyer le cache des permissions

```bash
php artisan permission:cache-reset
```

### Re-seed les rôles

```bash
php artisan db:seed --class=RolesAndPermissionsSeeder
```

---

## Exemple complet: Ajouter la fonctionnalité "Export PDF"

### 1. Ajouter la permission

```php
// RolesAndPermissionsSeeder.php
private array $modules = [
    'armoires' => ['voir', 'creer', 'modifier', 'supprimer', 'exporter_pdf'], // AJOUT
];
```

### 2. Attribuer aux rôles

```php
private array $roles = [
    'Administrateur' => [
        'armoires.*', // Inclut déjà exporter_pdf
    ],
    'Technicien' => [
        'armoires.voir',
        'armoires.exporter_pdf', // AJOUT EXPLICITE
    ],
];
```

### 3. Protéger la route

```php
// routes/api.php
Route::middleware('permission:armoires.exporter_pdf')->group(function () {
    Route::get('/coffrets/{coffret}/export/pdf', [CoffretController::class, 'exportPdf']);
});
```

### 4. Vérifier dans le contrôleur (optionnel)

```php
// CoffretController.php
public function exportPdf(Coffret $coffret)
{
    // Vérification supplémentaire si nécessaire
    if (!auth()->user()->can('armoires.exporter_pdf')) {
        return response()->json(['message' => 'Non autorisé'], 403);
    }

    // Logique d'export...
}
```

### 5. Frontend: Afficher le bouton conditionnellement

```tsx
// ArmoiresSection.tsx
function ArmoiresSection() {
  const { user } = useAuth();
  const canExport = user?.all_permissions?.includes('armoires.exporter_pdf') ||
                    user?.all_permissions?.includes('*');

  return (
    <>
      {canExport && (
        <Button onClick={handleExportPdf}>
          <Download className="h-4 w-4 mr-2" />
          Exporter PDF
        </Button>
      )}
    </>
  );
}
```

### 6. Reseed

```bash
cd reseau_api
php artisan db:seed --class=RolesAndPermissionsSeeder
```

---

## Dépannage

### Problème: "Non autorisé" alors que l'utilisateur a le rôle

**Solution**: Vérifier que les permissions sont bien assignées au rôle

```php
php artisan tinker
$role = \Spatie\Permission\Models\Role::findByName('Technicien');
$role->permissions->pluck('name'); // Voir toutes les permissions
```

### Problème: Les changements de permissions ne s'appliquent pas

**Solution**: Nettoyer le cache

```bash
php artisan permission:cache-reset
php artisan cache:clear
```

### Problème: Utilisateur n'a pas de rôle

**Solution**: Assigner un rôle

```php
php artisan tinker
$user = \App\Models\User::find(1);
$user->assignRole('Technicien');
```

---

## Résumé

| Besoin | Solution |
|--------|----------|
| Ajouter un module | Modifier `$modules` dans RolesAndPermissionsSeeder |
| Ajouter un rôle | Modifier `$roles` dans RolesAndPermissionsSeeder |
| Protéger une route | `Route::middleware('permission:module.action')` |
| Vérifier dans contrôleur | `auth()->user()->can('module.action')` |
| Vérifier dans frontend | `user?.all_permissions?.includes('module.action')` |
| Appliquer les changements | `php artisan db:seed --class=RolesAndPermissionsSeeder` |

---

**Documentation Spatie Laravel Permission**: https://spatie.be/docs/laravel-permission
