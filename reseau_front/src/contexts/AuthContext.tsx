import React, { createContext, useContext, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { login as loginAction, logout as logoutAction } from '@/store/users';
import { authService } from '@/services';
import type { RootState } from '@/store/store';

interface User {
  id: number;
  email: string;
  name: string;
  surname?: string;
  username: string;
  role: string;
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
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

  const logout = async () => {
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
  };

  const isAuthenticated = !!isLogin && !!user;

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated, isLoading }}>
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