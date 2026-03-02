# Exemples d'utilisation des permissions

## 1. Protection d'une page entière

### Avant (sans protection)
```tsx
// src/pages/Armoires.tsx
export default function Armoires() {
  return (
    <AppShell>
      <h1>Gestion des armoires</h1>
      {/* ... */}
    </AppShell>
  );
}
```

### Après (avec protection)
```tsx
// src/App.tsx
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Armoires from '@/pages/Armoires';

function App() {
  return (
    <Routes>
      {/* Protection par permission */}
      <Route
        path="/armoires"
        element={
          <ProtectedRoute permission="armoires.voir">
            <Armoires />
          </ProtectedRoute>
        }
      />

      {/* Protection par rôle (admin uniquement) */}
      <Route
        path="/users"
        element={
          <ProtectedRoute anyRole={['Super Admin', 'Administrateur']}>
            <UsersPage />
          </ProtectedRoute>
        }
      />

      {/* Protection par plusieurs permissions (OR) */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute anyPermission={['dashboard.voir', 'dashboard.statistiques']}>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
```

---

## 2. Affichage conditionnel de boutons

### Avant (sans vérification)
```tsx
function ArmoiresSection() {
  return (
    <div>
      <Button onClick={handleCreate}>Ajouter</Button>
      <Button onClick={handleEdit}>Modifier</Button>
      <Button onClick={handleDelete}>Supprimer</Button>
    </div>
  );
}
```

### Après (avec vérification)
```tsx
import { usePermissions } from '@/hooks/usePermission';

function ArmoiresSection() {
  const { canCreate, canEdit, canDelete } = usePermissions('armoires');

  return (
    <div>
      {canCreate && <Button onClick={handleCreate}>Ajouter</Button>}
      {canEdit && <Button onClick={handleEdit}>Modifier</Button>}
      {canDelete && <Button onClick={handleDelete}>Supprimer</Button>}
    </div>
  );
}
```

---

## 3. Actions admin uniquement

```tsx
import { usePermissions } from '@/hooks/usePermission';

function ModificationsPage() {
  const { isAdmin, canValidate } = usePermissions('modifications');

  return (
    <div>
      {/* Liste des modifications */}
      <ModificationsList />

      {/* Bouton de validation (admin uniquement) */}
      {isAdmin && canValidate && (
        <div className="mt-4 space-x-2">
          <Button onClick={handleApprove} className="bg-green-600">
            Approuver
          </Button>
          <Button onClick={handleReject} variant="destructive">
            Rejeter
          </Button>
        </div>
      )}
    </div>
  );
}
```

---

## 4. Sections conditionnelles

```tsx
import { useHasAnyRole } from '@/hooks/usePermission';

function DashboardOverview() {
  const isTechnician = useHasAnyRole(['Technicien']);
  const isAdmin = useHasAnyRole(['Super Admin', 'Administrateur']);

  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Statistiques visibles par tous */}
      <StatsCard title="Équipements" value={stats.equipements} />

      {/* Section technicien */}
      {isTechnician && (
        <StatsCard
          title="Mes maintenances"
          value={stats.myMaintenances}
          link="/maintenances"
        />
      )}

      {/* Section admin */}
      {isAdmin && (
        <>
          <StatsCard
            title="Utilisateurs"
            value={stats.users}
            link="/users"
          />
          <StatsCard
            title="Modifications en attente"
            value={stats.pendingModifications}
            link="/modifications/pending"
          />
        </>
      )}
    </div>
  );
}
```

---

## 5. Menu de navigation dynamique

```tsx
import { usePermissions } from '@/hooks/usePermission';

function Sidebar() {
  const armoiresPerms = usePermissions('armoires');
  const usersPerms = usePermissions('utilisateurs');
  const maintenancePerms = usePermissions('maintenance');

  const menuItems = [
    // Dashboard (visible par tous)
    { label: 'Tableau de bord', path: '/', icon: LayoutDashboard, visible: true },

    // Armoires (si permission de voir)
    {
      label: 'Armoires',
      path: '/armoires',
      icon: Box,
      visible: armoiresPerms.canView
    },

    // Utilisateurs (admin uniquement)
    {
      label: 'Utilisateurs',
      path: '/users',
      icon: Users,
      visible: usersPerms.canView && usersPerms.isAdmin
    },

    // Maintenances (techniciens et admins)
    {
      label: 'Maintenances',
      path: '/maintenances',
      icon: Wrench,
      visible: maintenancePerms.canView
    },
  ].filter(item => item.visible);

  return (
    <nav>
      {menuItems.map(item => (
        <NavLink key={item.path} to={item.path}>
          <item.icon />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
```

