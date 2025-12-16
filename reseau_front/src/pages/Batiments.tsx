import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import AppShell from "@/components/layout/AppShell";
import DataTableEnhanced from "@/components/ui/data-table-enhanced";
import DetailsModal from "@/components/ui/details-modal";
import EditModal from "@/components/ui/edit-modal";
import AddBatimentForm from "@/components/forms/AddBatimentForm";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const Batiments = () => {
  const { isAuthenticated, isLoading: isLoadingAuth } = useAuth();
  const navigate = useNavigate();
  const { batiments, isLoadingBatiments, addBatiment, updateBatiment, deleteBatiment } = useData();
  const [selectedBatiment, setSelectedBatiment] = useState<any>(null);
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
        adresse: updatedBatiment.adresse,
        ville: updatedBatiment.ville,
        code_postal: updatedBatiment.code_postal || updatedBatiment.codePostal,
        etat: updatedBatiment.etat,
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
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce bâtiment ?")) {
      try {
        await deleteBatiment(batimentId);
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
    }
  };

  // Préparer les données pour le tableau
  const tableData = batiments.map((batiment) => ({
    id: batiment.id,
    nom: batiment.nom,
    adresse: batiment.adresse,
    ville: batiment.ville,
    codePostal: batiment.code_postal,
    nombreSalles: batiment.nombre_salles ? `${batiment.nombre_salles} salles` : "0 salles",
    etat: batiment.etat,
  }));

  // Préparer les données pour les modals (format attendu)
  const formatBatimentForModal = (batiment: any) => {
    if (!batiment) return null;
    return {
      id: batiment.id,
      nom: batiment.nom,
      adresse: batiment.adresse,
      ville: batiment.ville,
      code_postal: batiment.code_postal || batiment.codePostal,
      etat: batiment.etat,
      description: batiment.description || "",
      nombre_salles: batiment.nombre_salles || batiment.nombreSalles || 0,
    };
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Gestion des Bâtiments</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Configuration et gestion des bâtiments de votre infrastructure
            </p>
          </div>
          <AddBatimentForm />
        </div>

        {isLoadingBatiments ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <DataTableEnhanced
              title={`${batiments.length} bâtiment${batiments.length > 1 ? 's' : ''} configuré${batiments.length > 1 ? 's' : ''}`}
              columns={["nom", "adresse", "ville", "codePostal", "nombreSalles", "etat"]}
              data={tableData}
              onRowClick={handleRowClick}
              onEdit={handleEdit}
              onDelete={handleDelete}
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
                { key: "adresse", label: "Adresse", type: "text" },
                { key: "ville", label: "Ville", type: "text" },
                { key: "code_postal", label: "Code postal", type: "text" },
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

export default Batiments;
