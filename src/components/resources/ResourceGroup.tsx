import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  ResourceGroup as ResourceGroupType, 
  RoadmapResource, 
  useUpdateGroup, 
  useDeleteGroup 
} from "@/hooks/useRoadmapResources";
import { ResourceCard } from "./ResourceCard";
import { ChevronDown, ChevronRight, Pencil, Trash2, Check, X, GripVertical, ListVideo, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Droppable, Draggable } from "@hello-pangea/dnd";

interface ResourceGroupProps {
  group: ResourceGroupType;
  resources: RoadmapResource[];
  allGroups: ResourceGroupType[];
  roadmapId: string;
  onPlayResource: (resource: RoadmapResource) => void;
}

export const ResourceGroupComponent = ({
  group,
  resources,
  allGroups,
  roadmapId,
  onPlayResource,
}: ResourceGroupProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(group.name);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const updateGroup = useUpdateGroup();
  const deleteGroup = useDeleteGroup();

  const handleSave = () => {
    if (editName.trim() && editName !== group.name) {
      updateGroup.mutate({
        id: group.id,
        roadmapId,
        updates: { name: editName.trim() },
      });
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    deleteGroup.mutate({ id: group.id, roadmapId });
    setShowDeleteDialog(false);
  };

  const getColorClass = (color: string | null) => {
    const colorMap: Record<string, string> = {
      blue: "border-blue-500/50",
      green: "border-green-500/50",
      purple: "border-purple-500/50",
      orange: "border-orange-500/50",
      pink: "border-pink-500/50",
      cyan: "border-cyan-500/50",
      yellow: "border-yellow-500/50",
      red: "border-red-500/50",
    };
    return colorMap[color || "blue"] || colorMap.blue;
  };

  const getColorDotClass = (color: string | null) => {
    const colorMap: Record<string, string> = {
      blue: "bg-blue-500",
      green: "bg-green-500",
      purple: "bg-purple-500",
      orange: "bg-orange-500",
      pink: "bg-pink-500",
      cyan: "bg-cyan-500",
      yellow: "bg-yellow-500",
      red: "bg-red-500",
    };
    return colorMap[color || "blue"] || colorMap.blue;
  };

  const watchedCount = resources.filter(r => r.is_watched).length;

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className={cn("glass-card border-l-4", getColorClass(group.color))}>
          {/* Group Header */}
          <CollapsibleTrigger asChild>
            <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-secondary/30 transition-colors">
              <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab shrink-0" />
              
              {isOpen ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              )}

              <div className={cn("w-3 h-3 rounded-full shrink-0", getColorDotClass(group.color))} />

              {isEditing ? (
                <div className="flex items-center gap-2 flex-1" onClick={(e) => e.stopPropagation()}>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-8 text-sm"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSave();
                      if (e.key === "Escape") {
                        setEditName(group.name);
                        setIsEditing(false);
                      }
                    }}
                  />
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={handleSave}>
                    <Check className="w-4 h-4 text-success" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => {
                      setEditName(group.name);
                      setIsEditing(false);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {group.is_playlist ? (
                      <ListVideo className="w-4 h-4 text-muted-foreground shrink-0" />
                    ) : (
                      <Video className="w-4 h-4 text-muted-foreground shrink-0" />
                    )}
                    <span className="font-medium text-foreground truncate">{group.name}</span>
                    <span className="text-sm text-muted-foreground shrink-0">
                      ({resources.length} videos{watchedCount > 0 ? `, ${watchedCount} watched` : ""})
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setIsEditing(true)}
                      title="Edit group name"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setShowDeleteDialog(true)}
                      title="Delete group"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          </CollapsibleTrigger>

          {/* Group Content with Droppable */}
          <CollapsibleContent>
            <Droppable droppableId={group.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={cn(
                    "p-4 pt-0 space-y-2 min-h-[60px] transition-colors",
                    snapshot.isDraggingOver && "bg-primary/5"
                  )}
                >
                  {resources.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {snapshot.isDraggingOver 
                        ? "Drop here to add to this group" 
                        : "No videos in this group yet. Drag videos here or add new ones."}
                    </p>
                  ) : (
                    resources.map((resource, index) => (
                      <Draggable key={resource.id} draggableId={resource.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <ResourceCard
                              resource={resource}
                              roadmapId={roadmapId}
                              groups={allGroups}
                              onPlay={onPlayResource}
                              isDragging={snapshot.isDragging}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))
                  )}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Group</AlertDialogTitle>
            <AlertDialogDescription>
              {resources.length > 0 ? (
                <>
                  Are you sure you want to delete "{group.name}"? 
                  <br /><br />
                  <strong>{resources.length} video(s)</strong> in this group will be moved to "Ungrouped".
                </>
              ) : (
                <>Are you sure you want to delete "{group.name}"?</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Group
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};