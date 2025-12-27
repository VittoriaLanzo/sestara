import { cn } from "@/lib/utils";
import { ProgressBar } from "./ProgressBar";
import { CheckCircle2, BookOpen } from "lucide-react";

interface SubjectProgressCardProps {
  title: string;
  completedTopics: number;
  totalTopics: number;
  progress: number;
  isCompleted?: boolean;
  className?: string;
}

export const SubjectProgressCard = ({
  title,
  completedTopics,
  totalTopics,
  progress,
  isCompleted = false,
  className,
}: SubjectProgressCardProps) => {
  return (
    <div
      className={cn(
        "p-4 rounded-lg border transition-all",
        isCompleted
          ? "bg-success/5 border-success/30"
          : "bg-card/50 border-border/50",
        className
      )}
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className={cn(
            "p-2 rounded-lg",
            isCompleted ? "bg-success/10" : "bg-primary/10"
          )}
        >
          {isCompleted ? (
            <CheckCircle2 className="w-4 h-4 text-success" />
          ) : (
            <BookOpen className="w-4 h-4 text-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-foreground truncate">{title}</h4>
          <p className="text-xs text-muted-foreground">
            {completedTopics}/{totalTopics} topics
          </p>
        </div>
        <span
          className={cn(
            "text-sm font-semibold",
            isCompleted ? "text-success" : "text-foreground"
          )}
        >
          {progress}%
        </span>
      </div>
      <ProgressBar progress={progress} size="sm" />
    </div>
  );
};
