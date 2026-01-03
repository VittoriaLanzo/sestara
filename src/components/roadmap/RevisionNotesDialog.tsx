import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";

interface RevisionNotesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topicTitle: string;
  currentNotes: string | null;
  onSave: (notes: string) => Promise<void>;
}

export const RevisionNotesDialog = ({
  open,
  onOpenChange,
  topicTitle,
  currentNotes,
  onSave,
}: RevisionNotesDialogProps) => {
  const [notes, setNotes] = useState(currentNotes || "");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setNotes(currentNotes || "");
  }, [currentNotes, open]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(notes);
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            Revision Notes
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Add notes for revising <span className="font-medium text-foreground">{topicTitle}</span>
          </p>

          <div className="space-y-2">
            <Label htmlFor="revision-notes">What needs revision?</Label>
            <Textarea
              id="revision-notes"
              placeholder="e.g., Need to review key concepts, practice more problems, clarify doubts about..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Notes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
