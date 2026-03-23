import { useState, useEffect, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Pencil,
  Check,
  Trash2,
  StickyNote,
  FileText,
  ListChecks,
  MessageSquarePlus,
  Bookmark,
  ChevronLeft,
  Download,
  Loader2,
  Inbox,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import { toast } from "sonner";

export interface Artifact {
  id: string;
  artifact_type: string;
  title: string;
  content: string;
  source_message: string | null;
  message_index: number;
  created_at: string;
  updated_at: string;
}

interface ArtifactWorkspaceProps {
  videoId: string;
  userId: string;
  artifacts: Artifact[];
  onArtifactsChange: () => void;
  onClose: () => void;
  activeArtifactId?: string | null;
}

const typeConfig: Record<string, { icon: React.ElementType; label: string; badgeVariant: string }> = {
  notes: { icon: StickyNote, label: "Notes", badgeVariant: "bg-accent/15 text-accent" },
  summary: { icon: FileText, label: "Summary", badgeVariant: "bg-primary/15 text-primary" },
  action_items: { icon: ListChecks, label: "Action Items", badgeVariant: "bg-primary/15 text-primary" },
  follow_up: { icon: MessageSquarePlus, label: "Follow-Up", badgeVariant: "bg-accent/15 text-accent" },
  snippet: { icon: Bookmark, label: "Snippet", badgeVariant: "bg-muted text-muted-foreground" },
};

export const ArtifactWorkspace = forwardRef<HTMLDivElement, ArtifactWorkspaceProps>(({
  videoId,
  userId,
  artifacts,
  onArtifactsChange,
  onClose,
  activeArtifactId,
}, ref) => {
  const [selectedId, setSelectedId] = useState<string | null>(activeArtifactId || null);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (activeArtifactId) setSelectedId(activeArtifactId);
  }, [activeArtifactId]);

  const selected = artifacts.find((a) => a.id === selectedId);

  const startEdit = () => {
    if (!selected) return;
    setEditTitle(selected.title);
    setEditContent(selected.content);
    setEditing(true);
  };

  const saveEdit = async () => {
    if (!selected) return;
    setSaving(true);
    const { error } = await supabase
      .from("video_chat_artifacts" as any)
      .update({ title: editTitle, content: editContent } as any)
      .eq("id", selected.id);
    setSaving(false);
    if (error) {
      toast.error("Failed to save");
    } else {
      setEditing(false);
      onArtifactsChange();
      toast.success("Saved");
    }
  };

  const cancelEdit = () => {
    setEditing(false);
  };

  const deleteArtifact = async (id: string) => {
    await supabase.from("video_chat_artifacts" as any).delete().eq("id", id);
    if (selectedId === id) { setSelectedId(null); setEditing(false); }
    onArtifactsChange();
    toast.success("Deleted");
  };

  const exportArtifact = (artifact: Artifact) => {
    const blob = new Blob([`# ${artifact.title}\n\n${artifact.content}`], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${artifact.title.replace(/[^a-zA-Z0-9]/g, "_")}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported as markdown");
  };

  // List view
  if (!selected) {
    return (
      <div ref={ref} className="flex flex-col h-full">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h4 className="text-sm font-semibold text-foreground">Workspace</h4>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <ScrollArea className="flex-1">
          {artifacts.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-xl bg-secondary flex items-center justify-center">
                <Inbox className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                No artifacts yet. Hover over any assistant message and use the action buttons to generate notes, summaries, and more.
              </p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {artifacts.map((a) => {
                const cfg = typeConfig[a.artifact_type] || typeConfig.snippet;
                const Icon = cfg.icon;
                return (
                  <button
                    key={a.id}
                    onClick={() => setSelectedId(a.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/60 transition-colors duration-150 text-left group/item"
                  >
                    <div className={cn("p-1.5 rounded-md", cfg.badgeVariant)}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{a.title}</p>
                      <p className="text-xs text-muted-foreground">{cfg.label}</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={(e) => { e.stopPropagation(); exportArtifact(a); }}
                      >
                        <Download className="w-3 h-3 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={(e) => { e.stopPropagation(); deleteArtifact(a.id); }}
                      >
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>
    );
  }

  // Detail view
  const cfg = typeConfig[selected.artifact_type] || typeConfig.snippet;
  const Icon = cfg.icon;

  return (
    <div ref={ref} className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSelectedId(null); setEditing(false); }}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Badge variant="secondary" className={cn("text-xs gap-1 border-0", cfg.badgeVariant)}>
          <Icon className="w-3 h-3" />
          {cfg.label}
        </Badge>
        <div className="flex-1" />
        {editing ? (
          <>
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={cancelEdit}>
              <X className="w-3 h-3" /> Cancel
            </Button>
            <Button variant="default" size="sm" className="h-7 text-xs gap-1" onClick={saveEdit} disabled={saving}>
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
              Save
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={startEdit}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => exportArtifact(selected)}>
              <Download className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteArtifact(selected.id)}>
              <Trash2 className="w-3.5 h-3.5 text-destructive" />
            </Button>
          </>
        )}
      </div>

      <ScrollArea className="flex-1 p-4">
        {editing ? (
          <div className="space-y-3">
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="font-semibold text-sm"
              placeholder="Title"
            />
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[280px] text-sm font-mono leading-relaxed"
              placeholder="Content (markdown supported)"
            />
          </div>
        ) : (
          <div>
            <h3 className="text-base font-semibold text-foreground mb-3">{selected.title}</h3>
            <MarkdownRenderer content={selected.content} className="text-sm" />
          </div>
        )}
      </ScrollArea>
    </div>
  );
});

ArtifactWorkspace.displayName = "ArtifactWorkspace";
