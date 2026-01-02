import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { QuizTimer } from "./QuizTimer";
import { QuizNavigation, QuestionState } from "./QuizNavigation";
import { QuizReviewPanel } from "./QuizReviewPanel";
import { DoubtReportButton } from "./DoubtReportButton";
import { QuizConfig } from "./QuizConfigPanel";
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  ArrowLeft,
  SkipForward,
  HelpCircle,
  X,
  Maximize2,
  Minimize2,
} from "lucide-react";

interface Question {
  id: string;
  type: 'mcq' | 'short';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  encouragement: string;
  difficulty?: string;
}

interface EnhancedQuizViewerProps {
  questions: Question[];
  config: QuizConfig;
  topicId: string;
  userId: string;
  topicTitle: string;
  onClose: () => void;
  onNewQuiz: () => void;
  onConvertToFlashcards: (questions: Question[]) => void;
}

export const EnhancedQuizViewer = ({
  questions,
  config,
  topicId,
  userId,
  topicTitle,
  onClose,
  onNewQuiz,
  onConvertToFlashcards,
}: EnhancedQuizViewerProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [shortAnswer, setShortAnswer] = useState("");
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [questionStates, setQuestionStates] = useState<QuestionState[]>(
    new Array(questions.length).fill('unanswered')
  );
  const [showResults, setShowResults] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(config.focusMode);
  const [isPaused, setIsPaused] = useState(false);
  const [startTime] = useState(Date.now());
  const [quizAttemptId, setQuizAttemptId] = useState<string | null>(null);

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  // Handle fullscreen
  useEffect(() => {
    if (config.focusMode) {
      setIsFullscreen(true);
    }
  }, [config.focusMode]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const resetQuiz = useCallback(() => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShortAnswer("");
    setIsAnswered(false);
    setIsCorrect(false);
    setScore(0);
    setAnswers({});
    setQuestionStates(new Array(questions.length).fill('unanswered'));
    setShowResults(false);
  }, [questions.length]);

  const checkAnswer = () => {
    const userAnswer = currentQuestion.type === 'mcq' ? selectedAnswer : shortAnswer;
    if (!userAnswer) {
      toast.error("Please provide an answer");
      return;
    }

    let correct = false;
    if (currentQuestion.type === 'mcq') {
      correct = userAnswer === currentQuestion.correctAnswer;
    } else {
      const normalizedUser = userAnswer.toLowerCase().trim();
      const normalizedCorrect = currentQuestion.correctAnswer.toLowerCase().trim();
      correct = normalizedUser === normalizedCorrect || 
                normalizedCorrect.includes(normalizedUser) ||
                normalizedUser.includes(normalizedCorrect);
    }

    setIsCorrect(correct);
    setIsAnswered(true);
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: userAnswer }));
    setQuestionStates(prev => {
      const updated = [...prev];
      updated[currentIndex] = 'answered';
      return updated;
    });
    
    if (correct) {
      setScore(prev => prev + 1);
    }
  };

  const skipQuestion = () => {
    setQuestionStates(prev => {
      const updated = [...prev];
      updated[currentIndex] = 'skipped';
      return updated;
    });
    goToNextQuestion();
  };

  const markDoubtful = () => {
    setQuestionStates(prev => {
      const updated = [...prev];
      updated[currentIndex] = 'doubtful';
      return updated;
    });
  };

  const goToNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShortAnswer("");
      setIsAnswered(false);
      setIsCorrect(false);
    } else {
      completeQuiz();
    }
  };

  const goToPreviousQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      const prevAnswer = answers[questions[currentIndex - 1].id];
      if (prevAnswer) {
        if (questions[currentIndex - 1].type === 'mcq') {
          setSelectedAnswer(prevAnswer);
        } else {
          setShortAnswer(prevAnswer);
        }
        setIsAnswered(true);
      } else {
        setSelectedAnswer(null);
        setShortAnswer("");
        setIsAnswered(false);
      }
    }
  };

  const jumpToQuestion = (index: number) => {
    setCurrentIndex(index);
    const answer = answers[questions[index].id];
    if (answer) {
      if (questions[index].type === 'mcq') {
        setSelectedAnswer(answer);
        setShortAnswer("");
      } else {
        setShortAnswer(answer);
        setSelectedAnswer(null);
      }
      setIsAnswered(true);
    } else {
      setSelectedAnswer(null);
      setShortAnswer("");
      setIsAnswered(false);
    }
  };

  const completeQuiz = async () => {
    const totalTime = Math.round((Date.now() - startTime) / 1000);
    
    try {
      const { data, error } = await supabase.from("quiz_attempts").insert({
        topic_id: topicId,
        user_id: userId,
        quiz_type: config.quizType,
        difficulty: config.difficulty,
        source_type: config.source,
        questions: questions as any,
        answers: answers as any,
        question_states: questionStates as any,
        score: score,
        max_score: questions.length,
        time_spent_seconds: totalTime,
        completed_at: new Date().toISOString(),
      }).select('id').single();

      if (data) {
        setQuizAttemptId(data.id);
      }
    } catch (error) {
      console.error("Failed to save quiz attempt:", error);
    }

    setShowResults(true);
  };

  const handleTimeUp = useCallback(() => {
    toast.warning("Time's up! Submitting your quiz...");
    completeQuiz();
  }, []);

  if (showResults) {
    return (
      <div className={cn(
        "p-6",
        isFullscreen && "fixed inset-0 z-50 bg-background overflow-auto"
      )}>
        {isFullscreen && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4"
            onClick={() => setIsFullscreen(false)}
          >
            <Minimize2 className="w-5 h-5" />
          </Button>
        )}
        <QuizReviewPanel
          questions={questions}
          answers={answers}
          score={score}
          totalTime={Math.round((Date.now() - startTime) / 1000)}
          onRetake={resetQuiz}
          onNewQuiz={onNewQuiz}
          onConvertToFlashcards={onConvertToFlashcards}
          onClose={onClose}
          topicTitle={topicTitle}
        />
      </div>
    );
  }

  return (
    <div className={cn(
      "flex flex-col",
      isFullscreen && "fixed inset-0 z-50 bg-background p-6"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">
            Question {currentIndex + 1} of {questions.length}
          </h2>
          <span className="text-sm text-muted-foreground">Score: {score}</span>
        </div>
        
        <div className="flex items-center gap-2">
          {config.timerEnabled && (
            <QuizTimer
              totalSeconds={config.timerMinutes * 60}
              isPaused={isPaused}
              onPause={() => setIsPaused(true)}
              onResume={() => setIsPaused(false)}
              onTimeUp={handleTimeUp}
            />
          )}
          
          <QuizNavigation
            totalQuestions={questions.length}
            currentIndex={currentIndex}
            questionStates={questionStates}
            onJumpTo={jumpToQuestion}
          />

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>

          {!isFullscreen && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <Progress value={progress} className="h-1 mb-6" />

      {/* Pause Overlay */}
      {isPaused && (
        <div className="absolute inset-0 bg-background/95 flex items-center justify-center z-10 rounded-lg">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">Quiz Paused</h3>
            <p className="text-muted-foreground mb-6">Take your time. Click resume when ready.</p>
            <Button onClick={() => setIsPaused(false)}>Resume Quiz</Button>
          </div>
        </div>
      )}

      {/* Question Content */}
      <div className="flex-1 py-4">
        <div className="flex items-center gap-2 mb-4">
          {currentQuestion.difficulty && (
            <span className={cn(
              "text-xs px-2 py-1 rounded-full capitalize",
              currentQuestion.difficulty === 'easy' && "bg-green-500/20 text-green-400",
              currentQuestion.difficulty === 'medium' && "bg-yellow-500/20 text-yellow-400",
              currentQuestion.difficulty === 'hard' && "bg-red-500/20 text-red-400"
            )}>
              {currentQuestion.difficulty}
            </span>
          )}
          <span className="text-xs text-muted-foreground capitalize">
            {currentQuestion.type === 'mcq' ? 'Multiple Choice' : 'Short Answer'}
          </span>
        </div>

        <p className="text-lg font-medium text-foreground mb-6">
          {currentQuestion.question}
        </p>

        {currentQuestion.type === 'mcq' ? (
          <div className="space-y-3">
            {currentQuestion.options?.map((option, index) => (
              <button
                key={index}
                onClick={() => !isAnswered && setSelectedAnswer(option)}
                disabled={isAnswered}
                className={cn(
                  "w-full p-4 rounded-lg border text-left transition-all",
                  "hover:bg-primary/5 hover:border-primary/50",
                  selectedAnswer === option && !isAnswered && "border-primary bg-primary/10",
                  isAnswered && option === currentQuestion.correctAnswer && "border-green-500 bg-green-500/10",
                  isAnswered && selectedAnswer === option && option !== currentQuestion.correctAnswer && "border-red-500 bg-red-500/10"
                )}
              >
                <div className="flex items-center justify-between">
                  <span>{option}</span>
                  {isAnswered && option === currentQuestion.correctAnswer && (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  )}
                  {isAnswered && selectedAnswer === option && option !== currentQuestion.correctAnswer && (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <Input
            value={shortAnswer}
            onChange={(e) => setShortAnswer(e.target.value)}
            placeholder="Type your answer..."
            disabled={isAnswered}
            className="bg-background/50"
            onKeyDown={(e) => e.key === 'Enter' && !isAnswered && checkAnswer()}
          />
        )}

        {/* Feedback */}
        {isAnswered && (
          <div className={cn(
            "mt-4 p-4 rounded-lg animate-fade-in",
            isCorrect ? "bg-green-500/10 border border-green-500/30" : "bg-amber-500/10 border border-amber-500/30"
          )}>
            {isCorrect ? (
              <div>
                <p className="font-medium text-green-400 mb-1">
                  ✨ {currentQuestion.encouragement}
                </p>
              </div>
            ) : (
              <div>
                <p className="font-medium text-amber-400 mb-1">
                  Not quite, but that's okay! Learning is a process.
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Correct answer:</strong> {currentQuestion.correctAnswer}
                </p>
              </div>
            )}
            <p className="text-sm text-muted-foreground mt-2">
              {currentQuestion.explanation}
            </p>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div className="flex items-center gap-2">
          <DoubtReportButton
            quizAttemptId={quizAttemptId || undefined}
            questionIndex={currentIndex}
            userId={userId}
          />
          
          {!isAnswered && questionStates[currentIndex] !== 'doubtful' && (
            <Button variant="ghost" size="sm" onClick={markDoubtful} className="gap-2 text-orange-400">
              <HelpCircle className="w-4 h-4" />
              Mark as Doubtful
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {currentIndex > 0 && (
            <Button variant="outline" onClick={goToPreviousQuestion}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
          )}

          {!isAnswered ? (
            <>
              <Button variant="outline" onClick={skipQuestion}>
                <SkipForward className="w-4 h-4 mr-2" />
                Skip
              </Button>
              <Button onClick={checkAnswer}>
                Check Answer
              </Button>
            </>
          ) : (
            <Button onClick={goToNextQuestion}>
              {currentIndex < questions.length - 1 ? (
                <>
                  Next Question
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              ) : (
                "See Results"
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
