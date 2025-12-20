import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Loader2, MapPin, Server, Plus, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DataTable from "../dashboard/DataTable";
import DataTableEnhanced from "../ui/data-table-enhanced";
import DetailsModal from "../ui/details-modal";
import EditModal from "../ui/edit-modal";
import QRCodeModal from "../ui/qr-code-modal";
import { useData } from "@/contexts/DataContext";
import type { Coffret, Equipement } from "@/contexts/DataContext";
import AddEquipmentForm from "../forms/AddEquipmentForm";
import AddPortForm from "../forms/AddPortForm";
import AddLiaisonForm from "../forms/AddLiaisonForm";
import AddSystemeForm from "../forms/AddSystemeForm";

export default function ArmoiresSection() {
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

  // Retrieve selected cabinet from localStorage (if coming from dashboard)
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
        <span className="ml-2 text-muted-foreground">Loading cabinets...</span>
      </div>
    );
  }

  // Cabinet details view
  if (selectedCoffret) {
    return (
      <div className="space-y-6">
        {/* Header avec bouton retour */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleBackToList}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to list
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
                  <span>Room: {selectedCoffret.piece || 'Not defined'}</span>
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
                  View QR Code
                </Button>
              )}
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                selectedCoffret.status === 'actif' || selectedCoffret.status === 'Actif'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
              }`}>
                {selectedCoffret.status || 'Active'}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs pour les détails */}
        <Tabs defaultValue="equipements" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-secondary">
            <TabsTrigger value="equipements" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Equipment ({coffretEquipements.length})
            </TabsTrigger>
            <TabsTrigger value="ports" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Ports
            </TabsTrigger>
            <TabsTrigger value="liaisons" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Links
            </TabsTrigger>
            <TabsTrigger value="systemes" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Systems ({coffretSystems.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="equipements" className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Equipment in this cabinet</h3>
              <AddEquipmentForm 
                defaultCoffretId={selectedCoffret?.id}
                onSuccess={() => {
                  refetchEquipements();
                }}
                trigger={
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                }
              />
            </div>

            {coffretEquipements.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No equipment in this cabinet
              </div>
            ) : (
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr className="text-left text-sm text-muted-foreground">
                      <th className="p-3">Code</th>
                      <th className="p-3">Name</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">IP</th>
                      <th className="p-3">VLAN</th>
                      <th className="p-3">Status</th>
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
              <h3 className="text-lg font-semibold">Configured Ports</h3>
              <AddPortForm 
                defaultCoffretId={selectedCoffret?.id}
                onSuccess={() => {
                  refetchPorts();
                }}
                trigger={
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                }
              />
            </div>

            {coffretPorts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No ports configured
              </div>
            ) : (
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr className="text-left text-sm text-muted-foreground">
                      <th className="p-3">Label</th>
                      <th className="p-3">Device</th>
                      <th className="p-3">VLAN</th>
                      <th className="p-3">Speed</th>
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
                        <td className="p-3">{port.poe_enabled ? 'Yes' : 'No'}</td>
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
              <AddLiaisonForm 
                defaultCoffretId={selectedCoffret?.id}
                onSuccess={() => {
                  refetchLiaisons();
                }}
                trigger={
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                }
              />
            </div>

            {coffretLiaisons.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No links configured
              </div>
            ) : (
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr className="text-left text-sm text-muted-foreground">
                      <th className="p-3">Label</th>
                      <th className="p-3">Media</th>
                      <th className="p-3">Length (m)</th>
                      <th className="p-3">Status</th>
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
                            {liaison.status ? 'Active' : 'Inactive'}
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
              <h3 className="text-lg font-semibold">Monitoring Systems</h3>
              <AddSystemeForm 
                defaultCoffretId={selectedCoffret?.id}
                onSuccess={() => {
                  refetchSystems();
                }}
                trigger={
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                }
              />
            </div>

            {coffretSystems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No systems in this cabinet
              </div>
            ) : (
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr className="text-left text-sm text-muted-foreground">
                      <th className="p-3">Name</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Vendor</th>
                      <th className="p-3">Endpoint</th>
                      <th className="p-3">Status</th>
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
          title="Details"
          data={selectedItem}
          onEdit={() => {
            setIsDetailsOpen(false);
            setIsEditOpen(true);
          }}
        />

        <EditModal
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          title="Edit"
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

  // Cabinets list view
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Cabinets</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {filteredCoffrets.length} cabinets in inventory
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add cabinet
        </Button>
      </div>

      {/* Filtres par bâtiment et salle */}
      <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-foreground">Building:</label>
          <Select
            value={selectedBatimentId?.toString() || "all"}
            onValueChange={(value) => setSelectedBatimentId(value === "all" ? undefined : parseInt(value))}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All buildings" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All buildings</SelectItem>
              {batiments?.map((batiment) => (
                <SelectItem key={batiment.id} value={batiment.id.toString()}>
                  {batiment.nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-foreground">Room:</label>
          <Select
            value={selectedSalleId?.toString() || "all"}
            onValueChange={(value) => setSelectedSalleId(value === "all" ? undefined : parseInt(value))}
            disabled={!selectedBatimentId && filteredSalles.length === 0}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder={selectedBatimentId ? "All rooms" : "Select a building first"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All rooms</SelectItem>
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
            Clear filters
          </Button>
        )}
      </div>

      {filteredCoffrets.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Server className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No cabinets found</p>
          <p className="text-sm">Add a cabinet to get started</p>
        </div>
      ) : (
        <DataTableEnhanced
          title={`${filteredCoffrets.length} cabinets in inventory`}
          columns={["Code", "Name", "Room", "Status", "Equipment"]}
          data={filteredCoffrets.map((coffret) => {
            const equipCount = equipements.filter(e => e.coffret_id === coffret.id).length;
            return {
              id: coffret.id,
              Code: coffret.code,
              Name: coffret.nom,
              Room: coffret.piece || '-',
              Status: coffret.status || 'active',
              Equipment: `${equipCount} equipment`,
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
                title="View QR Code"
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
