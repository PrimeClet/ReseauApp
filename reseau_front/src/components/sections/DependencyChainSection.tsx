import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowUp,
  ArrowDown,
  Network,
  AlertTriangle,
  Server,
  Router,
  HardDrive,
  RefreshCw,
  Star,
  Monitor,
  Wifi,
  Cable,
  MapPin,
  Building2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Info,
} from 'lucide-react';
import equipementService, {
  type DependencyChainItem,
  type DependencyChainPort,
} from '@/services/equipementService';
import { Network as VisNetwork, DataSet } from 'vis-network/standalone';

interface DependencyChainSectionProps {
  equipementId: number;
  equipementName?: string;
}

const getEquipementIcon = (type: string, className?: string) => {
  const normalizedType = type?.toLowerCase() || '';
  const iconClass = className || 'h-6 w-6';

  if (normalizedType.includes('switch')) return <Wifi className={iconClass} />;
  if (normalizedType.includes('routeur') || normalizedType.includes('router')) return <Router className={iconClass} />;
  if (normalizedType.includes('serveur') || normalizedType.includes('server')) return <Server className={iconClass} />;
  if (normalizedType.includes('api') || normalizedType.includes('automate')) return <Monitor className={iconClass} />;
  return <HardDrive className={iconClass} />;
};

const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (status?.toLowerCase()) {
    case 'active':
      return 'default';
    case 'inactive':
      return 'secondary';
    case 'maintenance':
      return 'destructive';
    default:
      return 'outline';
  }
};

const getStatusLabel = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'active':
      return 'Actif';
    case 'inactive':
      return 'Inactif';
    case 'maintenance':
      return 'Maintenance';
    default:
      return status || 'N/A';
  }
};

// Composant pour une carte d'équipement dans la timeline
interface EquipementCardProps {
  equipement: DependencyChainItem['equipement'];
  liaison?: DependencyChainItem['liaison'];
  fromPort?: DependencyChainPort;
  toPort?: DependencyChainPort;
  isSource?: boolean;
  isEnd?: boolean;
  direction: 'up' | 'down';
}

