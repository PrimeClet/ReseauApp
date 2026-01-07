import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import AppShell from "@/components/layout/AppShell";
import DataTableEnhanced from "@/components/ui/data-table-enhanced";
import DetailsModal from "@/components/ui/details-modal";
import EditModal from "@/components/ui/edit-modal";
import AddSiteForm from "@/components/forms/AddSiteForm";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const Sites = () => {
  const { isAuthenticated, isLoading: isLoadingAuth } = useAuth();
  const navigate = useNavigate();
  const { sites, isLoadingSites, addSite, updateSite, deleteSite } = useData();
  const [selectedSite, setSelectedSite] = useState<any>(null);
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

  const handleRowClick = (site: any) => {
    setSelectedSite(site);
    setIsDetailsOpen(true);
  };

  const handleEdit = (site: any) => {
    setSelectedSite(site);
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
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour du site.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (siteId: number) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce site ?")) {
      try {
        await deleteSite(siteId);
        toast({
          title: "Site supprimé",
          description: "Le site a été supprimé avec succès.",
        });
        setIsDetailsOpen(false);
        setSelectedSite(null);
      } catch (error) {
        toast({
          title: "Erreur",
          description: "Une erreur est survenue lors de la suppression du site.",
          variant: "destructive",
        });
      }
    }
  };

  // Préparer les données pour le tableau
  const tableData = sites.map((site) => ({
    id: site.id,
    libelle: site.libelle,
    description: site.description || "Aucune description",
    dateCreation: site.created_at ? new Date(site.created_at).toLocaleDateString('fr-FR') : "N/A",
  }));

  // Préparer les données pour les modals (format attendu)
  const formatSiteForModal = (site: any) => {
    if (!site) return null;
    return {
      id: site.id,
      libelle: site.libelle,
      description: site.description || "",
      created_at: site.created_at || "",
      updated_at: site.updated_at || "",
    };
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Gestion des Sites</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Configuration et gestion des sites de votre infrastructure
            </p>
          </div>
          <AddSiteForm />
        </div>

        {isLoadingSites ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <DataTableEnhanced
              title={`${sites.length} site${sites.length > 1 ? 's' : ''} configuré${sites.length > 1 ? 's' : ''}`}
              columns={["libelle", "description", "dateCreation"]}
              data={tableData}
              onRowClick={handleRowClick}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />

            <DetailsModal
              open={isDetailsOpen}
              onOpenChange={setIsDetailsOpen}
              title="Détails du site"
              data={formatSiteForModal(selectedSite)}
              onEdit={() => {
                setIsDetailsOpen(false);
                setIsEditOpen(true);
              }}
              onDelete={selectedSite ? () => handleDelete(selectedSite.id) : undefined}
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
          </>
        )}
      </div>
    </AppShell>
  );
};

export default Sites;


