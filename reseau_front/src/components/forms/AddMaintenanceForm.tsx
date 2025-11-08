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
import { useData, Maintenance } from "@/contexts/DataContext";
import { Calendar } from "lucide-react";

const maintenanceSchema = z.object({
  equipement: z.string().min(1, "L'équipement est requis"),
  type: z.string().min(1, "Le type est requis"),
  date: z.string().min(1, "La date est requise"),
  heure: z.string().min(1, "L'heure est requise"),
  duree: z.string().min(1, "La durée est requise"),
  technicien: z.string().min(1, "Le technicien est requis"),
  priorite: z.string().min(1, "La priorité est requise"),
  description: z.string().min(1, "La description est requise"),
  statut: z.string().default("planifiee"),
  dateCreation: z.string().default(() => new Date().toISOString().split('T')[0]),
});

type MaintenanceFormData = z.infer<typeof maintenanceSchema>;

export default function AddMaintenanceForm() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { addMaintenance } = useData();

  const form = useForm<MaintenanceFormData>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: {
      equipement: "",
      type: "",
      date: "",
      heure: "",
      duree: "",
      technicien: "",
      priorite: "moyenne",
      description: "",
      statut: "planifiee",
      dateCreation: new Date().toISOString().split('T')[0],
    },
  });

  const onSubmit = (data: MaintenanceFormData) => {
    addMaintenance(data as Omit<Maintenance, 'id'>);
    
    toast({
      title: "Maintenance planifiée",
      description: "La maintenance a été planifiée avec succès",
    });
    
    form.reset();
    setOpen(false);
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
                name="equipement"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Équipement</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner l'équipement" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ARM-001">ARM-001 - Armoire principale</SelectItem>
                        <SelectItem value="ARM-002">ARM-002 - Armoire secondaire</SelectItem>
                        <SelectItem value="LIA-001">LIA-001 - Liaison fibre</SelectItem>
                        <SelectItem value="Switch-001">Switch-001 - Switch principal</SelectItem>
                        <SelectItem value="Router-001">Router-001 - Routeur edge</SelectItem>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="heure"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Heure</FormLabel>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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