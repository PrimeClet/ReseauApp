import { useState } from "react";
import type React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useData } from "@/contexts/DataContext";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";

const systemeSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  type: z.string().min(1, "Le type est requis"),
  version: z.string().min(1, "La version est requise"),
  etat: z.string().min(1, "L'état est requis"),
  cpu: z.string().min(1, "Le CPU est requis"),
  memoire: z.string().min(1, "La mémoire est requise"),
  stockage: z.string().min(1, "Le stockage est requis")
});

type SystemeFormData = z.infer<typeof systemeSchema>;

interface AddSystemeFormProps {
  defaultCoffretId?: number;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

const AddSystemeForm = ({ defaultCoffretId, onSuccess, trigger }: AddSystemeFormProps) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { addSystem, refetchSystems } = useData();

  const form = useForm<SystemeFormData>({
    resolver: zodResolver(systemeSchema),
    defaultValues: {
      nom: "",
      type: "",
      version: "",
      etat: "En ligne",
      cpu: "",
      memoire: "",
      stockage: ""
    }
  });

  const onSubmit = async (data: SystemeFormData) => {
    try {
      await addSystem({
        name: data.nom,
        type: data.type,
        description: `Version: ${data.version}, CPU: ${data.cpu}, Mémoire: ${data.memoire}, Stockage: ${data.stockage}`,
        status: data.etat,
        coffret_id: defaultCoffretId,
      });
      toast({
        title: "Système ajouté",
        description: `Le système ${data.nom} a été ajouté avec succès`,
      });
      form.reset();
      setOpen(false);
      refetchSystems?.();
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error?.response?.data?.message || "Une erreur est survenue lors de l'ajout du système",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un système
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ajouter un nouveau système</DialogTitle>
          <DialogDescription>
            Remplissez les informations du nouveau système.
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
                    <Input placeholder="SRV-003" {...field} />
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
                        <SelectItem value="Serveur Web">Serveur Web</SelectItem>
                        <SelectItem value="Base de données">Base de données</SelectItem>
                        <SelectItem value="Serveur applicatif">Serveur applicatif</SelectItem>
                        <SelectItem value="Serveur de fichiers">Serveur de fichiers</SelectItem>
                        <SelectItem value="Proxy">Proxy</SelectItem>
                        <SelectItem value="Firewall">Firewall</SelectItem>
                        <SelectItem value="Load Balancer">Load Balancer</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="version"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Version</FormLabel>
                  <FormControl>
                    <Input placeholder="Ubuntu 22.04" {...field} />
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
                        <SelectItem value="En ligne">En ligne</SelectItem>
                        <SelectItem value="Hors ligne">Hors ligne</SelectItem>
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
              name="cpu"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CPU (%)</FormLabel>
                  <FormControl>
                    <Input placeholder="25%" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="memoire"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mémoire (%)</FormLabel>
                  <FormControl>
                    <Input placeholder="60%" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="stockage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stockage (%)</FormLabel>
                  <FormControl>
                    <Input placeholder="40%" {...field} />
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

export default AddSystemeForm;