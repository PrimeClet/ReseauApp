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
import { RefreshCcw, FileDown, FileSpreadsheet, Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { jsPDF } from "jspdf";
import lanTopologies from "@/data/lan_topologies.json";
import { NodeEditor, ClassicPreset } from "rete";
import { ConnectionPlugin, Presets as ConnectionPresets } from "rete-connection-plugin";
import { ReactPlugin, Presets as ReactPresets, type ReactArea2D, type ClassicScheme } from "rete-react-plugin";
import { AreaPlugin, AreaExtensions } from "rete-area-plugin";

// Importer le composant Connection depuis Presets
const { Connection: ReteConnection } = ReactPresets.classic;

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

// Types pour rete.js - Utilisation de ClassicScheme
type Schemes = ClassicScheme;
type AreaExtra = ReactArea2D<ClassicScheme>;


// Composant React pour afficher un nœud réseau avec sockets visibles
function NetworkNodeComponent({ 
  data, 
  node, 
  emit 
}: { 
  data: LanNode;
  node: ClassicScheme['Node'];
  emit?: any;
}) {
  const statusColor = statusColors[data.status] || statusColors.down;
  const roleColor = roleColors[data.role] || roleColors.endpoint;
  const { Node: ReteNode } = ReactPresets.classic;

  return (
    <ReteNode
      data={node}
      emit={emit}
      styles={() => ({
        background: "white",
        border: `2px solid ${roleColor}`,
        borderRadius: "12px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        padding: "12px",
        minWidth: "140px",
      })}
    />
  );
}

const LanCartographyContent = () => {
  const [selectedTopologyId, setSelectedTopologyId] = useState(topologies[0]?.id || "");
  const [isEditMode, setIsEditMode] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<NodeEditor<Schemes> | null>(null);
  const areaRef = useRef<AreaPlugin<Schemes, AreaExtra> | null>(null);
  const connectionPluginRef = useRef<ConnectionPlugin<Schemes, AreaExtra> | null>(null);

  const topology = useMemo(
    () => topologies.find((lan) => lan.id === selectedTopologyId) ?? topologies[0],
    [selectedTopologyId],
  );

  // Initialisation de rete.js
  useEffect(() => {
    if (!containerRef.current || !topology) return;

    const initializeEditor = async () => {
      const container = containerRef.current;
      if (!container) return;

      // Créer le NodeEditor avec ClassicScheme
      const editor = new NodeEditor<Schemes>();
      editorRef.current = editor;

      // Créer les plugins
      const area = new AreaPlugin<Schemes, AreaExtra>(container);
      const connection = new ConnectionPlugin<Schemes, AreaExtra>();
      const render = new ReactPlugin<Schemes>();

      areaRef.current = area;
      connectionPluginRef.current = connection;

      // Ajouter les plugins à l'éditeur
      editor.use(area);
      area.use(connection);
      area.use(render);

      // Ajouter les presets pour les styles de connexion et de rendu
      connection.addPreset(ConnectionPresets.classic.setup());

      // Écouter les événements de création de connexion pour ajouter des données personnalisées
      editor.addPipe((context) => {
        if (context.type === "connectioncreated") {
          const conn = context.data as ClassicPreset.Connection<ClassicPreset.Node, ClassicPreset.Node>;
          // Créer des données de liaison par défaut pour les nouvelles connexions
          const sourceNode = editor.getNode(conn.source) as ClassicPreset.Node;
          const targetNode = editor.getNode(conn.target) as ClassicPreset.Node;
          if (sourceNode && targetNode) {
            const linkData: LanLink = {
              id: conn.id || `link-${Date.now()}`,
              from: sourceNode.id || "",
              to: targetNode.id || "",
              type: "copper",
              vlan: topology.vlan,
              status: "up",
              bandwidth: "1 Gbps",
            };
            (conn as any).linkData = linkData;
          }
        }
        return context;
      });
      
      // Configurer le preset React avec personnalisation des connexions uniquement
      // Les nœuds utiliseront le rendu par défaut de rete.js avec les sockets visibles
      const reactPreset = ReactPresets.classic.setup<Schemes, AreaExtra>({
        customize: {
          node: (data) => {
            const node = data.payload;
            const nodeData = (node as any).nodeData as LanNode | undefined;
            if (nodeData) {
              return (props: { data: ClassicScheme['Node']; emit: any }) => {
                const { Node: ReteNode } = ReactPresets.classic;
                const roleColor = roleColors[nodeData.role] || roleColors.endpoint;
                
                // Utiliser le composant Node de rete.js qui affiche automatiquement les sockets et controls
                // Le contenu personnalisé sera affiché via un control
                return (
                  <ReteNode
                    data={props.data}
                    emit={props.emit}
                    styles={() => ({
                      background: "white",
                      border: `2px solid ${roleColor}`,
                      borderRadius: "12px",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                      padding: "12px",
                      minWidth: "140px",
                    })}
                  />
                );
              };
            }
            return null;
          },
          connection: (data) => {
            const conn = data.payload;
            const linkData = (conn as any).linkData as LanLink | undefined;
            if (linkData) {
              // Retourner un composant personnalisé qui utilise le composant Connection de rete-react-plugin avec des styles personnalisés
              return (props: { data: ClassicScheme['Connection'] }) => {
                const { Connection } = ReactPresets.classic;
                const [isHovered, setIsHovered] = useState(false);
                const strokeWidth = linkData.type === "fiber" ? 3 : linkData.type === "copper" ? 2 : 1.5;
                const strokeColor =
                  linkData.status === "up"
                    ? "#10b981"
                    : linkData.status === "warn"
                      ? "#f59e0b"
                      : "#ef4444";
                const strokeDasharray = linkData.type === "wireless" ? "6 4" : undefined;

                const customStyles = () => ({
                  stroke: strokeColor,
                  strokeWidth: strokeWidth,
                  strokeDasharray: strokeDasharray,
                });

                // Récupérer les informations des nœuds source et destination depuis linkData
                const sourceNodeData = topology.nodes.find(n => n.id === linkData.from);
                const targetNodeData = topology.nodes.find(n => n.id === linkData.to);

                return (
                  <>
                    <div
                      style={{ cursor: "pointer" }}
                      onMouseEnter={() => setIsHovered(true)}
                      onMouseLeave={() => setIsHovered(false)}
                    >
                      <Connection data={props.data} styles={customStyles} />
                    </div>
                    <Dialog open={isHovered} onOpenChange={setIsHovered}>
                      <DialogContent className="max-w-md" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
                        <DialogHeader>
                          <DialogTitle>Informations de la connexion</DialogTitle>
                          <DialogDescription>Détails de la liaison entre les équipements</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                          <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-2">
                              <div className="text-sm font-semibold text-muted-foreground">Origine</div>
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{sourceNodeData?.name || linkData.from}</span>
                                {linkData.fromPort && (
                                  <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                                    Port: {linkData.fromPort}
                                  </span>
                                )}
                              </div>
                              {sourceNodeData?.ip && (
                                <div className="text-sm text-muted-foreground font-mono">{sourceNodeData.ip}</div>
                              )}
                            </div>
                            <div className="space-y-2">
                              <div className="text-sm font-semibold text-muted-foreground">Destination</div>
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{targetNodeData?.name || linkData.to}</span>
                                {linkData.toPort && (
                                  <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                                    Port: {linkData.toPort}
                                  </span>
                                )}
                              </div>
                              {targetNodeData?.ip && (
                                <div className="text-sm text-muted-foreground font-mono">{targetNodeData.ip}</div>
                              )}
                            </div>
                          </div>
                          <div className="pt-4 border-t space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold text-muted-foreground">Type</span>
                              <span className="capitalize font-medium">{linkData.type}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold text-muted-foreground">VLAN</span>
                              <span className="font-medium">{linkData.vlan}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold text-muted-foreground">Bande passante</span>
                              <span className="font-medium">{linkData.bandwidth}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold text-muted-foreground">Statut</span>
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                  linkData.status === "up"
                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                    : linkData.status === "warn"
                                      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                }`}
                              >
                                {linkData.status === "up" ? "Actif" : linkData.status === "warn" ? "Avertissement" : "Inactif"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </>
                );
              };
            }
            return null;
          },
          socket: (data) => {
            // Personnaliser le rendu des sockets pour qu'ils soient bien visibles
            return (props: any) => {
              const { Socket } = ReactPresets.classic;
              return <Socket {...props} />;
            };
          },
          control: (data) => {
            // Personnaliser le rendu des controls pour afficher les icônes des équipements
            const control = data.payload;
            const nodeData = (control as any).nodeData as LanNode | undefined;
            
            // Si c'est notre contrôle personnalisé avec des données de nœud, afficher l'icône
            if (nodeData) {
              return (props: { data: ClassicPreset.Control }) => {
                const statusColor = statusColors[nodeData.status] || statusColors.down;
                return (
                  <div className="flex flex-col items-center gap-2">
                    <div className="relative">
                      <img
                        src={nodeData.icon}
                        alt={nodeData.name}
                        style={{
                          width: "56px",
                          height: "56px",
                          objectFit: "contain",
                        }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/placeholder.svg";
                        }}
                      />
                      <span
                        style={{
                          position: "absolute",
                          top: "-4px",
                          right: "-4px",
                          width: "12px",
                          height: "12px",
                          borderRadius: "50%",
                          backgroundColor: statusColor,
                          border: "2px solid white",
                        }}
                      />
                    </div>
                    <div className="text-center">
                      <p
                        style={{
                          fontSize: "13px",
                          fontWeight: "600",
                          margin: "4px 0 2px 0",
                        }}
                      >
                        {nodeData.name}
                      </p>
                      <p
                        style={{
                          fontSize: "10px",
                          color: "#6b7280",
                          margin: "2px 0",
                        }}
                      >
                        {nodeData.site}
                      </p>
                      <p
                        style={{
                          fontSize: "10px",
                          fontFamily: "monospace",
                          color: "#6b7280",
                          margin: "2px 0",
                        }}
                      >
                        {nodeData.ip}
                      </p>
                    </div>
                  </div>
                );
              };
            }
            // Sinon, utiliser le rendu par défaut des controls
            return null;
          },
        },
      });
      render.addPreset(reactPreset as any);

      // Créer un socket pour les connexions
      const socket = new ClassicPreset.Socket("socket");

      // Ajouter les nœuds à l'éditeur
      const nodeMap = new Map<string, ClassicPreset.Node>();

      for (const nodeData of topology.nodes) {
        const node = new ClassicPreset.Node(nodeData.name);
        node.id = nodeData.id;

        // Stocker les données du nœud dans un champ personnalisé
        (node as any).nodeData = nodeData;

        // Créer des sockets pour les connexions (visibles pour permettre les connexions)
        node.addInput(
          "input",
          new ClassicPreset.Input(socket, "In", true)
        );
        node.addOutput(
          "output",
          new ClassicPreset.Output(socket, "Out", true)
        );

        // Ajouter un contrôle personnalisé pour afficher le contenu du nœud (image, nom, IP)
        // Les sockets seront automatiquement visibles grâce au composant Node de rete.js
        const customControl = new ClassicPreset.Control();
        // Stocker les données du nœud dans le control pour le rendu personnalisé
        (customControl as any).nodeData = nodeData;
        node.addControl("content", customControl);

        // Ajouter le nœud à l'éditeur
        await editor.addNode(node);
        
        // Positionner le nœud
        await area.translate(node.id, {
          x: nodeData.position.x * 10,
          y: nodeData.position.y * 10,
        });

        nodeMap.set(nodeData.id, node);
      }

      // Ajouter les connexions
      for (const link of topology.links) {
        const fromNode = nodeMap.get(link.from);
        const toNode = nodeMap.get(link.to);

        if (fromNode && toNode) {
          const conn = new ClassicPreset.Connection(
            fromNode,
            "output",
            toNode,
            "input"
          );
          conn.id = link.id;

          // Stocker les données de la liaison dans la connexion pour le rendu personnalisé
          (conn as any).linkData = link;

          await editor.addConnection(conn);
        }
      }

      // Configurer le zoom et le pan
      await AreaExtensions.zoomAt(area, editor.getNodes());
    };

    initializeEditor();

    return () => {
      if (areaRef.current) {
        areaRef.current.destroy();
        areaRef.current = null;
      }
      if (editorRef.current) {
        editorRef.current.clear();
        editorRef.current = null;
      }
    };
  }, [topology]);

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
              Visualisation interactive des équipements et de leurs interconnexions réseau avec rete.js
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Button
              variant={isEditMode ? "default" : "outline"}
              size="sm"
              onClick={() => setIsEditMode(!isEditMode)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              {isEditMode ? "Mode édition" : "Mode visualisation"}
            </Button>
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
              variant="outline"
              size="icon"
              onClick={async () => {
                if (areaRef.current && editorRef.current) {
                  await AreaExtensions.zoomAt(areaRef.current, editorRef.current.getNodes());
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
            <CardContent>
              <div
                ref={containerRef}
                style={{
                  width: "100%",
                  height: "600px",
                  border: "1px dashed #e5e7eb",
                  borderRadius: "8px",
                  backgroundColor: "#f9fafb",
                  position: "relative",
                }}
              />
              <style>
                {`
                  /* Styles pour rendre les sockets visibles */
                  [data-socket] {
                    background: #3b82f6 !important;
                    border: 2px solid white !important;
                    width: 16px !important;
                    height: 16px !important;
                    border-radius: 50% !important;
                    cursor: pointer !important;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2) !important;
                    transition: all 0.2s ease !important;
                  }
                  [data-socket]:hover {
                    background: #2563eb !important;
                    transform: scale(1.2) !important;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.3) !important;
                  }
                  [data-socket-input] {
                    left: -8px !important;
                  }
                  [data-socket-output] {
                    right: -8px !important;
                  }
                `}
              </style>
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
                  <strong>Contrôles rete.js :</strong>
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Glisser-déposer : Déplacer les nœuds en cliquant dessus et en les déplaçant</li>
                  <li>Zoom : Utiliser la molette de la souris ou les contrôles de zoom</li>
                  <li>Pan : Cliquer et glisser sur l&apos;arrière-plan pour déplacer la vue</li>
                  <li>Connexions : Les connexions sont automatiquement mises à jour lors du déplacement des nœuds</li>
                  <li>Ajouter un lien : Activez le mode édition, puis cliquez sur une sortie (output) d&apos;un nœud et faites glisser vers une entrée (input) d&apos;un autre nœud</li>
                  <li>Supprimer un lien : En mode édition, cliquez sur une connexion pour la sélectionner, puis utilisez la touche Suppr ou le bouton de suppression</li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
    </div>
  );
};

const LanCartography = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

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
