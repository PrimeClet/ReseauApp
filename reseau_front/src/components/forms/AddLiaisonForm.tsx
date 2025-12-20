import { useState } from "react";
import type React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useData } from "@/contexts/DataContext";
import { toast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";

const liaisonSchema = z.object({
  label: z.string().min(1, "Le label est requis"),
  media: z.string().min(1, "Le média est requis"),
  from_equipement_id: z.number().min(1, "L'équipement d'origine est requis"),
  to_equipement_id: z.number().min(1, "L'équipement de destination est requis"),
  from: z.number().min(1, "Le port d'origine est requis"),
  to: z.number().min(1, "Le port de destination est requis"),
  length: z.number().optional().nullable(),
  status: z.boolean().default(true),
});

type LiaisonFormData = z.infer<typeof liaisonSchema>;

interface AddLiaisonFormProps {
  defaultCoffretId?: number;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

const AddLiaisonForm = ({ defaultCoffretId, onSuccess, trigger }: AddLiaisonFormProps) => {
  const [open, setOpen] = useState(false);
  const { addLiaison, refetchLiaisons, ports, equipements, isLoadingPorts, liaisons } = useData();

  // Filtrer les équipements par coffret si defaultCoffretId est fourni
  const filteredEquipements = defaultCoffretId
    ? equipements.filter(e => e.coffret_id === defaultCoffretId)
    : equipements;

  // Récupérer tous les IDs de ports déjà utilisés dans les liaisons existantes
  const usedPortIds = new Set<number>();
  liaisons.forEach(liaison => {
    if (liaison.from) usedPortIds.add(liaison.from);
    if (liaison.to) usedPortIds.add(liaison.to);
  });

  const form = useForm<LiaisonFormData>({
    resolver: zodResolver(liaisonSchema),
    defaultValues: {
      label: "",
      media: "",
      from_equipement_id: undefined,
      to_equipement_id: undefined,
      from: undefined,
      to: undefined,
      length: undefined,
      status: true,
    }
  });

  // Observer les valeurs des équipements et ports pour réinitialiser les ports
  const fromEquipementId = form.watch("from_equipement_id");
  const toEquipementId = form.watch("to_equipement_id");
  const selectedFromPort = form.watch("from");
  const selectedToPort = form.watch("to");

  // Filtrer les ports selon les équipements sélectionnés et exclure les ports déjà utilisés
  // Aussi exclure le port de destination sélectionné pour éviter qu'un même port soit origine et destination
  const filteredFromPorts = fromEquipementId
    ? ports.filter(p => 
        p.equipement_id === fromEquipementId && 
        !usedPortIds.has(p.id) &&
        p.id !== selectedToPort
      )
    : [];

  const filteredToPorts = toEquipementId
    ? ports.filter(p => 
        p.equipement_id === toEquipementId && 
        !usedPortIds.has(p.id) &&
        p.id !== selectedFromPort
      )
    : [];

  // Réinitialiser les ports quand on change d'équipement
  const handleFromEquipementChange = (equipementId: number) => {
    form.setValue("from_equipement_id", equipementId);
    form.setValue("from", undefined);
  };

  const handleToEquipementChange = (equipementId: number) => {
    form.setValue("to_equipement_id", equipementId);
    form.setValue("to", undefined);
  };

  const onSubmit = async (data: LiaisonFormData) => {
    try {
      await addLiaison({
        label: data.label,
        media: data.media,
        from: data.from,
        to: data.to,
        length: data.length || undefined,
        status: data.status,
      });
      toast({
        title: "Liaison ajoutée",
        description: `La liaison ${data.label} a été ajoutée avec succès`,
      });
      form.reset();
      setOpen(false);
      refetchLiaisons();
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Une erreur est survenue lors de l'ajout de la liaison",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter une liaison
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ajouter une nouvelle liaison</DialogTitle>
          <DialogDescription>
            Remplissez les informations de la nouvelle liaison réseau.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Label *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: LIA-001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="media"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type de liaison *</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner le type de liaison" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Fibre optique">Fibre optique</SelectItem>
                        <SelectItem value="Cuivre">Cuivre</SelectItem>
                        <SelectItem value="MPLS">MPLS</SelectItem>
                        <SelectItem value="VPN">VPN</SelectItem>
                        <SelectItem value="Ethernet">Ethernet</SelectItem>
                        <SelectItem value="Satellite">Satellite</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="from_equipement_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Équipement d'origine *</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={(value) => handleFromEquipementChange(parseInt(value))}
                      value={field.value?.toString()}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner l'équipement d'origine" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredEquipements?.map((equipement) => (
                          <SelectItem key={equipement.id} value={equipement.id.toString()}>
                            {equipement.name} ({equipement.equipement_code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="from"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Port d'origine *</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value?.toString()}
                      disabled={isLoadingPorts || !fromEquipementId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={
                          !fromEquipementId 
                            ? "Sélectionnez d'abord l'équipement d'origine" 
                            : "Sélectionner le port d'origine"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredFromPorts?.map((port) => (
                          <SelectItem key={port.id} value={port.id.toString()}>
                            {port.port_label} - {port.device_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="to_equipement_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Équipement de destination *</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={(value) => handleToEquipementChange(parseInt(value))}
                      value={field.value?.toString()}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner l'équipement de destination" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredEquipements?.map((equipement) => (
                          <SelectItem key={equipement.id} value={equipement.id.toString()}>
                            {equipement.name} ({equipement.equipement_code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="to"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Port de destination *</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value?.toString()}
                      disabled={isLoadingPorts || !toEquipementId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={
                          !toEquipementId 
                            ? "Sélectionnez d'abord l'équipement de destination" 
                            : "Sélectionner le port de destination"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredToPorts?.map((port) => (
                          <SelectItem key={port.id} value={port.id.toString()}>
                            {port.port_label} - {port.device_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                  <FormLabel>Longueur (mètres)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Ex: 100"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Statut actif
                    </FormLabel>
                    <div className="text-sm text-muted-foreground">
                      La liaison est-elle active ?
                    </div>
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

export default AddLiaisonForm;