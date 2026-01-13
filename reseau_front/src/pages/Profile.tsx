import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import { User, Mail, Shield, Save, Lock, UserCog } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/ui/page-header";

const profileSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Le mot de passe actuel est requis"),
  newPassword: z.string().min(6, "Le nouveau mot de passe doit contenir au moins 6 caractères"),
  confirmPassword: z.string().min(1, "La confirmation est requise"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

const Profile = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (user) {
      profileForm.reset({
        name: user.name,
        email: user.email,
      });
    }
  }, [user, profileForm]);

  if (!isAuthenticated || !user) {
    return null;
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin":
        return "Administrateur";
      case "technician":
        return "Technicien";
      default:
        return "Utilisateur";
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "technician":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      default:
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    }
  };

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const onProfileSubmit = (data: ProfileFormData) => {
    // Ici, vous feriez l'appel API pour mettre à jour le profil
    console.log("Mise à jour du profil:", data);
    toast({
      title: "Profil mis à jour",
      description: "Vos informations ont été mises à jour avec succès.",
    });
    setIsEditing(false);
    // Mettre à jour le localStorage et le contexte si nécessaire
    const updatedUser = { ...user, ...data };
    localStorage.setItem("currentUser", JSON.stringify(updatedUser));
  };

  const onPasswordSubmit = (data: PasswordFormData) => {
    // Ici, vous feriez l'appel API pour changer le mot de passe
    console.log("Changement de mot de passe");
    toast({
      title: "Mot de passe modifié",
      description: "Votre mot de passe a été modifié avec succès.",
    });
    setIsChangingPassword(false);
    passwordForm.reset();
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Mon Profil"
          description="Gérez vos informations personnelles et vos paramètres de compte"
          icon={<UserCog className="h-6 w-6 text-primary" />}
          breadcrumbs={[
            { label: "Tableau de bord", href: "/" },
            { label: "Profil" },
          ]}
        />

        <div className="grid gap-6 md:grid-cols-2">
          {/* Informations du profil */}
          <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Informations personnelles</CardTitle>
                        <CardDescription>
                          Vos informations de compte et votre rôle
                        </CardDescription>
                      </div>
                      {!isEditing && (
                        <Button variant="outline" onClick={() => setIsEditing(true)}>
                          Modifier
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {!isEditing ? (
                      <div className="space-y-6">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-20 w-20">
                            <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                              {getUserInitials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="text-xl font-semibold">{user.name}</h3>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                            <Badge className={`mt-2 ${getRoleBadgeColor(user.role)}`}>
                              {getRoleLabel(user.role)}
                            </Badge>
                          </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t">
                          <div className="flex items-center gap-3">
                            <User className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">Nom complet</p>
                              <p className="text-sm text-muted-foreground">{user.name}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Mail className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">Email</p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Shield className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">Rôle</p>
                              <p className="text-sm text-muted-foreground">
                                {getRoleLabel(user.role)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <Form {...profileForm}>
                        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                          <FormField
                            control={profileForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nom complet</FormLabel>
                                <FormControl>
                                  <Input placeholder="Votre nom" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={profileForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input type="email" placeholder="votre@email.com" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="flex gap-2 pt-4">
                            <Button type="submit">
                              <Save className="mr-2 h-4 w-4" />
                              Enregistrer
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setIsEditing(false);
                                profileForm.reset();
                              }}
                            >
                              Annuler
                            </Button>
                          </div>
                        </form>
                      </Form>
                    )}
                  </CardContent>
                </Card>

                {/* Changement de mot de passe */}
                <Card>
                  <CardHeader>
                    <CardTitle>Sécurité</CardTitle>
                    <CardDescription>
                      Modifiez votre mot de passe pour sécuriser votre compte
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!isChangingPassword ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                          <Lock className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Mot de passe</p>
                            <p className="text-sm text-muted-foreground">
                              Dernière modification il y a 30 jours
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => setIsChangingPassword(true)}
                          className="w-full"
                        >
                          Changer le mot de passe
                        </Button>
                      </div>
                    ) : (
                      <Form {...passwordForm}>
                        <form
                          onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
                          className="space-y-4"
                        >
                          <FormField
                            control={passwordForm.control}
                            name="currentPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Mot de passe actuel</FormLabel>
                                <FormControl>
                                  <Input
                                    type="password"
                                    placeholder="••••••••"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={passwordForm.control}
                            name="newPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nouveau mot de passe</FormLabel>
                                <FormControl>
                                  <Input
                                    type="password"
                                    placeholder="••••••••"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={passwordForm.control}
                            name="confirmPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Confirmer le mot de passe</FormLabel>
                                <FormControl>
                                  <Input
                                    type="password"
                                    placeholder="••••••••"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="flex gap-2 pt-4">
                            <Button type="submit">
                              <Save className="mr-2 h-4 w-4" />
                              Enregistrer
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setIsChangingPassword(false);
                                passwordForm.reset();
                              }}
                            >
                              Annuler
                            </Button>
                          </div>
                        </form>
                      </Form>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Informations supplémentaires */}
              <Card>
                <CardHeader>
                  <CardTitle>Informations du compte</CardTitle>
                  <CardDescription>
                    Détails supplémentaires sur votre compte
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label className="text-muted-foreground">ID utilisateur</Label>
                      <p className="text-sm font-medium">{user.id}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Statut du compte</Label>
                      <p className="text-sm font-medium">Actif</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
      </div>
    </AppShell>
  );
};

export default Profile;

