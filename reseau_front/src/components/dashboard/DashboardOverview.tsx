import { useState, useMemo } from "react";
import {
  Loader2,
  Wrench,
  MapPin,
  Building2,
  Monitor,
  Wifi,
  Network,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Activity,
  Filter,
  Download,
  Calendar
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import StatsCard from "./StatsCard";
import { useData } from "@/contexts/DataContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

export default function DashboardOverview() {
  const navigate = useNavigate();
  const [selectedSiteId, setSelectedSiteId] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");

  const {
    coffrets,
    equipements,
    liaisons,
    maintenances,
    salles,
    sites,
    zones,
    batiments,
    lans,
    isLoadingCoffrets,
    isLoadingEquipements,
    isLoadingLiaisons,
    isLoadingMaintenances,
    isLoadingStats,
    isLoadingSites,
    isLoadingZones,
    isLoadingBatiments,
    isLoadingLans
  } = useData();

  const isLoading = isLoadingCoffrets || isLoadingEquipements || isLoadingLiaisons || isLoadingMaintenances || isLoadingStats || isLoadingSites || isLoadingZones || isLoadingBatiments || isLoadingLans;

  // Filtrer les données selon le site sélectionné
  const filteredData = useMemo(() => {
    if (selectedSiteId === "all") {
      return {
        zones: zones || [],
        batiments: batiments || [],
        salles: salles || [],
        coffrets: coffrets?.filter(c => !(c as any).deleted_at) || [],
        equipements: equipements?.filter(e => !e.deleted_at) || [],
        liaisons: liaisons || []
      };
    }

    const siteId = parseInt(selectedSiteId);
    // Zones du site
    const siteZones = zones?.filter(z => z.site_id === siteId) || [];
    // Bâtiments des zones du site
    const siteBatiments = batiments?.filter(b => siteZones.some(z => z.id === b.zone_id)) || [];
    // Salles des bâtiments
    const siteSalles = salles?.filter(s => siteBatiments.some(b => b.id === s.batiment_id)) || [];
    // Armoires du site
    const siteCoffrets = coffrets?.filter(c => c.site_id === siteId && !(c as any).deleted_at) || [];
    // Équipements du site (par armoire ou par salle)
    const siteEquipements = equipements?.filter(e =>
      !e.deleted_at && (
        siteCoffrets.some(c => c.id === e.coffret_id) ||
        siteSalles.some(s => s.id === e.salle_id)
      )
    ) || [];
    // Liaisons du site (liaisons entre équipements du site)
    const equipementIds = siteEquipements.map(e => e.id);
    const siteLiaisons = liaisons?.filter(l =>
      equipementIds.includes(l.equipement_source_id) || equipementIds.includes(l.equipement_destination_id)
    ) || [];

    return {
      zones: siteZones,
      batiments: siteBatiments,
      salles: siteSalles,
      coffrets: siteCoffrets,
      equipements: siteEquipements,
      liaisons: siteLiaisons
    };
  }, [selectedSiteId, zones, batiments, salles, coffrets, equipements, liaisons]);

  // Filtrer par type d'équipement si sélectionné
  const filteredEquipements = useMemo(() => {
    if (selectedType === "all") {
      return filteredData.equipements;
    }
    return filteredData.equipements.filter(e => e.type?.toLowerCase() === selectedType.toLowerCase());
  }, [filteredData.equipements, selectedType]);

  // Calculer les statistiques depuis les données filtrées
  const totalSites = selectedSiteId === "all" ? (sites?.length || 0) : 1;
  const totalZones = filteredData.zones.length;
  const totalBatiments = filteredData.batiments.length;
  const totalSalles = filteredData.salles.length;
  const totalArmoires = filteredData.coffrets.length;
  const totalEquipements = filteredEquipements.length;
  const totalLiaisons = filteredData.liaisons.length;
  const totalVlans = lans?.length || 0;

  // Séparer les équipements réseau (devices) des autres
  const networkDeviceTypes = ['switch', 'routeur', 'router', 'firewall', 'hub'];
  const devices = filteredEquipements.filter(e =>
    networkDeviceTypes.some(type => e.type?.toLowerCase().includes(type))
  );
  const otherEquipements = filteredEquipements.filter(e =>
    !networkDeviceTypes.some(type => e.type?.toLowerCase().includes(type))
  );

  const totalDevices = devices.length;
  const totalOtherEquipements = otherEquipements.length;
  const totalConnexions = filteredData.liaisons.length;

  // Statistiques de santé des connexions (données filtrées)
  const liaisonsActives = filteredData.liaisons.filter(l => l.status === true).length;
  const liaisonsInactives = filteredData.liaisons.filter(l => l.status === false).length;
  const equipementsMaintenance = filteredEquipements.filter(e =>
    e.status === 'maintenance' || e.status === 'en_maintenance'
  ).length;

  const pourcentageActifs = totalConnexions > 0
    ? Math.round((liaisonsActives / totalConnexions) * 100)
    : 0;

  // Données pour le graphique Donut (Santé des Liaisons)
  const santeData = [
    { name: 'Actifs', value: liaisonsActives, color: '#10b981' },
    { name: 'Inactifs', value: liaisonsInactives || 1, color: '#ef4444' },
    { name: 'Maintenance', value: equipementsMaintenance || 1, color: '#f59e0b' },
  ];

  // Distribution des équipements par type (données filtrées)
  const equipementsByType = filteredData.equipements.reduce((acc, equip) => {
    const type = equip.type || 'Autre';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const distributionData = Object.entries(equipementsByType)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const distributionColors = ['#0ea5e9', '#8b5cf6', '#14b8a6', '#f59e0b', '#f43f5e'];

  // Statistiques par site
  const getSiteStats = (site: any) => {
    // Trouver les zones de ce site
    const siteZones = zones?.filter(z => z.site_id === site.id) || [];
    // Trouver les bâtiments de ces zones
    const siteBatiments = batiments?.filter(b => siteZones.some(z => z.id === b.zone_id)) || [];
    // Trouver les salles de ces bâtiments
    const siteSalles = salles?.filter(s => siteBatiments.some(b => b.id === s.batiment_id)) || [];
    // Trouver les armoires de ce site
    const siteCoffrets = coffrets?.filter(c => c.site_id === site.id && !(c as any).deleted_at) || [];
    // Trouver les équipements de ces armoires ou de ces salles
    const siteEquipements = equipements?.filter(e =>
      !e.deleted_at && (
        siteCoffrets.some(c => c.id === e.coffret_id) ||
        siteSalles.some(s => s.id === e.salle_id)
      )
    ) || [];

    return {
      batiments: siteBatiments.length,
      salles: siteSalles.length,
      armoires: siteCoffrets.length,
      equipements: siteEquipements.length
    };
  };

  const siteStatsData = (sites || []).slice(0, 4).map(site => {
    const stats = getSiteStats(site);
    return {
      name: (site.libelle || '').length > 15
        ? (site.libelle || '').substring(0, 12) + '...'
        : site.libelle || '',
      Bâtiments: stats.batiments,
      Armoires: stats.armoires,
      Équipements: stats.equipements
    };
  });

  // Types d'équipements pour le radar (données filtrées)
  const equipementTypes = filteredData.equipements.reduce((acc, equip) => {
    const type = equip.type || 'Autre';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const radarData = Object.entries(equipementTypes)
    .map(([subject, A]) => ({ subject, A, fullMark: Math.max(...Object.values(equipementTypes), 5) }))
    .slice(0, 6);

  // Calculer les statistiques de maintenance
  const maintenancesTerminees = maintenances.filter(m => m.statut === 'terminee').length;
  const maintenancesEnCours = maintenances.filter(m => m.statut === 'en_cours').length;
  const maintenancesPlanifiees = maintenances.filter(m => m.statut === 'planifiee').length;
  const maintenancesAnnulees = maintenances.filter(m => m.statut === 'annulee').length;

  // Prepare cabinet data for display (données filtrées)
  const coffretsTableData = filteredData.coffrets.slice(0, 5).map(coffret => {
    const salle = salles?.find(s => s.id === coffret.salle_id);
    return {
      Code: coffret.code,
      Nom: coffret.nom,
      Salle: salle?.nom || '-',
      Équipements: coffret.equipements?.length || 0,
    };
  });

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
      {/* Filtres et actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground hidden sm:inline">Filtres</span>
          </div>
          <Select value={selectedSiteId} onValueChange={setSelectedSiteId}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Tous les sites" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les sites</SelectItem>
              {sites?.map(site => (
                <SelectItem key={site.id} value={site.id.toString()}>
                  {site.libelle}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Tous les types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="switch">Switch</SelectItem>
              <SelectItem value="routeur">Routeur</SelectItem>
              <SelectItem value="firewall">Firewall</SelectItem>
              <SelectItem value="serveur">Serveur</SelectItem>
              <SelectItem value="point-acces">Point d'accès</SelectItem>
              <SelectItem value="imprimante">Imprimante</SelectItem>
              <SelectItem value="prise_murale">Prise murale</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="gap-2 hidden sm:flex">
            <Calendar className="h-4 w-4" />
            Période
          </Button>
        </div>
        <Button variant="outline" size="sm" className="gap-2 w-full sm:w-auto">
          <Download className="h-4 w-4" />
          <span className="sm:inline">Exporter</span>
        </Button>
      </div>

      {/* Stats cards - 6 colonnes */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <StatsCard
          title="Sites"
          value={totalSites}
          icon={MapPin}
          iconColor="text-rose-500"
          iconBgColor="bg-rose-50 dark:bg-rose-900/20"
        />
        <StatsCard
          title="Bâtiments"
          value={totalBatiments}
          icon={Building2}
          iconColor="text-sky-500"
          iconBgColor="bg-sky-50 dark:bg-sky-900/20"
        />
        <StatsCard
          title="Salles"
          value={totalSalles}
          icon={Building2}
          iconColor="text-indigo-500"
          iconBgColor="bg-indigo-50 dark:bg-indigo-900/20"
        />
        <StatsCard
          title="Armoires"
          value={totalArmoires}
          icon={Monitor}
          iconColor="text-teal-500"
          iconBgColor="bg-teal-50 dark:bg-teal-900/20"
        />
        <StatsCard
          title="Équipements"
          value={totalEquipements}
          icon={Wifi}
          iconColor="text-violet-500"
          iconBgColor="bg-violet-50 dark:bg-violet-900/20"
        />
        <StatsCard
          title="Liaisons"
          value={totalLiaisons}
          icon={Network}
          iconColor="text-emerald-500"
          iconBgColor="bg-emerald-50 dark:bg-emerald-900/20"
        />
      </div>

      {/* Graphiques - Ligne 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Santé des Liaisons - Donut Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Zap className="h-5 w-5 text-yellow-500" />
              Santé des Liaisons
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={200} className="sm:!h-[250px]">
                <PieChart>
                  <Pie
                    data={santeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {santeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Légende personnalisée */}
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 mt-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-emerald-500" />
                <span className="text-xs sm:text-sm">Actifs</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-red-500" />
                <span className="text-xs sm:text-sm">Inactifs</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-amber-500" />
                <span className="text-xs sm:text-sm">Maintenance</span>
              </div>
            </div>
            {/* Statistiques en bas */}
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 mt-4 text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-500" />
                <span>{liaisonsActives} actifs</span>
              </div>
              <div className="flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500" />
                <span>{liaisonsInactives} inactifs</span>
              </div>
              <div className="flex items-center gap-1">
                <Wrench className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-500" />
                <span>{equipementsMaintenance} maint.</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Distribution des Équipements - Bar Chart Horizontal */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Monitor className="h-5 w-5 text-blue-600" />
              Distribution des Équipements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220} className="sm:!h-[280px]">
              <BarChart
                data={distributionData}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={60} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={distributionColors[index % distributionColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques - Ligne 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Statistiques par Site - Grouped Bar Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="h-5 w-5 text-blue-600" />
              Statistiques par Site
            </CardTitle>
          </CardHeader>
          <CardContent>
            {siteStatsData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220} className="sm:!h-[280px]">
                <BarChart data={siteStatsData} margin={{ top: 5, right: 15, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Bâtiments" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Armoires" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Équipements" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                Aucune donnée de site disponible
              </div>
            )}
          </CardContent>
        </Card>

        {/* Types d'Équipements - Radar Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Wifi className="h-5 w-5 text-cyan-600" />
              Types d'Équipements
            </CardTitle>
          </CardHeader>
          <CardContent>
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220} className="sm:!h-[280px]">
                <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 'auto']} />
                  <Radar
                    name="Équipements"
                    dataKey="A"
                    stroke="#0ea5e9"
                    fill="#0ea5e9"
                    fillOpacity={0.5}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                Aucun équipement configuré
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Data sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-card border border-border rounded-lg">
          <div className="p-3 sm:p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-sm sm:text-base text-foreground">Armoires – Aperçu</h3>
            <button
              onClick={() => navigate('/armoires')}
              className="text-xs sm:text-sm text-primary hover:underline"
            >
              Voir tout →
            </button>
          </div>
          <div className="p-3 sm:p-4 overflow-x-auto">
            {filteredData.coffrets.length === 0 ? (
              <p className="text-muted-foreground text-center py-4 text-sm">Aucune armoire trouvée</p>
            ) : (
              <table className="w-full min-w-[400px]">
                <thead>
                  <tr className="text-left text-xs sm:text-sm text-muted-foreground">
                    <th className="pb-2">Code</th>
                    <th className="pb-2">Nom</th>
                    <th className="pb-2 hidden sm:table-cell">Salle</th>
                    <th className="pb-2">Équip.</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {coffretsTableData.map((coffret, index) => (
                    <tr
                      key={index}
                      className="border-t border-border hover:bg-muted/50"
                    >
                      <td
                        className="py-2 text-primary font-medium cursor-pointer hover:underline text-xs sm:text-sm"
                        onClick={() => navigate(`/armoires/${coffret.Code}/details`)}
                      >
                        {coffret.Code}
                      </td>
                      <td className="py-2 text-xs sm:text-sm">{coffret.Nom}</td>
                      <td className="py-2 text-xs sm:text-sm hidden sm:table-cell">{coffret.Salle}</td>
                      <td className="py-2 text-xs sm:text-sm">
                        <span className="font-medium">
                          {coffret.Équipements}
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
          <div className="p-3 sm:p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <h3 className="font-semibold text-sm sm:text-base text-foreground">Maintenances</h3>
            </div>
            <button
              onClick={() => {
                localStorage.setItem('activeSection', 'maintenance');
                window.location.reload();
              }}
              className="text-xs sm:text-sm text-primary hover:underline"
            >
              Voir tout →
            </button>
          </div>
          <div className="p-3 sm:p-4 grid grid-cols-2 gap-2 sm:gap-4">
            <div className="text-center p-2 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">{maintenancesPlanifiees}</div>
              <div className="text-xs sm:text-sm text-blue-600 dark:text-blue-400">Planifiées</div>
            </div>
            <div className="text-center p-2 sm:p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="text-xl sm:text-2xl font-bold text-yellow-600 dark:text-yellow-400">{maintenancesEnCours}</div>
              <div className="text-xs sm:text-sm text-yellow-600 dark:text-yellow-400">En cours</div>
            </div>
            <div className="text-center p-2 sm:p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">{maintenancesTerminees}</div>
              <div className="text-xs sm:text-sm text-green-600 dark:text-green-400">Terminées</div>
            </div>
            <div className="text-center p-2 sm:p-4 bg-gray-50 dark:bg-gray-900/20 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="text-xl sm:text-2xl font-bold text-gray-600 dark:text-gray-400">{maintenancesAnnulees}</div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Annulées</div>
            </div>
          </div>
          <div className="px-3 sm:px-4 pb-3 sm:pb-4">
            <div className="text-center p-2 sm:p-3 bg-muted/50 rounded-lg">
              <div className="text-base sm:text-lg font-bold text-foreground">{maintenances.length}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Total des maintenances</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
