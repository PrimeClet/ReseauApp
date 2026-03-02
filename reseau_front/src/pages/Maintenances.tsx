import { useState } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import AppShell from "@/components/layout/AppShell";
import DataTableEnhanced from "@/components/ui/data-table-enhanced";
import DetailsModal from "@/components/ui/details-modal";
import EditModal from "@/components/ui/edit-modal";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Wrench, Clock, CheckCircle2, AlertTriangle, Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import maintenanceService, { type Maintenance, type MaintenanceCreateData } from "@/services/maintenanceService";
import userService, { type User } from "@/services/userService";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { useData } from "@/contexts/DataContext";

const statutLabels: Record<string, string> = {
  planifiee: "Planifiée",
  en_cours: "En cours",
  terminee: "Terminée",
  annulee: "Annulée",
};

const statutColors: Record<string, "up" | "down" | "warn" | "maintenance" | "ok" | "actif" | "fermee"> = {
  planifiee: "warn",
  en_cours: "maintenance",
  terminee: "ok",
  annulee: "down",
};

const prioriteLabels: Record<string, string> = {
  basse: "Basse",
  moyenne: "Moyenne",
  haute: "Haute",
  critique: "Critique",
};

const prioriteColors: Record<string, string> = {
  basse: "text-blue-500",
  moyenne: "text-yellow-500",
  haute: "text-orange-500",
  critique: "text-red-500",
};

// Actions de maintenance par type d'équipement
const actionsParTypeEquipement: Record<string, { value: string; label: string }[]> = {
  // Équipements réseau
  switch: [
    { value: "verification_ports", label: "Vérification des ports" },
    { value: "mise_a_jour_firmware", label: "Mise à jour firmware" },
    { value: "nettoyage", label: "Nettoyage" },
    { value: "remplacement", label: "Remplacement" },
    { value: "configuration", label: "Configuration" },
    { value: "diagnostic", label: "Diagnostic" },
  ],
  routeur: [
    { value: "verification_connexions", label: "Vérification des connexions" },
    { value: "mise_a_jour_firmware", label: "Mise à jour firmware" },
    { value: "configuration", label: "Configuration" },
    { value: "remplacement", label: "Remplacement" },
    { value: "diagnostic", label: "Diagnostic" },
  ],
  serveur: [
    { value: "verification_disques", label: "Vérification des disques" },
    { value: "mise_a_jour_os", label: "Mise à jour OS" },
    { value: "sauvegarde", label: "Sauvegarde" },
    { value: "nettoyage", label: "Nettoyage" },
    { value: "remplacement_composant", label: "Remplacement composant" },
    { value: "diagnostic", label: "Diagnostic" },
  ],
  onduleur: [
    { value: "test_batterie", label: "Test de batterie" },
    { value: "remplacement_batterie", label: "Remplacement batterie" },
    { value: "verification", label: "Vérification générale" },
    { value: "nettoyage", label: "Nettoyage" },
  ],
  climatisation: [
    { value: "nettoyage_filtres", label: "Nettoyage des filtres" },
    { value: "verification_gaz", label: "Vérification du gaz" },
    { value: "maintenance_preventive", label: "Maintenance préventive" },
    { value: "reparation", label: "Réparation" },
  ],
  // Actions par défaut pour tout équipement
  default: [
    { value: "preventive", label: "Maintenance préventive" },
    { value: "corrective", label: "Maintenance corrective" },
    { value: "verification", label: "Vérification" },
    { value: "nettoyage", label: "Nettoyage" },
    { value: "remplacement", label: "Remplacement" },
    { value: "diagnostic", label: "Diagnostic" },
    { value: "mise_a_jour", label: "Mise à jour" },
    { value: "configuration", label: "Configuration" },
  ],
};

// Fonction pour obtenir les actions disponibles selon le type d'équipement
const getActionsForEquipement = (typeEquipement?: string): { value: string; label: string }[] => {
  if (!typeEquipement) return actionsParTypeEquipement.default;
  const type = typeEquipement.toLowerCase();
  return actionsParTypeEquipement[type] || actionsParTypeEquipement.default;
};

