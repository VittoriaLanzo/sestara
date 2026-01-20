import { useState } from "react";
import { ResourceGroup, RoadmapResource } from "@/hooks/useRoadmapResources";
import { ResourceCard } from "./ResourceCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  ChevronRight,
  MoreVertical,
  Edit,
  Trash2,
  FolderOpen,
  Folder,
  ListVideo,
  Check,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import { motion } from "framer-motion";

interface ResourceGroupSectionProps {
  group: ResourceGroup;
  resources: RoadmapResource[];
  index: number;
  onPlayVideo: (resource: RoadmapResource) => void;
  onToggleWatched: (id: string, watched: boolean) => void;
  onToggleFavorite: (id: string, favorite: boolean) => void;
  onDeleteResource: (id: string) => void;
  onEditResource: (resource: RoadmapResource) => void;
  onRenameGroup: (id: string, name: string) => void;
  onDeleteGroup: (id: string) => void;
  roadmapId: string;
}

export const ResourceGroupSection = ({
  group,
  resources,
  index,
  onPlayVideo,
  onToggleWatched,
  onToggleFavorite,
  onDeleteResource,
  onEditResource,
  onRenameGroup,
  onDeleteGroup,
  roadmapId,
}: ResourceGroupSectionProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(group.name);

  const watchedCount = resources.filter((r) => r.is_watched).length;

  const handleSaveRename = () => {
    if (editName.trim() && editName.trim() !== group.name) {
      onRenameGroup(group.id, editName.trim());
    }
    setIsEditing(false);
  };

  const handleCancelRename = () => {
    setEditName(group.name);
    setIsEditing(false);
  };

  const colorMap: Record<string, string> = {
    blue: "bg-blue-500/10 text-blue-500 border-blue-500/30",
    red: "bg-red-500/10 text-red-500 border-red-500/30",
    green: "bg-green-500/10 text-green-500 border-green-500/30",
    yellow: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
    purple: "bg-purple-500/10 text-purple-500 border-purple-500/30",
    orange: "bg-orange-500/10 text-orange-500 border-orange-500/30",
  };

  return (
    <Draggable draggableId={`group-${group.id}`} index={index}>
      {(provided, snapshot) => (
        <motion.div
          ref={provided.innerRef}
          {...provided.draggableProps}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className={cn(
            "glass-card overflow-hidden",
            snapshot.isDragging && "shadow-lg ring-2 ring-primary/50"
          )}
        >
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <div
              {...provided.dragHandleProps}
              className="flex items-center gap-3 p-4 cursor-grab active:cursor-grabbing"
            >
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  {isOpen ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </Button>
              </CollapsibleTrigger>

              <div
                className={cn(
                  "p-2 rounded-lg border",
                  colorMap[group.color] || colorMap.blue
                )}
              >
                {group.is_playlist ? (
                  <ListVideo className="w-4 h-4" />
                ) : isOpen ? (
                  <FolderOpen className="w-4 h-4" />
                ) : (
                  <Folder className="w-4 h-4" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-8"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveRename();
                        if (e.key === "Escape") handleCancelRename();
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={handleSaveRename}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={handleCancelRename}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <h3 className="font-semibold text-foreground truncate">
                      {group.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">
                        {resources.length} video{resources.length !== 1 ? "s" : ""}
                      </span>
                      {watchedCount > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {watchedCount} watched
                        </Badge>
                      )}
                    </div>
                  </>
                )}
              </div>

              {!isEditing && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDeleteGroup(group.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Group
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            <CollapsibleContent>
              <Droppable droppableId={`group-${group.id}`} type="resource">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      "p-4 pt-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4",
                      snapshot.isDraggingOver && "bg-primary/5"
                    )}
                  >
                    {resources.length === 0 ? (
                      <p className="col-span-full text-sm text-muted-foreground text-center py-8">
                        No videos in this group yet. Drag videos here or add new ones.
                      </p>
                    ) : (
                      resources.map((resource, idx) => (
                        <ResourceCard
                          key={resource.id}
                          resource={resource}
                          group={group}
                          index={idx}
                          onPlay={onPlayVideo}
                          onToggleWatched={onToggleWatched}
                          onToggleFavorite={onToggleFavorite}
                          onDelete={onDeleteResource}
                          onEdit={onEditResource}
                          roadmapId={roadmapId}
                        />
                      ))
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </CollapsibleContent>
          </Collapsible>
        </motion.div>
      )}
    </Draggable>
  );
};
