import { Server, Router, Cable, Activity } from "lucide-react";
import StatsCard from "./StatsCard";
import DataTable from "./DataTable";

// Sample data matching the screenshots
const armoiresData = [
  { ID: "CAB-001", Emplacement: "Salle R-201 12", Équipements: "", État: "Actif" },
  { ID: "CAB-014", Emplacement: "Niveau -1 9", Équipements: "Local Tech", État: "Maintenance" },
  { ID: "CAB-022", Emplacement: "Bâtiment B 15", Équipements: "- 3e étage", État: "Actif" },
];

const monitoringData = [
  { Horodatage: "10:24", Événement: "Perte de liaison détectée sur LNK-02", Source: "Cabinet CAB-001", Gravité: "warn" },
  { Horodatage: "10:02", Événement: "Port P24 repassé UP", Source: "Switch Edge (CAB-001)", Gravité: "ok" },
  { Horodatage: "09:47", Événement: "Nouvel équipement découvert (EQ-2033)", Source: "Découverte", Gravité: "ok" },
];

const liaisonsData = [
  { Label: "LNK-145", Média: "Fibre", "Longueur (m)": "120" },
  { Label: "LNK-087", Média: "Cuivre", "Longueur (m)": "98" },
  { Label: "LNK-022", Média: "Fibre", "Longueur (m)": "90" },
];

const activiteData = [
  { Heure: "10:30", Action: "Modification dupont", Utilisateur: "" },
  { Heure: "09:58", Action: "Ajout de liaison LNK-203", Utilisateur: "mnguyen" },
  { Heure: "09:12", Action: "Import d'inventaire", Utilisateur: "asoumare" },
];

export default function DashboardOverview() {
  return (
    <div className="space-y-6">
      {/* Status header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Vue d'ensemble</h2>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-status-up"></div>
            <span>Système opérationnel</span>
          </div>
          <span>Dernière synchro: il y a 5 min</span>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Armoires"
          value="36"
          icon={Server}
        />
        <StatsCard
          title="Équipements"
          value="248"
          icon={Router}
        />
        <StatsCard
          title="Ports"
          value="5 920"
          icon={Cable}
        />
        <StatsCard
          title="Liaisons actives"
          value="412"
          icon={Activity}
        />
      </div>

      {/* Data sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DataTable
          title="Armoires – Aperçu rapide"
          columns={["ID", "Emplacement", "Équipements", "État"]}
          data={armoiresData}
          onFilter={() => {}}
        />

        <div className="space-y-6">
          <DataTable
            title="Monitoring – Derniers événements"
            columns={["Horodatage", "Événement", "Source", "Gravité"]}
            data={monitoringData}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DataTable
          title="Top liaisons par longueur"
          columns={["Label", "Média", "Longueur (m)"]}
          data={liaisonsData}
        />

        <DataTable
          title="Activité récente"
          columns={["Heure", "Action", "Utilisateur"]}
          data={activiteData}
        />
      </div>
    </div>
  );
}