import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpdateResource, RoadmapResource, ResourceGroup } from "@/hooks/useRoadmapResources";
import { Loader2, Pencil } from "lucide-react";

interface EditVideoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resource: RoadmapResource;
  roadmapId: string;
  groups: ResourceGroup[];
}

export const EditVideoDialog = ({ 
  open, 
  onOpenChange, 
  resource, 
  roadmapId, 
  groups 
}: EditVideoDialogProps) => {
  const [title, setTitle] = useState(resource.title);
  const [notes, setNotes] = useState(resource.notes || "");
  const [groupId, setGroupId] = useState<string>(resource.group_id || "none");

  const updateResource = useUpdateResource();

  useEffect(() => {
    if (open) {
      setTitle(resource.title);
      setNotes(resource.notes || "");
      setGroupId(resource.group_id || "none");
    }
  }, [open, resource]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    await updateResource.mutateAsync({
      id: resource.id,
      roadmapId,
      updates: {
        title: title.trim(),
        notes: notes.trim() || null,
        group_id: groupId === "none" ? null : groupId,
      },
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="w-5 h-5 text-primary" />
            Edit Video
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Title *</Label>
            <Input
              id="edit-title"
              placeholder="Video title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-notes">Notes</Label>
            <Textarea
              id="edit-notes"
              placeholder="Add notes about this video..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Group</Label>
            <Select value={groupId} onValueChange={setGroupId}>
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateResource.isPending || !title.trim()}>
              {updateResource.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};