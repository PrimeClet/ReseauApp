import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import AppShell from "@/components/layout/AppShell";
import DataTableEnhanced from "@/components/ui/data-table-enhanced";
import DetailsModal from "@/components/ui/details-modal";
import EditModal from "@/components/ui/edit-modal";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";

// Données mockées pour les bâtiments
const mockBatiments = [
  {
    id: "1",
    nom: "Bâtiment A",
    adresse: "123 Rue Principale",
    ville: "Paris",
    codePostal: "75001",
    nombreSalles: 15,
    etat: "Actif"
  },
  {
    id: "2",
    nom: "Bâtiment B",
    adresse: "456 Avenue Centrale",
    ville: "Lyon",
    codePostal: "69001",
    nombreSalles: 8,
    etat: "Actif"
  },
  {
    id: "3",
    nom: "Bâtiment C",
    adresse: "789 Boulevard Nord",
    ville: "Marseille",
    codePostal: "13001",
    nombreSalles: 12,
    etat: "Maintenance"
  }
];

const batimentSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  adresse: z.string().min(1, "L'adresse est requise"),
  ville: z.string().min(1, "La ville est requise"),
  codePostal: z.string().min(1, "Le code postal est requis"),
  etat: z.string().min(1, "L'état est requis")
});

type BatimentFormData = z.infer<typeof batimentSchema>;

const Batiments = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [batiments, setBatiments] = useState(mockBatiments);
  const [selectedBatiment, setSelectedBatiment] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const form = useForm<BatimentFormData>({
    resolver: zodResolver(batimentSchema),
    defaultValues: {
      nom: "",
      adresse: "",
      ville: "",
      codePostal: "",
      etat: "Actif"
    }
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  const handleRowClick = (batiment: any) => {
    setSelectedBatiment(batiment);
    setIsDetailsOpen(true);
  };

  const handleEdit = (batiment: any) => {
    setSelectedBatiment(batiment);
    setIsEditOpen(true);
  };

  const handleSave = (updatedBatiment: any) => {
    setBatiments(batiments.map(b => b.id === updatedBatiment.id ? updatedBatiment : b));
    toast({
      title: "Bâtiment mis à jour",
      description: "Le bâtiment a été mis à jour avec succès",
    });
    setIsEditOpen(false);
  };

  const onSubmit = (data: BatimentFormData) => {
    const newBatiment = {
      id: Date.now().toString(),
      ...data,
      nombreSalles: 0
    };
    setBatiments([...batiments, newBatiment]);
    toast({
      title: "Bâtiment ajouté",
      description: `Le bâtiment ${data.nom} a été ajouté avec succès`,
    });
    form.reset();
    setIsAddOpen(false);
  };

  // Transformer les données pour DataTableEnhanced
  const tableData = batiments.map(b => ({
    nom: b.nom,
    adresse: b.adresse,
    ville: b.ville,
    codePostal: b.codePostal,
    nombreSalles: `${b.nombreSalles} salles`,
    etat: b.etat
  }));

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Gestion des Bâtiments</h2>
            <div className="text-sm text-muted-foreground mt-1">
              Configuration et gestion des bâtiments de votre infrastructure
            </div>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Ajouter un bâtiment
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Ajouter un nouveau bâtiment</DialogTitle>
                <DialogDescription>
                  Remplissez les informations du nouveau bâtiment.
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
                          <Input placeholder="Bâtiment D" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="adresse"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Adresse</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Rue Exemple" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="ville"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ville</FormLabel>
                        <FormControl>
                          <Input placeholder="Paris" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="codePostal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Code postal</FormLabel>
                        <FormControl>
                          <Input placeholder="75001" {...field} />
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
                          <Input placeholder="Actif" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end space-x-2">
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
          title={`${batiments.length} bâtiments configurés`}
          columns={["nom", "adresse", "ville", "codePostal", "nombreSalles", "etat"]}
          data={tableData}
          onRowClick={handleRowClick}
          onEdit={handleEdit}
        />

        <DetailsModal
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
          title="Détails du bâtiment"
          data={selectedBatiment}
          onEdit={() => {
            setIsDetailsOpen(false);
            setIsEditOpen(true);
          }}
        />

        <EditModal
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          title="Modifier le bâtiment"
          data={selectedBatiment}
          onSave={handleSave}
        />
      </div>
    </AppShell>
  );
};

export default Batiments;
