import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/ui/page-header";
import DataTableEnhanced from "@/components/ui/data-table-enhanced";
import DetailsModal from "@/components/ui/details-modal";
import EditModal from "@/components/ui/edit-modal";
import AddEquipmentForm from "@/components/forms/AddEquipmentForm";
import { toast } from "@/hooks/use-toast";
import { Loader2, Router, Server, Shield, Wifi, Box } from "lucide-react";
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

// Mapping des types d'équipements vers les icônes
const typeIcons: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  switch: { icon: <Router className="h-4 w-4" />, label: "Switch", color: "text-blue-600" },
  routeur: { icon: <Router className="h-4 w-4" />, label: "Routeur", color: "text-green-600" },
  firewall: { icon: <Shield className="h-4 w-4" />, label: "Firewall", color: "text-red-600" },
  "point-acces": { icon: <Wifi className="h-4 w-4" />, label: "Point d'accès", color: "text-purple-600" },
  serveur: { icon: <Server className="h-4 w-4" />, label: "Serveur", color: "text-orange-600" },
  autre: { icon: <Box className="h-4 w-4" />, label: "Autre", color: "text-gray-600" },
};

const Equipements = () => {
  const { isAuthenticated, isLoading: isLoadingAuth } = useAuth();
  const navigate = useNavigate();
  const { equipements, coffrets, isLoadingEquipements, updateEquipement, deleteEquipement, restoreEquipement, refetchEquipements, importEquipements } = useData();
  const [selectedEquipement, setSelectedEquipement] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedCoffret, setSelectedCoffret] = useState<any>(null);
  const [isCoffretDetailsOpen, setIsCoffretDetailsOpen] = useState(false);

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

  useEffect(() => {
    if (!isLoadingAuth && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, isLoadingAuth, navigate]);

  const handleRowClick = (equipement: any) => {
    setSelectedEquipement(equipement);
    setIsDetailsOpen(true);
  };

  const handleEdit = (equipement: any) => {
    setSelectedEquipement(equipement);
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

      const dataToSave = {
        name: updatedEquipement.name,
        type: updatedEquipement.type,
        ip_address: updatedEquipement.ip_address,
        vlan: updatedEquipement.vlan,
        status: updatedEquipement.status,
        description: updatedEquipement.description,
        coffret_id: coffretId,
        nombre_ports: nombrePorts,
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
      armoire: coffret?.nom || coffret?.code || null,
      coffret: coffret ? { nom: coffret.nom, code: coffret.code } : null,
      coffret_id: originalEquipement.coffret_id,
      ip_address: originalEquipement.ip_address,
      vlan: originalEquipement.vlan,
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
      piece: coffret.piece || "",
      qr_code: coffret.qr_code,
      nombre_equipements: equipementsCount,
    };
  };

  // Rendu personnalisé pour la colonne Type avec icône
  const renderTypeCell = (value: string) => {
    const typeInfo = typeIcons[value] || typeIcons.autre;
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`flex items-center gap-2 ${typeInfo.color}`}>
              {typeInfo.icon}
              <span className="capitalize">{typeInfo.label}</span>
            </div>
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
    if (value === '-') return value;
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className="cursor-pointer text-primary hover:underline"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedCoffret(formatCoffretForModal(row.coffret_id));
                setIsCoffretDetailsOpen(true);
              }}
            >
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
    let colorClass = "";
    switch (value) {
      case "Actif":
        colorClass = "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
        break;
      case "Maintenance":
        colorClass = "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
        break;
      case "Supprimé":
        colorClass = "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
        break;
      default:
        colorClass = "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
        {value}
      </span>
    );
  };

  // Rendu personnalisé pour la colonne Ports avec indicateur visuel
  const renderPortsCell = (value: string, row: any) => {
    if (value === '-') return <span className="text-muted-foreground">-</span>;

    const { portsConfigures, portsTotal, portsLibres } = row;
    const pourcentageUtilise = portsTotal > 0 ? (portsConfigures / portsTotal) * 100 : 0;

    let colorClass = "text-green-600 dark:text-green-400"; // Beaucoup de ports libres
    if (pourcentageUtilise >= 80) {
      colorClass = "text-red-600 dark:text-red-400"; // Presque plein
    } else if (pourcentageUtilise >= 50) {
      colorClass = "text-yellow-600 dark:text-yellow-400"; // Moitié utilisée
    }

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={`font-medium ${colorClass}`}>
              {value}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm">
              <p>Total: {portsTotal} ports</p>
              <p>Configurés: {portsConfigures} ports</p>
              <p>Libres: {portsLibres} ports</p>
            </div>
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
                "Type": renderTypeCell,
                "Armoire": renderArmoireCell,
                "Ports": renderPortsCell,
                "Status": renderStatusCell,
              }}
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
                              <div className="flex items-center gap-2">
                                <span className={typeInfo.color}>{typeInfo.icon}</span>
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
                { key: "name", label: "Nom", type: "text" },
                { key: "equipement_code", label: "Code", type: "text", disabled: true },
                {
                  key: "type",
                  label: "Type",
                  type: "select",
                  options: [
                    { value: "switch", label: "Switch" },
                    { value: "routeur", label: "Routeur" },
                    { value: "firewall", label: "Firewall" },
                    { value: "point-acces", label: "Point d'accès" },
                    { value: "serveur", label: "Serveur" },
                    { value: "autre", label: "Autre" },
                  ]
                },
                {
                  key: "coffret_id",
                  label: "Armoire",
                  type: "select",
                  options: coffrets.filter(c => !(c as any).deleted_at).map(c => ({ value: c.id.toString(), label: c.nom || c.code }))
                },
                { key: "ip_address", label: "Adresse IP", type: "text" },
                { key: "vlan", label: "VLAN", type: "text" },
                { key: "nombre_ports", label: "Nombre de ports", type: "number" },
                {
                  key: "status",
                  label: "Status",
                  type: "select",
                  options: [
                    { value: "active", label: "Actif" },
                    { value: "maintenance", label: "Maintenance" },
                  ]
                },
                { key: "description", label: "Description", type: "textarea" },
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
          </>
        )}
      </div>
    </AppShell>
  );
};

export default Equipements;
