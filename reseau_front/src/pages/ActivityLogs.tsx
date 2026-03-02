import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, Search, Calendar, User, Filter, Trash2, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import activityLogService, { ActivityLog } from "@/services/activityLogService";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import AppShell from "@/components/layout/AppShell";

export default function ActivityLogs() {
  const { isLoading: isLoadingAuth } = useRequireAuth();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("");
  const [modelTypeFilter, setModelTypeFilter] = useState<string>("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await activityLogService.getAll({
        page: currentPage,
        per_page: 50,
        search: search || undefined,
        action: actionFilter || undefined,
        model_type: modelTypeFilter || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      });
      setLogs(response.data || []);
      setTotalPages(response.last_page || 1);
      setTotal(response.total || 0);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Impossible de charger les logs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [currentPage, actionFilter, modelTypeFilter, dateFrom, dateTo]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchLogs();
  };

  const getActionBadge = (action: string) => {
    const variants: Record<string, { color: string; label: string }> = {
      create: { color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", label: "Création" },
      update: { color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200", label: "Modification" },
      delete: { color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200", label: "Suppression" },
      restore: { color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200", label: "Restauration" },
      login: { color: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200", label: "Connexion" },
      logout: { color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200", label: "Déconnexion" },
      force_delete: { color: "bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100", label: "Suppression définitive" },
    };

    const variant = variants[action] || { color: "bg-gray-100 text-gray-800", label: action };

    return (
      <Badge className={variant.color}>
        {variant.label}
      </Badge>
    );
  };

  const getModelLabel = (modelType: string | null) => {
    if (!modelType) return null;

    const labels: Record<string, string> = {
      'App\\Models\\Equipement': 'Équipement',
      'App\\Models\\Port': 'Port',
      'App\\Models\\Liaison': 'Liaison',
      'App\\Models\\Coffret': 'Armoire',
      'App\\Models\\Batiment': 'Bâtiment',
      'App\\Models\\Salle': 'Salle',
      'App\\Models\\Lan': 'LAN',
      'App\\Models\\User': 'Utilisateur',
    };

    return labels[modelType] || modelType.split('\\').pop();
  };

  if (isLoadingAuth) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Activity className="h-8 w-8" />
              Logs d'activité
            </h1>
            <p className="text-muted-foreground mt-1">
              Historique complet des actions sur le système ({total} entrées)
            </p>
          </div>
        </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Rechercher..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="flex-1"
                />
                <Button onClick={handleSearch} size="icon">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Select value={actionFilter || "all"} onValueChange={(val) => setActionFilter(val === "all" ? "" : val)}>
              <SelectTrigger>
                <SelectValue placeholder="Type d'action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les actions</SelectItem>
                <SelectItem value="create">Création</SelectItem>
                <SelectItem value="update">Modification</SelectItem>
                <SelectItem value="delete">Suppression</SelectItem>
                <SelectItem value="restore">Restauration</SelectItem>
                <SelectItem value="login">Connexion</SelectItem>
                <SelectItem value="logout">Déconnexion</SelectItem>
              </SelectContent>
            </Select>

            <Select value={modelTypeFilter || "all"} onValueChange={(val) => setModelTypeFilter(val === "all" ? "" : val)}>
              <SelectTrigger>
                <SelectValue placeholder="Type de modèle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les modèles</SelectItem>
                <SelectItem value="App\Models\Equipement">Équipement</SelectItem>
                <SelectItem value="App\Models\Port">Port</SelectItem>
                <SelectItem value="App\Models\Liaison">Liaison</SelectItem>
                <SelectItem value="App\Models\Coffret">Armoire</SelectItem>
                <SelectItem value="App\Models\Batiment">Bâtiment</SelectItem>
                <SelectItem value="App\Models\Salle">Salle</SelectItem>
                <SelectItem value="App\Models\Lan">LAN</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                placeholder="Date début"
              />
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                placeholder="Date fin"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des logs */}
      <Card>
        <CardHeader>
          <CardTitle>Historique</CardTitle>
          <CardDescription>
            Affichage des logs d'activité en temps réel
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun log trouvé</p>
            </div>
          ) : (
            <>
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-4 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {getActionBadge(log.action)}
                          {log.model_type && (
                            <Badge variant="outline">
                              {getModelLabel(log.model_type)}
                            </Badge>
                          )}
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(log.created_at), "PPP 'à' HH:mm", { locale: fr })}
                          </span>
                          {log.user && (
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {log.user.name}
                            </span>
                          )}
                        </div>
                        <p className="text-sm">{log.description}</p>
                        {log.ip_address && (
                          <p className="text-xs text-muted-foreground">IP: {log.ip_address}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Page {currentPage} sur {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Précédent
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Suivant
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
    </AppShell>
  );
}
