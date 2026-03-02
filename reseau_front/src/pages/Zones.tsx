import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useData } from "@/contexts/DataContext";
import AppShell from "@/components/layout/AppShell";
import DataTableEnhanced from "@/components/ui/data-table-enhanced";
import DetailsModal from "@/components/ui/details-modal";
import EditModal from "@/components/ui/edit-modal";
import AddZoneForm from "@/components/forms/AddZoneForm";
import { toast } from "@/hooks/use-toast";
import { Loader2, Trash2, RotateCcw, AlertTriangle, Layers, Building2, MapPin, Calendar, CheckCircle2 } from "lucide-react";
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

interface ZoneDeleteError {
  message: string;
  batiments_count: number;
  error: 'has_batiments';
}

const Zones = () => {
  const { isAuthenticated, isLoading: isLoadingAuth } = useRequireAuth();
  const navigate = useNavigate();
  const {
    zones,
    sites,
    isLoadingZones,
    trashedZones,
    isLoadingTrashedZones,
    updateZone,
    deleteZone,
    restoreZone,
    refetchZones,
    refetchTrashedZones
  } = useData();
  const [selectedZone, setSelectedZone] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [zoneToDelete, setZoneToDelete] = useState<any>(null);
  const [deleteError, setDeleteError] = useState<ZoneDeleteError | null>(null);
  const [activeTab, setActiveTab] = useState("active");

  const siteIdToLabel = useMemo(() => {
    const m = new Map<number, string>();
    sites.forEach(s => m.set(s.id, s.libelle));
    return m;
  }, [sites]);

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

  const handleRowClick = (zone: any) => {
    const originalZone = zones.find(z => z.id === zone.id) || trashedZones.find(z => z.id === zone.id);
    setSelectedZone(originalZone || zone);
    setIsDetailsOpen(true);
  };

  const handleEdit = (zone: any) => {
    const originalZone = zones.find(z => z.id === zone.id);
    setSelectedZone(originalZone || zone);
    setIsEditOpen(true);
  };

  const handleSave = async (updatedZone: any) => {
    try {
      await updateZone(updatedZone.id, {
        site_id: updatedZone.site_id,
        libelle: updatedZone.libelle,
        description: updatedZone.description,
      });
      toast({
        title: "Zone mise à jour",
        description: "Les informations de la zone ont été enregistrées.",
      });
      setIsEditOpen(false);
      setSelectedZone(null);
      refetchZones();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour de la zone.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClick = async (zoneOrId: any) => {
    const zoneId = typeof zoneOrId === 'object' ? zoneOrId.id : zoneOrId;
    const originalZone = zones.find(z => z.id === zoneId);

    if (!originalZone) return;

    try {
      await deleteZone(zoneId);
      toast({
        title: "Zone supprimée",
        description: "La zone a été déplacée vers la corbeille. Vous pouvez la restaurer si nécessaire.",
      });
      setIsDetailsOpen(false);
      setSelectedZone(null);
      refetchZones();
      refetchTrashedZones();
    } catch (error) {
      const axiosError = error as AxiosError<ZoneDeleteError>;
      if (axiosError.response?.data?.error === 'has_batiments') {
        setZoneToDelete(originalZone);
        setDeleteError(axiosError.response.data);
        setDeleteDialogOpen(true);
      } else {
        toast({
          title: "Erreur",
          description: "Une erreur est survenue lors de la suppression de la zone.",
          variant: "destructive",
        });
      }
    }
  };

  const handleDeleteFromDetails = () => {
    if (selectedZone) {
      setZoneToDelete(selectedZone);
      setDeleteError(null);
      setDeleteDialogOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (!zoneToDelete) return;

    try {
      await deleteZone(zoneToDelete.id);
      toast({
        title: "Zone supprimée",
        description: "La zone a été déplacée vers la corbeille. Vous pouvez la restaurer si nécessaire.",
      });
      setDeleteDialogOpen(false);
      setZoneToDelete(null);
      setIsDetailsOpen(false);
      setSelectedZone(null);
      refetchZones();
      refetchTrashedZones();
    } catch (error) {
      const axiosError = error as AxiosError<ZoneDeleteError>;
      if (axiosError.response?.data?.error === 'has_batiments') {
        setDeleteError(axiosError.response.data);
      } else {
        toast({
          title: "Erreur",
          description: "Une erreur est survenue lors de la suppression de la zone.",
          variant: "destructive",
        });
        setDeleteDialogOpen(false);
      }
    }
  };

  const handleRestore = async (zoneId: number) => {
    try {
      await restoreZone(zoneId);
      toast({
        title: "Zone restaurée",
        description: "La zone a été restaurée avec succès.",
      });
      refetchZones();
      refetchTrashedZones();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la restauration de la zone.",
        variant: "destructive",
      });
    }
  };

  // Préparer les données pour le tableau des zones actives
  const tableData = zones.map((zone) => ({
    id: zone.id,
    "Site": siteIdToLabel.get(zone.site_id) || zone.site?.libelle || `#${zone.site_id}`,
    "Libellé": zone.libelle,
    "Description": zone.description || "Aucune description",
    "Bâtiments": zone.batiments_count || 0,
    "Status": "Actif",
    "Date de création": zone.created_at ? new Date(zone.created_at).toLocaleDateString('fr-FR') : "N/A",
  }));

  // Préparer les données pour le tableau des zones supprimées
  const trashedTableData = trashedZones.map((zone) => ({
    id: zone.id,
    site: siteIdToLabel.get(zone.site_id) || zone.site?.libelle || `#${zone.site_id}`,
    libelle: zone.libelle,
    description: zone.description || "Aucune description",
    batiments: zone.batiments_count || 0,
    Status: "Supprimé",
    dateSuppression: zone.deleted_at ? new Date(zone.deleted_at).toLocaleDateString('fr-FR') : "N/A",
  }));

  // Rendu personnalisé pour la colonne Libellé (identifiant principal)
  const renderLibelleCell = (value: string) => {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100">
        {value}
      </span>
    );
  };

  // Rendu personnalisé pour la colonne Site
  const renderSiteCell = (value: string) => {
    return (
      <div className="flex items-center gap-1.5">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-400">
          <MapPin className="h-3 w-3" />
          {value}
        </span>
      </div>
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

  // Rendu personnalisé pour la colonne Bâtiments
  const renderBatimentsCell = (value: number) => {
    return (
      <div className="flex items-center gap-1.5">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${
          value > 0
            ? "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400"
            : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
        }`}>
          <Building2 className="h-3 w-3" />
          {value} bâtiment{value !== 1 ? 's' : ''}
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
  const formatZoneForModal = (zone: any) => {
    if (!zone) return null;
    const siteName = siteIdToLabel.get(zone.site_id) || zone.site?.libelle || "Non défini";
    return {
      id: zone.id,
      site_id: zone.site_id,
      libelle: zone.libelle,
      site: siteName,
      description: zone.description || "",
      batiments: zone.batiments_count || 0,
    };
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Gestion des zones"
          description="Configuration et gestion des zones par site"
          icon={<Layers className="h-6 w-6 text-primary" />}
          breadcrumbs={[
            { label: "Tableau de bord", href: "/" },
            { label: "Zones" },
          ]}
          actions={<AddZoneForm />}
        />

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="active" className="gap-2">
              <Layers className="h-4 w-4" />
              Zones actives
              <Badge variant="secondary" className="ml-1">{zones.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="trashed" className="gap-2">
              <Trash2 className="h-4 w-4" />
              Corbeille
              {trashedZones.length > 0 && (
                <Badge variant="destructive" className="ml-1">{trashedZones.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-4">
            {isLoadingZones ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : zones.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 bg-card border border-border rounded-lg">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Layers className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Aucune zone configurée</h3>
                <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
                  Commencez par créer votre première zone pour organiser votre infrastructure réseau.
                </p>
                <AddZoneForm />
              </div>
            ) : (
              <DataTableEnhanced
                title={`${zones.length} zone${zones.length > 1 ? 's' : ''} configurée${zones.length > 1 ? 's' : ''}`}
                columns={["Site", "Libellé", "Description", "Bâtiments", "Status", "Date de création"]}
                data={tableData}
                onRowClick={handleRowClick}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
                customCellRenderers={{
                  "Libellé": renderLibelleCell,
                  "Site": renderSiteCell,
                  "Status": renderStatusCell,
                  "Bâtiments": renderBatimentsCell,
                  "Date de création": renderDateCell,
                }}
              />
            )}
          </TabsContent>

          <TabsContent value="trashed" className="mt-4">
            {isLoadingTrashedZones ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : trashedZones.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Trash2 className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">La corbeille est vide</p>
                <p className="text-sm">Les zones supprimées apparaîtront ici</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-800 dark:text-amber-200">Zones dans la corbeille</p>
                      <p className="text-sm text-amber-700 dark:text-amber-300">
                        Ces zones ont été supprimées mais peuvent être restaurées. Cliquez sur le bouton Restaurer pour les récupérer.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Site</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Libellé</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Description</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Bâtiments</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Supprimé le</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trashedTableData.map((zone) => (
                        <tr key={zone.id} className="border-t border-border hover:bg-muted/30">
                          <td className="px-4 py-3 text-muted-foreground">{zone.site}</td>
                          <td className="px-4 py-3 font-medium">{zone.libelle}</td>
                          <td className="px-4 py-3 text-muted-foreground">{zone.description}</td>
                          <td className="px-4 py-3">
                            <Badge variant="outline">{zone.batiments} bâtiment{zone.batiments !== 1 ? 's' : ''}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="destructive">Supprimé</Badge>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{zone.dateSuppression}</td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRestore(zone.id)}
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
          title="Détails de la zone"
          data={formatZoneForModal(selectedZone)}
          onEdit={selectedZone && !selectedZone.deleted_at ? () => {
            setIsDetailsOpen(false);
            setIsEditOpen(true);
          } : undefined}
          onDelete={selectedZone && !selectedZone.deleted_at ? handleDeleteFromDetails : undefined}
        />

        <EditModal
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          title="Modifier la zone"
          data={formatZoneForModal(selectedZone)}
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
                        <strong>Cette zone contient {deleteError.batiments_count} bâtiment(s).</strong>
                      </p>
                      <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                        Veuillez d'abord supprimer ou déplacer les bâtiments associés avant de pouvoir supprimer cette zone.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => navigate('/batiments')}
                    >
                      Aller à la gestion des bâtiments
                    </Button>
                  </div>
                ) : (
                  <>
                    Êtes-vous sûr de vouloir supprimer la zone <strong>{zoneToDelete?.libelle}</strong> ?
                    <br /><br />
                    La zone sera déplacée vers la corbeille et pourra être restaurée ultérieurement.
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

export default Zones;
