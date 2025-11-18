import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Server, 
  Cable, 
  Router, 
  Settings,
  HardDrive,
  Wrench,
  Users,
  MapPin,
  Building2,
  DoorOpen,
  ChevronDown,
  ChevronRight,
  Tags,
  Shield,
  KeyRound,
  Network,
  Map
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const menuItems = [
  { id: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { id: "armoires", label: "Armoires", icon: Server },
  { id: "equipements", label: "Équipements", icon: HardDrive },
  { id: "liaisons", label: "Liaisons", icon: Cable },
  { id: "ports", label: "Ports", icon: Router },
  { id: "maintenance", label: "Maintenance", icon: Wrench },
  { id: "types", label: "Types", icon: Tags },
  { id: "users", label: "Utilisateurs", icon: Users },
  { id: "parametres", label: "Paramètres", icon: Settings },
];

export default function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLocalisationOpen, setIsLocalisationOpen] = useState(false);

  // Ouvrir automatiquement le menu Localisation si on est sur une page de localisation
  useEffect(() => {
    if (location.pathname === "/batiments" || location.pathname === "/salles") {
      setIsLocalisationOpen(true);
    }
  }, [location.pathname]);

  // Fonction pour gérer la navigation des items du menu
  const handleMenuClick = (itemId: string) => {
    // Si on est sur la page Index, utiliser onSectionChange
    if (location.pathname === "/") {
      onSectionChange(itemId);
    } else {
      // Sinon, sauvegarder la section dans localStorage et naviguer vers Index
      localStorage.setItem('activeSection', itemId);
      navigate("/");
    }
  };

  return (
    <div className="w-64 h-full bg-nav-background border-r border-border flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-2 text-primary">
          <Server className="h-8 w-8" />
          <div>
            <h1 className="text-xl font-bold text-foreground">Réseau</h1>
            <p className="text-sm text-muted-foreground">Tableau de bord</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 overflow-y-auto">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 pb-2">
            Navigation
          </p>
          {menuItems.map((item) => {
            const isActive = location.pathname === "/" && activeSection === item.id;
            return (
              <Button
                key={item.id}
                variant="ghost"
                className={cn(
                  "w-full justify-start text-nav-text hover:bg-muted hover:text-foreground",
                  isActive && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                )}
                onClick={() => handleMenuClick(item.id)}
              >
                <item.icon className="mr-3 h-4 w-4" />
                {item.label}
              </Button>
            );
          })}

          {/* Menu déroulant Localisation */}
          <Collapsible open={isLocalisationOpen} onOpenChange={setIsLocalisationOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-between text-nav-text hover:bg-muted hover:text-foreground"
                )}
              >
                <div className="flex items-center">
                  <MapPin className="mr-3 h-4 w-4" />
                  <span>Localisation</span>
                </div>
                {isLocalisationOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-4 space-y-1">
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start text-nav-text hover:bg-muted hover:text-foreground text-sm",
                  location.pathname === "/batiments" && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                )}
                onClick={() => navigate("/batiments")}
              >
                <Building2 className="mr-3 h-4 w-4" />
                Bâtiments
              </Button>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start text-nav-text hover:bg-muted hover:text-foreground text-sm",
                  location.pathname === "/salles" && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                )}
                onClick={() => navigate("/salles")}
              >
                <DoorOpen className="mr-3 h-4 w-4" />
                Salles
              </Button>
            </CollapsibleContent>
          </Collapsible>

          <div className="space-y-1 pt-4 border-t border-border mt-4">
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start text-nav-text hover:bg-muted hover:text-foreground",
                location.pathname === "/lans" && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
              )}
              onClick={() => navigate("/lans")}
            >
              <Network className="mr-3 h-4 w-4" />
              Gestion des LANs
            </Button>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start text-nav-text hover:bg-muted hover:text-foreground",
                location.pathname === "/roles" && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
              )}
              onClick={() => navigate("/roles")}
            >
              <Shield className="mr-3 h-4 w-4" />
              Gestion des rôles
            </Button>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start text-nav-text hover:bg-muted hover:text-foreground",
                location.pathname === "/permissions" && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
              )}
              onClick={() => navigate("/permissions")}
            >
              <KeyRound className="mr-3 h-4 w-4" />
              Permissions
            </Button>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start text-nav-text hover:bg-muted hover:text-foreground",
                location.pathname === "/cartographie-lan" && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
              )}
              onClick={() => navigate("/cartographie-lan")}
            >
              <Map className="mr-3 h-4 w-4" />
              Cartographie LAN
            </Button>
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="text-xs text-muted-foreground">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-status-up"></div>
            <span>Système opérationnel</span>
          </div>
          <div>Dernière synchro: il y a 5 min</div>
        </div>
      </div>
    </div>
  );
}