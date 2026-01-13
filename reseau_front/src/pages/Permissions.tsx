import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import permissionService, { PermissionModule } from "@/services/permissionService";
import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Key, Loader2, Search, Building2, DoorOpen, Server, HardDrive, Plug, Cable, Network, Wrench, Map, LayoutDashboard, Users, Shield, KeyRound } from "lucide-react";

// Mapping des icônes par module
const moduleIcons: Record<string, any> = {
  utilisateurs: Users,
  roles: Shield,
  permissions: KeyRound,
  batiments: Building2,
  salles: DoorOpen,
  armoires: Server,
  equipements: HardDrive,
  ports: Plug,
  liaisons: Cable,
  lans: Network,
  maintenance: Wrench,
  cartographie: Map,
  dashboard: LayoutDashboard,
};

// Couleurs par module
const moduleColors: Record<string, string> = {
  utilisateurs: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  roles: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  permissions: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  batiments: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  salles: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  armoires: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  equipements: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  ports: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  liaisons: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  lans: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  maintenance: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  cartographie: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
  dashboard: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200",
};

const PermissionsPage = () => {
  const { isAuthenticated, isLoading: isLoadingAuth } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  // Query
  const { data: permissionsData, isLoading: isLoadingPermissions } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => permissionService.getAll(),
    enabled: isAuthenticated,
  });

  const permissionModules = permissionsData?.data || [];
  const totalPermissions = permissionsData?.all_permissions?.length || 0;

  // Filtrer les permissions par recherche
  const filteredModules = useMemo(() => {
    if (!searchTerm) return permissionModules;

    const searchLower = searchTerm.toLowerCase();
    return permissionModules
      .map((module) => ({
        ...module,
        permissions: module.permissions.filter(
          (perm) =>
            perm.name.toLowerCase().includes(searchLower) ||
            perm.action_label.toLowerCase().includes(searchLower) ||
            module.module_label.toLowerCase().includes(searchLower)
        ),
      }))
      .filter((module) => module.permissions.length > 0);
  }, [permissionModules, searchTerm]);

  useEffect(() => {
    if (!isLoadingAuth && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, isLoadingAuth, navigate]);

  if (isLoadingAuth) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Gestion des Permissions"
          description="Consultez les permissions disponibles pour les rôles utilisateur"
          icon={<Key className="h-6 w-6 text-primary" />}
          breadcrumbs={[
            { label: "Tableau de bord", href: "/" },
            { label: "Permissions" },
          ]}
        />

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total des permissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPermissions}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Modules
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{permissionModules.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Résultats filtrés
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filteredModules.reduce((acc, m) => acc + m.permissions.length, 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Barre de recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une permission..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {isLoadingPermissions ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            <Accordion type="multiple" className="w-full" defaultValue={permissionModules.map(m => m.module)}>
              {filteredModules.map((module) => {
                const IconComponent = moduleIcons[module.module] || Key;
                const colorClass = moduleColors[module.module] || "bg-gray-100 text-gray-800";

                return (
                  <AccordionItem key={module.module} value={module.module} className="border rounded-lg mb-2">
                    <AccordionTrigger className="px-4 hover:no-underline">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${colorClass}`}>
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <div className="text-left">
                          <div className="font-semibold">{module.module_label}</div>
                          <div className="text-xs text-muted-foreground">
                            {module.permissions.length} permission{module.permissions.length > 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                        {module.permissions.map((perm) => (
                          <div
                            key={perm.id}
                            className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full bg-primary" />
                              <div>
                                <div className="font-medium text-sm">{perm.action_label}</div>
                                <div className="text-xs text-muted-foreground font-mono">
                                  {perm.name}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>

            {filteredModules.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                Aucune permission trouvée pour "{searchTerm}"
              </div>
            )}
          </div>
        )}

        {/* Légende */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Légende des actions</CardTitle>
            <CardDescription>Description des différentes actions possibles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="outline">voir</Badge>
                <span className="text-muted-foreground">Consulter les données</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">creer</Badge>
                <span className="text-muted-foreground">Ajouter des éléments</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">modifier</Badge>
                <span className="text-muted-foreground">Éditer les données</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">supprimer</Badge>
                <span className="text-muted-foreground">Retirer des éléments</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">restaurer</Badge>
                <span className="text-muted-foreground">Récupérer supprimés</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">importer</Badge>
                <span className="text-muted-foreground">Import de données</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">exporter</Badge>
                <span className="text-muted-foreground">Export de données</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">attribuer</Badge>
                <span className="text-muted-foreground">Assigner à des rôles</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
};

export default PermissionsPage;
