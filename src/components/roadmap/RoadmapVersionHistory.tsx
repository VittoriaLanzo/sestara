import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Version {
  id: string;
  version_number: number;
  created_at: string;
  description: string | null;
}

interface RoadmapVersionHistoryProps {
  roadmapId: string;
  currentSnapshot: () => object;
  onRestore: (snapshot: object) => Promise<void>;
  onSave: () => Promise<void>;
}

export const RoadmapVersionHistory = ({
  roadmapId,
  currentSnapshot,
  onRestore,
  onSave,
}: RoadmapVersionHistoryProps) => {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);

  useEffect(() => {
    fetchVersions();
  }, [roadmapId]);

  const fetchVersions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("roadmap_versions")
        .select("id, version_number, created_at, description")
        .eq("roadmap_id", roadmapId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setVersions(data || []);
    } catch (error) {
      console.error("Error fetching versions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveVersion = async () => {
    setSaving(true);
    try {
      const snapshot = currentSnapshot();
      const nextVersion = versions.length > 0 ? versions[0].version_number + 1 : 1;

      const { error } = await supabase.from("roadmap_versions").insert([{
        roadmap_id: roadmapId,
        version_number: nextVersion,
        snapshot_data: snapshot as any,
        description: `Version ${nextVersion}`,
      }]);

      if (error) throw error;

      await fetchVersions();
      await onSave();
      toast.success("Version saved successfully!");
    } catch (error) {
      console.error("Error saving version:", error);
      toast.error("Failed to save version");
    } finally {
      setSaving(false);
    }
  };

  const handleRestore = async (versionId: string) => {
    setRestoring(versionId);
    try {
      const { data, error } = await supabase
        .from("roadmap_versions")
        .select("snapshot_data")
        .eq("id", versionId)
        .single();

      if (error || !data) throw error;

      await onRestore(data.snapshot_data as object);
      toast.success("Version restored successfully!");
    } catch (error) {
      console.error("Error restoring version:", error);
      toast.error("Failed to restore version");
    } finally {
      setRestoring(null);
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <History className="w-4 h-4" />
          <span className="hidden sm:inline">History</span>
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Version History</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <Button
            onClick={handleSaveVersion}
            disabled={saving}
            className="w-full gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Current Version"}
          </Button>

          <ScrollArea className="h-[calc(100vh-200px)]">
            {loading ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Loading versions...
              </p>
            ) : versions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No saved versions yet
              </p>
            ) : (
              <div className="space-y-2">
                {versions.map((version) => (
                  <div
                    key={version.id}
                    className="p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">
                          Version {version.version_number}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(version.created_at), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRestore(version.id)}
                        disabled={restoring === version.id}
                        className="gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        {restoring === version.id ? "..." : "Restore"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
};
