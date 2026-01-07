import { useState } from "react";
import DataTableEnhanced from "@/components/ui/data-table-enhanced";
import DetailsModal from "@/components/ui/details-modal";
import EditModal from "@/components/ui/edit-modal";
import AddPortForm from "@/components/forms/AddPortForm";
import { useData } from "@/contexts/DataContext";
import { useToast } from "@/hooks/use-toast";

export default function PortsSection() {
  const { ports, updatePort, refetchPorts } = useData();
  const { toast } = useToast();
  const [selectedPort, setSelectedPort] = useState<any>(null);
  const [selectedPortOriginal, setSelectedPortOriginal] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const handleRowClick = (port: any) => {
    // Trouver le port original à partir de l'ID
    const originalPort = ports.find(p => p.id === port.id);
    setSelectedPortOriginal(originalPort || port);
    setSelectedPort(port);
    setIsDetailsOpen(true);
  };

  const handleEdit = (port: any) => {
    // Trouver le port original à partir de l'ID
    const originalPort = ports.find(p => p.id === port.id);
    setSelectedPortOriginal(originalPort || port);
    setSelectedPort(port);
    setIsEditOpen(true);
  };

  const handleSave = async (updatedPort: any) => {
    try {
      // Convertir les données du formulaire vers le format API
      const portData: any = {
        port_label: updatedPort.port_label || updatedPort.Label,
        device_name: updatedPort.device_name || updatedPort.Appareil,
        speed: updatedPort.speed || updatedPort.Vitesse,
        poe_enabled: updatedPort.poe_enabled !== undefined 
          ? updatedPort.poe_enabled 
          : updatedPort.PoE === 'Oui',
        vlan: updatedPort.vlan || updatedPort.VLAN,
        equipement_id: updatedPort.equipement_id,
        connected_equipment_id: updatedPort.connected_equipment_id,
      };
      
      if (selectedPortOriginal?.id) {
        await updatePort(selectedPortOriginal.id, portData);
        toast({
          title: "Port mis à jour",
          description: "Le port a été mis à jour avec succès.",
        });
        setIsEditOpen(false);
        refetchPorts();
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Une erreur est survenue lors de la mise à jour du port.",
        variant: "destructive",
      });
    }
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
        columns={["Label", "Appareil", "Type", "Statut", "Connexion", "Uplink", "Downlink", "Vitesse", "PoE", "Équipement", "VLAN"]}
        data={ports.map((port) => ({
          id: port.id,
          Label: port.port_label,
          Appareil: port.device_name,
          Type: port.type_reseau || '-',
          Statut: port.statut ? (port.statut === 'actif' ? 'Actif' : port.statut === 'inactif' ? 'Inactif' : 'Réservé') : '-',
          Connexion: port.connexion_type ? (port.connexion_type === 'fibre' ? 'Fibre optique' : 'Cuivre (RJ45)') : '-',
          Uplink: port.uplink || '-',
          Downlink: port.downlink || '-',
          Vitesse: port.speed || '-',
          PoE: port.poe_enabled ? 'Oui' : 'Non',
          Équipement: port.equipement ? `${port.equipement.name} (${port.equipement.equipement_code})` : '-',
          VLAN: port.vlan || '-',
        }))}
        onRowClick={handleRowClick}
        onEdit={handleEdit}
      />

      <DetailsModal
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        title="Détails du port"
        data={selectedPortOriginal}
        onEdit={() => {
          setIsDetailsOpen(false);
          setIsEditOpen(true);
        }}
      />

      <EditModal
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        title="Modifier le port"
        data={selectedPortOriginal}
        onSave={handleSave}
        fields={[
          { key: 'port_label', label: 'Label', type: 'text' },
          { key: 'device_name', label: 'Appareil', type: 'text' },
          { key: 'type_reseau', label: 'Type', type: 'select', options: ['IT', 'OT'] },
          { key: 'statut', label: 'Statut', type: 'select', options: ['actif', 'inactif', 'reserve'] },
          { key: 'connexion_type', label: 'Connexion', type: 'select', options: ['fibre', 'cuivre'] },
          { key: 'uplink', label: 'Uplink', type: 'text' },
          { key: 'downlink', label: 'Downlink', type: 'text' },
          { key: 'speed', label: 'Vitesse', type: 'text' },
          { key: 'poe_enabled', label: 'PoE activé', type: 'select', options: ['true', 'false'] },
          { key: 'vlan', label: 'VLAN', type: 'text' },
        ]}
      />
    </div>
  );
}