---

## 6. Modification du PageHeader avec permissions

### Avant
```tsx
<PageHeader
  title="Gestion des armoires"
  actions={
    <Button>
      <Plus /> Ajouter
    </Button>
  }
/>
```

### Après
```tsx
import { usePermissions } from '@/hooks/usePermission';

function ArmoiresPage() {
  const { canCreate } = usePermissions('armoires');

  return (
    <PageHeader
      title="Gestion des armoires"
      actions={
        canCreate ? (
          <Button onClick={handleAdd}>
            <Plus /> Ajouter
          </Button>
        ) : undefined
      }
    />
  );
}
```

---

## 7. DataTable avec actions conditionnelles

```tsx
import { usePermissions } from '@/hooks/usePermission';

function ArmoiresSection() {
  const { canEdit, canDelete } = usePermissions('armoires');

  return (
    <DataTableEnhanced
      data={armoires}
      columns={['Nom', 'Salle', 'Status']}
      onRowClick={handleView}
      // Conditionner l'affichage des boutons d'action
      onEdit={canEdit ? handleEdit : undefined}
      onDelete={canDelete ? handleDelete : undefined}
    />
  );
}
```

---

## 8. Formulaire avec champs conditionnels

```tsx
import { usePermissions } from '@/hooks/usePermission';

function MaintenanceForm() {
  const { canAssign, isTechnician, isAdmin } = usePermissions('maintenance');

  return (
    <Form>
      <FormField name="title" label="Titre" />
      <FormField name="description" label="Description" />

      {/* Champ "Assigner à" visible uniquement pour les admins */}
      {isAdmin && canAssign && (
        <FormField
          name="assigned_to"
          label="Assigner à"
          type="select"
          options={technicians}
        />
      )}

      {/* Champ "Statut" avec options différentes selon le rôle */}
      <FormField
        name="status"
        label="Statut"
        type="select"
        options={
          isTechnician
            ? ['en_cours', 'terminee'] // Technicien ne peut que marquer terminé
            : ['planifiee', 'en_cours', 'terminee', 'annulee'] // Admin a toutes les options
        }
      />
    </Form>
  );
}
```

---

## 9. Vérifications multiples

```tsx
import { usePermission, useHasAnyPermission, useHasAllPermissions } from '@/hooks/usePermission';

function AdvancedActionsPanel() {
  // Une permission spécifique
  const canExport = usePermission('armoires.exporter');

  // Au moins une permission (OR)
  const canAccess = useHasAnyPermission([
    'armoires.voir',
    'equipements.voir',
    'dashboard.voir'
  ]);

  // Toutes les permissions (AND)
  const canFullManage = useHasAllPermissions([
    'armoires.creer',
    'armoires.modifier',
    'armoires.supprimer'
  ]);

  return (
    <div>
      {canExport && <Button onClick={handleExport}>Exporter</Button>}

      {canAccess && <div>Accès autorisé</div>}

      {canFullManage && (
        <div className="admin-panel">
          <h3>Actions administrateur</h3>
          {/* ... */}
        </div>
      )}
    </div>
  );
}
```

---

## 10. Notifications conditionnelles

```tsx
import { usePermissions } from '@/hooks/usePermission';

function NotificationBell() {
  const { canValidate } = usePermissions('modifications');
  const { canExecute } = usePermissions('maintenance');

  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Charger les notifications selon les permissions
    const filters = [];

    if (canValidate) {
      filters.push('pending_modifications');
    }

    if (canExecute) {
      filters.push('assigned_maintenances');
    }

    fetchNotifications(filters).then(setNotifications);
  }, [canValidate, canExecute]);

  return (
    <div>
      <Bell />
      {notifications.length > 0 && (
        <span className="badge">{notifications.length}</span>
      )}
    </div>
  );
}
```

