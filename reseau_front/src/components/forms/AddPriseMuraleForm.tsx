import { useState, useMemo, useEffect, useCallback } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useData } from "@/contexts/DataContext";
import { Check, ChevronsUpDown, Plus, Trash2, Loader2, Cable, DoorOpen, Server } from "lucide-react";
import { cn } from "@/lib/utils";
import priseMuraleService from "@/services/priseMuraleService";

// ==========================================
// SCHEMAS ZOD
// ==========================================

const portConnectionSchema = z.object({
  switch_port_id: z.number({ required_error: "Le port du switch est requis" }),
  liaison_media: z.string().optional(),
  liaison_length: z.number().min(0).optional(),
});

const priseMuraleFormSchema = z.object({
  mode: z.enum(["single", "bulk"]),
  // Champs partagés
  salle_id: z.number({ required_error: "La salle est requise" }),
  type_prise: z.enum(["RJ45", "Fibre", "Coaxial"], { required_error: "Le type de prise est requis" }),
  switch_id: z.number({ required_error: "Le switch est requis" }),
  // Mode single
  name: z.string().optional(),
  emplacement: z.string().optional(),
  ports: z.array(portConnectionSchema).optional(),
  // Mode bulk
  nombre_ports_par_prise: z.number().min(1).default(1),
  liaison_media_global: z.string().optional(),
  liaison_length_global: z.number().min(0).optional(),
  prises: z.array(z.object({
    name: z.string().min(1, "Le nom est requis"),
    emplacement: z.string().optional(),
    ports: z.array(z.object({
      switch_port_id: z.number().optional(),
    })),
  })).optional(),
}).superRefine((data, ctx) => {
  if (data.mode === "single") {
    if (!data.name || data.name.length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Le nom est requis", path: ["name"] });
    }
    if (!data.ports || data.ports.length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Au moins un port est requis", path: ["ports"] });
    }
  }
  if (data.mode === "bulk") {
    if (!data.prises || data.prises.length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Au moins une prise est requise", path: ["prises"] });
    }
    // Vérifier que tous les ports switch sont renseignés
    data.prises?.forEach((prise, pi) => {
      prise.ports?.forEach((port, porti) => {
        if (!port.switch_port_id) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Le port du switch est requis",
            path: ["prises", pi, "ports", porti, "switch_port_id"],
          });
        }
      });
    });
  }
});

type PriseMuraleFormData = z.infer<typeof priseMuraleFormSchema>;

interface AddPriseMuraleFormProps {
  onSubmitSuccess: () => void;
}

// ==========================================
// COMPOSANT PRINCIPAL
// ==========================================

