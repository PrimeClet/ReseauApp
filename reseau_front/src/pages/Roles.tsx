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

type RoleEntry = {
  id: string;
  nom: string;
  description: string;
  permissions: string;
};

const initialRoles: RoleEntry[] = [
  {
    id: "1",
    nom: "Administrateur",
    description: "Accès complet à l’application et aux paramètres critiques.",
    permissions: "Tout",
  },
  {
    id: "2",
    nom: "Technicien",
    description: "Gestion des équipements, ports et interventions.",
    permissions: "Opérations techniques",
  },
  {
    id: "3",
    nom: "Utilisateur",
    description: "Consultation des données et rapports.",
    permissions: "Lecture seule",
  },
];

const roleSchema = z.object({
  nom: z.string().min(1, "Le nom du rôle est requis"),
  description: z.string().min(1, "La description est requise"),
  permissions: z.string().min(1, "Les permissions sont requises"),
});

type RoleFormData = z.infer<typeof roleSchema>;

const Roles = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [roles, setRoles] = useState<RoleEntry[]>(initialRoles);
  const [selectedRole, setSelectedRole] = useState<RoleEntry | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  const form = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      nom: "",
      description: "",
      permissions: "",
    },
  });

  if (!isAuthenticated) {
    return null;
  }

  const handleRowClick = (role: RoleEntry) => {
    setSelectedRole(role);
    setIsDetailsOpen(true);
  };

  const handleEdit = (role: RoleEntry) => {
    setSelectedRole(role);
    setIsEditOpen(true);
  };

  const handleSave = (updatedRole: RoleEntry) => {
    setRoles((prev) => prev.map((role) => (role.id === updatedRole.id ? updatedRole : role)));
    toast({
      title: "Rôle mis à jour",
      description: "Les informations du rôle ont été enregistrées.",
    });
    setIsEditOpen(false);
  };

  const onSubmit = (data: RoleFormData) => {
    const newRole: RoleEntry = {
      id: Date.now().toString(),
      ...data,
    };
    setRoles((prev) => [...prev, newRole]);
    toast({
      title: "Rôle créé",
      description: `Le rôle ${data.nom} a été ajouté.`,
    });
    form.reset();
    setIsAddOpen(false);
  };

  const tableData = roles.map((role) => ({
    nom: role.nom,
    description: role.description,
    permissions: role.permissions,
  }));

  return (
    <AppShell>
      <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Gestion des rôles</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Créez et maintenez les rôles et permissions des utilisateurs.
                  </p>
                </div>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Ajouter un rôle
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Nouveau rôle</DialogTitle>
                      <DialogDescription>
                        Définissez le rôle et ses permissions.
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="nom"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nom du rôle</FormLabel>
                              <FormControl>
                                <Input placeholder="Ex. Superviseur" {...field} />
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
                                <Textarea placeholder="Décrivez les responsabilités" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="permissions"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Permissions</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Ex. Gestion des équipements, lecture rapports..." {...field} />
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
                title={`${roles.length} rôles configurés`}
                columns={["nom", "description", "permissions"]}
                data={tableData}
                onRowClick={handleRowClick}
                onEdit={handleEdit}
              />

              <DetailsModal
                open={isDetailsOpen}
                onOpenChange={setIsDetailsOpen}
                title="Détails du rôle"
                data={selectedRole}
                onEdit={() => {
                  setIsDetailsOpen(false);
                  setIsEditOpen(true);
                }}
              />

              <EditModal
                open={isEditOpen}
                onOpenChange={setIsEditOpen}
                title="Modifier le rôle"
                data={selectedRole}
                onSave={handleSave}
              />
      </div>
    </AppShell>
  );
};

export default Roles;

