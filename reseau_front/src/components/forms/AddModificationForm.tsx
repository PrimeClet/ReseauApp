import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useData } from "@/contexts/DataContext";
import { useToast } from "@/hooks/use-toast";
import { Plus, Calendar } from "lucide-react";
import type { ModificationCreateData } from "@/services/modificationService";

const modificationSchema = z.object({
  coffret_id: z.number().int({ message: "L'armoire est requise" }),
  port_id: z.number().int().optional().nullable(),
  equipement_id: z.number().int().optional().nullable(),
  type_modification: z.enum([
    'ajout_port',
    'ajout_equipement',
    'modification_connexion',
    'suppression_port',
    'suppression_equipement',
    'changement_statut_port'
  ]),
  description: z.string().min(1, "La description est requise"),
  raison: z.string().min(1, "La raison est requise"),
  photo_avant: z.any().optional(),
  photo_apres: z.any().optional(),
  date_intervention: z.string().min(1, "La date d'intervention est requise"),
  heure_intervention: z.string().min(1, "L'heure d'intervention est requise"),
});

type ModificationFormData = z.infer<typeof modificationSchema>;

const typeModificationLabels: Record<ModificationFormData['type_modification'], string> = {
  ajout_port: "Ajout d'un port",
  ajout_equipement: "Ajout d'un équipement",
  modification_connexion: "Modification d'une connexion",
  suppression_port: "Suppression d'un port",
  suppression_equipement: "Suppression d'un équipement",
  changement_statut_port: "Changement de statut d'un port",
};

export default function AddModificationForm() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { 
    addModification, 
    refetchModifications, 
    coffrets, 
    equipements, 
    ports,
    isLoadingCoffrets,
    isLoadingEquipements,
    isLoadingPorts 
  } = useData();

  const [selectedCoffretId, setSelectedCoffretId] = useState<number | undefined>(undefined);

  const form = useForm<ModificationFormData>({
    resolver: zodResolver(modificationSchema),
    defaultValues: {
      coffret_id: undefined as unknown as number,
      port_id: undefined,
      equipement_id: undefined,
      type_modification: 'ajout_port',
      description: "",
      raison: "",
      photo_avant: undefined,
      photo_apres: undefined,
      date_intervention: "",
      heure_intervention: "",
    },
  });

  // Réinitialiser les ports et équipements lorsque le coffret change
  useEffect(() => {
    if (selectedCoffretId) {
      form.setValue("port_id", undefined);
      form.setValue("equipement_id", undefined);
    }
  }, [selectedCoffretId, form]);

  // Filtrer les équipements et ports par coffret sélectionné
  const filteredEquipements = selectedCoffretId 
    ? equipements?.filter(e => e.coffret_id === selectedCoffretId) || []
    : [];

  const filteredPorts = selectedCoffretId 
    ? ports?.filter(p => {
        const equipement = equipements?.find(e => e.id === p.equipement_id);
        return equipement?.coffret_id === selectedCoffretId;
      }) || []
    : [];

  const onSubmit = async (data: ModificationFormData) => {
    try {
      const modificationData: ModificationCreateData = {
        coffret_id: data.coffret_id,
        port_id: data.port_id && data.port_id > 0 ? data.port_id : undefined,
        equipement_id: data.equipement_id && data.equipement_id > 0 ? data.equipement_id : undefined,
        type_modification: data.type_modification,
        description: data.description,
        raison: data.raison,
        photo_avant: data.photo_avant instanceof File ? data.photo_avant : undefined,
        photo_apres: data.photo_apres instanceof File ? data.photo_apres : undefined,
        date_intervention: data.date_intervention,
        heure_intervention: data.heure_intervention.length > 5 
          ? data.heure_intervention.substring(0, 5) 
          : data.heure_intervention,
      };
      
      await addModification(modificationData);
      
      toast({
        title: "Demande de modification enregistrée",
        description: "La demande de modification a été enregistrée avec succès",
      });
      
      form.reset();
      setSelectedCoffretId(undefined);
      setOpen(false);
      refetchModifications();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Une erreur est survenue lors de l'enregistrement de la demande de modification",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Enregistrer une demande de modification
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Enregistrer une demande de modification</DialogTitle>
          <DialogDescription>
            Remplissez les informations concernant la demande de modification effectuée sur le réseau.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="coffret_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Armoire (Baie) *</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        const numericValue = parseInt(value);
                        field.onChange(numericValue);
                        setSelectedCoffretId(numericValue);
                      }}
                      value={field.value?.toString() || ""}
                      disabled={isLoadingCoffrets}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner l'armoire" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {coffrets?.map((coffret) => (
                          <SelectItem key={coffret.id} value={coffret.id.toString()}>
                            {coffret.nom} ({coffret.code})
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
                name="type_modification"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type de modification *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner le type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(typeModificationLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="port_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Port (optionnel)</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        const numericValue = value === "none" ? null : parseInt(value);
                        field.onChange(numericValue);
                      }}
                      value={field.value?.toString() || "none"}
                      disabled={!selectedCoffretId || isLoadingPorts}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner le port" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Aucun</SelectItem>
                        {filteredPorts.map((port) => (
                          <SelectItem key={port.id} value={port.id.toString()}>
                            {port.port_label || `Port ${port.id}`}
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
                name="equipement_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Équipement (optionnel)</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        const numericValue = value === "none" ? null : parseInt(value);
                        field.onChange(numericValue);
                      }}
                      value={field.value?.toString() || "none"}
                      disabled={!selectedCoffretId || isLoadingEquipements}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner l'équipement" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Aucun</SelectItem>
                        {filteredEquipements.map((equipement) => (
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date_intervention"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date d'intervention *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="heure_intervention"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Heure d'intervention *</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
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
                  <FormLabel>Description de la modification *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Décrivez en détail la modification effectuée..."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="raison"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Raison / Justification *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Expliquez la raison de cette modification..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="photo_avant"
                render={({ field: { onChange, value, ...rest } }) => (
                  <FormItem>
                    <FormLabel>Photo avant (optionnel)</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          onChange(file);
                        }}
                        {...rest}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="photo_apres"
                render={({ field: { onChange, value, ...rest } }) => (
                  <FormItem>
                    <FormLabel>Photo après (optionnel)</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          onChange(file);
                        }}
                        {...rest}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button type="submit">
                <Calendar className="h-4 w-4 mr-2" />
                Enregistrer
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

