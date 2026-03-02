import { useState, useEffect, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Loader2, Router, Server, Shield, Wifi, Box, Plus, Pencil, Trash2, ChevronLeft, ChevronRight, Network, QrCode, Star, Layers, Settings2, Printer, Laptop, Monitor, Tag, Hash, Archive, Factory, Globe, ToggleLeft, FileText, Cable, ArrowUpDown, Ruler, Zap, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DetailsModal from "../ui/details-modal";
import EditModal from "../ui/edit-modal";
import PageHeader from "../ui/page-header";
import { useData } from "@/contexts/DataContext";
import type { Equipement, Port, Liaison } from "@/contexts/DataContext";
import AddPortForm from "../forms/AddPortForm";
import AddLiaisonForm from "../forms/AddLiaisonForm";
import QRCodeModal from "../ui/qr-code-modal";
// Lazy load pour éviter les problèmes de chargement avec vis-network
const DependencyChainSection = lazy(() => import("./DependencyChainSection"));
import ConnectionsSection from "./ConnectionsSection";
import equipementService, { VlanConfig } from "@/services/equipementService";
import portService from "@/services/portService";
import liaisonService from "@/services/liaisonService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

interface EquipementsDetailSectionProps {
  equipementCode?: string;
}

// Mapping des types d'équipements vers les icônes
const typeIcons: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  switch: { icon: <Router className="h-5 w-5" />, label: "Switch", color: "text-blue-600" },
  routeur: { icon: <Router className="h-5 w-5" />, label: "Routeur", color: "text-green-600" },
  firewall: { icon: <Shield className="h-5 w-5" />, label: "Firewall", color: "text-red-600" },
  "point-acces": { icon: <Wifi className="h-5 w-5" />, label: "Point d'accès", color: "text-purple-600" },
  serveur: { icon: <Server className="h-5 w-5" />, label: "Serveur", color: "text-orange-600" },
  imprimante: { icon: <Printer className="h-5 w-5" />, label: "Imprimante", color: "text-teal-600" },
  "ordinateur-portable": { icon: <Laptop className="h-5 w-5" />, label: "Ordinateur portable", color: "text-indigo-600" },
  "ordinateur-bureau": { icon: <Monitor className="h-5 w-5" />, label: "Ordinateur de bureau", color: "text-cyan-600" },
  autre: { icon: <Box className="h-5 w-5" />, label: "Autre", color: "text-gray-600" },
};

