import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useData } from "@/contexts/DataContext";
import AppShell from "@/components/layout/AppShell";
import DataTableEnhanced from "@/components/ui/data-table-enhanced";
import DetailsModal from "@/components/ui/details-modal";
import EditModal from "@/components/ui/edit-modal";
import AddSiteForm from "@/components/forms/AddSiteForm";
import { toast } from "@/hooks/use-toast";
import { Loader2, Trash2, RotateCcw, AlertTriangle, MapPin, Layers, Calendar, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { AxiosError } from "axios";
import PageHeader from "@/components/ui/page-header";

interface SiteDeleteError {
  message: string;
  zones_count: number;
  error: 'has_zones';
}

const Sites = () => {
  const { isAuthenticated, isLoading: isLoadingAuth } = useRequireAuth();
  const navigate = useNavigate();
  const {
    sites,
    isLoadingSites,
    trashedSites,
    isLoadingTrashedSites,
    addSite,
    updateSite,
    deleteSite,
    restoreSite,
    refetchSites,
    refetchTrashedSites
  } = useData();
  const [selectedSite, setSelectedSite] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [siteToDelete, setSiteToDelete] = useState<any>(null);
  const [deleteError, setDeleteError] = useState<SiteDeleteError | null>(null);
  const [activeTab, setActiveTab] = useState("active");

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

  const handleRowClick = (site: any) => {
    // Trouver le site original avec toutes les données
    const originalSite = sites.find(s => s.id === site.id) || trashedSites.find(s => s.id === site.id);
    setSelectedSite(originalSite || site);
    setIsDetailsOpen(true);
  };

  const handleEdit = (site: any) => {
    const originalSite = sites.find(s => s.id === site.id);
    setSelectedSite(originalSite || site);
    setIsEditOpen(true);
  };

  const handleSave = async (updatedSite: any) => {
    try {
      await updateSite(updatedSite.id, {
        libelle: updatedSite.libelle,
        description: updatedSite.description,
      });
      toast({
        title: "Site mis à jour",
        description: "Les informations du site ont été enregistrées.",
      });
      setIsEditOpen(false);
      setSelectedSite(null);
      refetchSites();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour du site.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClick = async (siteOrId: any) => {
    // onDelete de DataTableEnhanced passe un ID après confirmation du dialog intégré
    const siteId = typeof siteOrId === 'object' ? siteOrId.id : siteOrId;
    const originalSite = sites.find(s => s.id === siteId);

    if (!originalSite) return;

    try {
      await deleteSite(siteId);
      toast({
        title: "Site supprimé",
        description: "Le site a été déplacé vers la corbeille. Vous pouvez le restaurer si nécessaire.",
      });
      setIsDetailsOpen(false);
      setSelectedSite(null);
      refetchSites();
      refetchTrashedSites();
    } catch (error) {
      const axiosError = error as AxiosError<SiteDeleteError>;
      if (axiosError.response?.data?.error === 'has_zones') {
        // Ouvrir notre dialog d'erreur personnalisé
        setSiteToDelete(originalSite);
        setDeleteError(axiosError.response.data);
        setDeleteDialogOpen(true);
      } else {
        toast({
          title: "Erreur",
          description: "Une erreur est survenue lors de la suppression du site.",
          variant: "destructive",
        });
      }
    }
  };

  const handleDeleteFromDetails = () => {
    // Appelé depuis le modal de détails - ouvre le dialog de confirmation
    if (selectedSite) {
      setSiteToDelete(selectedSite);
      setDeleteError(null);
      setDeleteDialogOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (!siteToDelete) return;

    try {
      await deleteSite(siteToDelete.id);
      toast({
        title: "Site supprimé",
        description: "Le site a été déplacé vers la corbeille. Vous pouvez le restaurer si nécessaire.",
      });
      setDeleteDialogOpen(false);
      setSiteToDelete(null);
      setIsDetailsOpen(false);
      setSelectedSite(null);
      refetchSites();
      refetchTrashedSites();
    } catch (error) {
      const axiosError = error as AxiosError<SiteDeleteError>;
      if (axiosError.response?.data?.error === 'has_zones') {
        setDeleteError(axiosError.response.data);
      } else {
        toast({
          title: "Erreur",
          description: "Une erreur est survenue lors de la suppression du site.",
          variant: "destructive",
        });
        setDeleteDialogOpen(false);
      }
    }
  };

  const handleRestore = async (siteId: number) => {
    try {
      await restoreSite(siteId);
      toast({
        title: "Site restauré",
        description: "Le site a été restauré avec succès.",
      });
      refetchSites();
      refetchTrashedSites();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la restauration du site.",
        variant: "destructive",
      });
    }
  };

  // Préparer les données pour le tableau des sites actifs
  const tableData = sites.map((site) => ({
    id: site.id,
    "Libellé": site.libelle,
    "Description": site.description || "Aucune description",
    "Zones": site.zones_count || 0,
    "Status": "Actif",
    "Date de création": site.created_at ? new Date(site.created_at).toLocaleDateString('fr-FR') : "N/A",
  }));

  // Préparer les données pour le tableau des sites supprimés
  const trashedTableData = trashedSites.map((site) => ({
    id: site.id,
    libelle: site.libelle,
    description: site.description || "Aucune description",
    zones: site.zones_count || 0,
    Status: "Supprimé",
    dateSuppression: site.deleted_at ? new Date(site.deleted_at).toLocaleDateString('fr-FR') : "N/A",
  }));

  // Rendu personnalisé pour la colonne Libellé (identifiant principal)
  const renderLibelleCell = (value: string) => {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100">
        {value}
      </span>
    );
  };

  // Rendu personnalisé pour la colonne Status
  const renderStatusCell = (value: string) => {
    const isActive = value === "Actif";
    return (
      <div className="flex items-center gap-1.5">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${
          isActive
            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
        }`}>
          <CheckCircle2 className="h-3 w-3" />
          {value}
        </span>
      </div>
    );
  };

  // Rendu personnalisé pour la colonne Zones
  const renderZonesCell = (value: number) => {
    return (
      <div className="flex items-center gap-1.5">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${
          value > 0
            ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400"
            : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
        }`}>
          <Layers className="h-3 w-3" />
          {value} zone{value !== 1 ? 's' : ''}
        </span>
      </div>
    );
  };

  // Rendu personnalisé pour la colonne Date
  const renderDateCell = (value: string) => {
    return (
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Calendar className="h-3.5 w-3.5" />
        <span className="text-xs">{value}</span>
      </div>
    );
  };

  // Préparer les données pour les modals (format attendu)
  const formatSiteForModal = (site: any) => {
    if (!site) return null;
    return {
      id: site.id,
      libelle: site.libelle,
      description: site.description || "",
      zones: site.zones_count || 0,
    };
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Gestion des sites"
          description="Configuration et gestion des sites de votre infrastructure"
          icon={<MapPin className="h-6 w-6 text-primary" />}
          breadcrumbs={[
            { label: "Tableau de bord", href: "/" },
            { label: "Sites" },
          ]}
          actions={<AddSiteForm />}
        />

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="active" className="gap-2">
              <MapPin className="h-4 w-4" />
              Sites actifs
              <Badge variant="secondary" className="ml-1">{sites.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="trashed" className="gap-2">
              <Trash2 className="h-4 w-4" />
              Corbeille
              {trashedSites.length > 0 && (
                <Badge variant="destructive" className="ml-1">{trashedSites.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-4">
            {isLoadingSites ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : sites.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 bg-card border border-border rounded-lg">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <MapPin className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Aucun site configuré</h3>
                <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
                  Commencez par créer votre premier site pour organiser votre infrastructure réseau.
                </p>
                <AddSiteForm />
              </div>
            ) : (
              <DataTableEnhanced
                title={`${sites.length} site${sites.length > 1 ? 's' : ''} configuré${sites.length > 1 ? 's' : ''}`}
                columns={["Libellé", "Description", "Zones", "Status", "Date de création"]}
                data={tableData}
                onRowClick={handleRowClick}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
                customCellRenderers={{
                  "Libellé": renderLibelleCell,
                  "Status": renderStatusCell,
                  "Zones": renderZonesCell,
                  "Date de création": renderDateCell,
                }}
              />
            )}
          </TabsContent>

          <TabsContent value="trashed" className="mt-4">
            {isLoadingTrashedSites ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : trashedSites.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Trash2 className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">La corbeille est vide</p>
                <p className="text-sm">Les sites supprimés apparaîtront ici</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-800 dark:text-amber-200">Sites dans la corbeille</p>
                      <p className="text-sm text-amber-700 dark:text-amber-300">
                        Ces sites ont été supprimés mais peuvent être restaurés. Cliquez sur le bouton Restaurer pour les récupérer.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Libellé</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Description</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Zones</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Supprimé le</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trashedTableData.map((site) => (
                        <tr key={site.id} className="border-t border-border hover:bg-muted/30">
                          <td className="px-4 py-3 font-medium">{site.libelle}</td>
                          <td className="px-4 py-3 text-muted-foreground">{site.description}</td>
                          <td className="px-4 py-3">
                            <Badge variant="outline">{site.zones} zone{site.zones !== 1 ? 's' : ''}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="destructive">Supprimé</Badge>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{site.dateSuppression}</td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRestore(site.id)}
                              className="gap-2"
                            >
                              <RotateCcw className="h-4 w-4" />
                              Restaurer
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DetailsModal
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
          title="Détails du site"
          data={formatSiteForModal(selectedSite)}
          onEdit={selectedSite && !selectedSite.deleted_at ? () => {
            setIsDetailsOpen(false);
            setIsEditOpen(true);
          } : undefined}
          onDelete={selectedSite && !selectedSite.deleted_at ? handleDeleteFromDetails : undefined}
        />

        <EditModal
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          title="Modifier le site"
          data={formatSiteForModal(selectedSite)}
          onSave={handleSave}
          fields={[
            { key: "libelle", label: "Libellé", type: "text" },
            { key: "description", label: "Description", type: "textarea" },
          ]}
        />

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {deleteError ? (
                  <span className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                    Suppression impossible
                  </span>
                ) : (
                  "Confirmer la suppression"
                )}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {deleteError ? (
                  <div className="space-y-3">
                    <p>{deleteError.message}</p>
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                      <p className="text-sm text-amber-800 dark:text-amber-200">
                        <strong>Ce site contient {deleteError.zones_count} zone(s).</strong>
                      </p>
                      <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                        Veuillez d'abord supprimer ou déplacer les zones associées avant de pouvoir supprimer ce site.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => navigate('/zones')}
                    >
                      Aller à la gestion des zones
                    </Button>
                  </div>
                ) : (
                  <>
                    Êtes-vous sûr de vouloir supprimer le site <strong>{siteToDelete?.libelle}</strong> ?
                    <br /><br />
                    Le site sera déplacé vers la corbeille et pourra être restauré ultérieurement.
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteError(null)}>
                {deleteError ? "Fermer" : "Annuler"}
              </AlertDialogCancel>
              {!deleteError && (
                <AlertDialogAction
                  onClick={handleConfirmDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Supprimer
                </AlertDialogAction>
              )}
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppShell>
  );
};

export default Sites;
