import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/ui/page-header";
import DataTableEnhanced from "@/components/ui/data-table-enhanced";
import DetailsModal from "@/components/ui/details-modal";
import EditModal from "@/components/ui/edit-modal";
import AddArmoireForm from "@/components/forms/AddArmoireForm";
import QRCodeModal from "@/components/ui/qr-code-modal";
import { toast } from "@/hooks/use-toast";
import { Loader2, X, Server, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
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

const Armoires = () => {
  const { isAuthenticated, isLoading: isLoadingAuth } = useAuth();
  const navigate = useNavigate();
  const { coffrets, sites, zones, batiments, salles, isLoadingCoffrets, updateCoffret, deleteCoffret, restoreCoffret, importCoffrets, refetchCoffrets } = useData();
  const [selectedCoffret, setSelectedCoffret] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedSalle, setSelectedSalle] = useState<any>(null);
  const [isSalleDetailsOpen, setIsSalleDetailsOpen] = useState(false);
  const [isQRCodeOpen, setIsQRCodeOpen] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<{ qrCode: string; title: string; subtitle: string; code: string } | null>(null);

  // Filtres par bâtiment, salle et status
  const [selectedBatimentId, setSelectedBatimentId] = useState<string>("");
  const [selectedSalleId, setSelectedSalleId] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Salles filtrées par bâtiment sélectionné
  const filteredSalles = useMemo(() => {
    if (!selectedBatimentId) return salles;
    return salles.filter(s => s.batiment_id === parseInt(selectedBatimentId));
  }, [salles, selectedBatimentId]);

  // Filtrer les coffrets par bâtiment, salle et status (déplacé avant les retours conditionnels)
  const filteredCoffrets = useMemo(() => {
    let filtered = coffrets;

    if (selectedBatimentId) {
      filtered = filtered.filter(c => c.batiment_id === parseInt(selectedBatimentId));
    }

    if (selectedSalleId) {
      filtered = filtered.filter(c => c.salle_id === parseInt(selectedSalleId));
    }

    // Appliquer le filtre de status (Actif/Supprimé)
    if (statusFilter !== "all") {
      if (statusFilter === "Supprimé") {
        filtered = filtered.filter(c => (c as any).deleted_at !== null && (c as any).deleted_at !== undefined);
      } else if (statusFilter === "Actif") {
        filtered = filtered.filter(c => (c as any).deleted_at === null || (c as any).deleted_at === undefined);
      }
    }

    return filtered;
  }, [coffrets, selectedBatimentId, selectedSalleId, statusFilter]);

  // Réinitialiser la salle si le bâtiment change
  useEffect(() => {
    if (selectedBatimentId && selectedSalleId) {
      const salleExists = filteredSalles.some(s => s.id === parseInt(selectedSalleId));
      if (!salleExists) {
        setSelectedSalleId("");
      }
    }
  }, [selectedBatimentId, filteredSalles, selectedSalleId]);

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
      const salleId = typeof updatedCoffret.salle_id === 'string'
        ? parseInt(updatedCoffret.salle_id, 10)
        : updatedCoffret.salle_id;
      // Trouver le batiment_id à partir de la salle
      const salle = salles.find(s => s.id === salleId);
      await updateCoffret(updatedCoffret.id, {
        nom: updatedCoffret.nom,
        code: updatedCoffret.code,
        piece: updatedCoffret.piece,
        long: updatedCoffret.long || undefined,
        lat: updatedCoffret.lat || undefined,
        batiment_id: salle?.batiment_id || updatedCoffret.batiment_id || undefined,
        salle_id: salleId || undefined,
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
    try {
      await deleteCoffret(coffretId);
      refetchCoffrets();
      toast({
        title: "Armoire supprimée",
        description: "L'armoire a été supprimée avec succès.",
      });
      setIsDetailsOpen(false);
      setSelectedCoffret(null);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Une erreur est survenue lors de la suppression de l'armoire.",
        variant: "destructive",
      });
    }
  };

  const handleRestore = async (coffretId: number) => {
    try {
      await restoreCoffret(coffretId);
      refetchCoffrets();
      toast({
        title: "Armoire restaurée",
        description: "L'armoire a été restaurée avec succès.",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Une erreur est survenue lors de la restauration de l'armoire.",
        variant: "destructive",
      });
    }
  };

  const handleImport = async (file: File) => {
    try {
      const result = await importCoffrets(file);
      toast({
        title: "Import terminé",
        description: `${result.created} créée(s), ${result.updated} mise(s) à jour.${result.errors.length > 0 ? ` ${result.errors.length} erreur(s).` : ''}`,
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Une erreur est survenue lors de l'import.",
        variant: "destructive",
      });
    }
  };

  // Préparer les données pour le tableau
  const tableData = filteredCoffrets.map((coffret) => {
    const batiment = batiments.find(b => b.id === coffret.batiment_id);
    const salle = salles.find(s => s.id === coffret.salle_id);
    const isDeleted = (coffret as any).deleted_at !== null && (coffret as any).deleted_at !== undefined;
    return {
      id: coffret.id,
      Code: coffret.code,
      Nom: coffret.nom,
      Bâtiment: batiment?.nom || "-",
      Salle: salle?.nom || "-",
      salle_id: coffret.salle_id,
      batiment_id: coffret.batiment_id,
      Équipements: coffret.equipements?.length || 0,
      Status: isDeleted ? "Supprimé" : "Actif",
    };
  });

  // Réinitialiser les filtres
  const clearFilters = () => {
    setSelectedBatimentId("");
    setSelectedSalleId("");
    setStatusFilter("all");
  };

  const hasActiveFilters = selectedBatimentId || selectedSalleId || statusFilter !== "all";

  // Formater les données de la salle pour le modal
  const formatSalleForModal = (salleId: number) => {
    const salle = salles.find(s => s.id === salleId);
    if (!salle) return null;
    const batiment = batiments.find(b => b.id === salle.batiment_id);
    return {
      id: salle.id,
      nom: salle.nom,
      batiment: batiment?.nom || "-",
      etage: salle.etage,
      capacite: salle.capacite,
      type: salle.type,
      description: salle.description || "",
    };
  };

  // Rendu personnalisé pour la colonne Code avec lien vers la vue détaillée
  const renderCodeCell = (value: string, row: any) => {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className="cursor-pointer text-primary hover:underline font-medium"
              onClick={(e) => {
                e.stopPropagation();
                // Rediriger directement vers ArmoiresSection avec la vue détaillée
                localStorage.setItem('selectedCoffretId', row.id.toString());
                localStorage.setItem('returnToArmoires', 'true');
                navigate('/armoires-detail');
              }}
            >
              {value}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>Cliquez pour voir les détails et composants de l'armoire</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  // Rendu personnalisé pour la colonne Salle avec lien vers le modal
  const renderSalleCell = (value: string, row: any) => {
    if (value === '-') return value;
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className="cursor-pointer text-primary hover:underline"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedSalle(formatSalleForModal(row.salle_id));
                setIsSalleDetailsOpen(true);
              }}
            >
              {value}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>Cliquez pour voir les détails de la salle</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  // Rendu pour la colonne Équipements (sans lien)
  const renderEquipementsCell = (value: number) => {
    return (
      <span className="font-medium">
        {value} équipement{value !== 1 ? 's' : ''}
      </span>
    );
  };

  // Fonction pour ouvrir le modal QR Code depuis les actions du tableau
  const handleOpenQRCode = (row: any) => {
    const originalCoffret = coffrets.find(c => c.id === row.id);
    if (originalCoffret?.qr_code) {
      const batiment = batiments.find(b => b.id === originalCoffret.batiment_id);
      const salle = salles.find(s => s.id === originalCoffret.salle_id);
      setQrCodeData({
        qrCode: originalCoffret.qr_code,
        title: originalCoffret.nom || originalCoffret.code,
        subtitle: batiment?.nom || salle?.nom || originalCoffret.piece || '',
        code: originalCoffret.code
      });
      setIsQRCodeOpen(true);
    }
  };

  // Rendu des actions personnalisées (bouton QR Code)
  const renderRowActions = (row: any) => {
    const originalCoffret = coffrets.find(c => c.id === row.id);
    const hasQRCode = originalCoffret?.qr_code;

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenQRCode(row);
              }}
              disabled={!hasQRCode}
              className={hasQRCode ? "text-primary hover:text-primary" : "text-muted-foreground"}
            >
              <QrCode className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{hasQRCode ? "Télécharger le QR Code" : "QR Code non disponible"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

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
      emplacement: originalCoffret.emplacement || "",
      piece: originalCoffret.piece,
      qr_code: originalCoffret.qr_code || null,
      long: originalCoffret.long || 0,
      lat: originalCoffret.lat || 0,
      site: site ? { libelle: site.libelle } : null,
      zone: zone ? { libelle: zone.libelle } : null,
      batiment: batiment ? { nom: batiment.nom } : null,
      salle: salle ? { nom: salle.nom } : null,
      batiment_id: originalCoffret.batiment_id,
      salle_id: originalCoffret.salle_id,
      status: originalCoffret.status,
    };
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Gestion des Armoires"
          description="Configuration et gestion des armoires réseau (coffrets)"
          icon={<Server className="h-6 w-6 text-primary" />}
          breadcrumbs={[
            { label: "Tableau de bord", href: "/" },
            { label: "Armoires" },
          ]}
          actions={<AddArmoireForm />}
        />

        {isLoadingCoffrets ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <DataTableEnhanced
              title={`${filteredCoffrets.length} armoire${filteredCoffrets.length > 1 ? 's' : ''} configurée${filteredCoffrets.length > 1 ? 's' : ''}`}
              columns={["Code", "Nom", "Salle", "Équipements", "Status"]}
              data={tableData}
              onRowClick={handleRowClick}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onRestore={handleRestore}
              onImport={handleImport}
              enableImport={true}
              importModalTitle="Importer des armoires"
              importTemplateColumns={["nom", "batiment", "salle", "piece", "status"]}
              importTemplateFileName="modele_armoires.csv"
              deleteConfirmTitle="Supprimer l'armoire"
              deleteConfirmDescription="Êtes-vous sûr de vouloir supprimer cette armoire ? Cette action est irréversible."
              restoreConfirmTitle="Restaurer l'armoire"
              restoreConfirmDescription="Êtes-vous sûr de vouloir restaurer cette armoire ?"
              customCellRenderers={{
                "Code": renderCodeCell,
                "Salle": renderSalleCell,
                "Équipements": renderEquipementsCell,
              }}
              renderRowActions={renderRowActions}
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
                    <Select value={selectedBatimentId} onValueChange={setSelectedBatimentId}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Tous" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous</SelectItem>
                        {batiments.filter(b => !(b as any).deleted_at).map((batiment) => (
                          <SelectItem key={batiment.id} value={batiment.id.toString()}>
                            {batiment.nom}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">Salle:</span>
                    <Select value={selectedSalleId} onValueChange={setSelectedSalleId}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Toutes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes</SelectItem>
                        {filteredSalles.filter(s => !(s as any).deleted_at).map((salle) => (
                          <SelectItem key={salle.id} value={salle.id.toString()}>
                            {salle.nom}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                      <X className="h-4 w-4 mr-1" />
                      Effacer
                    </Button>
                  )}
                </>
              }
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
              onDelete={selectedCoffret ? () => handleDelete(selectedCoffret.id) : undefined}
            />

            <EditModal
              open={isEditOpen}
              onOpenChange={setIsEditOpen}
              title="Modifier l'armoire"
              data={formatCoffretForModal(selectedCoffret)}
              onSave={handleSave}
              fields={[
                { key: "nom", label: "Nom", type: "text" },
                { key: "code", label: "Code", type: "text" },
                {
                  key: "salle_id",
                  label: "Salle",
                  type: "select",
                  options: salles.filter(s => !(s as any).deleted_at).map(s => ({ value: s.id.toString(), label: s.nom }))
                },
                { key: "piece", label: "Pièce", type: "text" },
                { key: "long", label: "Longitude", type: "number" },
                { key: "lat", label: "Latitude", type: "number" },
              ]}
            />

            {/* Modal de détails de la salle */}
            <DetailsModal
              open={isSalleDetailsOpen}
              onOpenChange={setIsSalleDetailsOpen}
              title="Détails de la salle"
              data={selectedSalle}
              onEdit={() => {
                setIsSalleDetailsOpen(false);
                navigate('/salles');
              }}
            />

            {/* Modal QR Code */}
            {qrCodeData && (
              <QRCodeModal
                open={isQRCodeOpen}
                onOpenChange={setIsQRCodeOpen}
                qrCode={qrCodeData.qrCode}
                title={qrCodeData.title}
                subtitle={qrCodeData.subtitle}
                type="coffret"
                code={qrCodeData.code}
              />
            )}
          </>
        )}
      </div>
    </AppShell>
  );
};

export default Armoires;

