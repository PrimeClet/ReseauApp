import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useData } from "@/contexts/DataContext";
import { toast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";

const armoireSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  emplacement: z.string().min(1, "L'emplacement est requis"),
  type: z.string().min(1, "Le type est requis"),
  capacite: z.string().min(1, "La capacité est requise"),
  temperature: z.string().min(1, "La température est requise"),
  etat: z.string().min(1, "L'état est requis"),
  dateInstallation: z.string().min(1, "La date d'installation est requise")
});

type ArmoireFormData = z.infer<typeof armoireSchema>;

const AddArmoireForm = () => {
  const [open, setOpen] = useState(false);
  const { addArmoire } = useData();

  const form = useForm<ArmoireFormData>({
    resolver: zodResolver(armoireSchema),
    defaultValues: {
      nom: "",
      emplacement: "",
      type: "",
      capacite: "",
      temperature: "",
      etat: "Actif",
      dateInstallation: new Date().toISOString().split('T')[0]
    }
  });

  const onSubmit = (data: ArmoireFormData) => {
    addArmoire({
      nom: data.nom!,
      emplacement: data.emplacement!,
      type: data.type!,
      capacite: data.capacite!,
      temperature: data.temperature!,
      etat: data.etat!,
      dateInstallation: data.dateInstallation!
    });
    toast({
      title: "Armoire ajoutée",
      description: `L'armoire ${data.nom} a été ajoutée avec succès`,
    });
    form.reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter une armoire
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ajouter une nouvelle armoire</DialogTitle>
          <DialogDescription>
            Remplissez les informations de la nouvelle armoire réseau.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom</FormLabel>
                  <FormControl>
                    <Input placeholder="ARM-003" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="emplacement"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Emplacement</FormLabel>
                  <FormControl>
                    <Input placeholder="Salle serveur C" {...field} />
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
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner le type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="42U">42U</SelectItem>
                        <SelectItem value="36U">36U</SelectItem>
                        <SelectItem value="24U">24U</SelectItem>
                        <SelectItem value="12U">12U</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="capacite"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Capacité</FormLabel>
                  <FormControl>
                    <Input placeholder="75%" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="temperature"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Température</FormLabel>
                  <FormControl>
                    <Input placeholder="23°C" {...field} />
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
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner l'état" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Actif">Actif</SelectItem>
                        <SelectItem value="Inactif">Inactif</SelectItem>
                        <SelectItem value="Maintenance">Maintenance</SelectItem>
                        <SelectItem value="Erreur">Erreur</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dateInstallation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date d'installation</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
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
};

export default AddArmoireForm;