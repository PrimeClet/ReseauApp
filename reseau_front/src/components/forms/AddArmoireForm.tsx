import { useState, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useData } from "@/contexts/DataContext";
import { useToast } from "@/hooks/use-toast";
import { Plus, Server, MapPin, ImagePlus, ChevronDown, Building2, X, Tag, Box, Loader2 } from "lucide-react";
import type { CoffretCreateData } from "@/services/coffretService";
import { cn } from "@/lib/utils";

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
  const [coordsOpen, setCoordsOpen] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const { toast } = useToast();
  const { addCoffret, refetchCoffrets, sites, zones, batiments, salles, isLoadingSalles, coffrets } = useData();

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

  // Observer la salle sélectionnée
  const selectedSalleId = form.watch("salle_id");

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

  // Obtenir les infos de localisation pour la salle sélectionnée
  const locationInfo = useMemo(() => {
    if (!selectedSalleId) return null;
    const salle = salles.find(s => s.id === selectedSalleId);
    if (!salle) return null;

    const batiment = batimentMap.get(salle.batiment_id);
    const zone = batiment?.zone_id ? zoneMap.get(batiment.zone_id) : null;
    const site = zone?.site_id ? siteMap.get(zone.site_id) : null;

    return {
      salle: salle.nom,
      batiment: batiment?.nom,
      zone: zone?.libelle,
      site: site?.libelle,
    };
  }, [selectedSalleId, salles, batimentMap, zoneMap, siteMap]);

  // Compter les armoires existantes dans la salle sélectionnée
  const armoiresCountInSalle = useMemo(() => {
    if (!selectedSalleId || !coffrets) return 0;
    return coffrets.filter(
      c => c.salle_id === selectedSalleId && !(c as any).deleted_at
    ).length;
  }, [selectedSalleId, coffrets]);

  // Générer automatiquement le nom de l'armoire
  useEffect(() => {
    if (selectedSalleId && locationInfo) {
      const count = armoiresCountInSalle + 1;
      const generatedName = `ARM-${locationInfo.salle}-${String(count).padStart(2, '0')}`;
      form.setValue("nom", generatedName);
    }
  }, [selectedSalleId, locationInfo, armoiresCountInSalle, form]);

  const handlePhotoChange = (file: File | undefined) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPhotoPreview(null);
    }
    form.setValue("photo", file);
  };

  const removePhoto = () => {
    setPhotoPreview(null);
    form.setValue("photo", undefined);
  };

  const { isSubmitting } = form.formState;

  const handleOpenChange = (isOpen: boolean) => {
    if (isSubmitting) return;
    setOpen(isOpen);
    if (!isOpen) {
      form.reset();
      setPhotoPreview(null);
      setCoordsOpen(false);
    }
  };

  const onSubmit = async (data: ArmoireFormData) => {
    try {
      const coffretData: CoffretCreateData = {
        nom: data.nom,
        modele: data.modele || undefined,
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
      setPhotoPreview(null);
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Ajouter une armoire
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-[550px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Server className="h-5 w-5 text-primary" />
            Nouvelle armoire réseau
          </DialogTitle>
          <DialogDescription>
            Configurez les informations de la nouvelle armoire.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Section: Identification */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Server className="h-4 w-4" />
                Identification
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <FormField
                  control={form.control}
                  name="nom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1.5">
                        <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                        Nom <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="ARM-001" {...field} />
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
                      <FormLabel className="flex items-center gap-1.5">
                        <Box className="h-3.5 w-3.5 text-muted-foreground" />
                        Modèle
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="APC NetShelter 42U" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Section: Localisation */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Building2 className="h-4 w-4" />
                Localisation
              </div>

              <FormField
                control={form.control}
                name="salle_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Salle <span className="text-red-500">*</span></FormLabel>
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

              {/* Afficher la hiérarchie sélectionnée */}
              {locationInfo && (
                <div className="rounded-lg border bg-muted/30 p-2 sm:p-3 text-xs sm:text-sm">
                  <div className="grid grid-cols-2 gap-1 sm:gap-2 text-muted-foreground">
                    <span>Site:</span>
                    <span className="font-medium text-foreground">{locationInfo.site || '-'}</span>
                    <span>Zone:</span>
                    <span className="font-medium text-foreground">{locationInfo.zone || '-'}</span>
                    <span>Bâtiment:</span>
                    <span className="font-medium text-foreground">{locationInfo.batiment || '-'}</span>
                    <span>Salle:</span>
                    <span className="font-medium text-foreground">{locationInfo.salle}</span>
                  </div>
                </div>
              )}

              <FormField
                control={form.control}
                name="emplacement"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Emplacement détaillé</FormLabel>
                    <FormControl>
                      <Input placeholder="Allée B, Rangée 3, Position 12" {...field} />
                    </FormControl>
                    <FormDescription>
                      Position précise dans la salle (optionnel)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Section: Photo */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <ImagePlus className="h-4 w-4" />
                Photo
              </div>

              <FormField
                control={form.control}
                name="photo"
                render={({ field: { onChange, value, ...rest } }) => (
                  <FormItem>
                    {photoPreview ? (
                      <div className="relative inline-block">
                        <img
                          src={photoPreview}
                          alt="Aperçu"
                          className="h-32 w-auto rounded-lg border object-cover"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -right-2 -top-2 h-6 w-6"
                          onClick={removePhoto}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <FormControl>
                        <label
                          className={cn(
                            "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6",
                            "hover:border-primary hover:bg-muted/50 transition-colors"
                          )}
                        >
                          <ImagePlus className="h-8 w-8 text-muted-foreground mb-2" />
                          <span className="text-sm text-muted-foreground">
                            Cliquez pour ajouter une photo
                          </span>
                          <span className="text-xs text-muted-foreground mt-1">
                            JPG, PNG jusqu'à 5MB
                          </span>
                          <Input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              handlePhotoChange(file);
                            }}
                            {...rest}
                          />
                        </label>
                      </FormControl>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Section: Coordonnées GPS (collapsible) */}
            <Collapsible open={coordsOpen} onOpenChange={setCoordsOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="flex w-full items-center justify-between p-0 h-auto hover:bg-transparent"
                >
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    Coordonnées GPS (optionnel)
                  </div>
                  <ChevronDown className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform",
                    coordsOpen && "rotate-180"
                  )} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
                            placeholder="48.8566"
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
                    name="long"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Longitude</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="any"
                            placeholder="2.3522"
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
              </CollapsibleContent>
            </Collapsible>

            {/* Boutons d'action */}
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} className="w-full sm:w-auto" disabled={isSubmitting}>
                Annuler
              </Button>
              <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                {isSubmitting ? "Ajout en cours..." : "Ajouter l'armoire"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddArmoireForm;
