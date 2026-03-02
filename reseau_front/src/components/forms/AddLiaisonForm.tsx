import { useState, useMemo, useEffect } from "react";
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
import { Plus, Loader2 } from "lucide-react";

const liaisonSchema = z.object({
  label: z.string().min(1, "Le label est requis"),
  direction: z.enum(['up', 'down']).default('down'),
  media: z.string().min(1, "Le média est requis"),
  cable_type: z.string().optional(),
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
  defaultEquipementId?: number;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

const AddLiaisonForm = ({ defaultCoffretId, defaultEquipementId, onSuccess, trigger }: AddLiaisonFormProps) => {
  const [open, setOpen] = useState(false);
  const { addLiaison, refetchLiaisons, ports, equipements, isLoadingPorts, isLoadingLiaisons, liaisons } = useData();

  // Filtrer les équipements par coffret si defaultCoffretId est fourni
  const filteredEquipements = defaultCoffretId
    ? equipements.filter(e => e.coffret_id === defaultCoffretId)
    : equipements;

  // Récupérer tous les IDs de ports déjà utilisés dans les liaisons existantes (non supprimées)
  // Utilisation de useMemo pour optimiser et garantir la réactivité
  const usedPortIds = useMemo(() => {
    const ids = new Set<number>();
    liaisons.forEach(liaison => {
      // Ignorer les liaisons soft-deleted
      if (liaison.deleted_at) return;
      // Vérifier que from et to sont des nombres valides
      if (typeof liaison.from === 'number' && liaison.from > 0) {
        ids.add(liaison.from);
      }
      if (typeof liaison.to === 'number' && liaison.to > 0) {
        ids.add(liaison.to);
      }
    });
    return ids;
  }, [liaisons]);

  const form = useForm<LiaisonFormData>({
    resolver: zodResolver(liaisonSchema),
    defaultValues: {
      label: "",
      direction: "down",
      media: "",
      cable_type: "",
      from_equipement_id: undefined,
      to_equipement_id: undefined,
      from: undefined,
      to: undefined,
      length: undefined,
      status: true,
    }
  });

  const { isSubmitting } = form.formState;

  // Réinitialiser le formulaire avec les valeurs par défaut quand le modal s'ouvre
  useEffect(() => {
    if (open) {
      form.reset({
        label: "",
        direction: "down",
        media: "",
        cable_type: "",
        from_equipement_id: defaultEquipementId || undefined,
        to_equipement_id: undefined,
        from: undefined,
        to: undefined,
        length: undefined,
        status: true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultEquipementId]);

  // Observer les valeurs des équipements et ports pour réinitialiser les ports
  const fromEquipementId = form.watch("from_equipement_id");
  const toEquipementId = form.watch("to_equipement_id");
  const selectedFromPort = form.watch("from");
  const selectedToPort = form.watch("to");

  // Filtrer les ports selon les équipements sélectionnés et exclure les ports déjà utilisés
  // Aussi exclure le port de destination sélectionné pour éviter qu'un même port soit origine et destination
  // Exclure aussi les ports soft-deleted
  const filteredFromPorts = useMemo(() => {
    if (!fromEquipementId) return [];
    return ports.filter(p =>
      p.equipement_id === fromEquipementId &&
      !p.deleted_at &&
      !usedPortIds.has(p.id) &&
      p.id !== selectedToPort
    );
  }, [ports, fromEquipementId, usedPortIds, selectedToPort]);

  const filteredToPorts = useMemo(() => {
    if (!toEquipementId) return [];
    return ports.filter(p =>
      p.equipement_id === toEquipementId &&
      !p.deleted_at &&
      !usedPortIds.has(p.id) &&
      p.id !== selectedFromPort
    );
  }, [ports, toEquipementId, usedPortIds, selectedFromPort]);

  // Compter le total des ports pour chaque équipement (pour afficher X disponibles sur Y)
  // Exclure les ports soft-deleted du total
  const totalFromPorts = useMemo(() => {
    if (!fromEquipementId) return 0;
    return ports.filter(p => p.equipement_id === fromEquipementId && !p.deleted_at).length;
  }, [ports, fromEquipementId]);

  const totalToPorts = useMemo(() => {
    if (!toEquipementId) return 0;
    return ports.filter(p => p.equipement_id === toEquipementId && !p.deleted_at).length;
  }, [ports, toEquipementId]);

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
        direction: data.direction,
        media: data.media,
        cable_type: data.cable_type || undefined,
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
    <Dialog open={open} onOpenChange={(value) => { if (!isSubmitting) setOpen(value); }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter une liaison
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
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
                  <FormLabel>Label <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: LIA-001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="direction"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Direction du flux <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner la direction" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="down">Downstream (vers distribution)</SelectItem>
                        <SelectItem value="up">Upstream (vers source)</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormDescription>
                    Downstream = équipement source DONNE le réseau à la destination
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="media"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type de liaison <span className="text-red-500">*</span></FormLabel>
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
              name="cable_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type de câble</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner le type de câble (optionnel)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cat5e">Cat5e</SelectItem>
                        <SelectItem value="Cat6">Cat6</SelectItem>
                        <SelectItem value="Cat6a">Cat6a</SelectItem>
                        <SelectItem value="Cat7">Cat7</SelectItem>
                        <SelectItem value="Fibre monomode">Fibre monomode</SelectItem>
                        <SelectItem value="Fibre multimode">Fibre multimode</SelectItem>
                        <SelectItem value="Coaxial">Coaxial</SelectItem>
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
                  <FormLabel>Équipement d'origine <span className="text-red-500">*</span></FormLabel>
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
                  <FormLabel>
                    Port d'origine <span className="text-red-500">*</span>
                    {fromEquipementId && (
                      <span className={`ml-2 text-xs ${filteredFromPorts.length === 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                        ({filteredFromPorts.length}/{totalFromPorts} disponible{filteredFromPorts.length > 1 ? 's' : ''})
                      </span>
                    )}
                  </FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value?.toString()}
                      disabled={isLoadingPorts || isLoadingLiaisons || !fromEquipementId || filteredFromPorts.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={
                          !fromEquipementId
                            ? "Sélectionnez d'abord l'équipement d'origine"
                            : filteredFromPorts.length === 0
                              ? "Aucun port disponible"
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
                  {fromEquipementId && filteredFromPorts.length === 0 && (
                    <p className="text-xs text-red-500">Tous les ports de cet équipement sont déjà utilisés</p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="to_equipement_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Équipement de destination <span className="text-red-500">*</span></FormLabel>
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
                  <FormLabel>
                    Port de destination <span className="text-red-500">*</span>
                    {toEquipementId && (
                      <span className={`ml-2 text-xs ${filteredToPorts.length === 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                        ({filteredToPorts.length}/{totalToPorts} disponible{filteredToPorts.length > 1 ? 's' : ''})
                      </span>
                    )}
                  </FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value?.toString()}
                      disabled={isLoadingPorts || isLoadingLiaisons || !toEquipementId || filteredToPorts.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={
                          !toEquipementId
                            ? "Sélectionnez d'abord l'équipement de destination"
                            : filteredToPorts.length === 0
                              ? "Aucun port disponible"
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
                  {toEquipementId && filteredToPorts.length === 0 && (
                    <p className="text-xs text-red-500">Tous les ports de cet équipement sont déjà utilisés</p>
                  )}
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

export default AddLiaisonForm;