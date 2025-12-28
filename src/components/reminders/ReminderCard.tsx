import { format, formatDistanceToNow, isPast, isToday, isTomorrow } from "date-fns";
import { Calendar, Clock, MapPin, BookOpen, Trash2, Check, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ReminderCardProps {
  id: string;
  title: string;
  description?: string | null;
  reminderType: string;
  dueDate: string;
  reminderAt?: string | null;
  roadmapTitle?: string;
  topicTitle?: string;
  isCompleted: boolean;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
}

export const ReminderCard = ({
  id,
  title,
  description,
  reminderType,
  dueDate,
  reminderAt,
  roadmapTitle,
  topicTitle,
  isCompleted,
  onComplete,
  onDelete,
}: ReminderCardProps) => {
  const dueDateObj = new Date(dueDate);
  const isOverdue = isPast(dueDateObj) && !isCompleted;
  const isDueToday = isToday(dueDateObj);
  const isDueTomorrow = isTomorrow(dueDateObj);

  const getTypeConfig = () => {
    switch (reminderType) {
      case "exam":
        return { label: "Exam", className: "bg-destructive/10 text-destructive border-destructive/20" };
      case "deadline":
        return { label: "Deadline", className: "bg-warning/10 text-warning border-warning/20" };
      case "revision":
        return { label: "Revision", className: "bg-primary/10 text-primary border-primary/20" };
      default:
        return { label: "Reminder", className: "bg-muted text-muted-foreground border-muted" };
    }
  };

  const typeConfig = getTypeConfig();

  const getDueDateLabel = () => {
    if (isOverdue) return "Overdue";
    if (isDueToday) return "Today";
    if (isDueTomorrow) return "Tomorrow";
    return formatDistanceToNow(dueDateObj, { addSuffix: true });
  };

  return (
    <div
      className={cn(
        "glass-card p-4 transition-all",
        isCompleted && "opacity-60",
        isOverdue && "border-destructive/30"
      )}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={() => onComplete(id)}
          className={cn(
            "mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0",
            isCompleted
              ? "bg-primary border-primary"
              : "border-muted-foreground/30 hover:border-primary"
          )}
        >
          {isCompleted && <Check className="w-3 h-3 text-primary-foreground" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Badge variant="outline" className={cn("text-xs", typeConfig.className)}>
              {typeConfig.label}
            </Badge>
            {isOverdue && (
              <Badge variant="destructive" className="text-xs">
                Overdue
              </Badge>
            )}
            {isDueToday && !isOverdue && (
              <Badge className="text-xs bg-warning text-warning-foreground">
                Due Today
              </Badge>
            )}
          </div>

          <h4
            className={cn(
              "font-medium text-foreground truncate",
              isCompleted && "line-through"
            )}
          >
            {title}
          </h4>

          {description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{format(dueDateObj, "MMM d, yyyy")}</span>
              <span className="text-muted-foreground/60">
                ({getDueDateLabel()})
              </span>
            </div>

            {reminderAt && (
              <div className="flex items-center gap-1">
                <Bell className="w-3 h-3" />
                <span>Reminder: {format(new Date(reminderAt), "MMM d, h:mm a")}</span>
              </div>
            )}

            {roadmapTitle && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span className="truncate max-w-[120px]">{roadmapTitle}</span>
              </div>
            )}

            {topicTitle && (
              <div className="flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                <span className="truncate max-w-[120px]">{topicTitle}</span>
              </div>
            )}
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 text-muted-foreground hover:text-destructive"
          onClick={() => onDelete(id)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
