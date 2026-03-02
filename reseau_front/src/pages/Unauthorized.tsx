import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ShieldX, ArrowLeft, LogOut, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

const Unauthorized = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="p-4 bg-destructive/10 rounded-full">
            <ShieldX className="h-16 w-16 text-destructive" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Accès non autorisé</h1>
          <p className="text-muted-foreground">
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          </p>
        </div>

        {/* User info */}
        {user && (
          <div className="bg-muted/50 rounded-lg p-4 text-sm">
            <p className="text-muted-foreground">
              Connecté en tant que <span className="font-medium text-foreground">{user.name}</span>
            </p>
            <p className="text-muted-foreground">
              Rôle : <span className="font-medium text-foreground capitalize">{user.role}</span>
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          <Button
            onClick={() => navigate("/")}
            className="gap-2"
          >
            <Home className="h-4 w-4" />
            Tableau de bord
          </Button>
          <Button
            variant="destructive"
            onClick={handleLogout}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            Déconnexion
          </Button>
        </div>

        {/* Help text */}
        <p className="text-xs text-muted-foreground">
          Si vous pensez qu'il s'agit d'une erreur, contactez votre administrateur.
        </p>
      </div>
    </div>
  );
};

export default Unauthorized;