const Maintenances = () => {
  const { isAuthenticated, isLoading: isLoadingAuth, user, hasPermission } = useRequireAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { equipements } = useData();
  const [selectedMaintenance, setSelectedMaintenance] = useState<Maintenance | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [equipementComboOpen, setEquipementComboOpen] = useState(false);
  const [newMaintenance, setNewMaintenance] = useState<MaintenanceCreateData>({
    type: "",
    date_debut: "",
    heure_debut: "",
    duree: "",
    technicien: "",
    priorite: "moyenne",
    description: "",
    statut: "planifiee",
  });

  const { data: maintenancesResponse, isLoading, refetch } = useQuery({
    queryKey: ['maintenances'],
    queryFn: () => maintenanceService.getAll(),
    enabled: isAuthenticated,
  });

  const maintenances = maintenancesResponse?.data || [];

  // Récupérer les techniciens (utilisateurs avec le rôle Technicien)
  const { data: techniciensResponse } = useQuery({
    queryKey: ['techniciens'],
    queryFn: () => userService.getAll({ role: 'Technicien', per_page: 100 }),
    enabled: isAuthenticated,
  });

  const techniciens = techniciensResponse?.data || [];

  const createMutation = useMutation({
    mutationFn: (data: MaintenanceCreateData) => maintenanceService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenances'] });
      toast({
        title: "Maintenance créée",
        description: "La maintenance a été planifiée avec succès.",
      });
      setIsAddOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Une erreur est survenue lors de la création.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<MaintenanceCreateData> }) =>
      maintenanceService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenances'] });
      toast({
        title: "Maintenance mise à jour",
        description: "Les informations ont été enregistrées.",
      });
      setIsEditOpen(false);
      setSelectedMaintenance(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Une erreur est survenue lors de la mise à jour.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => maintenanceService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenances'] });
      toast({
        title: "Maintenance supprimée",
        description: "La maintenance a été supprimée avec succès.",
      });
      setIsDetailsOpen(false);
      setSelectedMaintenance(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Une erreur est survenue lors de la suppression.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setNewMaintenance({
      type: "",
      date_debut: "",
      heure_debut: "",
      duree: "",
      technicien: "",
      priorite: "moyenne",
      description: "",
      statut: "planifiee",
    });
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

  const canCreate = hasPermission?.('maintenance.creer') || hasPermission?.('maintenance.assigner');
  const canEdit = hasPermission?.('maintenance.modifier');
  const canDelete = hasPermission?.('maintenance.supprimer');

  const handleRowClick = (maintenance: Maintenance) => {
    setSelectedMaintenance(maintenance);
    setIsDetailsOpen(true);
  };

  const handleEdit = (maintenance: Maintenance) => {
    setSelectedMaintenance(maintenance);
    setIsEditOpen(true);
  };

  const handleDelete = (maintenanceId: number) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette maintenance ?")) {
      deleteMutation.mutate(maintenanceId);
    }
  };

  const handleCreate = () => {
    createMutation.mutate(newMaintenance);
  };

  const handleSave = (updatedMaintenance: any) => {
    if (selectedMaintenance) {
      updateMutation.mutate({
        id: selectedMaintenance.id,
        data: {
          type: updatedMaintenance.type,
          date_debut: updatedMaintenance.date_debut,
          heure_debut: updatedMaintenance.heure_debut,
          duree: updatedMaintenance.duree,
          technicien: updatedMaintenance.technicien,
          priorite: updatedMaintenance.priorite,
          description: updatedMaintenance.description,
          statut: updatedMaintenance.statut,
          equipement_id: updatedMaintenance.equipement_id,
        },
      });
    }
  };

  const tableData = maintenances.map((maintenance) => ({
    id: maintenance.id,
    type: maintenance.type,
    equipement: maintenance.equipement?.name || "Non assigné",
    technicien: maintenance.technicien,
    priorite: prioriteLabels[maintenance.priorite] || maintenance.priorite,
    statut: statutLabels[maintenance.statut] || maintenance.statut,
    date_debut: maintenance.date_debut
      ? new Date(maintenance.date_debut).toLocaleDateString('fr-FR')
      : "N/A",
    heure_debut: maintenance.heure_debut || "N/A",
    duree: maintenance.duree,
  }));

  const formatMaintenanceForModal = (maintenance: Maintenance | null) => {
    if (!maintenance) return null;
    return {
      id: maintenance.id,
      type: maintenance.type,
      equipement_id: maintenance.equipement_id,
      equipement: maintenance.equipement?.name || "Non assigné",
      technicien: maintenance.technicien,
      priorite: maintenance.priorite,
      priorite_label: prioriteLabels[maintenance.priorite] || maintenance.priorite,
      statut: maintenance.statut,
      statut_label: statutLabels[maintenance.statut] || maintenance.statut,
      date_debut: maintenance.date_debut,
      heure_debut: maintenance.heure_debut,
      duree: maintenance.duree,
      description: maintenance.description,
      created_at: maintenance.created_at,
      updated_at: maintenance.updated_at,
    };
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Maintenances</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Gestion des maintenances planifiées et en cours
            </p>
          </div>
          {canCreate && (
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle maintenance
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Planifier une maintenance</DialogTitle>
                  <DialogDescription>
                    Créez une nouvelle demande de maintenance et assignez-la à un technicien.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  {/* Sélection de l'équipement */}
                  <div className="space-y-2">
                    <Label htmlFor="equipement">Équipement <span className="text-destructive">*</span></Label>
                    <Popover open={equipementComboOpen} onOpenChange={setEquipementComboOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={equipementComboOpen}
                          className="w-full justify-between font-normal"
                        >
                          {newMaintenance.equipement_id
                            ? equipements.find((eq) => eq.id === newMaintenance.equipement_id)?.name || "Sélectionner..."
                            : "Rechercher un équipement..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[500px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Rechercher par nom, code ou baie..." />
                          <CommandList>
                            <CommandEmpty>Aucun équipement trouvé.</CommandEmpty>
                            <CommandGroup>
                              {equipements.map((eq) => (
                                <CommandItem
                                  key={eq.id}
                                  value={`${eq.name} ${eq.equipement_code} ${eq.coffret?.nom || ''} ${eq.coffret?.code || ''}`}
                                  onSelect={() => {
                                    setNewMaintenance({ ...newMaintenance, equipement_id: eq.id, type: "" });
                                    setEquipementComboOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      newMaintenance.equipement_id === eq.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <div className="flex flex-col">
                                    <span className="font-medium">{eq.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {eq.equipement_code} • {eq.type} {eq.coffret ? `• Baie: ${eq.coffret.nom || eq.coffret.code}` : ''}
                                    </span>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Infos de la baie (coffret) - affiché uniquement si équipement sélectionné */}
                  {newMaintenance.equipement_id && (() => {
                    const selectedEquipement = equipements.find((eq) => eq.id === newMaintenance.equipement_id);
                    if (!selectedEquipement) return null;
                    return (
                      <div className="p-3 bg-muted/50 rounded-lg border border-border">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <p className="text-muted-foreground text-xs">Type</p>
                            <p className="font-medium">{selectedEquipement.type}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Code</p>
                            <p className="font-medium">{selectedEquipement.equipement_code}</p>
                          </div>
                          {selectedEquipement.coffret && (
                            <>
                              <div>
                                <p className="text-muted-foreground text-xs">Baie / Coffret</p>
                                <p className="font-medium">{selectedEquipement.coffret.nom || selectedEquipement.coffret.code}</p>
                              </div>
                              {selectedEquipement.coffret.batiment && (
                                <div>
                                  <p className="text-muted-foreground text-xs">Bâtiment</p>
                                  <p className="font-medium">{selectedEquipement.coffret.batiment.nom}</p>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Action et priorité */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="type">Action à effectuer <span className="text-destructive">*</span></Label>
                      <Select
                        value={newMaintenance.type}
                        onValueChange={(value) => setNewMaintenance({ ...newMaintenance, type: value })}
                        disabled={!newMaintenance.equipement_id}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={newMaintenance.equipement_id ? "Sélectionner une action" : "Sélectionnez d'abord un équipement"} />
                        </SelectTrigger>
                        <SelectContent>
                          {getActionsForEquipement(
                            equipements.find((eq) => eq.id === newMaintenance.equipement_id)?.type
                          ).map((action) => (
                            <SelectItem key={action.value} value={action.value}>
                              {action.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="priorite">Priorité</Label>
                      <Select
                        value={newMaintenance.priorite}
                        onValueChange={(value: 'basse' | 'moyenne' | 'haute' | 'critique') =>
                          setNewMaintenance({ ...newMaintenance, priorite: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="basse">Basse</SelectItem>
                          <SelectItem value="moyenne">Moyenne</SelectItem>
                          <SelectItem value="haute">Haute</SelectItem>
                          <SelectItem value="critique">Critique</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="date_debut">Date de début</Label>
                      <Input
                        id="date_debut"
                        type="date"
                        value={newMaintenance.date_debut}
                        onChange={(e) => setNewMaintenance({ ...newMaintenance, date_debut: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="heure_debut">Heure de début</Label>
                      <Input
                        id="heure_debut"
                        type="time"
                        value={newMaintenance.heure_debut}
                        onChange={(e) => setNewMaintenance({ ...newMaintenance, heure_debut: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="duree">Durée estimée</Label>
                      <Input
                        id="duree"
                        value={newMaintenance.duree}
                        onChange={(e) => setNewMaintenance({ ...newMaintenance, duree: e.target.value })}
                        placeholder="Ex: 2h, 30min..."
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="technicien">Technicien assigné</Label>
                    <Select
                      value={newMaintenance.technicien}
                      onValueChange={(value) => setNewMaintenance({ ...newMaintenance, technicien: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un technicien" />
                      </SelectTrigger>
                      <SelectContent>
                        {techniciens.map((tech) => (
                          <SelectItem key={tech.id} value={tech.name}>
                            {tech.name} {tech.surname || ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newMaintenance.description}
                      onChange={(e) => setNewMaintenance({ ...newMaintenance, description: e.target.value })}
                      placeholder="Décrivez la maintenance à effectuer..."
                      rows={4}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => {
                    setIsAddOpen(false);
                    resetForm();
                  }}>
                    Annuler
                  </Button>
                  <Button
                    onClick={handleCreate}
                    disabled={createMutation.isPending || !newMaintenance.type || !newMaintenance.date_debut || !newMaintenance.technicien}
                  >
                    {createMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Créer la maintenance
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Stats rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Planifiées</p>
                <p className="text-2xl font-bold">{maintenances.filter(m => m.statut === 'planifiee').length}</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Wrench className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">En cours</p>
                <p className="text-2xl font-bold">{maintenances.filter(m => m.statut === 'en_cours').length}</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Terminées</p>
                <p className="text-2xl font-bold">{maintenances.filter(m => m.statut === 'terminee').length}</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Critiques</p>
                <p className="text-2xl font-bold">{maintenances.filter(m => m.priorite === 'critique' && m.statut !== 'terminee').length}</p>
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : maintenances.length === 0 ? (
          <div className="text-center py-12 bg-muted/30 rounded-lg border border-border">
            <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Aucune maintenance enregistrée</p>
            {canCreate && (
              <Button className="mt-4" onClick={() => setIsAddOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Créer une maintenance
              </Button>
            )}
          </div>
        ) : (
          <>
            <DataTableEnhanced
              title={`${maintenances.length} maintenance${maintenances.length > 1 ? 's' : ''}`}
              columns={["type", "equipement", "technicien", "priorite", "statut", "date_debut", "heure_debut", "duree"]}
              data={tableData}
              onRowClick={handleRowClick}
              onEdit={canEdit ? handleEdit : undefined}
              onDelete={canDelete ? handleDelete : undefined}
            />

            <DetailsModal
              open={isDetailsOpen}
              onOpenChange={setIsDetailsOpen}
              title="Détails de la maintenance"
              data={{
                ...formatMaintenanceForModal(selectedMaintenance),
                priorite: formatMaintenanceForModal(selectedMaintenance)?.priorite_label,
                statut: formatMaintenanceForModal(selectedMaintenance)?.statut_label,
              }}
              onEdit={canEdit ? () => {
                setIsDetailsOpen(false);
                setIsEditOpen(true);
              } : undefined}
              onDelete={canDelete && selectedMaintenance ? () => handleDelete(selectedMaintenance.id) : undefined}
            />

            <EditModal
              open={isEditOpen}
              onOpenChange={setIsEditOpen}
              title="Modifier la maintenance"
              data={formatMaintenanceForModal(selectedMaintenance)}
              onSave={handleSave}
              fields={[
                { key: "type", label: "Type de maintenance", type: "text" },
                { key: "technicien", label: "Technicien assigné", type: "text" },
                { key: "date_debut", label: "Date de début", type: "date" },
                { key: "heure_debut", label: "Heure de début", type: "time" },
                { key: "duree", label: "Durée estimée", type: "text" },
                {
                  key: "priorite",
                  label: "Priorité",
                  type: "select",
                  options: [
                    { value: "basse", label: "Basse" },
                    { value: "moyenne", label: "Moyenne" },
                    { value: "haute", label: "Haute" },
                    { value: "critique", label: "Critique" },
                  ],
                },
                {
                  key: "statut",
                  label: "Statut",
                  type: "select",
                  options: [
                    { value: "planifiee", label: "Planifiée" },
                    { value: "en_cours", label: "En cours" },
                    { value: "terminee", label: "Terminée" },
                    { value: "annulee", label: "Annulée" },
                  ],
                },
                { key: "description", label: "Description", type: "textarea" },
              ]}
            />
          </>
        )}
      </div>
    </AppShell>
  );
};

export default Maintenances;
