import { useState, useEffect, useMemo } from "react";
import type React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Switch as SwitchUI } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useData } from "@/contexts/DataContext";
import { Plus, Check, ChevronsUpDown, Server, DoorOpen, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { EquipementCreateData } from "@/services/equipementService";
import AddPriseMuraleForm from "@/components/forms/AddPriseMuraleForm";

const equipmentSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  type: z.string().min(1, "Le type est requis"),
  modele: z.string().optional(),
  fabricant: z.string().optional(),
  numero_serie: z.string().optional(),
  type_reseau: z.enum(["IT", "OT"]).optional(),
  description: z.string().optional(),
  direction_in_out: z.string().optional(),
  vlan: z.string().optional(),
  ip_address: z.string().optional(),
  mac_address: z.string().regex(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/, "Format MAC invalide (ex: AA:BB:CC:DD:EE:FF)").optional().or(z.literal("")),
  coffret_id: z.number().optional(),
  salle_id: z.number().optional(),
  nombre_ports: z.number().min(0, "Le nombre de ports doit être positif").optional(),
  is_principal: z.boolean().default(false),
  is_manageable: z.boolean().default(false),
}).superRefine((data, ctx) => {
  // salle_id est requis pour les équipements standards (pas prise_murale, géré par son propre formulaire)
  if (data.type && data.type !== "prise_murale" && !data.salle_id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "La salle est requise",
      path: ["salle_id"],
    });
  }
});

type EquipmentFormData = z.infer<typeof equipmentSchema>;

