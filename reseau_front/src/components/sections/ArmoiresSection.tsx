import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Loader2, MapPin, Server, Plus, QrCode, Pencil, Trash2, ChevronLeft, ChevronRight, Router, Shield, Wifi, Box, ZoomIn, ZoomOut, Maximize2, Info, Network, Cable, Printer, Laptop, Monitor, Tag, Hash, Archive, Factory, Settings2, Globe, Layers, ToggleLeft, FileText, Zap, ArrowUpDown, Ruler, ImageIcon, Building } from "lucide-react";
import { Network as VisNetwork, DataSet } from 'vis-network/standalone';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DataTable from "../dashboard/DataTable";
import DataTableEnhanced from "../ui/data-table-enhanced";
import DetailsModal from "../ui/details-modal";
import EditModal from "../ui/edit-modal";
import QRCodeModal from "../ui/qr-code-modal";
import PageHeader from "../ui/page-header";
import { useData } from "@/contexts/DataContext";
import type { Coffret, Equipement } from "@/contexts/DataContext";
import AddEquipmentForm from "../forms/AddEquipmentForm";
import AddPortForm from "../forms/AddPortForm";
import AddLiaisonForm from "../forms/AddLiaisonForm";
import ConnectionsSection from "./ConnectionsSection";
import portService from "@/services/portService";
import liaisonService from "@/services/liaisonService";
import { toast } from "@/hooks/use-toast";

// Mapping des types d'équipements vers les icônes
const typeIcons: Record<string, { icon: React.ReactNode; label: string; color: string; bgColor: string }> = {
  switch: { icon: <Router className="h-4 w-4" />, label: "Switch", color: "text-sky-700 dark:text-sky-400", bgColor: "bg-sky-50 dark:bg-sky-950/50" },
  routeur: { icon: <Router className="h-4 w-4" />, label: "Routeur", color: "text-emerald-700 dark:text-emerald-400", bgColor: "bg-emerald-50 dark:bg-emerald-950/50" },
  firewall: { icon: <Shield className="h-4 w-4" />, label: "Firewall", color: "text-rose-700 dark:text-rose-400", bgColor: "bg-rose-50 dark:bg-rose-950/50" },
  "point-acces": { icon: <Wifi className="h-4 w-4" />, label: "Point d'accès", color: "text-violet-700 dark:text-violet-400", bgColor: "bg-violet-50 dark:bg-violet-950/50" },
  serveur: { icon: <Server className="h-4 w-4" />, label: "Serveur", color: "text-orange-700 dark:text-orange-400", bgColor: "bg-orange-50 dark:bg-orange-950/50" },
  imprimante: { icon: <Printer className="h-4 w-4" />, label: "Imprimante", color: "text-teal-700 dark:text-teal-400", bgColor: "bg-teal-50 dark:bg-teal-950/50" },
  "ordinateur-portable": { icon: <Laptop className="h-4 w-4" />, label: "Ordinateur portable", color: "text-indigo-700 dark:text-indigo-400", bgColor: "bg-indigo-50 dark:bg-indigo-950/50" },
  "ordinateur-bureau": { icon: <Monitor className="h-4 w-4" />, label: "Ordinateur de bureau", color: "text-cyan-700 dark:text-cyan-400", bgColor: "bg-cyan-50 dark:bg-cyan-950/50" },
  autre: { icon: <Box className="h-4 w-4" />, label: "Autre", color: "text-slate-600 dark:text-slate-400", bgColor: "bg-slate-100 dark:bg-slate-800" },
};

// Configuration des couleurs par type d'équipement pour le schéma réseau
const equipementTypeColors: Record<string, { background: string; border: string; highlight: string }> = {
  switch: { background: '#3b82f6', border: '#2563eb', highlight: '#1d4ed8' },
  routeur: { background: '#8b5cf6', border: '#7c3aed', highlight: '#6d28d9' },
  firewall: { background: '#ef4444', border: '#dc2626', highlight: '#b91c1c' },
  'point-acces': { background: '#10b981', border: '#059669', highlight: '#047857' },
  serveur: { background: '#f97316', border: '#ea580c', highlight: '#c2410c' },
  imprimante: { background: '#14b8a6', border: '#0d9488', highlight: '#0f766e' },
  'ordinateur-portable': { background: '#6366f1', border: '#4f46e5', highlight: '#4338ca' },
  'ordinateur-bureau': { background: '#06b6d4', border: '#0891b2', highlight: '#0e7490' },
  autre: { background: '#6b7280', border: '#4b5563', highlight: '#374151' },
};

