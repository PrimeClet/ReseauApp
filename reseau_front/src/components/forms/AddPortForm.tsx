import { useState, useEffect } from "react";
import type React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useData } from "@/contexts/DataContext";
import { useToast } from "@/hooks/use-toast";
import { Plus, Tag, Monitor, Loader2 } from "lucide-react";
import type { PortCreateData } from "@/services/portService";

const portSchema = z.object({
  port_label: z.string().min(1, "Le label du port est requis"),
  poe_enabled: z.boolean(),
  vlan: z.string().optional(),
  speed: z.string().optional(),
  type_reseau: z.enum(["IT", "OT"]).default("IT"),
  statut: z.enum(["actif", "inactif", "reserve"]).default("actif"),
  port_genre: z.enum(["uplink", "downlink"]).default("downlink"),
  uplink: z.string().optional(),
  downlink: z.string().optional(),
  equipement_id: z.number().min(1, "L'équipement est requis"),
});

type PortFormData = z.infer<typeof portSchema>;

interface AddPortFormProps {
  defaultCoffretId?: number;
  defaultEquipementId?: number;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

const AddPortForm = ({ defaultCoffretId, defaultEquipementId, onSuccess, trigger }: AddPortFormProps) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { addPort, refetchPorts, equipements, lans, ports, isLoadingEquipements } = useData();

  // Filtrer les équipements par coffret si defaultCoffretId est fourni
  const filteredEquipements = defaultCoffretId
    ? equipements.filter(e => e.coffret_id === defaultCoffretId)
    : equipements;

  const form = useForm<PortFormData>({
    resolver: zodResolver(portSchema),
    defaultValues: {
      port_label: "",
      poe_enabled: false,
      vlan: "",
      speed: "",
      type_reseau: "IT",
      statut: "actif",
      port_genre: "downlink",
      uplink: "",
      downlink: "",
      equipement_id: undefined,
    },
  });

  const { isSubmitting } = form.formState;

  // Handler pour la sélection d'équipement - génère automatiquement le label
  const handleEquipementChange = (value: string, fieldOnChange: (value: number) => void) => {
    const equipementId = parseInt(value);
    fieldOnChange(equipementId);

    // Trouver l'équipement sélectionné
    const equipement = equipements.find(e => e.id === equipementId);
    if (equipement) {
      // Compter les ports existants pour cet équipement
      const existingPorts = ports?.filter(p => p.equipement_id === equipementId).length || 0;
      const nextPortNumber = existingPorts + 1;

      // Format: Gi0/{numero} pour switch, P{numero} pour autres équipements
      const isSwitch = equipement.type?.toLowerCase() === 'switch';
      const generatedLabel = isSwitch
        ? `Gi0/${nextPortNumber}`
        : `P${String(nextPortNumber).padStart(2, '0')}`;

      form.setValue("port_label", generatedLabel);
    }
  };

  // Réinitialiser le formulaire avec les valeurs par défaut quand le modal s'ouvre
  useEffect(() => {
    if (open) {
      form.reset({
        port_label: "",
        poe_enabled: false,
        vlan: "",
        speed: "",
        type_reseau: "IT",
        statut: "actif",
        port_genre: "downlink",
        uplink: "",
        downlink: "",
        equipement_id: defaultEquipementId || undefined,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultEquipementId]);

  const onSubmit = async (data: PortFormData) => {
    try {
      const portData: PortCreateData = {
        port_label: data.port_label,
        device_name: data.port_label, // Utiliser le label du port comme device_name
        poe_enabled: data.poe_enabled,
        vlan: data.vlan || undefined,
        speed: data.speed || undefined,
        type_reseau: data.type_reseau,
        statut: data.statut,
        port_genre: data.port_genre,
        uplink: data.uplink || undefined,
        downlink: data.downlink || undefined,
        equipement_id: data.equipement_id,
      };

      await addPort(portData);
      toast({
        title: "Port ajouté",
        description: `Le port ${data.port_label} a été ajouté avec succès`,
      });
      form.reset();
      setOpen(false);
      refetchPorts();
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Une erreur est survenue lors de l'ajout du port",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => { if (!isSubmitting) setOpen(value); }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un port
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-[700px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Ajouter un nouveau port</DialogTitle>
          <DialogDescription>
            Remplissez les informations du nouveau port réseau.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <FormField
                control={form.control}
                name="equipement_id"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="flex items-center gap-1.5">
                      <Monitor className="h-3.5 w-3.5 text-muted-foreground" />
                      Équipement <span className="text-red-500">*</span>
                    </FormLabel>
                    <Select
                      onValueChange={(value) => handleEquipementChange(value, field.onChange)}
                      value={field.value?.toString()}
                      disabled={isLoadingEquipements}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner l'équipement" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredEquipements?.map((equipement) => (
                          <SelectItem key={equipement.id} value={equipement.id.toString()}>
                            {equipement.name} ({equipement.equipement_code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-xs min-h-[1.25rem]">
                      Équipement parent du port
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="port_label"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                      Label du port <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: P01, Gi0/1, Fa0/24" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs min-h-[1.25rem]">
                      Généré automatiquement, modifiable si nécessaire
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <FormField
                control={form.control}
                name="speed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vitesse</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner la vitesse" />
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

              <FormField
                control={form.control}
                name="poe_enabled"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PoE activé</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value === "true")}
                      value={field.value ? "true" : "false"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="true">Oui</SelectItem>
                        <SelectItem value="false">Non</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <FormField
                control={form.control}
                name="type_reseau"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="IT/OT" />
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
              <FormField
                control={form.control}
                name="statut"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Statut</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Statut" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="actif">Actif</SelectItem>
                        <SelectItem value="inactif">Inactif</SelectItem>
                        <SelectItem value="reserve">Réservé</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="port_genre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Genre de port</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Genre" />
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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <FormField
                control={form.control}
                name="uplink"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Uplink (source)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Port Gi0/1 du cœur" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="downlink"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Downlink (destination)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Prise murale 3B-12" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="vlan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>VLAN</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un VLAN" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {lans?.map((lan) => (
                        <SelectItem key={lan.id} value={lan.name}>
                          {lan.name} (VLAN {lan.vlan_id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => { if (!isSubmitting) setOpen(false); }} className="w-full sm:w-auto" disabled={isSubmitting}>
                Annuler
              </Button>
              <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                {isSubmitting ? "Ajout en cours..." : "Ajouter"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddPortForm;
