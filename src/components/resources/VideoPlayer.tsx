import { useState } from "react";
import { RoadmapResource } from "@/hooks/useRoadmapResources";
import { extractYouTubeVideoId, getYouTubeEmbedUrl, getYouTubeWatchUrl } from "@/lib/youtube-utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Maximize2,
  Minimize2,
  SkipBack,
  SkipForward,
  Check,
  Heart,
  ExternalLink,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface VideoPlayerProps {
  currentVideo: RoadmapResource | null;
  playlist: RoadmapResource[];
  onClose: () => void;
  onToggleWatched: (id: string, watched: boolean) => void;
  onToggleFavorite: (id: string, favorite: boolean) => void;
  onPlayVideo: (resource: RoadmapResource) => void;
  groupName?: string;
}

export const VideoPlayer = ({
  currentVideo,
  playlist,
  onClose,
  onToggleWatched,
  onToggleFavorite,
  onPlayVideo,
  groupName,
}: VideoPlayerProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  if (!currentVideo) return null;

  const videoId = extractYouTubeVideoId(currentVideo.url);
  if (!videoId) return null;

  const currentIndex = playlist.findIndex((v) => v.id === currentVideo.id);
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < playlist.length - 1;

  const handlePrevious = () => {
    if (hasPrevious) {
      onPlayVideo(playlist[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (hasNext) {
      onPlayVideo(playlist[currentIndex + 1]);
    }
  };

  const handleOpenExternal = () => {
    window.open(getYouTubeWatchUrl(videoId), "_blank");
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className={cn(
          "fixed z-50 bg-background border rounded-t-xl shadow-2xl transition-all duration-300",
          isFullscreen
            ? "inset-0 rounded-none"
            : isMinimized
            ? "bottom-0 right-4 w-80"
            : "bottom-0 left-0 right-0 md:left-4 md:right-4 md:max-w-4xl md:mx-auto"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b bg-muted/50">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {groupName && (
              <Badge variant="secondary" className="shrink-0">
                {groupName}
              </Badge>
            )}
            <h3 className="font-medium text-sm truncate">{currentVideo.title}</h3>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              {isMinimized ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Video Player */}
        {!isMinimized && (
          <>
            <div
              className={cn(
                "relative bg-black",
                isFullscreen ? "flex-1" : "aspect-video"
              )}
              style={isFullscreen ? { height: "calc(100vh - 120px)" } : {}}
            >
              <iframe
                src={getYouTubeEmbedUrl(videoId)}
                title={currentVideo.title}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between p-3 border-t bg-muted/30">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevious}
                  disabled={!hasPrevious}
                >
                  <SkipBack className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNext}
                  disabled={!hasNext}
                >
                  Next
                  <SkipForward className="w-4 h-4 ml-1" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant={currentVideo.is_watched ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    onToggleWatched(currentVideo.id, !currentVideo.is_watched)
                  }
                >
                  <Check className="w-4 h-4 mr-1" />
                  {currentVideo.is_watched ? "Watched" : "Mark Watched"}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() =>
                    onToggleFavorite(currentVideo.id, !currentVideo.is_favorite)
                  }
                >
                  <Heart
                    className={cn(
                      "w-4 h-4",
                      currentVideo.is_favorite && "fill-red-500 text-red-500"
                    )}
                  />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleOpenExternal}
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Minimized state - show thumbnail */}
        {isMinimized && (
          <div
            className="p-2 cursor-pointer"
            onClick={() => setIsMinimized(false)}
          >
            <div className="flex items-center gap-2">
              <img
                src={currentVideo.thumbnail_url || ""}
                alt={currentVideo.title}
                className="w-16 h-10 object-cover rounded"
              />
              <p className="text-xs text-muted-foreground truncate flex-1">
                {currentVideo.title}
              </p>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
