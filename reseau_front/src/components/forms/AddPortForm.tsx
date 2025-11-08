import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useData } from "@/contexts/DataContext";
import { toast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";

const portSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  type: z.string().min(1, "Le type est requis"),
  vitesse: z.string().min(1, "La vitesse est requise"),
  etat: z.string().min(1, "L'état est requis"),
  armoire: z.string().min(1, "L'armoire est requise"),
  vlan: z.string().min(1, "Le VLAN est requis"),
  description: z.string().optional()
});

type PortFormData = z.infer<typeof portSchema>;

const AddPortForm = () => {
  const [open, setOpen] = useState(false);
  const { addPort, armoires } = useData();

  const form = useForm<PortFormData>({
    resolver: zodResolver(portSchema),
    defaultValues: {
      nom: "",
      type: "",
      vitesse: "",
      etat: "Libre",
      armoire: "",
      vlan: "",
      description: ""
    }
  });

  const onSubmit = (data: PortFormData) => {
    addPort({
      nom: data.nom!,
      type: data.type!,
      vitesse: data.vitesse!,
      etat: data.etat!,
      armoire: data.armoire!,
      vlan: data.vlan!,
      description: data.description || ""
    });
    toast({
      title: "Port ajouté",
      description: `Le port ${data.nom} a été ajouté avec succès`,
    });
    form.reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un port
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ajouter un nouveau port</DialogTitle>
          <DialogDescription>
            Remplissez les informations du nouveau port réseau.
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
                    <Input placeholder="Port-03" {...field} />
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
                        <SelectItem value="RJ45">RJ45</SelectItem>
                        <SelectItem value="Fibre">Fibre optique</SelectItem>
                        <SelectItem value="SFP">SFP</SelectItem>
                        <SelectItem value="SFP+">SFP+</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="vitesse"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vitesse</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner la vitesse" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="100 Mbps">100 Mbps</SelectItem>
                        <SelectItem value="1 Gbps">1 Gbps</SelectItem>
                        <SelectItem value="10 Gbps">10 Gbps</SelectItem>
                        <SelectItem value="25 Gbps">25 Gbps</SelectItem>
                        <SelectItem value="40 Gbps">40 Gbps</SelectItem>
                        <SelectItem value="100 Gbps">100 Gbps</SelectItem>
                      </SelectContent>
                    </Select>
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
                        <SelectItem value="Libre">Libre</SelectItem>
                        <SelectItem value="Erreur">Erreur</SelectItem>
                        <SelectItem value="Maintenance">Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
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
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner l'armoire" />
                      </SelectTrigger>
                      <SelectContent>
                        {armoires.map((armoire) => (
                          <SelectItem key={armoire.id} value={armoire.nom}>
                            {armoire.nom} - {armoire.emplacement}
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
              name="vlan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>VLAN</FormLabel>
                  <FormControl>
                    <Input placeholder="VLAN-300" {...field} />
                  </FormControl>
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
                    <Textarea placeholder="Description du port..." {...field} />
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

export default AddPortForm;