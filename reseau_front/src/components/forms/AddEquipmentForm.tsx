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
import { useData, Equipment } from "@/contexts/DataContext";
import { Plus } from "lucide-react";

const equipmentSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  type: z.string().min(1, "Le type est requis"),
  modele: z.string().min(1, "Le modèle est requis"),
  armoire: z.string().min(1, "L'armoire est requise"),
  ip: z.string().min(1, "L'adresse IP est requise"),
  etat: z.string().min(1, "L'état est requis"),
  uptime: z.string().default("0j 0h"),
  description: z.string().optional(),
});

type EquipmentFormData = z.infer<typeof equipmentSchema>;

export default function AddEquipmentForm() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { armoires, addEquipment } = useData();

  const form = useForm<EquipmentFormData>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: {
      nom: "",
      type: "",
      modele: "",
      armoire: "",
      ip: "",
      etat: "actif",
      uptime: "0j 0h",
      description: "",
    },
  });

  const onSubmit = (data: EquipmentFormData) => {
    addEquipment(data as Omit<Equipment, 'id'>);
    
    toast({
      title: "Équipement ajouté",
      description: "L'équipement a été ajouté avec succès",
    });
    
    form.reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Ajouter équipement
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Ajouter un nouvel équipement</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Switch-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner le type" />
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="modele"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modèle</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Cisco C9300-24P" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="armoire"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Armoire</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner l'armoire" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {armoires.map((armoire) => (
                          <SelectItem key={armoire.id} value={armoire.nom}>
                            {armoire.nom}
                          </SelectItem>
                        ))}
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
                name="ip"
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
                name="etat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>État</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner l'état" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="actif">Actif</SelectItem>
                        <SelectItem value="inactif">Inactif</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="erreur">Erreur</SelectItem>
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
}