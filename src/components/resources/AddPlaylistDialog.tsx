import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAddPlaylist } from "@/hooks/useRoadmapResources";
import { Loader2, ListVideo, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AddPlaylistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roadmapId: string;
}

export const AddPlaylistDialog = ({ open, onOpenChange, roadmapId }: AddPlaylistDialogProps) => {
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [groupName, setGroupName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const addPlaylist = useAddPlaylist();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playlistUrl.trim()) return;

    setError(null);

    try {
      await addPlaylist.mutateAsync({
        roadmapId,
        playlistUrl: playlistUrl.trim(),
        groupName: groupName.trim() || undefined,
      });

      setPlaylistUrl("");
      setGroupName("");
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || "Failed to add playlist. Please try again.");
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setError(null);
      setPlaylistUrl("");
      setGroupName("");
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListVideo className="w-5 h-5 text-primary" />
            Add YouTube Playlist
          </DialogTitle>
          <DialogDescription>
            Add a YouTube playlist and all its videos will be automatically imported.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="playlist-url">Playlist Link *</Label>
            <Input
              id="playlist-url"
              placeholder="https://youtube.com/playlist?list=..."
              value={playlistUrl}
              onChange={(e) => setPlaylistUrl(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Paste a YouTube playlist URL. Public playlists work best.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="group-name">Group Name (optional)</Label>
            <Input
              id="group-name"
              placeholder="Custom name for this playlist group"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to auto-generate based on video count
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={addPlaylist.isPending || !playlistUrl.trim()}>
              {addPlaylist.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Fetching Videos...
                </>
              ) : (
                "Add Playlist"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};