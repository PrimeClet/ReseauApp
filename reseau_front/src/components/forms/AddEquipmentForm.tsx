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
import { EquipementCreateData } from "@/services/equipementService";

const equipmentSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  type: z.string().min(1, "Le type est requis"),
  description: z.string().optional(),
  direction_in_out: z.string().optional(),
  vlan: z.string().optional(),
  ip_address: z.string().optional(),
  coffret_id: z.number().min(1, "Le coffret est requis"),
  batiment_id: z.number().optional().nullable(),
  salle_id: z.number().optional().nullable(),
  status: z.enum(["active", "inactive", "maintenance"]),
});

type EquipmentFormData = z.infer<typeof equipmentSchema>;

export default function AddEquipmentForm() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { coffrets, batiments, salles, addEquipement, isLoadingCoffrets, isLoadingBatiments, isLoadingSalles } = useData();
  const [filteredSalles, setFilteredSalles] = useState(salles || []);

  const form = useForm<EquipmentFormData>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: {
      name: "",
      type: "",
      description: "",
      direction_in_out: "",
      vlan: "",
      ip_address: "",
      coffret_id: undefined,
      batiment_id: undefined,
      salle_id: undefined,
      status: "active",
    },
  });

  const selectedBatimentId = form.watch("batiment_id");

  // Filtrer les salles selon le bâtiment sélectionné
  useEffect(() => {
    if (selectedBatimentId && salles) {
      const filtered = salles.filter((salle) => salle.batiment_id === selectedBatimentId);
      setFilteredSalles(filtered);
      // Réinitialiser la salle si elle n'appartient pas au nouveau bâtiment
      const currentSalleId = form.getValues("salle_id");
      if (currentSalleId && !filtered.find((s) => s.id === currentSalleId)) {
        form.setValue("salle_id", undefined);
      }
    } else {
      setFilteredSalles(salles || []);
    }
  }, [selectedBatimentId, salles, form]);

  const onSubmit = async (data: EquipmentFormData) => {
    try {
      const equipementData: EquipementCreateData = {
        name: data.name,
        type: data.type,
        description: data.description || undefined,
        direction_in_out: data.direction_in_out || undefined,
        vlan: data.vlan || undefined,
        ip_address: data.ip_address || undefined,
        coffret_id: data.coffret_id,
        batiment_id: data.batiment_id || undefined,
        salle_id: data.salle_id || undefined,
        status: data.status,
      };

      await addEquipement(equipementData);
      
      toast({
        title: "Équipement ajouté",
        description: "L'équipement a été ajouté avec succès",
      });
      
      form.reset();
      setOpen(false);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error?.response?.data?.message || "Une erreur est survenue lors de l'ajout de l'équipement",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Ajouter équipement
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ajouter un nouvel équipement</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Switch-001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner le type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="switch">Switch</SelectItem>
                        <SelectItem value="routeur">Routeur</SelectItem>
                        <SelectItem value="firewall">Firewall</SelectItem>
                        <SelectItem value="point-acces">Point d'accès</SelectItem>
                        <SelectItem value="serveur">Serveur</SelectItem>
                        <SelectItem value="autre">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="coffret_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Coffret *</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value?.toString()}
                      disabled={isLoadingCoffrets}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner le coffret" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {coffrets?.map((coffret) => (
                          <SelectItem key={coffret.id} value={coffret.id.toString()}>
                            {coffret.nom || coffret.code}
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
                name="batiment_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bâtiment</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        if (value === "none") {
                          field.onChange(undefined);
                        } else {
                          field.onChange(parseInt(value));
                        }
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
                        if (value === "none") {
                          field.onChange(undefined);
                        } else {
                          field.onChange(parseInt(value));
                        }
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
                        <SelectItem value="none">Aucune</SelectItem>
                        {filteredSalles?.map((salle) => (
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

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="ip_address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adresse IP</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 192.168.1.10" {...field} />
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
                      <Input placeholder="Ex: VLAN-10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>État *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner l'état" />
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
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optionnel)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Description de l'équipement..."
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
              <Button type="submit">Ajouter</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
