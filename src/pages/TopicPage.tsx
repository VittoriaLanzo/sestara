import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { TopicAIActions } from "@/components/topic/TopicAIActions";
import { TopicNotes } from "@/components/topic/TopicNotes";
import { CompletionDialog } from "@/components/topic/CompletionDialog";
import { EnhancedQuizViewer } from "@/components/quiz/EnhancedQuizViewer";
import { QuizConfigPanel, QuizConfig } from "@/components/quiz/QuizConfigPanel";
import { EnhancedFlashcardViewer } from "@/components/flashcard/EnhancedFlashcardViewer";
import { FlashcardGenerator } from "@/components/flashcard/FlashcardGenerator";
import {
  ChevronLeft,
  CheckCircle2,
  Clock,
  BookOpen,
  Loader2,
  Sparkles,
  X,
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

interface QuizQuestion {
  id: string;
  type: 'mcq' | 'short';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  encouragement: string;
  difficulty?: string;
}

interface Flashcard {
  id: string;
  front: string;
  back: string;
  hint?: string;
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
  const [flashcards, setFlashcards] = useState<Flashcard[] | null>(null);
  const [flashcardSetId, setFlashcardSetId] = useState<string | null>(null);
  
  // Quiz states
  const [showQuizConfig, setShowQuizConfig] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizConfig, setQuizConfig] = useState<QuizConfig | null>(null);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  
  // Flashcard states
  const [showFlashcardGenerator, setShowFlashcardGenerator] = useState(false);
  const [showFlashcards, setShowFlashcards] = useState(false);
  
  // Completion dialog
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);

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

      // Fetch existing flashcard set
      const { data: flashcardData } = await supabase
        .from("flashcard_sets")
        .select("*")
        .eq("topic_id", topicId)
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (flashcardData) {
        setFlashcardSetId(flashcardData.id);
        const cards = flashcardData.cards as any[];
        setFlashcards(cards.map((card, idx) => ({
          id: card.id || `card-${idx}`,
          front: card.front,
          back: card.back,
          hint: card.hint,
        })));
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
    setShowQuizConfig(true);
  };

  const handleCompleteWithoutQuiz = () => {
    setShowCompletionDialog(false);
    updateProgress(100, "completed");
  };

  const handleStartQuiz = async (config: QuizConfig) => {
    if (!topic) return;
    
    setIsGeneratingQuiz(true);
    try {
      const { data, error } = await supabase.functions.invoke('topic-ai', {
        body: {
          action: 'quiz',
          topicTitle: topic.title,
          topicDescription: topic.description,
          userNotes: notes || undefined,
          quizType: config.quizType,
          questionCount: config.questionCount,
          difficulty: config.difficulty,
          sourceUrl: config.sourceUrl,
          sourceType: config.source,
        }
      });

      if (error) throw error;
      
      setQuizQuestions(data.questions);
      setQuizConfig(config);
      setShowQuizConfig(false);
      setShowQuiz(true);
    } catch (error: any) {
      console.error("Quiz generation error:", error);
      toast.error(error.message || "Failed to generate quiz");
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleCloseQuiz = () => {
    setShowQuiz(false);
    setQuizQuestions([]);
    setQuizConfig(null);
  };

  const handleNewQuiz = () => {
    setShowQuiz(false);
    setShowQuizConfig(true);
  };

  const handleConvertToFlashcards = async (questions: QuizQuestion[]) => {
    if (!user || !topicId) return;
    
    const cards = questions.map((q, idx) => ({
      id: `converted-${idx}`,
      front: q.question,
      back: q.correctAnswer,
      hint: q.options ? q.options.filter(o => o !== q.correctAnswer).slice(0, 2).join(", ") : undefined,
    }));

    try {
      const { data, error } = await supabase
        .from("flashcard_sets")
        .insert({
          topic_id: topicId,
          user_id: user.id,
          cards: cards,
          source_type: 'quiz-conversion',
        })
        .select()
        .single();

      if (error) throw error;

      setFlashcards(cards);
      setFlashcardSetId(data.id);
      setShowQuiz(false);
      setShowFlashcards(true);
      toast.success("Converted quiz questions to flashcards!");
    } catch (error: any) {
      toast.error("Failed to convert to flashcards");
    }
  };

  const handleFlashcardsGenerated = async () => {
    // Refresh flashcard data
    if (!user || !topicId) return;
    
    const { data: flashcardData } = await supabase
      .from("flashcard_sets")
      .select("*")
      .eq("topic_id", topicId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (flashcardData) {
      setFlashcardSetId(flashcardData.id);
      const cards = flashcardData.cards as any[];
      setFlashcards(cards.map((card, idx) => ({
        id: card.id || `card-${idx}`,
        front: card.front,
        back: card.back,
        hint: card.hint,
      })));
    }
    
    setShowFlashcardGenerator(false);
    setShowFlashcards(true);
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

  // Quiz Configuration View
  if (showQuizConfig) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        </div>
        <main className="relative z-10 container mx-auto px-4 pt-24 pb-12 max-w-2xl">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowQuizConfig(false)}
            className="mb-6 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <h1 className="text-2xl font-display font-bold text-foreground mb-6">
            Configure Quiz: {topic.title}
          </h1>
          <QuizConfigPanel onStart={handleStartQuiz} isLoading={isGeneratingQuiz} />
        </main>
      </div>
    );
  }

  // Quiz Taking View
  if (showQuiz && quizQuestions.length > 0 && quizConfig) {
    return (
      <EnhancedQuizViewer
        questions={quizQuestions}
        config={quizConfig}
        topicId={topicId!}
        userId={user!.id}
        topicTitle={topic.title}
        onClose={handleCloseQuiz}
        onNewQuiz={handleNewQuiz}
        onConvertToFlashcards={handleConvertToFlashcards}
      />
    );
  }

  // Flashcard Generator View
  if (showFlashcardGenerator) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        </div>
        <main className="relative z-10 container mx-auto px-4 pt-24 pb-12 max-w-2xl">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFlashcardGenerator(false)}
            className="mb-6 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <h1 className="text-2xl font-display font-bold text-foreground mb-6">
            Generate Flashcards: {topic.title}
          </h1>
          <FlashcardGenerator
            topicId={topicId!}
            topicTitle={topic.title}
            topicDescription={topic.description || ''}
            userNotes={notes}
            userId={user!.id}
            onGenerated={handleFlashcardsGenerated}
          />
        </main>
      </div>
    );
  }

  // Flashcard Viewer
  if (showFlashcards && flashcards && flashcards.length > 0) {
    return (
      <EnhancedFlashcardViewer
        cards={flashcards}
        setId={flashcardSetId || undefined}
        userId={user?.id}
        onClose={() => setShowFlashcards(false)}
      />
    );
  }

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
              onGenerateQuiz={() => setShowQuizConfig(true)}
              onGenerateFlashcards={() => setShowFlashcardGenerator(true)}
              hasExistingFlashcards={!!flashcards && flashcards.length > 0}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* Completion Dialog */}
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
