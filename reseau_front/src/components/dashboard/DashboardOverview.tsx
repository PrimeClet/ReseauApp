import { Server, Router, Cable, Activity, Loader2, Wrench } from "lucide-react";
import { useNavigate } from "react-router-dom";
import StatsCard from "./StatsCard";
import { useData } from "@/contexts/DataContext";
import { useNavigate } from "react-router-dom";

export default function DashboardOverview() {
  const navigate = useNavigate();
  const {
    coffrets,
    equipements,
    ports,
    liaisons,
    maintenances,
    salles,
    globalStats,
    modificationsStats,
    isLoadingCoffrets,
    isLoadingEquipements,
    isLoadingLiaisons,
    isLoadingMaintenances,
    isLoadingStats
  } = useData();

  const isLoading = isLoadingCoffrets || isLoadingEquipements || isLoadingLiaisons || isLoadingMaintenances || isLoadingStats;

  // Calculer les statistiques de maintenance
  const maintenancesTerminees = maintenances.filter(m => m.statut === 'terminee').length;
  const maintenancesEnCours = maintenances.filter(m => m.statut === 'en_cours').length;
  const maintenancesPlanifiees = maintenances.filter(m => m.statut === 'planifiee').length;
  const maintenancesAnnulees = maintenances.filter(m => m.statut === 'annulee').length;

  // Prepare cabinet data for display (exclude soft deleted)
  const activeCoffrets = coffrets.filter(c => !(c as any).deleted_at);
  const coffretsTableData = activeCoffrets.slice(0, 5).map(coffret => {
    const salle = salles.find(s => s.id === coffret.salle_id);
    return {
      ID: coffret.code,
      Name: coffret.nom,
      Salle: salle?.nom || '-',
      Equipements: coffret.equipements?.length || 0,
      Status: coffret.status || 'Active',
      _id: coffret.id
    };
  });

  // Prepare liaison data for display (top by length)
  const liaisonsTableData = [...liaisons]
    .sort((a, b) => (b.length || 0) - (a.length || 0))
    .slice(0, 5)
    .map(liaison => ({
      Label: liaison.label || `LNK-${liaison.id}`,
      Media: liaison.media || '-',
      Length: liaison.length?.toString() || '-'
    }));

  // Count active liaisons
  const liaisonsActives = liaisons.filter(l => l.status === true).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Chargement des données...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Tableau de bord</h2>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-status-up"></div>
            <span>Système opérationnel</span>
          </div>
          <span>Données en temps réel</span>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div
          className="cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => {
            localStorage.setItem('activeSection', 'armoires');
            window.location.reload();
          }}
        >
          <StatsCard
            title="Armoires"
            value={globalStats?.coffrets?.total ?? coffrets.length}
            icon={Server}
          />
        </div>
        <StatsCard
          title="Équipements"
          value={globalStats?.equipements?.total ?? equipements.length}
          icon={Router}
        />
        <StatsCard
          title="Ports"
          value={globalStats?.ports?.total ?? ports.length}
          icon={Cable}
        />
        <StatsCard
          title="Liaisons Actives"
          value={globalStats?.liaisons?.active ?? liaisonsActives ?? liaisons.length}
          icon={Activity}
        />
      </div>


      {/* Data sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Armoires – Aperçu rapide</h3>
            <button
              onClick={() => {
                localStorage.setItem('activeSection', 'armoires');
                window.location.reload();
              }}
              className="text-sm text-primary hover:underline"
            >
              Voir tout →
            </button>
          </div>
          <div className="p-4">
            {coffrets.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Aucune armoire trouvée</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-muted-foreground">
                    <th className="pb-2">Code</th>
                    <th className="pb-2">Nom</th>
                    <th className="pb-2">Salle</th>
                    <th className="pb-2">Équipements</th>
                  </tr>
                </thead>
                <tbody>
                  {coffretsTableData.map((coffret, index) => (
                    <tr
                      key={index}
                      className="border-t border-border hover:bg-muted/50"
                    >
                      <td
                        className="py-2 text-primary font-medium cursor-pointer hover:underline"
                        onClick={() => {
                          localStorage.setItem('activeSection', 'armoires');
                          localStorage.setItem('selectedCoffretId', coffret._id.toString());
                          window.location.reload();
                        }}
                      >
                        {coffret.ID}
                      </td>
                      <td className="py-2">{coffret.Name}</td>
                      <td className="py-2">{coffret.Salle}</td>
                      <td className="py-2">
                        <button
                          onClick={() => {
                            localStorage.setItem('activeSection', 'equipements');
                            localStorage.setItem('filterCoffretId', coffret._id.toString());
                            window.location.reload();
                          }}
                          className="text-primary hover:underline font-medium"
                        >
                          {coffret.Equipements} équipement{coffret.Equipements !== 1 ? 's' : ''}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Équipements récents</h3>
            <button
              onClick={() => {
                localStorage.setItem('activeSection', 'equipements');
                window.location.reload();
              }}
              className="text-sm text-primary hover:underline"
            >
              Voir tout →
            </button>
          </div>
          <div className="p-4">
            {equipements.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Aucun équipement trouvé</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-muted-foreground">
                    <th className="pb-2">Code</th>
                    <th className="pb-2">Nom</th>
                    <th className="pb-2">Type</th>
                    <th className="pb-2">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {equipements.slice(0, 5).map((equip, index) => (
                    <tr key={index} className="border-t border-border">
                      <td className="py-2 font-medium">{equip.equipement_code}</td>
                      <td className="py-2">{equip.name}</td>
                      <td className="py-2">{equip.type}</td>
                      <td className="py-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          equip.status === 'actif' || equip.status === 'up'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}>
                          {equip.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Liaisons par longueur</h3>
            <button
              onClick={() => {
                localStorage.setItem('activeSection', 'liaisons');
                window.location.reload();
              }}
              className="text-sm text-primary hover:underline"
            >
              Voir tout →
            </button>
          </div>
          <div className="p-4">
            {liaisons.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Aucune liaison trouvée</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-muted-foreground">
                    <th className="pb-2">Libellé</th>
                    <th className="pb-2">Média</th>
                    <th className="pb-2">Longueur (m)</th>
                  </tr>
                </thead>
                <tbody>
                  {liaisonsTableData.map((liaison, index) => (
                    <tr key={index} className="border-t border-border">
                      <td className="py-2 font-medium">{liaison.Label}</td>
                      <td className="py-2">{liaison.Media}</td>
                      <td className="py-2">{liaison.Length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Maintenances</h3>
            </div>
            <button
              onClick={() => {
                localStorage.setItem('activeSection', 'maintenance');
                window.location.reload();
              }}
              className="text-sm text-primary hover:underline"
            >
              Voir tout →
            </button>
          </div>
          <div className="p-4 grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{maintenancesPlanifiees}</div>
              <div className="text-sm text-blue-600 dark:text-blue-400">Planifiées</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{maintenancesEnCours}</div>
              <div className="text-sm text-yellow-600 dark:text-yellow-400">En cours</div>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{maintenancesTerminees}</div>
              <div className="text-sm text-green-600 dark:text-green-400">Terminées</div>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-900/20 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">{maintenancesAnnulees}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Annulées</div>
            </div>
          </div>
          <div className="px-4 pb-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-lg font-bold text-foreground">{maintenances.length}</div>
              <div className="text-sm text-muted-foreground">Total des maintenances</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