export default function EquipementsDetailSection({ equipementCode }: EquipementsDetailSectionProps) {
  const navigate = useNavigate();
  const {
    equipements,
    ports,
    liaisons,
    coffrets,
    salles,
    lans,
    isLoadingEquipements,
    refetchPorts,
    refetchLiaisons,
    updateEquipement,
    refetchEquipements,
  } = useData();

  const [selectedEquipement, setSelectedEquipement] = useState<Equipement | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isQRCodeOpen, setIsQRCodeOpen] = useState(false);
  const [editModalType, setEditModalType] = useState<'equipement' | 'port' | 'liaison'>('equipement');

  // VLAN states for manageable switches
  const [equipementVlans, setEquipementVlans] = useState<VlanConfig[]>([]);
  const [isLoadingVlans, setIsLoadingVlans] = useState(false);

  // Pagination states
  const [portsPage, setPortsPage] = useState(1);
  const itemsPerPage = 10;

  // Retrieve selected equipment from URL code
  useEffect(() => {
    if (equipementCode && equipements.length > 0) {
      const equipement = equipements.find(e => e.equipement_code === equipementCode);
      if (equipement) {
        setSelectedEquipement(equipement);
      }
    }
  }, [equipements, equipementCode]);

  // Load VLANs for manageable switches
  useEffect(() => {
    const loadVlans = async () => {
      if (selectedEquipement && (selectedEquipement as any).is_manageable && selectedEquipement.type === 'switch') {
        setIsLoadingVlans(true);
        try {
          const vlans = await equipementService.getVlans(selectedEquipement.id);
          setEquipementVlans(vlans);
        } catch (error) {
          console.error("Error loading VLANs:", error);
        }
        setIsLoadingVlans(false);
      }
    };
    loadVlans();
  }, [selectedEquipement]);

  const handleBackToList = () => {
    navigate('/equipements');
  };

  // Formater les données de liaison pour le modal de détails
  const formatLiaisonForModal = (liaison: any) => {
    if (!liaison) return null;

    const fromPort = ports.find(p => p.id === liaison.from);
    const toPort = ports.find(p => p.id === liaison.to);
    const fromEquipement = fromPort ? equipements.find(eq => eq.id === fromPort.equipement_id) : null;
    const toEquipement = toPort ? equipements.find(eq => eq.id === toPort.equipement_id) : null;

    return {
      id: liaison.id,
      nom: liaison.label,
      label: liaison.label,
      direction: liaison.direction || 'down',
      from: liaison.from,
      to: liaison.to,
      port_source: fromPort ? {
        id: fromPort.id,
        port_label: fromPort.port_label,
        device_name: fromPort.device_name,
        equipement: fromEquipement ? {
          id: fromEquipement.id,
          name: fromEquipement.name,
          equipement_code: fromEquipement.equipement_code,
        } : null,
      } : null,
      port_destination: toPort ? {
        id: toPort.id,
        port_label: toPort.port_label,
        device_name: toPort.device_name,
        equipement: toEquipement ? {
          id: toEquipement.id,
          name: toEquipement.name,
          equipement_code: toEquipement.equipement_code,
        } : null,
      } : null,
      media: liaison.media,
      longueur: liaison.length,
      length: liaison.length,
      status: liaison.status,
      actif: liaison.status,
    };
  };

  const handleRowClick = (item: any, isLiaison?: boolean) => {
    // Trouver l'objet original dans la liste appropriée
    let originalItem = item;

    if (isLiaison || (item.from !== undefined && item.to !== undefined && item.media !== undefined)) {
      // Chercher la liaison originale
      originalItem = liaisons.find(l => l.id === item.id) || item;
      setSelectedItem(formatLiaisonForModal(originalItem));
    } else if (item.port_label !== undefined) {
      // C'est un port, chercher l'original
      originalItem = ports.find(p => p.id === item.id) || item;
      setSelectedItem(originalItem);
    } else {
      setSelectedItem(item);
    }
    setIsDetailsOpen(true);
  };

  const handleEdit = (item: any, type: 'equipement' | 'port' | 'liaison' = 'equipement') => {
    // Trouver l'objet original dans la liste appropriée
    let originalItem = item;

    if (type === 'port' && item?.id) {
      // Chercher le port original
      originalItem = ports.find(p => p.id === item.id) || item;
      // Formater les valeurs pour le modal
      setSelectedItem({
        ...originalItem,
        poe_enabled: originalItem.poe_enabled !== undefined ? String(originalItem.poe_enabled) : 'false',
        port_genre: originalItem.port_genre || 'downlink',
        connexion_type: originalItem.connexion_type || '',
        speed: originalItem.speed || '',
        vlan: originalItem.vlan || '',
      });
    } else if (type === 'liaison' && item?.id) {
      // Chercher la liaison originale
      originalItem = liaisons.find(l => l.id === item.id) || item;
      // Formater les valeurs pour le modal (convertir booléens en strings)
      setSelectedItem({
        ...originalItem,
        status: originalItem.status !== undefined ? String(originalItem.status) : 'true',
        direction: originalItem.direction || 'down',
        media: originalItem.media || '',
        label: originalItem.label || '',
        length: originalItem.length || '',
      });
    } else if (type === 'equipement' && item?.id) {
      // Pour les équipements, s'assurer que tous les champs sont présents
      originalItem = equipements.find(eq => eq.id === item.id) || item;
      setSelectedItem({
        ...originalItem,
        modele: originalItem.modele || "",
        fabricant: originalItem.fabricant || "",
        numero_serie: originalItem.numero_serie || "",
        type_reseau: originalItem.type_reseau || "IT",
        mac_address: originalItem.mac_address || "",
        is_manageable: String(originalItem.is_manageable || false),
        is_principal: String(originalItem.is_principal || false),
        ip_address: originalItem.ip_address || "",
        vlan: originalItem.vlan || "",
        description: originalItem.description || "",
        nombre_ports: originalItem.nombre_ports || 0,
      });
      setEditModalType(type);
      setIsEditOpen(true);
      return;
    } else {
      setSelectedItem(originalItem);
    }

    setEditModalType(type);
    setIsEditOpen(true);
  };

  // Pagination helper
  const paginate = <T,>(items: T[], page: number): T[] => {
    const startIndex = (page - 1) * itemsPerPage;
    return items.slice(startIndex, startIndex + itemsPerPage);
  };

  const getTotalPages = (totalItems: number): number => {
    return Math.ceil(totalItems / itemsPerPage);
  };

  // Pagination render function
  const renderPagination = (
    currentPage: number,
    totalPages: number,
    onPageChange: (page: number) => void,
    totalItems: number
  ) => {
    if (totalItems === 0) return null;

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);
    const hasMultiplePages = totalPages > 1;

    const handlePrevious = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (currentPage > 1) {
        onPageChange(currentPage - 1);
      }
    };

    const handleNext = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (currentPage < totalPages) {
        onPageChange(currentPage + 1);
      }
    };

    return (
      <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30">
        <span className="text-sm text-muted-foreground">
          {startItem}-{endItem} sur {totalItems} élément{totalItems > 1 ? 's' : ''}
        </span>
        {hasMultiplePages && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={handlePrevious}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium px-2">
              Page {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={handleNext}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    );
  };

  const handleSave = async (updatedItem: any) => {
    try {
      // Déterminer le type d'item à sauvegarder
      if (editModalType === 'port' && updatedItem.id) {
        // Sauvegarde d'un port
        const poeEnabled = updatedItem.poe_enabled === 'true' || updatedItem.poe_enabled === true;

        await portService.update(updatedItem.id, {
          port_label: updatedItem.port_label,
          device_name: updatedItem.device_name || '',
          vlan: updatedItem.vlan || undefined,
          speed: updatedItem.speed || undefined,
          connexion_type: updatedItem.connexion_type || undefined,
          port_genre: updatedItem.port_genre || undefined,
          poe_enabled: poeEnabled,
          equipement_id: updatedItem.equipement_id,
        });

        refetchPorts();
        setIsEditOpen(false);
        toast({
          title: "Port mis à jour",
          description: "Les informations du port ont été enregistrées.",
        });
      } else if (editModalType === 'liaison' && updatedItem.id) {
        // Sauvegarde d'une liaison
        const status = updatedItem.status === 'true' || updatedItem.status === true;
        const length = updatedItem.length ? Number(updatedItem.length) : undefined;

        await liaisonService.update(updatedItem.id, {
          from: updatedItem.from,
          to: updatedItem.to,
          direction: updatedItem.direction || 'down',
          label: updatedItem.label || undefined,
          media: updatedItem.media || undefined,
          length: length,
          status: status,
        });

        refetchLiaisons();
        setIsEditOpen(false);
        toast({
          title: "Liaison mise à jour",
          description: "Les informations de la liaison ont été enregistrées.",
        });
      } else if (editModalType === 'equipement' && updatedItem.equipement_code && updatedItem.id) {
        // Sauvegarde d'un équipement
        // Convertir coffret_id en nombre si nécessaire
        let coffretId: number | undefined;
        if (updatedItem.coffret_id !== undefined && updatedItem.coffret_id !== null && updatedItem.coffret_id !== '') {
          coffretId = typeof updatedItem.coffret_id === 'string'
            ? parseInt(updatedItem.coffret_id, 10)
            : updatedItem.coffret_id;
        }

        // Convertir nombre_ports en nombre si nécessaire
        let nombrePorts: number | undefined;
        if (updatedItem.nombre_ports !== undefined && updatedItem.nombre_ports !== null && updatedItem.nombre_ports !== '') {
          nombrePorts = typeof updatedItem.nombre_ports === 'string'
            ? parseInt(updatedItem.nombre_ports, 10)
            : updatedItem.nombre_ports;
        }

        // Convertir is_manageable et is_principal en booléens
        const isManageable = updatedItem.is_manageable === 'true' || updatedItem.is_manageable === true;
        const isPrincipal = updatedItem.is_principal === 'true' || updatedItem.is_principal === true;

        await updateEquipement(updatedItem.id, {
          name: updatedItem.name,
          type: updatedItem.type,
          modele: updatedItem.modele || undefined,
          fabricant: updatedItem.fabricant || undefined,
          numero_serie: updatedItem.numero_serie || undefined,
          type_reseau: updatedItem.type_reseau || undefined,
          ip_address: updatedItem.ip_address || undefined,
          mac_address: updatedItem.mac_address || undefined,
          vlan: updatedItem.vlan || undefined,
          status: updatedItem.status,
          description: updatedItem.description || undefined,
          coffret_id: coffretId,
          nombre_ports: nombrePorts,
          is_manageable: updatedItem.type === 'switch' ? isManageable : false,
          is_principal: updatedItem.type === 'switch' ? isPrincipal : false,
        });

        refetchEquipements();
        setIsEditOpen(false);
        toast({
          title: "Équipement mis à jour",
          description: "Les informations de l'équipement ont été enregistrées.",
        });
      }
    } catch (error) {
      console.error('Error updating item:', error);
      toast({
        title: "Erreur",
        description: `Une erreur est survenue lors de la mise à jour ${editModalType === 'port' ? 'du port' : editModalType === 'liaison' ? 'de la liaison' : "de l'équipement"}.`,
        variant: "destructive",
      });
    }
  };

  // Filter ports for selected equipment
  const equipementPorts = selectedEquipement
    ? ports.filter(p => p.equipement_id === selectedEquipement.id)
    : [];

  // Filter liaisons for selected equipment (via ports)
  const equipementLiaisons = selectedEquipement
    ? liaisons.filter(l => {
        const fromPort = ports.find(p => p.id === l.from);
        const toPort = ports.find(p => p.id === l.to);
        return (fromPort && fromPort.equipement_id === selectedEquipement.id) ||
               (toPort && toPort.equipement_id === selectedEquipement.id);
      })
    : [];

  // Get coffret info
  const getCoffret = () => {
    if (!selectedEquipement) return null;
    return coffrets.find(c => c.id === selectedEquipement.coffret_id);
  };

  // Get type info
  const getTypeInfo = () => {
    if (!selectedEquipement) return typeIcons.autre;
    return typeIcons[selectedEquipement.type] || typeIcons.autre;
  };

  if (isLoadingEquipements) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Chargement des équipements...</span>
      </div>
    );
  }

  if (!selectedEquipement) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Router className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground mb-4">Équipement non trouvé</p>
        <Button onClick={handleBackToList}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour à la liste
        </Button>
      </div>
    );
  }

  const coffret = getCoffret();
  const typeInfo = getTypeInfo();

  return (
    <div className="space-y-6">
      {/* Breadcrumb et header */}
      <PageHeader
        title={selectedEquipement.equipement_code}
        description={selectedEquipement.name}
        icon={<span className={typeInfo.color}>{typeInfo.icon}</span>}
        breadcrumbs={[
          { label: "Tableau de bord", href: "/" },
          { label: "Équipements", onClick: handleBackToList },
          { label: selectedEquipement.equipement_code },
        ]}
        actions={
          <Button variant="ghost" size="sm" onClick={handleBackToList}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à la liste
          </Button>
        }
      />

      {/* Infos de l'équipement */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <span className={typeInfo.color}>{typeInfo.icon}</span>
              {selectedEquipement.equipement_code}
              {(selectedEquipement as any).is_principal && (
                <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 ml-2">
                  <Star className="h-3 w-3 mr-1 fill-current" />
                  Switch principal
                </Badge>
              )}
              {(selectedEquipement as any).is_manageable && selectedEquipement.type === 'switch' && (
                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 ml-2">
                  <Settings2 className="h-3 w-3 mr-1" />
                  Manageable
                </Badge>
              )}
            </h2>
            <p className="text-lg text-muted-foreground mt-1">{selectedEquipement.name}</p>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-4">
              <div className="flex items-center gap-1">
                <span className="font-medium">Type:</span>
                <span className={typeInfo.color}>{typeInfo.label}</span>
              </div>
              {coffret && (
                <div className="flex items-center gap-1">
                  <Server className="h-4 w-4" />
                  <span
                    className="cursor-pointer text-primary hover:underline"
                    onClick={() => navigate(`/armoires/${coffret.code}/details`)}
                  >
                    Armoire: {coffret.nom || coffret.code}
                  </span>
                </div>
              )}
              {selectedEquipement.ip_address && (
                <div className="flex items-center gap-1">
                  <Network className="h-4 w-4" />
                  <span>IP: {selectedEquipement.ip_address}</span>
                </div>
              )}
              {(selectedEquipement as any).mac_address && (
                <div className="flex items-center gap-1">
                  <span className="font-medium">MAC:</span>
                  <span className="font-mono text-xs">{(selectedEquipement as any).mac_address}</span>
                </div>
              )}
              {selectedEquipement.vlan && (
                <span>VLAN: {selectedEquipement.vlan}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selectedEquipement.qr_code && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsQRCodeOpen(true)}
              >
                <QrCode className="h-4 w-4 mr-2" />
                Voir QR Code
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEdit(selectedEquipement, 'equipement')}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Modifier
            </Button>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
              selectedEquipement.status === 'active' || selectedEquipement.status === 'actif'
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                : selectedEquipement.status === 'maintenance'
                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
            }`}>
              {selectedEquipement.status === 'active' ? 'Actif' : selectedEquipement.status}
            </span>
          </div>
        </div>
      </div>

      {/* Onglets pour les détails */}
      <Tabs defaultValue="ports" className="w-full">
        <TabsList className="inline-flex h-10 bg-secondary">
          <TabsTrigger value="ports" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Ports ({equipementPorts.length})
          </TabsTrigger>
          <TabsTrigger value="liaisons" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Liaisons ({equipementLiaisons.length})
          </TabsTrigger>
          {(selectedEquipement as any).is_manageable && selectedEquipement.type === 'switch' && (
            <TabsTrigger value="vlans" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Layers className="h-4 w-4 mr-1" />
              VLANs ({equipementVlans.length})
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="ports" className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Ports de cet équipement ({equipementPorts.length})</h3>
            <AddPortForm
              defaultEquipementId={selectedEquipement?.id}
              onSuccess={() => {
                refetchPorts();
              }}
              trigger={
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter
                </Button>
              }
            />
          </div>

          {equipementPorts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-card border border-border rounded-lg">
              <Network className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground mb-4">Aucun port configuré sur cet équipement</p>
              <AddPortForm
                defaultEquipementId={selectedEquipement?.id}
                onSuccess={() => {
                  refetchPorts();
                }}
                trigger={
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un port
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr className="text-left text-sm text-muted-foreground">
                    <th className="p-3">Label</th>
                    <th className="p-3">Appareil</th>
                    <th className="p-3">Genre</th>
                    <th className="p-3">PoE</th>
                    <th className="p-3">VLAN</th>
                    <th className="p-3">Vitesse</th>
                    <th className="p-3">Connexion</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginate(equipementPorts, portsPage).map((port) => {
                    const isUplink = (port as any).port_genre === 'uplink';
                    return (
                      <tr
                        key={port.id}
                        className="border-t border-border hover:bg-muted/50 cursor-pointer"
                        onClick={() => handleRowClick(port)}
                      >
                        <td className="p-3 font-medium">{port.port_label}</td>
                        <td className="p-3">{port.device_name || '-'}</td>
                        <td className="p-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                            isUplink
                              ? "bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400"
                              : "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-400"
                          }`}>
                            {isUplink ? '↑ Uplink' : '↓ Downlink'}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                            port.poe_enabled
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                          }`}>
                            {port.poe_enabled ? 'Oui' : 'Non'}
                          </span>
                        </td>
                        <td className="p-3">{port.vlan || '-'}</td>
                        <td className="p-3">{port.speed || '-'}</td>
                        <td className="p-3">
                          {(port as any).connexion_type ? (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                              (port as any).connexion_type === 'fibre'
                                ? 'bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-400'
                                : (port as any).connexion_type === 'rj45'
                                ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-400'
                                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'
                            }`}>
                              {(port as any).connexion_type === 'fibre' ? 'Fibre' : (port as any).connexion_type === 'rj45' ? 'RJ45' : 'Cuivre'}
                            </span>
                          ) : '-'}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(port, 'port');
                              }}
                              title="Modifier"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                // TODO: Implement delete
                              }}
                              title="Supprimer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {renderPagination(
                portsPage,
                getTotalPages(equipementPorts.length),
                setPortsPage,
                equipementPorts.length
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="liaisons" className="space-y-6">
          <ConnectionsSection
            liaisons={equipementLiaisons}
            ports={ports}
            equipements={equipements}
            currentEquipementId={selectedEquipement.id}
            onAddLiaison={() => {
              // Ouvre le formulaire d'ajout via le composant AddLiaisonForm
              const addButton = document.querySelector('[data-add-liaison-trigger]') as HTMLElement;
              addButton?.click();
            }}
            onLiaisonClick={(liaison) => handleRowClick(liaison, true)}
            onEditLiaison={(liaison) => handleEdit(liaison, 'liaison')}
          />
          {/* Hidden trigger for AddLiaisonForm */}
          <AddLiaisonForm
            defaultEquipementId={selectedEquipement?.id}
            onSuccess={() => {
              refetchLiaisons();
            }}
            trigger={
              <button data-add-liaison-trigger className="hidden">
                Ajouter
              </button>
            }
          />
        </TabsContent>

        {/* VLANs tab for manageable switches */}
        {(selectedEquipement as any).is_manageable && selectedEquipement.type === 'switch' && (
          <TabsContent value="vlans" className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Layers className="h-5 w-5" />
                VLANs configurés ({equipementVlans.length})
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/vlans')}
              >
                <Settings2 className="h-4 w-4 mr-2" />
                Gérer les VLANs
              </Button>
            </div>

            {isLoadingVlans ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : equipementVlans.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Layers className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground mb-4">Aucun VLAN configuré sur ce switch</p>
                  <Button onClick={() => navigate('/vlans')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Configurer des VLANs
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {equipementVlans.map((vlan) => (
                  <Card key={vlan.lan_id} className="hover:border-primary/50 transition-colors">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                          <Layers className="h-4 w-4 text-primary" />
                          {vlan.name}
                        </CardTitle>
                        <Badge variant={vlan.is_tagged ? "default" : "secondary"}>
                          {vlan.is_tagged ? "Tagged" : "Untagged"}
                        </Badge>
                      </div>
                      <CardDescription>VLAN ID: {vlan.vlan_id}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        {vlan.subnet && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Sous-réseau:</span>
                            <span className="font-mono">{vlan.subnet}</span>
                          </div>
                        )}
                        {vlan.gateway && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Passerelle:</span>
                            <span className="font-mono">{vlan.gateway}</span>
                          </div>
                        )}
                        {vlan.ports && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Ports:</span>
                            <Badge variant="outline">{vlan.ports}</Badge>
                          </div>
                        )}
                        {vlan.description && (
                          <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                            {vlan.description}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>

      {/* Chaîne de dépendance UP/DOWN */}
      <Suspense fallback={
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              Chaîne de dépendance
            </CardTitle>
            <CardDescription>Chargement en cours...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      }>
        <DependencyChainSection
          equipementId={selectedEquipement.id}
          equipementName={selectedEquipement.name}
        />
      </Suspense>

      {/* Modals */}
      <DetailsModal
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        title="Détails"
        data={selectedItem}
        onEdit={() => {
          // Déterminer le type de l'item et récupérer les données originales
          if (selectedItem) {
            if (selectedItem.port_label !== undefined) {
              // C'est un port
              handleEdit(selectedItem, 'port');
            } else if (selectedItem.from !== undefined && selectedItem.to !== undefined) {
              // C'est une liaison
              handleEdit(selectedItem, 'liaison');
            } else if (selectedItem.equipement_code) {
              // C'est un équipement
              handleEdit(selectedItem, 'equipement');
            } else {
              // Par défaut, juste ouvrir le modal
              setIsDetailsOpen(false);
              setIsEditOpen(true);
            }
          }
        }}
      />

      <EditModal
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        title={editModalType === 'equipement' ? "Modifier l'équipement" : editModalType === 'port' ? "Modifier le port" : "Modifier la liaison"}
        data={selectedItem}
        onSave={handleSave}
        fields={editModalType === 'equipement' ? [
          { key: 'name', label: 'Nom', type: 'text', icon: <Tag className="h-3 w-3" /> },
          { key: 'equipement_code', label: 'Code', type: 'text', disabled: true, icon: <Hash className="h-3 w-3" /> },
          {
            key: 'type',
            label: 'Type',
            type: 'select',
            icon: <Box className="h-3 w-3" />,
            options: [
              { value: 'switch', label: 'Switch' },
              { value: 'routeur', label: 'Routeur' },
              { value: 'firewall', label: 'Firewall' },
              { value: 'point-acces', label: "Point d'accès" },
              { value: 'serveur', label: 'Serveur' },
              { value: 'imprimante', label: 'Imprimante' },
              { value: 'ordinateur-portable', label: 'Ordinateur portable' },
              { value: 'ordinateur-bureau', label: 'Ordinateur de bureau' },
              { value: 'autre', label: 'Autre' },
            ]
          },
          {
            key: 'coffret_id',
            label: 'Armoire',
            type: 'select',
            icon: <Archive className="h-3 w-3" />,
            options: [
              { value: 'none', label: '— Aucune (dans une salle) —' },
              ...coffrets.filter((c: any) => !c.deleted_at).map((c: any) => ({ value: c.id.toString(), label: c.nom || c.code }))
            ]
          },
          {
            key: 'salle_id',
            label: 'Salle',
            type: 'select',
            icon: <Building className="h-3 w-3" />,
            visibleWhen: { field: 'coffret_id', value: 'none' },
            options: salles.filter((s: any) => !s.deleted_at).map((s: any) => ({ value: s.id.toString(), label: s.nom }))
          },
          { key: 'modele', label: 'Modèle', type: 'text', icon: <Settings2 className="h-3 w-3" /> },
          { key: 'fabricant', label: 'Fabricant', type: 'text', icon: <Factory className="h-3 w-3" /> },
          { key: 'numero_serie', label: 'N° série', type: 'text', icon: <Hash className="h-3 w-3" /> },
          {
            key: 'type_reseau',
            label: 'Réseau',
            type: 'select',
            icon: <Network className="h-3 w-3" />,
            options: [
              { value: 'IT', label: 'IT' },
              { value: 'OT', label: 'OT' },
            ]
          },
          { key: 'ip_address', label: 'IP', type: 'text', icon: <Globe className="h-3 w-3" /> },
          { key: 'mac_address', label: 'MAC', type: 'text', icon: <Network className="h-3 w-3" /> },
          {
            key: 'vlan',
            label: 'VLAN',
            type: 'select',
            icon: <Layers className="h-3 w-3" />,
            options: [
              { value: '', label: '— Aucun —' },
              ...lans.filter(lan => lan.status === 'active').map((lan) => ({
                value: lan.name,
                label: `${lan.name} (VLAN ${lan.vlan_id})`
              }))
            ]
          },
          { key: 'nombre_ports', label: 'Ports', type: 'number', icon: <Hash className="h-3 w-3" /> },
          {
            key: 'is_manageable',
            label: 'Manageable',
            type: 'radio',
            icon: <ToggleLeft className="h-3 w-3" />,
            options: [
              { value: 'true', label: 'Oui' },
              { value: 'false', label: 'Non' },
            ],
            visibleWhen: { field: 'type', value: 'switch' }
          },
          {
            key: 'is_principal',
            label: 'Principal',
            type: 'radio',
            icon: <ToggleLeft className="h-3 w-3" />,
            options: [
              { value: 'true', label: 'Oui' },
              { value: 'false', label: 'Non' },
            ],
            visibleWhen: { field: 'type', value: 'switch' }
          },
          {
            key: 'status',
            label: 'Statut',
            type: 'select',
            icon: <ToggleLeft className="h-3 w-3" />,
            options: [
              { value: 'active', label: 'Actif' },
              { value: 'maintenance', label: 'Maintenance' },
              { value: 'inactive', label: 'Inactif' },
            ]
          },
          { key: 'description', label: 'Description', type: 'textarea', icon: <FileText className="h-3 w-3" />, fullWidth: true },
        ] : editModalType === 'port' ? [
          { key: 'port_label', label: 'Label', type: 'text', icon: <Tag className="h-3 w-3" /> },
          { key: 'device_name', label: 'Appareil', type: 'text', icon: <Box className="h-3 w-3" /> },
          {
            key: 'vlan',
            label: 'VLAN',
            type: 'select',
            icon: <Layers className="h-3 w-3" />,
            options: [
              { value: '', label: '— Aucun —' },
              ...lans.filter(lan => lan.status === 'active').map((lan) => ({
                value: lan.name,
                label: `${lan.name} (VLAN ${lan.vlan_id})`
              }))
            ]
          },
          {
            key: 'speed',
            label: 'Vitesse',
            type: 'select',
            icon: <Zap className="h-3 w-3" />,
            options: [
              { value: 'Auto', label: 'Auto-négociation' },
              { value: '10 Mbps', label: '10 Mbps' },
              { value: '100 Mbps', label: '100 Mbps' },
              { value: '1 Gbps', label: '1 Gbps' },
              { value: '2.5 Gbps', label: '2.5 Gbps' },
              { value: '5 Gbps', label: '5 Gbps' },
              { value: '10 Gbps', label: '10 Gbps' },
              { value: '25 Gbps', label: '25 Gbps' },
              { value: '40 Gbps', label: '40 Gbps' },
              { value: '100 Gbps', label: '100 Gbps' },
            ]
          },
          {
            key: 'connexion_type',
            label: 'Connexion',
            type: 'select',
            icon: <Cable className="h-3 w-3" />,
            options: [
              { value: 'fibre', label: 'Fibre optique' },
              { value: 'rj45', label: 'RJ45' },
              { value: 'cuivre', label: 'Cuivre' },
            ]
          },
          {
            key: 'port_genre',
            label: 'Genre',
            type: 'select',
            icon: <ArrowUpDown className="h-3 w-3" />,
            options: [
              { value: 'downlink', label: 'Downlink' },
              { value: 'uplink', label: 'Uplink' },
            ]
          },
          {
            key: 'poe_enabled',
            label: 'PoE',
            type: 'select',
            icon: <Zap className="h-3 w-3" />,
            options: [
              { value: 'true', label: 'Activé' },
              { value: 'false', label: 'Désactivé' },
            ]
          },
        ] : editModalType === 'liaison' ? [
          { key: 'label', label: 'Nom', type: 'text', icon: <Tag className="h-3 w-3" /> },
          {
            key: 'direction',
            label: 'Direction',
            type: 'select',
            icon: <ArrowUpDown className="h-3 w-3" />,
            options: [
              { value: 'down', label: 'Downstream (vers distribution)' },
              { value: 'up', label: 'Upstream (vers source)' },
            ]
          },
          {
            key: 'media',
            label: 'Média',
            type: 'select',
            icon: <Cable className="h-3 w-3" />,
            options: [
              { value: 'Cuivre Cat5e', label: 'Cuivre Cat5e' },
              { value: 'Cuivre Cat6', label: 'Cuivre Cat6' },
              { value: 'Cuivre Cat6a', label: 'Cuivre Cat6a' },
              { value: 'Fibre Monomode', label: 'Fibre Monomode' },
              { value: 'Fibre Multimode', label: 'Fibre Multimode' },
            ]
          },
          { key: 'length', label: 'Longueur (m)', type: 'number', icon: <Ruler className="h-3 w-3" /> },
          {
            key: 'status',
            label: 'Actif',
            type: 'select',
            icon: <ToggleLeft className="h-3 w-3" />,
            options: [
              { value: 'true', label: 'Oui' },
              { value: 'false', label: 'Non' },
            ]
          },
        ] : undefined}
      />

      {selectedEquipement?.qr_code && (
        <QRCodeModal
          open={isQRCodeOpen}
          onOpenChange={setIsQRCodeOpen}
          qrCode={selectedEquipement.qr_code}
          title={selectedEquipement.name}
          subtitle={typeInfo.label}
          type="equipement"
          code={selectedEquipement.equipement_code}
        />
      )}
    </div>
  );
}
