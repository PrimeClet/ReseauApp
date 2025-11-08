import { cn } from "@/lib/utils";

type StatusType = "up" | "down" | "warn" | "maintenance" | "ok" | "actif" | "fermee";

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const statusConfig = {
  up: { 
    color: "bg-status-up text-white",
    label: "UP"
  },
  down: { 
    color: "bg-status-down text-white",
    label: "DOWN"
  },
  warn: { 
    color: "bg-status-warn text-black",
    label: "WARN"
  },
  maintenance: { 
    color: "bg-status-maintenance text-black",
    label: "Maintenance"
  },
  ok: { 
    color: "bg-status-ok text-white",
    label: "OK"
  },
  actif: { 
    color: "bg-status-up text-white",
    label: "Actif"
  },
  fermee: { 
    color: "bg-status-down text-white",
    label: "Fermée"
  }
};

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.ok;
  
  return (
    <span className={cn(
      "px-2 py-1 rounded-md text-xs font-medium uppercase tracking-wide",
      config.color,
      className
    )}>
      {config.label}
    </span>
  );
}