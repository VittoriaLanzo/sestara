import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HowItWorksSection } from "@/components/custom-quiz/HowItWorksSection";
import { PromptBuilderSection } from "@/components/custom-quiz/PromptBuilderSection";
import { PasteJsonSection } from "@/components/custom-quiz/PasteJsonSection";
import { SavedQuizzesSection } from "@/components/custom-quiz/SavedQuizzesSection";
import { CustomQuizViewer } from "@/components/custom-quiz/CustomQuizViewer";
import { CustomQuizResults } from "@/components/custom-quiz/CustomQuizResults";
import { Sparkles, BookOpen, ClipboardPaste, FolderOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface CustomQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  difficulty?: string;
  keywordsEnglish?: string[];
  keywordsLocal?: string[];
}

export interface CustomQuiz {
  quizTitle: string;
  description?: string;
  examLevel?: string;
  language?: string;
  durationMode?: 'timer' | 'track';
  timerMinutes?: number;
  questions: CustomQuizQuestion[];
}

export interface SavedQuiz {
  id: string;
  quiz: CustomQuiz;
  groupId?: string;
  groupName?: string;
  lastOpenedAt: string;
  timesPlayed: number;
  bestScore: number;
  previousScore: number;
  createdAt: string;
}

export interface QuizGroup {
  id: string;
  name: string;
  color: string;
}

const CustomQuizPage = () => {
  const { profile } = useProfile();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("guide");
  
  // Quiz state
  const [activeQuiz, setActiveQuiz] = useState<CustomQuiz | null>(null);
  const [quizMode, setQuizMode] = useState<'timer' | 'track'>('track');
  const [timerMinutes, setTimerMinutes] = useState(10);
  const [showResults, setShowResults] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizScore, setQuizScore] = useState(0);
  const [quizTime, setQuizTime] = useState(0);
  
  // Saved quizzes state (localStorage)
  const [savedQuizzes, setSavedQuizzes] = useState<SavedQuiz[]>([]);
  const [quizGroups, setQuizGroups] = useState<QuizGroup[]>([
    { id: 'default', name: 'General', color: 'blue' },
  ]);

  const studyLanguage = profile?.study_language || 'en';

  // Load saved data from localStorage
  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`custom-quizzes-${user.id}`);
      const groups = localStorage.getItem(`quiz-groups-${user.id}`);
      if (saved) setSavedQuizzes(JSON.parse(saved));
      if (groups) setQuizGroups(JSON.parse(groups));
    }
  }, [user]);

  // Save to localStorage
  const saveQuizzes = (quizzes: SavedQuiz[]) => {
    if (user) {
      localStorage.setItem(`custom-quizzes-${user.id}`, JSON.stringify(quizzes));
      setSavedQuizzes(quizzes);
    }
  };

  const saveGroups = (groups: QuizGroup[]) => {
    if (user) {
      localStorage.setItem(`quiz-groups-${user.id}`, JSON.stringify(groups));
      setQuizGroups(groups);
    }
  };

  const handleStartQuiz = (quiz: CustomQuiz, mode: 'timer' | 'track', minutes: number) => {
    setActiveQuiz(quiz);
    setQuizMode(mode);
    setTimerMinutes(minutes);
    setQuizAnswers({});
    setShowResults(false);
  };

  const handleQuizComplete = (answers: Record<string, string>, score: number, timeTaken: number) => {
    setQuizAnswers(answers);
    setQuizScore(score);
    setQuizTime(timeTaken);
    setShowResults(true);
  };

  const handleSaveQuiz = (quiz: CustomQuiz, groupId?: string) => {
    const newSavedQuiz: SavedQuiz = {
      id: crypto.randomUUID(),
      quiz,
      groupId: groupId || 'default',
      groupName: quizGroups.find(g => g.id === (groupId || 'default'))?.name || 'General',
      lastOpenedAt: new Date().toISOString(),
      timesPlayed: 0,
      bestScore: 0,
      previousScore: 0,
      createdAt: new Date().toISOString(),
    };
    saveQuizzes([...savedQuizzes, newSavedQuiz]);
  };

  const handleRetake = () => {
    setQuizAnswers({});
    setShowResults(false);
  };

  const handleCloseQuiz = () => {
    setActiveQuiz(null);
    setShowResults(false);
  };

  // Show quiz viewer
  if (activeQuiz && !showResults) {
    return (
      <CustomQuizViewer
        quiz={activeQuiz}
        mode={quizMode}
        timerMinutes={timerMinutes}
        onComplete={handleQuizComplete}
        onCancel={handleCloseQuiz}
      />
    );
  }

  // Show results
  if (activeQuiz && showResults) {
    return (
      <CustomQuizResults
        quiz={activeQuiz}
        answers={quizAnswers}
        score={quizScore}
        timeTaken={quizTime}
        onRetake={handleRetake}
        onNewQuiz={handleCloseQuiz}
        onSaveQuiz={() => {
          handleSaveQuiz(activeQuiz);
          handleCloseQuiz();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Custom Quiz Studio</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              Create Quizzes with <span className="gradient-text">Any AI</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Use your favorite AI (ChatGPT, Gemini, Claude) to generate quiz questions,
              then paste the JSON here to practice instantly.
            </p>
          </div>

          {/* Main Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid grid-cols-4 w-full max-w-2xl mx-auto h-auto p-1 bg-muted/50">
              <TabsTrigger 
                value="guide" 
                className="flex items-center gap-2 py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <BookOpen className="w-4 h-4" />
                <span className="hidden sm:inline">How It Works</span>
                <span className="sm:hidden">Guide</span>
              </TabsTrigger>
              <TabsTrigger 
                value="prompt" 
                className="flex items-center gap-2 py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">Generate Prompt</span>
                <span className="sm:hidden">Prompt</span>
              </TabsTrigger>
              <TabsTrigger 
                value="paste" 
                className="flex items-center gap-2 py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <ClipboardPaste className="w-4 h-4" />
                <span className="hidden sm:inline">Paste JSON</span>
                <span className="sm:hidden">Paste</span>
              </TabsTrigger>
              <TabsTrigger 
                value="library" 
                className="flex items-center gap-2 py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <FolderOpen className="w-4 h-4" />
                <span className="hidden sm:inline">Library</span>
                <span className="sm:hidden">Saved</span>
              </TabsTrigger>
            </TabsList>

            <AnimatePresence mode="wait">
              <TabsContent value="guide" className="mt-6">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <HowItWorksSection studyLanguage={studyLanguage} />
                </motion.div>
              </TabsContent>

              <TabsContent value="prompt" className="mt-6">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <PromptBuilderSection studyLanguage={studyLanguage} />
                </motion.div>
              </TabsContent>

              <TabsContent value="paste" className="mt-6">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <PasteJsonSection 
                    studyLanguage={studyLanguage}
                    onStartQuiz={handleStartQuiz}
                  />
                </motion.div>
              </TabsContent>

              <TabsContent value="library" className="mt-6">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <SavedQuizzesSection
                    savedQuizzes={savedQuizzes}
                    quizGroups={quizGroups}
                    onUpdateQuizzes={saveQuizzes}
                    onUpdateGroups={saveGroups}
                    onStartQuiz={handleStartQuiz}
                  />
                </motion.div>
              </TabsContent>
            </AnimatePresence>
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
};

export default CustomQuizPage;
