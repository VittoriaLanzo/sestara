import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RoadmapResource, useUpdateResource } from "@/hooks/useRoadmapResources";
import { VideoStudyBuddy } from "@/components/topic/VideoStudyBuddy";
import { useAuth } from "@/hooks/useAuth";
import { 
   X, 
   Maximize2, 
   Minimize2, 
   SkipBack, 
   SkipForward, 
   CheckCircle2,
   Heart,
   Bot
} from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoPlayerProps {
  resource: RoadmapResource;
  roadmapId: string;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

const extractVideoId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

export const VideoPlayer = ({
  resource,
  roadmapId,
  onClose,
  onNext,
  onPrevious,
  hasNext,
  hasPrevious,
}: VideoPlayerProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const updateResource = useUpdateResource();
  const { user } = useAuth();

  const videoId = extractVideoId(resource.url);

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Fallback silently if fullscreen not supported
    }
  }, []);

  useEffect(() => {
    const handleChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleChange);
    return () => document.removeEventListener("fullscreenchange", handleChange);
  }, []);

  const toggleWatched = () => {
    updateResource.mutate({
      id: resource.id,
      roadmapId,
      updates: { is_watched: !resource.is_watched },
    });
  };

  const toggleFavorite = () => {
    updateResource.mutate({
      id: resource.id,
      roadmapId,
      updates: { is_favorite: !resource.is_favorite },
    });
  };

  if (!videoId) {
    return (
      <div className="glass-card p-6 text-center">
        <p className="text-muted-foreground">Unable to play this video. Invalid URL.</p>
        <Button variant="outline" onClick={onClose} className="mt-4">
          Close
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Video + Chat side by side on desktop, stacked on mobile */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Video Player Card */}
        <div
          ref={containerRef}
          className="glass-card overflow-hidden transition-all duration-300 lg:flex-1 lg:min-w-0 relative bg-background"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-border">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate">{resource.title}</h3>
              <p className="text-xs text-muted-foreground">Now Playing</p>
            </div>

            <div className="flex items-center gap-1">
              {user && !isFullscreen && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 relative"
                  onClick={() => setShowChat(prev => !prev)}
                  title={showChat ? "Hide StudyBuddy" : "Show StudyBuddy"}
                >
                  <div className={cn(
                    "p-1 rounded-md",
                    showChat ? "bg-primary" : "bg-muted"
                  )}>
                    <Bot className={cn("w-3.5 h-3.5", showChat ? "text-accent" : "text-muted-foreground")} />
                  </div>
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleFavorite}>
                <Heart
                  className={cn(
                    "w-4 h-4",
                    resource.is_favorite ? "text-destructive fill-destructive" : "text-muted-foreground"
                  )}
                />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleWatched}>
                <CheckCircle2
                  className={cn(
                    "w-4 h-4",
                    resource.is_watched ? "text-success" : "text-muted-foreground"
                  )}
                />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={toggleFullscreen}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Video */}
          <div className={cn("relative bg-black", isFullscreen ? "h-[calc(100%-120px)]" : "aspect-video")}>
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
              title={resource.title}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              sandbox="allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation allow-autoplay"
            />
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between p-3 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={onPrevious}
              disabled={!hasPrevious}
              className="gap-2"
            >
              <SkipBack className="w-4 h-4" />
              Previous
            </Button>

            <Button variant="default" size="sm" onClick={toggleWatched}>
              {resource.is_watched ? "Mark as Unwatched" : "Mark as Watched"}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onNext}
              disabled={!hasNext}
              className="gap-2"
            >
              Next
              <SkipForward className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* StudyBuddy Chat Panel */}
        {user && !isFullscreen && showChat && (
          <div className="lg:w-[380px] lg:shrink-0">
            <VideoStudyBuddy
              videoId={videoId}
              videoTitle={resource.title}
              videoUrl={resource.url}
              userId={user.id}
            />
          </div>
        )}
      </div>
    </div>
  );
};
