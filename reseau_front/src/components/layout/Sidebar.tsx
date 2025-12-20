import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSidebarToggle } from "@/components/layout/AppShell";
import {
  LayoutDashboard, 
  Server, 
  Cable, 
  Router, 
  Settings,
  HardDrive,
  Wrench,
  Users,
  User,
  Building2,
  DoorOpen,
  ChevronDown,
  ChevronRight,
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
  { id: "ports", label: "Ports", icon: Router },
  { id: "liaisons", label: "Liaisons", icon: Cable },
  { id: "maintenance", label: "Maintenance", icon: Wrench },
];

const accessSections = ["users", "roles", "permissions"];

export default function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { setSidebarOpen } = useSidebarToggle();
  const [isAccessOpen, setIsAccessOpen] = useState(false);

  useEffect(() => {
    if (
      (location.pathname === "/" && accessSections.includes(activeSection)) ||
      location.pathname === "/roles" ||
      location.pathname === "/permissions"
    ) {
      setIsAccessOpen(true);
    }
  }, [location.pathname, activeSection]);

  const isAccessButtonActive = (sectionId: string) => {
    if (location.pathname === "/") {
      return activeSection === sectionId;
    }
    if (sectionId === "roles" && location.pathname === "/roles") {
      return true;
    }
    if (sectionId === "permissions" && location.pathname === "/permissions") {
      return true;
    }
    if (sectionId === "users" && location.pathname === "/users") {
      return true;
    }
    return false;
  };

  // Fonction pour gérer la navigation des items du menu
  const handleMenuClick = (itemId: string) => {
    // Fermer la sidebar sur mobile après un clic
    if (isMobile) {
      setSidebarOpen(false);
    }
    
    // Si on est sur la page Index, utiliser onSectionChange
    if (location.pathname === "/") {
      onSectionChange(itemId);
    } else {
      // Sinon, sauvegarder la section dans localStorage et naviguer vers Index
      localStorage.setItem('activeSection', itemId);
      navigate("/");
    }
  };

  // Fonction pour gérer la navigation avec fermeture automatique sur mobile
  const handleNavigate = (path: string) => {
    // Fermer la sidebar sur mobile après un clic
    if (isMobile) {
      setSidebarOpen(false);
    }
    navigate(path);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with logo and title */}
      <div className="px-4 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Network className="h-6 w-6 text-primary shrink-0" />
          <div>
            <h1 className="text-lg font-bold text-foreground leading-tight">Réseau Inventaire</h1>
            <p className="text-xs text-muted-foreground">Gestion de l'infrastructure réseau</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="space-y-6">
          {/* Section INVENTAIRE */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 pb-2">
              Inventaire
            </p>
            {/* Tableau de bord - premier élément */}
            {(() => {
              const dashboardItem = menuItems.find(item => item.id === "dashboard");
              if (!dashboardItem) return null;
              const isActive = location.pathname === "/" && activeSection === dashboardItem.id;
              return (
                <Button
                  key={dashboardItem.id}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start text-nav-text hover:bg-muted hover:text-foreground",
                    isActive && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                  )}
                  onClick={() => handleMenuClick(dashboardItem.id)}
                >
                  <dashboardItem.icon className="mr-3 h-4 w-4" />
                  {dashboardItem.label}
                </Button>
              );
            })()}
            {/* Bâtiments */}
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start text-nav-text hover:bg-muted hover:text-foreground",
                location.pathname === "/batiments" && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
              )}
              onClick={() => handleNavigate("/batiments")}
            >
              <Building2 className="mr-3 h-4 w-4" />
              Bâtiments
            </Button>
            {/* Salles */}
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start text-nav-text hover:bg-muted hover:text-foreground",
                location.pathname === "/salles" && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
              )}
              onClick={() => handleNavigate("/salles")}
            >
              <DoorOpen className="mr-3 h-4 w-4" />
              Salles
            </Button>
            {menuItems.filter(item => item.id !== "dashboard").map((item) => {
              // Gérer le cas spécial des armoires qui a sa propre page
              if (item.id === "armoires") {
                const isActive = location.pathname === "/armoires";
                return (
                  <Button
                    key={item.id}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start text-nav-text hover:bg-muted hover:text-foreground",
                      isActive && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                    )}
                    onClick={() => handleNavigate("/armoires")}
                  >
                    <item.icon className="mr-3 h-4 w-4" />
                    {item.label}
                  </Button>
                );
              }
              
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
          </div>

          {/* Section RÉSEAU */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 pb-2">
              Réseau
            </p>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start text-nav-text hover:bg-muted hover:text-foreground",
                location.pathname === "/lans" &&
                  "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
              )}
              onClick={() => handleNavigate("/lans")}
            >
              <Network className="mr-3 h-4 w-4" />
              Gestion des LANs
            </Button>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start text-nav-text hover:bg-muted hover:text-foreground",
                location.pathname === "/cartographie-lan" &&
                  "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
              )}
              onClick={() => handleNavigate("/cartographie-lan")}
            >
              <Map className="mr-3 h-4 w-4" />
              Cartographie LAN
            </Button>
          </div>

          {/* Section ADMINISTRATION */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 pb-2">
              Administration
            </p>
            <Collapsible open={isAccessOpen} onOpenChange={setIsAccessOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-between text-nav-text hover:bg-muted hover:text-foreground"
                  )}
                >
                  <div className="flex items-center">
                    <Users className="mr-3 h-4 w-4" />
                    <span>Gestion des utilisateurs</span>
                  </div>
                  {isAccessOpen ? (
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
                    isAccessButtonActive("users") && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                  )}
                  onClick={() => handleMenuClick("users")}
                >
                  <Users className="mr-3 h-4 w-4" />
                  Utilisateurs
                </Button>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start text-nav-text hover:bg-muted hover:text-foreground text-sm",
                    isAccessButtonActive("roles") && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                  )}
                  onClick={() => handleNavigate("/roles")}
                >
                  <Shield className="mr-3 h-4 w-4" />
                  Rôles
                </Button>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start text-nav-text hover:bg-muted hover:text-foreground text-sm",
                    isAccessButtonActive("permissions") && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                  )}
                  onClick={() => handleNavigate("/permissions")}
                >
                  <KeyRound className="mr-3 h-4 w-4" />
                  Permissions
                </Button>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Section COMPTE */}
          <div className="space-y-1 pt-4 border-t border-border">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 pb-2">
              Compte
            </p>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start text-nav-text hover:bg-muted hover:text-foreground",
                location.pathname === "/profile" && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
              )}
              onClick={() => handleNavigate("/profile")}
            >
              <User className="mr-3 h-4 w-4" />
              Mon profil
            </Button>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start text-nav-text hover:bg-muted hover:text-foreground",
                location.pathname === "/" && activeSection === "parametres" && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
              )}
              onClick={() => handleMenuClick("parametres")}
            >
              <Settings className="mr-3 h-4 w-4" />
              Paramètres
            </Button>
          </div>

        </div>
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border">
        <div className="text-xs text-muted-foreground">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-status-up"></div>
            <span>Système opérationnel</span>
          </div>
        </div>
      </div>
    </div>
  );
}