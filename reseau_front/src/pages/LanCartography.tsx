import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import AppShell from "@/components/layout/AppShell";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RefreshCcw, FileDown, FileSpreadsheet, Plus, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { jsPDF } from "jspdf";
import { cartographyService } from "@/services";
import { dia, shapes } from "@joint/core";

type LanNode = {
  id: string;
  name: string;
  role: "core" | "distribution" | "access" | "endpoint";
  status: "up" | "warn" | "down" | "maintenance";
  position: { x: number; y: number };
  site: string;
  ip: string;
  model: string;
  notes?: string;
  icon: string;
  ports?: Array<{
    id: string;
    label: string;
    device_name: string;
    vlan?: string;
    speed?: string;
    poe_enabled?: boolean;
  }>;
};

type LanLink = {
  id: string;
  from: string;
  to: string;
  type: "fiber" | "copper" | "wireless";
  vlan: string;
  status: "up" | "warn" | "down";
  bandwidth: string;
  fromPort?: string;
  toPort?: string;
};

type LanTopology = {
  id: string;
  name: string;
  subnet: string;
  vlan: string;
  description: string;
  nodes: LanNode[];
  links: LanLink[];
};

// Les topologies seront chargées depuis l'API

const statusColors: Record<string, string> = {
  up: "#10b981",
  warn: "#f59e0b",
  down: "#ef4444",
  maintenance: "#64748b",
};

const roleColors: Record<LanNode["role"], string> = {
  core: "#3b82f6",
  distribution: "#2563eb",
  access: "#10b981",
  endpoint: "#64748b",
};

const roleHierarchy: LanNode["role"][] = ["core", "distribution", "access", "endpoint"];

// Icônes SVG pour les différents types d'équipements (encodées en data URI)
const equipmentIcons: Record<string, string> = {
  // Router/Core
  router: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%233b82f6' stroke-width='2'%3E%3Crect x='2' y='6' width='20' height='12' rx='2'/%3E%3Cline x1='6' y1='10' x2='6' y2='14'/%3E%3Cline x1='10' y1='10' x2='10' y2='14'/%3E%3Cline x1='14' y1='10' x2='14' y2='14'/%3E%3Cline x1='18' y1='10' x2='18' y2='14'/%3E%3C/svg%3E",
  // Switch/Distribution
  switch: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%232563eb' stroke-width='2'%3E%3Crect x='2' y='4' width='20' height='16' rx='2'/%3E%3Cline x1='6' y1='8' x2='18' y2='8'/%3E%3Ccircle cx='6' cy='12' r='1.5' fill='%2310b981'/%3E%3Ccircle cx='10' cy='12' r='1.5' fill='%2310b981'/%3E%3Ccircle cx='14' cy='12' r='1.5' fill='%23f59e0b'/%3E%3Ccircle cx='18' cy='12' r='1.5' fill='%2310b981'/%3E%3Ccircle cx='6' cy='16' r='1.5' fill='%2310b981'/%3E%3Ccircle cx='10' cy='16' r='1.5' fill='%2364748b'/%3E%3Ccircle cx='14' cy='16' r='1.5' fill='%2310b981'/%3E%3Ccircle cx='18' cy='16' r='1.5' fill='%2310b981'/%3E%3C/svg%3E",
  // Access Point
  access: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2310b981' stroke-width='2'%3E%3Cpath d='M5 12.55a11 11 0 0 1 14.08 0'/%3E%3Cpath d='M1.42 9a16 16 0 0 1 21.16 0'/%3E%3Cpath d='M8.53 16.11a6 6 0 0 1 6.95 0'/%3E%3Ccircle cx='12' cy='20' r='1' fill='%2310b981'/%3E%3C/svg%3E",
  // Server/Endpoint
  server: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Crect x='2' y='2' width='20' height='8' rx='2'/%3E%3Crect x='2' y='14' width='20' height='8' rx='2'/%3E%3Ccircle cx='6' cy='6' r='1' fill='%2310b981'/%3E%3Ccircle cx='6' cy='18' r='1' fill='%2310b981'/%3E%3Cline x1='10' y1='6' x2='18' y2='6'/%3E%3Cline x1='10' y1='18' x2='18' y2='18'/%3E%3C/svg%3E",
  // Computer/Workstation
  computer: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Crect x='2' y='3' width='20' height='14' rx='2'/%3E%3Cline x1='8' y1='21' x2='16' y2='21'/%3E%3Cline x1='12' y1='17' x2='12' y2='21'/%3E%3C/svg%3E",
  // Firewall
  firewall: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23ef4444' stroke-width='2'%3E%3Cpath d='M12 2L3 7v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V7l-9-5z'/%3E%3Cline x1='9' y1='12' x2='15' y2='12'/%3E%3C/svg%3E",
  // Default network device
  default: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3Cline x1='2' y1='12' x2='22' y2='12'/%3E%3Cpath d='M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z'/%3E%3C/svg%3E",
};

// Mapper le rôle vers l'icône appropriée
const getIconForRole = (role: LanNode["role"], icon?: string): string => {
  if (icon && equipmentIcons[icon]) return equipmentIcons[icon];
  switch (role) {
    case "core": return equipmentIcons.router;
    case "distribution": return equipmentIcons.switch;
    case "access": return equipmentIcons.access;
    case "endpoint": return equipmentIcons.server;
    default: return equipmentIcons.default;
  }
};

