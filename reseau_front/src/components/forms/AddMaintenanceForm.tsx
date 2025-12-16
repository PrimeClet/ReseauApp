import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useData } from "@/contexts/DataContext";
import { Calendar } from "lucide-react";
import type { MaintenanceCreateData } from "@/services/maintenanceService";

const maintenanceSchema = z.object({
  equipement_id: z.number().optional().nullable(),
  type: z.string().min(1, "Le type est requis"),
  date_debut: z.string().min(1, "La date est requise"),
  heure_debut: z.string().min(1, "L'heure est requise"),
  duree: z.string().min(1, "La durée est requise"),
  technicien: z.string().min(1, "Le technicien est requis"),
  priorite: z.enum(['basse', 'moyenne', 'haute', 'critique']),
  description: z.string().min(1, "La description est requise"),
  statut: z.enum(['planifiee', 'en_cours', 'terminee', 'annulee']).default('planifiee'),
});

type MaintenanceFormData = z.infer<typeof maintenanceSchema>;

export default function AddMaintenanceForm() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { addMaintenance, refetchMaintenances, equipements, isLoadingEquipements } = useData();

  const form = useForm<MaintenanceFormData>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: {
      equipement_id: undefined,
      type: "",
      date_debut: "",
      heure_debut: "",
      duree: "",
      technicien: "",
      priorite: "moyenne",
      description: "",
      statut: "planifiee",
    },
  });

  const onSubmit = async (data: MaintenanceFormData) => {
    try {
      // Formater l'heure au format H:i (sans secondes si présentes)
      const heureFormatee = data.heure_debut.length > 5 
        ? data.heure_debut.substring(0, 5) 
        : data.heure_debut;
      
      const maintenanceData: MaintenanceCreateData = {
        equipement_id: data.equipement_id && data.equipement_id > 0 ? data.equipement_id : undefined,
        type: data.type,
        date_debut: data.date_debut,
        heure_debut: heureFormatee,
        duree: data.duree,
        technicien: data.technicien,
        priorite: data.priorite,
        description: data.description,
        statut: data.statut || 'planifiee',
      };
      
      await addMaintenance(maintenanceData);
      
      toast({
        title: "Maintenance planifiée",
        description: "La maintenance a été planifiée avec succès",
      });
      
      form.reset();
      setOpen(false);
      refetchMaintenances();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Une erreur est survenue lors de la planification de la maintenance",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Calendar className="h-4 w-4 mr-2" />
          Planifier maintenance
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Planifier une maintenance</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="equipement_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Équipement (optionnel)</FormLabel>
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
                          <SelectValue placeholder="Sélectionner l'équipement" />
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
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type de maintenance</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner le type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="preventive">Préventive</SelectItem>
                        <SelectItem value="corrective">Corrective</SelectItem>
                        <SelectItem value="urgente">Urgente</SelectItem>
                        <SelectItem value="evolutive">Évolutive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date_debut"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date début *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="heure_debut"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Heure début *</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="duree"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Durée estimée</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner la durée" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="30min">30 minutes</SelectItem>
                        <SelectItem value="1h">1 heure</SelectItem>
                        <SelectItem value="2h">2 heures</SelectItem>
                        <SelectItem value="4h">4 heures</SelectItem>
                        <SelectItem value="8h">8 heures</SelectItem>
                        <SelectItem value="1j">1 jour</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="technicien"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Technicien assigné</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Assigner un technicien" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="jean">Jean Dupont</SelectItem>
                        <SelectItem value="marie">Marie Martin</SelectItem>
                        <SelectItem value="pierre">Pierre Durand</SelectItem>
                        <SelectItem value="sophie">Sophie Bernard</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="priorite"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priorité</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner la priorité" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="basse">Basse</SelectItem>
                      <SelectItem value="moyenne">Moyenne</SelectItem>
                      <SelectItem value="haute">Haute</SelectItem>
                      <SelectItem value="critique">Critique</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Décrivez les tâches à effectuer..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button type="submit">Planifier</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}