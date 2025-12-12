import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import AppShell from "@/components/layout/AppShell";
import DataTableEnhanced from "@/components/ui/data-table-enhanced";
import DetailsModal from "@/components/ui/details-modal";
import EditModal from "@/components/ui/edit-modal";
import AddSalleForm from "@/components/forms/AddSalleForm";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const Salles = () => {
  const { isAuthenticated, isLoading: isLoadingAuth } = useAuth();
  const navigate = useNavigate();
  const { salles, batiments, isLoadingSalles, addSalle, updateSalle, deleteSalle } = useData();
  const [selectedSalle, setSelectedSalle] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

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
      await updateSalle(updatedSalle.id, {
        nom: updatedSalle.nom,
        batiment_id: updatedSalle.batiment_id || (updatedSalle.batiment ? updatedSalle.batiment.id : null),
        etage: updatedSalle.etage,
        capacite: typeof updatedSalle.capacite === 'string' ? parseInt(updatedSalle.capacite, 10) : updatedSalle.capacite,
        type: updatedSalle.type,
        etat: updatedSalle.etat,
        description: updatedSalle.description,
      });
      toast({
        title: "Salle mise à jour",
        description: "Les informations de la salle ont été enregistrées.",
      });
      setIsEditOpen(false);
      setSelectedSalle(null);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour de la salle.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (salleId: number) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette salle ?")) {
      try {
        await deleteSalle(salleId);
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
    }
  };

  // Préparer les données pour le tableau
  const tableData = salles.map((salle) => {
    const batiment = batiments.find(b => b.id === salle.batiment_id);
    return {
      id: salle.id,
      nom: salle.nom,
      batiment: batiment?.nom || 'N/A',
      etage: salle.etage,
      capacite: `${salle.capacite} personnes`,
      type: salle.type,
      etat: salle.etat,
    };
  });

  // Préparer les données pour les modals (format attendu)
  const formatSalleForModal = (salle: any) => {
    if (!salle) return null;
    const batiment = batiments.find(b => b.id === salle.batiment_id);
    return {
      id: salle.id,
      nom: salle.nom,
      batiment_id: salle.batiment_id,
      batiment: batiment?.nom || 'N/A',
      etage: salle.etage,
      capacite: salle.capacite,
      type: salle.type,
      etat: salle.etat,
      description: salle.description || "",
    };
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Gestion des Salles</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Configuration et gestion des salles de vos bâtiments
            </p>
          </div>
          <AddSalleForm />
        </div>

        {isLoadingSalles ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <DataTableEnhanced
              title={`${salles.length} salle${salles.length > 1 ? 's' : ''} configurée${salles.length > 1 ? 's' : ''}`}
              columns={["nom", "batiment", "etage", "capacite", "type", "etat"]}
              data={tableData}
              onRowClick={handleRowClick}
              onEdit={handleEdit}
              onDelete={handleDelete}
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
                { key: "etage", label: "Étage", type: "text" },
                { key: "capacite", label: "Capacité", type: "number" },
                { key: "type", label: "Type", type: "text" },
                { key: "etat", label: "État", type: "text" },
                { key: "description", label: "Description", type: "text" },
              ]}
            />
          </>
        )}
      </div>
    </AppShell>
  );
};

export default Salles;
