import { Server, Router, Cable, Activity, Loader2 } from "lucide-react";
import StatsCard from "./StatsCard";
import { useData } from "@/contexts/DataContext";

export default function DashboardOverview() {
  const {
    coffrets,
    equipements,
    ports,
    liaisons,
    globalStats,
    isLoadingCoffrets,
    isLoadingEquipements,
    isLoadingLiaisons,
    isLoadingStats
  } = useData();

  const isLoading = isLoadingCoffrets || isLoadingEquipements || isLoadingLiaisons || isLoadingStats;

  // Préparer les données des coffrets pour l'affichage
  const coffretsTableData = coffrets.slice(0, 5).map(coffret => ({
    ID: coffret.code,
    Emplacement: coffret.piece || '-',
    Nom: coffret.nom,
    État: coffret.status || 'Actif',
    _id: coffret.id
  }));

  // Préparer les données des liaisons pour l'affichage (top par longueur)
  const liaisonsTableData = [...liaisons]
    .sort((a, b) => (b.length || 0) - (a.length || 0))
    .slice(0, 5)
    .map(liaison => ({
      Label: liaison.label || `LNK-${liaison.id}`,
      Média: liaison.media || '-',
      Longueur: liaison.length?.toString() || '-'
    }));

  // Compter les liaisons actives
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
          <h2 className="text-2xl font-bold text-foreground">Vue d'ensemble</h2>
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
            title="Coffrets"
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
          title="Liaisons actives"
          value={globalStats?.liaisons?.active ?? liaisonsActives ?? liaisons.length}
          icon={Activity}
        />
      </div>

      {/* Data sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Coffrets – Aperçu rapide</h3>
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
              <p className="text-muted-foreground text-center py-4">Aucun coffret trouvé</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-muted-foreground">
                    <th className="pb-2">Code</th>
                    <th className="pb-2">Nom</th>
                    <th className="pb-2">Pièce</th>
                    <th className="pb-2">État</th>
                  </tr>
                </thead>
                <tbody>
                  {coffretsTableData.map((coffret, index) => (
                    <tr
                      key={index}
                      className="border-t border-border hover:bg-muted/50 cursor-pointer"
                      onClick={() => {
                        localStorage.setItem('activeSection', 'armoires');
                        localStorage.setItem('selectedCoffretId', coffret._id.toString());
                        window.location.reload();
                      }}
                    >
                      <td className="py-2 text-primary font-medium">{coffret.ID}</td>
                      <td className="py-2">{coffret.Nom}</td>
                      <td className="py-2">{coffret.Emplacement}</td>
                      <td className="py-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          coffret.État === 'Actif' || coffret.État === 'actif'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}>
                          {coffret.État}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-foreground">Équipements récents</h3>
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
                    <th className="pb-2">État</th>
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
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-foreground">Top liaisons par longueur</h3>
          </div>
          <div className="p-4">
            {liaisons.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Aucune liaison trouvée</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-muted-foreground">
                    <th className="pb-2">Label</th>
                    <th className="pb-2">Média</th>
                    <th className="pb-2">Longueur (m)</th>
                  </tr>
                </thead>
                <tbody>
                  {liaisonsTableData.map((liaison, index) => (
                    <tr key={index} className="border-t border-border">
                      <td className="py-2 font-medium">{liaison.Label}</td>
                      <td className="py-2">{liaison.Média}</td>
                      <td className="py-2">{liaison.Longueur}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-foreground">Statistiques rapides</h3>
          </div>
          <div className="p-4 grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-foreground">{coffrets.length}</div>
              <div className="text-sm text-muted-foreground">Coffrets</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-foreground">{equipements.length}</div>
              <div className="text-sm text-muted-foreground">Équipements</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-foreground">{ports.length}</div>
              <div className="text-sm text-muted-foreground">Ports</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-foreground">{liaisons.length}</div>
              <div className="text-sm text-muted-foreground">Liaisons</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
