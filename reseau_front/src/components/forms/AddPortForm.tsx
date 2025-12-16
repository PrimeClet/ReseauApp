import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useData } from "@/contexts/DataContext";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
import type { PortCreateData } from "@/services/portService";

const portSchema = z.object({
  port_label: z.string().min(1, "Le label du port est requis"),
  device_name: z.string().min(1, "Le nom de l'appareil est requis"),
  poe_enabled: z.boolean(),
  vlan: z.string().optional(),
  speed: z.string().optional(),
  equipement_id: z.number().min(1, "L'équipement est requis"),
  connected_equipment_id: z.number().optional().nullable(),
});

type PortFormData = z.infer<typeof portSchema>;

const AddPortForm = () => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { addPort, refetchPorts, equipements, isLoadingEquipements } = useData();

  const form = useForm<PortFormData>({
    resolver: zodResolver(portSchema),
    defaultValues: {
      port_label: "",
      device_name: "",
      poe_enabled: false,
      vlan: "",
      speed: "",
      equipement_id: undefined,
      connected_equipment_id: undefined,
    },
  });

  const onSubmit = async (data: PortFormData) => {
    try {
      const portData: PortCreateData = {
        port_label: data.port_label,
        device_name: data.device_name,
        poe_enabled: data.poe_enabled,
        vlan: data.vlan || undefined,
        speed: data.speed || undefined,
        equipement_id: data.equipement_id,
        connected_equipment_id: data.connected_equipment_id || undefined,
      };
      
      await addPort(portData);
      toast({
        title: "Port ajouté",
        description: `Le port ${data.port_label} a été ajouté avec succès`,
      });
      form.reset();
      setOpen(false);
      refetchPorts();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Une erreur est survenue lors de l'ajout du port",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un port
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Ajouter un nouveau port</DialogTitle>
          <DialogDescription>
            Remplissez les informations du nouveau port réseau.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="equipement_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Équipement *</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    value={field.value?.toString()}
                    disabled={isLoadingEquipements}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner l'équipement" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {equipements?.map((equipement) => (
                        <SelectItem key={equipement.id} value={equipement.id.toString()}>
                          {equipement.name} ({equipement.equipement_code})
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
              name="port_label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Label du port *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: P1, P2, Gi0/1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="device_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom de l'appareil *</FormLabel>
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
                        <SelectItem value="100 Mbps">100 Mbps</SelectItem>
                        <SelectItem value="1 Gbps">1 Gbps</SelectItem>
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

            <FormField
              control={form.control}
              name="vlan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>VLAN</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: VLAN-300" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="connected_equipment_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Équipement connecté (optionnel)</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      const numericValue = value === "none" ? undefined : parseInt(value);
                      field.onChange(numericValue);
                    }}
                    value={field.value?.toString() || "none"}
                    disabled={isLoadingEquipements}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner l'équipement connecté" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Aucun</SelectItem>
                      {equipements?.map((equipement) => (
                        <SelectItem key={equipement.id} value={equipement.id.toString()}>
                          {equipement.name} ({equipement.equipement_code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button type="submit">Ajouter</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddPortForm;
