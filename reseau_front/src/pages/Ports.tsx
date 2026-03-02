import { useState, useMemo, useEffect } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useData } from "@/contexts/DataContext";
import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/ui/page-header";
import DataTableEnhanced from "@/components/ui/data-table-enhanced";
import DetailsModal from "@/components/ui/details-modal";
import EditModal from "@/components/ui/edit-modal";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Router, Plus, Plug, Check, ChevronsUpDown, AlertTriangle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Schema de validation pour l'ajout de port
const portSchema = z.object({
  port_label: z.string().min(1, "Le label du port est requis"),
  equipement_id: z.number().min(1, "L'équipement est requis"),
  poe_enabled: z.boolean().optional(),
  vlan: z.string().optional(),
  speed: z.string().optional(),
  port_genre: z.enum(["uplink", "downlink"]).default("downlink"),
  type_reseau: z.enum(["IT", "OT"]).default("IT"),
  statut: z.enum(["actif", "inactif", "reserve"]).default("actif"),
  uplink: z.string().optional(),
  downlink: z.string().optional(),
});

type PortFormData = z.infer<typeof portSchema>;

const Ports = () => {
  const { isAuthenticated, isLoading: isLoadingAuth } = useRequireAuth();
  const { ports, equipements, isLoadingPorts, isLoadingEquipements, addPort, updatePort, deletePort, restorePort, refetchPorts, refetchEquipements } = useData();
  const [selectedPort, setSelectedPort] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [equipementComboboxOpen, setEquipementComboboxOpen] = useState(false);

  // Filtres
  const [equipementFilter, setEquipementFilter] = useState<string>("all");
  const [poeFilter, setPoeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Formulaire d'ajout
  const form = useForm<PortFormData>({
    resolver: zodResolver(portSchema),
    defaultValues: {
      port_label: "",
      equipement_id: undefined,
      poe_enabled: false,
      vlan: "",
      speed: "",
      port_genre: "downlink",
      type_reseau: "IT",
      statut: "actif",
      uplink: "",
      downlink: "",
    },
  });

  const selectedEquipementId = form.watch("equipement_id");

  // Auto-remplir le VLAN quand l'équipement est sélectionné
  useEffect(() => {
    if (selectedEquipementId && equipements) {
      const selectedEquipement = equipements.find(eq => eq.id === selectedEquipementId);
      if (selectedEquipement?.vlan) {
        form.setValue("vlan", selectedEquipement.vlan);
      }
    }
  }, [selectedEquipementId, equipements, form]);

  // Calculer les ports disponibles pour chaque équipement
  const equipementPortsInfo = useMemo(() => {
    const info: Record<number, { total: number; configures: number; libres: number }> = {};
    equipements.forEach((eq) => {
      const portsTotal = (eq as any).nombre_ports || 0;
      const portsConfigures = ports.filter(p => p.equipement_id === eq.id).length;
      info[eq.id] = {
        total: portsTotal,
        configures: portsConfigures,
        libres: Math.max(0, portsTotal - portsConfigures),
      };
    });
    return info;
  }, [equipements, ports]);

  // Vérifier si l'équipement sélectionné a des ports libres
  const selectedEquipementInfo = selectedEquipementId ? equipementPortsInfo[selectedEquipementId] : null;
  const hasFreePorts = selectedEquipementInfo ? selectedEquipementInfo.libres > 0 : true;

  // Préparer les données pour le tableau
  const tableData = useMemo(() => {
    let data = ports.map((port) => {
      const equipement = equipements.find(eq => eq.id === port.equipement_id);
      const isDeleted = (port as any).deleted_at !== null && (port as any).deleted_at !== undefined;
      return {
        id: port.id,
        Label: port.port_label,
        Équipement: equipement?.name || '-',
        equipement_id: port.equipement_id,
        PoE: port.poe_enabled ? 'Oui' : 'Non',
        VLAN: port.vlan || '-',
        Vitesse: port.speed || '-',
        Genre: (port as any).port_genre === 'uplink' ? 'Uplink' : 'Downlink',
        port_genre: (port as any).port_genre || 'downlink',
        Status: isDeleted ? "Supprimé" : ((port as any).status === 'active' ? 'Actif' : (port as any).status),
      };
    });

    // Appliquer le filtre d'équipement
    if (equipementFilter !== "all") {
      data = data.filter((item) => item.Équipement === equipementFilter);
    }

    // Appliquer le filtre PoE
    if (poeFilter !== "all") {
      data = data.filter((item) => item.PoE === poeFilter);
    }

    // Appliquer le filtre de statut
    if (statusFilter !== "all") {
      data = data.filter((item) => item.Status === statusFilter);
    }

    return data;
  }, [ports, equipements, equipementFilter, poeFilter, statusFilter]);

  const handleRowClick = (port: any) => {
    // Trouver le port original dans la liste pour avoir toutes les données
    const originalPort = ports.find(p => p.id === port.id) || port;
    setSelectedPort(originalPort);
    setIsDetailsOpen(true);
  };

  const handleEdit = (port: any) => {
    // Trouver le port original dans la liste pour avoir toutes les données
    const originalPort = ports.find(p => p.id === port.id) || port;
    setSelectedPort(originalPort);
    setIsEditOpen(true);
  };

  const handleSave = async (updatedPort: any) => {
    try {
      const dataToSave = {
        port_label: updatedPort.port_label,
        device_name: updatedPort.port_label, // Utiliser le label du port comme device_name
        equipement_id: typeof updatedPort.equipement_id === 'string'
          ? parseInt(updatedPort.equipement_id, 10)
          : updatedPort.equipement_id,
        poe_enabled: updatedPort.poe_enabled === 'true' || updatedPort.poe_enabled === true,
        vlan: updatedPort.vlan,
        speed: updatedPort.speed,
        port_genre: updatedPort.port_genre || 'downlink',
        type_reseau: updatedPort.type_reseau || 'IT',
        statut: updatedPort.statut || 'actif',
        uplink: updatedPort.uplink || null,
        downlink: updatedPort.downlink || null,
      };

      await updatePort(updatedPort.id, dataToSave);
      await refetchPorts();
      await refetchEquipements();

      toast({
        title: "Port mis à jour",
        description: "Les informations du port ont été enregistrées.",
      });
      setIsEditOpen(false);
      setSelectedPort(null);
    } catch (error) {
      console.error('Error saving port:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour du port.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (portId: number) => {
    try {
      await deletePort(portId);
      refetchPorts();
      refetchEquipements();
      toast({
        title: "Port supprimé",
        description: "Le port a été supprimé avec succès.",
      });
      setIsDetailsOpen(false);
      setSelectedPort(null);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression du port.",
        variant: "destructive",
      });
    }
  };

  const handleRestore = async (portId: number) => {
    try {
      await restorePort(portId);
      refetchPorts();
      refetchEquipements();
      toast({
        title: "Port restauré",
        description: "Le port a été restauré avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la restauration du port.",
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (data: PortFormData) => {
    // Vérifier s'il y a des ports libres
    const eqInfo = equipementPortsInfo[data.equipement_id];
    if (eqInfo && eqInfo.libres <= 0) {
      toast({
        title: "Erreur",
        description: "Cet équipement n'a plus de ports libres disponibles.",
        variant: "destructive",
      });
      return;
    }

    try {
      await addPort({
        port_label: data.port_label,
        device_name: data.port_label, // Utiliser le label du port comme device_name
        equipement_id: data.equipement_id,
        poe_enabled: data.poe_enabled || false,
        vlan: data.vlan || undefined,
        speed: data.speed || undefined,
        port_genre: data.port_genre || 'downlink',
        type_reseau: data.type_reseau || 'IT',
        statut: data.statut || 'actif',
        uplink: data.uplink || undefined,
        downlink: data.downlink || undefined,
      });

      toast({
        title: "Port ajouté",
        description: "Le port a été ajouté avec succès.",
      });

      form.reset();
      setIsAddOpen(false);
      refetchPorts();
      refetchEquipements();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error?.response?.data?.message || "Une erreur est survenue lors de l'ajout du port.",
        variant: "destructive",
      });
    }
  };

  // Préparer les données pour les modals (format attendu)
  const formatPortForModal = (port: any) => {
    if (!port) return null;
    const originalPort = ports.find(p => p.id === port.id) || port;
    const equipement = equipements.find(eq => eq.id === originalPort.equipement_id);
    return {
      id: originalPort.id,
      port_label: originalPort.port_label,
      equipement: equipement?.name || null,
      equipement_id: originalPort.equipement_id,
      poe_enabled: originalPort.poe_enabled,
      vlan: originalPort.vlan,
      speed: originalPort.speed,
      port_genre: (originalPort as any).port_genre || 'downlink',
      type_reseau: (originalPort as any).type_reseau || 'IT',
      statut: (originalPort as any).statut || 'actif',
      uplink: (originalPort as any).uplink || '',
      downlink: (originalPort as any).downlink || '',
    };
  };

  // Rendu personnalisé pour la colonne Label (identifiant principal)
  const renderLabelCell = (value: string) => {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100">
        {value}
      </span>
    );
  };

  // Rendu personnalisé pour la colonne PoE avec badge coloré
  const renderPoeCell = (value: string) => {
    const isEnabled = value === 'Oui';
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${
        isEnabled
          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
      }`}>
        <span className={`h-1.5 w-1.5 rounded-full ${isEnabled ? 'bg-emerald-500' : 'bg-slate-400'}`} />
        {value}
      </span>
    );
  };

  // Rendu personnalisé pour la colonne Genre de port
  const renderGenreCell = (value: string) => {
    const isUplink = value === 'Uplink';
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${
        isUplink
          ? "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400"
          : "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-400"
      }`}>
        {isUplink ? '↑' : '↓'} {value}
      </span>
    );
  };

  // Rendu personnalisé pour la colonne Status
  const renderStatusCell = (value: string) => {
    let bgClass = "bg-slate-100 dark:bg-slate-800";
    let textClass = "text-slate-600 dark:text-slate-400";
    let dotClass = "bg-slate-400";

    if (value === 'Actif' || value === 'active') {
      bgClass = "bg-emerald-50 dark:bg-emerald-950/50";
      textClass = "text-emerald-700 dark:text-emerald-400";
      dotClass = "bg-emerald-500";
    } else if (value === 'Supprimé') {
      bgClass = "bg-rose-50 dark:bg-rose-950/50";
      textClass = "text-rose-700 dark:text-rose-400";
      dotClass = "bg-rose-500";
    }

    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium ${bgClass} ${textClass}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
        {value}
      </span>
    );
  };

  // Rendu personnalisé pour la colonne Équipement avec lien
  const renderEquipementCell = (value: string, row: any) => {
    if (value === '-') return value;
    const eqInfo = row.equipement_id ? equipementPortsInfo[row.equipement_id] : null;
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-pointer text-primary hover:underline">
              {value}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            {eqInfo ? (
              <div className="text-sm">
                <p>Ports total: {eqInfo.total}</p>
                <p>Ports configurés: {eqInfo.configures}</p>
                <p>Ports libres: {eqInfo.libres}</p>
              </div>
            ) : (
              <p>Voir les détails de l'équipement</p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

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

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Gestion des ports"
          description="Configuration et gestion des ports réseau"
          icon={<Plug className="h-6 w-6 text-primary" />}
          breadcrumbs={[
            { label: "Tableau de bord", href: "/" },
            { label: "Ports" },
          ]}
          actions={
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un port
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Ajouter un nouveau port</DialogTitle>
                  <DialogDescription>
                    Configurez un nouveau port sur un équipement réseau.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    {/* Sélection de l'équipement */}
                    <FormField
                      control={form.control}
                      name="equipement_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Équipement *</FormLabel>
                          <Popover open={equipementComboboxOpen} onOpenChange={setEquipementComboboxOpen}>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className={cn(
                                    "w-full justify-between",
                                    !field.value && "text-muted-foreground"
                                  )}
                                  disabled={isLoadingEquipements}
                                >
                                  {field.value
                                    ? equipements.find((eq) => eq.id === field.value)?.name || "Sélectionner un équipement"
                                    : "Sélectionner un équipement"}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0" align="start">
                              <Command>
                                <CommandInput placeholder="Rechercher un équipement..." />
                                <CommandList>
                                  <CommandEmpty>Aucun équipement trouvé.</CommandEmpty>
                                  <CommandGroup>
                                    {equipements.filter(eq => !(eq as any).deleted_at).map((eq) => {
                                      const eqInfo = equipementPortsInfo[eq.id];
                                      const hasPortsAvailable = eqInfo && eqInfo.libres > 0;
                                      return (
                                        <CommandItem
                                          key={eq.id}
                                          value={eq.name}
                                          onSelect={() => {
                                            field.onChange(eq.id);
                                            setEquipementComboboxOpen(false);
                                          }}
                                          className={cn(!hasPortsAvailable && "opacity-50")}
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              eq.id === field.value ? "opacity-100" : "opacity-0"
                                            )}
                                          />
                                          <div className="flex flex-col">
                                            <span>{eq.name}</span>
                                            <span className={`text-xs ${hasPortsAvailable ? 'text-muted-foreground' : 'text-red-500'}`}>
                                              {eqInfo ? `${eqInfo.libres}/${eqInfo.total} ports libres` : 'Ports non définis'}
                                            </span>
                                          </div>
                                        </CommandItem>
                                      );
                                    })}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Alerte si pas de ports libres */}
                    {selectedEquipementId && !hasFreePorts && (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Cet équipement n'a plus de ports libres disponibles ({selectedEquipementInfo?.configures}/{selectedEquipementInfo?.total} configurés).
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Info ports disponibles */}
                    {selectedEquipementId && hasFreePorts && selectedEquipementInfo && (
                      <Alert>
                        <AlertDescription className="text-sm">
                          Ports disponibles: {selectedEquipementInfo.libres}/{selectedEquipementInfo.total} ({selectedEquipementInfo.configures} configurés)
                        </AlertDescription>
                      </Alert>
                    )}

                    <FormField
                      control={form.control}
                      name="port_label"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Label du port <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Gi0/1, P1, P2" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="vlan"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>VLAN</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: VLAN-10" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="speed"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Vitesse</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ""}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionner" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Auto">Auto-négociation</SelectItem>
                                <SelectItem value="10 Mbps">10 Mbps</SelectItem>
                                <SelectItem value="100 Mbps">100 Mbps</SelectItem>
                                <SelectItem value="1 Gbps">1 Gbps</SelectItem>
                                <SelectItem value="2.5 Gbps">2.5 Gbps</SelectItem>
                                <SelectItem value="5 Gbps">5 Gbps</SelectItem>
                                <SelectItem value="10 Gbps">10 Gbps</SelectItem>
                                <SelectItem value="25 Gbps">25 Gbps</SelectItem>
                                <SelectItem value="40 Gbps">40 Gbps</SelectItem>
                                <SelectItem value="100 Gbps">100 Gbps</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="port_genre"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Genre de port</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || "downlink"}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner le genre" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="downlink">Downlink (par défaut)</SelectItem>
                              <SelectItem value="uplink">Uplink</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="poe_enabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>PoE (Power over Ethernet)</FormLabel>
                            <p className="text-sm text-muted-foreground">
                              Activer l'alimentation électrique via le câble réseau
                            </p>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                        Annuler
                      </Button>
                      <Button type="submit" disabled={selectedEquipementId ? !hasFreePorts : false}>
                        Ajouter
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          }
        />

        {isLoadingPorts || isLoadingEquipements ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <DataTableEnhanced
              title={`${tableData.length} port${tableData.length > 1 ? 's' : ''} configuré${tableData.length > 1 ? 's' : ''}`}
              columns={["Label", "Équipement", "Genre", "PoE", "VLAN", "Vitesse", "Status"]}
              data={tableData}
              onRowClick={handleRowClick}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onRestore={handleRestore}
              deleteConfirmTitle="Supprimer le port"
              deleteConfirmDescription="Êtes-vous sûr de vouloir supprimer ce port ? Le port sera marqué comme supprimé mais pourra être restauré."
              restoreConfirmTitle="Restaurer le port"
              restoreConfirmDescription="Êtes-vous sûr de vouloir restaurer ce port ?"
              statusColumn="Status"
              deletedStatus="Supprimé"
              customCellRenderers={{
                "Label": renderLabelCell,
                "PoE": renderPoeCell,
                "Équipement": renderEquipementCell,
                "Genre": renderGenreCell,
                "Status": renderStatusCell,
              }}
              customFilters={
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">Équipement:</span>
                    <Select value={equipementFilter} onValueChange={setEquipementFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Tous" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous</SelectItem>
                        {equipements.filter(eq => !(eq as any).deleted_at).map((eq) => (
                          <SelectItem key={eq.id} value={eq.name}>
                            {eq.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">PoE:</span>
                    <Select value={poeFilter} onValueChange={setPoeFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Tous" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous</SelectItem>
                        <SelectItem value="Oui">Activé</SelectItem>
                        <SelectItem value="Non">Désactivé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">Statut:</span>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Tous" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous</SelectItem>
                        <SelectItem value="Actif">Actif</SelectItem>
                        <SelectItem value="Supprimé">Supprimé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              }
            />

            <DetailsModal
              open={isDetailsOpen}
              onOpenChange={setIsDetailsOpen}
              title="Détails du port"
              data={formatPortForModal(selectedPort)}
              onEdit={() => {
                setIsDetailsOpen(false);
                setIsEditOpen(true);
              }}
              onDelete={selectedPort ? () => handleDelete(selectedPort.id) : undefined}
            />

            <EditModal
              open={isEditOpen}
              onOpenChange={setIsEditOpen}
              title="Modifier le port"
              data={formatPortForModal(selectedPort)}
              onSave={handleSave}
              fields={[
                { key: "port_label", label: "Label du port", type: "text", required: true },
                {
                  key: "equipement_id",
                  label: "Équipement",
                  type: "select",
                  required: true,
                  options: equipements.filter(eq => !(eq as any).deleted_at).map(eq => ({
                    value: eq.id.toString(),
                    label: eq.name
                  }))
                },
                {
                  key: "speed",
                  label: "Vitesse",
                  type: "select",
                  options: [
                    { value: "Auto", label: "Auto-négociation" },
                    { value: "10 Mbps", label: "10 Mbps" },
                    { value: "100 Mbps", label: "100 Mbps" },
                    { value: "1 Gbps", label: "1 Gbps" },
                    { value: "2.5 Gbps", label: "2.5 Gbps" },
                    { value: "5 Gbps", label: "5 Gbps" },
                    { value: "10 Gbps", label: "10 Gbps" },
                    { value: "25 Gbps", label: "25 Gbps" },
                    { value: "40 Gbps", label: "40 Gbps" },
                    { value: "100 Gbps", label: "100 Gbps" },
                  ]
                },
                {
                  key: "poe_enabled",
                  label: "PoE",
                  type: "select",
                  options: [
                    { value: "true", label: "Activé" },
                    { value: "false", label: "Désactivé" },
                  ]
                },
                {
                  key: "type_reseau",
                  label: "Type réseau",
                  type: "select",
                  options: [
                    { value: "IT", label: "IT" },
                    { value: "OT", label: "OT" },
                  ]
                },
                {
                  key: "statut",
                  label: "Statut",
                  type: "select",
                  options: [
                    { value: "actif", label: "Actif" },
                    { value: "inactif", label: "Inactif" },
                    { value: "reserve", label: "Réservé" },
                  ]
                },
                {
                  key: "port_genre",
                  label: "Genre de port",
                  type: "select",
                  options: [
                    { value: "downlink", label: "Downlink" },
                    { value: "uplink", label: "Uplink" },
                  ]
                },
                { key: "uplink", label: "Uplink (source)", type: "text" },
                { key: "downlink", label: "Downlink (destination)", type: "text" },
                { key: "vlan", label: "VLAN", type: "text" },
              ]}
            />
          </>
        )}
      </div>
    </AppShell>
  );
};

export default Ports;
