import { useState, useEffect } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useData } from "@/contexts/DataContext";
import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/ui/page-header";
import DataTableEnhanced from "@/components/ui/data-table-enhanced";
import DetailsModal from "@/components/ui/details-modal";
import EditModal from "@/components/ui/edit-modal";
import AddLanForm from "@/components/forms/AddLanForm";
import { toast } from "@/hooks/use-toast";
import { Loader2, Layers, Server, Settings2, Plus, Trash2, Network, Globe, CheckCircle2, Hash, Tag, FileText, ToggleLeft } from "lucide-react";
import equipementService, { ManageableSwitch, VlanConfig } from "@/services/equipementService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface VlanWithSwitches {
  id: number;
  name: string;
  vlan_id: number;
  subnet: string;
  gateway?: string;
  status: string;
  description?: string;
  salle_id?: number;
  switches?: Array<{
    id: number;
    name: string;
    equipement_code: string;
    is_tagged: boolean;
    ports?: string;
  }>;
}

const Vlans = () => {
  const { isAuthenticated, isLoading: isLoadingAuth } = useRequireAuth();
  const { lans, isLoadingLans, updateLan, deleteLan } = useData();
  const [selectedVlan, setSelectedVlan] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSwitchConfigOpen, setIsSwitchConfigOpen] = useState(false);
  const [manageableSwitches, setManageableSwitches] = useState<ManageableSwitch[]>([]);
  const [vlanSwitchConfig, setVlanSwitchConfig] = useState<VlanConfig[]>([]);
  const [isLoadingSwitches, setIsLoadingSwitches] = useState(false);
  const [selectedSwitchToAdd, setSelectedSwitchToAdd] = useState<string>("");
  const [newSwitchIsTagged, setNewSwitchIsTagged] = useState(true);
  const [newSwitchPorts, setNewSwitchPorts] = useState("");

  // Charger les switchs manageables au montage
  useEffect(() => {
    const loadManageableSwitches = async () => {
      try {
        const switches = await equipementService.getManageableSwitches();
        setManageableSwitches(switches);
      } catch (error) {
        console.error("Erreur lors du chargement des switchs:", error);
      }
    };
    if (isAuthenticated) {
      loadManageableSwitches();
    }
  }, [isAuthenticated]);

  if (isLoadingAuth) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const handleRowClick = (vlan: any) => {
    setSelectedVlan(vlan);
    setIsDetailsOpen(true);
  };

  const handleEdit = (vlan: any) => {
    setSelectedVlan(vlan);
    setIsEditOpen(true);
  };

  const handleConfigureSwitches = async (vlan: any) => {
    setSelectedVlan(vlan);
    setIsLoadingSwitches(true);
    setIsSwitchConfigOpen(true);

    // Charger la configuration actuelle des switchs pour ce VLAN
    try {
      // On récupère les switchs configurés pour ce VLAN
      const configuredSwitches: VlanConfig[] = [];
      for (const sw of manageableSwitches) {
        try {
          const vlans = await equipementService.getVlans(sw.id);
          const config = vlans.find(v => v.lan_id === vlan.id);
          if (config) {
            configuredSwitches.push({
              ...config,
              name: sw.name,
            });
          }
        } catch {
          // Ignore errors for individual switches
        }
      }
      setVlanSwitchConfig(configuredSwitches);
    } catch (error) {
      console.error("Erreur:", error);
    }
    setIsLoadingSwitches(false);
  };

  const handleAddSwitchToVlan = async () => {
    if (!selectedSwitchToAdd || !selectedVlan) return;

    try {
      await equipementService.attachVlan(parseInt(selectedSwitchToAdd), {
        lan_id: selectedVlan.id,
        is_tagged: newSwitchIsTagged,
        ports: newSwitchPorts || undefined,
      });

      toast({
        title: "Switch ajouté",
        description: "Le switch a été associé au VLAN avec succès.",
      });

      // Recharger la configuration
      handleConfigureSwitches(selectedVlan);
      setSelectedSwitchToAdd("");
      setNewSwitchPorts("");
      setNewSwitchIsTagged(true);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le switch au VLAN.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveSwitchFromVlan = async (switchId: number) => {
    if (!selectedVlan) return;

    try {
      await equipementService.detachVlan(switchId, selectedVlan.id);

      toast({
        title: "Switch retiré",
        description: "Le switch a été retiré du VLAN.",
      });

      // Recharger la configuration
      handleConfigureSwitches(selectedVlan);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de retirer le switch du VLAN.",
        variant: "destructive",
      });
    }
  };

  const handleSave = async (updatedVlan: any) => {
    try {
      await updateLan(updatedVlan.id, {
        name: updatedVlan.name,
        subnet: updatedVlan.subnet,
        vlan_id: updatedVlan.vlan_id,
        gateway: updatedVlan.gateway,
        status: updatedVlan.status,
        description: updatedVlan.description,
        salle_id: updatedVlan.salle_id,
      });
      toast({
        title: "VLAN mis à jour",
        description: "Les informations du VLAN ont été enregistrées.",
      });
      setIsEditOpen(false);
      setSelectedVlan(null);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour du VLAN.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (vlanId: number) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce VLAN ?")) {
      try {
        await deleteLan(vlanId);
        toast({
          title: "VLAN supprimé",
          description: "Le VLAN a été supprimé avec succès.",
        });
        setIsDetailsOpen(false);
        setSelectedVlan(null);
      } catch (error) {
        toast({
          title: "Erreur",
          description: "Une erreur est survenue lors de la suppression du VLAN.",
          variant: "destructive",
        });
      }
    }
  };

  // Préparer les données pour le tableau
  const tableData = lans.map((lan) => ({
    id: lan.id,
    Nom: lan.name,
    "VLAN ID": lan.vlan_id,
    "Sous-réseau": lan.subnet,
    Passerelle: lan.gateway || '-',
    Status: lan.status === 'active' ? 'Actif' : lan.status === 'inactive' ? 'Inactif' : lan.status,
    description: lan.description || "",
    salle_id: (lan as any).salle_id,
    // Garder les anciennes clés pour la compatibilité avec les modals
    name: lan.name,
    vlan_id: lan.vlan_id,
    subnet: lan.subnet,
    gateway: lan.gateway,
    status: lan.status,
  }));

  // Rendu personnalisé pour la colonne Nom (identifiant principal)
  const renderNomCell = (value: string) => {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100">
        {value}
      </span>
    );
  };

  // Rendu personnalisé pour la colonne VLAN ID
  const renderVlanIdCell = (value: number) => {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-400">
        <Hash className="h-3 w-3" />
        {value}
      </span>
    );
  };

  // Rendu personnalisé pour la colonne Sous-réseau
  const renderSubnetCell = (value: string) => {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 font-mono">
        <Network className="h-3 w-3" />
        {value}
      </span>
    );
  };

  // Rendu personnalisé pour la colonne Passerelle
  const renderGatewayCell = (value: string) => {
    if (value === '-') {
      return <span className="text-muted-foreground text-xs">Non définie</span>;
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-cyan-50 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-400 font-mono">
        <Globe className="h-3 w-3" />
        {value}
      </span>
    );
  };

  // Rendu personnalisé pour la colonne Status
  const renderStatusCell = (value: string) => {
    const isActive = value === "Actif";
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${
        isActive
          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
      }`}>
        <CheckCircle2 className="h-3 w-3" />
        {value}
      </span>
    );
  };

  // Préparer les données pour les modals (format attendu)
  const formatVlanForModal = (vlan: any) => {
    if (!vlan) return null;
    return {
      id: vlan.id,
      name: vlan.name,
      vlan_id: vlan.vlan_id,
      subnet: vlan.subnet,
      gateway: vlan.gateway || '',
      status: vlan.status,
      description: vlan.description || "",
      salle_id: vlan.salle_id,
    };
  };

  // Trouver les switchs disponibles (non encore configurés pour ce VLAN)
  const availableSwitches = manageableSwitches.filter(
    sw => !vlanSwitchConfig.some(config => config.id === sw.id)
  );

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Gestion des VLANs"
          description="Configuration des VLANs et association aux switchs manageables"
          icon={<Layers className="h-6 w-6 text-primary" />}
          breadcrumbs={[
            { label: "Tableau de bord", href: "/" },
            { label: "VLANs" },
          ]}
          actions={<AddLanForm />}
        />

        {isLoadingLans ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <DataTableEnhanced
              title={`${lans.length} VLAN${lans.length > 1 ? 's' : ''} configuré${lans.length > 1 ? 's' : ''}`}
              columns={["Nom", "VLAN ID", "Sous-réseau", "Passerelle", "Status"]}
              data={tableData}
              onRowClick={handleRowClick}
              onEdit={handleEdit}
              onDelete={handleDelete}
              customCellRenderers={{
                "Nom": renderNomCell,
                "VLAN ID": renderVlanIdCell,
                "Sous-réseau": renderSubnetCell,
                "Passerelle": renderGatewayCell,
                "Status": renderStatusCell,
              }}
              customActions={(row) => (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleConfigureSwitches(row);
                  }}
                  title="Configurer les switchs"
                >
                  <Settings2 className="h-4 w-4" />
                </Button>
              )}
            />

            <DetailsModal
              open={isDetailsOpen}
              onOpenChange={setIsDetailsOpen}
              title="Détails du VLAN"
              data={formatVlanForModal(selectedVlan)}
              onEdit={() => {
                setIsDetailsOpen(false);
                setIsEditOpen(true);
              }}
              onDelete={selectedVlan ? () => handleDelete(selectedVlan.id) : undefined}
            />

            <EditModal
              open={isEditOpen}
              onOpenChange={setIsEditOpen}
              title="Modifier le VLAN"
              data={formatVlanForModal(selectedVlan)}
              onSave={handleSave}
              fields={[
                { key: "name", label: "Nom", type: "text", icon: <Tag className="h-3 w-3" /> },
                { key: "vlan_id", label: "VLAN ID", type: "number", icon: <Hash className="h-3 w-3" /> },
                { key: "subnet", label: "Sous-réseau", type: "text", icon: <Network className="h-3 w-3" /> },
                { key: "gateway", label: "Passerelle", type: "text", icon: <Globe className="h-3 w-3" /> },
                { key: "status", label: "Statut", type: "select", icon: <ToggleLeft className="h-3 w-3" />, options: [
                  { value: "active", label: "Actif" },
                  { value: "inactive", label: "Inactif" },
                ]},
                { key: "description", label: "Description", type: "textarea", icon: <FileText className="h-3 w-3" />, fullWidth: true },
              ]}
            />

            {/* Modal de configuration des switchs */}
            <Dialog open={isSwitchConfigOpen} onOpenChange={setIsSwitchConfigOpen}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Server className="h-5 w-5" />
                    Configuration des switchs pour VLAN {selectedVlan?.vlan_id}
                  </DialogTitle>
                  <DialogDescription>
                    {selectedVlan?.name} - {selectedVlan?.subnet}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  {/* Liste des switchs configurés */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Switchs configurés</CardTitle>
                      <CardDescription>
                        Switchs manageables associés à ce VLAN
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isLoadingSwitches ? (
                        <div className="flex justify-center py-4">
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                      ) : vlanSwitchConfig.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Aucun switch configuré pour ce VLAN
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {vlanSwitchConfig.map((config) => {
                            const sw = manageableSwitches.find(s => s.id === config.id);
                            return (
                              <div
                                key={config.id}
                                className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                              >
                                <div className="flex items-center gap-3">
                                  <Server className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <p className="font-medium text-sm">{sw?.name || config.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {sw?.equipement_code}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant={config.is_tagged ? "default" : "secondary"}>
                                    {config.is_tagged ? "Tagged" : "Untagged"}
                                  </Badge>
                                  {config.ports && (
                                    <Badge variant="outline">
                                      Ports: {config.ports}
                                    </Badge>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveSwitchFromVlan(config.id)}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Ajouter un switch */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Ajouter un switch</CardTitle>
                      <CardDescription>
                        Sélectionnez un switch manageable à associer à ce VLAN
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {availableSwitches.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Tous les switchs manageables sont déjà configurés
                        </p>
                      ) : (
                        <div className="space-y-4">
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label>Switch</Label>
                              <Select
                                value={selectedSwitchToAdd}
                                onValueChange={setSelectedSwitchToAdd}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionner un switch" />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableSwitches.map((sw) => (
                                    <SelectItem key={sw.id} value={sw.id.toString()}>
                                      {sw.name} ({sw.equipement_code})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Ports (optionnel)</Label>
                              <Input
                                placeholder="ex: 1-24, 48"
                                value={newSwitchPorts}
                                onChange={(e) => setNewSwitchPorts(e.target.value)}
                              />
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Switch
                                id="tagged"
                                checked={newSwitchIsTagged}
                                onCheckedChange={setNewSwitchIsTagged}
                              />
                              <Label htmlFor="tagged">
                                Tagged (802.1Q)
                              </Label>
                            </div>
                            <Button
                              onClick={handleAddSwitchToVlan}
                              disabled={!selectedSwitchToAdd}
                              size="sm"
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Ajouter
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </AppShell>
  );
};

export default Vlans;
