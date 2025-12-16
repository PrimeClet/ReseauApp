import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Loader2, MapPin, Server, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import DataTable from "../dashboard/DataTable";
import DetailsModal from "../ui/details-modal";
import EditModal from "../ui/edit-modal";
import { useData } from "@/contexts/DataContext";
import type { Coffret, Equipement } from "@/contexts/DataContext";

export default function ArmoiresSection() {
  const {
    coffrets,
    equipements,
    ports,
    liaisons,
    systems,
    isLoadingCoffrets,
    isLoadingEquipements,
  } = useData();

  const [selectedCoffret, setSelectedCoffret] = useState<Coffret | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Récupérer le coffret sélectionné depuis localStorage (si venant du dashboard)
  useEffect(() => {
    const savedCoffretId = localStorage.getItem('selectedCoffretId');
    if (savedCoffretId && coffrets.length > 0) {
      const coffret = coffrets.find(c => c.id.toString() === savedCoffretId);
      if (coffret) {
        setSelectedCoffret(coffret);
      }
      localStorage.removeItem('selectedCoffretId');
    }
  }, [coffrets]);

  const handleCoffretClick = (coffret: Coffret) => {
    setSelectedCoffret(coffret);
  };

  const handleBackToList = () => {
    setSelectedCoffret(null);
  };

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

  // Filtrer les équipements du coffret sélectionné
  // Utiliser d'abord les équipements de la relation, sinon filtrer depuis la liste globale
  const coffretEquipements = selectedCoffret
    ? (selectedCoffret.equipements && Array.isArray(selectedCoffret.equipements) && selectedCoffret.equipements.length > 0
        ? selectedCoffret.equipements
        : equipements.filter(e => e && e.coffret_id === selectedCoffret.id))
    : [];

  // Debug: vérifier les équipements
  useEffect(() => {
    if (selectedCoffret) {
      console.log('Selected coffret:', selectedCoffret);
      console.log('Coffret equipements (from relation):', selectedCoffret.equipements);
      console.log('All equipements:', equipements);
      console.log('Filtered equipements:', coffretEquipements);
    }
  }, [selectedCoffret, equipements, coffretEquipements]);

  // Filtrer les systèmes du coffret sélectionné
  const coffretSystems = selectedCoffret
    ? systems.filter(s => s.coffret_id === selectedCoffret.id)
    : [];

  if (isLoadingCoffrets) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Chargement des coffrets...</span>
      </div>
    );
  }

  // Vue détails d'un coffret
  if (selectedCoffret) {
    return (
      <div className="space-y-6">
        {/* Header avec bouton retour */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleBackToList}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à la liste
            </Button>
          </div>
        </div>

        {/* Infos du coffret */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Server className="h-6 w-6" />
                {selectedCoffret.code}
              </h2>
              <p className="text-lg text-muted-foreground mt-1">{selectedCoffret.nom}</p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-4">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>Pièce: {selectedCoffret.piece || 'Non définie'}</span>
                </div>
                {selectedCoffret.lat && selectedCoffret.long && (
                  <span>GPS: {selectedCoffret.lat}, {selectedCoffret.long}</span>
                )}
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              selectedCoffret.status === 'actif' || selectedCoffret.status === 'Actif'
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
            }`}>
              {selectedCoffret.status || 'Actif'}
            </span>
          </div>
        </div>

        {/* Tabs pour les détails */}
        <Tabs defaultValue="equipements" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-secondary">
            <TabsTrigger value="equipements" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Équipements ({coffretEquipements.length})
            </TabsTrigger>
            <TabsTrigger value="ports" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Ports
            </TabsTrigger>
            <TabsTrigger value="liaisons" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Liaisons
            </TabsTrigger>
            <TabsTrigger value="systemes" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Systèmes ({coffretSystems.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="equipements" className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Équipements dans ce coffret</h3>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
            </div>

            {coffretEquipements.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucun équipement dans ce coffret
              </div>
            ) : (
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr className="text-left text-sm text-muted-foreground">
                      <th className="p-3">Code</th>
                      <th className="p-3">Nom</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">IP</th>
                      <th className="p-3">VLAN</th>
                      <th className="p-3">État</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coffretEquipements.map((equip) => (
                      <tr
                        key={equip.id}
                        className="border-t border-border hover:bg-muted/50 cursor-pointer"
                        onClick={() => handleRowClick(equip)}
                      >
                        <td className="p-3 font-medium">{equip.equipement_code}</td>
                        <td className="p-3">{equip.name}</td>
                        <td className="p-3">{equip.type}</td>
                        <td className="p-3 font-mono text-sm">{equip.ip_address || '-'}</td>
                        <td className="p-3">{equip.vlan || '-'}</td>
                        <td className="p-3">
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
              </div>
            )}
          </TabsContent>

          <TabsContent value="ports" className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Ports configurés</h3>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
            </div>

            {ports.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucun port configuré
              </div>
            ) : (
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr className="text-left text-sm text-muted-foreground">
                      <th className="p-3">Label</th>
                      <th className="p-3">Device</th>
                      <th className="p-3">VLAN</th>
                      <th className="p-3">Vitesse</th>
                      <th className="p-3">PoE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ports.slice(0, 10).map((port) => (
                      <tr
                        key={port.id}
                        className="border-t border-border hover:bg-muted/50 cursor-pointer"
                        onClick={() => handleRowClick(port)}
                      >
                        <td className="p-3 font-medium">{port.port_label}</td>
                        <td className="p-3">{port.device_name}</td>
                        <td className="p-3">{port.vlan || '-'}</td>
                        <td className="p-3">{port.speed || '-'}</td>
                        <td className="p-3">{port.poe_enabled ? 'Oui' : 'Non'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="liaisons" className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Liaisons</h3>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
            </div>

            {liaisons.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucune liaison configurée
              </div>
            ) : (
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr className="text-left text-sm text-muted-foreground">
                      <th className="p-3">Label</th>
                      <th className="p-3">Média</th>
                      <th className="p-3">Longueur (m)</th>
                      <th className="p-3">État</th>
                    </tr>
                  </thead>
                  <tbody>
                    {liaisons.slice(0, 10).map((liaison) => (
                      <tr
                        key={liaison.id}
                        className="border-t border-border hover:bg-muted/50 cursor-pointer"
                        onClick={() => handleRowClick(liaison)}
                      >
                        <td className="p-3 font-medium">{liaison.label || `LNK-${liaison.id}`}</td>
                        <td className="p-3">{liaison.media || '-'}</td>
                        <td className="p-3">{liaison.length || '-'}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            liaison.status
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {liaison.status ? 'Actif' : 'Inactif'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="systemes" className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Systèmes de surveillance</h3>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
            </div>

            {coffretSystems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucun système dans ce coffret
              </div>
            ) : (
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr className="text-left text-sm text-muted-foreground">
                      <th className="p-3">Nom</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Vendor</th>
                      <th className="p-3">Endpoint</th>
                      <th className="p-3">État</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coffretSystems.map((system) => (
                      <tr
                        key={system.id}
                        className="border-t border-border hover:bg-muted/50 cursor-pointer"
                        onClick={() => handleRowClick(system)}
                      >
                        <td className="p-3 font-medium">{system.name}</td>
                        <td className="p-3">{system.type}</td>
                        <td className="p-3">{system.vendor || '-'}</td>
                        <td className="p-3 font-mono text-sm">{system.endpoint || '-'}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            system.status === 'actif' || system.status === 'up'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          }`}>
                            {system.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Modals */}
        <DetailsModal
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
          title="Détails"
          data={selectedItem}
          onEdit={() => {
            setIsDetailsOpen(false);
            setIsEditOpen(true);
          }}
        />

        <EditModal
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          title="Modifier"
          data={selectedItem}
          onSave={handleSave}
        />
      </div>
    );
  }

  // Vue liste des coffrets
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Coffrets</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {coffrets.length} coffrets dans l'inventaire
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un coffret
        </Button>
      </div>

      {coffrets.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Server className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Aucun coffret trouvé</p>
          <p className="text-sm">Ajoutez un coffret pour commencer</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {coffrets.map((coffret) => {
            const equipCount = equipements.filter(e => e.coffret_id === coffret.id).length;

            return (
              <div
                key={coffret.id}
                className="bg-card border border-border rounded-lg p-4 hover:border-primary cursor-pointer transition-colors"
                onClick={() => handleCoffretClick(coffret)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Server className="h-5 w-5 text-primary" />
                    <span className="font-semibold text-foreground">{coffret.code}</span>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    coffret.status === 'actif' || coffret.status === 'Actif'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  }`}>
                    {coffret.status || 'Actif'}
                  </span>
                </div>

                <h3 className="font-medium text-foreground mb-2">{coffret.nom}</h3>

                <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                  <MapPin className="h-4 w-4" />
                  <span>{coffret.piece || 'Emplacement non défini'}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{equipCount} équipement(s)</span>
                  <span className="text-primary font-medium">Voir détails →</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
