import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import AppShell from "@/components/layout/AppShell";
import DataTableEnhanced from "@/components/ui/data-table-enhanced";
import DetailsModal from "@/components/ui/details-modal";
import EditModal from "@/components/ui/edit-modal";
import AddArmoireForm from "@/components/forms/AddArmoireForm";
import { toast } from "@/hooks/use-toast";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const Armoires = () => {
  const { isAuthenticated, isLoading: isLoadingAuth } = useAuth();
  const navigate = useNavigate();
  const { coffrets, isLoadingCoffrets, addCoffret, updateCoffret, deleteCoffret, refetchCoffrets } = useData();
  const [selectedCoffret, setSelectedCoffret] = useState<any>(null);
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

  const handleRowClick = (coffret: any) => {
    setSelectedCoffret(coffret);
    setIsDetailsOpen(true);
  };

  const handleEdit = (coffret: any) => {
    setSelectedCoffret(coffret);
    setIsEditOpen(true);
  };

  const handleSave = async (updatedCoffret: any) => {
    try {
      await updateCoffret(updatedCoffret.id, {
        nom: updatedCoffret.nom,
        piece: updatedCoffret.piece,
        long: updatedCoffret.long,
        lat: updatedCoffret.lat,
        batiment_id: updatedCoffret.batiment_id || undefined,
        salle_id: updatedCoffret.salle_id || undefined,
        status: updatedCoffret.status,
      });
      toast({
        title: "Armoire mise à jour",
        description: "Les informations de l'armoire ont été enregistrées.",
      });
      setIsEditOpen(false);
      setSelectedCoffret(null);
      refetchCoffrets();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Une erreur est survenue lors de la mise à jour de l'armoire.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (coffretId: number) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette armoire ?")) {
      try {
        await deleteCoffret(coffretId);
        toast({
          title: "Armoire supprimée",
          description: "L'armoire a été supprimée avec succès.",
        });
        setIsDetailsOpen(false);
        setSelectedCoffret(null);
        refetchCoffrets();
      } catch (error: any) {
        toast({
          title: "Erreur",
          description: error.response?.data?.message || "Une erreur est survenue lors de la suppression de l'armoire.",
          variant: "destructive",
        });
      }
    }
  };

  // Préparer les données pour le tableau
  const tableData = coffrets.map((coffret) => ({
    id: coffret.id,
    code: coffret.code,
    nom: coffret.nom,
    piece: coffret.piece,
    coordonnees: coffret.lat && coffret.long ? `${coffret.lat}, ${coffret.long}` : "Non définies",
    status: coffret.status,
  }));

  // Préparer les données pour les modals (format attendu)
  const formatCoffretForModal = (coffret: any) => {
    if (!coffret) return null;
    return {
      id: coffret.id,
      code: coffret.code,
      nom: coffret.nom,
      piece: coffret.piece,
      long: coffret.long || 0,
      lat: coffret.lat || 0,
      batiment_id: coffret.batiment_id,
      salle_id: coffret.salle_id,
      status: coffret.status,
    };
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Gestion des Armoires</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Configuration et gestion des armoires réseau (coffrets)
            </p>
          </div>
          <AddArmoireForm />
        </div>

        {isLoadingCoffrets ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <DataTableEnhanced
              title={`${coffrets.length} armoire${coffrets.length > 1 ? 's' : ''} configurée${coffrets.length > 1 ? 's' : ''}`}
              columns={["code", "nom", "piece", "coordonnees", "status"]}
              data={tableData}
              onRowClick={handleRowClick}
              onEdit={handleEdit}
              renderRowActions={(row) => (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(row.id);
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            />

            <DetailsModal
              open={isDetailsOpen}
              onOpenChange={setIsDetailsOpen}
              title="Détails de l'armoire"
              data={formatCoffretForModal(selectedCoffret)}
              onEdit={() => {
                setIsDetailsOpen(false);
                setIsEditOpen(true);
              }}
            />

            <EditModal
              open={isEditOpen}
              onOpenChange={setIsEditOpen}
              title="Modifier l'armoire"
              data={formatCoffretForModal(selectedCoffret)}
              onSave={handleSave}
            />
          </>
        )}
      </div>
    </AppShell>
  );
};

export default Armoires;