---

## 11. Redirection conditionnelle après login

```tsx
import { useHasAnyRole } from '@/hooks/usePermission';
import { useNavigate } from 'react-router-dom';

function LoginPage() {
  const navigate = useNavigate();
  const isAdmin = useHasAnyRole(['Super Admin', 'Administrateur']);
  const isTechnician = useHasAnyRole(['Technicien']);

  const handleLogin = async (credentials) => {
    const user = await login(credentials);

    // Redirection selon le rôle
    if (isAdmin) {
      navigate('/dashboard'); // Dashboard admin
    } else if (isTechnician) {
      navigate('/maintenances'); // Maintenances du technicien
    } else {
      navigate('/'); // Page d'accueil par défaut
    }
  };

  return <LoginForm onSubmit={handleLogin} />;
}
```

---

## 12. Message d'erreur personnalisé

```tsx
import { usePermission } from '@/hooks/usePermission';

function ExportButton() {
  const canExport = usePermission('armoires.exporter');

  const handleExport = () => {
    if (!canExport) {
      toast({
        title: "Non autorisé",
        description: "Vous n'avez pas la permission d'exporter les données.",
        variant: "destructive"
      });
      return;
    }

    // Logique d'export
    exportData();
  };

  return (
    <Button
      onClick={handleExport}
      disabled={!canExport}
      className={!canExport ? 'opacity-50 cursor-not-allowed' : ''}
    >
      Exporter
    </Button>
  );
}
```

---

## 13. Badge de rôle dans le profil

```tsx
import { useAuth } from '@/contexts/AuthContext';

function UserProfile() {
  const { user } = useAuth();

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Super Admin': return 'bg-red-500';
      case 'Administrateur': return 'bg-blue-500';
      case 'Technicien': return 'bg-green-500';
      case 'Observateur': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="profile">
      <h2>{user?.full_name}</h2>
      <p>{user?.email}</p>

      <div className="flex gap-2">
        {user?.roles?.map(role => (
          <span
            key={role}
            className={`px-2 py-1 rounded text-white text-xs ${getRoleBadgeColor(role)}`}
          >
            {role}
          </span>
        ))}
      </div>
    </div>
  );
}
```

---

## Récapitulatif des hooks disponibles

| Hook | Usage | Exemple |
|------|-------|---------|
| `usePermission(permission)` | Vérifier une permission | `usePermission('armoires.creer')` |
| `useHasAnyPermission(permissions[])` | Au moins une permission (OR) | `useHasAnyPermission(['armoires.voir', 'dashboard.voir'])` |
| `useHasAllPermissions(permissions[])` | Toutes les permissions (AND) | `useHasAllPermissions(['armoires.creer', 'armoires.modifier'])` |
| `useHasRole(role)` | Vérifier un rôle | `useHasRole('Super Admin')` |
| `useHasAnyRole(roles[])` | Au moins un rôle (OR) | `useHasAnyRole(['Super Admin', 'Administrateur'])` |
| `usePermissions(module)` | Toutes les permissions d'un module | `usePermissions('armoires')` |

---

## Bonnes pratiques

✅ **Préférer les permissions aux rôles** dans les composants
```tsx
// BON
const canCreate = usePermission('armoires.creer');

// ÉVITER
const isAdmin = useHasRole('Administrateur');
```

✅ **Utiliser `usePermissions()` pour des vérifications multiples**
```tsx
// BON
const { canCreate, canEdit, canDelete, isAdmin } = usePermissions('armoires');

// ÉVITER
const canCreate = usePermission('armoires.creer');
const canEdit = usePermission('armoires.modifier');
const canDelete = usePermission('armoires.supprimer');
```

✅ **Protéger les routes ET les actions**
```tsx
// Route protégée
<ProtectedRoute permission="armoires.voir">
  <ArmoiresPage />
</ProtectedRoute>

// Dans le composant
function ArmoiresPage() {
  const { canCreate } = usePermissions('armoires');
  // ...
}
```

✅ **Gérer les cas où l'utilisateur n'est pas connecté**
```tsx
const { user } = useAuth();

if (!user) {
  return <Navigate to="/login" />;
}
```
