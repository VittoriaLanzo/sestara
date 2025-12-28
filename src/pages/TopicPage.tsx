import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { TopicAIActions } from "@/components/topic/TopicAIActions";
import { TopicNotes } from "@/components/topic/TopicNotes";
import { QuizModal } from "@/components/topic/QuizModal";
import { FlashcardViewer } from "@/components/topic/FlashcardViewer";
import { CompletionDialog } from "@/components/topic/CompletionDialog";
import {
  ChevronLeft,
  CheckCircle2,
  Clock,
  BookOpen,
  Loader2,
  Sparkles,
} from "lucide-react";

interface Topic {
  id: string;
  title: string;
  description: string | null;
  status: string;
  progress: number;
  estimated_hours: number | null;
  subject_id: string;
}

interface Subject {
  id: string;
  title: string;
  roadmap_id: string;
}

const TopicPage = () => {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [topic, setTopic] = useState<Topic | null>(null);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<string>("");
  const [noteId, setNoteId] = useState<string | null>(null);
  const [savingNotes, setSavingNotes] = useState(false);
  
  // AI content states
  const [explanation, setExplanation] = useState<string | null>(null);
  const [keywords, setKeywords] = useState<string[] | null>(null);
  const [flashcards, setFlashcards] = useState<any[] | null>(null);
  
  // Modal states
  const [showQuiz, setShowQuiz] = useState(false);
  const [showFlashcards, setShowFlashcards] = useState(false);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<any[] | null>(null);

  useEffect(() => {
    if (!user || !topicId) return;
    fetchTopicData();
  }, [user, topicId]);

  const fetchTopicData = async () => {
    try {
      // Fetch topic
      const { data: topicData, error: topicError } = await supabase
        .from("topics")
        .select("*")
        .eq("id", topicId)
        .maybeSingle();

      if (topicError || !topicData) {
        toast.error("Topic not found");
        navigate(-1);
        return;
      }

      setTopic(topicData);

      // Fetch subject
      const { data: subjectData } = await supabase
        .from("subjects")
        .select("id, title, roadmap_id")
        .eq("id", topicData.subject_id)
        .maybeSingle();

      if (subjectData) {
        setSubject(subjectData);
      }

      // Fetch notes
      const { data: notesData } = await supabase
        .from("topic_notes")
        .select("*")
        .eq("topic_id", topicId)
        .eq("user_id", user!.id)
        .maybeSingle();

      if (notesData) {
        setNotes(notesData.content || "");
        setNoteId(notesData.id);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to load topic");
    } finally {
      setLoading(false);
    }
  };

  const saveNotes = useCallback(async () => {
    if (!user || !topicId) return;
    
    setSavingNotes(true);
    try {
      if (noteId) {
        await supabase
          .from("topic_notes")
          .update({ content: notes })
          .eq("id", noteId);
      } else {
        const { data } = await supabase
          .from("topic_notes")
          .insert({ topic_id: topicId, user_id: user.id, content: notes })
          .select()
          .single();
        if (data) setNoteId(data.id);
      }
      toast.success("Notes saved");
    } catch (error) {
      toast.error("Failed to save notes");
    } finally {
      setSavingNotes(false);
    }
  }, [notes, noteId, user, topicId]);

  const updateProgress = async (newProgress: number, newStatus: string) => {
    if (!topic) return;

    const { error } = await supabase
      .from("topics")
      .update({ progress: newProgress, status: newStatus })
      .eq("id", topic.id);

    if (error) {
      toast.error("Failed to update progress");
      return;
    }

    setTopic({ ...topic, progress: newProgress, status: newStatus });
    
    if (newStatus === "completed") {
      toast.success("Great job completing this topic! 🎉");
    }
  };

  const handleMarkComplete = () => {
    setShowCompletionDialog(true);
  };

  const handleCompleteWithQuiz = () => {
    setShowCompletionDialog(false);
    updateProgress(100, "completed");
    // Generate quiz after marking complete
    handleGenerateQuiz();
  };

  const handleCompleteWithoutQuiz = () => {
    setShowCompletionDialog(false);
    updateProgress(100, "completed");
  };

  const handleGenerateQuiz = async () => {
    if (!topic) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('topic-ai', {
        body: {
          action: 'quiz',
          topicTitle: topic.title,
          topicDescription: topic.description,
          userNotes: notes || undefined,
          quizType: 'mixed',
          questionCount: 5
        }
      });

      if (error) throw error;
      
      setQuizQuestions(data.questions);
      setShowQuiz(true);
    } catch (error: any) {
      toast.error(error.message || "Failed to generate quiz");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!topic) return null;

  const isCompleted = topic.status === "completed";
  const isInProgress = topic.status === "in-progress";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <main className="relative z-10 container mx-auto px-4 pt-24 pb-12 max-w-4xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => subject ? navigate(`/roadmap/${subject.roadmap_id}`) : navigate(-1)}
          className="mb-6 text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to {subject?.title || "Roadmap"}
        </Button>

        {/* Topic Header */}
        <div className="glass-card p-6 mb-6 animate-slide-up">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2">
                {topic.title}
              </h1>
              {topic.description && (
                <p className="text-muted-foreground">{topic.description}</p>
              )}
              <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                {topic.estimated_hours && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {topic.estimated_hours}h estimated
                  </span>
                )}
                <span className={`flex items-center gap-1 ${
                  isCompleted ? 'text-green-400' : isInProgress ? 'text-yellow-400' : ''
                }`}>
                  {isCompleted ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Completed
                    </>
                  ) : isInProgress ? (
                    <>
                      <BookOpen className="w-4 h-4" />
                      In Progress
                    </>
                  ) : (
                    'Not Started'
                  )}
                </span>
              </div>
            </div>
            {!isCompleted && (
              <Button
                variant="gradient"
                onClick={handleMarkComplete}
                className="gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Mark Complete
              </Button>
            )}
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium text-foreground">{topic.progress}%</span>
            </div>
            <Progress value={topic.progress} className="h-2" />
            {!isCompleted && (
              <div className="flex gap-2 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateProgress(25, "in-progress")}
                  className={topic.progress >= 25 ? "bg-primary/20" : ""}
                >
                  25%
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateProgress(50, "in-progress")}
                  className={topic.progress >= 50 ? "bg-primary/20" : ""}
                >
                  50%
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateProgress(75, "in-progress")}
                  className={topic.progress >= 75 ? "bg-primary/20" : ""}
                >
                  75%
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="notes" className="animate-slide-up stagger-1">
          <TabsList className="glass-card w-full mb-6">
            <TabsTrigger value="notes" className="flex-1">Notes</TabsTrigger>
            <TabsTrigger value="ai" className="flex-1">
              <Sparkles className="w-4 h-4 mr-2" />
              AI Tools
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notes">
            <TopicNotes
              notes={notes}
              setNotes={setNotes}
              saveNotes={saveNotes}
              savingNotes={savingNotes}
              noteId={noteId}
              topicId={topicId!}
              userId={user!.id}
            />
          </TabsContent>

          <TabsContent value="ai">
            <TopicAIActions
              topic={topic}
              notes={notes}
              explanation={explanation}
              setExplanation={setExplanation}
              keywords={keywords}
              setKeywords={setKeywords}
              flashcards={flashcards}
              setFlashcards={setFlashcards}
              onShowFlashcards={() => setShowFlashcards(true)}
              onGenerateQuiz={handleGenerateQuiz}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* Modals */}
      <QuizModal
        open={showQuiz}
        onOpenChange={setShowQuiz}
        questions={quizQuestions}
        topicId={topicId!}
        userId={user!.id}
      />

      <FlashcardViewer
        open={showFlashcards}
        onOpenChange={setShowFlashcards}
        cards={flashcards}
      />

      <CompletionDialog
        open={showCompletionDialog}
        onOpenChange={setShowCompletionDialog}
        onConfirmWithQuiz={handleCompleteWithQuiz}
        onConfirmWithoutQuiz={handleCompleteWithoutQuiz}
      />
    </div>
  );
};

export default TopicPage;
