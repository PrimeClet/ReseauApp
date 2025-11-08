import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Save, User, Bell, Shield, Database, Palette, Globe } from "lucide-react";

export default function ParametresSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Paramètres Système</h1>
          <p className="text-muted-foreground">Configurez votre environnement et préférences</p>
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Save className="h-4 w-4 mr-2" />
          Sauvegarder
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="bg-muted">
          <TabsTrigger value="general">Général</TabsTrigger>
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Sécurité</TabsTrigger>
          <TabsTrigger value="database">Base de données</TabsTrigger>
          <TabsTrigger value="appearance">Apparence</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Configuration Générale
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company">Nom de l'organisation</Label>
                  <Input id="company" placeholder="Votre entreprise" defaultValue="TelecomNet SA" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Fuseau horaire</Label>
                  <Select defaultValue="europe-paris">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="europe-paris">Europe/Paris (UTC+1)</SelectItem>
                      <SelectItem value="europe-london">Europe/London (UTC+0)</SelectItem>
                      <SelectItem value="america-newyork">America/New_York (UTC-5)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Langue par défaut</Label>
                  <Select defaultValue="fr">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="refresh">Intervalle de rafraîchissement (secondes)</Label>
                  <Input id="refresh" type="number" defaultValue="30" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Paramètres Réseau</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="snmp">Communauté SNMP par défaut</Label>
                  <Input id="snmp" placeholder="public" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timeout">Timeout SNMP (ms)</Label>
                  <Input id="timeout" type="number" defaultValue="5000" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="retries">Nombre de tentatives</Label>
                  <Input id="retries" type="number" defaultValue="3" />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-discovery">Découverte automatique</Label>
                  <Switch id="auto-discovery" defaultChecked />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Gestion des Utilisateurs
                </CardTitle>
                <Button variant="outline">
                  <User className="h-4 w-4 mr-2" />
                  Nouvel utilisateur
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { nom: "Jean Dupont", email: "jean.dupont@company.com", role: "Administrateur", statut: "Actif", derniereConnexion: "Il y a 2 heures" },
                  { nom: "Marie Martin", email: "marie.martin@company.com", role: "Technicien", statut: "Actif", derniereConnexion: "Il y a 1 jour" },
                  { nom: "Pierre Durand", email: "pierre.durand@company.com", role: "Lecteur", statut: "Inactif", derniereConnexion: "Il y a 1 semaine" },
                ].map((user, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="space-y-1">
                      <div className="font-medium text-foreground">{user.nom}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                      <div className="text-xs text-muted-foreground">Dernière connexion: {user.derniereConnexion}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={user.role === "Administrateur" ? "default" : "secondary"}>
                        {user.role}
                      </Badge>
                      <Badge variant={user.statut === "Actif" ? "default" : "secondary"}>
                        {user.statut}
                      </Badge>
                      <Button variant="ghost" size="sm">Modifier</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Paramètres de Notification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-foreground">Alertes d'équipements</div>
                    <div className="text-sm text-muted-foreground">Notifications en cas de panne ou problème</div>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-foreground">Maintenance programmée</div>
                    <div className="text-sm text-muted-foreground">Rappels des maintenances planifiées</div>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-foreground">Seuils de performance</div>
                    <div className="text-sm text-muted-foreground">Alertes basées sur les métriques</div>
                  </div>
                  <Switch />
                </div>
              </div>

              <div className="space-y-4 border-t pt-4">
                <h4 className="font-medium text-foreground">Canaux de notification</h4>
                <div className="space-y-2">
                  <Label htmlFor="email">Adresse email principal</Label>
                  <Input id="email" type="email" placeholder="admin@company.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="webhook">URL Webhook (optionnel)</Label>
                  <Input id="webhook" placeholder="https://hooks.company.com/alerts" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Sécurité d'Accès
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-foreground">Authentification à deux facteurs</div>
                    <div className="text-sm text-muted-foreground">Sécurité renforcée</div>
                  </div>
                  <Switch />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="session-timeout">Timeout de session (minutes)</Label>
                  <Input id="session-timeout" type="number" defaultValue="60" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-policy">Politique de mot de passe</Label>
                  <Select defaultValue="medium">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Basique</SelectItem>
                      <SelectItem value="medium">Moyenne</SelectItem>
                      <SelectItem value="high">Élevée</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Journalisation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-foreground">Logs d'audit</div>
                    <div className="text-sm text-muted-foreground">Traçabilité des actions</div>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="log-retention">Rétention des logs (jours)</Label>
                  <Input id="log-retention" type="number" defaultValue="90" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="log-level">Niveau de log</Label>
                  <Select defaultValue="info">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="error">Erreurs uniquement</SelectItem>
                      <SelectItem value="warn">Avertissements et erreurs</SelectItem>
                      <SelectItem value="info">Informations, avertissements et erreurs</SelectItem>
                      <SelectItem value="debug">Tout (debug inclus)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Configuration Base de Données
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="backup-frequency">Fréquence de sauvegarde</Label>
                <Select defaultValue="daily">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Chaque heure</SelectItem>
                    <SelectItem value="daily">Quotidienne</SelectItem>
                    <SelectItem value="weekly">Hebdomadaire</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="data-retention">Rétention des données (mois)</Label>
                <Input id="data-retention" type="number" defaultValue="12" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-foreground">Compression des données anciennes</div>
                  <div className="text-sm text-muted-foreground">Optimise l'espace de stockage</div>
                </div>
                <Switch defaultChecked />
              </div>
              <Button variant="outline" className="w-full">
                Lancer une sauvegarde manuelle
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Personnalisation de l'Interface
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="theme">Thème</Label>
                  <Select defaultValue="auto">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Clair</SelectItem>
                      <SelectItem value="dark">Sombre</SelectItem>
                      <SelectItem value="auto">Automatique (système)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logo">Logo de l'organisation</Label>
                  <div className="flex items-center gap-2">
                    <Input id="logo" placeholder="URL du logo ou télécharger..." />
                    <Button variant="outline">Parcourir</Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="primary-color">Couleur primaire</Label>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-primary rounded border border-border"></div>
                    <Input id="primary-color" defaultValue="#1e3a8a" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sidebar-position">Position de la barre latérale</Label>
                  <Select defaultValue="left">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Gauche</SelectItem>
                      <SelectItem value="right">Droite</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium text-foreground mb-3">Prévisualisation du thème</h4>
                <div className="p-4 border border-border rounded-lg bg-card">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-4 h-4 bg-primary rounded"></div>
                    <span className="text-foreground font-medium">Exemple de titre</span>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Ceci est un aperçu de votre thème personnalisé avec les couleurs et paramètres choisis.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}