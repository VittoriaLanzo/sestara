import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface AddItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "subject" | "topic";
  onAdd: (title: string, description: string, estimatedHours?: number) => Promise<void>;
}

export const AddItemDialog = ({
  open,
  onOpenChange,
  type,
  onAdd,
}: AddItemDialogProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async () => {
    if (!title.trim()) return;

    setIsAdding(true);
    try {
      await onAdd(
        title.trim(),
        description.trim(),
        estimatedHours ? parseFloat(estimatedHours) : undefined
      );
      setTitle("");
      setDescription("");
      setEstimatedHours("");
      onOpenChange(false);
    } finally {
      setIsAdding(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.ctrlKey) {
      handleAdd();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New {type === "subject" ? "Subject" : "Topic"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4" onKeyDown={handleKeyDown}>
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder={`Enter ${type} title...`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder={`Brief description of the ${type}...`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          {type === "topic" && (
            <div className="space-y-2">
              <Label htmlFor="hours">Estimated Hours</Label>
              <Input
                id="hours"
                type="number"
                min="0"
                step="0.5"
                placeholder="e.g., 2.5"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isAdding}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={isAdding || !title.trim()}>
            {isAdding ? "Adding..." : `Add ${type === "subject" ? "Subject" : "Topic"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
