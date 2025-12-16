import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useData } from "@/contexts/DataContext";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
import type { CoffretCreateData } from "@/services/coffretService";

const armoireSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  piece: z.string().min(1, "La pièce est requise"),
  long: z.number().optional().nullable(),
  lat: z.number().optional().nullable(),
  batiment_id: z.number().optional().nullable(),
  salle_id: z.number().optional().nullable(),
  status: z.enum(["active", "inactive", "maintenance"]),
});

type ArmoireFormData = z.infer<typeof armoireSchema>;

const AddArmoireForm = () => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { addCoffret, refetchCoffrets, batiments, salles, isLoadingBatiments, isLoadingSalles } = useData();
  const [selectedBatimentId, setSelectedBatimentId] = useState<number | undefined>(undefined);

  const form = useForm<ArmoireFormData>({
    resolver: zodResolver(armoireSchema),
    defaultValues: {
      nom: "",
      piece: "",
      long: undefined,
      lat: undefined,
      batiment_id: undefined,
      salle_id: undefined,
      status: "active",
    },
  });

  useEffect(() => {
    if (selectedBatimentId) {
      form.setValue("salle_id", undefined);
    }
  }, [selectedBatimentId, form]);

  const onSubmit = async (data: ArmoireFormData) => {
    try {
      const coffretData: CoffretCreateData = {
        nom: data.nom,
        piece: data.piece,
        long: data.long ?? undefined,
        lat: data.lat ?? undefined,
        batiment_id: data.batiment_id || undefined,
        salle_id: data.salle_id || undefined,
        status: data.status,
      };
      
      await addCoffret(coffretData);
      toast({
        title: "Armoire ajoutée",
        description: `L'armoire ${data.nom} a été ajoutée avec succès`,
      });
      form.reset();
      setSelectedBatimentId(undefined);
      setOpen(false);
      refetchCoffrets();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Une erreur est survenue lors de l'ajout de l'armoire",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter une armoire
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
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
                  <FormLabel>Nom *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Armoire principale" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="piece"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pièce *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Salle serveur C" {...field} />
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
                  <Select
                    onValueChange={(value) => {
                      const numericValue = value === "none" ? undefined : parseInt(value);
                      field.onChange(numericValue);
                      setSelectedBatimentId(numericValue);
                    }}
                    value={field.value?.toString() || "none"}
                    disabled={isLoadingBatiments}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner le bâtiment (optionnel)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Aucun</SelectItem>
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
                  <FormLabel>Salle</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      const numericValue = value === "none" ? undefined : parseInt(value);
                      field.onChange(numericValue);
                    }}
                    value={field.value?.toString() || "none"}
                    disabled={isLoadingSalles || !selectedBatimentId}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={selectedBatimentId ? "Sélectionner la salle (optionnel)" : "Sélectionnez d'abord un bâtiment"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Aucun</SelectItem>
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="long"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Longitude</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="any"
                        placeholder="0.0"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Latitude</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="any"
                        placeholder="0.0"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Statut *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner le statut" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Actif</SelectItem>
                      <SelectItem value="inactive">Inactif</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
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