// Créer un élément personnalisé avec icône
const NetworkNode = shapes.standard.Rectangle.define("network.Node", {
  attrs: {
    body: {},
    icon: {},
    label: {},
    siteLabel: {},
    ipLabel: {},
    statusIndicator: {},
  },
}, {
  markup: [
    {
      tagName: "rect",
      selector: "body",
    },
    {
      tagName: "image",
      selector: "icon",
    },
    {
      tagName: "text",
      selector: "label",
    },
    {
      tagName: "text",
      selector: "siteLabel",
    },
    {
      tagName: "text",
      selector: "ipLabel",
    },
    {
      tagName: "circle",
      selector: "statusIndicator",
    },
  ],
});

// Calculer les positions automatiques en topologie hiérarchique (arbre)
const computeAutoLayoutPositions = (nodes: LanNode[], links: LanLink[]) => {
  const positions = new Map<string, { x: number; y: number }>();
  const centerX = 600;
  const startY = 80;
  const levelSpacing = 180;
  const nodeWidth = 180;

  // Grouper par rôle avec ordre hiérarchique
  const coreNodes = nodes.filter((n) => n.role === "core");
  const distributionNodes = nodes.filter((n) => n.role === "distribution");
  const accessNodes = nodes.filter((n) => n.role === "access");
  const endpointNodes = nodes.filter((n) => n.role === "endpoint");

  // Fonction pour positionner un groupe de nœuds horizontalement centré
  const positionGroup = (group: LanNode[], y: number) => {
    if (!group.length) return;
    const totalWidth = group.length * nodeWidth;
    const startX = centerX - totalWidth / 2 + nodeWidth / 2;
    group.forEach((node, idx) => {
      positions.set(node.id, { x: startX + idx * nodeWidth, y });
    });
  };

  // Positionner chaque niveau
  let currentY = startY;

  // Core au centre en haut
  if (coreNodes.length > 0) {
    positionGroup(coreNodes, currentY);
    currentY += levelSpacing;
  }

  // Distribution
  if (distributionNodes.length > 0) {
    positionGroup(distributionNodes, currentY);
    currentY += levelSpacing;
  }

  // Access
  if (accessNodes.length > 0) {
    positionGroup(accessNodes, currentY);
    currentY += levelSpacing;
  }

  // Endpoints en bas
  if (endpointNodes.length > 0) {
    positionGroup(endpointNodes, currentY);
  }

  // Pour les nœuds sans position (fallback)
  nodes.forEach((node, idx) => {
    if (!positions.has(node.id)) {
      positions.set(node.id, { x: 100 + (idx % 5) * nodeWidth, y: startY + Math.floor(idx / 5) * levelSpacing });
    }
  });

  return positions;
};

