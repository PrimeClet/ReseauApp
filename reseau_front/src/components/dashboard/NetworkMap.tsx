import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Server, Monitor } from "lucide-react";

const edgeNodes = [
  { id: "cab-a1", label: "Armoire A1", location: "Niveau 0", status: "online" },
  { id: "cab-b4", label: "Armoire B4", location: "Niveau 1", status: "maintenance" },
  { id: "cab-c2", label: "Armoire C2", location: "Niveau 2", status: "down" },
];

const statusStyles = {
  online: {
    label: "Opérationnel",
    dot: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  maintenance: {
    label: "Maintenance",
    dot: "bg-amber-500",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
  },
  down: {
    label: "Hors service",
    dot: "bg-red-500",
    badge: "bg-red-50 text-red-700 border-red-200",
  },
} as const;

export default function NetworkMap() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="space-y-1">
        <CardTitle>Cartographie réseau</CardTitle>
        <p className="text-sm text-muted-foreground">
          Représentation simplifiée du nœud central et des armoires reliées
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-6">
          <div className="flex flex-col items-center gap-2">
            <div className="rounded-2xl border border-border bg-card/80 px-6 py-4 shadow-sm flex flex-col items-center gap-2">
              <Server className="h-10 w-10 text-primary" />
              <div className="text-sm font-semibold text-foreground">Nœud central</div>
              <p className="text-xs text-muted-foreground">Contrôleur principal</p>
            </div>
          </div>

          <div className="w-px h-10 bg-border" aria-hidden="true"></div>

          <div className="relative w-full max-w-4xl pt-6">
            <div className="absolute top-0 left-16 right-16 h-px bg-border" aria-hidden="true"></div>
            <div className="flex flex-wrap items-start justify-center gap-10">
              {edgeNodes.map((node) => {
                const style = statusStyles[node.status as keyof typeof statusStyles];
                return (
                  <div key={node.id} className="relative flex flex-col items-center pt-6 text-center">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-6 bg-border" aria-hidden="true"></div>
                    <div className="rounded-2xl border border-border bg-muted/30 px-4 py-3 shadow-sm flex flex-col items-center gap-2 min-w-[140px]">
                      <Monitor className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-semibold text-foreground">{node.label}</div>
                        <p className="text-xs text-muted-foreground">{node.location}</p>
                      </div>
                      <div className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${style.badge}`}>
                        <span className={`h-2 w-2 rounded-full ${style.dot}`}></span>
                        {style.label}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


