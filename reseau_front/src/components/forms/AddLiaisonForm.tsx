import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useData } from "@/contexts/DataContext";
import { toast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";

const liaisonSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  type: z.string().min(1, "Le type est requis"),
  origine: z.string().min(1, "L'origine est requise"),
  destination: z.string().min(1, "La destination est requise"),
  etat: z.string().min(1, "L'état est requis"),
  bande: z.string().min(1, "La bande passante est requise"),
  latence: z.string().min(1, "La latence est requise")
});

type LiaisonFormData = z.infer<typeof liaisonSchema>;

const AddLiaisonForm = () => {
  const [open, setOpen] = useState(false);
  const { addLiaison } = useData();

  const form = useForm<LiaisonFormData>({
    resolver: zodResolver(liaisonSchema),
    defaultValues: {
      nom: "",
      type: "",
      origine: "",
      destination: "",
      etat: "Actif",
      bande: "",
      latence: ""
    }
  });

  const onSubmit = (data: LiaisonFormData) => {
    addLiaison({
      nom: data.nom!,
      type: data.type!,
      origine: data.origine!,
      destination: data.destination!,
      etat: data.etat!,
      bande: data.bande!,
      latence: data.latence!
    });
    toast({
      title: "Liaison ajoutée",
      description: `La liaison ${data.nom} a été ajoutée avec succès`,
    });
    form.reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter une liaison
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
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
              name="nom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom</FormLabel>
                  <FormControl>
                    <Input placeholder="LIA-003" {...field} />
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
                        <SelectItem value="Fibre optique">Fibre optique</SelectItem>
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
              name="origine"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Origine</FormLabel>
                  <FormControl>
                    <Input placeholder="Site D" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="destination"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Destination</FormLabel>
                  <FormControl>
                    <Input placeholder="Site E" {...field} />
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
              name="bande"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bande passante</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner la bande passante" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10 Mbps">10 Mbps</SelectItem>
                        <SelectItem value="50 Mbps">50 Mbps</SelectItem>
                        <SelectItem value="100 Mbps">100 Mbps</SelectItem>
                        <SelectItem value="500 Mbps">500 Mbps</SelectItem>
                        <SelectItem value="1 Gbps">1 Gbps</SelectItem>
                        <SelectItem value="10 Gbps">10 Gbps</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="latence"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Latence</FormLabel>
                  <FormControl>
                    <Input placeholder="8ms" {...field} />
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

export default AddLiaisonForm;