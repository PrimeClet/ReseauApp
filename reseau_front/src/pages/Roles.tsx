import { useState, useMemo, useEffect } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import roleService, { Role } from "@/services/roleService";
import permissionService, { PermissionModule } from "@/services/permissionService";
import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/ui/page-header";
import DataTableEnhanced from "@/components/ui/data-table-enhanced";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "@/hooks/use-toast";
import { Plus, ShieldCheck, Loader2, Users, KeyRound } from "lucide-react";

const roleSchema = z.object({
  name: z.string().min(2, "Le nom du rôle doit contenir au moins 2 caractères"),
  permissions: z.array(z.string()).optional(),
});

type RoleFormData = z.infer<typeof roleSchema>;

const RolesPage = () => {
  const { isAuthenticated, isLoading: isLoadingAuth } = useRequireAuth();
  const queryClient = useQueryClient();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPermissionsOpen, setIsPermissionsOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  // Queries
  const { data: roles, isLoading: isLoadingRoles } = useQuery({
    queryKey: ['roles'],
    queryFn: () => roleService.getAll(),
    enabled: isAuthenticated,
  });

  const { data: permissionsData, isLoading: isLoadingPermissions } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => permissionService.getAll(),
    enabled: isAuthenticated,
  });

  const permissionModules = permissionsData?.data || [];

  // Mutations
  const createRoleMutation = useMutation({
    mutationFn: roleService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast({ title: "Rôle créé", description: "Le rôle a été créé avec succès." });
      setIsAddOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error?.response?.data?.message || "Une erreur est survenue.",
        variant: "destructive",
      });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => roleService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast({ title: "Rôle modifié", description: "Le rôle a été modifié avec succès." });
      setIsEditOpen(false);
      setSelectedRole(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error?.response?.data?.message || "Une erreur est survenue.",
        variant: "destructive",
      });
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: roleService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast({ title: "Rôle supprimé", description: "Le rôle a été supprimé avec succès." });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error?.response?.data?.message || "Une erreur est survenue.",
        variant: "destructive",
      });
    },
  });

  const assignPermissionsMutation = useMutation({
    mutationFn: ({ id, permissions }: { id: number; permissions: string[] }) =>
      roleService.assignPermissions(id, permissions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast({ title: "Permissions mises à jour", description: "Les permissions ont été assignées." });
      setIsPermissionsOpen(false);
      setSelectedRole(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error?.response?.data?.message || "Une erreur est survenue.",
        variant: "destructive",
      });
    },
  });

  // Forms
  const form = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: "",
      permissions: [],
    },
  });

  const editForm = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: "",
      permissions: [],
    },
  });

  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  // Préparer les données pour le tableau
  const tableData = useMemo(() => {
    if (!roles) return [];
    return roles.map((role) => ({
      id: role.id,
      Nom: role.name,
      Permissions: role.permissions_count,
      Utilisateurs: role.users_count,
      ...role,
    }));
  }, [roles]);

  // Remplir le formulaire d'édition
  useEffect(() => {
    if (selectedRole && isEditOpen) {
      editForm.reset({
        name: selectedRole.name,
        permissions: selectedRole.permissions || [],
      });
    }
  }, [selectedRole, isEditOpen, editForm]);

  // Remplir les permissions sélectionnées
  useEffect(() => {
    if (selectedRole && isPermissionsOpen) {
      setSelectedPermissions(selectedRole.permissions || []);
    }
  }, [selectedRole, isPermissionsOpen]);

  const handleEdit = (role: any) => {
    setSelectedRole(role);
    setIsEditOpen(true);
  };

  const handleManagePermissions = (role: Role) => {
    setSelectedRole(role);
    setIsPermissionsOpen(true);
  };

  const handleDelete = async (id: number) => {
    deleteRoleMutation.mutate(id);
  };

  const onSubmit = async (data: RoleFormData) => {
    createRoleMutation.mutate({
      name: data.name,
      permissions: data.permissions || [],
    });
  };

  const onEditSubmit = async (data: RoleFormData) => {
    if (!selectedRole) return;
    updateRoleMutation.mutate({
      id: selectedRole.id,
      data: { name: data.name },
    });
  };

  const handleSavePermissions = () => {
    if (!selectedRole) return;
    assignPermissionsMutation.mutate({
      id: selectedRole.id,
      permissions: selectedPermissions,
    });
  };

  const togglePermission = (permName: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permName)
        ? prev.filter((p) => p !== permName)
        : [...prev, permName]
    );
  };

  const toggleModulePermissions = (module: PermissionModule, selectAll: boolean) => {
    const modulePermNames = module.permissions.map((p) => p.name);
    setSelectedPermissions((prev) => {
      if (selectAll) {
        return [...new Set([...prev, ...modulePermNames])];
      } else {
        return prev.filter((p) => !modulePermNames.includes(p));
      }
    });
  };

  const isModuleFullySelected = (module: PermissionModule) => {
    return module.permissions.every((p) => selectedPermissions.includes(p.name));
  };

  const isModulePartiallySelected = (module: PermissionModule) => {
    return module.permissions.some((p) => selectedPermissions.includes(p.name)) && !isModuleFullySelected(module);
  };

  // Rendu personnalisé pour les permissions
  const renderPermissionsCell = (value: number) => {
    return (
      <Badge variant="secondary" className="font-mono">
        <KeyRound className="h-3 w-3 mr-1" />
        {value}
      </Badge>
    );
  };

  // Rendu personnalisé pour les utilisateurs
  const renderUsersCell = (value: number) => {
    return (
      <Badge variant="outline">
        <Users className="h-3 w-3 mr-1" />
        {value}
      </Badge>
    );
  };

  // Rôles système non supprimables
  const systemRoles = ['Super Admin', 'Administrateur', 'Technicien', 'Observateur'];

  if (isLoadingAuth) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Gestion des rôles"
          description="Créez et maintenez les rôles et permissions des utilisateurs"
          icon={<ShieldCheck className="h-6 w-6 text-primary" />}
          breadcrumbs={[
            { label: "Tableau de bord", href: "/" },
            { label: "Rôles" },
          ]}
          actions={
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
                    Définissez le nom du rôle. Les permissions peuvent être ajoutées après.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom du rôle *</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex. Superviseur" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                        Annuler
                      </Button>
                      <Button type="submit" disabled={createRoleMutation.isPending}>
                        {createRoleMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Créer
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          }
        />

        {isLoadingRoles ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <DataTableEnhanced
            title={`${tableData.length} rôle${tableData.length > 1 ? 's' : ''} configuré${tableData.length > 1 ? 's' : ''}`}
            columns={["Nom", "Permissions", "Utilisateurs"]}
            data={tableData}
            onEdit={handleEdit}
            onDelete={(id) => {
              const role = roles?.find((r) => r.id === id);
              if (role && systemRoles.includes(role.name)) {
                toast({
                  title: "Action non autorisée",
                  description: "Les rôles système ne peuvent pas être supprimés.",
                  variant: "destructive",
                });
                return;
              }
              handleDelete(id);
            }}
            deleteConfirmTitle="Supprimer le rôle"
            deleteConfirmDescription="Êtes-vous sûr de vouloir supprimer ce rôle ? Cette action est irréversible."
            customCellRenderers={{
              "Permissions": renderPermissionsCell,
              "Utilisateurs": renderUsersCell,
            }}
            renderRowActions={(row) => (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleManagePermissions(row);
                }}
                title="Gérer les permissions"
              >
                <KeyRound className="h-4 w-4" />
              </Button>
            )}
          />
        )}

        {/* Modal d'édition du nom */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Modifier le rôle</DialogTitle>
              <DialogDescription>
                Modifier le nom du rôle {selectedRole?.name}
              </DialogDescription>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom du rôle *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex. Superviseur" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={updateRoleMutation.isPending}>
                    {updateRoleMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Enregistrer
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Modal de gestion des permissions */}
        <Dialog open={isPermissionsOpen} onOpenChange={setIsPermissionsOpen}>
          <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Permissions du rôle: {selectedRole?.name}</DialogTitle>
              <DialogDescription>
                Sélectionnez les permissions pour ce rôle. {selectedPermissions.length} permission(s) sélectionnée(s).
              </DialogDescription>
            </DialogHeader>

            {isLoadingPermissions ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <ScrollArea className="h-[400px] pr-4">
                <Accordion type="multiple" className="w-full">
                  {permissionModules.map((module) => (
                    <AccordionItem key={module.module} value={module.module}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={isModuleFullySelected(module)}
                            ref={(ref) => {
                              if (ref) {
                                (ref as any).indeterminate = isModulePartiallySelected(module);
                              }
                            }}
                            onCheckedChange={(checked) => {
                              toggleModulePermissions(module, !!checked);
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span className="font-medium">{module.module_label}</span>
                          <Badge variant="secondary" className="ml-2">
                            {module.permissions.filter((p) => selectedPermissions.includes(p.name)).length}/{module.permissions.length}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-2 gap-2 pl-8 pt-2">
                          {module.permissions.map((perm) => (
                            <label
                              key={perm.id}
                              className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                            >
                              <Checkbox
                                checked={selectedPermissions.includes(perm.name)}
                                onCheckedChange={() => togglePermission(perm.name)}
                              />
                              <span className="text-sm">{perm.action_label}</span>
                            </label>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </ScrollArea>
            )}

            <div className="flex justify-between items-center pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                {selectedPermissions.length} permission(s) sélectionnée(s)
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsPermissionsOpen(false)}>
                  Annuler
                </Button>
                <Button
                  onClick={handleSavePermissions}
                  disabled={assignPermissionsMutation.isPending}
                >
                  {assignPermissionsMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Enregistrer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
};

export default RolesPage;
