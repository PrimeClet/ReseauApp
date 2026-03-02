import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Hook pour protéger les routes nécessitant une authentification.
 * Redirige vers /login avec l'URL actuelle en state pour permettre
 * la redirection après connexion.
 *
 * @returns L'état d'authentification complet (isAuthenticated, isLoading, user, hasPermission, logout)
 */
export function useRequireAuth() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      // Sauvegarder l'URL actuelle pour rediriger après connexion
      navigate("/login", {
        state: { from: location.pathname + location.search },
        replace: true
      });
    }
  }, [auth.isAuthenticated, auth.isLoading, navigate, location.pathname, location.search]);

  return auth;
}

export default useRequireAuth;
