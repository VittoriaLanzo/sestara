import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateResource, useCreateResourceGroup, ResourceGroup } from "@/hooks/useRoadmapResources";
import { extractYouTubeVideoId, getYouTubeThumbnail } from "@/lib/youtube-utils";
import { Loader2, Youtube, Plus } from "lucide-react";
import { toast } from "sonner";

interface AddVideoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roadmapId: string;
  groups: ResourceGroup[];
}

export const AddVideoDialog = ({
  open,
  onOpenChange,
  roadmapId,
  groups,
}: AddVideoDialogProps) => {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string>("none");
  const [newGroupName, setNewGroupName] = useState("");
  const [showNewGroup, setShowNewGroup] = useState(false);

  const createResource = useCreateResource();
  const createGroup = useCreateResourceGroup();

  const isValidYouTubeUrl = (url: string) => {
    return extractYouTubeVideoId(url) !== null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!url.trim()) {
      toast.error("YouTube URL is required");
      return;
    }

    if (!isValidYouTubeUrl(url)) {
      toast.error("Please enter a valid YouTube video URL");
      return;
    }

    const videoId = extractYouTubeVideoId(url);
    const thumbnailUrl = videoId ? getYouTubeThumbnail(videoId) : null;

    let groupId: string | null = null;

    // If creating a new group
    if (showNewGroup && newGroupName.trim()) {
      try {
        const newGroup = await createGroup.mutateAsync({
          roadmapId,
          name: newGroupName.trim(),
        });
        groupId = newGroup.id;
      } catch {
        return;
      }
    } else if (selectedGroup !== "none") {
      groupId = selectedGroup;
    }

    createResource.mutate(
      {
        roadmapId,
        groupId,
        title: title.trim() || `Video ${new Date().toLocaleDateString()}`,
        url: url.trim(),
        resourceType: "video",
        thumbnailUrl,
        notes: notes.trim() || null,
      },
      {
        onSuccess: () => {
          setTitle("");
          setUrl("");
          setNotes("");
          setSelectedGroup("none");
          setNewGroupName("");
          setShowNewGroup(false);
          onOpenChange(false);
        },
      }
    );
  };

  const isLoading = createResource.isPending || createGroup.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Youtube className="w-5 h-5 text-red-500" />
            Add YouTube Video
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">YouTube URL *</Label>
            <Input
              id="url"
              placeholder="https://www.youtube.com/watch?v=..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title (optional)</Label>
            <Input
              id="title"
              placeholder="Video title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label>Group / Category (optional)</Label>
            {!showNewGroup ? (
              <div className="flex gap-2">
                <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No group</SelectItem>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowNewGroup(true)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="New group name"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowNewGroup(false);
                    setNewGroupName("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this video..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isLoading}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Video"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
