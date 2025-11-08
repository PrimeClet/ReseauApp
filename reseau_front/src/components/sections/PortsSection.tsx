import { useState } from "react";
import DataTableEnhanced from "@/components/ui/data-table-enhanced";
import DetailsModal from "@/components/ui/details-modal";
import EditModal from "@/components/ui/edit-modal";
import AddPortForm from "@/components/forms/AddPortForm";
import { useData } from "@/contexts/DataContext";

export default function PortsSection() {
  const { ports } = useData();
  const [selectedPort, setSelectedPort] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const handleRowClick = (port: any) => {
    setSelectedPort(port);
    setIsDetailsOpen(true);
  };

  const handleEdit = (port: any) => {
    setSelectedPort(port);
    setIsEditOpen(true);
  };

  const handleSave = (updatedPort: any) => {
    console.log('Saving port:', updatedPort);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gestion des Ports</h2>
          <div className="text-sm text-muted-foreground mt-1">
            Configuration et surveillance des ports réseau
          </div>
        </div>
        <AddPortForm />
      </div>

      <DataTableEnhanced
        title={`${ports.length} ports configurés`}
        columns={["nom", "type", "vitesse", "etat", "armoire", "vlan", "description"]}
        data={ports}
        onRowClick={handleRowClick}
        onEdit={handleEdit}
      />

      <DetailsModal
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        title="Détails du port"
        data={selectedPort}
        onEdit={() => {
          setIsDetailsOpen(false);
          setIsEditOpen(true);
        }}
      />

      <EditModal
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        title="Modifier le port"
        data={selectedPort}
        onSave={handleSave}
      />
    </div>
  );
}