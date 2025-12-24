import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, Lock, Play } from "lucide-react";

interface RoadmapNodeProps {
  title: string;
  status: "completed" | "current" | "upcoming" | "locked";
  isLast?: boolean;
  onClick?: () => void;
}

const nodeConfig = {
  completed: {
    icon: CheckCircle2,
    iconClass: "text-success bg-success/20",
    lineClass: "bg-gradient-to-b from-success to-primary",
    titleClass: "text-foreground",
  },
  current: {
    icon: Play,
    iconClass: "text-primary bg-primary/20 animate-pulse-glow",
    lineClass: "bg-gradient-to-b from-primary to-muted",
    titleClass: "text-primary font-semibold",
  },
  upcoming: {
    icon: Circle,
    iconClass: "text-muted-foreground bg-muted",
    lineClass: "bg-muted",
    titleClass: "text-muted-foreground",
  },
  locked: {
    icon: Lock,
    iconClass: "text-muted-foreground/50 bg-muted/50",
    lineClass: "bg-muted/50",
    titleClass: "text-muted-foreground/50",
  },
};

export const RoadmapNode = ({ title, status, isLast = false, onClick }: RoadmapNodeProps) => {
  const config = nodeConfig[status];
  const Icon = config.icon;
  const isClickable = status !== "locked";

  return (
    <div className="relative flex items-center gap-4">
      {/* Connector line */}
      {!isLast && (
        <div
          className={cn(
            "absolute left-5 top-10 w-0.5 h-12",
            config.lineClass
          )}
        />
      )}

      {/* Node icon */}
      <button
        onClick={isClickable ? onClick : undefined}
        disabled={!isClickable}
        className={cn(
          "relative z-10 flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300",
          config.iconClass,
          isClickable && "hover:scale-110 cursor-pointer"
        )}
      >
        <Icon className="w-5 h-5" />
      </button>

      {/* Title */}
      <span
        className={cn(
          "text-sm font-medium transition-colors",
          config.titleClass,
          isClickable && "hover:text-primary cursor-pointer"
        )}
        onClick={isClickable ? onClick : undefined}
      >
        {title}
      </span>
    </div>
  );
};
