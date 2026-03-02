import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
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
import { dia, shapes, util } from "@joint/core";
import { networkIconPaths, networkIconColors } from "@/assets/icons/network-icons";

// Nœud réseau avec icône SVG intégrée
const NetworkNodeWithIcon = dia.Element.define('network.NodeWithIcon', {
  size: { width: 140, height: 90 },
  attrs: {
    body: {
      refWidth: '100%',
      refHeight: '100%',
      rx: 12,
      ry: 12,
      strokeWidth: 2,
      cursor: 'pointer',
    },
    iconBackground: {
      r: 22,
      refX: '50%',
      refY: '38%',
      fill: '#ffffff',
      stroke: 'none',
    },
    icon: {
      refX: '50%',
      refY: '38%',
      d: '',
      fill: '#6b7280',
      transform: 'translate(-12, -12) scale(1)',
    },
    label: {
      fontSize: 11,
      fontWeight: 600,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      textAnchor: 'middle',
      refX: '50%',
      refY: '78%',
      fill: '#1f2937',
    },
    statusBadge: {
      r: 8,
      refX: '90%',
      refY: '12%',
      stroke: '#ffffff',
      strokeWidth: 2,
    },
  },
}, {
  markup: util.svg`
    <rect @selector="body"/>
    <circle @selector="iconBackground"/>
    <path @selector="icon"/>
    <text @selector="label"/>
    <circle @selector="statusBadge"/>
  `,
});

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

const statusColors: Record<string, string> = {
  up: "#10b981",
  warn: "#f59e0b",
  down: "#ef4444",
  maintenance: "#64748b",
};

// Obtenir les couleurs et l'icône pour un type d'équipement
const getEquipmentStyle = (role: LanNode["role"], icon?: string) => {
  const type = icon || role;
  const colors = networkIconColors[type] || networkIconColors.default;
  const iconPath = networkIconPaths[type] || networkIconPaths.default;
  return { colors, iconPath };
};

