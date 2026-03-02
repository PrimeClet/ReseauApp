import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSidebarToggle } from "@/components/layout/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Server,
  Cable,
  Settings,
  HardDrive,
  Wrench,
  Users,
  User,
  Building2,
  DoorOpen,
  MapPin,
  Layers,
  ChevronDown,
  ChevronRight,
  Shield,
  KeyRound,
  Network,
  Map,
  Plug,
  CheckCircle2,
  History,
  Bell,
  FileEdit,
  Activity,
  CalendarClock
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
  { id: "ports", label: "Ports", icon: Plug },
  { id: "liaisons", label: "Liaisons", icon: Cable },
];

const accessSections = ["users", "roles", "permissions", "activity-logs"];

export default function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { setSidebarOpen } = useSidebarToggle();
  const { user } = useAuth();
  const [isAccessOpen, setIsAccessOpen] = useState(false);
  const [isMaintenancesOpen, setIsMaintenancesOpen] = useState(false);

  useEffect(() => {
    if (
      (location.pathname === "/" && accessSections.includes(activeSection)) ||
      location.pathname === "/roles" ||
      location.pathname === "/permissions" ||
      location.pathname === "/activity-logs"
    ) {
      setIsAccessOpen(true);
    }
  }, [location.pathname, activeSection]);

  useEffect(() => {
    if (
      location.pathname === "/maintenances" ||
      location.pathname === "/modifications" ||
      location.pathname === "/validation-modifications" ||
      location.pathname === "/modification-history"
    ) {
      setIsMaintenancesOpen(true);
    }
  }, [location.pathname]);

  const isAccessButtonActive = (sectionId: string) => {
    if (sectionId === "roles" && location.pathname === "/roles") {
      return true;
    }
    if (sectionId === "permissions" && location.pathname === "/permissions") {
      return true;
    }
    if (sectionId === "users" && location.pathname === "/users") {
      return true;
    }
    if (sectionId === "activity-logs" && location.pathname === "/activity-logs") {
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
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
            <Network className="h-5 w-5 text-primary shrink-0" />
          </div>
          <div>
            <h1 className="text-base font-bold text-primary leading-tight">NetInfra Manager</h1>
            <p className="text-xs text-muted-foreground">Gestion d'infrastructure réseau</p>
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
            {/* Sites */}
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start text-nav-text hover:bg-muted hover:text-foreground",
                location.pathname === "/sites" && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
              )}
              onClick={() => handleNavigate("/sites")}
            >
              <MapPin className="mr-3 h-4 w-4" />
              Sites
            </Button>
            {/* Zones */}
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start text-nav-text hover:bg-muted hover:text-foreground",
                location.pathname === "/zones" && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
              )}
              onClick={() => handleNavigate("/zones")}
            >
              <Layers className="mr-3 h-4 w-4" />
              Zones
            </Button>
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
                const isActive = location.pathname === "/armoires" || location.pathname.startsWith("/armoires/");
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

              // Gérer le cas des équipements qui a sa propre page
              if (item.id === "equipements") {
                const isActive = location.pathname === "/equipements" || location.pathname.startsWith("/equipements/");
                return (
                  <Button
                    key={item.id}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start text-nav-text hover:bg-muted hover:text-foreground",
                      isActive && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                    )}
                    onClick={() => handleNavigate("/equipements")}
                  >
                    <item.icon className="mr-3 h-4 w-4" />
                    {item.label}
                  </Button>
                );
              }

              // Gérer le cas des ports qui a sa propre page
              if (item.id === "ports") {
                const isActive = location.pathname === "/ports";
                return (
                  <Button
                    key={item.id}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start text-nav-text hover:bg-muted hover:text-foreground",
                      isActive && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                    )}
                    onClick={() => handleNavigate("/ports")}
                  >
                    <item.icon className="mr-3 h-4 w-4" />
                    {item.label}
                  </Button>
                );
              }

              // Gérer le cas des liaisons qui a sa propre page
              if (item.id === "liaisons") {
                const isActive = location.pathname === "/liaisons";
                return (
                  <Button
                    key={item.id}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start text-nav-text hover:bg-muted hover:text-foreground",
                      isActive && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                    )}
                    onClick={() => handleNavigate("/liaisons")}
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

          {/* Section MAINTENANCES */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 pb-2">
              Maintenances
            </p>
            <Collapsible open={isMaintenancesOpen} onOpenChange={setIsMaintenancesOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-between text-nav-text hover:bg-muted hover:text-foreground"
                  )}
                >
                  <div className="flex items-center">
                    <Wrench className="mr-3 h-4 w-4" />
                    Gestion des interventions
                  </div>
                  {isMaintenancesOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-4 space-y-1">
                {/* Maintenances - visible par Admin (créateur) et Technicien (exécutant) */}
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start text-sm text-nav-text hover:bg-muted hover:text-foreground",
                    location.pathname === "/maintenances" &&
                      "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                  )}
                  onClick={() => handleNavigate("/maintenances")}
                >
                  <CalendarClock className="mr-3 h-4 w-4" />
                  Maintenances
                </Button>
                {/* Mises à jour (Modifications) - Technicien soumet, Admin valide */}
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start text-sm text-nav-text hover:bg-muted hover:text-foreground",
                    location.pathname === "/modifications" &&
                      "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                  )}
                  onClick={() => handleNavigate("/modifications")}
                >
                  <FileEdit className="mr-3 h-4 w-4" />
                  Mises à jour
                </Button>
                {/* Validation - Admin uniquement */}
                {user?.role === 'administrator' && (
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start text-sm text-nav-text hover:bg-muted hover:text-foreground",
                      location.pathname === "/validation-modifications" &&
                        "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                    )}
                    onClick={() => handleNavigate("/validation-modifications")}
                  >
                    <CheckCircle2 className="mr-3 h-4 w-4" />
                    Validation
                  </Button>
                )}
                {/* Historique */}
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start text-sm text-nav-text hover:bg-muted hover:text-foreground",
                    location.pathname === "/modification-history" &&
                      "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                  )}
                  onClick={() => handleNavigate("/modification-history")}
                >
                  <History className="mr-3 h-4 w-4" />
                  Historique
                </Button>
              </CollapsibleContent>
            </Collapsible>
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
                location.pathname === "/vlans" &&
                  "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
              )}
              onClick={() => handleNavigate("/vlans")}
            >
              <Layers className="mr-3 h-4 w-4" />
              VLANs
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
                  onClick={() => handleNavigate("/users")}
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
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start text-nav-text hover:bg-muted hover:text-foreground text-sm",
                    isAccessButtonActive("activity-logs") && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                  )}
                  onClick={() => handleNavigate("/activity-logs")}
                >
                  <Activity className="mr-3 h-4 w-4" />
                  Logs d'activité
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
                location.pathname === "/notifications" && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
              )}
              onClick={() => handleNavigate("/notifications")}
            >
              <Bell className="mr-3 h-4 w-4" />
              Notifications
            </Button>
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