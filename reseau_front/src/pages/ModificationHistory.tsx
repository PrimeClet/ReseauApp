import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useData } from "@/contexts/DataContext";
import AppShell from "@/components/layout/AppShell";
import DetailsModal from "@/components/ui/details-modal";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download, FileSpreadsheet, FileText, RotateCcw, Calendar, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import modificationService, { type Modification } from "@/services/modificationService";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { jsPDF } from "jspdf";
import { format } from "date-fns";

const typeLabels: Record<string, string> = {
  ajout_port: "Ajout d'un port",
  ajout_equipement: "Ajout d'un équipement",
  modification_connexion: "Modification d'une connexion",
  suppression_port: "Suppression d'un port",
  suppression_equipement: "Suppression d'un équipement",
  changement_statut_port: "Changement de statut d'un port",
};

const typeColors: Record<string, string> = {
  ajout_port: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  ajout_equipement: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  modification_connexion: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  suppression_port: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  suppression_equipement: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  changement_statut_port: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
};

const ModificationHistory = () => {
  const { isAuthenticated, isLoading: isLoadingAuth, user } = useRequireAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { coffrets, isLoadingCoffrets } = useData();
  const [searchParams, setSearchParams] = useSearchParams();

  const [selectedCoffretId, setSelectedCoffretId] = useState<number | null>(
    searchParams.get('coffret_id') ? parseInt(searchParams.get('coffret_id')!) : null
  );
  const [selectedModification, setSelectedModification] = useState<Modification | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isRollbackOpen, setIsRollbackOpen] = useState(false);
  const [rollbackRaison, setRollbackRaison] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  const { data: historyData, isLoading, refetch } = useQuery({
    queryKey: ['modifications', 'history', selectedCoffretId, typeFilter, dateFrom, dateTo],
    queryFn: () => {
      if (!selectedCoffretId) throw new Error('Coffret non sélectionné');
      return modificationService.getHistory(selectedCoffretId, {
        type_modification: typeFilter !== 'all' ? typeFilter : undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        per_page: 100,
      });
    },
    enabled: isAuthenticated && selectedCoffretId !== null,
  });

  const rollbackMutation = useMutation({
    mutationFn: ({ id, raison }: { id: number; raison: string }) =>
      modificationService.rollback(id, raison),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modifications'] });
      queryClient.invalidateQueries({ queryKey: ['modifications', 'history'] });
      toast({
        title: "Rollback effectué",
        description: "La modification a été annulée avec succès.",
      });
      setIsRollbackOpen(false);
      setRollbackRaison("");
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Une erreur est survenue lors du rollback.",
        variant: "destructive",
      });
    },
  });

  const handleExportCsv = async () => {
    if (!selectedCoffretId) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un coffret.",
        variant: "destructive",
      });
      return;
    }

    try {
      const blob = await modificationService.exportHistoryCsv(selectedCoffretId, {
        type_modification: typeFilter !== 'all' ? typeFilter : undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `historique_coffret_${historyData?.coffret.code}_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export CSV réussi",
        description: "Le fichier CSV a été téléchargé avec succès.",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Une erreur est survenue lors de l'export CSV.",
        variant: "destructive",
      });
    }
  };

  const handleExportPdf = async () => {
    if (!selectedCoffretId) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un coffret.",
        variant: "destructive",
      });
      return;
    }

    try {
      const data = await modificationService.exportHistoryPdf(selectedCoffretId, {
        type_modification: typeFilter !== 'all' ? typeFilter : undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      });

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPos = 20;

      // En-tête
      doc.setFontSize(18);
      doc.text("HISTORIQUE DES MODIFICATIONS", pageWidth / 2, yPos, { align: "center" });
      yPos += 10;

      doc.setFontSize(12);
      doc.text(`Coffret: ${data.coffret.nom} (${data.coffret.code})`, 20, yPos);
      yPos += 6;
      
      if (data.coffret.site) {
        doc.text(`Site: ${data.coffret.site}`, 20, yPos);
        yPos += 6;
      }
      if (data.coffret.zone) {
        doc.text(`Zone: ${data.coffret.zone}`, 20, yPos);
        yPos += 6;
      }
      if (data.coffret.batiment) {
        doc.text(`Bâtiment: ${data.coffret.batiment}`, 20, yPos);
        yPos += 6;
      }
      if (data.coffret.salle) {
        doc.text(`Salle: ${data.coffret.salle}`, 20, yPos);
        yPos += 6;
      }
      
      doc.text(`Date d'export: ${format(new Date(data.export_date), 'dd/MM/yyyy HH:mm:ss')}`, 20, yPos);
      yPos += 15;

      // Tableau
      const headers = [
        'Date Validation',
        'Type',
        'Demandeur',
        'Validateur',
        'Description'
      ];
      
      const colWidths = [35, 40, 35, 35, 45];
      const startX = 10;

      // En-têtes du tableau
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      let xPos = startX;
      headers.forEach((header, i) => {
        doc.text(header, xPos, yPos);
        xPos += colWidths[i];
      });
      yPos += 8;

      // Ligne de séparation
      doc.setLineWidth(0.5);
      doc.line(startX, yPos - 2, pageWidth - startX, yPos - 2);
      yPos += 2;

      // Données
      doc.setFont(undefined, 'normal');
      doc.setFontSize(8);
      
      data.modifications.forEach((mod: any) => {
        // Vérifier si on doit ajouter une nouvelle page
        if (yPos > pageHeight - 30) {
          doc.addPage();
          yPos = 20;
        }

        const dateValidation = mod.date_validation 
          ? format(new Date(mod.date_validation), 'dd/MM/yyyy HH:mm')
          : '';
        const type = mod.type_modification_label || mod.type_modification;
        const demandeur = mod.user || 'N/A';
        const validateur = mod.validator || 'N/A';
        const description = mod.description?.substring(0, 40) || '';

        const row = [dateValidation, type, demandeur, validateur, description];
        
        xPos = startX;
        row.forEach((cell, i) => {
          doc.text(cell || '', xPos, yPos, { maxWidth: colWidths[i] - 2 });
          xPos += colWidths[i];
        });
        yPos += 10;
      });

      // Nom du fichier
      const filename = `historique_coffret_${data.coffret.code}_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.pdf`;
      doc.save(filename);
      
      toast({
        title: "Export PDF réussi",
        description: "Le fichier PDF a été téléchargé avec succès.",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Une erreur est survenue lors de l'export PDF.",
        variant: "destructive",
      });
    }
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

  // La réponse de Laravel avec paginate() a une structure : { coffret: {...}, data: { data: [...], current_page: ... } }
  // Donc historyData.data est l'objet de pagination, et historyData.data.data contient le tableau
  const history: Modification[] = Array.isArray(historyData?.data) 
    ? historyData.data 
    : (historyData?.data?.data || []);
  const coffret = historyData?.coffret;

  const formatModificationForModal = (modification: Modification | null) => {
    if (!modification) return null;
    return {
      id: modification.id,
      type_modification: typeLabels[modification.type_modification] || modification.type_modification,
      coffret: modification.coffret?.nom 
        ? (modification.coffret?.code ? `${modification.coffret.nom} (${modification.coffret.code})` : modification.coffret.nom)
        : `Coffret #${modification.coffret_id}`,
      port: modification.port?.port_label || modification.port_id ? `Port #${modification.port_id}` : "Aucun",
      equipement: modification.equipement?.name || modification.equipement_id ? `Équipement #${modification.equipement_id}` : "Aucun",
      description: modification.description || "",
      raison: modification.raison || "",
      photo_avant_url: modification.photo_avant_url || modification.photo_avant || null,
      photo_apres_url: modification.photo_apres_url || modification.photo_apres || null,
      date_intervention: modification.date_intervention || "",
      heure_intervention: modification.heure_intervention || "",
      statut: modification.statut || "approuvee",
      user: modification.user?.full_name || 
            (modification.user?.name && modification.user?.surname 
              ? `${modification.user.name} ${modification.user.surname}` 
              : modification.user?.name || modification.user?.username) || 
            (modification.user_id ? `Utilisateur #${modification.user_id}` : "Non défini"),
      validated_by_user: (() => {
                            if (modification.validatedBy?.full_name) {
                              return modification.validatedBy.full_name;
                            }
                            if (modification.validatedBy?.name) {
                              if (modification.validatedBy?.surname) {
                                return `${modification.validatedBy.name} ${modification.validatedBy.surname}`;
                              }
                              return modification.validatedBy.name;
                            }
                            if (modification.validated_by && typeof modification.validated_by === 'number') {
                              return `Utilisateur #${modification.validated_by}`;
                            }
                            return "Non défini";
                          })(),
      validated_at: modification.validated_at || "",
      commentaire_validation: modification.commentaire_validation || "",
      created_at: modification.created_at || "",
      batiment: modification.coffret?.batiment ?? null,
      salle: modification.coffret?.salle ?? null,
      site: modification.coffret?.site ?? null,
      zone: modification.coffret?.zone ?? null,
    };
  };

  const handleRollback = () => {
    if (!selectedModification || rollbackRaison.trim().length < 10) {
      toast({
        title: "Raison requise",
        description: "Veuillez fournir une raison d'au moins 10 caractères pour effectuer un rollback.",
        variant: "destructive",
      });
      return;
    }
    rollbackMutation.mutate({ id: selectedModification.id, raison: rollbackRaison });
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Historique des modifications</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Consultez l'historique complet des modifications approuvées par coffret
            </p>
          </div>
        </div>

        {/* Sélection du coffret */}
        <Card className="p-4">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Sélectionner un coffret *</label>
                <Select
                  value={selectedCoffretId?.toString() || ""}
                  onValueChange={(value) => {
                    const id = parseInt(value);
                    setSelectedCoffretId(id);
                    setSearchParams({ coffret_id: value });
                  }}
                  disabled={isLoadingCoffrets}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un coffret" />
                  </SelectTrigger>
                  <SelectContent>
                    {coffrets?.map((coffret) => (
                      <SelectItem key={coffret.id} value={coffret.id.toString()}>
                        {coffret.nom} ({coffret.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Type de modification</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    {Object.entries(typeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Date début</label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Date fin</label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>

            {selectedCoffretId && (
              <div className="flex items-center gap-2">
                <Button onClick={handleExportCsv} variant="outline">
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Exporter CSV
                </Button>
                <Button onClick={handleExportPdf} variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Exporter PDF
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Liste de l'historique */}
        {!selectedCoffretId ? (
          <Card className="p-12 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Veuillez sélectionner un coffret pour afficher son historique
            </p>
          </Card>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : history.length === 0 ? (
          <Card className="p-12 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Aucune modification approuvée trouvée pour ce coffret
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {coffret && (
              <Card className="p-4 bg-muted/50">
                <h3 className="font-semibold text-lg mb-2">
                  Historique du coffret: {coffret.nom} ({coffret.code})
                </h3>
                <p className="text-sm text-muted-foreground">
                  {history.length} modification{history.length > 1 ? 's' : ''} trouvée{history.length > 1 ? 's' : ''}
                </p>
              </Card>
            )}

            {history.map((modification) => (
              <Card
                key={modification.id}
                className="p-6 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => {
                  setSelectedModification(modification);
                  setIsDetailsOpen(true);
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge className={typeColors[modification.type_modification] || 'bg-gray-100 text-gray-800'}>
                        {typeLabels[modification.type_modification] || modification.type_modification}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {modification.validated_at 
                          ? format(new Date(modification.validated_at), 'dd/MM/yyyy HH:mm')
                          : format(new Date(modification.created_at || ''), 'dd/MM/yyyy HH:mm')}
                      </span>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-foreground mb-1">
                        {modification.description}
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Demandeur: </span>
                          <span className="text-foreground">
                            {modification.user?.full_name || 
                             (modification.user?.name && modification.user?.surname 
                               ? `${modification.user.name} ${modification.user.surname}` 
                               : modification.user?.name || `Utilisateur #${modification.user_id}`)}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Validateur: </span>
                          <span className="text-foreground">
                            {(() => {
                              if (modification.validatedBy?.full_name) {
                                return modification.validatedBy.full_name;
                              }
                              if (modification.validatedBy?.name) {
                                if (modification.validatedBy?.surname) {
                                  return `${modification.validatedBy.name} ${modification.validatedBy.surname}`;
                                }
                                return modification.validatedBy.name;
                              }
                              if (modification.validated_by && typeof modification.validated_by === 'number') {
                                return `Utilisateur #${modification.validated_by}`;
                              }
                              return "Non défini";
                            })()}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Date intervention: </span>
                          <span className="text-foreground">
                            {modification.date_intervention 
                              ? format(new Date(modification.date_intervention), 'dd/MM/yyyy')
                              : "N/A"} {modification.heure_intervention || ''}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Raison: </span>
                          <span className="text-foreground line-clamp-1">
                            {modification.raison}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {(user?.role === 'administrator' || user?.role === 'directeur') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedModification(modification);
                        setIsRollbackOpen(true);
                      }}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Rollback
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        <DetailsModal
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
          title="Détails de la modification"
          data={formatModificationForModal(selectedModification)}
        />

        {/* Dialog Rollback */}
        <Dialog open={isRollbackOpen} onOpenChange={setIsRollbackOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rollback - Restaurer un état précédent</DialogTitle>
              <DialogDescription>
                Cette action va créer une nouvelle modification inverse pour annuler la modification sélectionnée.
                Veuillez fournir une raison justifiant ce rollback.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium">Raison du rollback <span className="text-destructive">*</span></label>
                <Textarea
                  value={rollbackRaison}
                  onChange={(e) => setRollbackRaison(e.target.value)}
                  placeholder="Expliquez pourquoi vous souhaitez annuler cette modification (minimum 10 caractères)..."
                  rows={4}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {rollbackRaison.length}/10 caractères minimum
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => {
                  setIsRollbackOpen(false);
                  setRollbackRaison("");
                }}>
                  Annuler
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleRollback}
                  disabled={rollbackMutation.isPending || rollbackRaison.trim().length < 10}
                >
                  {rollbackMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RotateCcw className="h-4 w-4 mr-2" />
                  )}
                  Effectuer le rollback
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
};

export default ModificationHistory;