const EquipementCard = ({ equipement, liaison, fromPort, toPort, isSource, isEnd, direction }: EquipementCardProps) => {
  const bgColor = isSource
    ? 'bg-primary/10 border-primary'
    : isEnd
      ? 'bg-green-50 dark:bg-green-950/30 border-green-500'
      : 'bg-card border-border';

  const lineColor = 'bg-green-500';

  // Déterminer quel port afficher selon la direction
  const relevantPort = direction === 'up' ? fromPort : toPort;

  return (
    <div className="relative">
      {/* Ligne verticale de connexion */}
      {!isSource && (
        <div className={`absolute left-8 -top-6 w-0.5 h-6 ${lineColor}`} />
      )}

      {/* Carte de l'équipement */}
      <div className={`flex items-start gap-4 p-4 rounded-lg border-2 ${bgColor}`}>
        {/* Icône de l'équipement */}
        <div className={`flex-shrink-0 p-3 rounded-full ${isSource ? 'bg-primary/20 text-primary' : isEnd ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400' : 'bg-muted text-muted-foreground'}`}>
          {getEquipementIcon(equipement.type, 'h-6 w-6')}
        </div>

        {/* Informations de l'équipement */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold text-base truncate">{equipement.name}</h4>
            {equipement.is_principal && (
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" title="Switch principal" />
            )}
            <Badge variant="outline" className="text-xs">
              {equipement.type}
            </Badge>
            <Badge variant={getStatusBadgeVariant(equipement.status)} className="text-xs">
              {getStatusLabel(equipement.status)}
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground mt-1">
            {equipement.equipement_code}
          </p>

          {/* IP et MAC */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
            {equipement.ip_address && (
              <span>IP: {equipement.ip_address}</span>
            )}
            {equipement.mac_address && (
              <span className="font-mono">MAC: {equipement.mac_address}</span>
            )}
          </div>
        </div>

        {/* Port info si disponible */}
        {relevantPort && (
          <div className="flex-shrink-0 text-right border-l pl-4">
            <div className="text-xs font-medium text-muted-foreground mb-1">Port</div>
            <div className="text-sm font-semibold">{relevantPort.port_label}</div>
            {relevantPort.connexion_type && (
              <div className="text-xs text-muted-foreground">{relevantPort.connexion_type}</div>
            )}
            {relevantPort.speed && (
              <div className="text-xs font-mono text-muted-foreground">{relevantPort.speed}</div>
            )}
          </div>
        )}
      </div>

      {/* Info de la liaison */}
      {liaison && !isSource && (
        <div className="relative ml-8 my-2">
          <div className={`absolute left-0 top-0 w-0.5 h-full ${lineColor}`} />
          <div className="ml-4 flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded px-3 py-1.5 w-fit">
            <Cable className="h-3 w-3" />
            <span className="font-medium">{liaison.media || 'N/A'}</span>
            {liaison.cable_type && (
              <>
                <span className="text-muted-foreground/70">-</span>
                <span>{liaison.cable_type}</span>
              </>
            )}
            {liaison.length && (
              <>
                <span className="text-muted-foreground/70">-</span>
                <span>{liaison.length}m</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Ligne vers le prochain élément */}
      {!isEnd && (
        <div className={`absolute left-8 -bottom-6 w-0.5 h-6 ${lineColor}`} />
      )}
    </div>
  );
};

// Composant pour la timeline complète
interface DependencyTimelineProps {
  mainEquipement: any;
  items: DependencyChainItem[];
  direction: 'up' | 'down';
  emptyMessage: string;
  emptyIcon: React.ReactNode;
}

// Configuration des couleurs par type d'équipement
const equipementTypeColors: Record<string, { background: string; border: string; highlight: string }> = {
  switch: { background: '#3b82f6', border: '#2563eb', highlight: '#1d4ed8' },
  routeur: { background: '#8b5cf6', border: '#7c3aed', highlight: '#6d28d9' },
  firewall: { background: '#ef4444', border: '#dc2626', highlight: '#b91c1c' },
  'point-acces': { background: '#10b981', border: '#059669', highlight: '#047857' },
  serveur: { background: '#f97316', border: '#ea580c', highlight: '#c2410c' },
  autre: { background: '#6b7280', border: '#4b5563', highlight: '#374151' },
};

// Composant de visualisation du schéma réseau
interface NetworkSchemaProps {
  mainEquipement: any;
  upstream: DependencyChainItem[];
  downstream: DependencyChainItem[];
}

// Génère un SVG encodé en base64 pour l'icône de l'équipement
const generateEquipementIcon = (type: string, color: string, isMain: boolean = false): string => {
  const normalizedType = type?.toLowerCase() || 'autre';

  // Icônes SVG pour chaque type d'équipement
  const iconPaths: Record<string, string> = {
    switch: `<path d="M4 6h16M4 12h16M4 18h16" stroke="white" stroke-width="2" stroke-linecap="round"/>`,
    routeur: `<circle cx="12" cy="12" r="3" fill="white"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4M5.64 5.64l2.83 2.83M15.54 15.54l2.83 2.83M5.64 18.36l2.83-2.83M15.54 8.46l2.83-2.83" stroke="white" stroke-width="2" stroke-linecap="round"/>`,
    firewall: `<rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke="white" stroke-width="2"/><path d="M12 8v8M8 12h8" stroke="white" stroke-width="2" stroke-linecap="round"/>`,
    'point-acces': `<path d="M8.3 10.7a5 5 0 017.4 0M5.5 7.5a9 9 0 0113 0M2.5 4.5a13 13 0 0119 0M12 16a1 1 0 100-2 1 1 0 000 2z" stroke="white" stroke-width="2" stroke-linecap="round" fill="none"/>`,
    serveur: `<rect x="4" y="2" width="16" height="6" rx="1" fill="none" stroke="white" stroke-width="2"/><rect x="4" y="9" width="16" height="6" rx="1" fill="none" stroke="white" stroke-width="2"/><rect x="4" y="16" width="16" height="6" rx="1" fill="none" stroke="white" stroke-width="2"/><circle cx="7" cy="5" r="1" fill="white"/><circle cx="7" cy="12" r="1" fill="white"/><circle cx="7" cy="19" r="1" fill="white"/>`,
    autre: `<rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke="white" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="white"/>`,
  };

  const iconPath = iconPaths[normalizedType] || iconPaths.autre;
  const borderColor = isMain ? '#fbbf24' : color;
  const borderWidth = isMain ? 4 : 2;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60">
      <circle cx="30" cy="30" r="27" fill="${color}" stroke="${borderColor}" stroke-width="${borderWidth}"/>
      <g transform="translate(18, 18) scale(1)">${iconPath}</g>
    </svg>
  `;

  return 'data:image/svg+xml;base64,' + btoa(svg);
};

const NetworkSchema = ({ mainEquipement, upstream, downstream }: NetworkSchemaProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<VisNetwork | null>(null);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [selectedEdge, setSelectedEdge] = useState<any>(null);

  const getNodeColor = (type: string) => {
    const normalizedType = type?.toLowerCase() || 'autre';
    return equipementTypeColors[normalizedType] || equipementTypeColors.autre;
  };

  const initNetwork = useCallback(() => {
    if (!containerRef.current || !mainEquipement) return;

    // Nettoyer le réseau précédent
    if (networkRef.current) {
      networkRef.current.destroy();
      networkRef.current = null;
    }

    // Créer les nœuds
    const nodes: any[] = [];
    const edges: any[] = [];
    const nodeMap = new Map<number, boolean>();

    // Nœud principal (équipement actuel) - au centre
    const mainColor = getNodeColor(mainEquipement.type);
    nodes.push({
      id: mainEquipement.id,
      label: mainEquipement.name,
      title: `${mainEquipement.equipement_code}\n${mainEquipement.type}\nIP: ${mainEquipement.ip_address || 'N/A'}`,
      image: generateEquipementIcon(mainEquipement.type, mainColor.background, true),
      shape: 'image',
      size: 30,
      font: {
        color: '#1f2937',
        size: 12,
        face: 'system-ui',
        bold: true,
        vadjust: 8,
      },
      shadow: {
        enabled: true,
        color: 'rgba(0,0,0,0.2)',
        size: 10,
        x: 2,
        y: 2,
      },
      data: { ...mainEquipement, isMain: true },
    });
    nodeMap.set(mainEquipement.id, true);

    // Nœuds upstream (vers la source)
    upstream.forEach((item, index) => {
      if (!nodeMap.has(item.equipement.id)) {
        const color = getNodeColor(item.equipement.type);
        nodes.push({
          id: item.equipement.id,
          label: item.equipement.name,
          title: `${item.equipement.equipement_code}\n${item.equipement.type}\nIP: ${item.equipement.ip_address || 'N/A'}${item.equipement.is_principal ? '\n⭐ Switch principal' : ''}`,
          image: generateEquipementIcon(item.equipement.type, color.background, item.equipement.is_principal),
          shape: 'image',
          size: 25,
          font: {
            color: '#374151',
            size: 11,
            face: 'system-ui',
            vadjust: 8,
          },
          shadow: {
            enabled: true,
            color: 'rgba(0,0,0,0.15)',
            size: 8,
            x: 2,
            y: 2,
          },
          data: { ...item.equipement, direction: 'upstream', liaison: item.liaison },
        });
        nodeMap.set(item.equipement.id, true);
      }

      // Créer l'edge (liaison) avec ports aux extrémités
      const fromId = index === 0 ? mainEquipement.id : upstream[index - 1]?.equipement.id;
      const toId = item.equipement.id;

      if (fromId && toId && item.liaison) {
        // Format: [PortSource] ─ média ─ [PortDest]
        const fromPort = item.from_port?.port_label || '';
        const toPort = item.to_port?.port_label || '';
        const media = item.liaison.media || '';

        // Label avec ports et média
        let edgeLabel = media;
        if (fromPort || toPort) {
          edgeLabel = `${fromPort ? '[' + fromPort + ']' : ''} ${media} ${toPort ? '[' + toPort + ']' : ''}`.trim();
        }

        edges.push({
          id: `edge-up-${index}`,
          from: toId,
          to: fromId,
          label: edgeLabel,
          title: `📍 Port source: ${fromPort || 'N/A'}\n📡 Média: ${media || 'N/A'}\n📍 Port dest: ${toPort || 'N/A'}\n📏 Longueur: ${item.liaison.length ? item.liaison.length + 'm' : 'N/A'}`,
          color: { color: '#22c55e', highlight: '#16a34a', hover: '#16a34a' },
          width: 2,
          dashes: [5, 5],
          arrows: { to: { enabled: true, scaleFactor: 0.7, type: 'arrow' } },
          smooth: { type: 'curvedCW', roundness: 0.15 },
          font: { color: '#059669', size: 9, align: 'horizontal', strokeWidth: 2, strokeColor: '#ffffff' },
          data: { ...item.liaison, fromPort: item.from_port, toPort: item.to_port, direction: 'upstream' },
        });
      }
    });

    // Nœuds downstream (vers la distribution)
    downstream.forEach((item, index) => {
      if (!nodeMap.has(item.equipement.id)) {
        const color = getNodeColor(item.equipement.type);
        nodes.push({
          id: item.equipement.id,
          label: item.equipement.name,
          title: `${item.equipement.equipement_code}\n${item.equipement.type}\nIP: ${item.equipement.ip_address || 'N/A'}`,
          image: generateEquipementIcon(item.equipement.type, color.background, false),
          shape: 'image',
          size: 25,
          font: {
            color: '#374151',
            size: 11,
            face: 'system-ui',
            vadjust: 8,
          },
          shadow: {
            enabled: true,
            color: 'rgba(0,0,0,0.15)',
            size: 8,
            x: 2,
            y: 2,
          },
          data: { ...item.equipement, direction: 'downstream', liaison: item.liaison },
        });
        nodeMap.set(item.equipement.id, true);
      }

      // Créer l'edge (liaison) avec ports aux extrémités
      if (item.liaison) {
        // Format: [PortSource] ─ média ─ [PortDest]
        const fromPort = item.from_port?.port_label || '';
        const toPort = item.to_port?.port_label || '';
        const media = item.liaison.media || '';

        // Label avec ports et média
        let edgeLabel = media;
        if (fromPort || toPort) {
          edgeLabel = `${fromPort ? '[' + fromPort + ']' : ''} ${media} ${toPort ? '[' + toPort + ']' : ''}`.trim();
        }

        edges.push({
          id: `edge-down-${index}`,
          from: mainEquipement.id,
          to: item.equipement.id,
          label: edgeLabel,
          title: `📍 Port source: ${fromPort || 'N/A'}\n📡 Média: ${media || 'N/A'}\n📍 Port dest: ${toPort || 'N/A'}\n📏 Longueur: ${item.liaison.length ? item.liaison.length + 'm' : 'N/A'}`,
          color: { color: '#3b82f6', highlight: '#2563eb', hover: '#2563eb' },
          width: 2,
          dashes: false,
          arrows: { to: { enabled: true, scaleFactor: 0.7, type: 'arrow' } },
          smooth: { type: 'curvedCCW', roundness: 0.15 },
          font: { color: '#2563eb', size: 9, align: 'horizontal', strokeWidth: 2, strokeColor: '#ffffff' },
          data: { ...item.liaison, fromPort: item.from_port, toPort: item.to_port, direction: 'downstream' },
        });
      }
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
          gravitationalConstant: -80,
          centralGravity: 0.008,
          springLength: 180,
          springConstant: 0.06,
          damping: 0.6,
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

  }, [mainEquipement, upstream, downstream]);

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

  const totalNodes = 1 + upstream.length + downstream.length;
  const totalEdges = upstream.length + downstream.length;

  return (
    <div className="space-y-4">
      {/* Contrôles et statistiques */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
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
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Équipements:</span>
            <Badge variant="secondary">{totalNodes}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Liens:</span>
            <Badge variant="secondary">{totalEdges}</Badge>
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
                      <Badge variant={getStatusBadgeVariant(selectedNode.status)} className="text-xs">
                        {getStatusLabel(selectedNode.status)}
                      </Badge>
                    </div>
                    {selectedNode.isMain && (
                      <div className="mt-2 pt-2 border-t">
                        <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 text-xs">
                          Équipement actuel
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              ) : selectedEdge ? (
                <div className="space-y-2">
                  <div className="font-semibold">Liaison</div>
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
                      <Badge variant="outline" className={`text-xs ${selectedEdge.direction === 'upstream' ? 'border-green-500 text-green-600' : 'border-blue-500 text-blue-600'}`}>
                        {selectedEdge.direction === 'upstream' ? '↑ Upstream' : '↓ Downstream'}
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
                    <line x1="0" y1="4" x2="24" y2="4" stroke="#22c55e" strokeWidth="2" strokeDasharray="4 3" />
                  </svg>
                  <span>Upstream</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg width="24" height="8" className="flex-shrink-0">
                    <line x1="0" y1="4" x2="24" y2="4" stroke="#3b82f6" strokeWidth="2" />
                  </svg>
                  <span>Downstream</span>
                </div>
              </div>
              <div className="border-t pt-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-yellow-400 bg-gray-400" />
                  <span>Équipement actuel</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

const DependencyTimeline = ({ mainEquipement, items, direction, emptyMessage, emptyIcon }: DependencyTimelineProps) => {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="mb-3 text-muted-foreground">
          {emptyIcon}
        </div>
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4">
      {direction === 'up' ? (
        // Pour upstream, afficher les items d'abord (du plus éloigné au plus proche)
        <>
          {[...items].reverse().map((item, index, arr) => (
            <EquipementCard
              key={`${direction}-${index}`}
              equipement={item.equipement}
              liaison={item.liaison}
              fromPort={item.from_port}
              toPort={item.to_port}
              isSource={index === 0}
              isEnd={false}
              direction={direction}
            />
          ))}
          {/* Équipement principal à la fin */}
          <EquipementCard
            equipement={mainEquipement}
            isEnd={true}
            direction={direction}
          />
        </>
      ) : (
        // Pour downstream, afficher l'équipement principal d'abord
        <>
          <EquipementCard
            equipement={mainEquipement}
            isSource={true}
            direction={direction}
          />
          {items.map((item, index, arr) => (
            <EquipementCard
              key={`${direction}-${index}`}
              equipement={item.equipement}
              liaison={item.liaison}
              fromPort={item.from_port}
              toPort={item.to_port}
              isEnd={index === arr.length - 1}
              direction={direction}
            />
          ))}
        </>
      )}
    </div>
  );
};

const DependencyChainSection = ({ equipementId, equipementName }: DependencyChainSectionProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chainData, setChainData] = useState<{
    equipement: any;
    upstream: DependencyChainItem[];
    downstream: DependencyChainItem[];
    upstream_count: number;
    downstream_count: number;
  } | null>(null);

  const loadDependencyChain = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await equipementService.getDependencyChain(equipementId);
      setChainData(data);
    } catch (err) {
      setError('Erreur lors du chargement de la chaîne de dépendance');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDependencyChain();
  }, [equipementId]);

  // Vérifier si l'équipement est une source (pas d'upstream)
  const isSourceEquipement = chainData?.upstream_count === 0;
  const totalConnections = (chainData?.upstream_count || 0) + (chainData?.downstream_count || 0);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Erreur</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={loadDependencyChain}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Réessayer
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              Chaîne de dépendance
              {isSourceEquipement && (
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 ml-2">
                  Source
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {isSourceEquipement
                ? `Cet équipement est une source réseau - ${chainData?.downstream_count || 0} équipement(s) connecté(s) en aval`
                : `${chainData?.upstream_count || 0} connexion(s) en amont, ${chainData?.downstream_count || 0} en aval`}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={loadDependencyChain}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="downstream" className="w-full">
          <TabsList className="inline-flex h-10 bg-secondary">
            <TabsTrigger value="upstream" className="flex items-center gap-1">
              <ArrowUp className="h-3 w-3" />
              Upstream ({chainData?.upstream_count || 0})
            </TabsTrigger>
            <TabsTrigger value="downstream" className="flex items-center gap-1">
              <ArrowDown className="h-3 w-3" />
              Downstream ({chainData?.downstream_count || 0})
            </TabsTrigger>
            <TabsTrigger value="schema">
              <Network className="h-3 w-3 mr-1" />
              Schéma
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upstream" className="mt-4">
            <div className="border rounded-lg p-4 bg-green-50/30 dark:bg-green-950/10">
              <div className="flex items-center gap-2 mb-4 text-sm font-medium text-green-700 dark:text-green-400">
                <ArrowUp className="h-4 w-4" />
                Vers la source (Upstream)
              </div>
              <DependencyTimeline
                mainEquipement={chainData?.equipement}
                items={chainData?.upstream || []}
                direction="up"
                emptyMessage="Cet équipement est au sommet de la chaîne réseau (source)"
                emptyIcon={<Star className="h-12 w-12 text-green-500" />}
              />
            </div>
          </TabsContent>

          <TabsContent value="downstream" className="mt-4">
            <div className="border rounded-lg p-4 bg-blue-50/30 dark:bg-blue-950/10">
              <div className="flex items-center gap-2 mb-4 text-sm font-medium text-blue-700 dark:text-blue-400">
                <ArrowDown className="h-4 w-4" />
                Vers la distribution (Downstream)
              </div>
              <DependencyTimeline
                mainEquipement={chainData?.equipement}
                items={chainData?.downstream || []}
                direction="down"
                emptyMessage="Aucun équipement connecté en aval (fin de chaîne)"
                emptyIcon={<Network className="h-12 w-12 text-blue-400" />}
              />
            </div>
          </TabsContent>

          <TabsContent value="schema" className="mt-4">
            <NetworkSchema
              mainEquipement={chainData?.equipement}
              upstream={chainData?.upstream || []}
              downstream={chainData?.downstream || []}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default DependencyChainSection;
