import { useState } from "react";
import { cn } from "@/lib/utils";
import { ProgressRing } from "@/components/ProgressRing";
import { TopicStatusSelector } from "./TopicStatusSelector";
import { EditableTitle } from "./EditableTitle";
import { RevisionNotesDialog } from "./RevisionNotesDialog";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { 
  CheckCircle2, 
  Clock, 
  Play, 
  AlertTriangle, 
  GripVertical,
  Trash2,
  StickyNote,
  MoreVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type TopicStatus = "completed" | "in-progress" | "not-started" | "needs-revision";

interface EditableTopicCardProps {
  id: string;
  title: string;
  description: string;
  progress: number;
  status: TopicStatus;
  estimatedTime?: string;
  revisionNotes?: string | null;
  className?: string;
  isDragging?: boolean;
  dragHandleProps?: any;
  onTitleChange: (newTitle: string) => Promise<void>;
  onStatusChange: (status: TopicStatus, progress: number) => Promise<void>;
  onRevisionNotesChange: (notes: string) => Promise<void>;
  onDelete: () => Promise<void>;
  onClick?: () => void;
}

const statusConfig = {
  completed: {
    icon: CheckCircle2,
    color: "text-success",
    bgColor: "bg-success/10",
    borderColor: "border-success/30",
  },
  "in-progress": {
    icon: Play,
    color: "text-primary",
    bgColor: "bg-primary/10",
    borderColor: "border-primary/30",
  },
  "not-started": {
    icon: Clock,
    color: "text-muted-foreground",
    bgColor: "bg-secondary",
    borderColor: "border-border",
  },
  "needs-revision": {
    icon: AlertTriangle,
    color: "text-warning",
    bgColor: "bg-warning/10",
    borderColor: "border-warning/30",
  },
};

export const EditableTopicCard = ({
  id,
  title,
  description,
  progress,
  status,
  estimatedTime,
  revisionNotes,
  className,
  isDragging,
  dragHandleProps,
  onTitleChange,
  onStatusChange,
  onRevisionNotesChange,
  onDelete,
  onClick,
}: EditableTopicCardProps) => {
  const [showRevisionDialog, setShowRevisionDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const config = statusConfig[status] || statusConfig["not-started"];
  const Icon = config.icon;

  const handleStatusChange = async (newStatus: TopicStatus) => {
    let newProgress = progress;
    if (newStatus === "completed") {
      newProgress = 100;
    } else if (newStatus === "not-started") {
      newProgress = 0;
    } else if (newStatus === "in-progress" && progress === 0) {
      newProgress = 10;
    }
    await onStatusChange(newStatus, newProgress);

    // Open revision notes dialog if status changed to needs-revision
    if (newStatus === "needs-revision") {
      setShowRevisionDialog(true);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete();
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      <div
        className={cn(
          "glass-card p-4 hover-lift group transition-all duration-200",
          config.borderColor,
          isDragging && "ring-2 ring-primary shadow-lg",
          status === "needs-revision" && "ring-1 ring-warning/50",
          className
        )}
      >
        <div className="flex items-start gap-3">
          {/* Drag Handle */}
          <div
            {...dragHandleProps}
            className="mt-1 cursor-grab text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
          >
            <GripVertical className="w-4 h-4" />
          </div>

          {/* Progress Ring */}
          <ProgressRing progress={progress} size={48} strokeWidth={4}>
            <span className="text-xs font-semibold text-foreground">{progress}%</span>
          </ProgressRing>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div 
                className="flex-1 min-w-0 cursor-pointer" 
                onClick={(e) => {
                  e.stopPropagation();
                  onClick?.();
                }}
              >
                <EditableTitle
                  value={title}
                  onSave={onTitleChange}
                  variant="subheading"
                  className="hover:text-primary transition-colors"
                />
                <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                  {description}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <TopicStatusSelector
                  status={status}
                  onStatusChange={handleStatusChange}
                />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setShowRevisionDialog(true)}>
                      <StickyNote className="w-4 h-4 mr-2" />
                      {revisionNotes ? "Edit" : "Add"} Revision Notes
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setShowDeleteDialog(true)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Topic
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Meta info */}
            <div className="flex items-center gap-3 mt-2">
              {estimatedTime && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {estimatedTime}
                </div>
              )}
              {revisionNotes && (
                <div className="flex items-center gap-1 text-xs text-warning">
                  <StickyNote className="w-3 h-3" />
                  Has notes
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <RevisionNotesDialog
        open={showRevisionDialog}
        onOpenChange={setShowRevisionDialog}
        topicTitle={title}
        currentNotes={revisionNotes || null}
        onSave={onRevisionNotesChange}
      />

      <DeleteConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title={title}
        itemType="topic"
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </>
  );
};