export default function AddPriseMuraleForm({ onSubmitSuccess }: AddPriseMuraleFormProps) {
  const { toast } = useToast();
  const { salles, batiments, equipements, ports, liaisons } = useData();

  const [salleComboboxOpen, setSalleComboboxOpen] = useState(false);
  const [switchComboboxOpen, setSwitchComboboxOpen] = useState(false);
  const [bulkQuantity, setBulkQuantity] = useState(5);

  const form = useForm<PriseMuraleFormData>({
    resolver: zodResolver(priseMuraleFormSchema),
    defaultValues: {
      mode: "single",
      salle_id: undefined,
      type_prise: "RJ45",
      switch_id: undefined,
      name: "",
      emplacement: "",
      ports: [{ switch_port_id: undefined as any, liaison_media: "", liaison_length: undefined }],
      nombre_ports_par_prise: 1,
      liaison_media_global: "",
      liaison_length_global: undefined,
      prises: [],
    },
  });

  const { isSubmitting } = form.formState;

  // Field arrays
  const { fields: singlePortFields, append: appendSinglePort, remove: removeSinglePort } =
    useFieldArray({ control: form.control, name: "ports" });

  const { fields: bulkPriseFields, append: appendBulkPrise, remove: removeBulkPrise, replace: replaceBulkPrises } =
    useFieldArray({ control: form.control, name: "prises" });

  // ==========================================
  // DONNÉES DÉRIVÉES
  // ==========================================

  const mode = form.watch("mode");
  const selectedSalleId = form.watch("salle_id");
  const selectedSwitchId = form.watch("switch_id");
  const nombrePortsParPrise = form.watch("nombre_ports_par_prise");

  const selectedSalle = useMemo(() => {
    if (!selectedSalleId || !salles) return null;
    return salles.find(s => s.id === selectedSalleId);
  }, [selectedSalleId, salles]);

  const selectedSalleBatiment = useMemo(() => {
    if (!selectedSalle?.batiment_id || !batiments) return null;
    return batiments.find(b => b.id === selectedSalle.batiment_id);
  }, [selectedSalle, batiments]);

  // Switches disponibles
  const switches = useMemo(() => {
    if (!equipements) return [];
    return equipements.filter(eq => eq.type === 'switch' && !eq.deleted_at);
  }, [equipements]);

  // Ports déjà utilisés dans des liaisons existantes
  const usedPortIds = useMemo(() => {
    const ids = new Set<number>();
    liaisons?.forEach(liaison => {
      if ((liaison as any).deleted_at) return;
      if (typeof liaison.from === 'number' && liaison.from > 0) ids.add(liaison.from);
      if (typeof liaison.to === 'number' && liaison.to > 0) ids.add(liaison.to);
    });
    return ids;
  }, [liaisons]);

  // Tous les ports du switch sélectionné (non utilisés dans des liaisons)
  const availableSwitchPorts = useMemo(() => {
    if (!selectedSwitchId || !ports) return [];
    return ports.filter(p =>
      p.equipement_id === selectedSwitchId &&
      !usedPortIds.has(p.id) &&
      !(p as any).deleted_at
    );
  }, [selectedSwitchId, ports, usedPortIds]);

  const totalSwitchPorts = useMemo(() => {
    if (!selectedSwitchId || !ports) return 0;
    return ports.filter(p => p.equipement_id === selectedSwitchId && !(p as any).deleted_at).length;
  }, [selectedSwitchId, ports]);

  // Collecter tous les switch_port_id sélectionnés dans le formulaire
  const allSelectedPortIds = useMemo(() => {
    const ids = new Set<number>();
    if (mode === "single") {
      const portsVal = form.getValues("ports");
      portsVal?.forEach(p => { if (p.switch_port_id) ids.add(p.switch_port_id); });
    } else {
      const prisesVal = form.getValues("prises");
      prisesVal?.forEach(prise => {
        prise.ports?.forEach(p => { if (p.switch_port_id) ids.add(p.switch_port_id); });
      });
    }
    return ids;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, form.watch("ports"), form.watch("prises")]);

  // Fonction pour obtenir les ports disponibles pour un sélecteur donné
  const getAvailablePortsFor = useCallback((currentValue?: number) => {
    return availableSwitchPorts.filter(p =>
      !allSelectedPortIds.has(p.id) || p.id === currentValue
    );
  }, [availableSwitchPorts, allSelectedPortIds]);

  // Compter les prises murales existantes dans la salle
  const prisesMuralesCountInSalle = useMemo(() => {
    if (!selectedSalleId || !equipements) return 0;
    return equipements.filter(
      eq => eq.type === 'prise_murale' && eq.salle_id === selectedSalleId && !eq.deleted_at
    ).length;
  }, [selectedSalleId, equipements]);

  // Auto-générer le nom en mode single
  useEffect(() => {
    if (mode === "single" && selectedSalle) {
      const count = prisesMuralesCountInSalle + 1;
      form.setValue("name", `PM-${selectedSalle.nom}-${String(count).padStart(2, '0')}`);
    }
  }, [mode, selectedSalle, prisesMuralesCountInSalle, form]);

  // Reset switch quand on change de mode
  useEffect(() => {
    form.setValue("switch_id", undefined as any);
    if (mode === "single") {
      form.setValue("ports", [{ switch_port_id: undefined as any, liaison_media: "", liaison_length: undefined }]);
      form.setValue("prises", []);
    } else {
      form.setValue("ports", []);
      form.setValue("prises", []);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // ==========================================
  // GÉNÉRATION BULK
  // ==========================================

  const generateBulkRows = () => {
    if (!selectedSalle || !bulkQuantity || bulkQuantity < 1) return;
    const nbPorts = nombrePortsParPrise || 1;
    const baseCount = prisesMuralesCountInSalle;
    const rows = Array.from({ length: bulkQuantity }, (_, i) => ({
      name: `PM-${selectedSalle.nom}-${String(baseCount + i + 1).padStart(2, '0')}`,
      emplacement: "",
      ports: Array.from({ length: nbPorts }, () => ({ switch_port_id: undefined as any })),
    }));
    replaceBulkPrises(rows);
  };

  // ==========================================
  // SUBMIT
  // ==========================================

  const onSubmit = async (data: PriseMuraleFormData) => {
    const batimentId = selectedSalle?.batiment_id;

    try {
      if (data.mode === "single") {
        await priseMuraleService.create({
          name: data.name!,
          salle_id: data.salle_id,
          batiment_id: batimentId,
          emplacement: data.emplacement,
          type_prise: data.type_prise,
          status: 'active',
          ports: data.ports!.map(p => ({
            switch_port_id: p.switch_port_id,
            liaison_media: p.liaison_media || undefined,
            liaison_length: p.liaison_length,
          })),
        });
        toast({
          title: "Prise murale ajoutée",
          description: `La prise ${data.name} a été créée avec succès.`,
        });
      } else {
        await priseMuraleService.createBulk({
          salle_id: data.salle_id,
          batiment_id: batimentId,
          type_prise: data.type_prise,
          status: 'active',
          prises: data.prises!.map(p => ({
            name: p.name,
            emplacement: p.emplacement || undefined,
            ports: p.ports.map(pp => ({
              switch_port_id: pp.switch_port_id!,
              liaison_media: data.liaison_media_global || undefined,
              liaison_length: data.liaison_length_global,
            })),
          })),
        });
        toast({
          title: "Prises murales ajoutées",
          description: `${data.prises!.length} prises murales créées avec succès.`,
        });
      }

      onSubmitSuccess();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error?.response?.data?.message || "Une erreur est survenue lors de la création.",
        variant: "destructive",
      });
    }
  };

  // ==========================================
  // COMPOSANT DE SÉLECTION DE PORT SWITCH (réutilisable)
  // ==========================================

  const SwitchPortSelector = ({ value, onChange, disabled }: {
    value?: number;
    onChange: (val: number) => void;
    disabled?: boolean;
  }) => {
    const [open, setOpen] = useState(false);
    const available = getAvailablePortsFor(value);
    const selectedPort = availableSwitchPorts.find(p => p.id === value);

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className={cn("w-full justify-between text-xs h-8", !value && "text-muted-foreground")}
            disabled={disabled || !selectedSwitchId}
          >
            {selectedPort ? selectedPort.port_label : "Port switch"}
            <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Rechercher..." className="h-8" />
            <CommandList>
              <CommandEmpty>Aucun port disponible.</CommandEmpty>
              <CommandGroup>
                {available.map((port) => (
                  <CommandItem
                    key={port.id}
                    value={port.port_label}
                    onSelect={() => {
                      onChange(port.id);
                      setOpen(false);
                    }}
                  >
                    <Check className={cn("mr-2 h-3 w-3", port.id === value ? "opacity-100" : "opacity-0")} />
                    {port.port_label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  };

  // ==========================================
  // RENDU
  // ==========================================

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Toggle Single / Bulk */}
        <Tabs
          value={mode}
          onValueChange={(val) => form.setValue("mode", val as "single" | "bulk")}
        >
          <TabsList className="w-full">
            <TabsTrigger value="single" className="flex-1">Unitaire</TabsTrigger>
            <TabsTrigger value="bulk" className="flex-1">En lot</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* ==========================================
            CHAMPS PARTAGÉS
            ========================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Salle */}
          <FormField
            control={form.control}
            name="salle_id"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="flex items-center gap-1.5">
                  <DoorOpen className="h-3.5 w-3.5 text-muted-foreground" />
                  Salle <span className="text-red-500">*</span>
                </FormLabel>
                <Popover open={salleComboboxOpen} onOpenChange={setSalleComboboxOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn("w-full justify-between", !field.value && "text-muted-foreground")}
                      >
                        {field.value ? selectedSalle?.nom || "Sélectionner" : "Sélectionner une salle"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Rechercher une salle..." />
                      <CommandList>
                        <CommandEmpty>Aucune salle trouvée.</CommandEmpty>
                        <CommandGroup>
                          {salles?.map((salle) => {
                            const bat = salle.batiment_id ? batiments?.find(b => b.id === salle.batiment_id) : null;
                            return (
                              <CommandItem
                                key={salle.id}
                                value={`${salle.nom} ${bat?.nom || ''}`}
                                onSelect={() => {
                                  field.onChange(salle.id);
                                  setSalleComboboxOpen(false);
                                }}
                              >
                                <Check className={cn("mr-2 h-4 w-4", salle.id === field.value ? "opacity-100" : "opacity-0")} />
                                <span>{salle.nom}</span>
                                {bat && <span className="ml-2 text-muted-foreground text-xs">({bat.nom})</span>}
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

          {/* Bâtiment (auto) */}
          <FormItem className="flex flex-col">
            <FormLabel>Bâtiment</FormLabel>
            <Input
              value={selectedSalleBatiment?.nom || ""}
              disabled
              placeholder="Sélectionner une salle"
              className="bg-muted"
            />
            <FormDescription className="text-xs">Défini par la salle</FormDescription>
          </FormItem>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Type de prise */}
          <FormField
            control={form.control}
            name="type_prise"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type de prise <span className="text-red-500">*</span></FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="RJ45">RJ45</SelectItem>
                    <SelectItem value="Fibre">Fibre</SelectItem>
                    <SelectItem value="Coaxial">Coaxial</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Switch */}
          <FormField
            control={form.control}
            name="switch_id"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="flex items-center gap-1.5">
                  <Server className="h-3.5 w-3.5 text-muted-foreground" />
                  Switch <span className="text-red-500">*</span>
                </FormLabel>
                <Popover open={switchComboboxOpen} onOpenChange={setSwitchComboboxOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn("w-full justify-between", !field.value && "text-muted-foreground")}
                      >
                        {field.value
                          ? switches.find(s => s.id === field.value)?.name || "Sélectionner"
                          : "Sélectionner un switch"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Rechercher un switch..." />
                      <CommandList>
                        <CommandEmpty>Aucun switch trouvé.</CommandEmpty>
                        <CommandGroup>
                          {switches.map((sw) => (
                            <CommandItem
                              key={sw.id}
                              value={`${sw.name} ${sw.equipement_code}`}
                              onSelect={() => {
                                field.onChange(sw.id);
                                setSwitchComboboxOpen(false);
                                // Reset port selections quand on change de switch
                                if (mode === "single") {
                                  const currentPorts = form.getValues("ports");
                                  currentPorts?.forEach((_, i) => {
                                    form.setValue(`ports.${i}.switch_port_id`, undefined as any);
                                  });
                                } else {
                                  const currentPrises = form.getValues("prises");
                                  currentPrises?.forEach((prise, pi) => {
                                    prise.ports?.forEach((_, porti) => {
                                      form.setValue(`prises.${pi}.ports.${porti}.switch_port_id`, undefined as any);
                                    });
                                  });
                                }
                              }}
                            >
                              <Check className={cn("mr-2 h-4 w-4", sw.id === field.value ? "opacity-100" : "opacity-0")} />
                              {sw.name} ({sw.equipement_code})
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {selectedSwitchId && (
                  <FormDescription className="text-xs">
                    {availableSwitchPorts.length}/{totalSwitchPorts} port{availableSwitchPorts.length > 1 ? 's' : ''} disponible{availableSwitchPorts.length > 1 ? 's' : ''}
                  </FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* ==========================================
            MODE SINGLE
            ========================================== */}
        {mode === "single" && (
          <>
            {/* Nom + Emplacement */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="PM-Salle-01" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">Auto-généré, modifiable</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="emplacement"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Emplacement</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Mur nord, près de la porte" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Ports de la prise */}
            <div className="border rounded-lg p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cable className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Ports de la prise</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendSinglePort({ switch_port_id: undefined as any, liaison_media: "", liaison_length: undefined })}
                  disabled={!selectedSwitchId || availableSwitchPorts.length <= allSelectedPortIds.size}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Ajouter un port
                </Button>
              </div>

              {singlePortFields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-[1fr_1fr_80px_32px] gap-2 items-end">
                  {/* Port switch */}
                  <FormField
                    control={form.control}
                    name={`ports.${index}.switch_port_id`}
                    render={({ field: portField }) => (
                      <FormItem>
                        {index === 0 && <FormLabel className="text-xs">Port switch <span className="text-red-500">*</span></FormLabel>}
                        <SwitchPortSelector
                          value={portField.value}
                          onChange={portField.onChange}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Type de câble */}
                  <FormField
                    control={form.control}
                    name={`ports.${index}.liaison_media`}
                    render={({ field: mediaField }) => (
                      <FormItem>
                        {index === 0 && <FormLabel className="text-xs">Type câble</FormLabel>}
                        <Select onValueChange={mediaField.onChange} value={mediaField.value || ""}>
                          <FormControl>
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Câble" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Cuivre Cat5e">Cat5e</SelectItem>
                            <SelectItem value="Cuivre Cat6">Cat6</SelectItem>
                            <SelectItem value="Cuivre Cat6a">Cat6a</SelectItem>
                            <SelectItem value="Fibre OM3">Fibre OM3</SelectItem>
                            <SelectItem value="Fibre OM4">Fibre OM4</SelectItem>
                            <SelectItem value="Fibre SM">Fibre SM</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Longueur */}
                  <FormField
                    control={form.control}
                    name={`ports.${index}.liaison_length`}
                    render={({ field: lenField }) => (
                      <FormItem>
                        {index === 0 && <FormLabel className="text-xs">m</FormLabel>}
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="0.1"
                            placeholder="m"
                            className="h-8 text-xs"
                            value={lenField.value ?? ""}
                            onChange={(e) => lenField.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Supprimer */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => removeSinglePort(index)}
                    disabled={singlePortFields.length <= 1}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ==========================================
            MODE BULK
            ========================================== */}
        {mode === "bulk" && (
          <>
            {/* Paramètres globaux */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <FormField
                control={form.control}
                name="nombre_ports_par_prise"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Ports/prise</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="4"
                        className="h-8 text-xs"
                        value={field.value}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="liaison_media_global"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Type câble</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Câble" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Cuivre Cat5e">Cat5e</SelectItem>
                        <SelectItem value="Cuivre Cat6">Cat6</SelectItem>
                        <SelectItem value="Cuivre Cat6a">Cat6a</SelectItem>
                        <SelectItem value="Fibre OM3">Fibre OM3</SelectItem>
                        <SelectItem value="Fibre OM4">Fibre OM4</SelectItem>
                        <SelectItem value="Fibre SM">Fibre SM</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="liaison_length_global"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Longueur (m)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.1"
                        placeholder="m"
                        className="h-8 text-xs"
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Quantité + Générer */}
              <div className="flex flex-col gap-1">
                <FormLabel className="text-xs">Quantité</FormLabel>
                <div className="flex gap-1">
                  <Input
                    type="number"
                    min="1"
                    max="50"
                    className="h-8 text-xs flex-1"
                    value={bulkQuantity}
                    onChange={(e) => setBulkQuantity(parseInt(e.target.value) || 1)}
                  />
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={generateBulkRows}
                    disabled={!selectedSalle}
                  >
                    Générer
                  </Button>
                </div>
              </div>
            </div>

            {/* Tableau des prises */}
            {bulkPriseFields.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted/50 border-b">
                        <th className="px-2 py-1.5 text-left font-medium w-8">#</th>
                        <th className="px-2 py-1.5 text-left font-medium">Nom</th>
                        <th className="px-2 py-1.5 text-left font-medium">Emplacement</th>
                        {Array.from({ length: nombrePortsParPrise || 1 }, (_, i) => (
                          <th key={i} className="px-2 py-1.5 text-left font-medium min-w-[140px]">
                            Port switch {i + 1} <span className="text-red-500">*</span>
                          </th>
                        ))}
                        <th className="px-2 py-1.5 w-8"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulkPriseFields.map((priseField, priseIndex) => (
                        <tr key={priseField.id} className="border-b last:border-b-0">
                          <td className="px-2 py-1.5 text-muted-foreground">{priseIndex + 1}</td>
                          <td className="px-2 py-1.5">
                            <FormField
                              control={form.control}
                              name={`prises.${priseIndex}.name`}
                              render={({ field }) => (
                                <Input className="h-7 text-xs" {...field} />
                              )}
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <FormField
                              control={form.control}
                              name={`prises.${priseIndex}.emplacement`}
                              render={({ field }) => (
                                <Input className="h-7 text-xs" placeholder="Optionnel" {...field} />
                              )}
                            />
                          </td>
                          {Array.from({ length: nombrePortsParPrise || 1 }, (_, portIndex) => (
                            <td key={portIndex} className="px-2 py-1.5">
                              <FormField
                                control={form.control}
                                name={`prises.${priseIndex}.ports.${portIndex}.switch_port_id`}
                                render={({ field: portField }) => (
                                  <SwitchPortSelector
                                    value={portField.value}
                                    onChange={portField.onChange}
                                  />
                                )}
                              />
                            </td>
                          ))}
                          <td className="px-2 py-1.5">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => removeBulkPrise(priseIndex)}
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Ajouter une ligne */}
                <div className="border-t p-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      const nbPorts = nombrePortsParPrise || 1;
                      const count = prisesMuralesCountInSalle + bulkPriseFields.length + 1;
                      appendBulkPrise({
                        name: `PM-${selectedSalle?.nom || 'Salle'}-${String(count).padStart(2, '0')}`,
                        emplacement: "",
                        ports: Array.from({ length: nbPorts }, () => ({ switch_port_id: undefined as any })),
                      });
                    }}
                    disabled={!selectedSalle}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Ajouter une prise
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ==========================================
            BOUTONS D'ACTION
            ========================================== */}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            {isSubmitting
              ? (mode === "bulk" ? "Création en cours..." : "Création...")
              : (mode === "bulk" ? `Créer ${bulkPriseFields.length} prise${bulkPriseFields.length > 1 ? 's' : ''}` : "Créer")
            }
          </Button>
        </div>
      </form>
    </Form>
  );
}
