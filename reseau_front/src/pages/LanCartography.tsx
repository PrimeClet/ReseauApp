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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RefreshCcw, FileDown, FileSpreadsheet } from "lucide-react";
import { jsPDF } from "jspdf";
import lanTopologies from "@/data/lan_topologies.json";

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
  up: "bg-emerald-500",
  warn: "bg-amber-500",
  down: "bg-red-500",
  maintenance: "bg-slate-500",
};

const roleStyles: Record<LanNode["role"], string> = {
  core: "border-primary/60 bg-white/90",
  distribution: "border-blue-500/60 bg-white/90",
  access: "border-emerald-500/60 bg-white/90",
  endpoint: "border-slate-500/60 bg-white/90",
};

const LanCartography = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [selectedTopologyId, setSelectedTopologyId] = useState(topologies[0].id);
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [contextNode, setContextNode] = useState<LanNode | null>(null);
  const [contextLink, setContextLink] = useState<LanLink | null>(null);
  const [contextLinkPosition, setContextLinkPosition] = useState<{ x: number; y: number } | null>(null);
  const [hoveredLink, setHoveredLink] = useState<LanLink | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  const topology = useMemo(
    () => topologies.find((lan) => lan.id === selectedTopologyId) ?? topologies[0],
    [selectedTopologyId],
  );

  useEffect(() => {
    if (!topology) return;
    const mapped: Record<string, { x: number; y: number }> = {};
    topology.nodes.forEach((node) => {
      mapped[node.id] = { ...node.position };
    });
    setPositions(mapped);
    setHoveredLink(null);
    setContextLink(null);
    setContextLinkPosition(null);
  }, [topology]);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (!draggingNodeId || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const xPercent = ((event.clientX - rect.left) / rect.width) * 100;
      const yPercent = ((event.clientY - rect.top) / rect.height) * 100;
      setPositions((prev) => ({
        ...prev,
        [draggingNodeId]: {
          x: Math.min(95, Math.max(5, xPercent)),
          y: Math.min(95, Math.max(5, yPercent)),
        },
      }));
    };

    const handlePointerUp = () => setDraggingNodeId(null);

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [draggingNodeId]);

  if (!isAuthenticated) {
    return null;
  }

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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
            const pos = positions[node.id] ?? node.position;
            return [
              node.id,
              node.name,
              node.role,
              node.status,
              node.site,
              node.ip,
              node.model,
              pos.x.toFixed(2),
              pos.y.toFixed(2),
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
        downloadBlob(blob, `cartographie-${topology.id}.csv`);
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
        rows.forEach((row, index) => {
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
        const pos = positions[node.id] ?? node.position;
        return `${node.name} (${node.role}) — IP ${node.ip} — ${node.site} — Position ${pos.x.toFixed(1)}% / ${pos.y.toFixed(
          1,
        )}%`;
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
    [positions, topology],
  );

  const renderLinks = () =>
    topology.links.map((link) => {
      const from = positions[link.from] ?? topology.nodes.find((node) => node.id === link.from)?.position;
      const to = positions[link.to] ?? topology.nodes.find((node) => node.id === link.to)?.position;
      if (!from || !to) return null;
      return (
        <line
          key={link.id}
          x1={`${from.x}%`}
          y1={`${from.y}%`}
          x2={`${to.x}%`}
          y2={`${to.y}%`}
          strokeWidth={link.type === "fiber" ? 3 : 2}
          stroke={link.status === "up" ? "#10b981" : link.status === "warn" ? "#f59e0b" : "#ef4444"}
          strokeDasharray={link.type === "wireless" ? "6 4" : undefined}
          className="hover:stroke-blue-400 transition-colors cursor-pointer"
          onMouseEnter={() => setHoveredLink(link)}
          onMouseLeave={() => setHoveredLink(null)}
          onContextMenu={(e) => {
            e.preventDefault();
            setContextLink(link);
            setContextLinkPosition({ x: e.clientX, y: e.clientY });
          }}
        />
      );
    });

  const renderPortLabels = () => {
    if (!hoveredLink || !containerRef.current) return null;
    const from = positions[hoveredLink.from] ?? topology.nodes.find((node) => node.id === hoveredLink.from)?.position;
    const to = positions[hoveredLink.to] ?? topology.nodes.find((node) => node.id === hoveredLink.to)?.position;
    if (!from || !to) return null;

    const fromNode = topology.nodes.find((node) => node.id === hoveredLink.from);
    const toNode = topology.nodes.find((node) => node.id === hoveredLink.to);
    if (!fromNode || !toNode) return null;

    return (
      <>
        {/* Label pour le port de départ */}
        <div
          className="absolute pointer-events-none z-10"
          style={{
            left: `${from.x}%`,
            top: `${from.y}%`,
            transform: `translate(-50%, -100%) translateY(-15px)`,
          }}
        >
          <div className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap border border-primary/20">
            <div className="text-[0.65rem] font-medium opacity-90">{fromNode.name}</div>
            <div className="text-[0.75rem] font-semibold mt-0.5">
              Port: {hoveredLink.fromPort || "N/A"}
            </div>
          </div>
        </div>
        {/* Label pour le port d'arrivée */}
        <div
          className="absolute pointer-events-none z-10"
          style={{
            left: `${to.x}%`,
            top: `${to.y}%`,
            transform: `translate(-50%, -100%) translateY(-15px)`,
          }}
        >
          <div className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap border border-primary/20">
            <div className="text-[0.65rem] font-medium opacity-90">{toNode.name}</div>
            <div className="text-[0.75rem] font-semibold mt-0.5">
              Port: {hoveredLink.toPort || "N/A"}
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <AppShell>
      <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Cartographie des LANs</h1>
                <p className="text-muted-foreground">
                  Visualisation des équipements et de leurs interconnexions réseau.
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
                <Button variant="outline" size="icon" onClick={() => setPositions((prev) => ({ ...prev }))}>
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
                  <CardTitle>{topology.name}</CardTitle>
                  <CardDescription>
                    {topology.description} — {topology.subnet} ({topology.vlan})
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TooltipProvider>
                    <div
                      ref={containerRef}
                      className="relative h-[500px] rounded-lg border border-dashed bg-muted/20 select-none"
                      onContextMenu={(e) => e.preventDefault()}
                    >
                      <svg className="absolute inset-0 w-full h-full">
                        {renderLinks()}
                      </svg>
                      {renderPortLabels()}
                      <DropdownMenu
                        open={!!contextLink}
                        onOpenChange={(open) => {
                          if (!open) {
                            setContextLink(null);
                            setContextLinkPosition(null);
                          }
                        }}
                      >
                        <DropdownMenuTrigger asChild>
                          <div
                            style={{
                              position: "absolute",
                              left: contextLinkPosition?.x || 0,
                              top: contextLinkPosition?.y || 0,
                              width: 0,
                              height: 0,
                            }}
                          />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          style={{
                            position: "fixed",
                            left: contextLinkPosition?.x || 0,
                            top: contextLinkPosition?.y || 0,
                          }}
                        >
                          <DropdownMenuItem
                            onClick={() => {
                              const current = topologies.find((lan) => lan.id === selectedTopologyId);
                              if (!contextLink || !current) return;
                              current.links = current.links.filter((link) => link.id !== contextLink.id);
                              setContextLink(null);
                              setContextLinkPosition(null);
                            }}
                          >
                            Supprimer cette liaison
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      {topology.nodes.map((node) => (
                        <DropdownMenu key={node.id} onOpenChange={(open) => !open && setContextNode(null)}>
                          <DropdownMenuTrigger asChild>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onPointerDown={(event) => {
                                    event.preventDefault();
                                    setDraggingNodeId(node.id);
                                  }}
                                  onContextMenu={(event) => {
                                    event.preventDefault();
                                    setContextNode(node);
                                  }}
                                  className={`absolute -translate-x-1/2 -translate-y-1/2 min-w-[130px] rounded-xl border px-3 py-3 text-center shadow-sm transition hover:shadow-md ${roleStyles[node.role]}`}
                                  style={{
                                    left: `${positions[node.id]?.x ?? node.position.x}%`,
                                    top: `${positions[node.id]?.y ?? node.position.y}%`,
                                    cursor: draggingNodeId === node.id ? "grabbing" : "grab",
                                  }}
                                >
                                  <div className="flex flex-col items-center gap-2">
                                    <div className="relative">
                                      <img
                                        src={node.icon}
                                        alt={node.name}
                                        className="h-14 w-14 object-contain drop-shadow"
                                        loading="lazy"
                                      />
                                      <span
                                        className={`absolute -top-1 -right-1 h-3 w-3 rounded-full border border-white ${statusColors[node.status] || "bg-slate-400"}`}
                                      />
                                    </div>
                                    <div>
                                      <p className="text-xs font-semibold">{node.name}</p>
                                      <p className="text-[0.65rem] text-muted-foreground">{node.site}</p>
                                      <p className="text-[0.65rem] font-mono text-muted-foreground">{node.ip}</p>
                                    </div>
                                  </div>
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="space-y-1 text-xs">
                                  <p className="font-medium">{node.name}</p>
                                  <p className="text-muted-foreground">Modèle : {node.model}</p>
                                  <p className="text-muted-foreground">IP : {node.ip}</p>
                                  <p className="text-muted-foreground">Site : {node.site}</p>
                                  {node.notes && <p className="text-muted-foreground">{node.notes}</p>}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                const current = topologies.find((lan) => lan.id === selectedTopologyId);
                                if (!current || !contextNode) return;
                                current.nodes = current.nodes.filter((n) => n.id !== contextNode.id);
                                current.links = current.links.filter(
                                  (link) => link.from !== contextNode.id && link.to !== contextNode.id,
                                );
                                const updatedPositions = { ...positions };
                                delete updatedPositions[contextNode.id];
                                setPositions(updatedPositions);
                                setContextNode(null);
                              }}
                            >
                              Supprimer cet équipement
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ))}
                    </div>
                  </TooltipProvider>
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
                      <p className="text-muted-foreground">Core, Distribution, Access, Endpoint</p>
                    </div>
                    <div>
                      <p className="font-semibold">Statuts</p>
                      <p className="text-muted-foreground">Vert = up, Orange = instable, Rouge = down</p>
                    </div>
                    <div>
                      <p className="font-semibold">Types de lien</p>
                      <p className="text-muted-foreground">Traits pleins = fibre/cuivre, pointillés = sans-fil</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="actions" className="mt-4">
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">
                      Cette cartographie est basée sur des données simulées. Pour passer à un mode “réel”, il faudra connecter la
                      page aux endpoints API qui fournissent la liste des équipements, des ports et des liaisons pour chaque LAN.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
      </div>
    </AppShell>
  );
};

export default LanCartography;

