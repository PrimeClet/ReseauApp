import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "@/hooks/use-toast";
import { Plus, Users } from "lucide-react";

// Mock users data for demonstration
const mockUsers = [
  {
    id: '1',
    email: 'admin@telecom.fr',
    name: 'Administrateur',
    role: 'admin',
    lastLogin: '2024-01-15 14:30',
    status: 'En ligne'
  },
  {
    id: '2',
    email: 'tech@telecom.fr',
    name: 'Technicien Réseau',
    role: 'technician',
    lastLogin: '2024-01-15 09:15',
    status: 'Hors ligne'
  },
  {
    id: '3',
    email: 'user@telecom.fr',
    name: 'Utilisateur',
    role: 'user',
    lastLogin: '2024-01-14 16:45',
    status: 'Hors ligne'
  }
];

const userSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  email: z.string().email("Email invalide"),
  role: z.string().min(1, "Le rôle est requis")
});

type UserFormData = z.infer<typeof userSchema>;

const UsersSection = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState(mockUsers);
  const [open, setOpen] = useState(false);

  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "user"
    }
  });

  const onSubmit = (data: UserFormData) => {
    const newUser = {
      id: Date.now().toString(),
      name: data.name!,
      email: data.email!,
      role: data.role!,
      lastLogin: "Jamais",
      status: "Hors ligne"
    };
    setUsers(prev => [...prev, newUser]);
    toast({
      title: "Utilisateur ajouté",
      description: `L'utilisateur ${data.name} a été ajouté avec succès`,
    });
    form.reset();
    setOpen(false);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'technician': return 'bg-blue-100 text-blue-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrateur';
      case 'technician': return 'Technicien';
      default: return 'Utilisateur';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion des utilisateurs</h1>
          <p className="text-muted-foreground">
            Gérez les comptes utilisateurs et leurs permissions
          </p>
        </div>
        <div className="flex gap-2">
          {user?.role === 'admin' && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nouvel utilisateur
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Ajouter un utilisateur</DialogTitle>
                  <DialogDescription>
                    Créer un nouveau compte utilisateur
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom complet</FormLabel>
                          <FormControl>
                            <Input placeholder="Jean Dupont" {...field} />
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
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="jean.dupont@telecom.fr" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rôle</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner le rôle" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">Utilisateur</SelectItem>
                                <SelectItem value="technician">Technicien</SelectItem>
                                <SelectItem value="admin">Administrateur</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                        Annuler
                      </Button>
                      <Button type="submit">Créer</Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Utilisateurs ({users.length})
          </CardTitle>
          <CardDescription>
            Liste de tous les utilisateurs du système
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarFallback>
                      {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-medium">{user.name}</h4>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Dernière connexion: {user.lastLogin}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getRoleBadgeColor(user.role)}>
                    {getRoleLabel(user.role)}
                  </Badge>
                  <Badge variant={user.status === 'En ligne' ? 'default' : 'secondary'}>
                    {user.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UsersSection;