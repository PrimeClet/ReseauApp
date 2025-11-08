import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity } from "lucide-react";
import DataTable from "../dashboard/DataTable";
import DataTableEnhanced from "../ui/data-table-enhanced";
import DetailsModal from "../ui/details-modal";
import EditModal from "../ui/edit-modal";
import { useData } from "@/contexts/DataContext";
import AddEquipmentForm from "../forms/AddEquipmentForm";
import AddPortForm from "../forms/AddPortForm";
import AddLiaisonForm from "../forms/AddLiaisonForm";
import AddSystemeForm from "../forms/AddSystemeForm";

// Sample data matching the screenshots
const equipmentsData = [
  { equipment_id: "EQ-1001", name: "Switch Core", type: "Switch", connected_port_id: "P1", direction_in_out: "OUT", vlan: "10", ip_address: "10.0.0.10", status: "up" },
  { equipment_id: "EQ-1002", name: "AP Lobby", type: "AP", connected_port_id: "P8", direction_in_out: "IN", vlan: "20", ip_address: "10.0.20.5", status: "warn" },
];

const portsData = [
  { port_label: "P1", device_name: "Switch Core", poe_enabled: "Oui", vlan: "10", speed: "1G", status: "up", connected_equipment_id: "EQ-1001" },
  { port_label: "P8", device_name: "Switch Edge", poe_enabled: "Non", vlan: "20", speed: "100M", status: "down", connected_equipment_id: "EQ-1002" },
];

const metricsData = [
  { metric: "Humidity", description: "Humidité ambiante", last_value: "52%", status: "ok" },
  { metric: "Door", description: "Capteur d'ouverture", last_value: "Closed", status: "ok" },
];

const liaisonsData = [
  { "from_device → to_device": "Switch Core → Switch Edge", label: "LNK-01", medium: "Cuivre", length_m: "12" },
  { "from_device → to_device": "Switch Edge → AP Lobby", label: "LNK-02", medium: "Fibre", length_m: "45" },
];

const systemsData = [
  { name: "LibreNMS", type: "NMS", vendor: "Community", endpoint: "nms.local/api", monitored_scope: "Cabinet" },
  { name: "RTSP Cam 1", type: "Camera", vendor: "Axis", endpoint: "rtsp://10.0.0.30", monitored_scope: "Room" },
];

