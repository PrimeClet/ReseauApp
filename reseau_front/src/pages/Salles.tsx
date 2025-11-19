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

// Données mockées pour les salles
const mockSalles = [
  {
    id: "1",
    nom: "Salle 101",
    batiment: "Bâtiment A",
    etage: "1er étage",
    capacite: 30,
    type: "Bureau",
    etat: "Actif"
  },
  {
    id: "2",
    nom: "Salle 201",
    batiment: "Bâtiment A",
    etage: "2ème étage",
    capacite: 50,
    type: "Réunion",
    etat: "Actif"
  },
  {
    id: "3",
    nom: "Salle 301",
    batiment: "Bâtiment B",
    etage: "3ème étage",
    capacite: 20,
    type: "Bureau",
    etat: "Maintenance"
  }
];

const salleSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  batiment: z.string().min(1, "Le bâtiment est requis"),
  etage: z.string().min(1, "L'étage est requis"),
  capacite: z.string().min(1, "La capacité est requise"),
  type: z.string().min(1, "Le type est requis"),
  etat: z.string().min(1, "L'état est requis")
});

type SalleFormData = z.infer<typeof salleSchema>;

const Salles = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [salles, setSalles] = useState(mockSalles);
  const [selectedSalle, setSelectedSalle] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const form = useForm<SalleFormData>({
    resolver: zodResolver(salleSchema),
    defaultValues: {
      nom: "",
      batiment: "",
      etage: "",
      capacite: "",
      type: "",
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

  const handleRowClick = (salle: any) => {
    setSelectedSalle(salle);
    setIsDetailsOpen(true);
  };

  const handleEdit = (salle: any) => {
    setSelectedSalle(salle);
    setIsEditOpen(true);
  };

  const handleSave = (updatedSalle: any) => {
    setSalles(salles.map(s => s.id === updatedSalle.id ? updatedSalle : s));
    toast({
      title: "Salle mise à jour",
      description: "La salle a été mise à jour avec succès",
    });
    setIsEditOpen(false);
  };

  const onSubmit = (data: SalleFormData) => {
    const newSalle = {
      id: Date.now().toString(),
      ...data,
      capacite: parseInt(data.capacite)
    };
    setSalles([...salles, newSalle]);
    toast({
      title: "Salle ajoutée",
      description: `La salle ${data.nom} a été ajoutée avec succès`,
    });
    form.reset();
    setIsAddOpen(false);
  };

  // Transformer les données pour DataTableEnhanced
  const tableData = salles.map(s => ({
    nom: s.nom,
    batiment: s.batiment,
    etage: s.etage,
    capacite: `${s.capacite} personnes`,
    type: s.type,
    etat: s.etat
  }));

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Gestion des Salles</h2>
            <div className="text-sm text-muted-foreground mt-1">
              Configuration et gestion des salles de vos bâtiments
            </div>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Ajouter une salle
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Ajouter une nouvelle salle</DialogTitle>
                <DialogDescription>
                  Remplissez les informations de la nouvelle salle.
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
                          <Input placeholder="Salle 401" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="batiment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bâtiment</FormLabel>
                        <FormControl>
                          <Input placeholder="Bâtiment A" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="etage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Étage</FormLabel>
                        <FormControl>
                          <Input placeholder="1er étage" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="capacite"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Capacité</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="30" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <FormControl>
                          <Input placeholder="Bureau" {...field} />
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
          title={`${salles.length} salles configurées`}
          columns={["nom", "batiment", "etage", "capacite", "type", "etat"]}
          data={tableData}
          onRowClick={handleRowClick}
          onEdit={handleEdit}
        />

        <DetailsModal
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
          title="Détails de la salle"
          data={selectedSalle}
          onEdit={() => {
            setIsDetailsOpen(false);
            setIsEditOpen(true);
          }}
        />

        <EditModal
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          title="Modifier la salle"
          data={selectedSalle}
          onSave={handleSave}
        />
      </div>
    </AppShell>
  );
};

export default Salles;
