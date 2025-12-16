import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import AppShell from "@/components/layout/AppShell";
import DataTableEnhanced from "@/components/ui/data-table-enhanced";
import DetailsModal from "@/components/ui/details-modal";
import EditModal from "@/components/ui/edit-modal";
import AddLanForm from "@/components/forms/AddLanForm";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const Lans = () => {
  const { isAuthenticated, isLoading: isLoadingAuth } = useAuth();
  const navigate = useNavigate();
  const { lans, isLoadingLans, addLan, updateLan, deleteLan } = useData();
  const [selectedLan, setSelectedLan] = useState<any>(null);
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

  const handleRowClick = (lan: any) => {
    setSelectedLan(lan);
    setIsDetailsOpen(true);
  };

  const handleEdit = (lan: any) => {
    setSelectedLan(lan);
    setIsEditOpen(true);
  };

  const handleSave = async (updatedLan: any) => {
    try {
      await updateLan(updatedLan.id, {
        nom: updatedLan.nom,
        sous_reseau: updatedLan.sous_reseau || updatedLan.sousReseau,
        vlan: updatedLan.vlan,
        site: updatedLan.site,
        statut: updatedLan.statut,
        description: updatedLan.description,
        batiment_id: updatedLan.batiment_id,
        salle_id: updatedLan.salle_id,
      });
      toast({
        title: "LAN mis à jour",
        description: "Les informations du LAN ont été enregistrées.",
      });
      setIsEditOpen(false);
      setSelectedLan(null);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour du LAN.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (lanId: number) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce LAN ?")) {
      try {
        await deleteLan(lanId);
        toast({
          title: "LAN supprimé",
          description: "Le LAN a été supprimé avec succès.",
        });
        setIsDetailsOpen(false);
        setSelectedLan(null);
      } catch (error) {
        toast({
          title: "Erreur",
          description: "Une erreur est survenue lors de la suppression du LAN.",
          variant: "destructive",
        });
      }
    }
  };

  // Préparer les données pour le tableau
  const tableData = lans.map((lan) => ({
    id: lan.id,
    nom: lan.nom,
    sousReseau: lan.sous_reseau,
    vlan: lan.vlan,
    site: lan.site,
    batiment: lan.batiment?.nom || '-',
    salle: lan.salle?.nom || '-',
    statut: lan.statut,
    description: lan.description || "",
  }));

  // Préparer les données pour les modals (format attendu)
  const formatLanForModal = (lan: any) => {
    if (!lan) return null;
    return {
      id: lan.id,
      nom: lan.nom,
      sous_reseau: lan.sous_reseau || lan.sousReseau,
      vlan: lan.vlan,
      site: lan.site,
      statut: lan.statut,
      description: lan.description || "",
    };
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Gestion des LANs</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Inventaire et configuration des segments LAN de l'entreprise.
            </p>
          </div>
          <AddLanForm />
        </div>

        {isLoadingLans ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <DataTableEnhanced
              title={`${lans.length} LAN${lans.length > 1 ? 's' : ''} configuré${lans.length > 1 ? 's' : ''}`}
              columns={["nom", "sousReseau", "vlan", "batiment", "salle", "site", "statut"]}
              data={tableData}
              onRowClick={handleRowClick}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />

            <DetailsModal
              open={isDetailsOpen}
              onOpenChange={setIsDetailsOpen}
              title="Détails du LAN"
              data={formatLanForModal(selectedLan)}
              onEdit={() => {
                setIsDetailsOpen(false);
                setIsEditOpen(true);
              }}
              onDelete={selectedLan ? () => handleDelete(selectedLan.id) : undefined}
            />

            <EditModal
              open={isEditOpen}
              onOpenChange={setIsEditOpen}
              title="Modifier le LAN"
              data={formatLanForModal(selectedLan)}
              onSave={handleSave}
              fields={[
                { key: "nom", label: "Nom", type: "text" },
                { key: "sous_reseau", label: "Sous-réseau", type: "text" },
                { key: "vlan", label: "VLAN", type: "text" },
                { key: "site", label: "Site", type: "text" },
                { key: "statut", label: "Statut", type: "text" },
                { key: "description", label: "Description", type: "text" },
              ]}
            />
          </>
        )}
      </div>
    </AppShell>
  );
};

export default Lans;
