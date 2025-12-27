import { cn } from "@/lib/utils";
import { Flame, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface ConsistencyIndicatorProps {
  trend: "up" | "down" | "stable";
  streak: number;
  className?: string;
}

export const ConsistencyIndicator = ({
  trend,
  streak,
  className,
}: ConsistencyIndicatorProps) => {
  const trendConfig = {
    up: {
      icon: TrendingUp,
      color: "text-success",
      bgColor: "bg-success/10",
      label: "Improving",
    },
    down: {
      icon: TrendingDown,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
      label: "Slowing down",
    },
    stable: {
      icon: Minus,
      color: "text-muted-foreground",
      bgColor: "bg-muted",
      label: "Consistent",
    },
  };

  const config = trendConfig[trend];
  const TrendIcon = config.icon;

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium", config.bgColor, config.color)}>
        <TrendIcon className="w-3.5 h-3.5" />
        {config.label}
      </div>
      {streak > 0 && (
        <div className="flex items-center gap-1 text-warning">
          <Flame className="w-4 h-4" />
          <span className="text-sm font-semibold">{streak} day streak</span>
        </div>
      )}
    </div>
  );
};
