import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";
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
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  const topology = useMemo(
    () => topologies.find((lan) => lan.id === selectedTopologyId) ?? topologies[0],
    [selectedTopologyId],
  );

  const selectedNode = topology.nodes.find((node) => node.id === selectedNodeId) ?? null;

  if (!isAuthenticated) {
    return null;
  }

  const renderLinks = () =>
    topology.links.map((link) => {
      const from = topology.nodes.find((node) => node.id === link.from);
      const to = topology.nodes.find((node) => node.id === link.to);
      if (!from || !to) return null;
      return (
        <line
          key={link.id}
          x1={`${from.position.x}%`}
          y1={`${from.position.y}%`}
          x2={`${to.position.x}%`}
          y2={`${to.position.y}%`}
          strokeWidth={link.type === "fiber" ? 3 : 2}
          stroke={link.status === "up" ? "#10b981" : link.status === "warn" ? "#f59e0b" : "#ef4444"}
          strokeDasharray={link.type === "wireless" ? "6 4" : undefined}
        />
      );
    });

  return (
    <div className="flex h-screen bg-background flex-col">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeSection="" onSectionChange={() => {}} />
        <main className="flex-1 overflow-auto">
          <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Cartographie des LANs</h1>
                <p className="text-muted-foreground">
                  Visualisation des équipements et de leurs interconnexions réseau.
                </p>
              </div>
              <div className="flex items-center gap-2">
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
                <Button variant="outline" size="icon" onClick={() => setSelectedNodeId(null)}>
                  <RefreshCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>{topology.name}</CardTitle>
                  <CardDescription>
                    {topology.description} — {topology.subnet} ({topology.vlan})
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TooltipProvider>
                    <div className="relative h-[500px] rounded-lg border border-dashed bg-muted/20">
                      <svg className="absolute inset-0 w-full h-full pointer-events-none">
                        {renderLinks()}
                      </svg>
                      {topology.nodes.map((node) => (
                        <Tooltip key={node.id}>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => setSelectedNodeId(node.id)}
                              className={`absolute -translate-x-1/2 -translate-y-1/2 min-w-[130px] rounded-xl border px-3 py-3 text-center shadow-sm transition hover:shadow-md ${roleStyles[node.role]}`}
                              style={{
                                left: `${node.position.x}%`,
                                top: `${node.position.y}%`,
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
                            <div className="space-y-1">
                              <p className="font-medium">{node.name}</p>
                              <p className="text-xs text-muted-foreground">{node.model}</p>
                              <p className="text-xs">{node.notes ?? "Aucune note"}</p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  </TooltipProvider>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Statut des liaisons</CardTitle>
                    <CardDescription>Vue synthétique des liens physiques et logiques.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {topology.links.map((link) => (
                      <div key={link.id} className="rounded-lg border p-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">
                            {link.from} → {link.to}
                          </span>
                          <Badge
                            variant={link.status === "up" ? "default" : link.status === "warn" ? "secondary" : "destructive"}
                          >
                            {link.status === "up" ? "Opérationnel" : link.status === "warn" ? "Instable" : "Down"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {link.type.toUpperCase()} • {link.vlan} • {link.bandwidth}
                        </p>
                        {(link.fromPort || link.toPort) && (
                          <p className="text-xs text-muted-foreground">
                            Ports : {link.fromPort ?? "?"} ↔ {link.toPort ?? "?"}
                          </p>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Détails équipement</CardTitle>
                    <CardDescription>
                      {selectedNode ? "Informations sur l’équipement sélectionné." : "Cliquez sur un nœud pour afficher les détails."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {selectedNode ? (
                      <div className="space-y-3 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">Nom</p>
                          <p className="font-semibold">{selectedNode.name}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Rôle</p>
                          <p className="capitalize">{selectedNode.role}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Adresse IP</p>
                          <p className="font-mono">{selectedNode.ip}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Site</p>
                          <p>{selectedNode.site}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Modèle</p>
                          <p>{selectedNode.model}</p>
                        </div>
                        {selectedNode.notes && (
                          <div>
                            <p className="text-xs text-muted-foreground">Notes</p>
                            <p>{selectedNode.notes}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Aucun équipement sélectionné.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
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
        </main>
      </div>
    </div>
  );
};

export default LanCartography;

