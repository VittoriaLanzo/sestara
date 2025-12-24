import { cn } from "@/lib/utils";
import { ProgressRing } from "./ProgressRing";
import { CheckCircle2, Clock, Play, Lock } from "lucide-react";

interface TopicCardProps {
  title: string;
  description: string;
  progress: number;
  status: "completed" | "in-progress" | "locked" | "not-started";
  estimatedTime?: string;
  className?: string;
  onClick?: () => void;
}

const statusConfig = {
  completed: {
    icon: CheckCircle2,
    label: "Completed",
    color: "text-success",
    bgColor: "bg-success/10",
    borderColor: "border-success/30",
  },
  "in-progress": {
    icon: Play,
    label: "In Progress",
    color: "text-primary",
    bgColor: "bg-primary/10",
    borderColor: "border-primary/30",
  },
  locked: {
    icon: Lock,
    label: "Locked",
    color: "text-muted-foreground",
    bgColor: "bg-muted/50",
    borderColor: "border-muted",
  },
  "not-started": {
    icon: Clock,
    label: "Not Started",
    color: "text-muted-foreground",
    bgColor: "bg-secondary",
    borderColor: "border-border",
  },
};

export const TopicCard = ({
  title,
  description,
  progress,
  status,
  estimatedTime,
  className,
  onClick,
}: TopicCardProps) => {
  const config = statusConfig[status];
  const Icon = config.icon;
  const isClickable = status !== "locked";

  return (
    <div
      onClick={isClickable ? onClick : undefined}
      className={cn(
        "glass-card p-5 hover-lift group",
        isClickable && "cursor-pointer",
        status === "locked" && "opacity-60",
        config.borderColor,
        className
      )}
    >
      <div className="flex items-start gap-4">
        <ProgressRing progress={progress} size={56} strokeWidth={4}>
          <span className="text-xs font-semibold text-foreground">{progress}%</span>
        </ProgressRing>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-display font-semibold text-foreground truncate group-hover:text-primary transition-colors">
              {title}
            </h3>
            <span className={cn("flex items-center gap-1 text-xs px-2 py-0.5 rounded-full", config.bgColor, config.color)}>
              <Icon className="w-3 h-3" />
              {config.label}
            </span>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
          
          {estimatedTime && (
            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              {estimatedTime}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
