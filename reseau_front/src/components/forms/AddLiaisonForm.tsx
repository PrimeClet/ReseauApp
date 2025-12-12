import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useData } from "@/contexts/DataContext";
import { toast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";

const liaisonSchema = z.object({
  label: z.string().min(1, "Le label est requis"),
  media: z.string().min(1, "Le média est requis"),
  from: z.number().min(1, "Le port d'origine est requis"),
  to: z.number().min(1, "Le port de destination est requis"),
  length: z.number().optional().nullable(),
  status: z.boolean().default(true),
});

type LiaisonFormData = z.infer<typeof liaisonSchema>;

const AddLiaisonForm = () => {
  const [open, setOpen] = useState(false);
  const { addLiaison, refetchLiaisons, ports, isLoadingPorts } = useData();

  const form = useForm<LiaisonFormData>({
    resolver: zodResolver(liaisonSchema),
    defaultValues: {
      label: "",
      media: "",
      from: undefined,
      to: undefined,
      length: undefined,
      status: true,
    }
  });

  const onSubmit = async (data: LiaisonFormData) => {
    try {
      await addLiaison({
        label: data.label,
        media: data.media,
        from: data.from,
        to: data.to,
        length: data.length || undefined,
        status: data.status,
      });
      toast({
        title: "Liaison ajoutée",
        description: `La liaison ${data.label} a été ajoutée avec succès`,
      });
      form.reset();
      setOpen(false);
      refetchLiaisons();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Une erreur est survenue lors de l'ajout de la liaison",
        variant: "destructive",
      });
    }
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
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Label *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: LIA-001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="media"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Média *</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner le média" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Fibre optique">Fibre optique</SelectItem>
                        <SelectItem value="Cuivre">Cuivre</SelectItem>
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
              name="from"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Port d'origine *</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    value={field.value?.toString()}
                    disabled={isLoadingPorts}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner le port d'origine" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ports?.map((port) => (
                        <SelectItem key={port.id} value={port.id.toString()}>
                          {port.port_label} - {port.device_name} {port.equipement ? `(${port.equipement.name})` : ''}
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
              name="to"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Port de destination *</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    value={field.value?.toString()}
                    disabled={isLoadingPorts}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner le port de destination" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ports?.map((port) => (
                        <SelectItem key={port.id} value={port.id.toString()}>
                          {port.port_label} - {port.device_name} {port.equipement ? `(${port.equipement.name})` : ''}
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
              name="length"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Longueur (mètres)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Ex: 100"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Statut actif
                    </FormLabel>
                    <div className="text-sm text-muted-foreground">
                      La liaison est-elle active ?
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
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