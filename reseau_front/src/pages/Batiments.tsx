import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/ui/page-header";
import DataTableEnhanced from "@/components/ui/data-table-enhanced";
import DetailsModal from "@/components/ui/details-modal";
import EditModal from "@/components/ui/edit-modal";
import AddBatimentForm from "@/components/forms/AddBatimentForm";
import { toast } from "@/hooks/use-toast";
import { Loader2, Building2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Batiments = () => {
  const { isAuthenticated, isLoading: isLoadingAuth } = useAuth();
  const navigate = useNavigate();
  const { batiments, salles, isLoadingBatiments, updateBatiment, deleteBatiment, restoreBatiment, refetchBatiments, importBatiments } = useData();
  const [selectedBatiment, setSelectedBatiment] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sallesFilter, setSallesFilter] = useState<string>("all");

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

  // Préparer les données pour le tableau - DOIT être avant tout return conditionnel
  const tableData = useMemo(() => {
    let data = batiments.map((batiment) => {
      const nombreSalles = (batiment as any).salles_count ?? sallesCountByBatiment[batiment.id] ?? 0;
      const isDeleted = (batiment as any).deleted_at !== null && (batiment as any).deleted_at !== undefined;
      return {
        id: batiment.id,
        Nom: batiment.nom,
        Description: batiment.description || '-',
        "Nombre de Salles": nombreSalles,
        "Status": isDeleted ? "Supprimé" : "Actif",
      };
    });

    // Appliquer le filtre de status
    if (statusFilter !== "all") {
      data = data.filter((item) => item.Status === statusFilter);
    }

    // Appliquer le filtre de nombre de salles
    if (sallesFilter !== "all") {
      if (sallesFilter === "0") {
        data = data.filter((item) => item["Nombre de Salles"] === 0);
      } else if (sallesFilter === "1-5") {
        data = data.filter((item) => item["Nombre de Salles"] >= 1 && item["Nombre de Salles"] <= 5);
      } else if (sallesFilter === "6+") {
        data = data.filter((item) => item["Nombre de Salles"] >= 6);
      }
    }

    return data;
  }, [batiments, sallesCountByBatiment, statusFilter, sallesFilter]);

  useEffect(() => {
    if (!isLoadingAuth && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, isLoadingAuth, navigate]);

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
      await updateBatiment(updatedBatiment.id, {
        nom: updatedBatiment.nom,
        description: updatedBatiment.description,
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

  // Préparer les données pour les modals (format attendu)
  const formatBatimentForModal = (batiment: any) => {
    if (!batiment) return null;
    // Trouver le bâtiment original
    const originalBatiment = batiments.find(b => b.id === batiment.id) || batiment;
    const nombreSalles = (originalBatiment as any).salles_count ?? sallesCountByBatiment[originalBatiment.id] ?? 0;
    return {
      id: originalBatiment.id,
      nom: originalBatiment.nom,
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
          title="Gestion des Bâtiments"
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
              columns={["Nom", "Description", "Nombre de Salles", "Status"]}
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
              customFilters={
                <>
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
