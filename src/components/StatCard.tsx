import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  className,
}: StatCardProps) => {
  return (
    <div className={cn("glass-card-elevated p-5 hover-lift border-border/60", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          <p className="text-3xl font-display font-bold text-primary">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground/80 mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className={cn(
              "flex items-center gap-1 text-xs mt-2",
              trend.isPositive ? "text-success" : "text-destructive"
            )}>
              <span>{trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%</span>
              <span className="text-muted-foreground">vs last week</span>
            </div>
          )}
        </div>
        <div className="p-3 rounded-xl bg-primary">
          <Icon className="w-6 h-6 text-accent" />
        </div>
      </div>
    </div>
  );
};
