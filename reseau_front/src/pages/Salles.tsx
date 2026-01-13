import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/ui/page-header";
import DataTableEnhanced from "@/components/ui/data-table-enhanced";
import DetailsModal from "@/components/ui/details-modal";
import EditModal from "@/components/ui/edit-modal";
import AddSalleForm from "@/components/forms/AddSalleForm";
import { toast } from "@/hooks/use-toast";
import { Loader2, LayoutGrid } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const Salles = () => {
  const { isAuthenticated, isLoading: isLoadingAuth } = useAuth();
  const navigate = useNavigate();
  const { salles, batiments, isLoadingSalles, updateSalle, deleteSalle, restoreSalle, refetchSalles, importSalles } = useData();
  const [selectedSalle, setSelectedSalle] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedBatiment, setSelectedBatiment] = useState<any>(null);
  const [isBatimentDetailsOpen, setIsBatimentDetailsOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [batimentFilter, setBatimentFilter] = useState<string>("all");
  const [etageFilter, setEtageFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [capaciteFilter, setCapaciteFilter] = useState<string>("all");

  // Obtenir les valeurs uniques pour les filtres
  const uniqueEtages = useMemo(() => {
    const etages = new Set<string>();
    salles.forEach((salle) => {
      if (salle.etage) etages.add(salle.etage);
    });
    return Array.from(etages).sort();
  }, [salles]);

  const uniqueTypes = useMemo(() => {
    const types = new Set<string>();
    salles.forEach((salle) => {
      if (salle.type) types.add(salle.type);
    });
    return Array.from(types).sort();
  }, [salles]);

  // Préparer les données pour le tableau
  const tableData = useMemo(() => {
    let data = salles.map((salle) => {
      const batiment = batiments.find(b => b.id === salle.batiment_id);
      const isDeleted = (salle as any).deleted_at !== null && (salle as any).deleted_at !== undefined;
      return {
        id: salle.id,
        Nom: salle.nom,
        Bâtiment: batiment?.nom || 'N/A',
        batiment_id: salle.batiment_id,
        Étage: salle.etage,
        Capacité: salle.capacite,
        Type: salle.type,
        Status: isDeleted ? "Supprimé" : "Actif",
      };
    });

    // Appliquer le filtre de status
    if (statusFilter !== "all") {
      data = data.filter((item) => item.Status === statusFilter);
    }

    // Appliquer le filtre de bâtiment
    if (batimentFilter !== "all") {
      data = data.filter((item) => item.Bâtiment === batimentFilter);
    }

    // Appliquer le filtre d'étage
    if (etageFilter !== "all") {
      data = data.filter((item) => item.Étage === etageFilter);
    }

    // Appliquer le filtre de type
    if (typeFilter !== "all") {
      data = data.filter((item) => item.Type === typeFilter);
    }

    // Appliquer le filtre de capacité
    if (capaciteFilter !== "all") {
      if (capaciteFilter === "1-10") {
        data = data.filter((item) => item.Capacité >= 1 && item.Capacité <= 10);
      } else if (capaciteFilter === "11-30") {
        data = data.filter((item) => item.Capacité >= 11 && item.Capacité <= 30);
      } else if (capaciteFilter === "31+") {
        data = data.filter((item) => item.Capacité >= 31);
      }
    }

    return data;
  }, [salles, batiments, statusFilter, batimentFilter, etageFilter, typeFilter, capaciteFilter]);

  useEffect(() => {
    if (!isLoadingAuth && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, isLoadingAuth, navigate]);

  const handleRowClick = (salle: any) => {
    setSelectedSalle(salle);
    setIsDetailsOpen(true);
  };

  const handleEdit = (salle: any) => {
    setSelectedSalle(salle);
    setIsEditOpen(true);
  };

  const handleSave = async (updatedSalle: any) => {
    try {
      // Convertir batiment_id en nombre (peut être string depuis le select)
      let batimentId: number | undefined;
      if (updatedSalle.batiment_id !== undefined && updatedSalle.batiment_id !== null && updatedSalle.batiment_id !== '') {
        batimentId = typeof updatedSalle.batiment_id === 'string'
          ? parseInt(updatedSalle.batiment_id, 10)
          : updatedSalle.batiment_id;
      }

      // Convertir les autres champs numériques
      const etage = updatedSalle.etage !== undefined && updatedSalle.etage !== null && updatedSalle.etage !== ''
        ? (typeof updatedSalle.etage === 'string' ? parseInt(updatedSalle.etage, 10) : updatedSalle.etage)
        : 0;

      const capacite = updatedSalle.capacite !== undefined && updatedSalle.capacite !== null && updatedSalle.capacite !== ''
        ? (typeof updatedSalle.capacite === 'string' ? parseInt(updatedSalle.capacite, 10) : updatedSalle.capacite)
        : 0;

      const dataToSave = {
        nom: updatedSalle.nom,
        batiment_id: batimentId,
        etage: etage,
        capacite: capacite,
        type: updatedSalle.type,
        description: updatedSalle.description,
      };

      console.log('Saving salle with data:', dataToSave);

      await updateSalle(updatedSalle.id, dataToSave);
      await refetchSalles();

      toast({
        title: "Salle mise à jour",
        description: "Les informations de la salle ont été enregistrées.",
      });
      setIsEditOpen(false);
      setSelectedSalle(null);
    } catch (error) {
      console.error('Error saving salle:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour de la salle.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (salleId: number) => {
    try {
      await deleteSalle(salleId);
      refetchSalles();
      toast({
        title: "Salle supprimée",
        description: "La salle a été supprimée avec succès.",
      });
      setIsDetailsOpen(false);
      setSelectedSalle(null);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression de la salle.",
        variant: "destructive",
      });
    }
  };

  const handleRestore = async (salleId: number) => {
    try {
      await restoreSalle(salleId);
      refetchSalles();
      toast({
        title: "Salle restaurée",
        description: "La salle a été restaurée avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la restauration de la salle.",
        variant: "destructive",
      });
    }
  };

  const handleImport = async (file: File) => {
    try {
      const result = await importSalles(file);
      toast({
        title: "Import terminé",
        description: `${result.created} créée(s), ${result.updated} mise(s) à jour.${result.errors.length > 0 ? ` ${result.errors.length} erreur(s).` : ''}`,
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
  const formatSalleForModal = (salle: any) => {
    if (!salle) return null;
    // Trouver la salle originale dans la liste pour avoir tous les champs
    const originalSalle = salles.find(s => s.id === salle.id) || salle;
    const batiment = batiments.find(b => b.id === originalSalle.batiment_id);
    return {
      id: originalSalle.id,
      nom: originalSalle.nom,
      batiment: batiment?.nom || null,
      batiment_id: originalSalle.batiment_id,
      etage: originalSalle.etage,
      capacite: originalSalle.capacite,
      type: originalSalle.type,
      etat: originalSalle.etat,
      description: originalSalle.description || "",
    };
  };

  // Formater les données du bâtiment pour le modal
  const formatBatimentForModal = (batimentId: number) => {
    const batiment = batiments.find(b => b.id === batimentId);
    if (!batiment) return null;
    const sallesCount = salles.filter(s => s.batiment_id === batimentId && !(s as any).deleted_at).length;
    return {
      id: batiment.id,
      nom: batiment.nom,
      description: batiment.description || "",
      nombre_salles: sallesCount,
    };
  };

  // Rendu personnalisé pour la colonne Bâtiment avec lien vers le modal
  const renderBatimentCell = (value: string, row: any) => {
    if (value === 'N/A') return value;
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className="cursor-pointer text-primary hover:underline"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedBatiment(formatBatimentForModal(row.batiment_id));
                setIsBatimentDetailsOpen(true);
              }}
            >
              {value}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>Cliquez pour voir les détails du bâtiment</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
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
          title="Gestion des Salles"
          description="Configuration et gestion des salles de vos bâtiments"
          icon={<LayoutGrid className="h-6 w-6 text-primary" />}
          breadcrumbs={[
            { label: "Tableau de bord", href: "/" },
            { label: "Salles" },
          ]}
          actions={<AddSalleForm />}
        />

        {isLoadingSalles ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <DataTableEnhanced
              title={`${tableData.length} salle${tableData.length > 1 ? 's' : ''} configurée${tableData.length > 1 ? 's' : ''}`}
              columns={["Nom", "Bâtiment", "Étage", "Capacité", "Type", "Status"]}
              data={tableData}
              onRowClick={handleRowClick}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onRestore={handleRestore}
              onImport={handleImport}
              enableImport={true}
              importModalTitle="Importer des salles"
              importTemplateColumns={["nom", "batiment", "etage", "capacite", "type", "description"]}
              importTemplateFileName="modele_salles.csv"
              deleteConfirmTitle="Supprimer la salle"
              deleteConfirmDescription="Êtes-vous sûr de vouloir supprimer cette salle ? Cette action est irréversible."
              restoreConfirmTitle="Restaurer la salle"
              restoreConfirmDescription="Êtes-vous sûr de vouloir restaurer cette salle ?"
              customCellRenderers={{
                "Bâtiment": renderBatimentCell,
              }}
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
                    <span className="text-sm text-muted-foreground whitespace-nowrap">Bâtiment:</span>
                    <Select value={batimentFilter} onValueChange={setBatimentFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Tous" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous</SelectItem>
                        {batiments.map((batiment) => (
                          <SelectItem key={batiment.id} value={batiment.nom}>
                            {batiment.nom}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">Étage:</span>
                    <Select value={etageFilter} onValueChange={setEtageFilter}>
                      <SelectTrigger className="w-24">
                        <SelectValue placeholder="Tous" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous</SelectItem>
                        {uniqueEtages.map((etage) => (
                          <SelectItem key={etage} value={etage}>
                            {etage}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">Type:</span>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger className="w-28">
                        <SelectValue placeholder="Tous" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous</SelectItem>
                        {uniqueTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">Capacité:</span>
                    <Select value={capaciteFilter} onValueChange={setCapaciteFilter}>
                      <SelectTrigger className="w-24">
                        <SelectValue placeholder="Toutes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes</SelectItem>
                        <SelectItem value="1-10">1-10</SelectItem>
                        <SelectItem value="11-30">11-30</SelectItem>
                        <SelectItem value="31+">31+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              }
            />

            <DetailsModal
              open={isDetailsOpen}
              onOpenChange={setIsDetailsOpen}
              title="Détails de la salle"
              data={formatSalleForModal(selectedSalle)}
              onEdit={() => {
                setIsDetailsOpen(false);
                setIsEditOpen(true);
              }}
              onDelete={selectedSalle ? () => handleDelete(selectedSalle.id) : undefined}
            />

            <EditModal
              open={isEditOpen}
              onOpenChange={setIsEditOpen}
              title="Modifier la salle"
              data={formatSalleForModal(selectedSalle)}
              onSave={handleSave}
              fields={[
                { key: "nom", label: "Nom", type: "text" },
                {
                  key: "batiment_id",
                  label: "Bâtiment",
                  type: "select",
                  options: batiments.map(b => ({ value: b.id.toString(), label: b.nom }))
                },
                { key: "etage", label: "Étage", type: "number" },
                { key: "capacite", label: "Capacité", type: "number" },
                {
                  key: "type",
                  label: "Type",
                  type: "select",
                  options: [
                    { value: "Bureau", label: "Bureau" },
                    { value: "Réunion", label: "Réunion" },
                    { value: "Formation", label: "Formation" },
                    { value: "Stockage", label: "Stockage" },
                    { value: "Technique", label: "Technique" },
                    { value: "Autre", label: "Autre" },
                  ]
                },
                { key: "description", label: "Description", type: "textarea" },
              ]}
            />

            {/* Modal de détails du bâtiment */}
            <DetailsModal
              open={isBatimentDetailsOpen}
              onOpenChange={setIsBatimentDetailsOpen}
              title="Détails du bâtiment"
              data={selectedBatiment}
              onEdit={() => {
                setIsBatimentDetailsOpen(false);
                navigate('/batiments');
              }}
            />
          </>
        )}
      </div>
    </AppShell>
  );
};

export default Salles;
