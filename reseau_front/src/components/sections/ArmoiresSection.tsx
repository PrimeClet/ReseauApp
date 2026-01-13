import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Loader2, MapPin, Server, Plus, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DataTable from "../dashboard/DataTable";
import DataTableEnhanced from "../ui/data-table-enhanced";
import DetailsModal from "../ui/details-modal";
import EditModal from "../ui/edit-modal";
import QRCodeModal from "../ui/qr-code-modal";
import PageHeader from "../ui/page-header";
import { useData } from "@/contexts/DataContext";
import type { Coffret, Equipement } from "@/contexts/DataContext";
import AddEquipmentForm from "../forms/AddEquipmentForm";
import AddPortForm from "../forms/AddPortForm";
import AddLiaisonForm from "../forms/AddLiaisonForm";
import AddSystemeForm from "../forms/AddSystemeForm";

export default function ArmoiresSection() {
  const navigate = useNavigate();
  const {
    coffrets,
    equipements,
    ports,
    liaisons,
    systems,
    batiments,
    salles,
    isLoadingCoffrets,
    isLoadingEquipements,
    refetchEquipements,
    refetchPorts,
    refetchLiaisons,
    refetchSystems,
    updateCoffret,
    refetchCoffrets,
  } = useData();

  const [selectedCoffret, setSelectedCoffret] = useState<Coffret | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isQRCodeOpen, setIsQRCodeOpen] = useState(false);
  const [qrCodeCoffret, setQrCodeCoffret] = useState<Coffret | null>(null);
  const [selectedBatimentId, setSelectedBatimentId] = useState<number | undefined>(undefined);
  const [selectedSalleId, setSelectedSalleId] = useState<number | undefined>(undefined);
  const [returnToArmoires, setReturnToArmoires] = useState(false);

  // Retrieve selected cabinet from localStorage (if coming from dashboard or armoires page)
  useEffect(() => {
    const savedCoffretId = localStorage.getItem('selectedCoffretId');
    const shouldReturnToArmoires = localStorage.getItem('returnToArmoires');

    if (shouldReturnToArmoires === 'true') {
      setReturnToArmoires(true);
      localStorage.removeItem('returnToArmoires');
    }

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
    // Si on vient de la page /armoires, retourner vers /armoires
    if (returnToArmoires) {
      navigate('/armoires');
    } else {
      setSelectedCoffret(null);
    }
  };

  const handleRowClick = (item: any) => {
    setSelectedItem(item);
    setIsDetailsOpen(true);
  };

  const handleEdit = (item: any) => {
    setSelectedItem(item);
    setIsEditOpen(true);
  };

  const handleViewQRCode = (coffret: Coffret) => {
    setQrCodeCoffret(coffret);
    setIsQRCodeOpen(true);
  };

  // Filtrer les coffrets par bâtiment et salle
  const filteredCoffrets = coffrets.filter(coffret => {
    if (selectedBatimentId && coffret.batiment_id !== selectedBatimentId) {
      return false;
    }
    if (selectedSalleId && coffret.salle_id !== selectedSalleId) {
      return false;
    }
    return true;
  });

  // Filtrer les salles selon le bâtiment sélectionné
  const filteredSalles = selectedBatimentId
    ? salles.filter(salle => salle.batiment_id === selectedBatimentId)
    : salles;

  // Réinitialiser le filtre salle si le bâtiment change
  useEffect(() => {
    if (selectedBatimentId) {
      const salle = salles.find(s => s.id === selectedSalleId);
      if (!salle || salle.batiment_id !== selectedBatimentId) {
        setSelectedSalleId(undefined);
      }
    } else {
      setSelectedSalleId(undefined);
    }
  }, [selectedBatimentId, selectedSalleId, salles]);

  const handleSave = async (updatedItem: any) => {
    // Si c'est un coffret (a une propriété "code"), utiliser updateCoffret
    if (updatedItem.code && updatedItem.id) {
      try {
        await updateCoffret(updatedItem.id, {
          nom: updatedItem.nom,
          piece: updatedItem.piece || '',
          long: updatedItem.long,
          lat: updatedItem.lat,
          batiment_id: updatedItem.batiment_id,
          salle_id: updatedItem.salle_id,
          status: updatedItem.status,
        });
        refetchCoffrets();
        setIsEditOpen(false);
      } catch (error) {
        console.error('Error updating coffret:', error);
      }
    } else {
      console.log('Saving item:', updatedItem);
    }
  };

  // Filter equipment from selected cabinet
  // Use relation equipment first, otherwise filter from global list
  const coffretEquipements = selectedCoffret
    ? (selectedCoffret.equipements && Array.isArray(selectedCoffret.equipements) && selectedCoffret.equipements.length > 0
        ? selectedCoffret.equipements
        : equipements.filter(e => e && e.coffret_id === selectedCoffret.id))
    : [];

  // Debug: check equipment
  useEffect(() => {
    if (selectedCoffret) {
      console.log('Selected coffret:', selectedCoffret);
      console.log('Coffret equipements (from relation):', selectedCoffret.equipements);
      console.log('All equipements:', equipements);
      console.log('Filtered equipements:', coffretEquipements);
    }
  }, [selectedCoffret, equipements, coffretEquipements]);

  // Filter systems from selected cabinet
  const coffretSystems = selectedCoffret
    ? systems.filter(s => s.coffret_id === selectedCoffret.id)
    : [];

  // Filter ports from selected cabinet (via equipment)
  const coffretPorts = selectedCoffret
    ? ports.filter(p => {
        const equipement = equipements.find(e => e.id === p.equipement_id);
        return equipement && equipement.coffret_id === selectedCoffret.id;
      })
    : [];

  // Filter links from selected cabinet (via ports)
  const coffretLiaisons = selectedCoffret
    ? liaisons.filter(l => {
        const fromPort = ports.find(p => p.id === l.from);
        const toPort = ports.find(p => p.id === l.to);
        const fromEquip = fromPort ? equipements.find(e => e.id === fromPort.equipement_id) : null;
        const toEquip = toPort ? equipements.find(e => e.id === toPort.equipement_id) : null;
        return (fromEquip && fromEquip.coffret_id === selectedCoffret.id) || 
               (toEquip && toEquip.coffret_id === selectedCoffret.id);
      })
    : [];

  if (isLoadingCoffrets) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Chargement des armoires...</span>
      </div>
    );
  }

  // Vue détaillée de l'armoire
  if (selectedCoffret) {
    return (
      <div className="space-y-6">
        {/* Breadcrumb et header */}
        <PageHeader
          title={selectedCoffret.code}
          description={selectedCoffret.nom}
          icon={<Server className="h-6 w-6 text-primary" />}
          breadcrumbs={[
            { label: "Tableau de bord", href: "/" },
            { label: "Armoires", onClick: handleBackToList },
            { label: selectedCoffret.code },
          ]}
          actions={
            <Button variant="ghost" size="sm" onClick={handleBackToList}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à la liste
            </Button>
          }
        />

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
                  <span>Salle: {salles.find(s => s.id === selectedCoffret.salle_id)?.nom || selectedCoffret.piece || 'Non définie'}</span>
                </div>
                {selectedCoffret.lat && selectedCoffret.long && (
                  <span>GPS: {selectedCoffret.lat}, {selectedCoffret.long}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {selectedCoffret.qr_code && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsQRCodeOpen(true)}
                >
                  <QrCode className="h-4 w-4 mr-2" />
                  Voir QR Code
                </Button>
              )}
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                selectedCoffret.status === 'actif' || selectedCoffret.status === 'active' || selectedCoffret.status === 'Actif'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
              }`}>
                {selectedCoffret.status === 'active' || selectedCoffret.status === 'actif' ? 'Actif' : selectedCoffret.status || 'Actif'}
              </span>
            </div>
          </div>
        </div>

        {/* Onglets pour les détails */}
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
              <h3 className="text-lg font-semibold">Équipements de cette armoire</h3>
              <AddEquipmentForm
                defaultCoffretId={selectedCoffret?.id}
                onSuccess={() => {
                  refetchEquipements();
                }}
                trigger={
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter
                  </Button>
                }
              />
            </div>

            {coffretEquipements.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucun équipement dans cette armoire
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
                      <th className="p-3">Statut</th>
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
                            equip.status === 'actif' || equip.status === 'active' || equip.status === 'up'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          }`}>
                            {equip.status === 'active' ? 'Actif' : equip.status}
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
              <AddPortForm
                defaultCoffretId={selectedCoffret?.id}
                onSuccess={() => {
                  refetchPorts();
                }}
                trigger={
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter
                  </Button>
                }
              />
            </div>

            {coffretPorts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucun port configuré
              </div>
            ) : (
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr className="text-left text-sm text-muted-foreground">
                      <th className="p-3">Label</th>
                      <th className="p-3">Équipement</th>
                      <th className="p-3">VLAN</th>
                      <th className="p-3">Vitesse</th>
                      <th className="p-3">PoE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coffretPorts.slice(0, 10).map((port) => (
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
              <h3 className="text-lg font-semibold">Liaisons de cette armoire</h3>
              <AddLiaisonForm
                defaultCoffretId={selectedCoffret?.id}
                onSuccess={() => {
                  refetchLiaisons();
                }}
                trigger={
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter
                  </Button>
                }
              />
            </div>

            {coffretLiaisons.length === 0 ? (
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
                      <th className="p-3">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coffretLiaisons.slice(0, 10).map((liaison) => (
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
              <AddSystemeForm
                defaultCoffretId={selectedCoffret?.id}
                onSuccess={() => {
                  refetchSystems();
                }}
                trigger={
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter
                  </Button>
                }
              />
            </div>

            {coffretSystems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucun système dans cette armoire
              </div>
            ) : (
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr className="text-left text-sm text-muted-foreground">
                      <th className="p-3">Nom</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Fournisseur</th>
                      <th className="p-3">Endpoint</th>
                      <th className="p-3">Statut</th>
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
          fields={selectedItem?.code ? [
            { key: 'code', label: 'Code', type: 'text' },
            { key: 'nom', label: 'Nom', type: 'text' },
            { key: 'piece', label: 'Pièce', type: 'text' },
            { key: 'long', label: 'Longitude', type: 'number' },
            { key: 'lat', label: 'Latitude', type: 'number' },
            { key: 'status', label: 'Statut', type: 'select', options: ['active', 'inactive'] },
          ] : undefined}
        />

        {/* Modal QR Code pour le coffret sélectionné */}
        {selectedCoffret?.qr_code && (
          <QRCodeModal
            open={isQRCodeOpen}
            onOpenChange={setIsQRCodeOpen}
            qrCode={selectedCoffret.qr_code}
            title={`QR Code - ${selectedCoffret.nom || selectedCoffret.code}`}
          />
        )}
      </div>
    );
  }

  // Vue liste des armoires
  return (
    <div className="space-y-6">
      <PageHeader
        title="Armoires"
        description={`${filteredCoffrets.length} armoire${filteredCoffrets.length !== 1 ? 's' : ''} dans l'inventaire`}
        icon={<Server className="h-6 w-6 text-primary" />}
        breadcrumbs={[
          { label: "Tableau de bord", href: "/" },
          { label: "Armoires" },
        ]}
        actions={
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une armoire
          </Button>
        }
      />

      {/* Filtres par bâtiment et salle */}
      <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-foreground">Bâtiment:</label>
          <Select
            value={selectedBatimentId?.toString() || "all"}
            onValueChange={(value) => setSelectedBatimentId(value === "all" ? undefined : parseInt(value))}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Tous les bâtiments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les bâtiments</SelectItem>
              {batiments?.map((batiment) => (
                <SelectItem key={batiment.id} value={batiment.id.toString()}>
                  {batiment.nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-foreground">Salle:</label>
          <Select
            value={selectedSalleId?.toString() || "all"}
            onValueChange={(value) => setSelectedSalleId(value === "all" ? undefined : parseInt(value))}
            disabled={!selectedBatimentId && filteredSalles.length === 0}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder={selectedBatimentId ? "Toutes les salles" : "Sélectionnez d'abord un bâtiment"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les salles</SelectItem>
              {filteredSalles?.map((salle) => (
                <SelectItem key={salle.id} value={salle.id.toString()}>
                  {salle.nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {(selectedBatimentId || selectedSalleId) && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedBatimentId(undefined);
              setSelectedSalleId(undefined);
            }}
          >
            Effacer les filtres
          </Button>
        )}
      </div>

      {filteredCoffrets.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Server className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Aucune armoire trouvée</p>
          <p className="text-sm">Ajoutez une armoire pour commencer</p>
        </div>
      ) : (
        <DataTableEnhanced
          title={`${filteredCoffrets.length} armoire${filteredCoffrets.length !== 1 ? 's' : ''} dans l'inventaire`}
          columns={["Code", "Nom", "Salle", "Statut", "Équipements"]}
          data={filteredCoffrets.map((coffret) => {
            const equipCount = equipements.filter(e => e.coffret_id === coffret.id).length;
            return {
              id: coffret.id,
              Code: coffret.code,
              Nom: coffret.nom,
              Salle: coffret.piece || '-',
              Statut: coffret.status || 'actif',
              Équipements: `${equipCount} équipement${equipCount !== 1 ? 's' : ''}`,
              _originalData: coffret // Conserver les données originales pour le QR code
            };
          })}
          onRowClick={(row) => {
            const coffret = coffrets.find(c => c.id === row.id);
            if (coffret) {
              handleCoffretClick(coffret);
            }
          }}
          onEdit={(row) => {
            const coffret = coffrets.find(c => c.id === row.id);
            if (coffret) {
              handleEdit(coffret);
            }
          }}
          renderRowActions={(row) => {
            const coffret = row._originalData as Coffret;
            if (!coffret || !coffret.qr_code) return null;

            return (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewQRCode(coffret);
                }}
                title="Voir QR Code"
              >
                <QrCode className="h-4 w-4" />
              </Button>
            );
          }}
        />
      )}

      {/* Modal QR Code pour les coffrets de la liste */}
      {qrCodeCoffret?.qr_code && (
        <QRCodeModal
          open={isQRCodeOpen}
          onOpenChange={(open) => {
            setIsQRCodeOpen(open);
            if (!open) {
              setQrCodeCoffret(null);
            }
          }}
          qrCode={qrCodeCoffret.qr_code}
          title={`QR Code - ${qrCodeCoffret.nom || qrCodeCoffret.code}`}
        />
      )}
    </div>
  );
}
