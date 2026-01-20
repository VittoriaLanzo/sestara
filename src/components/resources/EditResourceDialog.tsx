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
import { RoadmapResource, ResourceGroup, useUpdateResource } from "@/hooks/useRoadmapResources";
import { Loader2, Edit } from "lucide-react";

interface EditResourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resource: RoadmapResource | null;
  roadmapId: string;
  groups: ResourceGroup[];
}

export const EditResourceDialog = ({
  open,
  onOpenChange,
  resource,
  roadmapId,
  groups,
}: EditResourceDialogProps) => {
  const [title, setTitle] = useState(resource?.title || "");
  const [notes, setNotes] = useState(resource?.notes || "");
  const [selectedGroup, setSelectedGroup] = useState<string>(resource?.group_id || "none");

  const updateResource = useUpdateResource();

  // Update local state when resource changes
  useState(() => {
    if (resource) {
      setTitle(resource.title);
      setNotes(resource.notes || "");
      setSelectedGroup(resource.group_id || "none");
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!resource) return;

    updateResource.mutate(
      {
        id: resource.id,
        roadmapId,
        title: title.trim(),
        notes: notes.trim() || null,
        group_id: selectedGroup === "none" ? null : selectedGroup,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  if (!resource) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5" />
            Edit Resource
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Title</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={updateResource.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label>Group / Category</Label>
            <Select value={selectedGroup} onValueChange={setSelectedGroup}>
              <SelectTrigger>
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-notes">Notes</Label>
            <Textarea
              id="edit-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={updateResource.isPending}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateResource.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateResource.isPending}>
              {updateResource.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
