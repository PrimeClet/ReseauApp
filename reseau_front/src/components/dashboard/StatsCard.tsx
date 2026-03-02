import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export default function StatsCard({
  title,
  value,
  icon: Icon,
  iconColor = "text-primary",
  iconBgColor = "bg-primary/10",
  trend
}: StatsCardProps) {
  return (
    <Card className="p-3 sm:p-6 bg-card border-border">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">{title}</p>
          <div className="flex items-center gap-1 sm:gap-2">
            <h3 className="text-xl sm:text-3xl font-bold text-foreground">{value}</h3>
            {trend && (
              <span className={`text-[10px] sm:text-xs font-medium ${
                trend.isPositive ? 'text-status-up' : 'text-status-down'
              }`}>
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
            )}
          </div>
        </div>
        <div className={`p-2 sm:p-3 ${iconBgColor} rounded-lg sm:rounded-xl flex-shrink-0`}>
          <Icon className={`h-4 w-4 sm:h-6 sm:w-6 ${iconColor}`} />
        </div>
      </div>
    </Card>
  );
}