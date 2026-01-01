import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { NoteSidebar, type NotePage } from "./NoteSidebar";
import { NoteEditor } from "./NoteEditor";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface NotebookViewProps {
  topicId: string;
  userId: string;
}

export const NotebookView = ({ topicId, userId }: NotebookViewProps) => {
  const [pages, setPages] = useState<NotePage[]>([]);
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Load pages
  useEffect(() => {
    loadPages();
  }, [topicId, userId]);

  const loadPages = async () => {
    try {
      const { data, error } = await supabase
        .from("note_pages")
        .select("*")
        .eq("topic_id", topicId)
        .eq("user_id", userId)
        .order("order_index");

      if (error) throw error;

      const typedPages: NotePage[] = (data || []).map((p) => ({
        id: p.id,
        title: p.title,
        is_pinned: p.is_pinned,
        color_tag: p.color_tag,
        icon: p.icon,
        order_index: p.order_index,
        updated_at: p.updated_at,
        content: p.content,
      }));

      setPages(typedPages);

      // Auto-select first page if none selected
      if (!activePageId && typedPages.length > 0) {
        setActivePageId(typedPages[0].id);
      }
    } catch (error) {
      console.error("Failed to load pages:", error);
      toast.error("Failed to load notes");
    } finally {
      setLoading(false);
    }
  };

  const createPage = useCallback(async () => {
    try {
      const newOrderIndex = pages.length;
      const { data, error } = await supabase
        .from("note_pages")
        .insert({
          topic_id: topicId,
          user_id: userId,
          title: `Page ${pages.length + 1}`,
          order_index: newOrderIndex,
        })
        .select()
        .single();

      if (error) throw error;

      const newPage: NotePage = {
        id: data.id,
        title: data.title,
        is_pinned: data.is_pinned,
        color_tag: data.color_tag,
        icon: data.icon,
        order_index: data.order_index,
        updated_at: data.updated_at,
      };

      setPages((prev) => [...prev, newPage]);
      setActivePageId(data.id);
      toast.success("Page created");
    } catch (error) {
      console.error("Failed to create page:", error);
      toast.error("Failed to create page");
    }
  }, [topicId, userId, pages.length]);

  const deletePage = useCallback(
    async (pageId: string) => {
      try {
        const { error } = await supabase
          .from("note_pages")
          .delete()
          .eq("id", pageId);

        if (error) throw error;

        setPages((prev) => prev.filter((p) => p.id !== pageId));

        if (activePageId === pageId) {
          const remaining = pages.filter((p) => p.id !== pageId);
          setActivePageId(remaining.length > 0 ? remaining[0].id : null);
        }

        toast.success("Page deleted");
      } catch (error) {
        console.error("Failed to delete page:", error);
        toast.error("Failed to delete page");
      }
    },
    [activePageId, pages]
  );

  const renamePage = useCallback(async (pageId: string, title: string) => {
    try {
      const { error } = await supabase
        .from("note_pages")
        .update({ title })
        .eq("id", pageId);

      if (error) throw error;

      setPages((prev) =>
        prev.map((p) => (p.id === pageId ? { ...p, title } : p))
      );
    } catch (error) {
      console.error("Failed to rename page:", error);
      toast.error("Failed to rename page");
    }
  }, []);

  const togglePin = useCallback(async (pageId: string) => {
    const page = pages.find((p) => p.id === pageId);
    if (!page) return;

    try {
      const { error } = await supabase
        .from("note_pages")
        .update({ is_pinned: !page.is_pinned })
        .eq("id", pageId);

      if (error) throw error;

      setPages((prev) =>
        prev.map((p) =>
          p.id === pageId ? { ...p, is_pinned: !p.is_pinned } : p
        )
      );
    } catch (error) {
      console.error("Failed to toggle pin:", error);
    }
  }, [pages]);

  const setColorTag = useCallback(async (pageId: string, color: string | null) => {
    try {
      const { error } = await supabase
        .from("note_pages")
        .update({ color_tag: color })
        .eq("id", pageId);

      if (error) throw error;

      setPages((prev) =>
        prev.map((p) => (p.id === pageId ? { ...p, color_tag: color } : p))
      );
    } catch (error) {
      console.error("Failed to set color:", error);
    }
  }, []);

  const reorderPages = useCallback(async (newPages: NotePage[]) => {
    setPages(newPages);

    // Update order in database
    for (let i = 0; i < newPages.length; i++) {
      await supabase
        .from("note_pages")
        .update({ order_index: i })
        .eq("id", newPages[i].id);
    }
  }, []);

  const handlePageUpdate = useCallback((updatedPage: NotePage) => {
    setPages((prev) =>
      prev.map((p) => (p.id === updatedPage.id ? updatedPage : p))
    );
  }, []);

  const activePage = pages.find((p) => p.id === activePageId) || null;

  if (loading) {
    return (
      <div className="h-[600px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="h-[600px] flex border border-border rounded-lg overflow-hidden bg-background/50">
      {/* Mobile sidebar toggle */}
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 left-2 z-10 md:hidden"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>

      {/* Sidebar */}
      <div
        className={cn(
          "transition-all duration-300",
          sidebarOpen ? "w-64" : "w-0 overflow-hidden",
          "md:w-64"
        )}
      >
        <NoteSidebar
          pages={pages}
          activePageId={activePageId}
          onSelectPage={setActivePageId}
          onCreatePage={createPage}
          onDeletePage={deletePage}
          onRenamePage={renamePage}
          onTogglePin={togglePin}
          onSetColorTag={setColorTag}
          onReorderPages={reorderPages}
        />
      </div>

      {/* Editor */}
      <NoteEditor
        page={activePage}
        topicId={topicId}
        userId={userId}
        onPageUpdate={handlePageUpdate}
      />
    </div>
  );
};
