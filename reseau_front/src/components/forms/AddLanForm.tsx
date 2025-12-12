import { useState, useEffect } from "react";
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

const lanSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  sous_reseau: z.string().min(1, "Le sous-réseau est requis"),
  vlan: z.string().min(1, "Le VLAN est requis"),
  site: z.string().min(1, "Le site est requis"),
  statut: z.string().min(1, "Le statut est requis"),
  description: z.string().optional(),
  batiment_id: z.number().min(1, "Le bâtiment est requis"),
  salle_id: z.number().min(1, "La salle est requise"),
});

type LanFormData = z.infer<typeof lanSchema>;

export default function AddLanForm() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { addLan, batiments, salles, isLoadingBatiments, isLoadingSalles } = useData();
  const [selectedBatimentId, setSelectedBatimentId] = useState<number | undefined>(undefined);

  const form = useForm<LanFormData>({
    resolver: zodResolver(lanSchema),
    defaultValues: {
      nom: "",
      sous_reseau: "",
      vlan: "",
      site: "",
      statut: "Actif",
      description: "",
      batiment_id: undefined,
      salle_id: undefined,
    },
  });

  useEffect(() => {
    if (selectedBatimentId) {
      form.setValue("salle_id", undefined);
    }
  }, [selectedBatimentId, form]);

  const onSubmit = async (data: LanFormData) => {
    try {
      await addLan(data);
      toast({
        title: "LAN ajouté",
        description: `Le LAN ${data.nom} a été créé avec succès.`,
      });
      form.reset();
      setOpen(false);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création du LAN.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un LAN
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Ajouter un nouveau LAN</DialogTitle>
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
                    <Input placeholder="Ex: LAN-Production" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sous_reseau"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sous-réseau (CIDR)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 10.10.0.0/22" {...field} />
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
                      <Input placeholder="Ex: VLAN 120" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="batiment_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bâtiment *</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        const numericValue = parseInt(value);
                        field.onChange(numericValue);
                        setSelectedBatimentId(numericValue);
                      }}
                      value={field.value?.toString()}
                      disabled={isLoadingBatiments}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner le bâtiment" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {batiments?.map((batiment) => (
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
              <FormField
                control={form.control}
                name="salle_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Salle *</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(parseInt(value));
                      }}
                      value={field.value?.toString()}
                      disabled={isLoadingSalles || !selectedBatimentId}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={selectedBatimentId ? "Sélectionner la salle" : "Sélectionnez d'abord un bâtiment"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {salles
                          ?.filter((salle) => salle.batiment_id === selectedBatimentId)
                          .map((salle) => (
                            <SelectItem key={salle.id} value={salle.id.toString()}>
                              {salle.nom}
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
                name="site"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Site / Localisation</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Bâtiment A" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="statut"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Statut</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner le statut" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Actif">Actif</SelectItem>
                        <SelectItem value="Surveillé">Surveillé</SelectItem>
                        <SelectItem value="Maintenance">Maintenance</SelectItem>
                        <SelectItem value="Inactif">Inactif</SelectItem>
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
                      placeholder="Usage, contraintes, notes..."
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

