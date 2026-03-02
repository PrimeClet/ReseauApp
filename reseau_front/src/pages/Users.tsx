import { useState, useMemo, useEffect } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import userService, { User, UserCreateData } from "@/services/userService";
import roleService, { Role } from "@/services/roleService";
import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/ui/page-header";
import DataTableEnhanced from "@/components/ui/data-table-enhanced";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Plus, Users, UserCheck, UserX, Shield, Eye, EyeOff } from "lucide-react";
import { PhoneInput } from "@/components/ui/phone-input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Schema de validation pour l'ajout d'utilisateur
const userSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  surname: z.string().optional(),
  username: z.string().min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères"),
  email: z.string().email("Email invalide"),
  phone: z.string().optional(),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  password_confirmation: z.string(),
  is_active: z.boolean().optional(),
  roles: z.array(z.string()).optional(),
}).refine((data) => data.password === data.password_confirmation, {
  message: "Les mots de passe ne correspondent pas",
  path: ["password_confirmation"],
});

// Schema pour la modification (mot de passe optionnel)
const userUpdateSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  surname: z.string().optional(),
  username: z.string().min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères"),
  email: z.string().email("Email invalide"),
  phone: z.string().optional(),
  password: z.string().optional(),
  password_confirmation: z.string().optional(),
  is_active: z.boolean().optional(),
  roles: z.array(z.string()).optional(),
}).refine((data) => !data.password || data.password === data.password_confirmation, {
  message: "Les mots de passe ne correspondent pas",
  path: ["password_confirmation"],
});

type UserFormData = z.infer<typeof userSchema>;

