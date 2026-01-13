import { useState, useEffect, useMemo } from "react";
import DataTableEnhanced from "@/components/ui/data-table-enhanced";
import DetailsModal from "@/components/ui/details-modal";
import EditModal from "@/components/ui/edit-modal";
import AddEquipmentForm from "@/components/forms/AddEquipmentForm";
import PageHeader from "@/components/ui/page-header";
import { useData } from "@/contexts/DataContext";
import { Router, X, Server, Shield, Wifi, Box } from "lucide-react";
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

export default function EquipmentsSection() {
  const { equipements, coffrets, updateEquipement, refetchEquipements } = useData();
  const [selectedEquipment, setSelectedEquipment] = useState<any>(null);
  const [selectedEquipmentOriginal, setSelectedEquipmentOriginal] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [filterCoffretId, setFilterCoffretId] = useState<number | null>(null);

  // Récupérer le filtre coffret depuis localStorage au chargement
  useEffect(() => {
    const savedFilterCoffretId = localStorage.getItem('filterCoffretId');
    if (savedFilterCoffretId) {
      setFilterCoffretId(parseInt(savedFilterCoffretId, 10));
      localStorage.removeItem('filterCoffretId');
    }
  }, []);

  // Filtrer les équipements par coffret si un filtre est actif
  const filteredEquipements = useMemo(() => {
    if (!filterCoffretId) return equipements;
    return equipements.filter(eq => eq.coffret_id === filterCoffretId);
  }, [equipements, filterCoffretId]);

  // Trouver le nom du coffret filtré
  const filterCoffretName = useMemo(() => {
    if (!filterCoffretId) return null;
    const coffret = coffrets.find(c => c.id === filterCoffretId);
    return coffret?.nom || coffret?.code || `Armoire #${filterCoffretId}`;
  }, [filterCoffretId, coffrets]);

  const handleRowClick = (equipment: any) => {
    // Trouver l'équipement original à partir de l'ID pour avoir les ports
    const originalEquipment = equipements.find(eq => eq.id === equipment.id);
    setSelectedEquipmentOriginal(originalEquipment || equipment);
    setSelectedEquipment(equipment);
    setIsDetailsOpen(true);
  };

  const handleEdit = (equipment: any) => {
    // Trouver l'équipement original à partir de l'ID pour avoir toutes les propriétés complètes
    const originalEquipment = equipements.find(eq => eq.id === equipment.id);
    if (originalEquipment) {
      setSelectedEquipmentOriginal(originalEquipment);
      setSelectedEquipment(equipment);
      setIsEditOpen(true);
    }
  };

  const handleSave = async (updatedEquipment: any) => {
    if (!selectedEquipmentOriginal?.id) return;

    try {
      await updateEquipement(selectedEquipmentOriginal.id, updatedEquipment);
      setIsEditOpen(false);
      refetchEquipements();
      // TODO: Show success toast
    } catch (error) {
      console.error('Error updating equipment:', error);
      // TODO: Show error toast
    }
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

  // Rendu personnalisé pour la colonne Status avec badge coloré
  const renderStatusCell = (value: string) => {
    let colorClass = "";
    let label = value;
    switch (value) {
      case "active":
        colorClass = "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
        label = "Actif";
        break;
      case "inactive":
        colorClass = "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
        label = "Inactif";
        break;
      case "maintenance":
        colorClass = "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
        label = "Maintenance";
        break;
      default:
        colorClass = "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
        {label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion des Équipements"
        description="Gestion des équipements réseau et de leurs connexions"
        icon={<Router className="h-6 w-6 text-primary" />}
        breadcrumbs={[
          { label: "Tableau de bord", href: "/" },
          { label: "Équipements" },
        ]}
        actions={<AddEquipmentForm />}
      />

      {/* Filtre actif */}
      {filterCoffretId && (
        <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/20 rounded-lg">
          <span className="text-sm text-foreground">
            Filtré par armoire: <strong>{filterCoffretName}</strong>
          </span>
          <button
            onClick={() => setFilterCoffretId(null)}
            className="ml-2 p-1 hover:bg-primary/20 rounded-full transition-colors"
            title="Supprimer le filtre"
          >
            <X className="h-4 w-4 text-primary" />
          </button>
        </div>
      )}

      {/* Equipment tables */}
      <div className="grid grid-cols-1 gap-6">
        <DataTableEnhanced
          title={`${filteredEquipements.length} équipement${filteredEquipements.length !== 1 ? 's' : ''}${filterCoffretId ? ` dans ${filterCoffretName}` : ''}`}
          columns={["Nom", "Type", "Code", "Armoire", "Status", "IP"]}
          data={filteredEquipements.map((eq) => ({
            id: eq.id,
            Nom: eq.name,
            Type: eq.type,
            Code: eq.equipement_code,
            Armoire: eq.coffret?.nom || eq.coffret?.code || '-',
            Status: eq.status,
            IP: eq.ip_address || '-',
          }))}
          onRowClick={handleRowClick}
          onEdit={handleEdit}
          customCellRenderers={{
            "Type": renderTypeCell,
            "Status": renderStatusCell,
          }}
        />
      </div>

      {/* Modals */}
      <DetailsModal
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        title="Détails de l'équipement"
        data={selectedEquipmentOriginal}
        onEdit={() => {
          setIsDetailsOpen(false);
          setIsEditOpen(true);
        }}
      />

      <EditModal
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        title="Modifier l'équipement"
        data={selectedEquipmentOriginal}
        onSave={handleSave}
        fields={[
          { key: 'name', label: 'Nom', type: 'text' },
          { key: 'equipement_code', label: 'Code équipement', type: 'text' },
          { key: 'type', label: 'Type', type: 'select', options: [
            { value: 'switch', label: 'Switch' },
            { value: 'routeur', label: 'Routeur' },
            { value: 'firewall', label: 'Firewall' },
            { value: 'point-acces', label: "Point d'accès" },
            { value: 'serveur', label: 'Serveur' },
            { value: 'autre', label: 'Autre' },
          ]},
          { key: 'ip_address', label: 'Adresse IP', type: 'text' },
          { key: 'vlan', label: 'VLAN', type: 'text' },
          { key: 'status', label: 'État', type: 'select', options: [
            { value: 'active', label: 'Actif' },
            { value: 'inactive', label: 'Inactif' },
            { value: 'maintenance', label: 'Maintenance' },
          ]},
          { key: 'description', label: 'Description', type: 'text' }
        ]}
      />
    </div>
  );
}
