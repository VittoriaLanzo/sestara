import { NotebookView } from "@/components/notes/NotebookView";

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
  topicId,
  userId,
}: TopicNotesProps) => {
  return (
    <div className="space-y-6">
      <NotebookView topicId={topicId} userId={userId} />
      
      <div className="text-center text-sm text-muted-foreground">
        <p>Your notes are used by AI to generate more relevant quizzes and summaries</p>
      </div>
    </div>
  );
};
