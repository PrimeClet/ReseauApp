import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useData } from "@/contexts/DataContext";
import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/ui/page-header";
import DataTableEnhanced from "@/components/ui/data-table-enhanced";
import DetailsModal from "@/components/ui/details-modal";
import EditModal from "@/components/ui/edit-modal";
import AddEquipmentForm from "@/components/forms/AddEquipmentForm";
import { toast } from "@/hooks/use-toast";
import { Loader2, Router, Server, Shield, Wifi, Box, QrCode, ExternalLink, Printer, Laptop, Monitor, Tag, Hash, Archive, Factory, BarCode3, Network, Globe, Layers, ToggleLeft, Settings2, FileText, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import QRCodeModal from "@/components/ui/qr-code-modal";
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

// Mapping des types d'équipements vers les icônes avec couleurs subtiles
const typeIcons: Record<string, { icon: React.ReactNode; label: string; bgClass: string; textClass: string }> = {
  switch: {
    icon: <Router className="h-3.5 w-3.5" />,
    label: "Switch",
    bgClass: "bg-blue-50 dark:bg-blue-950/50",
    textClass: "text-blue-700 dark:text-blue-400"
  },
  routeur: {
    icon: <Router className="h-3.5 w-3.5" />,
    label: "Routeur",
    bgClass: "bg-emerald-50 dark:bg-emerald-950/50",
    textClass: "text-emerald-700 dark:text-emerald-400"
  },
  firewall: {
    icon: <Shield className="h-3.5 w-3.5" />,
    label: "Firewall",
    bgClass: "bg-rose-50 dark:bg-rose-950/50",
    textClass: "text-rose-700 dark:text-rose-400"
  },
  "point-acces": {
    icon: <Wifi className="h-3.5 w-3.5" />,
    label: "Point d'accès",
    bgClass: "bg-violet-50 dark:bg-violet-950/50",
    textClass: "text-violet-700 dark:text-violet-400"
  },
  serveur: {
    icon: <Server className="h-3.5 w-3.5" />,
    label: "Serveur",
    bgClass: "bg-amber-50 dark:bg-amber-950/50",
    textClass: "text-amber-700 dark:text-amber-400"
  },
  imprimante: {
    icon: <Printer className="h-3.5 w-3.5" />,
    label: "Imprimante",
    bgClass: "bg-teal-50 dark:bg-teal-950/50",
    textClass: "text-teal-700 dark:text-teal-400"
  },
  "ordinateur-portable": {
    icon: <Laptop className="h-3.5 w-3.5" />,
    label: "Ordinateur portable",
    bgClass: "bg-indigo-50 dark:bg-indigo-950/50",
    textClass: "text-indigo-700 dark:text-indigo-400"
  },
  "ordinateur-bureau": {
    icon: <Monitor className="h-3.5 w-3.5" />,
    label: "Ordinateur de bureau",
    bgClass: "bg-cyan-50 dark:bg-cyan-950/50",
    textClass: "text-cyan-700 dark:text-cyan-400"
  },
  prise_murale: {
    icon: <Network className="h-3.5 w-3.5" />,
    label: "Prise murale",
    bgClass: "bg-orange-50 dark:bg-orange-950/50",
    textClass: "text-orange-700 dark:text-orange-400"
  },
  autre: {
    icon: <Box className="h-3.5 w-3.5" />,
    label: "Autre",
    bgClass: "bg-slate-100 dark:bg-slate-800",
    textClass: "text-slate-600 dark:text-slate-400"
  },
};

const Equipements = () => {
  const { isAuthenticated, isLoading: isLoadingAuth } = useRequireAuth();
  const navigate = useNavigate();
  const { equipements, coffrets, salles, isLoadingEquipements, updateEquipement, deleteEquipement, restoreEquipement, refetchEquipements, importEquipements } = useData();
  const [selectedEquipement, setSelectedEquipement] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedCoffret, setSelectedCoffret] = useState<any>(null);
  const [isCoffretDetailsOpen, setIsCoffretDetailsOpen] = useState(false);
  const [isQRCodeOpen, setIsQRCodeOpen] = useState(false);
  const [qrCodeEquipement, setQrCodeEquipement] = useState<any>(null);

  // Filtres
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [coffretFilter, setCoffretFilter] = useState<string>("all");

  // Obtenir les valeurs uniques pour les filtres
  const uniqueTypes = useMemo(() => {
    const types = new Set<string>();
    equipements.forEach((eq) => {
      if (eq.type) types.add(eq.type);
    });
    return Array.from(types).sort();
  }, [equipements]);

  // Préparer les données pour le tableau
  const tableData = useMemo(() => {
    let data = equipements.map((eq) => {
      const coffret = coffrets.find(c => c.id === eq.coffret_id);
      const isDeleted = (eq as any).deleted_at !== null && (eq as any).deleted_at !== undefined;
      const portsConfigures = eq.ports?.length || 0;
      const portsTotal = (eq as any).nombre_ports || 0;
      const portsLibres = Math.max(0, portsTotal - portsConfigures);
      return {
        id: eq.id,
        Nom: eq.name,
        Code: eq.equipement_code,
        Type: eq.type,
        Armoire: coffret?.nom || coffret?.code || '-',
        coffret_id: eq.coffret_id,
        IP: eq.ip_address || '-',
        VLAN: eq.vlan || '-',
        Ports: portsTotal > 0 ? `${portsConfigures}/${portsTotal}` : '-',
        portsConfigures,
        portsTotal,
        portsLibres,
        Status: isDeleted ? "Supprimé" : (eq.status === 'active' ? 'Actif' : eq.status === 'maintenance' ? 'Maintenance' : eq.status),
      };
    });

    // Appliquer le filtre de status
    if (statusFilter !== "all") {
      data = data.filter((item) => item.Status === statusFilter);
    }

    // Appliquer le filtre de type
    if (typeFilter !== "all") {
      data = data.filter((item) => item.Type === typeFilter);
    }

    // Appliquer le filtre d'armoire
    if (coffretFilter !== "all") {
      data = data.filter((item) => item.Armoire === coffretFilter);
    }

    return data;
  }, [equipements, coffrets, statusFilter, typeFilter, coffretFilter]);

  const handleRowClick = (equipement: any) => {
    // Trouver l'équipement original dans la liste pour avoir toutes les données
    const originalEquipement = equipements.find(eq => eq.id === equipement.id) || equipement;
    setSelectedEquipement(originalEquipement);
    setIsDetailsOpen(true);
  };

  const handleEdit = (equipement: any) => {
    // Trouver l'équipement original dans la liste pour avoir toutes les données
    const originalEquipement = equipements.find(eq => eq.id === equipement.id) || equipement;
    setSelectedEquipement(originalEquipement);
    setIsEditOpen(true);
  };

  const handleSave = async (updatedEquipement: any) => {
    try {
      // Convertir coffret_id en nombre si nécessaire
      let coffretId: number | undefined;
      if (updatedEquipement.coffret_id !== undefined && updatedEquipement.coffret_id !== null && updatedEquipement.coffret_id !== '') {
        coffretId = typeof updatedEquipement.coffret_id === 'string'
          ? parseInt(updatedEquipement.coffret_id, 10)
          : updatedEquipement.coffret_id;
      }

      // Convertir nombre_ports en nombre si nécessaire
      let nombrePorts: number | undefined;
      if (updatedEquipement.nombre_ports !== undefined && updatedEquipement.nombre_ports !== null && updatedEquipement.nombre_ports !== '') {
        nombrePorts = typeof updatedEquipement.nombre_ports === 'string'
          ? parseInt(updatedEquipement.nombre_ports, 10)
          : updatedEquipement.nombre_ports;
      }

      // Convertir is_manageable et is_principal en booléens
      const isManageable = updatedEquipement.is_manageable === 'true' || updatedEquipement.is_manageable === true;
      const isPrincipal = updatedEquipement.is_principal === 'true' || updatedEquipement.is_principal === true;

      const dataToSave = {
        name: updatedEquipement.name,
        type: updatedEquipement.type,
        modele: updatedEquipement.modele || undefined,
        fabricant: updatedEquipement.fabricant || undefined,
        numero_serie: updatedEquipement.numero_serie || undefined,
        type_reseau: updatedEquipement.type_reseau || undefined,
        ip_address: updatedEquipement.ip_address || undefined,
        mac_address: updatedEquipement.mac_address || undefined,
        vlan: updatedEquipement.vlan || undefined,
        status: updatedEquipement.status,
        description: updatedEquipement.description || undefined,
        coffret_id: coffretId,
        nombre_ports: nombrePorts,
        is_manageable: updatedEquipement.type === 'switch' ? isManageable : false,
        is_principal: updatedEquipement.type === 'switch' ? isPrincipal : false,
      };

      await updateEquipement(updatedEquipement.id, dataToSave);
      await refetchEquipements();

      toast({
        title: "Équipement mis à jour",
        description: "Les informations de l'équipement ont été enregistrées.",
      });
      setIsEditOpen(false);
      setSelectedEquipement(null);
    } catch (error) {
      console.error('Error saving equipement:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour de l'équipement.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (equipementId: number) => {
    try {
      await deleteEquipement(equipementId);
      refetchEquipements();
      toast({
        title: "Équipement supprimé",
        description: "L'équipement a été supprimé avec succès.",
      });
      setIsDetailsOpen(false);
      setSelectedEquipement(null);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression de l'équipement.",
        variant: "destructive",
      });
    }
  };

  const handleRestore = async (equipementId: number) => {
    try {
      await restoreEquipement(equipementId);
      refetchEquipements();
      toast({
        title: "Équipement restauré",
        description: "L'équipement a été restauré avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la restauration de l'équipement.",
        variant: "destructive",
      });
    }
  };

  const handleImport = async (file: File) => {
    try {
      const result = await importEquipements(file);
      toast({
        title: "Import terminé",
        description: `${result.created} créé(s), ${result.updated} mis à jour.${result.errors.length > 0 ? ` ${result.errors.length} erreur(s).` : ''}`,
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
  const formatEquipementForModal = (equipement: any) => {
    if (!equipement) return null;
    // Trouver l'équipement original dans la liste pour avoir tous les champs
    const originalEquipement = equipements.find(e => e.id === equipement.id) || equipement;
    const coffret = coffrets.find(c => c.id === originalEquipement.coffret_id);
    const portsConfigures = originalEquipement.ports?.length || 0;
    const portsTotal = originalEquipement.nombre_ports || 0;
    const portsLibres = Math.max(0, portsTotal - portsConfigures);
    return {
      id: originalEquipement.id,
      name: originalEquipement.name,
      equipement_code: originalEquipement.equipement_code,
      qr_code: originalEquipement.qr_code,
      type: originalEquipement.type,
      modele: originalEquipement.modele || "",
      fabricant: originalEquipement.fabricant || "",
      numero_serie: originalEquipement.numero_serie || "",
      type_reseau: originalEquipement.type_reseau || "IT",
      mac_address: originalEquipement.mac_address || "",
      is_manageable: originalEquipement.is_manageable || false,
      is_principal: originalEquipement.is_principal || false,
      armoire: coffret?.nom || coffret?.code || null,
      coffret: coffret ? { nom: coffret.nom, code: coffret.code } : null,
      coffret_id: originalEquipement.coffret_id,
      ip_address: originalEquipement.ip_address || "",
      vlan: originalEquipement.vlan || "",
      status: originalEquipement.status,
      description: originalEquipement.description || "",
      nombre_ports: portsTotal,
      ports_configures: portsConfigures,
      ports_libres: portsLibres,
    };
  };

  // Formater les données de l'armoire pour le modal
  const formatCoffretForModal = (coffretId: number) => {
    const coffret = coffrets.find(c => c.id === coffretId);
    if (!coffret) return null;
    const equipementsCount = equipements.filter(e => e.coffret_id === coffretId).length;
    return {
      id: coffret.id,
      code: coffret.code,
      nom: coffret.nom,
      qr_code: coffret.qr_code,
      nombre_equipements: equipementsCount,
    };
  };

  // Rendu personnalisé pour la colonne Nom (identifiant principal)
  const renderNomCell = (value: string) => {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100">
        {value}
      </span>
    );
  };

  // Rendu personnalisé pour la colonne Code avec lien vers les détails
  const renderCodeCell = (value: string) => {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer border border-primary/20"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/equipements/${value}/details`);
              }}
            >
              {value}
              <ExternalLink className="h-3 w-3" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Voir les détails et les ports</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  // Rendu personnalisé pour la colonne Type avec icône et badge
  const renderTypeCell = (value: string) => {
    const typeInfo = typeIcons[value] || typeIcons.autre;
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium ${typeInfo.bgClass} ${typeInfo.textClass}`}>
              {typeInfo.icon}
              {typeInfo.label}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>Type: {typeInfo.label}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  // Rendu personnalisé pour la colonne Armoire avec lien vers le modal
  const renderArmoireCell = (value: string, row: any) => {
    if (value === '-') {
      return <span className="text-muted-foreground text-xs">Non assigné</span>;
    }
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400 cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-950 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedCoffret(formatCoffretForModal(row.coffret_id));
                setIsCoffretDetailsOpen(true);
              }}
            >
              <Server className="h-3 w-3" />
              {value}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>Cliquez pour voir les détails de l'armoire</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  // Rendu personnalisé pour la colonne Status avec badge coloré
  const renderStatusCell = (value: string) => {
    let bgClass = "";
    let textClass = "";
    let icon = null;

    switch (value) {
      case "Actif":
        bgClass = "bg-emerald-50 dark:bg-emerald-950/50";
        textClass = "text-emerald-700 dark:text-emerald-400";
        icon = <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />;
        break;
      case "Maintenance":
        bgClass = "bg-amber-50 dark:bg-amber-950/50";
        textClass = "text-amber-700 dark:text-amber-400";
        icon = <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />;
        break;
      case "Supprimé":
        bgClass = "bg-slate-100 dark:bg-slate-800";
        textClass = "text-slate-600 dark:text-slate-400";
        icon = <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />;
        break;
      default:
        bgClass = "bg-slate-100 dark:bg-slate-800";
        textClass = "text-slate-600 dark:text-slate-400";
        icon = <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />;
    }
    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium ${bgClass} ${textClass}`}>
        {icon}
        {value}
      </span>
    );
  };

  // Rendu personnalisé pour la colonne Ports avec indicateur visuel
  const renderPortsCell = (value: string, row: any) => {
    if (value === '-') return <span className="text-muted-foreground text-xs">-</span>;

    const { portsConfigures, portsTotal, portsLibres } = row;
    const pourcentageUtilise = portsTotal > 0 ? (portsConfigures / portsTotal) * 100 : 0;

    let bgClass = "bg-emerald-50 dark:bg-emerald-950/50";
    let textClass = "text-emerald-700 dark:text-emerald-400";

    if (pourcentageUtilise >= 80) {
      bgClass = "bg-rose-50 dark:bg-rose-950/50";
      textClass = "text-rose-700 dark:text-rose-400";
    } else if (pourcentageUtilise >= 50) {
      bgClass = "bg-amber-50 dark:bg-amber-950/50";
      textClass = "text-amber-700 dark:text-amber-400";
    }

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${bgClass} ${textClass}`}>
              {value}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm space-y-0.5">
              <p>Total: {portsTotal} ports</p>
              <p>Configurés: {portsConfigures} ports</p>
              <p>Libres: {portsLibres} ports</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  // Afficher le QR code d'un équipement
  const handleViewQRCode = (row: any) => {
    const originalEquipement = equipements.find(e => e.id === row.id);
    if (originalEquipement) {
      const typeInfo = typeIcons[originalEquipement.type] || typeIcons.autre;
      setQrCodeEquipement({
        ...originalEquipement,
        typeLabel: typeInfo.label
      });
      setIsQRCodeOpen(true);
    }
  };

  // Rendu des actions personnalisées (QR Code)
  const renderRowActions = (row: any) => {
    const originalEquipement = equipements.find(e => e.id === row.id);
    if (!originalEquipement?.qr_code) return null;

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleViewQRCode(row);
              }}
            >
              <QrCode className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Voir le QR Code</p>
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
          title="Gestion des Équipements"
          description="Configuration et gestion des équipements réseau"
          icon={<Router className="h-6 w-6 text-primary" />}
          breadcrumbs={[
            { label: "Tableau de bord", href: "/" },
            { label: "Équipements" },
          ]}
          actions={<AddEquipmentForm />}
        />

        {isLoadingEquipements ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <DataTableEnhanced
              title={`${tableData.length} équipement${tableData.length > 1 ? 's' : ''} configuré${tableData.length > 1 ? 's' : ''}`}
              columns={["Nom", "Code", "Type", "Armoire", "Ports", "IP", "Status"]}
              data={tableData}
              onRowClick={handleRowClick}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onRestore={handleRestore}
              onImport={handleImport}
              enableImport={true}
              importModalTitle="Importer des équipements"
              importTemplateColumns={["name", "equipement_code", "type", "armoire", "ip_address", "vlan", "description"]}
              importTemplateFileName="modele_equipements.csv"
              deleteConfirmTitle="Supprimer l'équipement"
              deleteConfirmDescription="Êtes-vous sûr de vouloir supprimer cet équipement ? Cette action est irréversible."
              restoreConfirmTitle="Restaurer l'équipement"
              restoreConfirmDescription="Êtes-vous sûr de vouloir restaurer cet équipement ?"
              customCellRenderers={{
                "Nom": renderNomCell,
                "Code": renderCodeCell,
                "Type": renderTypeCell,
                "Armoire": renderArmoireCell,
                "Ports": renderPortsCell,
                "Status": renderStatusCell,
              }}
              renderRowActions={renderRowActions}
              customFilters={
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">Status:</span>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Tous" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous</SelectItem>
                        <SelectItem value="Actif">Actif</SelectItem>
                        <SelectItem value="Maintenance">Maintenance</SelectItem>
                        <SelectItem value="Supprimé">Supprimé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">Type:</span>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger className="w-36">
                        <SelectValue placeholder="Tous" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous</SelectItem>
                        {uniqueTypes.map((type) => {
                          const typeInfo = typeIcons[type] || typeIcons.autre;
                          return (
                            <SelectItem key={type} value={type}>
                              <div className={`flex items-center gap-2 ${typeInfo.textClass}`}>
                                {typeInfo.icon}
                                {typeInfo.label}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">Armoire:</span>
                    <Select value={coffretFilter} onValueChange={setCoffretFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Toutes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes</SelectItem>
                        {coffrets.filter(c => !(c as any).deleted_at).map((coffret) => (
                          <SelectItem key={coffret.id} value={coffret.nom || coffret.code}>
                            {coffret.nom || coffret.code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              }
            />

            <DetailsModal
              open={isDetailsOpen}
              onOpenChange={setIsDetailsOpen}
              title="Détails de l'équipement"
              data={formatEquipementForModal(selectedEquipement)}
              onEdit={() => {
                setIsDetailsOpen(false);
                setIsEditOpen(true);
              }}
              onDelete={selectedEquipement ? () => handleDelete(selectedEquipement.id) : undefined}
            />

            <EditModal
              open={isEditOpen}
              onOpenChange={setIsEditOpen}
              title="Modifier l'équipement"
              data={formatEquipementForModal(selectedEquipement)}
              onSave={handleSave}
              fields={[
                { key: "name", label: "Nom", type: "text", icon: <Tag className="h-3 w-3" /> },
                { key: "equipement_code", label: "Code", type: "text", disabled: true, icon: <Hash className="h-3 w-3" /> },
                {
                  key: "type",
                  label: "Type",
                  type: "select",
                  icon: <Box className="h-3 w-3" />,
                  options: [
                    { value: "switch", label: "Switch" },
                    { value: "routeur", label: "Routeur" },
                    { value: "firewall", label: "Firewall" },
                    { value: "point-acces", label: "Point d'accès" },
                    { value: "serveur", label: "Serveur" },
                    { value: "imprimante", label: "Imprimante" },
                    { value: "ordinateur-portable", label: "Ordinateur portable" },
                    { value: "ordinateur-bureau", label: "Ordinateur de bureau" },
                    { value: "prise_murale", label: "Prise murale" },
                    { value: "autre", label: "Autre" },
                  ]
                },
                {
                  key: "coffret_id",
                  label: "Armoire",
                  type: "select",
                  icon: <Archive className="h-3 w-3" />,
                  options: [
                    { value: "none", label: "— Aucune (dans une salle) —" },
                    ...coffrets.filter(c => !(c as any).deleted_at).map(c => ({ value: c.id.toString(), label: c.nom || c.code }))
                  ]
                },
                {
                  key: "salle_id",
                  label: "Salle",
                  type: "select",
                  icon: <Building className="h-3 w-3" />,
                  visibleWhen: { field: "coffret_id", value: "none" },
                  options: salles.filter((s: any) => !s.deleted_at).map((s: any) => ({ value: s.id.toString(), label: s.nom }))
                },
                { key: "modele", label: "Modèle", type: "text", icon: <Settings2 className="h-3 w-3" /> },
                { key: "fabricant", label: "Fabricant", type: "text", icon: <Factory className="h-3 w-3" /> },
                { key: "numero_serie", label: "N° série", type: "text", icon: <Hash className="h-3 w-3" /> },
                {
                  key: "type_reseau",
                  label: "Réseau",
                  type: "select",
                  icon: <Network className="h-3 w-3" />,
                  options: [
                    { value: "IT", label: "IT" },
                    { value: "OT", label: "OT" },
                  ]
                },
                { key: "ip_address", label: "Adresse IP", type: "text", icon: <Globe className="h-3 w-3" /> },
                { key: "mac_address", label: "Adresse MAC", type: "text", icon: <Network className="h-3 w-3" /> },
                { key: "vlan", label: "VLAN", type: "text", icon: <Layers className="h-3 w-3" /> },
                { key: "nombre_ports", label: "Ports", type: "number", icon: <Hash className="h-3 w-3" /> },
                {
                  key: "is_manageable",
                  label: "Manageable",
                  type: "radio",
                  icon: <ToggleLeft className="h-3 w-3" />,
                  options: [
                    { value: "true", label: "Oui" },
                    { value: "false", label: "Non" },
                  ],
                  visibleWhen: { field: "type", value: "switch" }
                },
                {
                  key: "is_principal",
                  label: "Principal",
                  type: "radio",
                  icon: <ToggleLeft className="h-3 w-3" />,
                  options: [
                    { value: "true", label: "Oui" },
                    { value: "false", label: "Non" },
                  ],
                  visibleWhen: { field: "type", value: "switch" }
                },
                {
                  key: "status",
                  label: "Statut",
                  type: "select",
                  icon: <ToggleLeft className="h-3 w-3" />,
                  options: [
                    { value: "active", label: "Actif" },
                    { value: "maintenance", label: "Maintenance" },
                    { value: "inactive", label: "Inactif" },
                  ]
                },
                { key: "description", label: "Description", type: "textarea", icon: <FileText className="h-3 w-3" />, fullWidth: true },
              ]}
            />

            {/* Modal de détails de l'armoire */}
            <DetailsModal
              open={isCoffretDetailsOpen}
              onOpenChange={setIsCoffretDetailsOpen}
              title="Détails de l'armoire"
              data={selectedCoffret}
              onEdit={() => {
                setIsCoffretDetailsOpen(false);
                navigate('/armoires');
              }}
            />

            {/* Modal QR Code */}
            {qrCodeEquipement?.qr_code && (
              <QRCodeModal
                open={isQRCodeOpen}
                onOpenChange={setIsQRCodeOpen}
                qrCode={qrCodeEquipement.qr_code}
                title={qrCodeEquipement.name}
                subtitle={qrCodeEquipement.typeLabel}
                type="equipement"
                code={qrCodeEquipement.equipement_code}
              />
            )}
          </>
        )}
      </div>
    </AppShell>
  );
};

export default Equipements;
