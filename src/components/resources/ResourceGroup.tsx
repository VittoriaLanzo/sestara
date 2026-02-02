import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ResourceGroup as ResourceGroupType, 
  RoadmapResource, 
  useUpdateGroup, 
  useDeleteGroup 
} from "@/hooks/useRoadmapResources";
import { ResourceCard } from "./ResourceCard";
import { ChevronDown, ChevronRight, Pencil, Trash2, Check, X, GripVertical, ListVideo } from "lucide-react";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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
    if (confirm(`Delete group "${group.name}"? Videos will be moved to ungrouped.`)) {
      deleteGroup.mutate({ id: group.id, roadmapId });
    }
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

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className={cn("glass-card border-l-4", getColorClass(group.color))}>
        {/* Group Header */}
        <CollapsibleTrigger asChild>
          <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-secondary/30 transition-colors">
            <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
            
            {isOpen ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}

            <div className={cn("w-3 h-3 rounded-full", getColorDotClass(group.color))} />

            {isEditing ? (
              <div className="flex items-center gap-2 flex-1" onClick={(e) => e.stopPropagation()}>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-8 text-sm"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSave();
                    if (e.key === "Escape") setIsEditing(false);
                  }}
                />
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSave}>
                  <Check className="w-4 h-4 text-success" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setIsEditing(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 flex-1">
                  {group.is_playlist && <ListVideo className="w-4 h-4 text-muted-foreground" />}
                  <span className="font-medium text-foreground">{group.name}</span>
                  <span className="text-sm text-muted-foreground">({resources.length} videos)</span>
                </div>

                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setIsEditing(true)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={handleDelete}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </CollapsibleTrigger>

        {/* Group Content */}
        <CollapsibleContent>
          <div className="p-4 pt-0 space-y-2">
            {resources.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No videos in this group yet
              </p>
            ) : (
              resources.map((resource) => (
                <ResourceCard
                  key={resource.id}
                  resource={resource}
                  roadmapId={roadmapId}
                  groups={allGroups}
                  onPlay={onPlayResource}
                />
              ))
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};
