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
  const { coffrets, sites, zones, batiments, salles, isLoadingCoffrets, addCoffret, updateCoffret, deleteCoffret, refetchCoffrets } = useData();
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
      // Convertir les IDs en nombres valides
      const siteId = updatedCoffret.site_id ? Number(updatedCoffret.site_id) : undefined;
      const zoneId = updatedCoffret.zone_id ? Number(updatedCoffret.zone_id) : undefined;
      const batimentId = updatedCoffret.batiment_id ? Number(updatedCoffret.batiment_id) : undefined;
      const salleId = updatedCoffret.salle_id ? Number(updatedCoffret.salle_id) : undefined;
      
      // Si un fichier photo est présent, utiliser FormData
      if (updatedCoffret.photo && updatedCoffret.photo instanceof File) {
        const formData = new FormData();
        formData.append('nom', updatedCoffret.nom || '');
        if (updatedCoffret.piece) formData.append('piece', updatedCoffret.piece);
        if (updatedCoffret.emplacement) formData.append('emplacement', updatedCoffret.emplacement);
        if (typeof updatedCoffret.long === 'number') formData.append('long', String(updatedCoffret.long));
        if (typeof updatedCoffret.lat === 'number') formData.append('lat', String(updatedCoffret.lat));
        if (siteId) formData.append('site_id', String(siteId));
        if (zoneId) formData.append('zone_id', String(zoneId));
        if (batimentId) formData.append('batiment_id', String(batimentId));
        if (salleId) formData.append('salle_id', String(salleId));
        if (updatedCoffret.status) formData.append('status', updatedCoffret.status);
        if (updatedCoffret.modele) formData.append('modele', updatedCoffret.modele);
        formData.append('photo', updatedCoffret.photo);
        
        await updateCoffret(updatedCoffret.id, formData as any);
      } else {
        const updateData: any = {
          nom: updatedCoffret.nom,
        };
        
        if (updatedCoffret.piece) updateData.piece = updatedCoffret.piece;
        if (updatedCoffret.emplacement) updateData.emplacement = updatedCoffret.emplacement;
        if (typeof updatedCoffret.long === 'number') updateData.long = updatedCoffret.long;
        if (typeof updatedCoffret.lat === 'number') updateData.lat = updatedCoffret.lat;
        if (siteId) updateData.site_id = siteId;
        if (zoneId) updateData.zone_id = zoneId;
        if (batimentId) updateData.batiment_id = batimentId;
        if (salleId) updateData.salle_id = salleId;
        if (updatedCoffret.status) updateData.status = updatedCoffret.status;
        if (updatedCoffret.modele) updateData.modele = updatedCoffret.modele;
        
        await updateCoffret(updatedCoffret.id, updateData);
      }
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
    modele: coffret.modele || "—",
    photo: coffret.photo ? "Oui" : "Non",
    piece: coffret.piece,
    site: coffret.site?.libelle || (coffret.site_id ? `#${coffret.site_id}` : "—"),
    zone: coffret.zone?.libelle || (coffret.zone_id ? `#${coffret.zone_id}` : "—"),
    emplacement: coffret.emplacement || "—",
    coordonnees: coffret.lat && coffret.long ? `${coffret.lat}, ${coffret.long}` : "Non définies",
    status: coffret.status,
  }));

  // Préparer les données pour les modals (format attendu)
  const formatCoffretForModal = (coffret: any) => {
    if (!coffret) return null;
    // Trouver le coffret original dans la liste pour avoir les IDs
    const originalCoffret = coffrets.find(c => c.id === coffret.id) || coffret;
    const site = sites.find(s => s.id === originalCoffret.site_id);
    const zone = zones.find(z => z.id === originalCoffret.zone_id);
    const batiment = batiments.find(b => b.id === originalCoffret.batiment_id);
    const salle = salles.find(s => s.id === originalCoffret.salle_id);
    return {
      id: originalCoffret.id,
      code: originalCoffret.code,
      nom: originalCoffret.nom,
      modele: originalCoffret.modele || "",
      photo: originalCoffret.photo || "",
      photo_url: originalCoffret.photo_url || null,
      piece: originalCoffret.piece,
      emplacement: originalCoffret.emplacement || "",
      long: originalCoffret.long || 0,
      lat: originalCoffret.lat || 0,
      site: site?.libelle || null,
      zone: zone?.libelle || null,
      batiment: batiment?.nom || null,
      salle: salle?.nom || null,
      site_id: originalCoffret.site_id,
      zone_id: originalCoffret.zone_id,
      batiment_id: originalCoffret.batiment_id,
      salle_id: originalCoffret.salle_id,
      status: originalCoffret.status,
      qr_code: originalCoffret.qr_code || null,
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
              columns={["code", "nom", "modele", "photo", "site", "zone", "piece", "emplacement", "coordonnees", "status"]}
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
              className="w-[95vw] sm:max-w-none sm:w-[1200px] max-h-[70vh] overflow-y-auto"
              fields={[
                { key: 'nom', label: 'Nom', type: 'text' },
                { key: 'modele', label: 'Modèle', type: 'text' },
                { key: 'photo', label: 'Photo (Upload)', type: 'file' },
                { key: 'site_id', label: 'Site', type: 'select', options: sites.map(s => s.id.toString()) },
                { key: 'zone_id', label: 'Zone', type: 'select', options: zones.map(z => z.id.toString()) },
                { key: 'batiment_id', label: 'Bâtiment', type: 'select', options: batiments.map(b => b.id.toString()) },
                { key: 'salle_id', label: 'Salle', type: 'select', options: salles.map(s => s.id.toString()) },
                { key: 'emplacement', label: 'Emplacement détaillé', type: 'text' },
                { key: 'long', label: 'Longitude', type: 'number' },
                { key: 'lat', label: 'Latitude', type: 'number' },
                { key: 'status', label: 'Statut', type: 'select', options: ['active', 'inactive'] },
              ]}
            />
          </>
        )}
      </div>
    </AppShell>
  );
};

export default Armoires;

