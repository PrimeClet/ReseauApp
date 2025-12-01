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
import { RefreshCcw, FileDown, FileSpreadsheet, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { jsPDF } from "jspdf";
import lanTopologies from "@/data/lan_topologies.json";
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

const topologies: LanTopology[] = (lanTopologies.topologies as LanTopology[]) ?? [];

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

// Calculer les positions automatiques en étoile
const computeAutoLayoutPositions = (nodes: LanNode[]) => {
  const positions = new Map<string, { x: number; y: number }>();
  const baseY = 50;
  const rowSpacing = 150;
  const rowWidth = 800;
  const startX = 100;

  roleHierarchy.forEach((role, rowIndex) => {
    const group = nodes.filter((node) => node.role === role);
    if (!group.length) return;
    const step = rowWidth / (group.length + 1);
    group.forEach((node, idx) => {
      const x = startX + (idx + 1) * step;
      const y = baseY + rowIndex * rowSpacing;
      positions.set(node.id, { x, y });
    });
  });

  return positions;
};

const LanCartographyContent = () => {
  const [selectedTopologyId, setSelectedTopologyId] = useState(topologies[0]?.id || "");
  const [selectedLink, setSelectedLink] = useState<LanLink | null>(null);
  const [selectedNode, setSelectedNode] = useState<LanNode | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [sourceNodeId, setSourceNodeId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const graphRef = useRef<dia.Graph | null>(null);
  const paperRef = useRef<dia.Paper | null>(null);
  const handleKeyDownRef = useRef<((evt: KeyboardEvent) => void) | null>(null);

  const topology = useMemo(
    () => topologies.find((lan) => lan.id === selectedTopologyId) ?? topologies[0],
    [selectedTopologyId],
  );

  // Initialisation de JointJS
  useEffect(() => {
    if (!containerRef.current || !topology) return;

    const container = containerRef.current;
    
    // Créer le graphique avec le namespace incluant notre élément personnalisé
    const cellNamespace = { ...shapes, network: { Node: NetworkNode } };
    const graph = new dia.Graph({}, { cellNamespace });
    graphRef.current = graph;

    // Créer le papier avec une taille agrandie
    const paper = new dia.Paper({
      el: container,
      model: graph,
      width: 1400,
      height: 1200,
      gridSize: 10,
      drawGrid: true,
      background: {
        color: "#f9fafb",
      },
      cellViewNamespace: cellNamespace,
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
    const layoutPositions = computeAutoLayoutPositions(topology.nodes);

    // Créer les éléments pour chaque nœud
    const nodeMap = new Map<string, dia.Element>();
    
    topology.nodes.forEach((nodeData) => {
      const position = layoutPositions.get(nodeData.id) || { x: 100, y: 100 };
      const roleColor = roleColors[nodeData.role] || roleColors.endpoint;
      const statusColor = statusColors[nodeData.status] || statusColors.down;

      // Créer un élément rectangle personnalisé avec icône
      const rect = new NetworkNode({
        position: { x: position.x, y: position.y },
        size: { width: 160, height: 120 },
        attrs: {
          body: {
            fill: "#ffffff",
            stroke: roleColor,
            strokeWidth: 2,
            rx: 8,
            ry: 8,
          },
          icon: {
            ref: "body",
            refX: "50%",
            refY: 20,
            refX2: -24,
            refY2: -24,
            width: 48,
            height: 48,
            "xlink:href": nodeData.icon || "/placeholder.svg",
            preserveAspectRatio: "xMidYMid meet",
          },
          label: {
            text: nodeData.name,
            fill: "#1f2937",
            fontSize: 12,
            fontWeight: "bold",
            refY: 75,
            textAnchor: "middle",
            refX: "50%",
          },
          siteLabel: {
            text: nodeData.site,
            fill: "#6b7280",
            fontSize: 10,
            refY: 95,
            textAnchor: "middle",
            refX: "50%",
          },
          ipLabel: {
            text: nodeData.ip,
            fill: "#6b7280",
            fontSize: 9,
            fontFamily: "monospace",
            refY: 110,
            textAnchor: "middle",
            refX: "50%",
          },
          statusIndicator: {
            ref: "body",
            refX: "100%",
            refY: 0,
            refX2: -12,
            refY2: 4,
            r: 4,
            fill: statusColor,
            stroke: "#ffffff",
            strokeWidth: 1,
          },
        },
      });

      // Stocker les données du nœud
      (rect as any).nodeData = nodeData;
      rect.set("id", nodeData.id);

      graph.addCell(rect);
      nodeMap.set(nodeData.id, rect);
    });

    // Créer les liens
    topology.links.forEach((linkData) => {
      const sourceNode = nodeMap.get(linkData.from);
      const targetNode = nodeMap.get(linkData.to);

      if (!sourceNode || !targetNode) return;

      const strokeColor =
        linkData.status === "up"
          ? "#10b981"
          : linkData.status === "warn"
            ? "#f59e0b"
            : "#ef4444";
      const strokeWidth = linkData.type === "fiber" ? 3 : linkData.type === "copper" ? 2 : 1.5;
      const strokeDasharray = linkData.type === "wireless" ? "6 4" : undefined;

      const labels: any[] = [];
      
      // Ajouter le label du port source
      if (linkData.fromPort) {
        labels.push({
          position: {
            distance: 0.1,
            offset: -15,
          },
          attrs: {
            text: {
              text: linkData.fromPort,
              fill: "#1f2937",
              fontSize: 10,
              fontWeight: "bold",
              fontFamily: "monospace",
              textAnchor: "middle",
              textVerticalAnchor: "middle",
            },
            rect: {
              fill: "#ffffff",
              stroke: "#e5e7eb",
              strokeWidth: 1,
              rx: 3,
              ry: 3,
            },
          },
        });
      }

      // Ajouter le label du port cible
      if (linkData.toPort) {
        labels.push({
          position: {
            distance: 0.9,
            offset: -15,
          },
          attrs: {
            text: {
              text: linkData.toPort,
              fill: "#1f2937",
              fontSize: 10,
              fontWeight: "bold",
              fontFamily: "monospace",
              textAnchor: "middle",
              textVerticalAnchor: "middle",
            },
            rect: {
              fill: "#ffffff",
              stroke: "#e5e7eb",
              strokeWidth: 1,
              rx: 3,
              ry: 3,
            },
          },
        });
      }

      const link = new shapes.standard.Link({
        source: { id: sourceNode.id },
        target: { id: targetNode.id },
        labels: labels,
        attrs: {
          line: {
            stroke: strokeColor,
            strokeWidth: strokeWidth,
            strokeDasharray: strokeDasharray,
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

      // Stocker les données du lien
      (link as any).linkData = linkData;
      link.set("id", linkData.id);

      // Ajouter un événement de clic sur le lien
      link.on("pointerclick", () => {
        setSelectedLink(linkData);
      });

      graph.addCell(link);
    });

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

    // Ajouter les événements sur les nœuds
    nodeMap.forEach((node) => {
      const nodeView = paper.findViewByModel(node.id);
      if (nodeView) {
        nodeView.on("pointerclick", (evt: dia.Event) => {
          if (isEditMode) {
            handleNodeClick(nodeView, evt);
            return;
          }
          setSelectedLink(null);
          setSelectedNode((nodeView.model as any).nodeData ?? null);
        });
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

    // Gérer le clic droit pour supprimer un lien
    const handleLinkContextMenu = (evt: MouseEvent, link: dia.Link) => {
      evt.preventDefault();
      if (confirm("Voulez-vous supprimer ce lien ?")) {
        graph.removeCells([link]);
      }
    };

    // Ajouter les événements sur les liens pour le menu contextuel et la sélection
    graph.getLinks().forEach((link) => {
      const linkView = paper.findViewByModel(link.id);
      if (linkView) {
        linkView.on("contextmenu", (evt: dia.Event) => {
          handleLinkContextMenu(evt as any, link);
        });
        if (isEditMode) {
          linkView.on("pointerclick", () => {
            // Marquer le lien comme sélectionné visuellement
            link.attr("line/strokeWidth", (link.attr("line/strokeWidth") || 2) + 1);
          });
        }
      }
    });

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
  }, [topology, isEditMode, sourceNodeId]);

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
          <Select value={selectedTopologyId} onValueChange={setSelectedTopologyId}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Sélectionner un LAN" />
            </SelectTrigger>
            <SelectContent>
              {topologies.map((lan) => (
                <SelectItem key={lan.id} value={lan.id}>
                  {lan.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
            <CardTitle>{topology?.name}</CardTitle>
            <CardDescription>
              {topology?.description} — {topology?.subnet} ({topology?.vlan})
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center overflow-auto">
            <div
              ref={containerRef}
              style={{
                width: "100%",
                maxWidth: "1400px",
                margin: "0 auto",
                height: "1200px",
                minHeight: "1200px",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                backgroundColor: "#f9fafb",
                position: "relative",
                overflow: "auto",
              }}
            />
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
                  <span className="text-sm font-semibold text-muted-foreground">Type</span>
                  <span className="capitalize font-medium">{selectedLink.type}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-muted-foreground">VLAN</span>
                  <span className="font-medium">{selectedLink.vlan}</span>
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
