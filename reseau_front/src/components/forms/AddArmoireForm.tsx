import { useState, useMemo } from "react";
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
  modele: z.string().optional(),
  photo: z.any().optional(),
  long: z.number().optional().nullable(),
  lat: z.number().optional().nullable(),
  site_id: z.number().int().min(1, "Le site est requis (sélectionnez une salle avec un bâtiment lié à une zone et un site)"),
  zone_id: z.number().int().min(1, "La zone est requise (sélectionnez une salle avec un bâtiment lié à une zone)"),
  batiment_id: z.number().int().min(1, "Le bâtiment est requis"),
  salle_id: z.number().int().min(1, "La salle est requise"),
  emplacement: z.string().optional(),
  status: z.enum(["active", "inactive"]).optional()
});

type ArmoireFormData = z.infer<typeof armoireSchema>;

const AddArmoireForm = () => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { addCoffret, refetchCoffrets, sites, zones, batiments, salles, isLoadingSalles } = useData();

  const form = useForm<ArmoireFormData>({
    resolver: zodResolver(armoireSchema),
    defaultValues: {
      nom: "",
      modele: "",
      photo: undefined,
      long: undefined,
      lat: undefined,
      site_id: undefined,
      zone_id: undefined,
      batiment_id: undefined,
      salle_id: undefined,
    },
  });

  // Créer des maps pour accéder rapidement aux relations
  const batimentMap = useMemo(() => {
    const map = new Map<number, { id: number; nom: string; zone_id?: number }>();
    batiments.forEach(b => map.set(b.id, b));
    return map;
  }, [batiments]);

  const zoneMap = useMemo(() => {
    const map = new Map<number, { id: number; libelle: string; site_id: number }>();
    zones.forEach(z => map.set(z.id, z));
    return map;
  }, [zones]);

  const siteMap = useMemo(() => {
    const map = new Map<number, { id: number; libelle: string }>();
    sites.forEach(s => map.set(s.id, s));
    return map;
  }, [sites]);

  // Fonction pour remplir automatiquement les champs parent lors de la sélection de salle
  const handleSalleChange = (salleId: number) => {
    form.setValue("salle_id", salleId);

    // Trouver la salle sélectionnée
    const salle = salles.find(s => s.id === salleId);
    if (!salle) return;

    // Remplir le bâtiment
    const batimentId = salle.batiment_id;
    if (batimentId) {
      form.setValue("batiment_id", batimentId);

      // Trouver le bâtiment pour obtenir la zone
      const batiment = batimentMap.get(batimentId);
      if (batiment?.zone_id) {
        form.setValue("zone_id", batiment.zone_id);

        // Trouver la zone pour obtenir le site
        const zone = zoneMap.get(batiment.zone_id);
        if (zone?.site_id) {
          form.setValue("site_id", zone.site_id);
        }
      }
    }
  };

  const onSubmit = async (data: ArmoireFormData) => {
    try {
      const coffretData: CoffretCreateData = {
        nom: data.nom,
        modele: data.modele || undefined,
        piece: "", // Valeur par défaut vide (champ retiré du formulaire)
        emplacement: data.emplacement || undefined,
        long: data.long ?? undefined,
        lat: data.lat ?? undefined,
        site_id: data.site_id || undefined,
        zone_id: data.zone_id || undefined,
        batiment_id: data.batiment_id || undefined,
        salle_id: data.salle_id || undefined,
      };
      
      await addCoffret(coffretData);
      toast({
        title: "Armoire ajoutée",
        description: `L'armoire ${data.nom} a été ajoutée avec succès`,
      });
      form.reset();
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

            {/* Sélection de la salle */}
            <FormField
              control={form.control}
              name="salle_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Salle *</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      const numericValue = parseInt(value);
                      handleSalleChange(numericValue);
                    }}
                    value={field.value?.toString() || ""}
                    disabled={isLoadingSalles}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner la salle" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {salles
                        ?.filter((salle) => !salle.deleted_at)
                        .map((salle) => {
                          const batiment = batimentMap.get(salle.batiment_id);
                          const batimentNom = batiment?.nom || "";
                          return (
                            <SelectItem key={salle.id} value={salle.id.toString()}>
                              {salle.nom} {batimentNom && `(${batimentNom})`}
                            </SelectItem>
                          );
                        })}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

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
