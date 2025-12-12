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
import { Plus } from "lucide-react";

const salleSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  batiment_id: z.string().min(1, "Le bâtiment est requis"),
  etage: z.string().min(1, "L'étage est requis"),
  capacite: z.string().min(1, "La capacité est requise").transform((val) => parseInt(val, 10)),
  type: z.string().min(1, "Le type est requis"),
  etat: z.string().min(1, "L'état est requis"),
  description: z.string().optional(),
});

type SalleFormData = z.infer<typeof salleSchema>;

export default function AddSalleForm() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { addSalle, batiments } = useData();

  const form = useForm<SalleFormData>({
    resolver: zodResolver(salleSchema),
    defaultValues: {
      nom: "",
      batiment_id: "",
      etage: "",
      capacite: "",
      type: "",
      etat: "Actif",
      description: "",
    },
  });

  const onSubmit = async (data: SalleFormData) => {
    try {
      await addSalle({
        ...data,
        batiment_id: parseInt(data.batiment_id, 10),
      });
      toast({
        title: "Salle ajoutée",
        description: `La salle ${data.nom} a été créée avec succès.`,
      });
      form.reset();
      setOpen(false);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création de la salle.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Ajouter une salle
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Ajouter une nouvelle salle</DialogTitle>
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
                    <Input placeholder="Ex: Salle 101" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="batiment_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bâtiment</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un bâtiment" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {batiments.map((batiment) => (
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="etage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Étage</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 1er étage" {...field} />
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
                      <Input type="number" placeholder="Ex: 30" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                        <SelectItem value="Bureau">Bureau</SelectItem>
                        <SelectItem value="Réunion">Réunion</SelectItem>
                        <SelectItem value="Formation">Formation</SelectItem>
                        <SelectItem value="Stockage">Stockage</SelectItem>
                        <SelectItem value="Technique">Technique</SelectItem>
                        <SelectItem value="Autre">Autre</SelectItem>
                      </SelectContent>
                    </Select>
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
                        <SelectItem value="Actif">Actif</SelectItem>
                        <SelectItem value="Inactif">Inactif</SelectItem>
                        <SelectItem value="Maintenance">Maintenance</SelectItem>
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
                      placeholder="Description de la salle..."
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
              <Button type="submit">Créer</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

