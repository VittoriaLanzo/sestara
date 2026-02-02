import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAddPlaylist } from "@/hooks/useRoadmapResources";
import { Loader2, ListVideo } from "lucide-react";

interface AddPlaylistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roadmapId: string;
}

export const AddPlaylistDialog = ({ open, onOpenChange, roadmapId }: AddPlaylistDialogProps) => {
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [groupName, setGroupName] = useState("");

  const addPlaylist = useAddPlaylist();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playlistUrl.trim()) return;

    await addPlaylist.mutateAsync({
      roadmapId,
      playlistUrl: playlistUrl.trim(),
      groupName: groupName.trim() || undefined,
    });

    setPlaylistUrl("");
    setGroupName("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListVideo className="w-5 h-5 text-primary" />
            Add YouTube Playlist
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="playlist-url">Playlist Link *</Label>
            <Input
              id="playlist-url"
              placeholder="https://youtube.com/playlist?list=..."
              value={playlistUrl}
              onChange={(e) => setPlaylistUrl(e.target.value)}
              required
            />
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
              Leave empty to use the playlist ID as the group name
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={addPlaylist.isPending || !playlistUrl.trim()}>
              {addPlaylist.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Adding...
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
