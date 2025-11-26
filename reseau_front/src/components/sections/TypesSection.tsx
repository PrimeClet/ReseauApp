import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import DataTableEnhanced from "@/components/ui/data-table-enhanced";
import DetailsModal from "@/components/ui/details-modal";
import EditModal from "@/components/ui/edit-modal";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";

const typeSchema = z.object({
  nom: z.string().min(1, "Le nom du type est requis"),
  groupe: z.string().min(1, "Le groupe du type est requis"),
});

type TypeFormData = z.infer<typeof typeSchema>;

type TypeEntry = {
  id: string;
  nom: string;
  groupe: string;
};

const initialTypes: TypeEntry[] = [
  { id: "1", nom: "Switch Core", groupe: "Équipements" },
  { id: "2", nom: "Routeur Edge", groupe: "Équipements" },
  { id: "3", nom: "Salle Serveurs", groupe: "Localisation" },
];

const TypesSection = () => {
  const [types, setTypes] = useState<TypeEntry[]>(initialTypes);
  const [selectedType, setSelectedType] = useState<TypeEntry | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const form = useForm<TypeFormData>({
    resolver: zodResolver(typeSchema),
    defaultValues: {
      nom: "",
      groupe: "",
    },
  });

  const handleRowClick = (type: TypeEntry) => {
    setSelectedType(type);
    setIsDetailsOpen(true);
  };

  const handleEdit = (type: TypeEntry) => {
    setSelectedType(type);
    setIsEditOpen(true);
  };

  const handleSave = (updated: TypeEntry) => {
    setTypes((prev) => prev.map((type) => (type.id === updated.id ? updated : type)));
    toast({
      title: "Type mis à jour",
      description: "Les informations du type ont été mises à jour avec succès.",
    });
    setIsEditOpen(false);
  };

  const onSubmit = (data: TypeFormData) => {
    const newType: TypeEntry = {
      id: Date.now().toString(),
      nom: data.nom,
      groupe: data.groupe,
    };
    setTypes((prev) => [...prev, newType]);
    toast({
      title: "Type ajouté",
      description: `Le type ${data.nom} a été créé.`,
    });
    form.reset();
    setIsAddOpen(false);
  };

  const tableData = types.map((type) => ({
    nom: type.nom,
    groupe: type.groupe,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gestion des Types</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Créez et gérez les types utilisés dans l’inventaire réseau.
          </p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un type
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Nouveau type</DialogTitle>
              <DialogDescription>
                Saisissez le nom et le groupe du type à créer.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="nom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom du type</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex. Switch Core" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="groupe"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Groupe du type</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex. Équipements" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit">Ajouter</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <DataTableEnhanced
        title={`${types.length} types configurés`}
        columns={["nom", "groupe"]}
        data={tableData}
        onRowClick={handleRowClick}
        onEdit={handleEdit}
      />

      <DetailsModal
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        title="Détails du type"
        data={selectedType}
        onEdit={() => {
          setIsDetailsOpen(false);
          setIsEditOpen(true);
        }}
      />

      <EditModal
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        title="Modifier le type"
        data={selectedType}
        onSave={handleSave}
      />
    </div>
  );
};

export default TypesSection;

