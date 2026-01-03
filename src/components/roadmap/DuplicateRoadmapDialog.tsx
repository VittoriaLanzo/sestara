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
import { Label } from "@/components/ui/label";
import { Copy } from "lucide-react";

interface DuplicateRoadmapDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  originalTitle: string;
  onDuplicate: (newTitle: string) => Promise<void>;
}

export const DuplicateRoadmapDialog = ({
  open,
  onOpenChange,
  originalTitle,
  onDuplicate,
}: DuplicateRoadmapDialogProps) => {
  const [title, setTitle] = useState(`${originalTitle} (Copy)`);
  const [isDuplicating, setIsDuplicating] = useState(false);

  const handleDuplicate = async () => {
    if (!title.trim()) return;

    setIsDuplicating(true);
    try {
      await onDuplicate(title.trim());
      onOpenChange(false);
    } finally {
      setIsDuplicating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="w-5 h-5" />
            Duplicate Roadmap
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Create a copy of this roadmap with all subjects and topics.
          </p>

          <div className="space-y-2">
            <Label htmlFor="new-title">New Roadmap Title</Label>
            <Input
              id="new-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter new roadmap title..."
              autoFocus
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDuplicating}>
            Cancel
          </Button>
          <Button onClick={handleDuplicate} disabled={isDuplicating || !title.trim()}>
            {isDuplicating ? "Duplicating..." : "Duplicate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