const UsersPage = () => {
  const { isAuthenticated, isLoading: isLoadingAuth, user: currentUser } = useRequireAuth();
  const queryClient = useQueryClient();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Queries
  const { data: usersData, isLoading: isLoadingUsers, refetch: refetchUsers } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getAll({ per_page: 100 }),
    enabled: isAuthenticated,
  });

  const { data: roles, isLoading: isLoadingRoles } = useQuery({
    queryKey: ['roles'],
    queryFn: () => roleService.getAll(),
    enabled: isAuthenticated,
  });

  // Mutations
  const createUserMutation = useMutation({
    mutationFn: userService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ title: "Utilisateur créé", description: "L'utilisateur a été créé avec succès." });
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

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => userService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ title: "Utilisateur modifié", description: "L'utilisateur a été modifié avec succès." });
      setIsEditOpen(false);
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error?.response?.data?.message || "Une erreur est survenue.",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: userService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ title: "Utilisateur supprimé", description: "L'utilisateur a été supprimé avec succès." });
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error?.response?.data?.message || "Une erreur est survenue.",
        variant: "destructive",
      });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: userService.toggleStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ title: "Statut modifié", description: "Le statut de l'utilisateur a été modifié." });
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
  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: "",
      surname: "",
      username: "",
      email: "",
      phone: "",
      password: "",
      password_confirmation: "",
      is_active: true,
      roles: [],
    },
  });

  const editForm = useForm<UserFormData>({
    resolver: zodResolver(userUpdateSchema),
    defaultValues: {
      name: "",
      surname: "",
      username: "",
      email: "",
      phone: "",
      password: "",
      password_confirmation: "",
      is_active: true,
      roles: [],
    },
  });

  // Préparer les données pour le tableau
  const users = usersData?.data || [];

  const tableData = useMemo(() => {
    let data = users.map((user) => ({
      id: user.id,
      Nom: `${user.name} ${user.surname || ''}`.trim(),
      Username: user.username,
      Email: user.email,
      Téléphone: user.phone || '-',
      Rôles: user.roles?.join(', ') || '-',
      Statut: user.is_active ? 'Actif' : 'Inactif',
      ...user,
    }));

    // Filtre par rôle
    if (roleFilter !== "all") {
      data = data.filter((user) => user.roles?.includes(roleFilter));
    }

    // Filtre par statut
    if (statusFilter !== "all") {
      data = data.filter((user) => {
        if (statusFilter === "active") return user.is_active;
        if (statusFilter === "inactive") return !user.is_active;
        return true;
      });
    }

    return data;
  }, [users, roleFilter, statusFilter]);

  // Remplir le formulaire d'édition
  useEffect(() => {
    if (selectedUser && isEditOpen) {
      editForm.reset({
        name: selectedUser.name,
        surname: selectedUser.surname || "",
        username: selectedUser.username,
        email: selectedUser.email,
        phone: selectedUser.phone || "",
        password: "",
        password_confirmation: "",
        is_active: selectedUser.is_active,
        roles: selectedUser.roles || [],
      });
    }
  }, [selectedUser, isEditOpen, editForm]);

  const handleEdit = (user: any) => {
    setSelectedUser(user);
    setIsEditOpen(true);
  };

  const handleDelete = (user: any) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedUser) {
      deleteUserMutation.mutate(selectedUser.id);
    }
  };

  const handleToggleStatus = (userId: number) => {
    toggleStatusMutation.mutate(userId);
  };

  const onSubmit = async (data: UserFormData) => {
    createUserMutation.mutate(data as UserCreateData);
  };

  const onEditSubmit = async (data: UserFormData) => {
    if (!selectedUser) return;

    const updateData: any = {
      name: data.name,
      surname: data.surname,
      username: data.username,
      email: data.email,
      phone: data.phone,
      is_active: data.is_active,
      roles: data.roles,
    };

    if (data.password) {
      updateData.password = data.password;
      updateData.password_confirmation = data.password_confirmation;
    }

    updateUserMutation.mutate({ id: selectedUser.id, data: updateData });
  };

  // Rendu personnalisé pour les rôles
  const renderRolesCell = (value: string) => {
    if (!value || value === '-') return <span className="text-muted-foreground">-</span>;

    const roleColors: Record<string, string> = {
      'Super Admin': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'Administrateur': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'Technicien': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'Observateur': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    };

    return (
      <div className="flex flex-wrap gap-1">
        {value.split(', ').map((role, idx) => (
          <Badge key={idx} className={roleColors[role] || 'bg-gray-100 text-gray-800'}>
            {role}
          </Badge>
        ))}
      </div>
    );
  };

  // Rendu personnalisé pour le statut
  const renderStatusCell = (value: string) => {
    const isActive = value === 'Actif';
    return (
      <Badge className={isActive
        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      }>
        {isActive ? <UserCheck className="h-3 w-3 mr-1" /> : <UserX className="h-3 w-3 mr-1" />}
        {value}
      </Badge>
    );
  };

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
          title="Gestion des utilisateurs"
          description="Gérer les comptes utilisateurs et leurs accès"
          icon={<Users className="h-6 w-6 text-primary" />}
          breadcrumbs={[
            { label: "Tableau de bord", href: "/" },
            { label: "Utilisateurs" },
          ]}
          actions={
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un utilisateur
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Nouvel utilisateur</DialogTitle>
                  <DialogDescription>
                    Créer un nouveau compte utilisateur
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nom *</FormLabel>
                            <FormControl>
                              <Input placeholder="Nom" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="surname"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Prénom</FormLabel>
                            <FormControl>
                              <Input placeholder="Prénom" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom d'utilisateur *</FormLabel>
                          <FormControl>
                            <Input placeholder="username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email *</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="email@exemple.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Téléphone</FormLabel>
                          <FormControl>
                            <PhoneInput
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="Numéro de téléphone"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mot de passe *</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type={showPassword ? "text" : "password"}
                                  placeholder="••••••••"
                                  {...field}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-0 top-0 h-full px-3"
                                  onClick={() => setShowPassword(!showPassword)}
                                >
                                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="password_confirmation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirmer *</FormLabel>
                            <FormControl>
                              <Input type={showPassword ? "text" : "password"} placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="roles"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rôles</FormLabel>
                          <div className="flex flex-wrap gap-2 p-3 border rounded-lg">
                            {roles?.map((role) => (
                              <label key={role.id} className="flex items-center gap-2 cursor-pointer">
                                <Checkbox
                                  checked={field.value?.includes(role.name)}
                                  onCheckedChange={(checked) => {
                                    const newValue = checked
                                      ? [...(field.value || []), role.name]
                                      : (field.value || []).filter((r) => r !== role.name);
                                    field.onChange(newValue);
                                  }}
                                />
                                <span className="text-sm">{role.name}</span>
                              </label>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="is_active"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-3">
                          <div>
                            <FormLabel>Compte actif</FormLabel>
                            <p className="text-xs text-muted-foreground">
                              L'utilisateur pourra se connecter
                            </p>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                        Annuler
                      </Button>
                      <Button type="submit" disabled={createUserMutation.isPending}>
                        {createUserMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Créer
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          }
        />

        {isLoadingUsers || isLoadingRoles ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <DataTableEnhanced
            title={`${tableData.length} utilisateur${tableData.length > 1 ? 's' : ''}`}
            columns={["Nom", "Username", "Email", "Téléphone", "Rôles", "Statut"]}
            data={tableData}
            onEdit={handleEdit}
            onDelete={(id) => {
              const user = users.find(u => u.id === id);
              if (user) handleDelete(user);
            }}
            deleteConfirmTitle="Supprimer l'utilisateur"
            deleteConfirmDescription="Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible."
            customCellRenderers={{
              "Rôles": renderRolesCell,
              "Statut": renderStatusCell,
            }}
            customFilters={
              <>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">Rôle:</span>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Tous" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les rôles</SelectItem>
                      {roles?.map((role) => (
                        <SelectItem key={role.id} value={role.name}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">Statut:</span>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Tous" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      <SelectItem value="active">Actif</SelectItem>
                      <SelectItem value="inactive">Inactif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            }
          />
        )}

        {/* Modal d'édition */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Modifier l'utilisateur</DialogTitle>
              <DialogDescription>
                Modifier les informations de {selectedUser?.name}
              </DialogDescription>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nom" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="surname"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prénom</FormLabel>
                        <FormControl>
                          <Input placeholder="Prénom" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={editForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom d'utilisateur *</FormLabel>
                      <FormControl>
                        <Input placeholder="username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="email@exemple.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Téléphone</FormLabel>
                      <FormControl>
                        <PhoneInput
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Numéro de téléphone"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nouveau mot de passe</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Laisser vide pour ne pas changer" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="password_confirmation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirmer</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Confirmer" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={editForm.control}
                  name="roles"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rôles</FormLabel>
                      <div className="flex flex-wrap gap-2 p-3 border rounded-lg">
                        {roles?.map((role) => (
                          <label key={role.id} className="flex items-center gap-2 cursor-pointer">
                            <Checkbox
                              checked={field.value?.includes(role.name)}
                              onCheckedChange={(checked) => {
                                const newValue = checked
                                  ? [...(field.value || []), role.name]
                                  : (field.value || []).filter((r) => r !== role.name);
                                field.onChange(newValue);
                              }}
                            />
                            <span className="text-sm">{role.name}</span>
                          </label>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <FormLabel>Compte actif</FormLabel>
                        <p className="text-xs text-muted-foreground">
                          L'utilisateur pourra se connecter
                        </p>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={updateUserMutation.isPending}>
                    {updateUserMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Enregistrer
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Dialog de confirmation de suppression */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer l'utilisateur</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer l'utilisateur {selectedUser?.name} ? Cette action est irréversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppShell>
  );
};

export default UsersPage;
