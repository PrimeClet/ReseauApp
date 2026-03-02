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
import { Plus, Server, Loader2 } from "lucide-react";
import equipementService, { type ManageableSwitch } from "@/services/equipementService";

const lanSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  subnet: z.string().min(1, "Le sous-réseau est requis"),
  vlan_id: z.coerce.number().min(1, "Le VLAN ID est requis"),
  gateway: z.string().optional(),
  status: z.string().min(1, "Le statut est requis"),
  description: z.string().optional(),
  equipement_id: z.number().min(1, "Le switch manageable est requis"),
});

type LanFormData = z.infer<typeof lanSchema>;

export default function AddLanForm() {
  const [open, setOpen] = useState(false);
  const [manageableSwitches, setManageableSwitches] = useState<ManageableSwitch[]>([]);
  const [isLoadingSwitches, setIsLoadingSwitches] = useState(false);
  const { toast } = useToast();
  const { addLan } = useData();

  const form = useForm<LanFormData>({
    resolver: zodResolver(lanSchema),
    defaultValues: {
      name: "",
      subnet: "",
      vlan_id: undefined,
      gateway: "",
      status: "active",
      description: "",
      equipement_id: undefined,
    },
  });

  const { isSubmitting } = form.formState;
  const selectedSwitchId = form.watch("equipement_id");
  const selectedSwitch = manageableSwitches.find(s => s.id === selectedSwitchId);

  // Charger les switches manageables
  const loadManageableSwitches = async () => {
    try {
      setIsLoadingSwitches(true);
      const switches = await equipementService.getManageableSwitches();
      setManageableSwitches(switches);
    } catch (error) {
      console.error("Erreur lors du chargement des switches manageables:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les switches manageables.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingSwitches(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadManageableSwitches();
    }
  }, [open]);

  const onSubmit = async (data: LanFormData) => {
    try {
      await addLan(data);
      toast({
        title: "LAN ajouté",
        description: `Le LAN ${data.name} a été créé avec succès.`,
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
    <Dialog open={open} onOpenChange={(value) => { if (!isSubmitting) setOpen(value); }}>
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
            {/* Sélection du switch manageable - toujours visible */}
            <FormField
              control={form.control}
              name="equipement_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Server className="h-4 w-4" />
                    Switch manageable <span className="text-red-500">*</span>
                  </FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(parseInt(value));
                    }}
                    value={field.value?.toString()}
                    disabled={isLoadingSwitches}
                  >
                    <FormControl>
                      <SelectTrigger>
                        {isLoadingSwitches ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Chargement...</span>
                          </div>
                        ) : (
                          <SelectValue placeholder="Sélectionner un switch manageable" />
                        )}
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {manageableSwitches.length === 0 ? (
                        <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                          Aucun switch manageable disponible
                        </div>
                      ) : (
                        manageableSwitches.map((sw) => (
                          <SelectItem key={sw.id} value={sw.id.toString()}>
                            <div className="flex flex-col">
                              <span className="font-medium">{sw.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {sw.equipement_code} {sw.ip_address ? `• ${sw.ip_address}` : ''}
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Afficher le reste du formulaire uniquement si un switch est sélectionné */}
            {selectedSwitchId && (
              <>
                {/* Info sur le switch sélectionné */}
                {selectedSwitch && (
                  <div className="rounded-lg border bg-muted/50 p-3 text-sm">
                    <div className="font-medium">{selectedSwitch.name}</div>
                    <div className="text-muted-foreground">
                      {selectedSwitch.equipement_code}
                      {selectedSwitch.ip_address && ` • IP: ${selectedSwitch.ip_address}`}
                      {selectedSwitch.coffret && ` • ${selectedSwitch.coffret.nom}`}
                    </div>
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom <span className="text-red-500">*</span></FormLabel>
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
                    name="subnet"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sous-réseau (CIDR) <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: 10.10.0.0/22" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="vlan_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>VLAN ID <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="Ex: 120" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="gateway"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Passerelle (optionnel)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: 10.10.0.1" {...field} />
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
                      <FormLabel>Statut <span className="text-red-500">*</span></FormLabel>
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
              </>
            )}

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => { if (!isSubmitting) setOpen(false); }} disabled={isSubmitting}>
                Annuler
              </Button>
              <Button type="submit" disabled={!selectedSwitchId || isSubmitting}>
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
