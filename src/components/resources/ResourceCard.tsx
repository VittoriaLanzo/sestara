import { useState } from "react";
import { RoadmapResource, ResourceGroup } from "@/hooks/useRoadmapResources";
import { extractYouTubeVideoId, getYouTubeThumbnail } from "@/lib/youtube-utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Play,
  MoreVertical,
  Check,
  Heart,
  ExternalLink,
  Trash2,
  Edit,
  GripVertical,
  Eye,
  EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Draggable } from "@hello-pangea/dnd";

interface ResourceCardProps {
  resource: RoadmapResource;
  group?: ResourceGroup;
  index: number;
  onPlay: (resource: RoadmapResource) => void;
  onToggleWatched: (id: string, watched: boolean) => void;
  onToggleFavorite: (id: string, favorite: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (resource: RoadmapResource) => void;
  roadmapId: string;
}

export const ResourceCard = ({
  resource,
  group,
  index,
  onPlay,
  onToggleWatched,
  onToggleFavorite,
  onDelete,
  onEdit,
  roadmapId,
}: ResourceCardProps) => {
  const [imageError, setImageError] = useState(false);

  const videoId = extractYouTubeVideoId(resource.url);
  const thumbnailUrl =
    resource.thumbnail_url ||
    (videoId ? getYouTubeThumbnail(videoId, "medium") : null);

  const handleOpenExternal = () => {
    window.open(resource.url, "_blank");
  };

  return (
    <Draggable draggableId={resource.id} index={index}>
      {(provided, snapshot) => (
        <motion.div
          ref={provided.innerRef}
          {...provided.draggableProps}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className={cn(
            "group relative glass-card overflow-hidden hover-lift transition-all",
            snapshot.isDragging && "shadow-lg ring-2 ring-primary/50",
            resource.is_watched && "opacity-75"
          )}
        >
          {/* Drag Handle */}
          <div
            {...provided.dragHandleProps}
            className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
          >
            <div className="p-1 rounded bg-background/80 backdrop-blur-sm">
              <GripVertical className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>

          {/* Thumbnail */}
          <div className="relative aspect-video bg-muted">
            {thumbnailUrl && !imageError ? (
              <img
                src={thumbnailUrl}
                alt={resource.title}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <Play className="w-12 h-12 text-muted-foreground" />
              </div>
            )}

            {/* Play overlay */}
            <button
              onClick={() => onPlay(resource)}
              className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <div className="p-3 rounded-full bg-primary text-primary-foreground">
                <Play className="w-6 h-6" fill="currentColor" />
              </div>
            </button>

            {/* Duration badge */}
            {resource.duration && (
              <Badge
                variant="secondary"
                className="absolute bottom-2 right-2 bg-black/70 text-white text-xs"
              >
                {resource.duration}
              </Badge>
            )}

            {/* Watched indicator */}
            {resource.is_watched && (
              <div className="absolute top-2 right-2">
                <Badge variant="default" className="bg-success text-success-foreground">
                  <Check className="w-3 h-3 mr-1" />
                  Watched
                </Badge>
              </div>
            )}

            {/* Favorite indicator */}
            {resource.is_favorite && (
              <div className="absolute top-2 right-2">
                <Heart className="w-5 h-5 text-red-500 fill-red-500" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm line-clamp-2 text-foreground">
                  {resource.title}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  {group && (
                    <Badge variant="outline" className="text-xs">
                      {group.name}
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {new Date(resource.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onPlay(resource)}>
                    <Play className="w-4 h-4 mr-2" />
                    Play
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      onToggleWatched(resource.id, !resource.is_watched)
                    }
                  >
                    {resource.is_watched ? (
                      <>
                        <EyeOff className="w-4 h-4 mr-2" />
                        Mark Unwatched
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 mr-2" />
                        Mark Watched
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      onToggleFavorite(resource.id, !resource.is_favorite)
                    }
                  >
                    <Heart
                      className={cn(
                        "w-4 h-4 mr-2",
                        resource.is_favorite && "fill-red-500 text-red-500"
                      )}
                    />
                    {resource.is_favorite ? "Remove Favorite" : "Add to Favorites"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleOpenExternal}>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open in Browser
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit(resource)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDelete(resource.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {resource.notes && (
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                {resource.notes}
              </p>
            )}
          </div>
        </motion.div>
      )}
    </Draggable>
  );
};
