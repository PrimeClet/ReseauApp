import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook personnalisé pour vérifier si l'utilisateur a une permission spécifique
 *
 * @param permission - La permission à vérifier (ex: 'armoires.creer')
 * @returns boolean - true si l'utilisateur a la permission
 *
 * @example
 * ```tsx
 * function MonComposant() {
 *   const canCreate = usePermission('armoires.creer');
 *
 *   return (
 *     <>
 *       {canCreate && <Button>Créer une armoire</Button>}
 *     </>
 *   );
 * }
 * ```
 */
export function usePermission(permission: string): boolean {
  const { user } = useAuth();

  if (!user) return false;

  // Super Admin a toutes les permissions
  if (user.all_permissions?.includes('*')) return true;

  // Vérifier la permission spécifique
  return user.all_permissions?.includes(permission) || false;
}

/**
 * Hook pour vérifier si l'utilisateur a AU MOINS UNE des permissions (OR)
 *
 * @param permissions - Tableau des permissions à vérifier
 * @returns boolean - true si l'utilisateur a au moins une permission
 *
 * @example
 * ```tsx
 * function MonComposant() {
 *   const canAccess = useHasAnyPermission(['armoires.voir', 'dashboard.voir']);
 *
 *   if (!canAccess) return <div>Non autorisé</div>;
 *   return <div>Contenu autorisé</div>;
 * }
 * ```
 */
export function useHasAnyPermission(permissions: string[]): boolean {
  const { user } = useAuth();

  if (!user) return false;

  // Super Admin a toutes les permissions
  if (user.all_permissions?.includes('*')) return true;

  // Vérifier si l'utilisateur a au moins une des permissions
  return permissions.some(perm =>
    user.all_permissions?.includes(perm)
  );
}

/**
 * Hook pour vérifier si l'utilisateur a TOUTES les permissions (AND)
 *
 * @param permissions - Tableau des permissions à vérifier
 * @returns boolean - true si l'utilisateur a toutes les permissions
 *
 * @example
 * ```tsx
 * function MonComposant() {
 *   const canEditAndDelete = useHasAllPermissions(['armoires.modifier', 'armoires.supprimer']);
 *
 *   return (
 *     <>
 *       {canEditAndDelete && <Button>Actions complètes</Button>}
 *     </>
 *   );
 * }
 * ```
 */
export function useHasAllPermissions(permissions: string[]): boolean {
  const { user } = useAuth();

  if (!user) return false;

  // Super Admin a toutes les permissions
  if (user.all_permissions?.includes('*')) return true;

  // Vérifier si l'utilisateur a toutes les permissions
  return permissions.every(perm =>
    user.all_permissions?.includes(perm)
  );
}

/**
 * Hook pour vérifier si l'utilisateur a un rôle spécifique
 *
 * @param role - Le rôle à vérifier (ex: 'Super Admin')
 * @returns boolean - true si l'utilisateur a le rôle
 *
 * @example
 * ```tsx
 * function MonComposant() {
 *   const isAdmin = useHasRole('Super Admin');
 *
 *   return (
 *     <>
 *       {isAdmin && <Button>Administration</Button>}
 *     </>
 *   );
 * }
 * ```
 */
export function useHasRole(role: string): boolean {
  const { user } = useAuth();

  if (!user) return false;

  return user.roles?.includes(role) || false;
}

/**
 * Hook pour vérifier si l'utilisateur a AU MOINS UN des rôles (OR)
 *
 * @param roles - Tableau des rôles à vérifier
 * @returns boolean - true si l'utilisateur a au moins un rôle
 *
 * @example
 * ```tsx
 * function MonComposant() {
 *   const isAdministrator = useHasAnyRole(['Super Admin', 'Administrateur']);
 *
 *   return (
 *     <>
 *       {isAdministrator && <Button>Valider</Button>}
 *     </>
 *   );
 * }
 * ```
 */
export function useHasAnyRole(roles: string[]): boolean {
  const { user } = useAuth();

  if (!user) return false;

  return roles.some(role => user.roles?.includes(role));
}

/**
 * Hook pour obtenir les permissions de l'utilisateur
 *
 * @returns Objet avec les permissions communes
 *
 * @example
 * ```tsx
 * function MonComposant() {
 *   const {
 *     canView,
 *     canCreate,
 *     canEdit,
 *     canDelete,
 *     isAdmin,
 *     isTechnician
 *   } = usePermissions('armoires');
 *
 *   return (
 *     <>
 *       {canCreate && <Button>Créer</Button>}
 *       {canEdit && <Button>Modifier</Button>}
 *       {canDelete && <Button>Supprimer</Button>}
 *     </>
 *   );
 * }
 * ```
 */
export function usePermissions(module: string) {
  const { user } = useAuth();

  const hasPermission = (action: string): boolean => {
    if (!user) return false;
    if (user.all_permissions?.includes('*')) return true;
    return user.all_permissions?.includes(`${module}.${action}`) || false;
  };

  return {
    // Permissions CRUD
    canView: hasPermission('voir'),
    canCreate: hasPermission('creer'),
    canEdit: hasPermission('modifier'),
    canDelete: hasPermission('supprimer'),
    canRestore: hasPermission('restaurer'),
    canExport: hasPermission('exporter'),
    canImport: hasPermission('importer'),

    // Permissions spécifiques maintenance/modifications
    canAssign: hasPermission('assigner'),
    canExecute: hasPermission('executer'),
    canReport: hasPermission('rapporter'),
    canValidate: hasPermission('valider'),

    // Rôles
    isAdmin: user?.roles?.includes('Super Admin') || user?.roles?.includes('Administrateur'),
    isSuperAdmin: user?.roles?.includes('Super Admin'),
    isTechnician: user?.roles?.includes('Technicien'),
    isObserver: user?.roles?.includes('Observateur'),

    // Données brutes
    user,
    allPermissions: user?.all_permissions || [],
    roles: user?.roles || [],
  };
}
