import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DataTableEnhanced from "@/components/ui/data-table-enhanced";
import DetailsModal from "@/components/ui/details-modal";
import EditModal from "@/components/ui/edit-modal";
import AddEquipmentForm from "@/components/forms/AddEquipmentForm";
import { useData } from "@/contexts/DataContext";

export default function EquipmentsSection() {
  const { equipments } = useData();
  const [selectedEquipment, setSelectedEquipment] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const handleRowClick = (equipment: any) => {
    setSelectedEquipment(equipment);
    setIsDetailsOpen(true);
  };

  const handleEdit = (equipment: any) => {
    setSelectedEquipment(equipment);
    setIsEditOpen(true);
  };

  const handleSave = (updatedEquipment: any) => {
    // TODO: Implement save logic
    console.log('Saving equipment:', updatedEquipment);
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

      {/* Equipment detail card */}
      <Card className="p-6 bg-card border-border">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Détails de la liaison sélectionnée</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Label</span>
                <span className="text-foreground font-medium">LNK-01</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Origine</span>
                <span className="text-foreground">Switch Core (P1)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Destination</span>
                <span className="text-foreground">Switch Edge (P24)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Media</span>
                <span className="text-foreground">Cuivre</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Longueur</span>
                <span className="text-foreground">12 m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">État</span>
                <span className="px-2 py-1 bg-status-up text-white rounded text-xs font-medium">UP</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Ports liés</h3>
            <div className="space-y-3">
              <div>
                <div className="text-sm text-muted-foreground">From port</div>
                <div className="text-foreground font-medium">CAB-001:P1</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">To port</div>
                <div className="text-foreground font-medium">CAB-001:P24</div>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-foreground mb-4 mt-6">Équipements concernés</h3>
            <div className="space-y-3">
              <div>
                <div className="text-sm text-muted-foreground">Origine</div>
                <div className="text-foreground font-medium">Switch Core (EQ-1001)</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Destination</div>
                <div className="text-foreground font-medium">Switch Edge (EQ-1010)</div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Equipment tables */}
      <div className="grid grid-cols-1 gap-6">
        <DataTableEnhanced
          title={`${equipments.length} équipements`}
          columns={["nom", "type", "modele", "armoire", "etat", "ip", "uptime"]}
          data={equipments}
          onRowClick={handleRowClick}
          onEdit={handleEdit}
        />
      </div>

      {/* Modals */}
      <DetailsModal
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        title="Détails de l'équipement"
        data={selectedEquipment}
        onEdit={() => {
          setIsDetailsOpen(false);
          setIsEditOpen(true);
        }}
      />

      <EditModal
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        title="Modifier l'équipement"
        data={selectedEquipment}
        onSave={handleSave}
        fields={[
          { key: 'nom', label: 'Nom', type: 'text' },
          { key: 'type', label: 'Type', type: 'select', options: ['Switch', 'Router', 'AP', 'Firewall'] },
          { key: 'modele', label: 'Modèle', type: 'text' },
          { key: 'armoire', label: 'Armoire', type: 'text' },
          { key: 'etat', label: 'État', type: 'select', options: ['actif', 'inactif', 'maintenance'] },
          { key: 'ip', label: 'Adresse IP', type: 'text' },
          { key: 'uptime', label: 'Uptime', type: 'text' }
        ]}
      />
    </div>
  );
}