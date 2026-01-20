import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateResource, useCreateResourceGroup } from "@/hooks/useRoadmapResources";
import { extractYouTubePlaylistId, extractYouTubeVideoId, getYouTubeThumbnail } from "@/lib/youtube-utils";
import { Loader2, ListVideo, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface AddPlaylistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roadmapId: string;
}

interface PlaylistVideo {
  videoId: string;
  title: string;
  thumbnail: string;
  position: number;
}

export const AddPlaylistDialog = ({
  open,
  onOpenChange,
  roadmapId,
}: AddPlaylistDialogProps) => {
  const [url, setUrl] = useState("");
  const [groupName, setGroupName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [videos, setVideos] = useState<PlaylistVideo[]>([]);
  const [step, setStep] = useState<"input" | "preview">("input");

  const createResource = useCreateResource();
  const createGroup = useCreateResourceGroup();

  const isValidPlaylistUrl = (url: string) => {
    return extractYouTubePlaylistId(url) !== null;
  };

  const fetchPlaylistVideos = async () => {
    if (!url.trim()) {
      toast.error("Playlist URL is required");
      return;
    }

    if (!isValidPlaylistUrl(url)) {
      toast.error("Please enter a valid YouTube playlist URL");
      return;
    }

    setIsLoading(true);

    try {
      // Extract playlist ID
      const playlistId = extractYouTubePlaylistId(url);
      
      // Since we can't fetch playlist data without API key,
      // we'll create a placeholder and let users add videos manually
      // or we can parse common playlist page patterns
      
      // For now, create a group for the playlist
      toast.info("Playlist added! You can now add individual videos to this group.");
      
      setStep("preview");
      setVideos([]);
    } catch (error) {
      console.error("Error fetching playlist:", error);
      toast.error("Failed to fetch playlist. Try adding videos individually.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!groupName.trim()) {
      toast.error("Please enter a name for this playlist group");
      return;
    }

    setIsLoading(true);

    try {
      // Create a group for the playlist
      const group = await createGroup.mutateAsync({
        roadmapId,
        name: groupName.trim(),
        isPlaylist: true,
        playlistUrl: url.trim(),
        color: "red",
      });

      // If we have videos, add them
      for (const video of videos) {
        await createResource.mutateAsync({
          roadmapId,
          groupId: group.id,
          title: video.title,
          url: `https://www.youtube.com/watch?v=${video.videoId}`,
          resourceType: "video",
          thumbnailUrl: video.thumbnail,
        });
      }

      toast.success(`Playlist "${groupName}" created successfully!`);
      resetAndClose();
    } catch (error) {
      console.error("Error saving playlist:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetAndClose = () => {
    setUrl("");
    setGroupName("");
    setVideos([]);
    setStep("input");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListVideo className="w-5 h-5 text-red-500" />
            Add YouTube Playlist
          </DialogTitle>
          <DialogDescription>
            Create a group for your playlist and add videos to it.
          </DialogDescription>
        </DialogHeader>

        {step === "input" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="playlist-url">Playlist URL</Label>
              <Input
                id="playlist-url"
                placeholder="https://www.youtube.com/playlist?list=..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="group-name">Playlist Name *</Label>
              <Input
                id="group-name"
                placeholder="e.g., Math Concepts, PYQ Solutions"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="bg-muted/50 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p>
                  This will create a group for your playlist. You can then add
                  individual videos to this group by copying video URLs.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={resetAndClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isLoading || !groupName.trim()}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Playlist Group"
                )}
              </Button>
            </div>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="group-name-preview">Playlist Name *</Label>
              <Input
                id="group-name-preview"
                placeholder="Enter playlist name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {videos.length > 0 ? (
              <div className="max-h-60 overflow-y-auto space-y-2">
                {videos.map((video) => (
                  <div
                    key={video.videoId}
                    className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
                  >
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-20 h-12 object-cover rounded"
                    />
                    <span className="text-sm flex-1 line-clamp-2">{video.title}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No videos found. The group will be created and you can add videos manually.
              </p>
            )}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("input")}
                disabled={isLoading}
              >
                Back
              </Button>
              <Button onClick={handleSave} disabled={isLoading || !groupName.trim()}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  `Create Playlist${videos.length > 0 ? ` (${videos.length} videos)` : ""}`
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
