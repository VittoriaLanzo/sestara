import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { RichTextEditor } from "./RichTextEditor";
import { DrawingCanvas } from "./DrawingCanvas";
import { MathInput, MathRenderer } from "./MathRenderer";
import {
  Save,
  FileText,
  Pencil,
  Calculator,
  Maximize2,
  Minimize2,
  Loader2,
  Upload,
  Image as ImageIcon,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { NotePage } from "./NoteSidebar";

interface NoteEditorProps {
  page: NotePage | null;
  topicId: string;
  userId: string;
  onPageUpdate: (page: NotePage) => void;
}

interface Attachment {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
}

export const NoteEditor = ({
  page,
  topicId,
  userId,
  onPageUpdate,
}: NoteEditorProps) => {
  const [content, setContent] = useState<any>({});
  const [drawing, setDrawing] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [focusMode, setFocusMode] = useState(false);
  const [showMathInput, setShowMathInput] = useState(false);
  const [mathExpressions, setMathExpressions] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load page content
  useEffect(() => {
    if (!page) {
      setContent({});
      setDrawing(null);
      setMathExpressions([]);
      return;
    }

    const pageContent = page.content as any || {};
    setContent(pageContent.editor || {});
    setMathExpressions(pageContent.math || []);
    
    // Load drawing
    loadDrawing(page.id);
  }, [page?.id]);

  const loadDrawing = async (pageId: string) => {
    const { data } = await supabase
      .from("note_drawings")
      .select("*")
      .eq("page_id", pageId)
      .maybeSingle();
    
    if (data) {
      setDrawing(data.drawing_data);
    } else {
      setDrawing(null);
    }
  };

  // Auto-save
  const saveContent = useCallback(async () => {
    if (!page) return;

    setIsSaving(true);
    try {
      const fullContent = {
        editor: content,
        math: mathExpressions,
      };

      const { error } = await supabase
        .from("note_pages")
        .update({ content: fullContent })
        .eq("id", page.id);

      if (error) throw error;

      setLastSaved(new Date());
      onPageUpdate({ ...page, content: fullContent as any });
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setIsSaving(false);
    }
  }, [page, content, mathExpressions, onPageUpdate]);

  // Debounced auto-save
  useEffect(() => {
    if (!page) return;

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      saveContent();
    }, 2000);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [content, mathExpressions]);

  // Save drawing
  const handleDrawingChange = useCallback(
    async (drawingData: any) => {
      if (!page) return;

      setDrawing(drawingData);

      // Upsert drawing
      const { data: existing } = await supabase
        .from("note_drawings")
        .select("id")
        .eq("page_id", page.id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("note_drawings")
          .update({ drawing_data: drawingData })
          .eq("id", existing.id);
      } else {
        await supabase.from("note_drawings").insert({
          page_id: page.id,
          drawing_data: drawingData,
        });
      }
    },
    [page]
  );

  // AI writing assistance
  const handleAIAction = useCallback(
    async (action: string, selectedText: string): Promise<string> => {
      try {
        const { data, error } = await supabase.functions.invoke("topic-ai", {
          body: {
            action: "write-assist",
            assistType: action,
            text: selectedText,
          },
        });

        if (error) throw error;
        return data.result || selectedText;
      } catch (error) {
        console.error("AI action error:", error);
        toast.error("AI assistance failed");
        return selectedText;
      }
    },
    []
  );

  // Math AI conversion
  const handleMathConvert = useCallback(
    async (plainText: string): Promise<string> => {
      try {
        const { data, error } = await supabase.functions.invoke("topic-ai", {
          body: {
            action: "math-convert",
            text: plainText,
          },
        });

        if (error) throw error;
        return data.latex || "";
      } catch (error) {
        console.error("Math convert error:", error);
        toast.error("Failed to convert to math");
        return "";
      }
    },
    []
  );

  const handleInsertMath = (latex: string) => {
    setMathExpressions((prev) => [latex, ...prev]);
    setShowMathInput(false);
  };

  const handleRemoveMath = (index: number) => {
    setMathExpressions((prev) => prev.filter((_, i) => i !== index));
  };

  // File upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !page) return;

    setUploading(true);

    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name}: Only images are allowed`);
        continue;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name}: File too large (max 10MB)`);
        continue;
      }

      try {
        const filePath = `${userId}/${page.id}/${Date.now()}_${file.name}`;

        const { error: uploadError } = await supabase.storage
          .from("note-attachments")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Use signed URL for private bucket instead of public URL
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from("note-attachments")
          .createSignedUrl(filePath, 60 * 60 * 24 * 7); // 7 days expiry

        if (signedUrlError) throw signedUrlError;

        setAttachments((prev) => [
          ...prev,
          {
            id: filePath,
            file_name: file.name,
            file_url: signedUrlData.signedUrl,
            file_type: file.type,
          },
        ]);

        toast.success(`${file.name} uploaded`);
      } catch (error) {
        console.error("Upload error:", error);
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeAttachment = async (attachment: Attachment) => {
    try {
      await supabase.storage.from("note-attachments").remove([attachment.id]);
      setAttachments((prev) => prev.filter((a) => a.id !== attachment.id));
      toast.success("Image removed");
    } catch (error) {
      toast.error("Failed to remove image");
    }
  };

  if (!page) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Select a page to start editing</p>
          <p className="text-sm mt-1">or create a new one</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex-1 flex flex-col transition-all duration-300",
        focusMode && "fixed inset-0 z-50 bg-background"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Input
            value={page.title}
            onChange={(e) =>
              onPageUpdate({ ...page, title: e.target.value })
            }
            className="text-lg font-semibold bg-transparent border-none focus-visible:ring-0 px-0 h-auto"
          />
          {isSaving && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
          {lastSaved && !isSaving && (
            <span className="text-xs text-muted-foreground">
              Saved {lastSaved.toLocaleTimeString()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ImageIcon className="h-4 w-4" />
            )}
            <span className="ml-2 hidden sm:inline">Image</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMathInput(!showMathInput)}
          >
            <Calculator className="h-4 w-4" />
            <span className="ml-2 hidden sm:inline">Math</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFocusMode(!focusMode)}
          >
            {focusMode ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
          <Button variant="default" size="sm" onClick={saveContent}>
            <Save className="h-4 w-4" />
            <span className="ml-2 hidden sm:inline">Save</span>
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileUpload}
        />
      </div>

      {/* Math Input */}
      {showMathInput && (
        <div className="p-4 border-b border-border">
          <MathInput
            onInsert={handleInsertMath}
            onClose={() => setShowMathInput(false)}
            onAIConvert={handleMathConvert}
          />
        </div>
      )}

      {/* Math Expressions */}
      {mathExpressions.length > 0 && (
        <div className="p-4 border-b border-border bg-muted/20">
          <p className="text-sm font-medium mb-2">Math Expressions</p>
          <div className="flex flex-wrap gap-2">
            {mathExpressions.map((latex, index) => (
              <div
                key={index}
                className="group relative inline-flex items-center gap-2 px-3 py-2 bg-background rounded-lg border border-border"
              >
                <MathRenderer latex={latex} />
                <button
                  onClick={() => handleRemoveMath(index)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/20 rounded"
                >
                  <X className="h-3 w-3 text-destructive" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attachments */}
      {attachments.length > 0 && (
        <div className="p-4 border-b border-border">
          <p className="text-sm font-medium mb-2">Images</p>
          <div className="flex flex-wrap gap-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="relative group w-24 h-24 rounded-lg overflow-hidden border border-border"
              >
                <img
                  src={attachment.file_url}
                  alt={attachment.file_name}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => removeAttachment(attachment)}
                  className="absolute top-1 right-1 p-1 bg-destructive/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3 text-destructive-foreground" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Editor Tabs */}
      <Tabs defaultValue="write" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="mx-4 mt-4 w-fit">
          <TabsTrigger value="write" className="gap-2">
            <FileText className="h-4 w-4" />
            Write
          </TabsTrigger>
          <TabsTrigger value="draw" className="gap-2">
            <Pencil className="h-4 w-4" />
            Draw
          </TabsTrigger>
        </TabsList>

        <TabsContent value="write" className="flex-1 p-4 overflow-auto">
          <RichTextEditor
            content={content}
            onChange={setContent}
            placeholder="Start writing your notes..."
            onAIAction={handleAIAction}
          />
        </TabsContent>

        <TabsContent value="draw" className="flex-1 p-4 overflow-auto">
          <DrawingCanvas
            initialData={drawing}
            onChange={handleDrawingChange}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
