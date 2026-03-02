import { useState, useMemo } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useData } from "@/contexts/DataContext";
import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/ui/page-header";
import DataTableEnhanced from "@/components/ui/data-table-enhanced";
import DetailsModal from "@/components/ui/details-modal";
import EditModal from "@/components/ui/edit-modal";
import AddBatimentForm from "@/components/forms/AddBatimentForm";
import { toast } from "@/hooks/use-toast";
import { Loader2, Building2, Layers, DoorOpen, CheckCircle2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Batiments = () => {
  const { isAuthenticated, isLoading: isLoadingAuth } = useRequireAuth();
  const { batiments, salles, zones, isLoadingBatiments, updateBatiment, deleteBatiment, restoreBatiment, refetchBatiments, importBatiments } = useData();
  const [selectedBatiment, setSelectedBatiment] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sallesFilter, setSallesFilter] = useState<string>("all");
  const [zoneFilter, setZoneFilter] = useState<string>("all");

  // Calculer le nombre de salles par bâtiment - DOIT être avant tout return conditionnel
  const sallesCountByBatiment = useMemo(() => {
    const counts: Record<number, number> = {};
    salles.forEach((salle) => {
      if (salle.batiment_id) {
        counts[salle.batiment_id] = (counts[salle.batiment_id] || 0) + 1;
      }
    });
    return counts;
  }, [salles]);

  // Map zone_id -> libelle pour affichage
  const zoneIdToLabel = useMemo(() => {
    const m = new Map<number, string>();
    zones.forEach(z => m.set(z.id, z.libelle));
    return m;
  }, [zones]);

  // Préparer les données pour le tableau - DOIT être avant tout return conditionnel
  const tableData = useMemo(() => {
    let data = batiments.map((batiment) => {
      const nombreSalles = (batiment as any).salles_count ?? sallesCountByBatiment[batiment.id] ?? 0;
      const isDeleted = (batiment as any).deleted_at !== null && (batiment as any).deleted_at !== undefined;
      const zoneName = batiment.zone_id ? (zoneIdToLabel.get(batiment.zone_id) || (batiment as any).zone?.libelle || '-') : '-';
      return {
        id: batiment.id,
        zone_id: batiment.zone_id,
        Zone: zoneName,
        Nom: batiment.nom,
        Description: batiment.description || '-',
        "Nombre de salles": nombreSalles,
        "Status": isDeleted ? "Supprimé" : "Actif",
      };
    });

    // Appliquer le filtre de zone
    if (zoneFilter !== "all") {
      if (zoneFilter === "none") {
        data = data.filter((item) => !item.zone_id);
      } else {
        data = data.filter((item) => item.zone_id === Number(zoneFilter));
      }
    }

    // Appliquer le filtre de status
    if (statusFilter !== "all") {
      data = data.filter((item) => item.Status === statusFilter);
    }

    // Appliquer le filtre de nombre de salles
    if (sallesFilter !== "all") {
      if (sallesFilter === "0") {
        data = data.filter((item) => item["Nombre de salles"] === 0);
      } else if (sallesFilter === "1-5") {
        data = data.filter((item) => item["Nombre de salles"] >= 1 && item["Nombre de salles"] <= 5);
      } else if (sallesFilter === "6+") {
        data = data.filter((item) => item["Nombre de salles"] >= 6);
      }
    }

    return data;
  }, [batiments, sallesCountByBatiment, zoneIdToLabel, zoneFilter, statusFilter, sallesFilter]);

  const handleRowClick = (batiment: any) => {
    setSelectedBatiment(batiment);
    setIsDetailsOpen(true);
  };

  const handleEdit = (batiment: any) => {
    setSelectedBatiment(batiment);
    setIsEditOpen(true);
  };

  const handleSave = async (updatedBatiment: any) => {
    try {
      const zoneId = updatedBatiment.zone_id === "" || updatedBatiment.zone_id === "none" ? null : updatedBatiment.zone_id;
      await updateBatiment(updatedBatiment.id, {
        nom: updatedBatiment.nom,
        description: updatedBatiment.description,
        zone_id: zoneId,
      });
      toast({
        title: "Bâtiment mis à jour",
        description: "Les informations du bâtiment ont été enregistrées.",
      });
      setIsEditOpen(false);
      setSelectedBatiment(null);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour du bâtiment.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (batimentId: number) => {
    try {
      await deleteBatiment(batimentId);
      refetchBatiments();
      toast({
        title: "Bâtiment supprimé",
        description: "Le bâtiment a été supprimé avec succès.",
      });
      setIsDetailsOpen(false);
      setSelectedBatiment(null);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression du bâtiment.",
        variant: "destructive",
      });
    }
  };

  const handleRestore = async (batimentId: number) => {
    try {
      await restoreBatiment(batimentId);
      refetchBatiments();
      toast({
        title: "Bâtiment restauré",
        description: "Le bâtiment a été restauré avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la restauration du bâtiment.",
        variant: "destructive",
      });
    }
  };

  const handleImport = async (file: File) => {
    try {
      const result = await importBatiments(file);
      toast({
        title: "Import terminé",
        description: `${result.created} créé(s), ${result.updated} mis à jour.${result.errors.length > 0 ? ` ${result.errors.length} erreur(s).` : ''}`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'import.",
        variant: "destructive",
      });
    }
  };

  // Rendu personnalisé pour la colonne Nom (identifiant principal)
  const renderNomCell = (value: string) => {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100">
        {value}
      </span>
    );
  };

  // Rendu personnalisé pour la colonne Zone
  const renderZoneCell = (value: string) => {
    if (value === '-') {
      return <span className="text-muted-foreground text-xs">Non assigné</span>;
    }
    return (
      <div className="flex items-center gap-1.5">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-400">
          <Layers className="h-3 w-3" />
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

  // Rendu personnalisé pour la colonne Nombre de salles
  const renderSallesCell = (value: number) => {
    return (
      <div className="flex items-center gap-1.5">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${
          value > 0
            ? "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-400"
            : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
        }`}>
          <DoorOpen className="h-3 w-3" />
          {value} salle{value !== 1 ? 's' : ''}
        </span>
      </div>
    );
  };

  // Préparer les données pour les modals (format attendu)
  const formatBatimentForModal = (batiment: any) => {
    if (!batiment) return null;
    // Trouver le bâtiment original
    const originalBatiment = batiments.find(b => b.id === batiment.id) || batiment;
    const nombreSalles = (originalBatiment as any).salles_count ?? sallesCountByBatiment[originalBatiment.id] ?? 0;
    const zoneName = originalBatiment.zone_id
      ? (zoneIdToLabel.get(originalBatiment.zone_id) || (originalBatiment as any).zone?.libelle || "Non défini")
      : "Non défini";
    return {
      id: originalBatiment.id,
      nom: originalBatiment.nom,
      zone: zoneName,
      zone_id: originalBatiment.zone_id,
      description: originalBatiment.description || "",
      nombre_salles: nombreSalles,
    };
  };

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
          title="Gestion des bâtiments"
          description="Configuration et gestion des bâtiments de votre infrastructure"
          icon={<Building2 className="h-6 w-6 text-primary" />}
          breadcrumbs={[
            { label: "Tableau de bord", href: "/" },
            { label: "Bâtiments" },
          ]}
          actions={<AddBatimentForm />}
        />

        {isLoadingBatiments ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <DataTableEnhanced
              title={`${tableData.length} bâtiment${tableData.length > 1 ? 's' : ''} configuré${tableData.length > 1 ? 's' : ''}`}
              columns={["Zone", "Nom", "Description", "Nombre de salles", "Status"]}
              data={tableData}
              onRowClick={handleRowClick}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onRestore={handleRestore}
              onImport={handleImport}
              enableImport={true}
              importModalTitle="Importer des bâtiments"
              importTemplateColumns={["nom", "description"]}
              importTemplateFileName="modele_batiments.csv"
              deleteConfirmTitle="Supprimer le bâtiment"
              deleteConfirmDescription="Êtes-vous sûr de vouloir supprimer ce bâtiment ? Cette action est irréversible."
              restoreConfirmTitle="Restaurer le bâtiment"
              restoreConfirmDescription="Êtes-vous sûr de vouloir restaurer ce bâtiment ?"
              customCellRenderers={{
                "Nom": renderNomCell,
                "Zone": renderZoneCell,
                "Status": renderStatusCell,
                "Nombre de salles": renderSallesCell,
              }}
              customFilters={
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">Zone:</span>
                    <Select value={zoneFilter} onValueChange={setZoneFilter}>
                      <SelectTrigger className="w-36">
                        <SelectValue placeholder="Toutes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes</SelectItem>
                        <SelectItem value="none">Sans zone</SelectItem>
                        {zones.map((zone) => (
                          <SelectItem key={zone.id} value={zone.id.toString()}>
                            {zone.libelle}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">Status:</span>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-28">
                        <SelectValue placeholder="Tous" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous</SelectItem>
                        <SelectItem value="Actif">Actif</SelectItem>
                        <SelectItem value="Supprimé">Supprimé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">Salles:</span>
                    <Select value={sallesFilter} onValueChange={setSallesFilter}>
                      <SelectTrigger className="w-28">
                        <SelectValue placeholder="Toutes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes</SelectItem>
                        <SelectItem value="0">0 salle</SelectItem>
                        <SelectItem value="1-5">1-5</SelectItem>
                        <SelectItem value="6+">6+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              }
            />

            <DetailsModal
              open={isDetailsOpen}
              onOpenChange={setIsDetailsOpen}
              title="Détails du bâtiment"
              data={formatBatimentForModal(selectedBatiment)}
              onEdit={() => {
                setIsDetailsOpen(false);
                setIsEditOpen(true);
              }}
              onDelete={selectedBatiment ? () => handleDelete(selectedBatiment.id) : undefined}
            />

            <EditModal
              open={isEditOpen}
              onOpenChange={setIsEditOpen}
              title="Modifier le bâtiment"
              data={formatBatimentForModal(selectedBatiment)}
              onSave={handleSave}
              fields={[
                { key: "nom", label: "Nom", type: "text" },
                { key: "zone_id", label: "Zone", type: "select", options: [{ value: "none", label: "Aucune zone" }, ...zones.map(z => ({ value: String(z.id), label: z.libelle }))] },
                { key: "description", label: "Description", type: "text" },
              ]}
            />
          </>
        )}
      </div>
    </AppShell>
  );
};

export default Batiments;
