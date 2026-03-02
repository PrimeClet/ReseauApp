import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePermission, useHasAnyPermission, useHasAnyRole } from '@/hooks/usePermission';
import { Loader2, ShieldAlert } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  /** Permission requise (ex: 'armoires.voir') */
  permission?: string;
  /** Au moins une de ces permissions est requise */
  anyPermission?: string[];
  /** Toutes ces permissions sont requises */
  allPermissions?: string[];
  /** Rôle requis (ex: 'Super Admin') */
  role?: string;
  /** Au moins un de ces rôles est requis */
  anyRole?: string[];
  /** Page de redirection si non autorisé (défaut: /unauthorized) */
  redirectTo?: string;
  /** Afficher une page d'erreur au lieu de rediriger */
  showError?: boolean;
}

/**
 * Composant pour protéger une route par permission ou rôle
 *
 * @example Protection par permission
 * ```tsx
 * <Route
 *   path="/armoires"
 *   element={
 *     <ProtectedRoute permission="armoires.voir">
 *       <ArmoiresPage />
 *     </ProtectedRoute>
 *   }
 * />
 * ```
 *
 * @example Protection par plusieurs permissions (OR)
 * ```tsx
 * <ProtectedRoute anyPermission={['armoires.voir', 'dashboard.voir']}>
 *   <ArmoiresPage />
 * </ProtectedRoute>
 * ```
 *
 * @example Protection par rôle
 * ```tsx
 * <ProtectedRoute anyRole={['Super Admin', 'Administrateur']}>
 *   <AdminPage />
 * </ProtectedRoute>
 * ```
 */
export function ProtectedRoute({
  children,
  permission,
  anyPermission,
  allPermissions,
  role,
  anyRole,
  redirectTo = '/unauthorized',
  showError = false,
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const hasPermission = usePermission(permission || '');
  const hasAnyPerm = useHasAnyPermission(anyPermission || []);
  const hasRole = useHasAnyRole(anyRole || [role || ''].filter(Boolean));

  // Chargement en cours
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Non authentifié
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Vérifier les permissions et rôles
  let isAuthorized = true;

  if (permission && !hasPermission) {
    isAuthorized = false;
  }

  if (anyPermission && anyPermission.length > 0 && !hasAnyPerm) {
    isAuthorized = false;
  }

  if (allPermissions && allPermissions.length > 0) {
    const hasAll = allPermissions.every(perm =>
      user.all_permissions?.includes(perm) || user.all_permissions?.includes('*')
    );
    if (!hasAll) {
      isAuthorized = false;
    }
  }

  if ((role || anyRole) && !hasRole) {
    isAuthorized = false;
  }

  // Non autorisé
  if (!isAuthorized) {
    if (showError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen space-y-4">
          <ShieldAlert className="h-16 w-16 text-destructive" />
          <h1 className="text-2xl font-bold">Accès non autorisé</h1>
          <p className="text-muted-foreground">
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          </p>
          <a
            href="/"
            className="text-primary hover:underline"
          >
            Retour à l'accueil
          </a>
        </div>
      );
    }

    return <Navigate to={redirectTo} replace />;
  }

  // Autorisé
  return <>{children}</>;
}

/**
 * HOC (Higher-Order Component) pour protéger un composant
 *
 * @example
 * ```tsx
 * const ProtectedArmoiresPage = withPermission(ArmoiresPage, 'armoires.voir');
 *
 * // Dans le routeur
 * <Route path="/armoires" element={<ProtectedArmoiresPage />} />
 * ```
 */
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  permission: string
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute permission={permission}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}

/**
 * HOC pour protéger par rôle
 *
 * @example
 * ```tsx
 * const AdminOnlyPage = withRole(AdminPage, ['Super Admin', 'Administrateur']);
 * ```
 */
export function withRole<P extends object>(
  Component: React.ComponentType<P>,
  roles: string[]
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute anyRole={roles}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}
