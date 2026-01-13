import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useData } from "@/contexts/DataContext";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
import type { CoffretCreateData } from "@/services/coffretService";

const armoireSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  modele: z.string().min(1, "Le modèle est requis"),
  photo: z.any().optional(),
  long: z.number().optional().nullable(),
  lat: z.number().optional().nullable(),
  site_id: z.number().int({ message: "Le site est requis" }),
  zone_id: z.number().int({ message: "La zone est requise" }),
  batiment_id: z.number().int().min(1, "Le bâtiment est requis"),
  salle_id: z.number().int().min(1, "La salle est requise"),
  emplacement: z.string().optional(),
  status: z.enum(["active", "inactive"])
});

type ArmoireFormData = z.infer<typeof armoireSchema>;

const AddArmoireForm = () => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { addCoffret, refetchCoffrets, sites, zones, batiments, salles, isLoadingBatiments, isLoadingSalles } = useData();
  const [selectedSiteId, setSelectedSiteId] = useState<number | undefined>(undefined);
  const [selectedZoneId, setSelectedZoneId] = useState<number | undefined>(undefined);
  const [selectedBatimentId, setSelectedBatimentId] = useState<number | undefined>(undefined);

  const form = useForm<ArmoireFormData>({
    resolver: zodResolver(armoireSchema),
    defaultValues: {
      nom: "",
      modele: "",
      photo: undefined,
      long: undefined,
      lat: undefined,
      batiment_id: undefined,
      salle_id: undefined,
    },
  });

  useEffect(() => {
    if (selectedSiteId) {
      setSelectedZoneId(undefined);
      setSelectedBatimentId(undefined);
      form.setValue("zone_id", undefined as unknown as number);
      form.setValue("batiment_id", undefined as unknown as number);
      form.setValue("salle_id", undefined as unknown as number);
    }
  }, [selectedSiteId, form]);

  useEffect(() => {
    if (selectedZoneId) {
      setSelectedBatimentId(undefined);
      form.setValue("batiment_id", undefined as unknown as number);
      form.setValue("salle_id", undefined as unknown as number);
    }
  }, [selectedZoneId, form]);

  useEffect(() => {
    if (selectedBatimentId) {
      form.setValue("salle_id", undefined as unknown as number);
    }
  }, [selectedBatimentId, form]);

  const onSubmit = async (data: ArmoireFormData) => {
    try {
      const coffretData: CoffretCreateData = {
        nom: data.nom,
        piece: "", // Valeur par défaut vide (champ retiré du formulaire)
        long: data.long ?? undefined,
        lat: data.lat ?? undefined,
        batiment_id: data.batiment_id || undefined,
        salle_id: data.salle_id || undefined,
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
      <DialogContent className="w-[95vw] sm:max-w-none sm:w-[1200px] max-h-[70vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ajouter une nouvelle armoire</DialogTitle>
          <DialogDescription>
            Remplissez les informations de la nouvelle armoire réseau.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                name="modele"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modèle *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: APC NetShelter SX 42U" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

              <FormField
                control={form.control}
                name="photo"
                render={({ field: { onChange, value, ...rest } }) => (
                  <FormItem>
                    <FormLabel>Photo (Upload)</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          onChange(file);
                        }}
                        {...rest}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="site_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Site *</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        const v = parseInt(value);
                        field.onChange(v);
                        setSelectedSiteId(v);
                      }}
                      value={field.value?.toString() || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner le site" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {sites?.map((s) => (
                          <SelectItem key={s.id} value={s.id.toString()}>
                            {s.libelle}
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
                name="zone_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zone *</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        const v = parseInt(value);
                        field.onChange(v);
                        setSelectedZoneId(v);
                      }}
                      value={field.value?.toString() || ""}
                      disabled={!selectedSiteId}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={selectedSiteId ? "Sélectionner la zone" : "Sélectionnez d'abord un site"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {zones
                          ?.filter((z) => z.site_id === selectedSiteId)
                          .map((z) => (
                            <SelectItem key={z.id} value={z.id.toString()}>
                              {z.libelle}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      value={field.value?.toString() || ""}
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
                        const numericValue = parseInt(value);
                        field.onChange(numericValue);
                      }}
                      value={field.value?.toString() || ""}
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

            <FormField
              control={form.control}
              name="emplacement"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Emplacement détaillé (optionnel)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Ex: Allée B, Rangée 3, Position 12" {...field} />
                  </FormControl>
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
