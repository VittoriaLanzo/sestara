import { cn } from "@/lib/utils";

interface ProgressBarProps {
  progress: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
  animated?: boolean;
}

const sizeClasses = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4",
};

export const ProgressBar = ({
  progress,
  size = "md",
  showLabel = false,
  className,
  animated = true,
}: ProgressBarProps) => {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex justify-between mb-1.5">
          <span className="text-xs font-medium text-muted-foreground">Progress</span>
          <span className="text-xs font-semibold text-foreground">{clampedProgress}%</span>
        </div>
      )}
      <div className={cn("w-full rounded-full bg-muted/50 overflow-hidden", sizeClasses[size])}>
        <div
          className={cn(
            "h-full rounded-full bg-primary",
            animated && "transition-all duration-700 ease-out"
          )}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
};
