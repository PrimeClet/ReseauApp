import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
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
import { Loader2, Plus, Cable, Check, ChevronsUpDown, ArrowRight, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

// Schema de validation pour l'ajout de liaison
const liaisonSchema = z.object({
  from: z.number().min(1, "Le port source est requis"),
  to: z.number().min(1, "Le port destination est requis"),
  label: z.string().min(1, "Le label est requis"),
  media: z.string().min(1, "Le type de média est requis"),
  length: z.number().optional().nullable(),
  status: z.boolean().optional(),
});

type LiaisonFormData = z.infer<typeof liaisonSchema>;

// Couleurs par type de média
const getMediaColor = (media: string) => {
  const mediaLower = media?.toLowerCase() || '';
  if (mediaLower.includes('cuivre') || mediaLower.includes('copper') || mediaLower.includes('rj45') || mediaLower.includes('cat')) {
    return {
      bg: "bg-amber-100 dark:bg-amber-900/50",
      text: "text-amber-800 dark:text-amber-200",
      border: "border-amber-300 dark:border-amber-700",
    };
  }
  if (mediaLower.includes('fibre') || mediaLower.includes('fiber') || mediaLower.includes('optique') || mediaLower.includes('optical')) {
    return {
      bg: "bg-blue-100 dark:bg-blue-900/50",
      text: "text-blue-800 dark:text-blue-200",
      border: "border-blue-300 dark:border-blue-700",
    };
  }
  if (mediaLower.includes('wifi') || mediaLower.includes('wireless') || mediaLower.includes('sans fil')) {
    return {
      bg: "bg-purple-100 dark:bg-purple-900/50",
      text: "text-purple-800 dark:text-purple-200",
      border: "border-purple-300 dark:border-purple-700",
    };
  }
  // Couleur par défaut
  return {
    bg: "bg-gray-100 dark:bg-gray-900/50",
    text: "text-gray-800 dark:text-gray-200",
    border: "border-gray-300 dark:border-gray-700",
  };
};

const Liaisons = () => {
  const { isAuthenticated, isLoading: isLoadingAuth } = useAuth();
  const navigate = useNavigate();
  const { liaisons, ports, equipements, isLoadingLiaisons, isLoadingPorts, isLoadingEquipements, addLiaison, updateLiaison, deleteLiaison, restoreLiaison, refetchLiaisons } = useData();
  const [selectedLiaison, setSelectedLiaison] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [fromPortComboboxOpen, setFromPortComboboxOpen] = useState(false);
  const [toPortComboboxOpen, setToPortComboboxOpen] = useState(false);

  // États pour la sélection hiérarchique équipement -> port
  const [selectedFromEquipement, setSelectedFromEquipement] = useState<number | null>(null);
  const [selectedToEquipement, setSelectedToEquipement] = useState<number | null>(null);
  const [fromEquipementComboboxOpen, setFromEquipementComboboxOpen] = useState(false);
  const [toEquipementComboboxOpen, setToEquipementComboboxOpen] = useState(false);

  // Filtres
  const [mediaFilter, setMediaFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Formulaire d'ajout
  const form = useForm<LiaisonFormData>({
    resolver: zodResolver(liaisonSchema),
    defaultValues: {
      from: undefined,
      to: undefined,
      label: "",
      media: "",
      length: null,
      status: true,
    },
  });

  // Équipements actifs (non supprimés)
  const activeEquipements = useMemo(() => {
    return equipements.filter(eq => !(eq as any).deleted_at);
  }, [equipements]);

  // Ports par équipement
  const portsByEquipement = useMemo(() => {
    const map: Record<number, typeof ports> = {};
    ports.filter(p => !(p as any).deleted_at).forEach(port => {
      if (!map[port.equipement_id]) {
        map[port.equipement_id] = [];
      }
      map[port.equipement_id].push(port);
    });
    return map;
  }, [ports]);

  // Ports disponibles pour l'équipement source sélectionné
  const fromEquipementPorts = useMemo(() => {
    if (!selectedFromEquipement) return [];
    return portsByEquipement[selectedFromEquipement] || [];
  }, [selectedFromEquipement, portsByEquipement]);

  // Ports disponibles pour l'équipement destination sélectionné
  const toEquipementPorts = useMemo(() => {
    if (!selectedToEquipement) return [];
    return portsByEquipement[selectedToEquipement] || [];
  }, [selectedToEquipement, portsByEquipement]);

  // Générer le label automatiquement quand les ports sont sélectionnés
  const selectedFromPort = form.watch("from");
  const selectedToPort = form.watch("to");
  const selectedMedia = form.watch("media");

  useEffect(() => {
    if (selectedFromPort && selectedToPort && selectedMedia) {
      const fromPort = ports.find(p => p.id === selectedFromPort);
      const toPort = ports.find(p => p.id === selectedToPort);
      const fromEq = fromPort ? equipements.find(eq => eq.id === fromPort.equipement_id) : null;
      const toEq = toPort ? equipements.find(eq => eq.id === toPort.equipement_id) : null;

      if (fromEq && toEq) {
        const mediaShort = selectedMedia.includes('Cuivre') ? 'Cu' :
                          selectedMedia.includes('Fibre') ? 'Fo' :
                          selectedMedia.includes('WiFi') ? 'Wi' : 'Lnk';
        const generatedLabel = `${fromEq.name}-${toEq.name}-${mediaShort}`;

        // Seulement mettre à jour si le label est vide ou correspond au pattern généré
        const currentLabel = form.getValues("label");
        if (!currentLabel || currentLabel.match(/^.+-.*-[A-Za-z]{2,3}$/)) {
          form.setValue("label", generatedLabel);
        }
      }
    }
  }, [selectedFromPort, selectedToPort, selectedMedia, ports, equipements, form]);

  // Reset le port quand on change d'équipement source
  useEffect(() => {
    form.setValue("from", undefined as any);
  }, [selectedFromEquipement]);

  // Reset le port quand on change d'équipement destination
  useEffect(() => {
    form.setValue("to", undefined as any);
  }, [selectedToEquipement]);

  // Préparer les données pour le tableau
  const tableData = useMemo(() => {
    let data = liaisons.map((liaison) => {
      const fromPort = ports.find(p => p.id === liaison.from);
      const toPort = ports.find(p => p.id === liaison.to);
      const fromEquipement = fromPort ? equipements.find(eq => eq.id === fromPort.equipement_id) : null;
      const toEquipement = toPort ? equipements.find(eq => eq.id === toPort.equipement_id) : null;
      const isDeleted = (liaison as any).deleted_at !== null && (liaison as any).deleted_at !== undefined;
      return {
        id: liaison.id,
        Nom: liaison.label || '-',
        "Port Source": fromPort ? `${fromPort.port_label} (${fromPort.device_name})` : '-',
        "Port Destination": toPort ? `${toPort.port_label} (${toPort.device_name})` : '-',
        Média: liaison.media || '-',
        "Longueur (m)": liaison.length ? `${liaison.length}` : '-',
        Actif: liaison.status ? 'Oui' : 'Non',
        Status: isDeleted ? "Supprimé" : "Actif",
        from: liaison.from,
        to: liaison.to,
        media: liaison.media,
        length: liaison.length,
        status: liaison.status,
        // Données supplémentaires pour les tooltips
        fromPortDetails: fromPort ? {
          label: fromPort.port_label,
          device: fromPort.device_name,
          type: fromPort.port_type,
          equipement: fromEquipement?.name || '-',
        } : null,
        toPortDetails: toPort ? {
          label: toPort.port_label,
          device: toPort.device_name,
          type: toPort.port_type,
          equipement: toEquipement?.name || '-',
        } : null,
      };
    });

    // Appliquer le filtre de média
    if (mediaFilter !== "all") {
      data = data.filter((item) => {
        const mediaLower = (item.Média || '').toLowerCase();
        if (mediaFilter === "cuivre") {
          return mediaLower.includes('cuivre') || mediaLower.includes('copper') || mediaLower.includes('rj45') || mediaLower.includes('cat');
        }
        if (mediaFilter === "fibre") {
          return mediaLower.includes('fibre') || mediaLower.includes('fiber') || mediaLower.includes('optique') || mediaLower.includes('optical');
        }
        if (mediaFilter === "wifi") {
          return mediaLower.includes('wifi') || mediaLower.includes('wireless') || mediaLower.includes('sans fil');
        }
        return true;
      });
    }

    // Appliquer le filtre de statut
    if (statusFilter !== "all") {
      data = data.filter((item) => item.Status === statusFilter);
    }

    return data;
  }, [liaisons, ports, mediaFilter, statusFilter]);

  useEffect(() => {
    if (!isLoadingAuth && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, isLoadingAuth, navigate]);

  const handleRowClick = (liaison: any) => {
    setSelectedLiaison(liaison);
    setIsDetailsOpen(true);
  };

  const handleEdit = (liaison: any) => {
    setSelectedLiaison(liaison);
    setIsEditOpen(true);
  };

  const handleSave = async (updatedLiaison: any) => {
    try {
      const dataToSave = {
        from: typeof updatedLiaison.from === 'string' ? parseInt(updatedLiaison.from, 10) : updatedLiaison.from,
        to: typeof updatedLiaison.to === 'string' ? parseInt(updatedLiaison.to, 10) : updatedLiaison.to,
        label: updatedLiaison.label,
        media: updatedLiaison.media,
        length: updatedLiaison.length ? parseInt(updatedLiaison.length, 10) : null,
        status: updatedLiaison.status === 'true' || updatedLiaison.status === true,
      };

      await updateLiaison(updatedLiaison.id, dataToSave);
      await refetchLiaisons();

      toast({
        title: "Liaison mise à jour",
        description: "Les informations de la liaison ont été enregistrées.",
      });
      setIsEditOpen(false);
      setSelectedLiaison(null);
    } catch (error) {
      console.error('Error saving liaison:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour de la liaison.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (liaisonId: number) => {
    try {
      await deleteLiaison(liaisonId);
      refetchLiaisons();
      toast({
        title: "Liaison supprimée",
        description: "La liaison a été supprimée avec succès.",
      });
      setIsDetailsOpen(false);
      setSelectedLiaison(null);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression de la liaison.",
        variant: "destructive",
      });
    }
  };

  const handleRestore = async (liaisonId: number) => {
    try {
      await restoreLiaison(liaisonId);
      refetchLiaisons();
      toast({
        title: "Liaison restaurée",
        description: "La liaison a été restaurée avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la restauration de la liaison.",
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (data: LiaisonFormData) => {
    try {
      await addLiaison({
        from: data.from,
        to: data.to,
        label: data.label,
        media: data.media,
        length: data.length || undefined,
        status: data.status ?? true,
      });

      toast({
        title: "Liaison ajoutée",
        description: "La liaison a été ajoutée avec succès.",
      });

      form.reset();
      setSelectedFromEquipement(null);
      setSelectedToEquipement(null);
      setIsAddOpen(false);
      refetchLiaisons();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error?.response?.data?.message || "Une erreur est survenue lors de l'ajout de la liaison.",
        variant: "destructive",
      });
    }
  };

  // Reset du formulaire quand on ferme le modal
  const handleCloseAddModal = (open: boolean) => {
    if (!open) {
      form.reset();
      setSelectedFromEquipement(null);
      setSelectedToEquipement(null);
    }
    setIsAddOpen(open);
  };

  // Préparer les données pour les modals (format attendu)
  const formatLiaisonForModal = (liaison: any) => {
    if (!liaison) return null;
    const originalLiaison = liaisons.find(l => l.id === liaison.id) || liaison;
    const fromPort = ports.find(p => p.id === originalLiaison.from);
    const toPort = ports.find(p => p.id === originalLiaison.to);
    return {
      id: originalLiaison.id,
      label: originalLiaison.label,
      from: originalLiaison.from,
      to: originalLiaison.to,
      from_port: fromPort ? `${fromPort.port_label} (${fromPort.device_name})` : null,
      to_port: toPort ? `${toPort.port_label} (${toPort.device_name})` : null,
      media: originalLiaison.media,
      length: originalLiaison.length,
      status: originalLiaison.status,
    };
  };

  // Rendu personnalisé pour la colonne Média avec badge coloré
  const renderMediaCell = (value: string) => {
    const colors = getMediaColor(value);
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${colors.bg} ${colors.text} ${colors.border}`}>
        {value}
      </span>
    );
  };

  // Rendu personnalisé pour la colonne Actif
  const renderActifCell = (value: string) => {
    const isActif = value === 'Oui';
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        isActif
          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      }`}>
        {value}
      </span>
    );
  };

  // Rendu personnalisé pour les ports avec tooltip au survol
  const renderPortSourceCell = (value: string, row: any) => {
    const details = row.fromPortDetails;
    if (!details) return <span className="text-muted-foreground">-</span>;

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-help border-b border-dotted border-muted-foreground hover:border-primary transition-colors">
            {value}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1 text-sm">
            <div className="font-semibold text-primary">Port Source</div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
              <span className="text-muted-foreground">Label:</span>
              <span>{details.label}</span>
              <span className="text-muted-foreground">Device:</span>
              <span>{details.device}</span>
              <span className="text-muted-foreground">Type:</span>
              <span>{details.type || '-'}</span>
              <span className="text-muted-foreground">Équipement:</span>
              <span>{details.equipement}</span>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    );
  };

  const renderPortDestinationCell = (value: string, row: any) => {
    const details = row.toPortDetails;
    if (!details) return <span className="text-muted-foreground">-</span>;

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-help border-b border-dotted border-muted-foreground hover:border-primary transition-colors">
            {value}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1 text-sm">
            <div className="font-semibold text-primary">Port Destination</div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
              <span className="text-muted-foreground">Label:</span>
              <span>{details.label}</span>
              <span className="text-muted-foreground">Device:</span>
              <span>{details.device}</span>
              <span className="text-muted-foreground">Type:</span>
              <span>{details.type || '-'}</span>
              <span className="text-muted-foreground">Équipement:</span>
              <span>{details.equipement}</span>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    );
  };

  // Liste des ports actifs (non supprimés)
  const activePorts = useMemo(() => {
    return ports.filter(p => !(p as any).deleted_at);
  }, [ports]);

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
          title="Gestion des Liaisons"
          description="Configuration et gestion des liaisons réseau"
          icon={<Cable className="h-6 w-6 text-primary" />}
          breadcrumbs={[
            { label: "Tableau de bord", href: "/" },
            { label: "Liaisons" },
          ]}
          actions={
            <Dialog open={isAddOpen} onOpenChange={handleCloseAddModal}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter une liaison
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Ajouter une nouvelle liaison</DialogTitle>
                  <DialogDescription>
                    Sélectionnez les équipements, les ports, puis le type de liaison.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Étape 1: Type de média */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">1. Type de liaison *</Label>
                      <FormField
                        control={form.control}
                        name="media"
                        render={({ field }) => (
                          <FormItem>
                            <Select onValueChange={field.onChange} value={field.value || ""}>
                              <FormControl>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Sélectionner le type de liaison" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Cuivre Cat5e">
                                  <span className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                    Cuivre Cat5e
                                  </span>
                                </SelectItem>
                                <SelectItem value="Cuivre Cat6">
                                  <span className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                    Cuivre Cat6
                                  </span>
                                </SelectItem>
                                <SelectItem value="Cuivre Cat6a">
                                  <span className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                    Cuivre Cat6a
                                  </span>
                                </SelectItem>
                                <SelectItem value="Fibre Monomode">
                                  <span className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                    Fibre Monomode
                                  </span>
                                </SelectItem>
                                <SelectItem value="Fibre Multimode">
                                  <span className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                    Fibre Multimode
                                  </span>
                                </SelectItem>
                                <SelectItem value="WiFi 2.4GHz">
                                  <span className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                                    WiFi 2.4GHz
                                  </span>
                                </SelectItem>
                                <SelectItem value="WiFi 5GHz">
                                  <span className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                                    WiFi 5GHz
                                  </span>
                                </SelectItem>
                                <SelectItem value="WiFi 6">
                                  <span className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                                    WiFi 6
                                  </span>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Étape 2: Sélection Source et Destination côte à côte */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Colonne Source */}
                      <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
                        <Label className="text-sm font-medium text-primary">2. Source</Label>

                        {/* Équipement source */}
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Équipement</Label>
                          <Popover open={fromEquipementComboboxOpen} onOpenChange={setFromEquipementComboboxOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                  "w-full justify-between text-sm",
                                  !selectedFromEquipement && "text-muted-foreground"
                                )}
                                disabled={isLoadingEquipements}
                              >
                                {selectedFromEquipement
                                  ? activeEquipements.find((eq) => eq.id === selectedFromEquipement)?.name
                                  : "Choisir équipement"}
                                <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[200px] p-0" align="start">
                              <Command>
                                <CommandInput placeholder="Rechercher..." className="text-sm" />
                                <CommandList>
                                  <CommandEmpty>Aucun équipement.</CommandEmpty>
                                  <CommandGroup>
                                    {activeEquipements.map((eq) => (
                                      <CommandItem
                                        key={eq.id}
                                        value={eq.name}
                                        onSelect={() => {
                                          setSelectedFromEquipement(eq.id);
                                          setFromEquipementComboboxOpen(false);
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-3 w-3",
                                            eq.id === selectedFromEquipement ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                        <span className="text-sm">{eq.name}</span>
                                        <span className="ml-auto text-xs text-muted-foreground">
                                          {(portsByEquipement[eq.id] || []).length} ports
                                        </span>
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>

                        {/* Port source */}
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Port</Label>
                          <FormField
                            control={form.control}
                            name="from"
                            render={({ field }) => (
                              <FormItem>
                                <Popover open={fromPortComboboxOpen} onOpenChange={setFromPortComboboxOpen}>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        variant="outline"
                                        role="combobox"
                                        className={cn(
                                          "w-full justify-between text-sm",
                                          !field.value && "text-muted-foreground"
                                        )}
                                        disabled={!selectedFromEquipement || fromEquipementPorts.length === 0}
                                      >
                                        {field.value
                                          ? fromEquipementPorts.find((p) => p.id === field.value)?.port_label
                                          : selectedFromEquipement
                                            ? fromEquipementPorts.length > 0
                                              ? "Choisir port"
                                              : "Aucun port"
                                            : "Choisir équipement d'abord"}
                                        <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-[200px] p-0" align="start">
                                    <Command>
                                      <CommandInput placeholder="Rechercher..." className="text-sm" />
                                      <CommandList>
                                        <CommandEmpty>Aucun port disponible.</CommandEmpty>
                                        <CommandGroup>
                                          {fromEquipementPorts.map((port) => (
                                            <CommandItem
                                              key={port.id}
                                              value={port.port_label}
                                              onSelect={() => {
                                                field.onChange(port.id);
                                                setFromPortComboboxOpen(false);
                                              }}
                                            >
                                              <Check
                                                className={cn(
                                                  "mr-2 h-3 w-3",
                                                  port.id === field.value ? "opacity-100" : "opacity-0"
                                                )}
                                              />
                                              <div className="flex flex-col">
                                                <span className="text-sm font-medium">{port.port_label}</span>
                                                <span className="text-xs text-muted-foreground">{port.device_name}</span>
                                              </div>
                                            </CommandItem>
                                          ))}
                                        </CommandGroup>
                                      </CommandList>
                                    </Command>
                                  </PopoverContent>
                                </Popover>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      {/* Flèche centrale */}
                      <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 hidden">
                        <ArrowRight className="h-5 w-5 text-muted-foreground" />
                      </div>

                      {/* Colonne Destination */}
                      <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
                        <Label className="text-sm font-medium text-primary">3. Destination</Label>

                        {/* Équipement destination */}
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Équipement</Label>
                          <Popover open={toEquipementComboboxOpen} onOpenChange={setToEquipementComboboxOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                  "w-full justify-between text-sm",
                                  !selectedToEquipement && "text-muted-foreground"
                                )}
                                disabled={isLoadingEquipements}
                              >
                                {selectedToEquipement
                                  ? activeEquipements.find((eq) => eq.id === selectedToEquipement)?.name
                                  : "Choisir équipement"}
                                <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[200px] p-0" align="start">
                              <Command>
                                <CommandInput placeholder="Rechercher..." className="text-sm" />
                                <CommandList>
                                  <CommandEmpty>Aucun équipement.</CommandEmpty>
                                  <CommandGroup>
                                    {activeEquipements.map((eq) => (
                                      <CommandItem
                                        key={eq.id}
                                        value={eq.name}
                                        onSelect={() => {
                                          setSelectedToEquipement(eq.id);
                                          setToEquipementComboboxOpen(false);
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-3 w-3",
                                            eq.id === selectedToEquipement ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                        <span className="text-sm">{eq.name}</span>
                                        <span className="ml-auto text-xs text-muted-foreground">
                                          {(portsByEquipement[eq.id] || []).length} ports
                                        </span>
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>

                        {/* Port destination */}
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Port</Label>
                          <FormField
                            control={form.control}
                            name="to"
                            render={({ field }) => (
                              <FormItem>
                                <Popover open={toPortComboboxOpen} onOpenChange={setToPortComboboxOpen}>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        variant="outline"
                                        role="combobox"
                                        className={cn(
                                          "w-full justify-between text-sm",
                                          !field.value && "text-muted-foreground"
                                        )}
                                        disabled={!selectedToEquipement || toEquipementPorts.length === 0}
                                      >
                                        {field.value
                                          ? toEquipementPorts.find((p) => p.id === field.value)?.port_label
                                          : selectedToEquipement
                                            ? toEquipementPorts.length > 0
                                              ? "Choisir port"
                                              : "Aucun port"
                                            : "Choisir équipement d'abord"}
                                        <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-[200px] p-0" align="start">
                                    <Command>
                                      <CommandInput placeholder="Rechercher..." className="text-sm" />
                                      <CommandList>
                                        <CommandEmpty>Aucun port disponible.</CommandEmpty>
                                        <CommandGroup>
                                          {toEquipementPorts.filter(p => p.id !== form.watch("from")).map((port) => (
                                            <CommandItem
                                              key={port.id}
                                              value={port.port_label}
                                              onSelect={() => {
                                                field.onChange(port.id);
                                                setToPortComboboxOpen(false);
                                              }}
                                            >
                                              <Check
                                                className={cn(
                                                  "mr-2 h-3 w-3",
                                                  port.id === field.value ? "opacity-100" : "opacity-0"
                                                )}
                                              />
                                              <div className="flex flex-col">
                                                <span className="text-sm font-medium">{port.port_label}</span>
                                                <span className="text-xs text-muted-foreground">{port.device_name}</span>
                                              </div>
                                            </CommandItem>
                                          ))}
                                        </CommandGroup>
                                      </CommandList>
                                    </Command>
                                  </PopoverContent>
                                </Popover>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Étape 3: Options */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">4. Options</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="label"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Nom de la liaison</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Généré automatiquement"
                                  {...field}
                                  className="text-sm"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="length"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Longueur (m)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="Ex: 10"
                                  {...field}
                                  value={field.value ?? ''}
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value, 10) : null)}
                                  className="text-sm"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel className="text-sm">Liaison active</FormLabel>
                              <p className="text-xs text-muted-foreground">
                                Activer ou désactiver cette liaison
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
                    </div>

                    <div className="flex justify-end space-x-2 pt-2">
                      <Button type="button" variant="outline" onClick={() => handleCloseAddModal(false)}>
                        Annuler
                      </Button>
                      <Button type="submit">
                        Ajouter
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          }
        />

        {isLoadingLiaisons || isLoadingPorts ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <DataTableEnhanced
              title={`${tableData.length} liaison${tableData.length > 1 ? 's' : ''} configurée${tableData.length > 1 ? 's' : ''}`}
              columns={["Nom", "Port Source", "Port Destination", "Média", "Longueur (m)", "Actif", "Status"]}
              data={tableData}
              onRowClick={handleRowClick}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onRestore={handleRestore}
              deleteConfirmTitle="Supprimer la liaison"
              deleteConfirmDescription="Êtes-vous sûr de vouloir supprimer cette liaison ? La liaison sera marquée comme supprimée mais pourra être restaurée."
              restoreConfirmTitle="Restaurer la liaison"
              restoreConfirmDescription="Êtes-vous sûr de vouloir restaurer cette liaison ?"
              statusColumn="Status"
              deletedStatus="Supprimé"
              customCellRenderers={{
                "Média": renderMediaCell,
                "Actif": renderActifCell,
                "Port Source": renderPortSourceCell,
                "Port Destination": renderPortDestinationCell,
              }}
              customFilters={
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">Média:</span>
                    <Select value={mediaFilter} onValueChange={setMediaFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Tous" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous</SelectItem>
                        <SelectItem value="cuivre">
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                            Cuivre
                          </span>
                        </SelectItem>
                        <SelectItem value="fibre">
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            Fibre
                          </span>
                        </SelectItem>
                        <SelectItem value="wifi">
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                            WiFi
                          </span>
                        </SelectItem>
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
              title="Détails de la liaison"
              data={formatLiaisonForModal(selectedLiaison)}
              onEdit={() => {
                setIsDetailsOpen(false);
                setIsEditOpen(true);
              }}
              onDelete={selectedLiaison ? () => handleDelete(selectedLiaison.id) : undefined}
            />

            <EditModal
              open={isEditOpen}
              onOpenChange={setIsEditOpen}
              title="Modifier la liaison"
              data={formatLiaisonForModal(selectedLiaison)}
              onSave={handleSave}
              fields={[
                { key: "label", label: "Nom", type: "text" },
                {
                  key: "media",
                  label: "Type de média",
                  type: "select",
                  options: [
                    { value: "Cuivre Cat5e", label: "Cuivre Cat5e" },
                    { value: "Cuivre Cat6", label: "Cuivre Cat6" },
                    { value: "Cuivre Cat6a", label: "Cuivre Cat6a" },
                    { value: "Fibre Monomode", label: "Fibre Monomode" },
                    { value: "Fibre Multimode", label: "Fibre Multimode" },
                    { value: "WiFi 2.4GHz", label: "WiFi 2.4GHz" },
                    { value: "WiFi 5GHz", label: "WiFi 5GHz" },
                    { value: "WiFi 6", label: "WiFi 6" },
                  ]
                },
                { key: "length", label: "Longueur (m)", type: "number" },
                {
                  key: "status",
                  label: "Actif",
                  type: "select",
                  options: [
                    { value: "true", label: "Oui" },
                    { value: "false", label: "Non" },
                  ]
                },
              ]}
            />
          </>
        )}
      </div>
    </AppShell>
  );
};

export default Liaisons;