const LanCartographyContent = () => {
  const [lans, setLans] = useState<LanTopology[]>([]);
  const [batiments, setBatiments] = useState<Array<{ id: number; nom: string }>>([]);
  const [salles, setSalles] = useState<Array<{ id: number; nom: string; batiment_id: number }>>([]);
  const [selectedBatimentId, setSelectedBatimentId] = useState<number | undefined>(undefined);
  const [selectedSalleId, setSelectedSalleId] = useState<number | undefined>(undefined);
  const [selectedTopologyId, setSelectedTopologyId] = useState<string>("");
  const [filterMode, setFilterMode] = useState<"all" | "lan" | "batiment" | "salle">("all");
  const [topology, setTopology] = useState<LanTopology | null>(null);
  const [isLoadingLans, setIsLoadingLans] = useState(true);
  const [isLoadingBatiments, setIsLoadingBatiments] = useState(false);
  const [isLoadingSalles, setIsLoadingSalles] = useState(false);
  const [isLoadingTopology, setIsLoadingTopology] = useState(false);
  const [selectedLink, setSelectedLink] = useState<LanLink | null>(null);
  const [selectedNode, setSelectedNode] = useState<LanNode | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [sourceNodeId, setSourceNodeId] = useState<string | null>(null);
  const [containerReady, setContainerReady] = useState(false);
  const [showNoLinksAlert, setShowNoLinksAlert] = useState(true);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const graphRef = useRef<dia.Graph | null>(null);
  const paperRef = useRef<dia.Paper | null>(null);
  const handleKeyDownRef = useRef<((evt: KeyboardEvent) => void) | null>(null);

  // Callback ref pour détecter quand le container est monté
  const setContainerRef = useCallback((node: HTMLDivElement | null) => {
    // Nettoyer l'ancien graphe si on reçoit un nouveau container
    if (node && node !== containerRef.current) {
      if (paperRef.current) {
        paperRef.current.remove();
        paperRef.current = null;
      }
      if (graphRef.current) {
        graphRef.current.clear();
        graphRef.current = null;
      }
    }
    containerRef.current = node;
    setContainerReady(!!node);
    console.log('Container ref updated:', !!node);
  }, []);

  // Charger la liste des LANs
  useEffect(() => {
    const loadLans = async () => {
      try {
        setIsLoadingLans(true);
        const lansList = await cartographyService.getLans();
        const topologiesList: LanTopology[] = lansList.map((lan: any) => ({
          id: lan.id,
          name: lan.name,
          subnet: lan.subnet || '',
          vlan: lan.vlan || '',
          description: lan.description || '',
          nodes: [],
          links: [],
        }));
        setLans(topologiesList);
      } catch (error) {
        console.error('Erreur lors du chargement des LANs:', error);
      } finally {
        setIsLoadingLans(false);
      }
    };

    loadLans();
  }, []);

  // Charger la liste des bâtiments
  useEffect(() => {
    const loadBatiments = async () => {
      try {
        setIsLoadingBatiments(true);
        const batimentsList = await cartographyService.getBatiments();
        setBatiments(batimentsList);
      } catch (error) {
        console.error('Erreur lors du chargement des bâtiments:', error);
      } finally {
        setIsLoadingBatiments(false);
      }
    };

    loadBatiments();
  }, []);

  // Charger la liste des salles selon le bâtiment sélectionné
  useEffect(() => {
    const loadSalles = async () => {
      try {
        setIsLoadingSalles(true);
        const sallesList = await cartographyService.getSalles(selectedBatimentId);
        setSalles(sallesList);
        // Réinitialiser la salle sélectionnée si elle n'appartient plus au bâtiment
        if (selectedSalleId && !sallesList.find(s => s.id === selectedSalleId)) {
          setSelectedSalleId(undefined);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des salles:', error);
      } finally {
        setIsLoadingSalles(false);
      }
    };

    loadSalles();
  }, [selectedBatimentId]);

  // Charger la topologie selon le mode de filtrage
  useEffect(() => {
    const loadTopology = async () => {
      try {
        setIsLoadingTopology(true);
        // Reset containerReady pour forcer le re-mount du container
        setContainerReady(false);
        // Reset l'alerte pour qu'elle s'affiche à nouveau si nécessaire
        setShowNoLinksAlert(true);

        let response: LanTopology;

        if (filterMode === "all") {
          // Charger toute la topologie sans filtre
          response = await cartographyService.getLanTopology();
        } else if (filterMode === "lan" && selectedTopologyId) {
          response = await cartographyService.getLanTopology(selectedTopologyId);
        } else if (filterMode === "salle" && selectedSalleId) {
          response = await cartographyService.getLanTopology(undefined, { salle_id: selectedSalleId });
        } else if (filterMode === "batiment" && selectedBatimentId) {
          response = await cartographyService.getLanTopology(undefined, { batiment_id: selectedBatimentId });
        } else {
          // Réinitialiser la topologie si les conditions ne sont pas remplies
          setTopology(null);
          setIsLoadingTopology(false);
          return;
        }

        console.log('Topologie chargée:', response.nodes.length, 'nodes,', response.links.length, 'links');
        setTopology(response);
      } catch (error) {
        console.error('Erreur lors du chargement de la topologie:', error);
        setTopology(null);
      } finally {
        setIsLoadingTopology(false);
      }
    };

    loadTopology();
  }, [filterMode, selectedTopologyId, selectedBatimentId, selectedSalleId]);

  // Initialisation de JointJS
  useEffect(() => {
    console.log('JointJS useEffect triggered:', {
      containerRef: !!containerRef.current,
      containerReady,
      topology: topology ? `${topology.nodes.length} nodes` : 'null',
      isLoadingTopology
    });

    if (!containerRef.current || !containerReady || !topology || isLoadingTopology) {
      console.log('JointJS: Conditions not met, skipping initialization');
      return;
    }
    if (topology.nodes.length === 0) {
      console.log('JointJS: No nodes, skipping initialization');
      return;
    }

    const container = containerRef.current;

    // Nettoyer complètement avant de recréer
    if (paperRef.current) {
      paperRef.current.remove();
      paperRef.current = null;
    }
    if (graphRef.current) {
      graphRef.current.clear();
      graphRef.current = null;
    }
    container.innerHTML = '';

    console.log('JointJS: Initialisation avec', topology.nodes.length, 'nodes et', topology.links.length, 'links');

    // Créer le graphique - utiliser shapes standard sans namespace personnalisé
    const graph = new dia.Graph();
    graphRef.current = graph;

    // Créer le papier
    const paper = new dia.Paper({
      el: container,
      model: graph,
      width: 1400,
      height: 900,
      gridSize: 10,
      drawGrid: true,
      background: {
        color: "#f8fafc",
      },
      async: true, // Améliore les performances
      sorting: dia.Paper.sorting.APPROX,
    });
    paperRef.current = paper;

    // Implémenter le pan (déplacement du diagramme)
    let isPanning = false;
    let lastPanPoint: { x: number; y: number } | null = null;
    let spacePressed = false;

    // Détecter si la touche Espace est enfoncée
    const handlePanKeyDown = (evt: KeyboardEvent) => {
      if (evt.code === 'Space') {
        spacePressed = true;
        container.style.cursor = 'grab';
      }
    };

    const handlePanKeyUp = (evt: KeyboardEvent) => {
      if (evt.code === 'Space') {
        spacePressed = false;
        isPanning = false;
        container.style.cursor = 'default';
      }
    };

    const handlePanStart = (evt: MouseEvent) => {
      // Démarrer le pan avec clic droit, molette, ou clic gauche + Espace
      if (evt.button === 2 || evt.button === 1 || (evt.button === 0 && spacePressed)) {
        isPanning = true;
        lastPanPoint = { x: evt.clientX, y: evt.clientY };
        container.style.cursor = 'grabbing';
        evt.preventDefault();
      }
    };

    const handlePanMove = (evt: MouseEvent) => {
      if (isPanning && lastPanPoint) {
        const dx = evt.clientX - lastPanPoint.x;
        const dy = evt.clientY - lastPanPoint.y;
        const currentTranslate = paper.translate();
        paper.translate(currentTranslate.tx + dx, currentTranslate.ty + dy);
        lastPanPoint = { x: evt.clientX, y: evt.clientY };
        evt.preventDefault();
      }
    };

    const handlePanEnd = () => {
      isPanning = false;
      lastPanPoint = null;
      if (!spacePressed) {
        container.style.cursor = 'default';
      } else {
        container.style.cursor = 'grab';
      }
    };

    // Gérer le zoom avec la molette
    const handleWheel = (evt: WheelEvent) => {
      if (evt.ctrlKey || evt.metaKey) {
        evt.preventDefault();
        const delta = evt.deltaY > 0 ? 0.9 : 1.1;
        const currentScale = paper.scale();
        const newScale = Math.max(0.1, Math.min(3, currentScale.sx * delta));
        paper.scale(newScale, newScale);
      }
    };

    // Ajouter les événements
    window.addEventListener('keydown', handlePanKeyDown);
    window.addEventListener('keyup', handlePanKeyUp);
    container.addEventListener('mousedown', handlePanStart);
    container.addEventListener('mousemove', handlePanMove);
    container.addEventListener('mouseup', handlePanEnd);
    container.addEventListener('mouseleave', handlePanEnd);
    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('contextmenu', (e) => e.preventDefault()); // Désactiver le menu contextuel pour le clic droit

    // Calculer les positions
    const layoutPositions = computeAutoLayoutPositions(topology.nodes, topology.links);

    // Map pour associer nos IDs aux éléments JointJS
    const nodeMap = new Map<string, dia.Element>();

    // Créer les éléments pour chaque nœud avec icône
    topology.nodes.forEach((nodeData) => {
      const position = layoutPositions.get(nodeData.id) || { x: 100, y: 100 };
      const roleColor = roleColors[nodeData.role] || roleColors.endpoint;
      const statusColor = statusColors[nodeData.status] || statusColors.down;
      const iconUrl = getIconForRole(nodeData.role, nodeData.icon);

      // Créer un groupe avec icône et texte
      const nodeElement = new shapes.standard.Rectangle({
        position: { x: position.x, y: position.y },
        size: { width: 160, height: 90 },
        attrs: {
          body: {
            fill: "#ffffff",
            stroke: statusColor === statusColors.up ? roleColor : statusColor,
            strokeWidth: 3,
            rx: 10,
            ry: 10,
            cursor: "pointer",
          },
          label: {
            text: `${nodeData.name}`,
            fill: "#1f2937",
            fontSize: 12,
            fontWeight: "bold",
            textAnchor: "middle",
            refY: 55,
            refX: "50%",
          },
        },
      });

      // Stocker les données du nœud pour les événements
      (nodeElement as any).nodeData = nodeData;

      graph.addCell(nodeElement);
      nodeMap.set(nodeData.id, nodeElement);

      // Ajouter l'icône comme élément séparé positionné sur le noeud
      const iconElement = new shapes.standard.Image({
        position: { x: position.x + 56, y: position.y + 8 },
        size: { width: 48, height: 36 },
        attrs: {
          image: {
            xlinkHref: iconUrl,
            cursor: "pointer",
          },
          body: {
            fill: "transparent",
            stroke: "none",
          },
        },
      });
      (iconElement as any).nodeData = nodeData;
      (iconElement as any).parentNodeId = nodeData.id;
      graph.addCell(iconElement);

      // Ajouter le badge de statut
      const statusBadge = new shapes.standard.Circle({
        position: { x: position.x + 140, y: position.y + 5 },
        size: { width: 16, height: 16 },
        attrs: {
          body: {
            fill: statusColor,
            stroke: "#ffffff",
            strokeWidth: 2,
            cursor: "pointer",
          },
        },
      });
      (statusBadge as any).nodeData = nodeData;
      (statusBadge as any).parentNodeId = nodeData.id;
      graph.addCell(statusBadge);

      // Ajouter l'IP sous le nom
      const ipLabel = new shapes.standard.Rectangle({
        position: { x: position.x + 10, y: position.y + 68 },
        size: { width: 140, height: 18 },
        attrs: {
          body: {
            fill: "transparent",
            stroke: "none",
          },
          label: {
            text: nodeData.ip,
            fill: "#6b7280",
            fontSize: 10,
            fontFamily: "monospace",
            textAnchor: "middle",
            refX: "50%",
            refY: "50%",
            cursor: "pointer",
          },
        },
      });
      (ipLabel as any).nodeData = nodeData;
      (ipLabel as any).parentNodeId = nodeData.id;
      graph.addCell(ipLabel);

      console.log(`Node créé: ${nodeData.id} -> JointJS ID: ${nodeElement.id}`);
    });

    // Créer les liens
    console.log('JointJS: Création de', topology.links.length, 'liens');
    topology.links.forEach((linkData, index) => {
      const sourceElement = nodeMap.get(linkData.from);
      const targetElement = nodeMap.get(linkData.to);

      if (!sourceElement || !targetElement) {
        console.warn(`Lien ${index}: source=${linkData.from} ou target=${linkData.to} non trouvé dans nodeMap`);
        console.warn('NodeMap keys:', Array.from(nodeMap.keys()));
        return;
      }

      console.log(`Lien ${index}: ${linkData.from} -> ${linkData.to}`);

      const strokeColor =
        linkData.status === "up"
          ? "#10b981"
          : linkData.status === "warn"
            ? "#f59e0b"
            : "#ef4444";
      const strokeWidth = linkData.type === "fiber" ? 4 : linkData.type === "copper" ? 3 : 2;
      const strokeDasharray = linkData.type === "wireless" ? "6 4" : undefined;

      const labels: any[] = [];

      // Ajouter le label du port source
      if (linkData.fromPort) {
        labels.push({
          position: {
            distance: 0.15,
            offset: { x: 0, y: -12 },
          },
          attrs: {
            text: {
              text: linkData.fromPort,
              fill: "#1f2937",
              fontSize: 9,
              fontWeight: "bold",
              fontFamily: "monospace",
            },
            rect: {
              fill: "#ffffff",
              stroke: "#d1d5db",
              strokeWidth: 1,
              rx: 2,
              ry: 2,
            },
          },
        });
      }

      // Ajouter le label du port cible
      if (linkData.toPort) {
        labels.push({
          position: {
            distance: 0.85,
            offset: { x: 0, y: -12 },
          },
          attrs: {
            text: {
              text: linkData.toPort,
              fill: "#1f2937",
              fontSize: 9,
              fontWeight: "bold",
              fontFamily: "monospace",
            },
            rect: {
              fill: "#ffffff",
              stroke: "#d1d5db",
              strokeWidth: 1,
              rx: 2,
              ry: 2,
            },
          },
        });
      }

      // IMPORTANT: Utiliser les éléments JointJS directement comme source/target
      const link = new shapes.standard.Link({
        source: { id: sourceElement.id },
        target: { id: targetElement.id },
        labels: labels,
        attrs: {
          line: {
            stroke: strokeColor,
            strokeWidth: strokeWidth,
            strokeDasharray: strokeDasharray,
            strokeLinecap: "round",
            strokeLinejoin: "round",
            targetMarker: {
              type: 'path',
              d: 'M 10 -5 0 0 10 5 z',
              fill: strokeColor,
            },
            sourceMarker: null,
          },
        },
        router: {
          name: "manhattan",
          args: {
            padding: 20,
          },
        },
        connector: {
          name: "rounded",
          args: {
            radius: 10,
          },
        },
      });

      // Stocker les données du lien
      (link as any).linkData = linkData;

      graph.addCell(link);
    });

    console.log('JointJS: Graph contient', graph.getCells().length, 'cellules (nodes:', graph.getElements().length, ', links:', graph.getLinks().length, ')');

    // Gérer la création de liens en mode édition
    const handleNodeClick = (nodeView: dia.CellView, evt: dia.Event) => {
      if (!isEditMode) return;
      
      const nodeId = nodeView.model.id as string;
      
      if (!sourceNodeId) {
        // Sélectionner le nœud source
        setSourceNodeId(nodeId);
        nodeView.highlight();
      } else if (sourceNodeId !== nodeId) {
        // Créer un lien entre le nœud source et le nœud cible
        const sourceNode = nodeMap.get(sourceNodeId);
        const targetNode = nodeMap.get(nodeId);
        
        if (sourceNode && targetNode) {
          // Vérifier si le lien existe déjà
          const existingLink = graph.getLinks().find((link) => {
            const source = link.getSourceElement();
            const target = link.getTargetElement();
            return source?.id === sourceNodeId && target?.id === nodeId;
          });

          if (!existingLink) {
            // Créer un nouveau lien
            const newLinkData: LanLink = {
              id: `link-${Date.now()}`,
              from: sourceNodeId,
              to: nodeId,
              type: "copper",
              vlan: topology.vlan,
              status: "up",
              bandwidth: "1 Gbps",
            };

            const newLink = new shapes.standard.Link({
              source: { id: sourceNodeId },
              target: { id: nodeId },
              attrs: {
                line: {
                  stroke: "#10b981",
                  strokeWidth: 2,
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  connection: true,
                  targetMarker: null,
                  sourceMarker: null,
                },
              },
              router: {
                name: "orthogonal",
                args: {
                  padding: 10,
                },
              },
              connector: {
                name: "rounded",
              },
            });

            (newLink as any).linkData = newLinkData;
            newLink.set("id", newLinkData.id);

            newLink.on("pointerclick", () => {
              setSelectedLink(newLinkData);
            });

            graph.addCell(newLink);
          }
        }

        // Réinitialiser la sélection
        const sourceView = paper.findViewByModel(sourceNodeId);
        if (sourceView) {
          sourceView.unhighlight();
        }
        setSourceNodeId(null);
      } else {
        // Désélectionner si on clique sur le même nœud
        nodeView.unhighlight();
        setSourceNodeId(null);
      }
    };

    // Utiliser les événements du Paper (plus fiables que findViewByModel)
    paper.on('element:pointerclick', (elementView: dia.ElementView) => {
      const element = elementView.model;
      const nodeData = (element as any).nodeData;

      console.log('Element clicked:', element.id, 'nodeData:', nodeData?.name);

      if (!nodeData) return;

      if (isEditMode) {
        handleNodeClick(elementView, {} as dia.Event);
        return;
      }

      setSelectedLink(null);
      setSelectedNode(nodeData);
    });

    paper.on('link:pointerclick', (linkView: dia.LinkView) => {
      const link = linkView.model;
      const linkData = (link as any).linkData;

      console.log('Link clicked:', link.id, 'linkData:', linkData);

      if (linkData) {
        setSelectedNode(null);
        setSelectedLink(linkData);
      }
    });

    // Gérer le clic droit sur les liens
    paper.on('link:contextmenu', (linkView: dia.LinkView, evt: dia.Event) => {
      evt.preventDefault();
      if (confirm("Voulez-vous supprimer ce lien ?")) {
        linkView.model.remove();
      }
    });

    // Gérer la suppression de liens avec la touche Suppr
    handleKeyDownRef.current = (evt: KeyboardEvent) => {
      if ((evt.key === "Delete" || evt.key === "Backspace") && isEditMode) {
        const selectedLinks: dia.Link[] = [];
        if (graphRef.current) {
          graphRef.current.getLinks().forEach((link) => {
            if (paperRef.current) {
              const linkView = paperRef.current.findViewByModel(link.id);
              if (linkView && (linkView as any).isSelected?.()) {
                selectedLinks.push(link);
              }
            }
          });
          if (selectedLinks.length > 0) {
            graphRef.current.removeCells(selectedLinks);
          }
        }
      }
    };

    if (handleKeyDownRef.current) {
      window.addEventListener("keydown", handleKeyDownRef.current);
    }

    // Ajuster la vue pour voir tous les éléments
    paper.scaleContentToFit({ padding: 20, minScale: 0.5, maxScale: 1 });

    return () => {
      // Nettoyer les événements de pan
      window.removeEventListener('keydown', handlePanKeyDown);
      window.removeEventListener('keyup', handlePanKeyUp);
      container.removeEventListener('mousedown', handlePanStart);
      container.removeEventListener('mousemove', handlePanMove);
      container.removeEventListener('mouseup', handlePanEnd);
      container.removeEventListener('mouseleave', handlePanEnd);
      container.removeEventListener('wheel', handleWheel);
      
      if (handleKeyDownRef.current) {
        window.removeEventListener("keydown", handleKeyDownRef.current);
      }
      if (paperRef.current) {
        paperRef.current.remove();
        paperRef.current = null;
      }
      if (graphRef.current) {
        graphRef.current.clear();
        graphRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topology, isLoadingTopology, containerReady]);

  const exportTopology = useCallback(
    (format: "csv" | "pdf") => {
      if (!topology) return;

      if (format === "csv") {
        const csvLines: string[] = [
          `Nom;${topology.name}`,
          `Sous-réseau;${topology.subnet}`,
          `VLAN;${topology.vlan}`,
          "",
          "Équipements",
          "ID;Nom;Rôle;Statut;Site;IP;Modèle;Position X (%);Position Y (%)",
          ...topology.nodes.map((node) => {
            return [
              node.id,
              node.name,
              node.role,
              node.status,
              node.site,
              node.ip,
              node.model,
              node.position.x.toFixed(2),
              node.position.y.toFixed(2),
            ].join(";");
          }),
          "",
          "Liaisons",
          "ID;Origine;Destination;Type;Statut;Bande passante;VLAN;Port origine;Port destination",
          ...topology.links.map((link) =>
            [
              link.id,
              topology.nodes.find((n) => n.id === link.from)?.name ?? link.from,
              topology.nodes.find((n) => n.id === link.to)?.name ?? link.to,
              link.type,
              link.status,
              link.bandwidth,
              link.vlan,
              link.fromPort ?? "",
              link.toPort ?? "",
            ].join(";"),
          ),
        ];
        const blob = new Blob([csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `cartographie-${topology.id}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return;
      }

      const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
      doc.setFontSize(18);
      doc.text(`Cartographie LAN - ${topology.name}`, 40, 40);
      doc.setFontSize(12);
      doc.text(`Sous-réseau : ${topology.subnet}`, 40, 60);
      doc.text(`VLAN : ${topology.vlan}`, 40, 76);
      doc.text(`Description : ${topology.description}`, 40, 92);

      let y = 120;
      const pageHeight = doc.internal.pageSize.getHeight();
      const addSection = (title: string, rows: string[]) => {
        doc.setFontSize(14);
        doc.text(title, 40, y);
        y += 18;
        doc.setFontSize(11);
        rows.forEach((row) => {
          if (y > pageHeight - 40) {
            doc.addPage();
            y = 60;
            doc.setFontSize(14);
            doc.text(`${title} (suite)`, 40, y);
            y += 18;
            doc.setFontSize(11);
          }
          doc.text(row, 40, y);
          y += 14;
        });
        if (rows.length) {
          y += 12;
        }
      };

      const nodeRows = topology.nodes.map((node) => {
        return `${node.name} (${node.role}) — IP ${node.ip} — ${node.site} — Position ${node.position.x.toFixed(1)}% / ${node.position.y.toFixed(1)}%`;
      });
      addSection("Équipements", nodeRows);

      const linkRows = topology.links.map((link) => {
        const fromName = topology.nodes.find((n) => n.id === link.from)?.name ?? link.from;
        const toName = topology.nodes.find((n) => n.id === link.to)?.name ?? link.to;
        return `${link.id} : ${fromName} (${link.fromPort ?? "?"}) → ${toName} (${link.toPort ?? "?"}) — ${link.type} ${link.bandwidth} — VLAN ${link.vlan}`;
      });
      addSection("Liaisons", linkRows);

      doc.save(`cartographie-${topology.id}.pdf`);
    },
    [topology],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cartographie des LANs</h1>
          <p className="text-muted-foreground">
            Visualisation interactive des équipements et de leurs interconnexions réseau avec JointJS
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <Select value={filterMode} onValueChange={(value) => {
            setFilterMode(value as "all" | "lan" | "batiment" | "salle");
            setSelectedTopologyId("");
            setSelectedBatimentId(undefined);
            setSelectedSalleId(undefined);
          }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Mode de filtrage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tout le réseau</SelectItem>
              <SelectItem value="lan">Par LAN</SelectItem>
              <SelectItem value="batiment">Par Bâtiment</SelectItem>
              <SelectItem value="salle">Par Salle</SelectItem>
            </SelectContent>
          </Select>

          {filterMode === "lan" && (
            <Select value={selectedTopologyId} onValueChange={setSelectedTopologyId} disabled={isLoadingLans}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder={isLoadingLans ? "Chargement..." : "Sélectionner un LAN"} />
              </SelectTrigger>
              <SelectContent>
                {lans.map((lan) => (
                  <SelectItem key={lan.id} value={lan.id}>
                    {lan.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {filterMode === "batiment" && (
            <Select 
              value={selectedBatimentId?.toString()} 
              onValueChange={(value) => setSelectedBatimentId(value ? parseInt(value) : undefined)}
              disabled={isLoadingBatiments}
            >
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder={isLoadingBatiments ? "Chargement..." : "Sélectionner un bâtiment"} />
              </SelectTrigger>
              <SelectContent>
                {batiments.map((batiment) => (
                  <SelectItem key={batiment.id} value={batiment.id.toString()}>
                    {batiment.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {filterMode === "salle" && (
            <>
              <Select 
                value={selectedBatimentId?.toString()} 
                onValueChange={(value) => {
                  setSelectedBatimentId(value ? parseInt(value) : undefined);
                  setSelectedSalleId(undefined);
                }}
                disabled={isLoadingBatiments}
              >
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder={isLoadingBatiments ? "Chargement..." : "Sélectionner un bâtiment"} />
                </SelectTrigger>
                <SelectContent>
                  {batiments.map((batiment) => (
                    <SelectItem key={batiment.id} value={batiment.id.toString()}>
                      {batiment.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select 
                value={selectedSalleId?.toString()} 
                onValueChange={(value) => setSelectedSalleId(value ? parseInt(value) : undefined)}
                disabled={isLoadingSalles || !selectedBatimentId}
              >
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder={!selectedBatimentId ? "Sélectionnez d'abord un bâtiment" : isLoadingSalles ? "Chargement..." : "Sélectionner une salle"} />
                </SelectTrigger>
                <SelectContent>
                  {salles.map((salle) => (
                    <SelectItem key={salle.id} value={salle.id.toString()}>
                      {salle.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}
          <Button
            variant={isEditMode ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setIsEditMode(!isEditMode);
              setSourceNodeId(null);
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            {isEditMode ? "Mode édition" : "Mode visualisation"}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              if (paperRef.current && graphRef.current) {
                const cells = graphRef.current.getCells();
                if (cells.length > 0) {
                  paperRef.current.scaleContentToFit({ padding: 20, minScale: 0.5, maxScale: 1 });
                }
              }
            }}
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => exportTopology("csv")}>
            <FileSpreadsheet className="h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => exportTopology("pdf")}>
            <FileDown className="h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle>{topology?.name || 'Chargement...'}</CardTitle>
            <CardDescription>
              {topology?.description || ''}
              {topology?.subnet && ` — ${topology.subnet}`}
              {topology?.vlan && ` (VLAN ${topology.vlan})`}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col justify-center overflow-auto">
            {isLoadingTopology ? (
              <div className="flex items-center justify-center h-[600px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Chargement de la topologie...</span>
              </div>
            ) : !topology ? (
              <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                <p className="text-lg font-medium">
                  {filterMode === "lan" && !selectedTopologyId
                    ? "Sélectionnez un LAN"
                    : filterMode === "batiment" && !selectedBatimentId
                      ? "Sélectionnez un bâtiment"
                      : filterMode === "salle" && !selectedBatimentId
                        ? "Sélectionnez un bâtiment puis une salle"
                        : filterMode === "salle" && selectedBatimentId && !selectedSalleId
                          ? "Sélectionnez une salle"
                          : "Chargement..."}
                </p>
                <p className="text-sm mt-2">
                  Utilisez les filtres ci-dessus pour afficher la cartographie
                </p>
              </div>
            ) : topology.nodes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                <p className="text-lg font-medium">Aucun équipement trouvé</p>
                <p className="text-sm mt-2">
                  {filterMode === "all"
                    ? "Aucun équipement dans la base de données"
                    : filterMode === "lan"
                      ? "Ce LAN ne contient pas d'équipements"
                      : filterMode === "batiment"
                        ? "Ce bâtiment ne contient pas d'équipements"
                        : "Cette salle ne contient pas d'équipements"}
                </p>
              </div>
            ) : (
              <>
                {topology.links.length === 0 && showNoLinksAlert && (
                  <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
                    <div className="bg-red-600 text-white px-6 py-4 rounded-lg shadow-lg flex items-start gap-4 max-w-md">
                      <div className="flex-1">
                        <p className="text-lg font-semibold flex items-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          Réseau indisponible
                        </p>
                        <p className="text-sm mt-1 text-red-100">
                          {topology.nodes.length} équipement(s) trouvé(s) mais aucune liaison configurée
                        </p>
                      </div>
                      <button
                        onClick={() => setShowNoLinksAlert(false)}
                        className="text-white hover:text-red-200 transition-colors p-1"
                        aria-label="Fermer"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
                <div
                  ref={setContainerRef}
                  key={`canvas-${topology.id || 'default'}-${topology.nodes.length}`}
                  style={{
                    width: "100%",
                    maxWidth: "1400px",
                    margin: "0 auto",
                    height: "900px",
                    minHeight: "600px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    backgroundColor: "#f9fafb",
                    position: "relative",
                    overflow: "auto",
                  }}
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="legend" className="w-full">
        <TabsList>
          <TabsTrigger value="legend">Légende</TabsTrigger>
          <TabsTrigger value="actions">Actions rapides</TabsTrigger>
        </TabsList>
        <TabsContent value="legend" className="mt-4">
          <Card>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 text-sm">
              <div>
                <p className="font-semibold">Rôles</p>
                <p className="text-muted-foreground">Core (Bleu), Distribution (Bleu foncé), Access (Vert), Endpoint (Gris)</p>
              </div>
              <div>
                <p className="font-semibold">Statuts</p>
                <p className="text-muted-foreground">Vert = up, Orange = instable, Rouge = down, Gris = maintenance</p>
              </div>
              <div>
                <p className="font-semibold">Types de lien</p>
                <p className="text-muted-foreground">Fibre (épais), Cuivre (moyen), Sans-fil (pointillé)</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="actions" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-2">
                <strong>Contrôles JointJS :</strong>
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Glisser-déposer : Déplacer les nœuds en cliquant dessus et en les déplaçant</li>
                <li>Déplacer le diagramme : Maintenir la touche <strong>Espace</strong> + clic gauche, ou utiliser le clic droit ou la molette pour déplacer tout le diagramme</li>
                <li>Zoom : Maintenir <strong>Ctrl</strong> (ou <strong>Cmd</strong> sur Mac) + molette de la souris pour zoomer</li>
                <li>Connexions : Les connexions sont automatiquement mises à jour lors du déplacement des nœuds</li>
                <li>Cliquer sur un lien : Afficher les détails de la connexion</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedLink} onOpenChange={(open) => !open && setSelectedLink(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Informations de la connexion</DialogTitle>
            <DialogDescription>Détails de la liaison entre les équipements</DialogDescription>
          </DialogHeader>
          {selectedLink && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-muted-foreground">Origine</div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      {topology.nodes.find((n) => n.id === selectedLink.from)?.name || selectedLink.from}
                    </span>
                    {selectedLink.fromPort && (
                      <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                        Port: {selectedLink.fromPort}
                      </span>
                    )}
                  </div>
                  {topology.nodes.find((n) => n.id === selectedLink.from)?.ip && (
                    <div className="text-sm text-muted-foreground font-mono">
                      {topology.nodes.find((n) => n.id === selectedLink.from)?.ip}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-muted-foreground">Destination</div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      {topology.nodes.find((n) => n.id === selectedLink.to)?.name || selectedLink.to}
                    </span>
                    {selectedLink.toPort && (
                      <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                        Port: {selectedLink.toPort}
                      </span>
                    )}
                  </div>
                  {topology.nodes.find((n) => n.id === selectedLink.to)?.ip && (
                    <div className="text-sm text-muted-foreground font-mono">
                      {topology.nodes.find((n) => n.id === selectedLink.to)?.ip}
                    </div>
                  )}
                </div>
              </div>
              <div className="pt-4 border-t space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-muted-foreground">Port origine</span>
                  <span className="font-medium font-mono">{selectedLink.fromPort || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-muted-foreground">Port destination</span>
                  <span className="font-medium font-mono">{selectedLink.toPort || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-muted-foreground">Type</span>
                  <span className="capitalize font-medium">{selectedLink.type}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-muted-foreground">VLAN</span>
                  <span className="font-medium">{selectedLink.vlan || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-muted-foreground">Bande passante</span>
                  <span className="font-medium">{selectedLink.bandwidth}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-muted-foreground">Statut</span>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      selectedLink.status === "up"
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : selectedLink.status === "warn"
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                    }`}
                  >
                    {selectedLink.status === "up" ? "Actif" : selectedLink.status === "warn" ? "Avertissement" : "Inactif"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={!!selectedNode} onOpenChange={(open) => !open && setSelectedNode(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Informations de l'équipement</DialogTitle>
            <DialogDescription>Détails du nœud sélectionné</DialogDescription>
          </DialogHeader>
          {selectedNode && (
            <div className="space-y-4 mt-4 text-sm">
              <div className="space-y-1">
                <p className="text-lg font-semibold">{selectedNode.name}</p>
                <p className="text-muted-foreground">{selectedNode.site}</p>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Rôle</span>
                  <span className="capitalize">{selectedNode.role}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Statut</span>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      selectedNode.status === "up"
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : selectedNode.status === "warn"
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                          : selectedNode.status === "down"
                            ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                    }`}
                  >
                    {selectedNode.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Adresse IP</span>
                  <span className="font-mono">{selectedNode.ip}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Modèle</span>
                  <span>{selectedNode.model}</span>
                </div>
              </div>
              {selectedNode.notes && (
                <div className="space-y-1">
                  <span className="font-medium">Notes</span>
                  <p className="text-muted-foreground">{selectedNode.notes}</p>
                </div>
              )}
              {selectedNode.ports && selectedNode.ports.length > 0 && (
                <div className="space-y-2 pt-4 border-t">
                  <span className="font-medium">Ports ({selectedNode.ports.length})</span>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {selectedNode.ports.map((port) => (
                      <div key={port.id} className="bg-muted/50 rounded-lg p-3 text-sm">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium font-mono">{port.label}</span>
                          {port.poe_enabled && (
                            <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-0.5 rounded">
                              PoE
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          {port.device_name && <div>Appareil: {port.device_name}</div>}
                          {port.vlan && <div>VLAN: {port.vlan}</div>}
                          {port.speed && <div>Vitesse: {port.speed}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const LanCartography = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AppShell>
      <LanCartographyContent />
    </AppShell>
  );
};

export default LanCartography;