// Génère un SVG encodé en base64 pour l'icône de l'équipement
const generateEquipementIcon = (type: string, color: string, isPrincipal: boolean = false): string => {
  const normalizedType = type?.toLowerCase() || 'autre';

  const iconPaths: Record<string, string> = {
    switch: `<path d="M4 6h16M4 12h16M4 18h16" stroke="white" stroke-width="2" stroke-linecap="round"/>`,
    routeur: `<circle cx="12" cy="12" r="3" fill="white"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4M5.64 5.64l2.83 2.83M15.54 15.54l2.83 2.83M5.64 18.36l2.83-2.83M15.54 8.46l2.83-2.83" stroke="white" stroke-width="2" stroke-linecap="round"/>`,
    firewall: `<rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke="white" stroke-width="2"/><path d="M12 8v8M8 12h8" stroke="white" stroke-width="2" stroke-linecap="round"/>`,
    'point-acces': `<path d="M8.3 10.7a5 5 0 017.4 0M5.5 7.5a9 9 0 0113 0M2.5 4.5a13 13 0 0119 0M12 16a1 1 0 100-2 1 1 0 000 2z" stroke="white" stroke-width="2" stroke-linecap="round" fill="none"/>`,
    serveur: `<rect x="4" y="2" width="16" height="6" rx="1" fill="none" stroke="white" stroke-width="2"/><rect x="4" y="9" width="16" height="6" rx="1" fill="none" stroke="white" stroke-width="2"/><rect x="4" y="16" width="16" height="6" rx="1" fill="none" stroke="white" stroke-width="2"/><circle cx="7" cy="5" r="1" fill="white"/><circle cx="7" cy="12" r="1" fill="white"/><circle cx="7" cy="19" r="1" fill="white"/>`,
    autre: `<rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke="white" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="white"/>`,
  };

  const iconPath = iconPaths[normalizedType] || iconPaths.autre;
  const borderColor = isPrincipal ? '#fbbf24' : color;
  const borderWidth = isPrincipal ? 4 : 2;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60">
      <circle cx="30" cy="30" r="27" fill="${color}" stroke="${borderColor}" stroke-width="${borderWidth}"/>
      <g transform="translate(18, 18) scale(1)">${iconPath}</g>
    </svg>
  `;

  return 'data:image/svg+xml;base64,' + btoa(svg);
};

// Composant de schéma réseau pour l'armoire
interface CabinetNetworkSchemaProps {
  equipements: any[];
  liaisons: any[];
  ports: any[];
}

const CabinetNetworkSchema = ({ equipements, liaisons, ports }: CabinetNetworkSchemaProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<VisNetwork | null>(null);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [selectedEdge, setSelectedEdge] = useState<any>(null);

  const getNodeColor = (type: string) => {
    const normalizedType = type?.toLowerCase() || 'autre';
    return equipementTypeColors[normalizedType] || equipementTypeColors.autre;
  };

  const initNetwork = useCallback(() => {
    if (!containerRef.current || equipements.length === 0) return;

    // Nettoyer le réseau précédent
    if (networkRef.current) {
      networkRef.current.destroy();
      networkRef.current = null;
    }

    // Créer les nœuds
    const nodes: any[] = [];
    const edges: any[] = [];

    // Ajouter tous les équipements comme nœuds
    equipements.forEach((equip) => {
      const color = getNodeColor(equip.type);
      const isPrincipal = (equip as any).is_principal || false;
      nodes.push({
        id: equip.id,
        label: equip.name,
        title: `${equip.equipement_code}\n${equip.type}\nIP: ${equip.ip_address || 'N/A'}${isPrincipal ? '\n⭐ Switch principal' : ''}`,
        image: generateEquipementIcon(equip.type, color.background, isPrincipal),
        shape: 'image',
        size: isPrincipal ? 30 : 25,
        font: {
          color: '#1f2937',
          size: 11,
          face: 'system-ui',
          bold: isPrincipal,
          vadjust: 8,
        },
        shadow: {
          enabled: true,
          color: 'rgba(0,0,0,0.15)',
          size: 8,
          x: 2,
          y: 2,
        },
        data: { ...equip },
      });
    });

    // Ajouter les liaisons comme arêtes
    liaisons.forEach((liaison, index) => {
      const fromPort = ports.find(p => p.id === liaison.from);
      const toPort = ports.find(p => p.id === liaison.to);

      if (!fromPort || !toPort) return;

      const fromEquip = equipements.find(e => e.id === fromPort.equipement_id);
      const toEquip = equipements.find(e => e.id === toPort.equipement_id);

      if (!fromEquip || !toEquip) return;

      const isUpstream = (liaison as any).direction === 'up';
      const fromPortLabel = fromPort.port_label || '';
      const toPortLabel = toPort.port_label || '';
      const media = liaison.media || '';

      // Label avec ports et média
      let edgeLabel = media;
      if (fromPortLabel || toPortLabel) {
        edgeLabel = `${fromPortLabel ? '[' + fromPortLabel + ']' : ''} ${media} ${toPortLabel ? '[' + toPortLabel + ']' : ''}`.trim();
      }

      edges.push({
        id: `edge-${index}`,
        from: fromEquip.id,
        to: toEquip.id,
        label: edgeLabel,
        title: `📍 Port source: ${fromPortLabel || 'N/A'}\n📡 Média: ${media || 'N/A'}\n📍 Port dest: ${toPortLabel || 'N/A'}\n📏 Longueur: ${liaison.length ? liaison.length + 'm' : 'N/A'}\n📊 Direction: ${isUpstream ? 'Upstream' : 'Downstream'}`,
        color: {
          color: isUpstream ? '#f97316' : '#06b6d4',
          highlight: isUpstream ? '#ea580c' : '#0891b2',
          hover: isUpstream ? '#ea580c' : '#0891b2'
        },
        width: 2,
        dashes: isUpstream ? [5, 5] : false,
        arrows: { to: { enabled: true, scaleFactor: 0.7, type: 'arrow' } },
        smooth: { type: 'curvedCW', roundness: 0.2 },
        font: { color: isUpstream ? '#ea580c' : '#0891b2', size: 9, align: 'horizontal', strokeWidth: 2, strokeColor: '#ffffff' },
        data: { ...liaison, fromPort, toPort, direction: isUpstream ? 'upstream' : 'downstream' },
      });
    });

    // Options du réseau
    const options = {
      nodes: {
        borderWidth: 0,
        borderWidthSelected: 3,
        chosen: {
          node: (values: any) => {
            values.shadowSize = 15;
          },
        },
      },
      edges: {
        font: { size: 9 },
        smooth: {
          enabled: true,
          type: 'dynamic',
        },
        chosen: {
          edge: (values: any) => {
            values.width = 3;
          },
        },
      },
      physics: {
        enabled: true,
        solver: 'forceAtlas2Based',
        forceAtlas2Based: {
          gravitationalConstant: -100,
          centralGravity: 0.01,
          springLength: 150,
          springConstant: 0.08,
          damping: 0.5,
        },
        stabilization: {
          enabled: true,
          iterations: 150,
          updateInterval: 25,
        },
      },
      interaction: {
        hover: true,
        tooltipDelay: 150,
        zoomView: true,
        dragView: true,
        dragNodes: true,
        navigationButtons: false,
        selectConnectedEdges: false,
      },
      layout: {
        improvedLayout: true,
        hierarchical: {
          enabled: false,
        },
      },
    };

    // Créer le réseau
    const nodesDataSet = new DataSet(nodes);
    const edgesDataSet = new DataSet(edges);

    const network = new VisNetwork(
      containerRef.current,
      { nodes: nodesDataSet, edges: edgesDataSet },
      options
    );

    networkRef.current = network;

    // Événements
    network.on('selectNode', (params) => {
      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0];
        const node = nodes.find(n => n.id === nodeId);
        setSelectedNode(node?.data || null);
        setSelectedEdge(null);
      }
    });

    network.on('selectEdge', (params) => {
      if (params.edges.length > 0 && params.nodes.length === 0) {
        const edgeId = params.edges[0];
        const edge = edges.find(e => e.id === edgeId);
        setSelectedEdge(edge?.data || null);
        setSelectedNode(null);
      }
    });

    network.on('deselectNode', () => {
      setSelectedNode(null);
    });

    network.on('deselectEdge', () => {
      setSelectedEdge(null);
    });

    // Centrer la vue après stabilisation
    network.once('stabilizationIterationsDone', () => {
      network.fit({ animation: { duration: 500, easingFunction: 'easeInOutQuad' } });
    });

  }, [equipements, liaisons, ports]);

  useEffect(() => {
    initNetwork();
    return () => {
      if (networkRef.current) {
        networkRef.current.destroy();
        networkRef.current = null;
      }
    };
  }, [initNetwork]);

  const handleZoomIn = () => {
    if (networkRef.current) {
      const scale = networkRef.current.getScale();
      networkRef.current.moveTo({ scale: scale * 1.3 });
    }
  };

  const handleZoomOut = () => {
    if (networkRef.current) {
      const scale = networkRef.current.getScale();
      networkRef.current.moveTo({ scale: scale / 1.3 });
    }
  };

  const handleFit = () => {
    if (networkRef.current) {
      networkRef.current.fit({ animation: { duration: 500, easingFunction: 'easeInOutQuad' } });
    }
  };

  // Compter les liaisons par direction
  const uplinkCount = liaisons.filter(l => (l as any).direction === 'up').length;
  const downlinkCount = liaisons.filter(l => (l as any).direction !== 'up').length;

  if (equipements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-card border border-border rounded-lg">
        <Network className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground mb-2">Aucun équipement dans cette armoire</p>
        <p className="text-sm text-muted-foreground">Ajoutez des équipements pour visualiser le mapping réseau</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Contrôles et statistiques */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handleZoomIn} title="Zoom avant">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleZoomOut} title="Zoom arrière">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleFit} title="Ajuster la vue">
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Équipements:</span>
            <Badge variant="secondary">{equipements.length}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Liaisons:</span>
            <Badge variant="secondary">{liaisons.length}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-orange-600 dark:text-orange-400">
              <span>↑</span> Uplink:
            </span>
            <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400">{uplinkCount}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-cyan-600 dark:text-cyan-400">
              <span>↓</span> Downlink:
            </span>
            <Badge className="bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400">{downlinkCount}</Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Zone du graphe */}
        <div className="lg:col-span-3">
          <div
            ref={containerRef}
            className="w-full h-[450px] border rounded-lg bg-slate-50 dark:bg-slate-900/50"
          />
        </div>

        {/* Panneau de détails */}
        <div className="lg:col-span-1 space-y-4">
          {/* Détails */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Info className="h-4 w-4" />
                Détails
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {selectedNode ? (
                <div className="space-y-2">
                  <div className="font-semibold">{selectedNode.name}</div>
                  <div className="text-xs text-muted-foreground">{selectedNode.equipement_code}</div>
                  <div className="space-y-1 mt-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type:</span>
                      <Badge variant="outline" className="text-xs">{selectedNode.type}</Badge>
                    </div>
                    {selectedNode.ip_address && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">IP:</span>
                        <span className="font-mono text-xs">{selectedNode.ip_address}</span>
                      </div>
                    )}
                    {selectedNode.mac_address && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">MAC:</span>
                        <span className="font-mono text-xs truncate max-w-[100px]">{selectedNode.mac_address}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Statut:</span>
                      <Badge variant={selectedNode.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                        {selectedNode.status === 'active' ? 'Actif' : selectedNode.status}
                      </Badge>
                    </div>
                    {selectedNode.is_principal && (
                      <div className="mt-2 pt-2 border-t">
                        <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 text-xs">
                          Switch principal
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              ) : selectedEdge ? (
                <div className="space-y-2">
                  <div className="font-semibold flex items-center gap-2">
                    <Cable className="h-4 w-4" />
                    Liaison
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Média:</span>
                      <span>{selectedEdge.media || 'N/A'}</span>
                    </div>
                    {selectedEdge.length && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Longueur:</span>
                        <span>{selectedEdge.length}m</span>
                      </div>
                    )}
                    {selectedEdge.fromPort && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Port source:</span>
                        <span className="font-mono text-xs">{selectedEdge.fromPort.port_label}</span>
                      </div>
                    )}
                    {selectedEdge.toPort && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Port dest:</span>
                        <span className="font-mono text-xs">{selectedEdge.toPort.port_label}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Direction:</span>
                      <Badge variant="outline" className={`text-xs ${selectedEdge.direction === 'upstream' ? 'border-orange-500 text-orange-600' : 'border-cyan-500 text-cyan-600'}`}>
                        {selectedEdge.direction === 'upstream' ? '↑ Uplink' : '↓ Downlink'}
                      </Badge>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-xs">
                  Cliquez sur un équipement ou une liaison pour voir les détails
                </p>
              )}
            </CardContent>
          </Card>

          {/* Légende */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Légende</CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-2">
              <div className="space-y-1.5">
                <div className="font-medium text-muted-foreground mb-1">Types</div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: equipementTypeColors.switch.background }} />
                  <span>Switch</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: equipementTypeColors.routeur.background }} />
                  <span>Routeur</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: equipementTypeColors.firewall.background }} />
                  <span>Firewall</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: equipementTypeColors['point-acces'].background }} />
                  <span>Point d'accès</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: equipementTypeColors.serveur.background }} />
                  <span>Serveur</span>
                </div>
              </div>
              <div className="border-t pt-2 space-y-1.5">
                <div className="font-medium text-muted-foreground mb-1">Liaisons</div>
                <div className="flex items-center gap-2">
                  <svg width="24" height="8" className="flex-shrink-0">
                    <line x1="0" y1="4" x2="24" y2="4" stroke="#f97316" strokeWidth="2" strokeDasharray="4 3" />
                  </svg>
                  <span>Uplink (vers source)</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg width="24" height="8" className="flex-shrink-0">
                    <line x1="0" y1="4" x2="24" y2="4" stroke="#06b6d4" strokeWidth="2" />
                  </svg>
                  <span>Downlink (vers distribution)</span>
                </div>
              </div>
              <div className="border-t pt-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-yellow-400 bg-gray-400" />
                  <span>Switch principal</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

interface ArmoiresSectionProps {
  coffretCode?: string;
}

export default function ArmoiresSection({ coffretCode }: ArmoiresSectionProps) {
  const navigate = useNavigate();
  const {
    coffrets,
    equipements,
    ports,
    liaisons,
    batiments,
    salles,
    lans,
    isLoadingCoffrets,
    isLoadingEquipements,
    refetchEquipements,
    refetchPorts,
    refetchLiaisons,
    updateCoffret,
    updateEquipement,
    refetchCoffrets,
  } = useData();

  const [selectedCoffret, setSelectedCoffret] = useState<Coffret | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isQRCodeOpen, setIsQRCodeOpen] = useState(false);
  const [qrCodeCoffret, setQrCodeCoffret] = useState<Coffret | null>(null);
  const [selectedBatimentId, setSelectedBatimentId] = useState<number | undefined>(undefined);
  const [selectedSalleId, setSelectedSalleId] = useState<number | undefined>(undefined);
  const [returnToArmoires, setReturnToArmoires] = useState(false);
  const [editModalType, setEditModalType] = useState<'coffret' | 'equipement' | 'port' | 'liaison' | 'systeme'>('coffret');

  // Pagination states
  const [equipementsPage, setEquipementsPage] = useState(1);
  const [portsPage, setPortsPage] = useState(1);
  const [liaisonsPage, setLiaisonsPage] = useState(1);
  const itemsPerPage = 10;

  // Retrieve selected cabinet from URL code or localStorage
  useEffect(() => {
    // Si on a un code dans l'URL, chercher le coffret correspondant
    if (coffretCode && coffrets.length > 0) {
      const coffret = coffrets.find(c => c.code === coffretCode);
      if (coffret) {
        setSelectedCoffret(coffret);
        setReturnToArmoires(true);
      }
      return;
    }

    // Sinon, utiliser localStorage (ancien comportement)
    const savedCoffretId = localStorage.getItem('selectedCoffretId');
    const shouldReturnToArmoires = localStorage.getItem('returnToArmoires');

    if (shouldReturnToArmoires === 'true') {
      setReturnToArmoires(true);
      localStorage.removeItem('returnToArmoires');
    }

    if (savedCoffretId && coffrets.length > 0) {
      const coffret = coffrets.find(c => c.id.toString() === savedCoffretId);
      if (coffret) {
        setSelectedCoffret(coffret);
      }
      localStorage.removeItem('selectedCoffretId');
    }
  }, [coffrets, coffretCode]);

  const handleCoffretClick = (coffret: Coffret) => {
    // Naviguer vers la page de détails avec le code de l'armoire
    navigate(`/armoires/${coffret.code}/details`);
  };

  const handleBackToList = () => {
    // Si on vient de la page /armoires, retourner vers /armoires
    if (returnToArmoires) {
      navigate('/armoires');
    } else {
      setSelectedCoffret(null);
    }
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

  const handleEdit = (item: any, type: 'coffret' | 'equipement' | 'port' | 'liaison' | 'systeme' = 'coffret') => {
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
      // Pour les équipements, récupérer les données complètes depuis la liste globale
      const fullEquipement = equipements.find(e => e.id === item.id);
      if (fullEquipement) {
        setSelectedItem({
          ...fullEquipement,
          modele: fullEquipement.modele || "",
          fabricant: fullEquipement.fabricant || "",
          numero_serie: fullEquipement.numero_serie || "",
          type_reseau: fullEquipement.type_reseau || "IT",
          mac_address: (fullEquipement as any).mac_address || "",
          is_manageable: String((fullEquipement as any).is_manageable || false),
          is_principal: String((fullEquipement as any).is_principal || false),
        });
      } else {
        setSelectedItem(item);
      }
    } else {
      setSelectedItem(item);
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

  const handleViewQRCode = (coffret: Coffret) => {
    setQrCodeCoffret(coffret);
    setIsQRCodeOpen(true);
  };

  // Filtrer les coffrets par bâtiment et salle
  const filteredCoffrets = coffrets.filter(coffret => {
    if (selectedBatimentId && coffret.batiment_id !== selectedBatimentId) {
      return false;
    }
    if (selectedSalleId && coffret.salle_id !== selectedSalleId) {
      return false;
    }
    return true;
  });

  // Filtrer les salles selon le bâtiment sélectionné
  const filteredSalles = selectedBatimentId
    ? salles.filter(salle => salle.batiment_id === selectedBatimentId)
    : salles;

  // Réinitialiser le filtre salle si le bâtiment change
  useEffect(() => {
    if (selectedBatimentId) {
      const salle = salles.find(s => s.id === selectedSalleId);
      if (!salle || salle.batiment_id !== selectedBatimentId) {
        setSelectedSalleId(undefined);
      }
    } else {
      setSelectedSalleId(undefined);
    }
  }, [selectedBatimentId, selectedSalleId, salles]);

  const handleSave = async (updatedItem: any) => {
    try {
      // Déterminer le type d'item à sauvegarder selon editModalType
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
      } else if (editModalType === 'coffret' && updatedItem.code && updatedItem.id && !updatedItem.equipement_code) {
        // Sauvegarde d'un coffret
        // Check if there's a file upload
        if (updatedItem.photo instanceof File) {
          // Use FormData for file upload
          const formData = new FormData();
          formData.append('nom', updatedItem.nom);
          if (updatedItem.modele) formData.append('modele', updatedItem.modele);
          if (updatedItem.emplacement) formData.append('emplacement', updatedItem.emplacement);
          if (updatedItem.long !== undefined && updatedItem.long !== null && updatedItem.long !== '') formData.append('long', String(updatedItem.long));
          if (updatedItem.lat !== undefined && updatedItem.lat !== null && updatedItem.lat !== '') formData.append('lat', String(updatedItem.lat));
          if (updatedItem.batiment_id) formData.append('batiment_id', String(updatedItem.batiment_id));
          if (updatedItem.salle_id) formData.append('salle_id', String(updatedItem.salle_id));
          if (updatedItem.status) formData.append('status', updatedItem.status);
          formData.append('photo', updatedItem.photo);
          // For PUT with FormData, Laravel needs _method
          formData.append('_method', 'PUT');
          await updateCoffret(updatedItem.id, formData as any);
        } else {
          await updateCoffret(updatedItem.id, {
            nom: updatedItem.nom,
            modele: updatedItem.modele || undefined,
            emplacement: updatedItem.emplacement || undefined,
            long: updatedItem.long,
            lat: updatedItem.lat,
            batiment_id: updatedItem.batiment_id,
            salle_id: updatedItem.salle_id,
            status: updatedItem.status,
          });
        }
        refetchCoffrets();
        setIsEditOpen(false);
        toast({
          title: "Armoire mise à jour",
          description: "Les informations de l'armoire ont été enregistrées.",
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
        description: `Une erreur est survenue lors de la mise à jour ${
          editModalType === 'port' ? 'du port'
          : editModalType === 'liaison' ? 'de la liaison'
          : editModalType === 'coffret' ? "de l'armoire"
          : "de l'équipement"
        }.`,
        variant: "destructive",
      });
    }
  };

  // Filter equipment from selected cabinet
  // Use relation equipment first, otherwise filter from global list
  const coffretEquipements = selectedCoffret
    ? (selectedCoffret.equipements && Array.isArray(selectedCoffret.equipements) && selectedCoffret.equipements.length > 0
        ? selectedCoffret.equipements
        : equipements.filter(e => e && e.coffret_id === selectedCoffret.id))
    : [];

  // Debug: check equipment
  useEffect(() => {
    if (selectedCoffret) {
      console.log('Selected coffret:', selectedCoffret);
      console.log('Coffret equipements (from relation):', selectedCoffret.equipements);
      console.log('All equipements:', equipements);
      console.log('Filtered equipements:', coffretEquipements);
    }
  }, [selectedCoffret, equipements, coffretEquipements]);

  // Filter ports from selected cabinet (via equipment)
  const coffretPorts = selectedCoffret
    ? ports.filter(p => {
        const equipement = equipements.find(e => e.id === p.equipement_id);
        return equipement && equipement.coffret_id === selectedCoffret.id;
      })
    : [];

  // Filter links from selected cabinet (via ports)
  const coffretLiaisons = selectedCoffret
    ? liaisons.filter(l => {
        const fromPort = ports.find(p => p.id === l.from);
        const toPort = ports.find(p => p.id === l.to);
        const fromEquip = fromPort ? equipements.find(e => e.id === fromPort.equipement_id) : null;
        const toEquip = toPort ? equipements.find(e => e.id === toPort.equipement_id) : null;
        return (fromEquip && fromEquip.coffret_id === selectedCoffret.id) || 
               (toEquip && toEquip.coffret_id === selectedCoffret.id);
      })
    : [];

  if (isLoadingCoffrets) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Chargement des armoires...</span>
      </div>
    );
  }

  // Vue détaillée de l'armoire
  if (selectedCoffret) {
    return (
      <div className="space-y-6">
        {/* Breadcrumb et header */}
        <PageHeader
          title={selectedCoffret.code}
          description={selectedCoffret.nom}
          icon={<Server className="h-6 w-6 text-primary" />}
          breadcrumbs={[
            { label: "Tableau de bord", href: "/" },
            { label: "Armoires", onClick: handleBackToList },
            { label: selectedCoffret.code },
          ]}
          actions={
            <Button variant="ghost" size="sm" onClick={handleBackToList}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à la liste
            </Button>
          }
        />

        {/* Infos du coffret */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Server className="h-6 w-6" />
                {selectedCoffret.code}
              </h2>
              <p className="text-lg text-muted-foreground mt-1">{selectedCoffret.nom}</p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-4">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>Salle: {salles.find(s => s.id === selectedCoffret.salle_id)?.nom || selectedCoffret.emplacement || 'Non définie'}</span>
                </div>
                {selectedCoffret.lat && selectedCoffret.long && (
                  <span>GPS: {selectedCoffret.lat}, {selectedCoffret.long}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {selectedCoffret.qr_code && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsQRCodeOpen(true)}
                >
                  <QrCode className="h-4 w-4 mr-2" />
                  Voir QR Code
                </Button>
              )}
              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                selectedCoffret.status === 'actif' || selectedCoffret.status === 'active' || selectedCoffret.status === 'Actif'
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                  : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'
              }`}>
                {selectedCoffret.status === 'active' || selectedCoffret.status === 'actif' ? 'Actif' : selectedCoffret.status || 'Actif'}
              </span>
            </div>
          </div>
        </div>

        {/* Onglets pour les détails */}
        <Tabs defaultValue="equipements" className="w-full">
          <TabsList className="inline-flex h-10 bg-secondary">
            <TabsTrigger value="equipements" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Équipements ({coffretEquipements.length})
            </TabsTrigger>
            <TabsTrigger value="ports" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Ports
            </TabsTrigger>
            <TabsTrigger value="liaisons" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Liaisons
            </TabsTrigger>
            <TabsTrigger value="mapping" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Network className="h-4 w-4 mr-1.5" />
              Mapping
            </TabsTrigger>
          </TabsList>

          <TabsContent value="equipements" className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Équipements de cette armoire</h3>
              <AddEquipmentForm
                defaultCoffretId={selectedCoffret?.id}
                onSuccess={() => {
                  refetchEquipements();
                }}
                trigger={
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter
                  </Button>
                }
              />
            </div>

            {coffretEquipements.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 bg-card border border-border rounded-lg">
                <Server className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground mb-4">Aucun équipement dans cette armoire</p>
                <AddEquipmentForm
                  defaultCoffretId={selectedCoffret?.id}
                  onSuccess={() => {
                    refetchEquipements();
                  }}
                  trigger={
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter un équipement
                    </Button>
                  }
                />
              </div>
            ) : (
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr className="text-left text-sm text-muted-foreground">
                      <th className="p-3">Code</th>
                      <th className="p-3">Nom</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">IP</th>
                      <th className="p-3">VLAN</th>
                      <th className="p-3">Ports</th>
                      <th className="p-3">Statut</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginate(coffretEquipements, equipementsPage).map((equip) => {
                      const typeInfo = typeIcons[equip.type] || typeIcons.autre;
                      const equipPorts = ports.filter(p => p.equipement_id === equip.id);
                      const nombrePorts = (equip as any).nombre_ports || 0;
                      return (
                        <tr
                          key={equip.id}
                          className="border-t border-border hover:bg-muted/50 cursor-pointer"
                          onClick={() => handleRowClick(equip)}
                        >
                          <td className="p-3 font-medium">{equip.equipement_code}</td>
                          <td className="p-3">{equip.name}</td>
                          <td className="p-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${typeInfo.bgColor} ${typeInfo.color}`}>
                              {typeInfo.icon}
                              {typeInfo.label}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-sm">{equip.ip_address || '-'}</td>
                          <td className="p-3">{equip.vlan || '-'}</td>
                          <td className="p-3">
                            {nombrePorts > 0 ? (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                                equipPorts.length >= nombrePorts
                                  ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'
                                  : equipPorts.length > 0
                                  ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-400'
                                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                              }`}>
                                {equipPorts.length}/{nombrePorts}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="p-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                              equip.status === 'actif' || equip.status === 'active' || equip.status === 'up'
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                                : equip.status === 'maintenance'
                                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            }`}>
                              {equip.status === 'active' ? 'Actif' : equip.status === 'maintenance' ? 'Maintenance' : equip.status}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(equip, 'equipement');
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
                  equipementsPage,
                  getTotalPages(coffretEquipements.length),
                  setEquipementsPage,
                  coffretEquipements.length
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="ports" className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Ports configurés ({coffretPorts.length})</h3>
              <AddPortForm
                defaultCoffretId={selectedCoffret?.id}
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

            {coffretPorts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 bg-card border border-border rounded-lg">
                <Server className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground mb-4">Aucun port configuré</p>
                <AddPortForm
                  defaultCoffretId={selectedCoffret?.id}
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
                      <th className="p-3">Genre</th>
                      <th className="p-3">PoE</th>
                      <th className="p-3">VLAN</th>
                      <th className="p-3">Vitesse</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginate(coffretPorts, portsPage).map((port) => {
                      const isUplink = (port as any).port_genre === 'uplink';
                      return (
                        <tr
                          key={port.id}
                          className="border-t border-border hover:bg-muted/50 cursor-pointer"
                          onClick={() => handleRowClick(port)}
                        >
                          <td className="p-3 font-medium">{port.port_label}</td>
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
                  getTotalPages(coffretPorts.length),
                  setPortsPage,
                  coffretPorts.length
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="liaisons" className="space-y-6">
            <ConnectionsSection
              liaisons={coffretLiaisons}
              ports={ports}
              equipements={equipements}
              currentEquipementId={0}
              onAddLiaison={() => {
                // Ouvre le formulaire d'ajout via le composant AddLiaisonForm
                const addButton = document.querySelector('[data-add-liaison-armoire-trigger]') as HTMLElement;
                addButton?.click();
              }}
              onLiaisonClick={(liaison) => handleRowClick(liaison, true)}
              onEditLiaison={(liaison) => handleEdit(liaison, 'liaison')}
            />
            {/* Hidden trigger for AddLiaisonForm */}
            <AddLiaisonForm
              defaultCoffretId={selectedCoffret?.id}
              onSuccess={() => {
                refetchLiaisons();
              }}
              trigger={
                <button data-add-liaison-armoire-trigger className="hidden">
                  Ajouter
                </button>
              }
            />
          </TabsContent>

          <TabsContent value="mapping" className="space-y-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Network className="h-5 w-5" />
                Mapping réseau de l'armoire
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Visualisation des équipements et liaisons (uplink/downlink) à l'intérieur de l'armoire
              </p>
            </div>

            <CabinetNetworkSchema
              equipements={coffretEquipements}
              liaisons={coffretLiaisons}
              ports={coffretPorts}
            />
          </TabsContent>
        </Tabs>

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
              } else if (selectedItem.code && selectedItem.nom) {
                // C'est un coffret
                handleEdit(selectedItem, 'coffret');
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
          title={editModalType === 'coffret' ? "Modifier l'armoire" : editModalType === 'port' ? "Modifier le port" : editModalType === 'liaison' ? "Modifier la liaison" : editModalType === 'equipement' ? "Modifier l'équipement" : "Modifier"}
          data={selectedItem}
          onSave={handleSave}
          fields={editModalType === 'coffret' ? [
            { key: 'nom', label: 'Nom', type: 'text', required: true, icon: <Tag className="h-3 w-3" /> },
            { key: 'code', label: 'Code', type: 'text', disabled: true, icon: <Hash className="h-3 w-3" /> },
            { key: 'modele', label: 'Modèle', type: 'text', icon: <Settings2 className="h-3 w-3" /> },
            { key: 'photo', label: 'Photo', type: 'file', accept: 'image/*', currentImageKey: 'photo_url', icon: <ImageIcon className="h-3 w-3" /> },
            {
              key: 'salle_id',
              label: 'Salle',
              type: 'select',
              required: true,
              icon: <Building className="h-3 w-3" />,
              options: salles.filter((s: any) => !s.deleted_at).map((s: any) => ({ value: s.id.toString(), label: s.nom }))
            },
            { key: 'emplacement', label: 'Emplacement', type: 'textarea', icon: <MapPin className="h-3 w-3" /> },
            { key: 'long', label: 'Longitude', type: 'number', icon: <Globe className="h-3 w-3" /> },
            { key: 'lat', label: 'Latitude', type: 'number', icon: <Globe className="h-3 w-3" /> },
            {
              key: 'status',
              label: 'Statut',
              type: 'select',
              icon: <ToggleLeft className="h-3 w-3" />,
              options: [
                { value: 'active', label: 'Actif' },
                { value: 'inactive', label: 'Inactif' },
              ]
            },
          ] : editModalType === 'port' ? [
            { key: 'port_label', label: 'Label', type: 'text', required: true, icon: <Tag className="h-3 w-3" /> },
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
              key: 'poe_enabled',
              label: 'PoE',
              type: 'select',
              icon: <Zap className="h-3 w-3" />,
              options: [
                { value: 'true', label: 'Activé' },
                { value: 'false', label: 'Désactivé' },
              ]
            },
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
            {
              key: 'statut',
              label: 'Statut',
              type: 'select',
              icon: <ToggleLeft className="h-3 w-3" />,
              options: [
                { value: 'actif', label: 'Actif' },
                { value: 'inactif', label: 'Inactif' },
                { value: 'reserve', label: 'Réservé' },
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
            { key: 'uplink', label: 'Uplink', type: 'text', icon: <ArrowUpDown className="h-3 w-3" /> },
            { key: 'downlink', label: 'Downlink', type: 'text', icon: <ArrowUpDown className="h-3 w-3" /> },
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
          ] : editModalType === 'liaison' ? [
            { key: 'label', label: 'Nom', type: 'text', required: true, icon: <Tag className="h-3 w-3" /> },
            {
              key: 'direction',
              label: 'Direction',
              type: 'select',
              required: true,
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
              required: true,
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
          ] : editModalType === 'equipement' ? [
            { key: 'name', label: 'Nom', type: 'text', required: true, icon: <Tag className="h-3 w-3" /> },
            { key: 'equipement_code', label: 'Code', type: 'text', disabled: true, icon: <Hash className="h-3 w-3" /> },
            {
              key: 'type',
              label: 'Type',
              type: 'select',
              required: true,
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
          ] : undefined}
        />

        {/* Modal QR Code pour le coffret sélectionné */}
        {selectedCoffret?.qr_code && (
          <QRCodeModal
            open={isQRCodeOpen}
            onOpenChange={setIsQRCodeOpen}
            qrCode={selectedCoffret.qr_code}
            title={`QR Code - ${selectedCoffret.nom || selectedCoffret.code}`}
          />
        )}
      </div>
    );
  }

  // Vue liste des armoires
  return (
    <div className="space-y-6">
      <PageHeader
        title="Armoires"
        description={`${filteredCoffrets.length} armoire${filteredCoffrets.length !== 1 ? 's' : ''} dans l'inventaire`}
        icon={<Server className="h-6 w-6 text-primary" />}
        breadcrumbs={[
          { label: "Tableau de bord", href: "/" },
          { label: "Armoires" },
        ]}
        actions={
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une armoire
          </Button>
        }
      />

      {/* Filtres par bâtiment et salle */}
      <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-foreground">Bâtiment:</label>
          <Select
            value={selectedBatimentId?.toString() || "all"}
            onValueChange={(value) => setSelectedBatimentId(value === "all" ? undefined : parseInt(value))}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Tous les bâtiments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les bâtiments</SelectItem>
              {batiments?.map((batiment) => (
                <SelectItem key={batiment.id} value={batiment.id.toString()}>
                  {batiment.nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-foreground">Salle:</label>
          <Select
            value={selectedSalleId?.toString() || "all"}
            onValueChange={(value) => setSelectedSalleId(value === "all" ? undefined : parseInt(value))}
            disabled={!selectedBatimentId && filteredSalles.length === 0}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder={selectedBatimentId ? "Toutes les salles" : "Sélectionnez d'abord un bâtiment"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les salles</SelectItem>
              {filteredSalles?.map((salle) => (
                <SelectItem key={salle.id} value={salle.id.toString()}>
                  {salle.nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {(selectedBatimentId || selectedSalleId) && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedBatimentId(undefined);
              setSelectedSalleId(undefined);
            }}
          >
            Effacer les filtres
          </Button>
        )}
      </div>

      {filteredCoffrets.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Server className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Aucune armoire trouvée</p>
          <p className="text-sm">Ajoutez une armoire pour commencer</p>
        </div>
      ) : (
        <DataTableEnhanced
          title={`${filteredCoffrets.length} armoire${filteredCoffrets.length !== 1 ? 's' : ''} dans l'inventaire`}
          columns={["Code", "Nom", "Salle", "Statut", "Équipements"]}
          data={filteredCoffrets.map((coffret) => {
            const equipCount = equipements.filter(e => e.coffret_id === coffret.id).length;
            return {
              id: coffret.id,
              Code: coffret.code,
              Nom: coffret.nom,
              Salle: salles.find(s => s.id === coffret.salle_id)?.nom || '-',
              Statut: coffret.status || 'actif',
              Équipements: `${equipCount} équipement${equipCount !== 1 ? 's' : ''}`,
              _originalData: coffret // Conserver les données originales pour le QR code
            };
          })}
          onRowClick={(row) => {
            const coffret = coffrets.find(c => c.id === row.id);
            if (coffret) {
              handleCoffretClick(coffret);
            }
          }}
          onEdit={(row) => {
            const coffret = coffrets.find(c => c.id === row.id);
            if (coffret) {
              handleEdit(coffret);
            }
          }}
          renderRowActions={(row) => {
            const coffret = row._originalData as Coffret;
            if (!coffret || !coffret.qr_code) return null;

            return (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewQRCode(coffret);
                }}
                title="Voir QR Code"
              >
                <QrCode className="h-4 w-4" />
              </Button>
            );
          }}
        />
      )}

      {/* Modal QR Code pour les coffrets de la liste */}
      {qrCodeCoffret?.qr_code && (
        <QRCodeModal
          open={isQRCodeOpen}
          onOpenChange={(open) => {
            setIsQRCodeOpen(open);
            if (!open) {
              setQrCodeCoffret(null);
            }
          }}
          qrCode={qrCodeCoffret.qr_code}
          title={`QR Code - ${qrCodeCoffret.nom || qrCodeCoffret.code}`}
        />
      )}
    </div>
  );
}