interface AddEquipmentFormProps {
  defaultCoffretId?: number;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export default function AddEquipmentForm({ defaultCoffretId, onSuccess, trigger }: AddEquipmentFormProps) {
  const [open, setOpen] = useState(false);
  const [coffretComboboxOpen, setCoffretComboboxOpen] = useState(false);
  const [salleComboboxOpen, setSalleComboboxOpen] = useState(false);
  const [vlanComboboxOpen, setVlanComboboxOpen] = useState(false);
  const { toast } = useToast();
  const { coffrets, addEquipement, refetchEquipements, isLoadingCoffrets, batiments, salles, equipements, lans } = useData();

  const form = useForm<EquipmentFormData>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: {
      name: "",
      type: "",
      modele: "",
      fabricant: "",
      numero_serie: "",
      type_reseau: "IT",
      description: "",
      direction_in_out: "",
      vlan: "",
      ip_address: "",
      mac_address: "",
      coffret_id: defaultCoffretId,
      salle_id: undefined,
      nombre_ports: undefined,
      is_principal: false,
      is_manageable: false,
    },
  });

  // Récupérer le bâtiment automatiquement depuis la salle sélectionnée
  const selectedSalleId = form.watch("salle_id");
  const selectedSalle = useMemo(() => {
    if (!selectedSalleId || !salles) return null;
    return salles.find(s => s.id === selectedSalleId);
  }, [selectedSalleId, salles]);

  // Observer le type sélectionné
  const selectedType = form.watch("type");

  // Compter les équipements existants du même type dans la même salle
  const equipementsCountByTypeInSalle = useMemo(() => {
    if (!selectedSalleId || !selectedType || selectedType === "prise_murale" || !equipements) return 0;
    return equipements.filter(
      eq => eq.type === selectedType && eq.salle_id === selectedSalleId && !eq.deleted_at
    ).length;
  }, [selectedSalleId, selectedType, equipements]);

  // Générer automatiquement le nom pour les équipements standards
  useEffect(() => {
    if (selectedType && selectedType !== "prise_murale" && selectedSalle) {
      const prefixMap: Record<string, string> = {
        'switch': 'SW',
        'routeur': 'RT',
        'firewall': 'FW',
        'point-acces': 'AP',
        'serveur': 'SRV',
        'imprimante': 'IMP',
        'ordinateur-portable': 'LPT',
        'ordinateur-bureau': 'DSK',
        'autre': 'EQ'
      };
      const prefix = prefixMap[selectedType] || 'EQ';
      const count = equipementsCountByTypeInSalle + 1;
      const generatedName = `${prefix}-${selectedSalle.nom}-${String(count).padStart(2, '0')}`;
      form.setValue("name", generatedName);
    }
  }, [selectedType, selectedSalle, equipementsCountByTypeInSalle, form]);

  // Réinitialiser le formulaire quand defaultCoffretId change
  useEffect(() => {
    if (defaultCoffretId && open) {
      form.setValue("coffret_id", defaultCoffretId);
    }
  }, [defaultCoffretId, open, form]);

  // Auto-remplir la salle depuis l'armoire sélectionnée
  const selectedCoffretId = form.watch("coffret_id");
  const selectedCoffret = useMemo(() => {
    if (!selectedCoffretId || !coffrets) return null;
    return coffrets.find(c => c.id === selectedCoffretId);
  }, [selectedCoffretId, coffrets]);

  useEffect(() => {
    if (selectedCoffret?.salle_id) {
      // Si une armoire est sélectionnée, remplir automatiquement la salle
      form.setValue("salle_id", selectedCoffret.salle_id);
    }
    // Note: Si l'armoire est désélectionnée (selectedCoffretId devient undefined),
    // on ne réinitialise PAS la salle_id pour permettre de garder la sélection manuelle
  }, [selectedCoffret, form]);

  const onSubmit = async (data: EquipmentFormData) => {
    try {
      const equipementData: EquipementCreateData = {
        name: data.name,
        type: data.type,
        modele: data.modele || undefined,
        fabricant: data.fabricant || undefined,
        numero_serie: data.numero_serie || undefined,
        type_reseau: data.type_reseau || undefined,
        description: data.description || undefined,
        direction_in_out: data.direction_in_out || undefined,
        vlan: data.vlan || undefined,
        ip_address: data.ip_address || undefined,
        mac_address: data.mac_address || undefined,
        coffret_id: data.coffret_id || undefined,
        salle_id: data.salle_id || undefined,
        nombre_ports: data.nombre_ports || undefined,
        is_principal: data.type === 'switch' ? data.is_principal : false,
        is_manageable: data.type === 'switch' ? data.is_manageable : false,
        status: 'active',
      };

      await addEquipement(equipementData);

      toast({
        title: "Équipement ajouté",
        description: "L'équipement a été ajouté avec succès.",
      });

      form.reset({
        coffret_id: defaultCoffretId,
      });
      setCoffretComboboxOpen(false);
      setOpen(false);
      refetchEquipements?.();
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error?.response?.data?.message || "Une erreur est survenue lors de l'ajout.",
        variant: "destructive",
      });
    }
  };

  const handlePriseMuraleSuccess = () => {
    form.reset({ coffret_id: defaultCoffretId });
    setCoffretComboboxOpen(false);
    setOpen(false);
    refetchEquipements?.();
    onSuccess?.();
  };

  const { isSubmitting } = form.formState;

  const handleDialogOpenChange = (isOpen: boolean) => {
    if (isSubmitting) return;
    setOpen(isOpen);
    if (!isOpen) {
      setCoffretComboboxOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un équipement
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className={cn(
        "max-h-[90vh] overflow-y-auto p-4 sm:p-6",
        selectedType === "prise_murale"
          ? "max-w-[95vw] sm:max-w-[900px]"
          : "max-w-[95vw] sm:max-w-[700px]"
      )}>
        <DialogHeader>
          <DialogTitle>Ajouter un nouvel équipement</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Type et Nom sur la même ligne */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type <span className="text-red-500">*</span></FormLabel>
                    <Select onValueChange={(value) => {
                      field.onChange(value);
                      if (value !== "prise_murale") {
                        form.setValue("name", "");
                      }
                    }} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="switch">Switch</SelectItem>
                        <SelectItem value="routeur">Routeur</SelectItem>
                        <SelectItem value="firewall">Firewall</SelectItem>
                        <SelectItem value="point-acces">Point d'accès</SelectItem>
                        <SelectItem value="serveur">Serveur</SelectItem>
                        <SelectItem value="imprimante">Imprimante</SelectItem>
                        <SelectItem value="ordinateur-portable">Ordinateur portable</SelectItem>
                        <SelectItem value="ordinateur-bureau">Ordinateur de bureau</SelectItem>
                        <SelectItem value="prise_murale">Prise murale</SelectItem>
                        <SelectItem value="autre">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Nom - uniquement pour les équipements standards (non prise murale) */}
              {selectedType !== "prise_murale" && (
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Switch-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Champs pour équipements standards (non prise murale) */}
            {selectedType && selectedType !== "prise_murale" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* Armoire */}
                <FormField
                  control={form.control}
                  name="coffret_id"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="flex items-center gap-1.5">
                        <Server className="h-3.5 w-3.5 text-muted-foreground" />
                        Armoire
                      </FormLabel>
                      <Popover open={coffretComboboxOpen} onOpenChange={setCoffretComboboxOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between",
                                !field.value && "text-muted-foreground"
                              )}
                              disabled={isLoadingCoffrets}
                            >
                              {field.value
                                ? coffrets?.find((coffret) => coffret.id === field.value)?.nom ||
                                  coffrets?.find((coffret) => coffret.id === field.value)?.code ||
                                  "Sélectionner une armoire"
                                : "Sélectionner une armoire"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Rechercher une armoire par nom ou code..." />
                            <CommandList>
                              <CommandEmpty>Aucune armoire trouvée.</CommandEmpty>
                              <CommandGroup>
                                {coffrets?.filter(c => !(c as any).deleted_at).map((coffret) => (
                                  <CommandItem
                                    key={coffret.id}
                                    value={`${coffret.nom} ${coffret.code}`}
                                    onSelect={() => {
                                      field.onChange(coffret.id);
                                      setCoffretComboboxOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        coffret.id === field.value ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {coffret.nom || coffret.code}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormDescription className="text-xs min-h-[1.25rem]">
                        Optionnel - armoire contenant l'équipement
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                      {selectedCoffretId ? (
                        // Si une armoire est sélectionnée, afficher la salle en lecture seule
                        <FormControl>
                          <Input
                            value={selectedCoffret?.salle_id ? salles?.find(s => s.id === selectedCoffret.salle_id)?.nom || "" : ""}
                            disabled
                            placeholder="Définie par l'armoire"
                            className="bg-muted"
                          />
                        </FormControl>
                      ) : (
                        // Si pas d'armoire, permettre la sélection manuelle
                        <Popover open={salleComboboxOpen} onOpenChange={setSalleComboboxOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                  "w-full justify-between",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value
                                  ? salles?.find((s) => s.id === field.value)?.nom || "Sélectionner"
                                  : "Sélectionner une salle"}
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
                                    const batiment = salle.batiment_id ? batiments?.find(b => b.id === salle.batiment_id) : null;
                                    return (
                                      <CommandItem
                                        key={salle.id}
                                        value={`${salle.nom} ${batiment?.nom || ''}`}
                                        onSelect={() => {
                                          field.onChange(salle.id);
                                          setSalleComboboxOpen(false);
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            salle.id === field.value ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                        <span>{salle.nom}</span>
                                        {batiment && <span className="ml-2 text-muted-foreground text-xs">({batiment.nom})</span>}
                                      </CommandItem>
                                    );
                                  })}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      )}
                      <FormDescription className="text-xs min-h-[1.25rem]">
                        {selectedCoffretId ? "Définie par l'armoire sélectionnée" : "Requis - salle où se trouve l'équipement"}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Formulaire dédié aux prises murales */}
            {selectedType === "prise_murale" && (
              <AddPriseMuraleForm onSubmitSuccess={handlePriseMuraleSuccess} />
            )}

            {/* Champs spécifiques aux équipements standards (non prise murale) */}
            {selectedType !== "prise_murale" && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <FormField
                    control={form.control}
                    name="modele"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Modèle</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Catalyst 2960X" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="fabricant"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fabricant</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Cisco, HP, Huawei..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <FormField
                    control={form.control}
                    name="numero_serie"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Numéro de série</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: SN123456789" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="type_reseau"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type de réseau</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="IT">IT</SelectItem>
                            <SelectItem value="OT">OT</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <FormField
                    control={form.control}
                    name="ip_address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Adresse IP</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: 192.168.1.10" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="mac_address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Adresse MAC</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: AA:BB:CC:DD:EE:FF"
                            {...field}
                            className="font-mono"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <FormField
                    control={form.control}
                    name="vlan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>VLAN</FormLabel>
                        <Popover open={vlanComboboxOpen} onOpenChange={setVlanComboboxOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                  "w-full justify-between",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value
                                  ? lans?.find((lan) => `VLAN-${lan.vlan_id}` === field.value)?.name ||
                                    field.value
                                  : "Sélectionner un VLAN"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Rechercher un VLAN..." />
                              <CommandList>
                                <CommandEmpty>Aucun VLAN trouvé.</CommandEmpty>
                                <CommandGroup>
                                  {lans?.filter(lan => lan.status === 'active').map((lan) => (
                                    <CommandItem
                                      key={lan.id}
                                      value={`${lan.name} ${lan.vlan_id} ${lan.subnet}`}
                                      onSelect={() => {
                                        field.onChange(`VLAN-${lan.vlan_id}`);
                                        setVlanComboboxOpen(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          `VLAN-${lan.vlan_id}` === field.value ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      <div className="flex flex-col">
                                        <span className="font-medium">{lan.name}</span>
                                        <span className="text-xs text-muted-foreground">
                                          VLAN {lan.vlan_id} • {lan.subnet}
                                        </span>
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
                  <FormField
                    control={form.control}
                    name="nombre_ports"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre de ports</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            placeholder="Ex: 24"
                            {...field}
                            onChange={(e) => {
                              const value = e.target.value;
                              field.onChange(value === "" ? undefined : parseInt(value, 10));
                            }}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Options spécifiques aux switchs */}
                {selectedType === "switch" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <FormField
                      control={form.control}
                      name="is_manageable"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel className="text-sm">Switch manageable</FormLabel>
                            <FormDescription className="text-xs">
                              Switch avec interface de gestion (CLI, Web, etc.)
                            </FormDescription>
                          </div>
                          <FormControl>
                            <SwitchUI
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="is_principal"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel className="text-sm">Switch principal</FormLabel>
                            <FormDescription className="text-xs">
                              Définir comme switch principal de la baie
                            </FormDescription>
                          </div>
                          <FormControl>
                            <SwitchUI
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (optionnel)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Description de l'équipement..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {selectedType !== "prise_murale" && (
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:space-x-2 pt-2">
                <Button type="button" variant="outline" onClick={() => handleDialogOpenChange(false)} className="w-full sm:w-auto" disabled={isSubmitting}>
                  Annuler
                </Button>
                <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                  {isSubmitting ? "Ajout en cours..." : "Ajouter"}
                </Button>
              </div>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
