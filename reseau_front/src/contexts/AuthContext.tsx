import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { login as loginAction, logout as logoutAction } from '@/store/users';
import { authService } from '@/services';
import type { RootState } from '@/store/store';

// Durée d'inactivité avant déconnexion automatique (15 minutes en ms)
const INACTIVITY_TIMEOUT = 15 * 60 * 1000;

interface User {
  id: number;
  email: string;
  name: string;
  surname?: string;
  username: string;
  role: string;
  roles: string[];
  permissions: string[];
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const dispatch = useDispatch();
  const { user: reduxUser, token, isLogin } = useSelector((state: RootState) => state.user);
  const [isLoading, setIsLoading] = useState(true);

  // Map redux user to AuthContext user format
  const user: User | null = reduxUser ? {
    id: reduxUser.id,
    email: reduxUser.email,
    name: reduxUser.full_name || reduxUser.username,
    username: reduxUser.username,
    role: reduxUser.role,
    roles: reduxUser.roles || [],
    permissions: reduxUser.permissions || [],
    is_active: reduxUser.is_active === 1
  } : null;

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté via le token Redux (persisté)
    const checkAuth = async () => {
      if (token && !reduxUser) {
        try {
          // Récupérer les infos utilisateur si on a un token mais pas d'user
          const userData = await authService.me();
          dispatch(loginAction({
            user: {
              id: userData.id,
              username: userData.username,
              email: userData.email,
              full_name: `${userData.name} ${userData.surname}`,
              role: userData.role,
              roles: userData.roles || [],
              permissions: userData.permissions || [],
              is_active: userData.is_active ? 1 : 0
            },
            token: token
          }));
        } catch (error) {
          // Token invalide, déconnecter
          console.error('Token invalide:', error);
          dispatch(logoutAction());
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [token, reduxUser, dispatch]);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await authService.login({ username, password });

      // Vérifier si la connexion a réussi (data n'est pas un tableau vide)
      if (response.status === 200 && response.data && !Array.isArray(response.data)) {
        const { user: apiUser, token: apiToken } = response.data;

        // Dispatcher l'action Redux pour stocker l'utilisateur et le token
        dispatch(loginAction({
          user: {
            id: apiUser.id,
            username: apiUser.username,
            email: apiUser.email,
            full_name: `${apiUser.name} ${apiUser.surname}`,
            role: apiUser.role,
            roles: apiUser.roles || [],
            permissions: apiUser.permissions || [],
            is_active: apiUser.is_active ? 1 : 0
          },
          token: apiToken
        }));

        return true;
      }

      return false;
    } catch (error) {
      console.error('Erreur de connexion:', error);
      return false;
    }
  };

  const logout = useCallback(async () => {
    try {
      // Appeler l'API de déconnexion si on a un token
      if (token) {
        await authService.logout();
      }
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      // Toujours déconnecter localement
      dispatch(logoutAction());
    }
  }, [token, dispatch]);

  const isAuthenticated = !!isLogin && !!user;

  /**
   * Vérifie si l'utilisateur a une permission donnée
   * Utilise les permissions retournées par l'API (Spatie)
   */
  const hasPermission = useCallback((permission: string): boolean => {
    if (!reduxUser) return false;

    // Vérifier si l'utilisateur a un rôle Super Admin ou Administrateur (toutes permissions)
    const userRoles = reduxUser.roles || [];
    if (userRoles.includes('Super Admin') || userRoles.includes('Administrateur')) {
      return true;
    }

    // Fallback sur l'ancien système de rôles
    const legacyRole = reduxUser.role?.toLowerCase();
    if (legacyRole === 'administrator') {
      return true;
    }

    // Vérifier dans les permissions de l'API
    const userPermissions = reduxUser.permissions || [];

    // Vérifier la permission exacte
    return userPermissions.includes(permission);
  }, [reduxUser]);

  // Gestion de la déconnexion automatique après inactivité
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetInactivityTimer = useCallback(() => {
    // Annuler le timer existant
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    // Démarrer un nouveau timer uniquement si l'utilisateur est connecté
    if (isAuthenticated) {
      inactivityTimerRef.current = setTimeout(() => {
        console.log('Déconnexion automatique pour inactivité');
        logout();
      }, INACTIVITY_TIMEOUT);
    }
  }, [isAuthenticated, logout]);

  // Écouter les événements d'activité utilisateur
  useEffect(() => {
    if (!isAuthenticated) {
      // Nettoyer le timer si non authentifié
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
      return;
    }

    // Événements à écouter pour détecter l'activité
    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];

    // Démarrer le timer initial
    resetInactivityTimer();

    // Ajouter les listeners
    activityEvents.forEach(event => {
      window.addEventListener(event, resetInactivityTimer);
    });

    // Cleanup
    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, resetInactivityTimer);
      });
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [isAuthenticated, resetInactivityTimer]);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated, isLoading, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};