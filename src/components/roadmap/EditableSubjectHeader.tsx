import { useState } from "react";
import { cn } from "@/lib/utils";
import { EditableTitle } from "./EditableTitle";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { ProgressBar } from "@/components/progress/ProgressBar";
import { 
  ChevronDown, 
  GripVertical, 
  Plus, 
  Trash2, 
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

interface EditableSubjectHeaderProps {
  id: string;
  title: string;
  description?: string | null;
  progress: number;
  completedTopics: number;
  totalTopics: number;
  isExpanded: boolean;
  isDragging?: boolean;
  dragHandleProps?: any;
  onToggle: () => void;
  onTitleChange: (newTitle: string) => Promise<void>;
  onAddTopic: () => void;
  onDelete: () => Promise<void>;
}

export const EditableSubjectHeader = ({
  id,
  title,
  description,
  progress,
  completedTopics,
  totalTopics,
  isExpanded,
  isDragging,
  dragHandleProps,
  onToggle,
  onTitleChange,
  onAddTopic,
  onDelete,
}: EditableSubjectHeaderProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
          "glass-card p-4 hover-lift flex items-center gap-4 group transition-all duration-200",
          isDragging && "ring-2 ring-primary shadow-lg"
        )}
      >
        {/* Drag Handle */}
        <div
          {...dragHandleProps}
          className="cursor-grab text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
        >
          <GripVertical className="w-5 h-5" />
        </div>

        {/* Progress Circle */}
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-bold text-primary">{progress}%</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 cursor-pointer" onClick={onToggle}>
          <EditableTitle
            value={title}
            onSave={onTitleChange}
            variant="subheading"
          />
          {description && (
            <p className="text-sm text-muted-foreground line-clamp-1">{description}</p>
          )}
          <div className="mt-2">
            <ProgressBar progress={progress} size="sm" />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {completedTopics}/{totalTopics} topics completed
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onAddTopic();
            }}
            className="gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Topic
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Subject
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <ChevronDown
            className={cn(
              "w-5 h-5 text-muted-foreground transition-transform duration-300 flex-shrink-0 cursor-pointer",
              isExpanded && "rotate-180"
            )}
            onClick={onToggle}
          />
        </div>
      </div>

      <DeleteConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title={title}
        itemType="subject"
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </>
  );
};
