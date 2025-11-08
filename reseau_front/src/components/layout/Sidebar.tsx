import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Server, 
  Cable, 
  Router, 
  Settings,
  Search,
  HardDrive,
  Wrench,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  { id: "users", label: "Utilisateurs", icon: Users },
  { id: "parametres", label: "Paramètres", icon: Settings },
];

export default function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  return (
    <div className="w-64 h-screen bg-nav-background border-r border-border flex flex-col">
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

      {/* Search */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Recherche globale: armoires, équipements, ports..."
            className="pl-10 bg-muted border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 pb-2">
            Navigation
          </p>
          {menuItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <Button
                key={item.id}
                variant="ghost"
                className={cn(
                  "w-full justify-start text-nav-text hover:bg-muted hover:text-foreground",
                  isActive && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                )}
                onClick={() => onSectionChange(item.id)}
              >
                <item.icon className="mr-3 h-4 w-4" />
                {item.label}
              </Button>
            );
          })}
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