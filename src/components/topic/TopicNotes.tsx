import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Save,
  Upload,
  FileText,
  Image as ImageIcon,
  X,
  Loader2,
  File,
} from "lucide-react";

interface Attachment {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
}

interface TopicNotesProps {
  notes: string;
  setNotes: (val: string) => void;
  saveNotes: () => Promise<void>;
  savingNotes: boolean;
  noteId: string | null;
  topicId: string;
  userId: string;
}

export const TopicNotes = ({
  notes,
  setNotes,
  saveNotes,
  savingNotes,
  noteId,
  topicId,
  userId,
}: TopicNotesProps) => {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Ensure note exists first
    let currentNoteId = noteId;
    if (!currentNoteId) {
      const { data: newNote, error } = await supabase
        .from("topic_notes")
        .insert({ topic_id: topicId, user_id: userId, content: notes })
        .select()
        .single();
      
      if (error || !newNote) {
        toast.error("Failed to create note for attachments");
        return;
      }
      currentNoteId = newNote.id;
    }

    setUploading(true);
    
    for (const file of Array.from(files)) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error(`${file.name}: Only PDFs and images are allowed`);
        continue;
      }

      // Max 10MB
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name}: File too large (max 10MB)`);
        continue;
      }

      try {
        const filePath = `${userId}/${topicId}/${Date.now()}_${file.name}`;
        
        const { error: uploadError } = await supabase.storage
          .from('note-attachments')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('note-attachments')
          .getPublicUrl(filePath);

        // Save attachment record
        const { data: attachment, error: dbError } = await supabase
          .from("note_attachments")
          .insert({
            note_id: currentNoteId,
            file_name: file.name,
            file_url: urlData.publicUrl,
            file_type: file.type,
            file_size: file.size,
          })
          .select()
          .single();

        if (dbError) throw dbError;

        setAttachments(prev => [...prev, attachment]);
        toast.success(`${file.name} uploaded`);
      } catch (error: any) {
        console.error("Upload error:", error);
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = async (attachment: Attachment) => {
    try {
      // Delete from storage
      const path = attachment.file_url.split('/note-attachments/')[1];
      if (path) {
        await supabase.storage.from('note-attachments').remove([path]);
      }

      // Delete record
      await supabase.from("note_attachments").delete().eq("id", attachment.id);

      setAttachments(prev => prev.filter(a => a.id !== attachment.id));
      toast.success("Attachment removed");
    } catch (error) {
      toast.error("Failed to remove attachment");
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return ImageIcon;
    if (fileType === 'application/pdf') return FileText;
    return File;
  };

  return (
    <div className="space-y-6">
      {/* Notes Editor */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Your Notes</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                <span className="ml-2 hidden sm:inline">Attach</span>
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={saveNotes}
                disabled={savingNotes}
              >
                {savingNotes ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span className="ml-2 hidden sm:inline">Save</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Write your notes here... Use this space to summarize key concepts, jot down questions, or add personal insights."
            className="min-h-[300px] bg-background/50 border-border/50 resize-y"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,image/*"
            multiple
            className="hidden"
            onChange={handleFileUpload}
          />
        </CardContent>
      </Card>

      {/* Attachments */}
      {attachments.length > 0 && (
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Attachments ({attachments.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {attachments.map((attachment) => {
                const FileIcon = getFileIcon(attachment.file_type);
                const isImage = attachment.file_type.startsWith('image/');

                return (
                  <div
                    key={attachment.id}
                    className="relative group bg-background/50 rounded-lg border border-border/50 overflow-hidden"
                  >
                    {isImage ? (
                      <a href={attachment.file_url} target="_blank" rel="noopener noreferrer">
                        <img
                          src={attachment.file_url}
                          alt={attachment.file_name}
                          className="w-full h-24 object-cover"
                        />
                      </a>
                    ) : (
                      <a
                        href={attachment.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center h-24 hover:bg-primary/5"
                      >
                        <FileIcon className="w-8 h-8 text-muted-foreground" />
                      </a>
                    )}
                    <div className="p-2">
                      <p className="text-xs text-foreground truncate">{attachment.file_name}</p>
                    </div>
                    <button
                      onClick={() => removeAttachment(attachment)}
                      className="absolute top-1 right-1 p-1 bg-destructive/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3 text-destructive-foreground" />
                    </button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tips */}
      <div className="text-center text-sm text-muted-foreground">
        <p>💡 Tip: Your notes are used by AI to generate more relevant quizzes and summaries</p>
      </div>
    </div>
  );
};