export default function ArmoiresSection() {
  const { equipments, ports, liaisons, systemes } = useData();
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("equipements");

  const handleRowClick = (item: any) => {
    setSelectedItem(item);
    setIsDetailsOpen(true);
  };

  const handleEdit = (item: any) => {
    setSelectedItem(item);
    setIsEditOpen(true);
  };

  const handleSave = (updatedItem: any) => {
    console.log('Saving item:', updatedItem);
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Coffret: CAB-001</h2>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
            <span>2 liaisons affichées</span>
            <div className="flex items-center gap-1">
              <span>Pièce: R-201</span>
              <span>GPS: 48.8566, 2.3522</span>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="equipements" className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-secondary">
          <TabsTrigger value="equipements" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Équipements
          </TabsTrigger>
          <TabsTrigger value="ports" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Ports
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Monitoring
          </TabsTrigger>
          <TabsTrigger value="liaisons" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Liaisons
          </TabsTrigger>
          <TabsTrigger value="systemes" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Systèmes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="equipements" className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Équipements dans l'armoire</h3>
            <AddEquipmentForm />
          </div>
          <DataTableEnhanced
            title={`${equipments.length} équipements affichés`}
            columns={["nom", "type", "modele", "armoire", "etat", "ip", "uptime"]}
            data={equipments}
            onRowClick={handleRowClick}
            onEdit={handleEdit}
          />

          {/* Temperature and status cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="text-sm text-muted-foreground">Température Min/Max</div>
              <div className="text-2xl font-bold text-foreground">18°C / 34°C</div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="text-sm text-muted-foreground">État Ports</div>
              <div className="text-2xl font-bold text-foreground">Fermée</div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="text-sm text-muted-foreground">Caméras UP</div>
              <div className="text-2xl font-bold text-foreground">3 / 3</div>
            </div>
          </div>

          <DataTable
            title="Métriques système"
            columns={["metric", "description", "last_value", "status"]}
            data={metricsData}
          />
        </TabsContent>

        <TabsContent value="ports" className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Ports configurés</h3>
            <AddPortForm />
          </div>
          <DataTableEnhanced
            title={`${ports.length} ports configurés`}
            columns={["nom", "type", "vitesse", "etat", "armoire", "vlan", "description"]}
            data={ports}
            onRowClick={handleRowClick}
            onEdit={handleEdit}
          />
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-foreground">Température</h4>
                <div className="text-2xl font-bold text-foreground">22°C</div>
              </div>
              <div className="text-sm text-muted-foreground">
                <div>Min: 18°C | Max: 34°C</div>
                <div>Seuil alerte: 35°C</div>
              </div>
            </div>
            
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-foreground">Humidité</h4>
                <div className="text-2xl font-bold text-foreground">52%</div>
              </div>
              <div className="text-sm text-muted-foreground">
                <div>Plage normale: 45-65%</div>
                <div>État: Normal</div>
              </div>
            </div>
            
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-foreground">Accès</h4>
                <div className="text-2xl font-bold text-status-up">Fermé</div>
              </div>
              <div className="text-sm text-muted-foreground">
                <div>Dernière ouverture: 14:30</div>
                <div>Caméras actives: 3/3</div>
              </div>
            </div>
          </div>

          <DataTable
            title="Historique de monitoring"
            columns={["Timestamp", "Capteur", "Valeur", "État", "Commentaire"]}
            data={[
              { Timestamp: "2024-01-20 15:30", Capteur: "Température", Valeur: "22°C", État: "ok", Commentaire: "Normal" },
              { Timestamp: "2024-01-20 15:25", Capteur: "Humidité", Valeur: "52%", État: "ok", Commentaire: "Plage normale" },
              { Timestamp: "2024-01-20 15:20", Capteur: "Porte", Valeur: "Fermée", État: "ok", Commentaire: "Sécurisée" },
              { Timestamp: "2024-01-20 15:15", Capteur: "Caméra 1", Valeur: "Actif", État: "up", Commentaire: "Streaming OK" },
              { Timestamp: "2024-01-20 15:10", Capteur: "Caméra 2", Valeur: "Actif", État: "up", Commentaire: "Streaming OK" },
              { Timestamp: "2024-01-20 15:05", Capteur: "Caméra 3", Valeur: "Actif", État: "up", Commentaire: "Streaming OK" },
              { Timestamp: "2024-01-20 15:00", Capteur: "Température", Valeur: "21.8°C", État: "ok", Commentaire: "Légère baisse" },
              { Timestamp: "2024-01-20 14:55", Capteur: "Accès", Valeur: "Ouvert", État: "warn", Commentaire: "Maintenance" },
              { Timestamp: "2024-01-20 14:50", Capteur: "Humidité", Valeur: "48%", État: "ok", Commentaire: "Stable" },
              { Timestamp: "2024-01-20 14:45", Capteur: "UPS", Valeur: "100%", État: "up", Commentaire: "Batterie pleine" }
            ]}
          />
        </TabsContent>

        <TabsContent value="liaisons" className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Liaisons configurées</h3>
            <AddLiaisonForm />
          </div>
          <DataTableEnhanced
            title={`${liaisons.length} liaisons configurées`}
            columns={["nom", "type", "origine", "destination", "etat", "bande", "latence"]}
            data={liaisons}
            onRowClick={handleRowClick}
            onEdit={handleEdit}
          />
        </TabsContent>

        <TabsContent value="systemes" className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Systèmes de surveillance</h3>
            <AddSystemeForm />
          </div>
          <DataTableEnhanced
            title={`${systemes.length} systèmes de surveillance`}
            columns={["nom", "type", "version", "etat", "cpu", "memoire", "stockage"]}
            data={systemes}
            onRowClick={handleRowClick}
            onEdit={handleEdit}
          />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <DetailsModal
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        title={`Détails ${activeTab.slice(0, -1)}`}
        data={selectedItem}
        onEdit={() => {
          setIsDetailsOpen(false);
          setIsEditOpen(true);
        }}
      />

      <EditModal
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        title={`Modifier ${activeTab.slice(0, -1)}`}
        data={selectedItem}
        onSave={handleSave}
      />
    </div>
  );
}