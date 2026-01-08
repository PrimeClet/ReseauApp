import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import AppShell from "@/components/layout/AppShell";
import DetailsModal from "@/components/ui/details-modal";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, XCircle, Clock, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import modificationService, { type Modification } from "@/services/modificationService";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import StatusBadge from "@/components/dashboard/StatusBadge";

const statutLabels: Record<string, string> = {
  en_attente: "En attente",
  approuvee: "Approuvée",
  rejetee: "Rejetée",
  en_revision: "En révision",
};

const statutColors: Record<string, "up" | "down" | "warn" | "maintenance" | "ok" | "actif" | "fermee"> = {
  en_attente: "warn",
  approuvee: "ok",
  rejetee: "down",
  en_revision: "maintenance",
};

const typeModificationLabels: Record<string, string> = {
  ajout_port: "Ajout d'un port",
  ajout_equipement: "Ajout d'un équipement",
  modification_connexion: "Modification d'une connexion",
  suppression_port: "Suppression d'un port",
  suppression_equipement: "Suppression d'un équipement",
  changement_statut_port: "Changement de statut d'un port",
};

const ValidationModifications = () => {
  const { isAuthenticated, isLoading: isLoadingAuth, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedModification, setSelectedModification] = useState<Modification | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [isRequestInfoOpen, setIsRequestInfoOpen] = useState(false);
  const [commentaire, setCommentaire] = useState("");

  useEffect(() => {
    if (!isLoadingAuth && !isAuthenticated) {
      navigate("/login");
    } else if (!isLoadingAuth && isAuthenticated && user?.role !== 'administrator') {
      navigate("/");
      toast({
        title: "Accès refusé",
        description: "Seuls les administrateurs peuvent accéder au dashboard de validation.",
        variant: "destructive",
      });
    }
  }, [isAuthenticated, isLoadingAuth, navigate, user, toast]);

  const { data: pendingModifications = [], isLoading, refetch } = useQuery({
    queryKey: ['modifications', 'pending'],
    queryFn: () => modificationService.getPending(),
    enabled: isAuthenticated && user?.role === 'administrator',
    refetchInterval: 30000, // Rafraîchir toutes les 30 secondes
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, commentaire }: { id: number; commentaire?: string }) =>
      modificationService.approve(id, commentaire),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modifications'] });
      queryClient.invalidateQueries({ queryKey: ['modifications', 'pending'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast({
        title: "Demande approuvée",
        description: "La demande de modification a été approuvée avec succès.",
      });
      setIsApproveOpen(false);
      setCommentaire("");
      setIsDetailsOpen(false);
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Une erreur est survenue lors de l'approbation.",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, commentaire }: { id: number; commentaire: string }) =>
      modificationService.reject(id, commentaire),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modifications'] });
      queryClient.invalidateQueries({ queryKey: ['modifications', 'pending'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast({
        title: "Demande rejetée",
        description: "La demande de modification a été rejetée.",
      });
      setIsRejectOpen(false);
      setCommentaire("");
      setIsDetailsOpen(false);
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Une erreur est survenue lors du rejet.",
        variant: "destructive",
      });
    },
  });

  const requestMoreInfoMutation = useMutation({
    mutationFn: ({ id, commentaire }: { id: number; commentaire: string }) =>
      modificationService.requestMoreInfo(id, commentaire),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modifications'] });
      queryClient.invalidateQueries({ queryKey: ['modifications', 'pending'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast({
        title: "Demande mise en révision",
        description: "La demande a été mise en révision. Des informations complémentaires sont requises.",
      });
      setIsRequestInfoOpen(false);
      setCommentaire("");
      setIsDetailsOpen(false);
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Une erreur est survenue.",
        variant: "destructive",
      });
    },
  });

  if (isLoadingAuth) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  if (!isAuthenticated || user?.role !== 'administrator') {
    return null;
  }

  const handleRowClick = (modification: Modification) => {
    setSelectedModification(modification);
    setIsDetailsOpen(true);
  };

  const handleApprove = () => {
    if (selectedModification) {
      approveMutation.mutate({ id: selectedModification.id, commentaire: commentaire || undefined });
    }
  };

  const handleReject = () => {
    if (selectedModification && commentaire.trim().length >= 10) {
      rejectMutation.mutate({ id: selectedModification.id, commentaire });
    } else {
      toast({
        title: "Commentaire requis",
        description: "Veuillez fournir un commentaire d'au moins 10 caractères pour rejeter une demande.",
        variant: "destructive",
      });
    }
  };

  const handleRequestMoreInfo = () => {
    if (selectedModification && commentaire.trim().length >= 10) {
      requestMoreInfoMutation.mutate({ id: selectedModification.id, commentaire });
    } else {
      toast({
        title: "Commentaire requis",
        description: "Veuillez fournir un commentaire d'au moins 10 caractères pour demander plus d'informations.",
        variant: "destructive",
      });
    }
  };

  const formatModificationForModal = (modification: Modification | null) => {
    if (!modification) return null;
    return {
      id: modification.id,
      type_modification: typeModificationLabels[modification.type_modification] || modification.type_modification,
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
      statut: statutLabels[modification.statut || 'en_attente'] || modification.statut,
      user: modification.user?.full_name || 
            (modification.user?.name && modification.user?.surname 
              ? `${modification.user.name} ${modification.user.surname}` 
              : modification.user?.name || modification.user?.username) || 
            (modification.user_id ? `Utilisateur #${modification.user_id}` : "Non défini"),
      created_at: modification.created_at || "",
      batiment: modification.coffret?.batiment ?? null,
      salle: modification.coffret?.salle ?? null,
      site: modification.coffret?.site ?? null,
      zone: modification.coffret?.zone ?? null,
    };
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Validation des demandes</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {pendingModifications.length} demande{pendingModifications.length > 1 ? 's' : ''} en attente de validation
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : pendingModifications.length === 0 ? (
          <div className="text-center py-12 bg-muted/30 rounded-lg border border-border">
            <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Aucune demande en attente de validation</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingModifications.map((modification) => (
              <div
                key={modification.id}
                className="p-6 bg-card border border-border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleRowClick(modification)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-foreground">
                        {typeModificationLabels[modification.type_modification] || modification.type_modification}
                      </h3>
                      <StatusBadge status={statutColors[modification.statut || 'en_attente']} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Coffret: </span>
                        <span className="text-foreground font-medium">
                          {modification.coffret?.nom || `Coffret #${modification.coffret_id}`}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Demandeur: </span>
                        <span className="text-foreground font-medium">
                          {modification.user?.full_name || modification.user?.name || `Utilisateur #${modification.user_id}`}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Date: </span>
                        <span className="text-foreground font-medium">
                          {modification.date_intervention 
                            ? new Date(modification.date_intervention).toLocaleDateString('fr-FR') 
                            : "N/A"}
                        </span>
                      </div>
                    </div>
                    {modification.description && (
                      <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                        {modification.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => {
                        setSelectedModification(modification);
                        setIsApproveOpen(true);
                      }}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Approuver
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-orange-500 text-orange-500 hover:bg-orange-50"
                      onClick={() => {
                        setSelectedModification(modification);
                        setIsRequestInfoOpen(true);
                      }}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Plus d'infos
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setSelectedModification(modification);
                        setIsRejectOpen(true);
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Rejeter
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <DetailsModal
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
          title="Détails de la demande de modification"
          data={formatModificationForModal(selectedModification)}
        />

        {/* Dialog Approuver */}
        <Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Approuver la demande</DialogTitle>
              <DialogDescription>
                Êtes-vous sûr de vouloir approuver cette demande de modification ?
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium">Commentaire (optionnel)</label>
                <Textarea
                  value={commentaire}
                  onChange={(e) => setCommentaire(e.target.value)}
                  placeholder="Ajouter un commentaire..."
                  rows={3}
                  className="mt-2"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => {
                  setIsApproveOpen(false);
                  setCommentaire("");
                }}>
                  Annuler
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={handleApprove}
                  disabled={approveMutation.isPending}
                >
                  {approveMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                  )}
                  Approuver
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog Rejeter */}
        <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rejeter la demande</DialogTitle>
              <DialogDescription>
                Veuillez fournir une raison pour rejeter cette demande de modification.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium">Commentaire <span className="text-destructive">*</span></label>
                <Textarea
                  value={commentaire}
                  onChange={(e) => setCommentaire(e.target.value)}
                  placeholder="Expliquez pourquoi cette demande est rejetée (minimum 10 caractères)..."
                  rows={4}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {commentaire.length}/10 caractères minimum
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => {
                  setIsRejectOpen(false);
                  setCommentaire("");
                }}>
                  Annuler
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={rejectMutation.isPending || commentaire.trim().length < 10}
                >
                  {rejectMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  Rejeter
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog Demander plus d'infos */}
        <Dialog open={isRequestInfoOpen} onOpenChange={setIsRequestInfoOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Demander plus d'informations</DialogTitle>
              <DialogDescription>
                Indiquez quelles informations supplémentaires sont nécessaires pour valider cette demande.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium">Commentaire <span className="text-destructive">*</span></label>
                <Textarea
                  value={commentaire}
                  onChange={(e) => setCommentaire(e.target.value)}
                  placeholder="Précisez les informations manquantes (minimum 10 caractères)..."
                  rows={4}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {commentaire.length}/10 caractères minimum
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => {
                  setIsRequestInfoOpen(false);
                  setCommentaire("");
                }}>
                  Annuler
                </Button>
                <Button
                  className="bg-orange-600 hover:bg-orange-700"
                  onClick={handleRequestMoreInfo}
                  disabled={requestMoreInfoMutation.isPending || commentaire.trim().length < 10}
                >
                  {requestMoreInfoMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <MessageSquare className="h-4 w-4 mr-2" />
                  )}
                  Envoyer la demande
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
};

export default ValidationModifications;

