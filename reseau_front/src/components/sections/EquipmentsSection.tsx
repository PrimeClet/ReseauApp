import { useState } from "react";
import DataTableEnhanced from "@/components/ui/data-table-enhanced";
import DetailsModal from "@/components/ui/details-modal";
import EditModal from "@/components/ui/edit-modal";
import AddEquipmentForm from "@/components/forms/AddEquipmentForm";
import { useData } from "@/contexts/DataContext";

export default function EquipmentsSection() {
  const { equipements, updateEquipement, refetchEquipements } = useData();
  const [selectedEquipment, setSelectedEquipment] = useState<any>(null);
  const [selectedEquipmentOriginal, setSelectedEquipmentOriginal] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

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
  return (
    <div className="space-y-6">
      {/* Header with equipment info */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Équipements</h2>
          <div className="text-sm text-muted-foreground mt-1">
            Gestion des équipements réseau et de leurs connexions
          </div>
        </div>
        <AddEquipmentForm />
      </div>

      {/* Equipment tables */}
      <div className="grid grid-cols-1 gap-6">
        <DataTableEnhanced
          title={`${equipements.length} équipements`}
          columns={["name", "type", "modele", "fabricant", "equipement_code", "coffret", "type_reseau", "ports", "status", "ip_address"]}
          data={equipements.map((eq) => ({
            id: eq.id,
            name: eq.name,
            type: eq.type,
            modele: eq.modele || '-',
            fabricant: eq.fabricant || '-',
            equipement_code: eq.equipement_code,
            coffret: eq.coffret?.nom || eq.coffret?.code || '-',
            type_reseau: eq.type_reseau || '-',
            ports: `${eq.nb_ports_fibre ?? 0} fibre, ${eq.nb_ports_rj45 ?? 0} RJ45`,
            status: eq.status,
            ip_address: eq.ip_address || '-',
          }))}
          onRowClick={handleRowClick}
          onEdit={handleEdit}
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
          { key: 'type', label: 'Type', type: 'select', options: ['switch', 'routeur', 'firewall', 'point-acces', 'serveur', 'autre'] },
          { key: 'modele', label: 'Modèle', type: 'text' },
          { key: 'fabricant', label: 'Fabricant', type: 'text' },
          { key: 'numero_serie', label: 'Numéro de série', type: 'text' },
          { key: 'type_reseau', label: 'Type de réseau', type: 'select', options: ['IT', 'OT'] },
          { key: 'nb_ports_fibre', label: 'Ports fibre', type: 'number' },
          { key: 'nb_ports_rj45', label: 'Ports RJ45', type: 'number' },
          { key: 'ip_address', label: 'Adresse IP', type: 'text' },
          { key: 'vlan', label: 'VLAN', type: 'text' },
          { key: 'status', label: 'État', type: 'select', options: ['active', 'inactive', 'maintenance'] },
          { key: 'description', label: 'Description', type: 'text' }
        ]}
      />
    </div>
  );
}