import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import AppShell from "@/components/layout/AppShell";
import DataTableEnhanced from "@/components/ui/data-table-enhanced";
import DetailsModal from "@/components/ui/details-modal";
import EditModal from "@/components/ui/edit-modal";
import AddZoneForm from "@/components/forms/AddZoneForm";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const Zones = () => {
  const { isAuthenticated, isLoading: isLoadingAuth } = useAuth();
  const navigate = useNavigate();
  const { zones, sites, isLoadingZones, addZone, updateZone, deleteZone } = useData();
  const [selectedZone, setSelectedZone] = useState<any>(null);
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

  const siteIdToLabel = useMemo(() => {
    const m = new Map<number, string>();
    sites.forEach(s => m.set(s.id, s.libelle));
    return m;
  }, [sites]);

  const handleRowClick = (zone: any) => {
    setSelectedZone(zone);
    setIsDetailsOpen(true);
  };

  const handleEdit = (zone: any) => {
    setSelectedZone(zone);
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
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour de la zone.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (zoneId: number) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette zone ?")) {
      try {
        await deleteZone(zoneId);
        toast({
          title: "Zone supprimée",
          description: "La zone a été supprimée avec succès.",
        });
        setIsDetailsOpen(false);
        setSelectedZone(null);
      } catch (error) {
        toast({
          title: "Erreur",
          description: "Une erreur est survenue lors de la suppression de la zone.",
          variant: "destructive",
        });
      }
    }
  };

  // Préparer les données pour le tableau
  const tableData = zones.map((zone) => ({
    id: zone.id,
    site: siteIdToLabel.get(zone.site_id) || zone.site?.libelle || `#${zone.site_id}`,
    libelle: zone.libelle,
    description: zone.description || "Aucune description",
    dateCreation: zone.created_at ? new Date(zone.created_at).toLocaleDateString('fr-FR') : "N/A",
  }));

  // Préparer les données pour les modals (format attendu)
  const formatZoneForModal = (zone: any) => {
    if (!zone) return null;
    return {
      id: zone.id,
      site_id: zone.site_id,
      libelle: zone.libelle,
      description: zone.description || "",
      created_at: zone.created_at || "",
      updated_at: zone.updated_at || "",
    };
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Gestion des Zones</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Configuration et gestion des zones par site
            </p>
          </div>
          <AddZoneForm />
        </div>

        {isLoadingZones ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <DataTableEnhanced
              title={`${zones.length} zone${zones.length > 1 ? 's' : ''} configurée${zones.length > 1 ? 's' : ''}`}
              columns={["site", "libelle", "description", "dateCreation"]}
              data={tableData}
              onRowClick={handleRowClick}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />

            <DetailsModal
              open={isDetailsOpen}
              onOpenChange={setIsDetailsOpen}
              title="Détails de la zone"
              data={formatZoneForModal(selectedZone)}
              onEdit={() => {
                setIsDetailsOpen(false);
                setIsEditOpen(true);
              }}
              onDelete={selectedZone ? () => handleDelete(selectedZone.id) : undefined}
            />

            <EditModal
              open={isEditOpen}
              onOpenChange={setIsEditOpen}
              title="Modifier la zone"
              data={formatZoneForModal(selectedZone)}
              onSave={handleSave}
              fields={[
                { key: "site_id", label: "Site ID", type: "number" },
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

export default Zones;



