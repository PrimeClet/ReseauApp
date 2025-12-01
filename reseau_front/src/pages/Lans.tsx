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

type LanEntry = {
  id: string;
  nom: string;
  sousReseau: string;
  vlan: string;
  site: string;
  statut: string;
  description: string;
};

const initialLans: LanEntry[] = [
  {
    id: "1",
    nom: "LAN-Production",
    sousReseau: "10.10.0.0/22",
    vlan: "VLAN 120",
    site: "Bâtiment A",
    statut: "Actif",
    description: "LAN principal pour les postes utilisateurs.",
  },
  {
    id: "2",
    nom: "LAN-IoT",
    sousReseau: "10.20.0.0/23",
    vlan: "VLAN 140",
    site: "Bâtiment B",
    statut: "Surveillé",
    description: "Equipements IoT et capteurs.",
  },
  {
    id: "3",
    nom: "LAN-Labs",
    sousReseau: "10.30.0.0/24",
    vlan: "VLAN 160",
    site: "Campus Sud",
    statut: "Maintenance",
    description: "Environnement de tests et maquettes.",
  },
];

const lanSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  sousReseau: z.string().min(1, "Le sous-réseau est requis"),
  vlan: z.string().min(1, "Le VLAN est requis"),
  site: z.string().min(1, "Le site est requis"),
  statut: z.string().min(1, "Le statut est requis"),
  description: z.string().min(1, "La description est requise"),
});

type LanFormData = z.infer<typeof lanSchema>;

const Lans = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [lans, setLans] = useState<LanEntry[]>(initialLans);
  const [selectedLan, setSelectedLan] = useState<LanEntry | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  const form = useForm<LanFormData>({
    resolver: zodResolver(lanSchema),
    defaultValues: {
      nom: "",
      sousReseau: "",
      vlan: "",
      site: "",
      statut: "",
      description: "",
    },
  });

  if (!isAuthenticated) {
    return null;
  }

  const handleRowClick = (lan: LanEntry) => {
    setSelectedLan(lan);
    setIsDetailsOpen(true);
  };

  const handleEdit = (lan: LanEntry) => {
    setSelectedLan(lan);
    setIsEditOpen(true);
  };

  const handleSave = (updatedLan: LanEntry) => {
    setLans((prev) => prev.map((lan) => (lan.id === updatedLan.id ? updatedLan : lan)));
    toast({
      title: "LAN mis à jour",
      description: "Les informations du LAN ont été enregistrées.",
    });
    setIsEditOpen(false);
  };

  const onSubmit = (data: LanFormData) => {
    const newLan: LanEntry = {
      id: Date.now().toString(),
      ...data,
    };
    setLans((prev) => [...prev, newLan]);
    toast({
      title: "LAN ajouté",
      description: `Le LAN ${data.nom} a été créé.`,
    });
    form.reset();
    setIsAddOpen(false);
  };

  const tableData = lans.map((lan) => ({
    nom: lan.nom,
    sousReseau: lan.sousReseau,
    vlan: lan.vlan,
    site: lan.site,
    statut: lan.statut,
    description: lan.description,
  }));

  return (
    <AppShell>
      <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Gestion des LANs</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Inventaire et configuration des segments LAN de l’entreprise.
                  </p>
                </div>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Ajouter un LAN
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[520px]">
                    <DialogHeader>
                      <DialogTitle>Nouveau LAN</DialogTitle>
                      <DialogDescription>
                        Renseignez les informations de ce segment réseau.
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
                                <Input placeholder="LAN-Production" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="sousReseau"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Sous-réseau (CIDR)</FormLabel>
                              <FormControl>
                                <Input placeholder="10.10.0.0/22" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="vlan"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>VLAN</FormLabel>
                              <FormControl>
                                <Input placeholder="VLAN 120" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="site"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Site / Localisation</FormLabel>
                              <FormControl>
                                <Input placeholder="Bâtiment A" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="statut"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Statut</FormLabel>
                              <FormControl>
                                <Input placeholder="Actif, Maintenance..." {...field} />
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
                                <Textarea placeholder="Usage, contraintes, notes..." {...field} />
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
                title={`${lans.length} LANs configurés`}
                columns={["nom", "sousReseau", "vlan", "site", "statut", "description"]}
                data={tableData}
                onRowClick={handleRowClick}
                onEdit={handleEdit}
              />

              <DetailsModal
                open={isDetailsOpen}
                onOpenChange={setIsDetailsOpen}
                title="Détails du LAN"
                data={selectedLan}
                onEdit={() => {
                  setIsDetailsOpen(false);
                  setIsEditOpen(true);
                }}
              />

              <EditModal
                open={isEditOpen}
                onOpenChange={setIsEditOpen}
                title="Modifier le LAN"
                data={selectedLan}
                onSave={handleSave}
              />
      </div>
    </AppShell>
  );
};

export default Lans;