// Calculer les positions automatiques en topologie hiérarchique (arbre)
const computeAutoLayoutPositions = (nodes: LanNode[], links: LanLink[]) => {
  const positions = new Map<string, { x: number; y: number }>();
  const centerX = 600;
  const startY = 80;
  const levelSpacing = 180;
  const nodeWidth = 200;

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
        setContainerReady(false);
        setShowNoLinksAlert(true);

        let response: LanTopology;

        if (filterMode === "all") {
          response = await cartographyService.getLanTopology();
        } else if (filterMode === "lan" && selectedTopologyId) {
          response = await cartographyService.getLanTopology(selectedTopologyId);
        } else if (filterMode === "salle" && selectedSalleId) {
          response = await cartographyService.getLanTopology(undefined, { salle_id: selectedSalleId });
        } else if (filterMode === "batiment" && selectedBatimentId) {
          response = await cartographyService.getLanTopology(undefined, { batiment_id: selectedBatimentId });
        } else {
          setTopology(null);
          setIsLoadingTopology(false);
          return;
        }

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

  // Initialisation de JointJS avec les nouveaux noeuds personnalisés
  useEffect(() => {
    if (!containerRef.current || !containerReady || !topology || isLoadingTopology) {
      return;
    }
    if (topology.nodes.length === 0) {
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

    // Créer le graphique
    const graph = new dia.Graph();
    graphRef.current = graph;

    // Créer le papier avec les dimensions du container
    const paper = new dia.Paper({
      el: container,
      model: graph,
      width: container.clientWidth || 1400,
      height: container.clientHeight || 800,
      gridSize: 10,
      drawGrid: true,
      background: {
        color: "#f8fafc",
      },
      async: true,
      sorting: dia.Paper.sorting.APPROX,
    });
    paperRef.current = paper;

    // Pan et zoom
    let isPanning = false;
    let lastPanPoint: { x: number; y: number } | null = null;
    let spacePressed = false;

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
      container.style.cursor = spacePressed ? 'grab' : 'default';
    };

    const handleWheel = (evt: WheelEvent) => {
      if (evt.ctrlKey || evt.metaKey) {
        evt.preventDefault();
        const delta = evt.deltaY > 0 ? 0.9 : 1.1;
        const currentScale = paper.scale();
        const newScale = Math.max(0.1, Math.min(3, currentScale.sx * delta));
        paper.scale(newScale, newScale);
      }
    };

    window.addEventListener('keydown', handlePanKeyDown);
    window.addEventListener('keyup', handlePanKeyUp);
    container.addEventListener('mousedown', handlePanStart);
    container.addEventListener('mousemove', handlePanMove);
    container.addEventListener('mouseup', handlePanEnd);
    container.addEventListener('mouseleave', handlePanEnd);
    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('contextmenu', (e) => e.preventDefault());

    // Calculer les positions
    const layoutPositions = computeAutoLayoutPositions(topology.nodes, topology.links);

    // Map pour associer nos IDs aux éléments JointJS
    const nodeMap = new Map<string, dia.Element>();

    // Créer les éléments pour chaque nœud avec icône SVG
    topology.nodes.forEach((nodeData) => {
      const position = layoutPositions.get(nodeData.id) || { x: 100, y: 100 };
      const { colors, iconPath } = getEquipmentStyle(nodeData.role, nodeData.icon);
      const statusColor = statusColors[nodeData.status] || statusColors.down;
      const truncatedName = nodeData.name.length > 16 ? nodeData.name.substring(0, 16) + '...' : nodeData.name;

      // Créer le nœud avec icône intégrée
      const nodeElement = new NetworkNodeWithIcon({
        position: { x: position.x, y: position.y },
        size: { width: 140, height: 90 },
        attrs: {
          body: {
            fill: colors.bg,
            stroke: colors.border,
            filter: 'drop-shadow(0 3px 6px rgba(0, 0, 0, 0.15))',
          },
          iconBackground: {
            fill: '#ffffff',
            opacity: 0.9,
          },
          icon: {
            d: iconPath,
            fill: colors.icon,
          },
          label: {
            text: truncatedName,
          },
          statusBadge: {
            fill: statusColor,
          },
        },
      });

      // Stocker les données du nœud
      (nodeElement as any).nodeData = nodeData;

      graph.addCell(nodeElement);
      nodeMap.set(nodeData.id, nodeElement);
    });

    // Créer les liens
    topology.links.forEach((linkData, index) => {
      const sourceElement = nodeMap.get(linkData.from);
      const targetElement = nodeMap.get(linkData.to);

      if (!sourceElement || !targetElement) {
        return;
      }

      const strokeColor =
        linkData.status === "up"
          ? "#10b981"
          : linkData.status === "warn"
            ? "#f59e0b"
            : "#ef4444";
      const strokeWidth = linkData.type === "fiber" ? 4 : linkData.type === "copper" ? 3 : 2;
      const strokeDasharray = linkData.type === "wireless" ? "8 4" : undefined;

      const labels: any[] = [];

      if (linkData.fromPort) {
        labels.push({
          position: { distance: 0.15, offset: { x: 0, y: -12 } },
          attrs: {
            text: {
              text: linkData.fromPort,
              fill: "#1f2937",
              fontSize: 9,
              fontWeight: "bold",
              fontFamily: "ui-monospace, monospace",
            },
            rect: {
              fill: "#ffffff",
              stroke: "#d1d5db",
              strokeWidth: 1,
              rx: 3,
              ry: 3,
            },
          },
        });
      }

      if (linkData.toPort) {
        labels.push({
          position: { distance: 0.85, offset: { x: 0, y: -12 } },
          attrs: {
            text: {
              text: linkData.toPort,
              fill: "#1f2937",
              fontSize: 9,
              fontWeight: "bold",
              fontFamily: "ui-monospace, monospace",
            },
            rect: {
              fill: "#ffffff",
              stroke: "#d1d5db",
              strokeWidth: 1,
              rx: 3,
              ry: 3,
            },
          },
        });
      }

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
          args: { padding: 20 },
        },
        connector: {
          name: "rounded",
          args: { radius: 10 },
        },
      });

      (link as any).linkData = linkData;
      graph.addCell(link);
    });

    // Événements du Paper
    paper.on('element:pointerclick', (elementView: dia.ElementView) => {
      const element = elementView.model;
      const nodeData = (element as any).nodeData;

      if (!nodeData) return;

      setSelectedLink(null);
      setSelectedNode(nodeData);
    });

    paper.on('link:pointerclick', (linkView: dia.LinkView) => {
      const link = linkView.model;
      const linkData = (link as any).linkData;

      if (linkData) {
        setSelectedNode(null);
        setSelectedLink(linkData);
      }
    });

    paper.on('link:contextmenu', (linkView: dia.LinkView, evt: dia.Event) => {
      evt.preventDefault();
      if (confirm("Voulez-vous supprimer ce lien ?")) {
        linkView.model.remove();
      }
    });

    // Ajuster la vue et centrer le contenu
    const centerContent = () => {
      // Obtenir la bounding box du contenu
      const contentBBox = graph.getBBox();
      if (!contentBBox) return;

      // Obtenir les dimensions du container
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      // Calculer l'échelle optimale
      const scaleX = (containerWidth - 80) / contentBBox.width;
      const scaleY = (containerHeight - 80) / contentBBox.height;
      const scale = Math.max(0.4, Math.min(1.2, Math.min(scaleX, scaleY)));

      // Appliquer l'échelle
      paper.scale(scale, scale);

      // Calculer la translation pour centrer
      const scaledContentWidth = contentBBox.width * scale;
      const scaledContentHeight = contentBBox.height * scale;

      const tx = (containerWidth - scaledContentWidth) / 2 - contentBBox.x * scale;
      const ty = (containerHeight - scaledContentHeight) / 2 - contentBBox.y * scale;

      paper.translate(tx, ty);
    };

    // Centrer après un court délai pour s'assurer que le rendu est complet
    setTimeout(centerContent, 100);

    return () => {
      window.removeEventListener('keydown', handlePanKeyDown);
      window.removeEventListener('keyup', handlePanKeyUp);
      container.removeEventListener('mousedown', handlePanStart);
      container.removeEventListener('mousemove', handlePanMove);
      container.removeEventListener('mouseup', handlePanEnd);
      container.removeEventListener('mouseleave', handlePanEnd);
      container.removeEventListener('wheel', handleWheel);

      if (paperRef.current) {
        paperRef.current.remove();
        paperRef.current = null;
      }
      if (graphRef.current) {
        graphRef.current.clear();
        graphRef.current = null;
      }
    };
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
          "ID;Nom;Rôle;Statut;Site;IP;Modèle",
          ...topology.nodes.map((node) => {
            return [
              node.id,
              node.name,
              node.role,
              node.status,
              node.site,
              node.ip,
              node.model,
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
          }
          doc.text(row, 40, y);
          y += 14;
        });
        if (rows.length) y += 12;
      };

      const nodeRows = topology.nodes.map((node) => {
        return `${node.name} (${node.role}) — IP ${node.ip} — ${node.site}`;
      });
      addSection("Équipements", nodeRows);

      const linkRows = topology.links.map((link) => {
        const fromName = topology.nodes.find((n) => n.id === link.from)?.name ?? link.from;
        const toName = topology.nodes.find((n) => n.id === link.to)?.name ?? link.to;
        return `${fromName} (${link.fromPort ?? "?"}) → ${toName} (${link.toPort ?? "?"}) — ${link.type} ${link.bandwidth}`;
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
            Visualisation interactive des équipements et de leurs interconnexions réseau
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
            variant="outline"
            size="icon"
            title="Recentrer"
            onClick={() => {
              if (paperRef.current && graphRef.current && containerRef.current) {
                const cells = graphRef.current.getCells();
                if (cells.length > 0) {
                  const graph = graphRef.current;
                  const paper = paperRef.current;
                  const container = containerRef.current;

                  // Obtenir la bounding box du contenu
                  const contentBBox = graph.getBBox();
                  if (!contentBBox) return;

                  // Obtenir les dimensions du container
                  const containerWidth = container.clientWidth;
                  const containerHeight = container.clientHeight;

                  // Calculer l'échelle optimale
                  const scaleX = (containerWidth - 80) / contentBBox.width;
                  const scaleY = (containerHeight - 80) / contentBBox.height;
                  const scale = Math.max(0.4, Math.min(1.2, Math.min(scaleX, scaleY)));

                  // Appliquer l'échelle
                  paper.scale(scale, scale);

                  // Calculer la translation pour centrer
                  const scaledContentWidth = contentBBox.width * scale;
                  const scaledContentHeight = contentBBox.height * scale;

                  const tx = (containerWidth - scaledContentWidth) / 2 - contentBBox.x * scale;
                  const ty = (containerHeight - scaledContentHeight) / 2 - contentBBox.y * scale;

                  paper.translate(tx, ty);
                }
              }
            }}
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => exportTopology("csv")}>
            <FileSpreadsheet className="h-4 w-4" />
            CSV
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => exportTopology("pdf")}>
            <FileDown className="h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{topology?.name || 'Chargement...'}</CardTitle>
            <CardDescription className="text-sm">
              {topology?.description || ''}
              {topology?.subnet && ` — ${topology.subnet}`}
              {topology?.vlan && ` (VLAN ${topology.vlan})`}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col justify-center overflow-auto p-4">
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
                    height: "800px",
                    minHeight: "600px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                    backgroundColor: "#f9fafb",
                    position: "relative",
                    overflow: "hidden",
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
          <TabsTrigger value="actions">Contrôles</TabsTrigger>
        </TabsList>
        <TabsContent value="legend" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <p className="font-semibold mb-3 text-sm">Types d'équipements</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: "#3b82f6" }}></div>
                      <span>Router / Core</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: "#8b5cf6" }}></div>
                      <span>Switch / Distribution</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: "#10b981" }}></div>
                      <span>Access Point</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: "#64748b" }}></div>
                      <span>Server / Endpoint</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: "#ef4444" }}></div>
                      <span>Firewall</span>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="font-semibold mb-3 text-sm">Statuts</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#10b981" }}></div>
                      <span>En ligne (up)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#f59e0b" }}></div>
                      <span>Instable (warn)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#ef4444" }}></div>
                      <span>Hors ligne (down)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#64748b" }}></div>
                      <span>Maintenance</span>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="font-semibold mb-3 text-sm">Types de liaison</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-1 rounded" style={{ backgroundColor: "#10b981" }}></div>
                      <span>Fibre (épais)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-0.5 rounded" style={{ backgroundColor: "#10b981" }}></div>
                      <span>Cuivre (moyen)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 border-t-2 border-dashed" style={{ borderColor: "#10b981" }}></div>
                      <span>Sans-fil (pointillé)</span>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="font-semibold mb-3 text-sm">Éléments visuels</p>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>• Points de connexion aux 4 coins</p>
                    <p>• Badge de statut en haut à droite</p>
                    <p>• Nom de l'équipement en bas</p>
                    <p>• Labels de ports sur les liaisons</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="actions" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div>
                  <p className="font-semibold mb-2">Navigation</p>
                  <ul className="text-muted-foreground space-y-1 list-disc list-inside">
                    <li><strong>Espace + clic gauche</strong> ou <strong>clic droit</strong> : Déplacer le diagramme</li>
                    <li><strong>Ctrl/Cmd + molette</strong> : Zoomer</li>
                    <li><strong>Clic</strong> sur un nœud : Voir les détails</li>
                    <li><strong>Clic</strong> sur une liaison : Voir les informations</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold mb-2">Interaction</p>
                  <ul className="text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Glisser-déposer pour déplacer les nœuds</li>
                    <li>Les liaisons suivent automatiquement</li>
                    <li>Clic droit sur une liaison pour la supprimer</li>
                    <li>Bouton Recadrer pour ajuster la vue</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedLink} onOpenChange={(open) => !open && setSelectedLink(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Informations de la liaison</DialogTitle>
            <DialogDescription>Détails de la connexion entre les équipements</DialogDescription>
          </DialogHeader>
          {selectedLink && topology && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-muted-foreground">Origine</div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      {topology.nodes.find((n) => n.id === selectedLink.from)?.name || selectedLink.from}
                    </span>
                    {selectedLink.fromPort && (
                      <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded font-mono">
                        {selectedLink.fromPort}
                      </span>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-muted-foreground">Destination</div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      {topology.nodes.find((n) => n.id === selectedLink.to)?.name || selectedLink.to}
                    </span>
                    {selectedLink.toPort && (
                      <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded font-mono">
                        {selectedLink.toPort}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t space-y-3">
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
                        ? "bg-green-100 text-green-800"
                        : selectedLink.status === "warn"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                    }`}
                  >
                    {selectedLink.status === "up" ? "Actif" : selectedLink.status === "warn" ? "Instable" : "Inactif"}
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
                  <span className="font-medium">Type</span>
                  <span className="capitalize">{selectedNode.icon || selectedNode.role}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Statut</span>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      selectedNode.status === "up"
                        ? "bg-green-100 text-green-800"
                        : selectedNode.status === "warn"
                          ? "bg-yellow-100 text-yellow-800"
                          : selectedNode.status === "down"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
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
                <div className="space-y-1 pt-4 border-t">
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
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
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
  const { isAuthenticated, isLoading } = useRequireAuth();

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
