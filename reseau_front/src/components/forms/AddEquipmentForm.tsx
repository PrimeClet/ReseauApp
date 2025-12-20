import { useState, useEffect } from "react";
import type React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useToast } from "@/hooks/use-toast";
import { useData } from "@/contexts/DataContext";
import { Plus, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { EquipementCreateData } from "@/services/equipementService";

const equipmentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.string().min(1, "Type is required"),
  description: z.string().optional(),
  direction_in_out: z.string().optional(),
  vlan: z.string().optional(),
  ip_address: z.string().optional(),
  coffret_id: z.number().min(1, "Cabinet is required"),
  batiment_id: z.number().optional().nullable(),
  salle_id: z.number().optional().nullable(),
  status: z.enum(["active", "inactive", "maintenance"]),
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
  const { toast } = useToast();
  const { coffrets, batiments, salles, addEquipement, refetchEquipements, isLoadingCoffrets, isLoadingBatiments, isLoadingSalles } = useData();
  const [filteredSalles, setFilteredSalles] = useState(salles || []);

  const form = useForm<EquipmentFormData>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: {
      name: "",
      type: "",
      description: "",
      direction_in_out: "",
      vlan: "",
      ip_address: "",
      coffret_id: defaultCoffretId,
      batiment_id: undefined,
      salle_id: undefined,
      status: "active",
    },
  });

  // Observer le coffret sélectionné
  const selectedCoffretId = form.watch("coffret_id");

  // Réinitialiser le formulaire quand defaultCoffretId change
  useEffect(() => {
    if (defaultCoffretId && open) {
      form.setValue("coffret_id", defaultCoffretId);
    }
  }, [defaultCoffretId, open, form]);

  // Auto-remplir le bâtiment et la salle à partir du coffret sélectionné
  useEffect(() => {
    if (selectedCoffretId && coffrets) {
      const selectedCoffret = coffrets.find(c => c.id === selectedCoffretId);
      if (selectedCoffret) {
        // Utiliser batiment_id ou batiment.id selon ce qui est disponible
        const batimentId = selectedCoffret.batiment_id || selectedCoffret.batiment?.id;
        if (batimentId) {
          form.setValue("batiment_id", batimentId);
        } else {
          // Réinitialiser si le coffret n'a pas de bâtiment
          form.setValue("batiment_id", undefined);
        }
        
        // Utiliser salle_id ou salle.id selon ce qui est disponible
        const salleId = selectedCoffret.salle_id || selectedCoffret.salle?.id;
        if (salleId) {
          form.setValue("salle_id", salleId);
        } else {
          // Réinitialiser si le coffret n'a pas de salle
          form.setValue("salle_id", undefined);
        }
      }
    } else if (!selectedCoffretId) {
      // Si aucun coffret n'est sélectionné, réinitialiser les champs
      form.setValue("batiment_id", undefined);
      form.setValue("salle_id", undefined);
    }
  }, [selectedCoffretId, coffrets, form]);

  const selectedBatimentId = form.watch("batiment_id");

  // Filtrer les salles selon le bâtiment sélectionné
  useEffect(() => {
    if (selectedBatimentId && salles) {
      const filtered = salles.filter((salle) => salle.batiment_id === selectedBatimentId);
      setFilteredSalles(filtered);
      // Réinitialiser la salle si elle n'appartient pas au nouveau bâtiment
      const currentSalleId = form.getValues("salle_id");
      if (currentSalleId && !filtered.find((s) => s.id === currentSalleId)) {
        form.setValue("salle_id", undefined);
      }
    } else {
      setFilteredSalles(salles || []);
    }
  }, [selectedBatimentId, salles, form]);

  const onSubmit = async (data: EquipmentFormData) => {
    try {
      const equipementData: EquipementCreateData = {
        name: data.name,
        type: data.type,
        description: data.description || undefined,
        direction_in_out: data.direction_in_out || undefined,
        vlan: data.vlan || undefined,
        ip_address: data.ip_address || undefined,
        coffret_id: data.coffret_id,
        batiment_id: data.batiment_id || undefined,
        salle_id: data.salle_id || undefined,
        status: data.status,
      };

      await addEquipement(equipementData);
      
      toast({
        title: "Équipement ajouté",
        description: "Equipment has been added successfully",
      });
      
      form.reset({
        coffret_id: defaultCoffretId,
        status: "active",
      });
      setCoffretComboboxOpen(false);
      setOpen(false);
      refetchEquipements?.();
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error?.response?.data?.message || "An error occurred while adding the equipment",
        variant: "destructive",
      });
    }
  };

  const handleDialogOpenChange = (isOpen: boolean) => {
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
            Add equipment
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add new equipment</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Switch-001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="switch">Switch</SelectItem>
                        <SelectItem value="routeur">Routeur</SelectItem>
                        <SelectItem value="firewall">Firewall</SelectItem>
                        <SelectItem value="point-acces">Point d'accès</SelectItem>
                        <SelectItem value="serveur">Serveur</SelectItem>
                        <SelectItem value="autre">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="coffret_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cabinet *</FormLabel>
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
                                "Select cabinet"
                              : "Select cabinet"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Rechercher un coffret par nom ou code..." />
                          <CommandList>
                            <CommandEmpty>Aucun coffret trouvé.</CommandEmpty>
                            <CommandGroup>
                              {coffrets?.map((coffret) => (
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="batiment_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Building</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        if (value === "none") {
                          field.onChange(undefined);
                        } else {
                          field.onChange(parseInt(value));
                        }
                      }}
                      value={field.value?.toString() || "none"}
                      disabled={isLoadingBatiments}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select building (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Aucun</SelectItem>
                        {batiments?.map((batiment) => (
                          <SelectItem key={batiment.id} value={batiment.id.toString()}>
                            {batiment.nom}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="salle_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        if (value === "none") {
                          field.onChange(undefined);
                        } else {
                          field.onChange(parseInt(value));
                        }
                      }}
                      value={field.value?.toString() || "none"}
                      disabled={isLoadingSalles || !selectedBatimentId}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={selectedBatimentId ? "Select room (optional)" : "Select a building first"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Aucune</SelectItem>
                        {filteredSalles?.map((salle) => (
                          <SelectItem key={salle.id} value={salle.id.toString()}>
                            {salle.nom}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="ip_address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IP Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 192.168.1.10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
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

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Add</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
