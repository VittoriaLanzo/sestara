import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
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
import { RoadmapResource, ResourceGroup, useUpdateResource, useDeleteResource } from "@/hooks/useRoadmapResources";
import { EditVideoDialog } from "./EditVideoDialog";
import { 
  Play, 
  MoreVertical, 
  Heart, 
  CheckCircle2, 
  ExternalLink,
  Trash2,
  GripVertical,
  Pencil,
  Globe
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";

interface ResourceCardProps {
  resource: RoadmapResource;
  roadmapId: string;
  groups: ResourceGroup[];
  onPlay: (resource: RoadmapResource) => void;
  isDragging?: boolean;
}

export const ResourceCard = ({ resource, roadmapId, groups, onPlay, isDragging }: ResourceCardProps) => {
  const updateResource = useUpdateResource();
  const deleteResource = useDeleteResource();
  const [imageError, setImageError] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const group = groups.find((g) => g.id === resource.group_id);

  const toggleWatched = () => {
    updateResource.mutate({
      id: resource.id,
      roadmapId,
      updates: { is_watched: !resource.is_watched },
    });
    toast.success(resource.is_watched ? "Marked as unwatched" : "Marked as watched");
  };

  const toggleFavorite = () => {
    updateResource.mutate({
      id: resource.id,
      roadmapId,
      updates: { is_favorite: !resource.is_favorite },
    });
    toast.success(resource.is_favorite ? "Removed from favorites" : "Added to favorites");
  };

  const handleDelete = () => {
    deleteResource.mutate({ id: resource.id, roadmapId });
    setShowDeleteDialog(false);
  };

  const openInBrowser = () => {
    window.open(resource.url, "_blank", "noopener,noreferrer");
    toast.success("Opening in browser...");
  };

  const getColorClass = (color: string | null) => {
    const colorMap: Record<string, string> = {
      blue: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      green: "bg-green-500/20 text-green-400 border-green-500/30",
      purple: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      orange: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      pink: "bg-pink-500/20 text-pink-400 border-pink-500/30",
      cyan: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
      yellow: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      red: "bg-red-500/20 text-red-400 border-red-500/30",
    };
    return colorMap[color || "blue"] || colorMap.blue;
  };

  return (
    <>
      <div
        className={cn(
          "glass-card p-3 flex gap-3 items-start group transition-all",
          isDragging && "opacity-50 scale-95",
          resource.is_watched && "opacity-70"
        )}
      >
        {/* Drag Handle */}
        <div className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground mt-2 shrink-0">
          <GripVertical className="w-4 h-4" />
        </div>

        {/* Thumbnail */}
        <div className="relative shrink-0">
          <div 
            className="w-28 sm:w-32 h-16 sm:h-20 rounded-lg bg-secondary overflow-hidden cursor-pointer"
            onClick={() => onPlay(resource)}
          >
            {resource.thumbnail_url && !imageError ? (
              <img
                src={resource.thumbnail_url}
                alt={resource.title}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Play className="w-6 h-6 text-muted-foreground" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Play className="w-6 h-6 text-white" />
            </div>
          </div>
          {resource.is_watched && (
            <div className="absolute -top-1 -right-1">
              <CheckCircle2 className="w-4 h-4 text-success" />
            </div>
          )}
          {resource.is_favorite && (
            <div className="absolute -top-1 -left-1">
              <Heart className="w-4 h-4 text-destructive fill-destructive" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1">
          <h4 
            className="font-medium text-foreground text-sm sm:text-base line-clamp-2 cursor-pointer hover:text-primary transition-colors"
            onClick={() => onPlay(resource)}
          >
            {resource.title}
          </h4>
          
          <div className="flex items-center gap-2 flex-wrap">
            {resource.duration && (
              <span className="text-xs text-muted-foreground">{resource.duration}</span>
            )}
            <span className="text-xs text-muted-foreground">
              {format(new Date(resource.created_at), "MMM d, yyyy")}
            </span>
          </div>

          {group && (
            <Badge variant="outline" className={cn("text-xs", getColorClass(group.color))}>
              {group.name}
            </Badge>
          )}

          {resource.notes && (
            <p className="text-xs text-muted-foreground line-clamp-1">{resource.notes}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={toggleFavorite}
            title={resource.is_favorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart className={cn(
              "w-4 h-4",
              resource.is_favorite 
                ? "text-destructive fill-destructive" 
                : "text-muted-foreground hover:text-destructive"
            )} />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onPlay(resource)}>
                <Play className="w-4 h-4 mr-2" />
                Play in App
              </DropdownMenuItem>
              <DropdownMenuItem onClick={openInBrowser}>
                <Globe className="w-4 h-4 mr-2" />
                Open in Browser
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={toggleWatched}>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                {resource.is_watched ? "Mark as Unwatched" : "Mark as Watched"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={toggleFavorite}>
                <Heart className="w-4 h-4 mr-2" />
                {resource.is_favorite ? "Remove from Favorites" : "Add to Favorites"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                <Pencil className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setShowDeleteDialog(true)} 
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Video</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{resource.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <EditVideoDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        resource={resource}
        roadmapId={roadmapId}
        groups={groups}
      />
    </>
  );
};