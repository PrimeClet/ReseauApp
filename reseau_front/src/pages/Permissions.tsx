import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import AppShell from "@/components/layout/AppShell";
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
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";

type PermissionEntry = {
  id: string;
  nom: string;
  ressource: string;
  description: string;
};

const initialPermissions: PermissionEntry[] = [
  {
    id: "1",
    nom: "coffrets.read",
    ressource: "Coffrets",
    description: "Lecture seule sur la liste des coffrets.",
  },
  {
    id: "2",
    nom: "equipements.manage",
    ressource: "Équipements",
    description: "Création, édition et suppression d’équipements.",
  },
  {
    id: "3",
    nom: "statistiques.view",
    ressource: "Statistiques",
    description: "Accès aux tableaux de bord et rapports.",
  },
];

const permissionSchema = z.object({
  nom: z.string().min(1, "Le nom de la permission est requis"),
  ressource: z.string().min(1, "La ressource est requise"),
  description: z.string().min(1, "La description est requise"),
});

type PermissionFormData = z.infer<typeof permissionSchema>;

const Permissions = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [permissions, setPermissions] = useState<PermissionEntry[]>(initialPermissions);
  const [selectedPermission, setSelectedPermission] = useState<PermissionEntry | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  const form = useForm<PermissionFormData>({
    resolver: zodResolver(permissionSchema),
    defaultValues: {
      nom: "",
      ressource: "",
      description: "",
    },
  });

  if (!isAuthenticated) {
    return null;
  }

  const handleRowClick = (permission: PermissionEntry) => {
    setSelectedPermission(permission);
    setIsDetailsOpen(true);
  };

  const handleEdit = (permission: PermissionEntry) => {
    setSelectedPermission(permission);
    setIsEditOpen(true);
  };

  const handleSave = (updatedPermission: PermissionEntry) => {
    setPermissions((prev) =>
      prev.map((permission) => (permission.id === updatedPermission.id ? updatedPermission : permission)),
    );
    toast({
      title: "Permission mise à jour",
      description: "Les informations de la permission ont été enregistrées.",
    });
    setIsEditOpen(false);
  };

  const onSubmit = (data: PermissionFormData) => {
    const newPermission: PermissionEntry = {
      id: Date.now().toString(),
      ...data,
    };
    setPermissions((prev) => [...prev, newPermission]);
    toast({
      title: "Permission créée",
      description: `La permission ${data.nom} a été ajoutée.`,
    });
    form.reset();
    setIsAddOpen(false);
  };

  const tableData = permissions.map((permission) => ({
    nom: permission.nom,
    ressource: permission.ressource,
    description: permission.description,
  }));

  return (
    <AppShell>
      <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Gestion des permissions</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Définissez les permissions disponibles pour les rôles utilisateur.
                  </p>
                </div>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Ajouter une permission
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Nouvelle permission</DialogTitle>
                      <DialogDescription>
                        Indiquez la ressource concernée et la portée de la permission.
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="nom"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nom technique</FormLabel>
                              <FormControl>
                                <Input placeholder="ex: equipements.manage" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="ressource"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Ressource</FormLabel>
                              <FormControl>
                                <Input placeholder="Module ou entité concernée" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Décrivez la portée de cette permission" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                            Annuler
                          </Button>
                          <Button type="submit">Créer</Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>

              <DataTableEnhanced
                title={`${permissions.length} permissions configurées`}
                columns={["nom", "ressource", "description"]}
                data={tableData}
                onRowClick={handleRowClick}
                onEdit={handleEdit}
              />

              <DetailsModal
                open={isDetailsOpen}
                onOpenChange={setIsDetailsOpen}
                title="Détails de la permission"
                data={selectedPermission}
                onEdit={() => {
                  setIsDetailsOpen(false);
                  setIsEditOpen(true);
                }}
              />

              <EditModal
                open={isEditOpen}
                onOpenChange={setIsEditOpen}
                title="Modifier la permission"
                data={selectedPermission}
                onSave={handleSave}
              />
      </div>
    </AppShell>
  );
};

export default Permissions;

