import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import AppShell from "@/components/layout/AppShell";
import DataTableEnhanced from "@/components/ui/data-table-enhanced";
import DetailsModal from "@/components/ui/details-modal";
import EditModal from "@/components/ui/edit-modal";
import AddModificationForm from "@/components/forms/AddModificationForm";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const typeModificationLabels: Record<string, string> = {
  ajout_port: "Ajout d'un port",
  ajout_equipement: "Ajout d'un équipement",
  modification_connexion: "Modification d'une connexion",
  suppression_port: "Suppression d'un port",
  suppression_equipement: "Suppression d'un équipement",
  changement_statut_port: "Changement de statut d'un port",
};

const Modifications = () => {
  const { isAuthenticated, isLoading: isLoadingAuth } = useAuth();
  const navigate = useNavigate();
  const { 
    modifications, 
    isLoadingModifications, 
    addModification, 
    updateModification, 
    deleteModification 
  } = useData();
  const [selectedModification, setSelectedModification] = useState<any>(null);
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

  const handleRowClick = (modification: any) => {
    setSelectedModification(modification);
    setIsDetailsOpen(true);
  };

  const handleEdit = (modification: any) => {
    setSelectedModification(modification);
    setIsEditOpen(true);
  };

  const handleSave = async (updatedModification: any) => {
    try {
      const updateData: any = {
        coffret_id: updatedModification.coffret_id,
        port_id: updatedModification.port_id,
        equipement_id: updatedModification.equipement_id,
        type_modification: updatedModification.type_modification,
        description: updatedModification.description,
        raison: updatedModification.raison,
        date_intervention: updatedModification.date_intervention,
        heure_intervention: updatedModification.heure_intervention,
      };
      
      // Ajouter les photos seulement si elles sont des fichiers
      if (updatedModification.photo_avant instanceof File) {
        updateData.photo_avant = updatedModification.photo_avant;
      }
      if (updatedModification.photo_apres instanceof File) {
        updateData.photo_apres = updatedModification.photo_apres;
      }
      
      await updateModification(updatedModification.id, updateData);
      toast({
        title: "Demande de modification mise à jour",
        description: "Les informations de la demande de modification ont été enregistrées.",
      });
      setIsEditOpen(false);
      setSelectedModification(null);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour de la demande de modification.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (modificationId: number) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette demande de modification ?")) {
      try {
        await deleteModification(modificationId);
        toast({
        title: "Demande de modification supprimée",
        description: "La demande de modification a été supprimée avec succès.",
        });
        setIsDetailsOpen(false);
        setSelectedModification(null);
      } catch (error) {
        toast({
          title: "Erreur",
          description: "Une erreur est survenue lors de la suppression de la demande de modification.",
          variant: "destructive",
        });
      }
    }
  };

  const statutLabels: Record<string, string> = {
    en_attente: "En attente",
    approuvee: "Approuvée",
    rejetee: "Rejetée",
    en_revision: "En révision",
  };

  // Préparer les données pour le tableau
  const tableData = modifications.map((modification) => ({
    id: modification.id,
    type_modification: typeModificationLabels[modification.type_modification] || modification.type_modification,
    coffret: modification.coffret?.nom || `Coffret #${modification.coffret_id}`,
    user: modification.user?.full_name || 
          (modification.user?.name && modification.user?.surname 
            ? `${modification.user.name} ${modification.user.surname}` 
            : modification.user?.name || modification.user?.username) || 
          (modification.user_id ? `Utilisateur #${modification.user_id}` : "Non défini"),
    statut: statutLabels[modification.statut || 'en_attente'] || modification.statut || "En attente",
    date_intervention: modification.date_intervention 
      ? new Date(modification.date_intervention).toLocaleDateString('fr-FR') 
      : "N/A",
    heure_intervention: modification.heure_intervention || "N/A",
    description: modification.description?.substring(0, 50) + (modification.description?.length > 50 ? '...' : '') || "N/A",
  }));

  // Préparer les données pour les modals (format attendu)
  const formatModificationForModal = (modification: any) => {
    if (!modification) return null;
    return {
      id: modification.id,
      type_modification: modification.type_modification, // Garder la valeur originale pour l'édition
      type_modification_label: typeModificationLabels[modification.type_modification] || modification.type_modification,
      coffret_id: modification.coffret_id,
      coffret: modification.coffret?.nom 
        ? (modification.coffret?.code ? `${modification.coffret.nom} (${modification.coffret.code})` : modification.coffret.nom)
        : `Coffret #${modification.coffret_id}`,
      coffret_nom: modification.coffret?.nom || null,
      coffret_code: modification.coffret?.code || null,
      port_id: modification.port_id,
      port: modification.port?.port_label || modification.port_id ? `Port #${modification.port_id}` : "Aucun",
      equipement_id: modification.equipement_id,
      equipement: modification.equipement?.name || modification.equipement_id ? `Équipement #${modification.equipement_id}` : "Aucun",
      description: modification.description || "",
      raison: modification.raison || "",
      photo_avant_url: modification.photo_avant_url || modification.photo_avant || null,
      photo_apres_url: modification.photo_apres_url || modification.photo_apres || null,
      date_intervention: modification.date_intervention || "",
      heure_intervention: modification.heure_intervention || "",
      user: modification.user?.full_name || 
            (modification.user?.name && modification.user?.surname 
              ? `${modification.user.name} ${modification.user.surname}` 
              : modification.user?.name || modification.user?.username) || 
            (modification.user_id ? `Utilisateur #${modification.user_id}` : "Non défini"),
      statut: statutLabels[modification.statut || 'en_attente'] || modification.statut || "En attente",
      commentaire_validation: modification.commentaire_validation || null,
      validated_by: modification.validatedBy?.full_name || modification.validatedBy?.name || null,
      validated_at: modification.validated_at || null,
      created_at: modification.created_at || "",
      updated_at: modification.updated_at || "",
      // Informations de localisation depuis le coffret
      batiment: modification.coffret?.batiment,
      salle: modification.coffret?.salle,
      site: modification.coffret?.site,
      zone: modification.coffret?.zone,
    };
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Demande de modification</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Traçabilité des demandes de modification effectuées sur le réseau
            </p>
          </div>
          <AddModificationForm />
        </div>

        {isLoadingModifications ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <DataTableEnhanced
              title={`${modifications.length} demande${modifications.length > 1 ? 's' : ''} de modification enregistrée${modifications.length > 1 ? 's' : ''}`}
              columns={["type_modification", "coffret", "user", "statut", "date_intervention", "heure_intervention", "description"]}
              data={tableData}
              onRowClick={handleRowClick}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />

            <DetailsModal
              open={isDetailsOpen}
              onOpenChange={setIsDetailsOpen}
              title="Détails de la demande de modification"
              data={{
                ...formatModificationForModal(selectedModification),
                type_modification: formatModificationForModal(selectedModification)?.type_modification_label || formatModificationForModal(selectedModification)?.type_modification
              }}
              onEdit={() => {
                setIsDetailsOpen(false);
                setIsEditOpen(true);
              }}
              onDelete={selectedModification ? () => handleDelete(selectedModification.id) : undefined}
            />

            <EditModal
              open={isEditOpen}
              onOpenChange={setIsEditOpen}
              title="Modifier la demande de modification"
              data={formatModificationForModal(selectedModification)}
              onSave={handleSave}
              fields={[
                { key: "description", label: "Description", type: "textarea" },
                { key: "raison", label: "Raison / Justification", type: "textarea" },
                { key: "date_intervention", label: "Date d'intervention", type: "date" },
                { key: "heure_intervention", label: "Heure d'intervention", type: "time" },
                { key: "photo_avant", label: "Photo avant (optionnel)", type: "file" },
                { key: "photo_apres", label: "Photo après (optionnel)", type: "file" },
              ]}
            />
          </>
        )}
      </div>
    </AppShell>
  );
};

export default Modifications;

