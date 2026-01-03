import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, Clock, Play, AlertTriangle } from "lucide-react";

type TopicStatus = "not-started" | "in-progress" | "completed" | "needs-revision";

interface TopicStatusSelectorProps {
  status: TopicStatus;
  onStatusChange: (status: TopicStatus) => void;
  disabled?: boolean;
}

const statusOptions = [
  {
    value: "not-started",
    label: "Not Started",
    icon: Clock,
    color: "text-muted-foreground",
    bgColor: "bg-secondary",
  },
  {
    value: "in-progress",
    label: "In Progress",
    icon: Play,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    value: "completed",
    label: "Completed",
    icon: CheckCircle2,
    color: "text-success",
    bgColor: "bg-success/10",
  },
  {
    value: "needs-revision",
    label: "Needs Revision",
    icon: AlertTriangle,
    color: "text-warning",
    bgColor: "bg-warning/10",
  },
];

export const TopicStatusSelector = ({
  status,
  onStatusChange,
  disabled = false,
}: TopicStatusSelectorProps) => {
  const currentStatus = statusOptions.find((s) => s.value === status) || statusOptions[0];
  const Icon = currentStatus.icon;

  return (
    <Select
      value={status}
      onValueChange={(value) => onStatusChange(value as TopicStatus)}
      disabled={disabled}
    >
      <SelectTrigger className={cn("w-[160px] h-8 text-xs", currentStatus.bgColor, currentStatus.color)}>
        <SelectValue>
          <div className="flex items-center gap-2">
            <Icon className="w-3 h-3" />
            <span>{currentStatus.label}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {statusOptions.map((option) => {
          const OptionIcon = option.icon;
          return (
            <SelectItem key={option.value} value={option.value}>
              <div className={cn("flex items-center gap-2", option.color)}>
                <OptionIcon className="w-4 h-4" />
                <span>{option.label}</span>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
};
