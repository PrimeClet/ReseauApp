import { useState } from "react";
import DataTableEnhanced from "@/components/ui/data-table-enhanced";
import DetailsModal from "@/components/ui/details-modal";
import EditModal from "@/components/ui/edit-modal";
import AddMaintenanceForm from "@/components/forms/AddMaintenanceForm";
import { useData } from "@/contexts/DataContext";

export default function MaintenanceSection() {
  const { maintenances } = useData();
  const [selectedMaintenance, setSelectedMaintenance] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const handleRowClick = (maintenance: any) => {
    setSelectedMaintenance(maintenance);
    setIsDetailsOpen(true);
  };

  const handleEdit = (maintenance: any) => {
    setSelectedMaintenance(maintenance);
    setIsEditOpen(true);
  };

  const handleSave = (updatedMaintenance: any) => {
    console.log('Saving maintenance:', updatedMaintenance);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gestion de la Maintenance</h2>
          <div className="text-sm text-muted-foreground mt-1">
            Planification et suivi des interventions techniques
          </div>
        </div>
        <AddMaintenanceForm />
      </div>

      <DataTableEnhanced
        title={`${maintenances.length} maintenances programmées`}
        columns={["titre", "type", "equipement", "date_debut", "date_fin", "statut", "technicien"]}
        data={maintenances}
        onRowClick={handleRowClick}
        onEdit={handleEdit}
      />

      <DetailsModal
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        title="Détails de la maintenance"
        data={selectedMaintenance}
        onEdit={() => {
          setIsDetailsOpen(false);
          setIsEditOpen(true);
        }}
      />

      <EditModal
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        title="Modifier la maintenance"
        data={selectedMaintenance}
        onSave={handleSave}
      />
    </div>
  );
}