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
import { Plus, Loader2 } from "lucide-react";

const salleSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  batiment_id: z.string().min(1, "Le bâtiment est requis"),
  etage: z.string().optional().transform((val) => val ? parseInt(val, 10) : 0),
  capacite: z.string().optional().transform((val) => val ? parseInt(val, 10) : undefined),
  type: z.string().min(1, "Le type est requis"),
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
      description: "",
    },
  });

  const { isSubmitting } = form.formState;

  const handleOpenChange = (isOpen: boolean) => {
    if (isSubmitting) return;
    setOpen(isOpen);
    if (!isOpen) {
      form.reset();
    }
  };

  const onSubmit = async (data: SalleFormData) => {
    try {
      await addSalle({
        ...data,
        batiment_id: parseInt(data.batiment_id, 10),
        etat: "Actif",
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
                  <Select onValueChange={field.onChange} value={field.value}>
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="etage"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Étage</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="capacite"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Capacité</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Ex: 30" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Type <span className="text-red-500">*</span></FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner" />
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
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isSubmitting}>
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isSubmitting ? "Création..." : "Créer"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

