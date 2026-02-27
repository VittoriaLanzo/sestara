import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  ChevronLeft, ChevronRight, Check, X, HelpCircle, 
  Maximize, Minimize, Pause, Play, Timer, Clock,
  Flag, RotateCcw, Send, Share2
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CustomQuiz } from "@/hooks/useCustomQuizzes";
import { InQuizChallengeButton } from "@/components/challenge/InQuizChallengeButton";
import { evaluateAnswer } from "@/lib/quizScoring";

interface CustomQuizViewerProps {
  quiz: CustomQuiz;
  mode: 'timer' | 'track';
  timerMinutes: number;
  onComplete: (answers: Record<string, string>, score: number, timeTaken: number) => void;
  onCancel: () => void;
}

type QuestionState = 'not-visited' | 'visited' | 'answered' | 'doubtful';

export const CustomQuizViewer = ({
  quiz,
  mode,
  timerMinutes,
  onComplete,
  onCancel,
}: CustomQuizViewerProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [questionStates, setQuestionStates] = useState<QuestionState[]>(
    quiz.questions.map(() => 'not-visited')
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(timerMinutes * 60);

  const currentQuestion = quiz.questions[currentIndex];
  const totalQuestions = quiz.questions.length;

  // Timer logic
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      if (mode === 'timer') {
        setRemainingSeconds(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      } else {
        setElapsedSeconds(prev => prev + 1);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, mode]);

  // Mark as visited when viewing
  useEffect(() => {
    if (questionStates[currentIndex] === 'not-visited') {
      const newStates = [...questionStates];
      newStates[currentIndex] = 'visited';
      setQuestionStates(newStates);
    }
  }, [currentIndex]);

  // Fullscreen handling
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectAnswer = (option: string) => {
    if (isPaused) return;
    
    // Extract letter from option (e.g., "A) Answer" -> "A")
    // Only proceed if the option starts with a valid letter format
    const letterMatch = option.match(/^([A-Z])\)/i);
    if (!letterMatch) return;
    
    const letter = letterMatch[1].toUpperCase();
    
    // Prevent selecting the same answer again (no toggle behavior)
    if (answers[currentQuestion.id] === letter) return;
    
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: letter }));
    
    const newStates = [...questionStates];
    newStates[currentIndex] = 'answered';
    setQuestionStates(newStates);
  };

  const handleClearAnswer = () => {
    const newAnswers = { ...answers };
    delete newAnswers[currentQuestion.id];
    setAnswers(newAnswers);
    
    const newStates = [...questionStates];
    newStates[currentIndex] = 'visited';
    setQuestionStates(newStates);
  };

  const handleMarkDoubtful = () => {
    const newStates = [...questionStates];
    newStates[currentIndex] = newStates[currentIndex] === 'doubtful' ? 
      (answers[currentQuestion.id] ? 'answered' : 'visited') : 'doubtful';
    setQuestionStates(newStates);
  };

  const handleSubmit = () => {
    let score = 0;
    quiz.questions.forEach(q => {
      const userAnswer = answers[q.id];
      if (evaluateAnswer(userAnswer, q.correctAnswer, 'mcq', q.options)) {
        score++;
      }
    });
    
    const timeTaken = mode === 'timer' 
      ? (timerMinutes * 60) - remainingSeconds 
      : elapsedSeconds;
    
    onComplete(answers, score, timeTaken);
  };

  const answeredCount = questionStates.filter(s => s === 'answered').length;
  const doubtfulCount = questionStates.filter(s => s === 'doubtful').length;
  const progress = (answeredCount / totalQuestions) * 100;

  const getStateColor = (state: QuestionState, isCurrent: boolean) => {
    if (isCurrent) return "ring-2 ring-primary ring-offset-2 ring-offset-background bg-primary text-primary-foreground";
    switch (state) {
      case 'answered': return "bg-green-500/20 text-green-500 border-green-500/50";
      case 'doubtful': return "bg-orange-500/20 text-orange-500 border-orange-500/50";
      case 'visited': return "bg-muted text-muted-foreground";
      default: return "bg-background border-border text-muted-foreground";
    }
  };

  return (
    <div className={cn(
      "min-h-screen bg-background flex flex-col",
      isFullscreen && "fixed inset-0 z-50"
    )}>
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <h2 className="font-semibold truncate">{quiz.quizTitle}</h2>
              <Badge variant="secondary" className="hidden sm:inline-flex">
                {currentIndex + 1} / {totalQuestions}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              {/* Timer */}
              <div className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full font-mono text-sm",
                mode === 'timer' && remainingSeconds <= 60 && "bg-destructive/20 text-destructive animate-pulse",
                mode === 'timer' && remainingSeconds > 60 && "bg-primary/10 text-primary",
                mode === 'track' && "bg-muted text-muted-foreground"
              )}>
                {mode === 'timer' ? <Timer className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                <span>{formatTime(mode === 'timer' ? remainingSeconds : elapsedSeconds)}</span>
              </div>

              {mode === 'timer' && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsPaused(!isPaused)}
                  className="h-8 w-8"
                >
                  {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                </Button>
              )}

              {/* Challenge Button - available during quiz */}
              <InQuizChallengeButton quiz={quiz} isCompact />

              <Button
                variant="ghost"
                size="icon"
                onClick={toggleFullscreen}
                className="h-8 w-8 hidden sm:flex"
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </Button>

              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowCancelDialog(true)}
              >
                <X className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Exit</span>
              </Button>
            </div>
          </div>

          {/* Progress bar */}
          <Progress value={progress} className="h-1 mt-3" />
        </div>
      </div>

      {/* Paused Overlay */}
      {isPaused && (
        <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center">
          <Card className="p-8 text-center max-w-sm">
            <Pause className="w-12 h-12 mx-auto text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Quiz Paused</h3>
            <p className="text-muted-foreground mb-6">
              Your progress is saved. Resume when ready.
            </p>
            <Button onClick={() => setIsPaused(false)} size="lg" className="gap-2">
              <Play className="w-5 h-5" />
              Resume Quiz
            </Button>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 container mx-auto px-4 py-6 flex gap-6 overflow-hidden">
        {/* Left Sidebar - Question Navigator */}
        <div className="hidden lg:block w-64 flex-shrink-0">
          <Card className="sticky top-24">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-sm">Questions</h3>
                <div className="flex gap-2 text-xs">
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    {answeredCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-orange-500" />
                    {doubtfulCount}
                  </span>
                </div>
              </div>
              <ScrollArea className="h-[400px]">
                <div className="grid grid-cols-4 gap-2">
                  {quiz.questions.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentIndex(index)}
                      className={cn(
                        "w-10 h-10 rounded-lg border text-sm font-medium transition-all hover:scale-105",
                        getStateColor(questionStates[index], index === currentIndex)
                      )}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
              </ScrollArea>

              {/* Legend */}
              <div className="mt-4 pt-4 border-t space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded border bg-background" />
                  <span className="text-muted-foreground">Not visited</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-muted" />
                  <span className="text-muted-foreground">Visited</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-green-500/20 border-green-500/50" />
                  <span className="text-muted-foreground">Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-orange-500/20 border-orange-500/50" />
                  <span className="text-muted-foreground">Doubtful</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Question Area */}
        <div className="flex-1 min-w-0">
          <ScrollArea className="h-[calc(100vh-200px)]">
            <Card className="glass-card">
              <CardContent className="p-6 md:p-8">
                {/* Question Header */}
                <div className="flex items-center gap-3 mb-6">
                  <Badge variant="outline" className="text-sm">
                    Q{currentIndex + 1}
                  </Badge>
                  {currentQuestion.difficulty && (
                    <Badge 
                      variant="secondary"
                      className={cn(
                        "capitalize",
                        currentQuestion.difficulty === 'easy' && "bg-green-500/10 text-green-500",
                        currentQuestion.difficulty === 'medium' && "bg-yellow-500/10 text-yellow-500",
                        currentQuestion.difficulty === 'hard' && "bg-red-500/10 text-red-500"
                      )}
                    >
                      {currentQuestion.difficulty}
                    </Badge>
                  )}
                  {questionStates[currentIndex] === 'doubtful' && (
                    <Badge variant="secondary" className="bg-orange-500/10 text-orange-500">
                      <Flag className="w-3 h-3 mr-1" />
                      Marked for Review
                    </Badge>
                  )}
                </div>

                {/* Question Text */}
                <h3 className="text-lg md:text-xl font-medium mb-8 leading-relaxed">
                  {currentQuestion.question}
                </h3>

                {/* Options */}
                <div className="space-y-3">
                  {currentQuestion.options.map((option, idx) => {
                    // Safely extract letter from option format "A) Answer text"
                    const letterMatch = option.match(/^([A-Z])\)/i);
                    const letter = letterMatch ? letterMatch[1].toUpperCase() : String.fromCharCode(65 + idx);
                    const isSelected = answers[currentQuestion.id] === letter;
                    const optionText = option.replace(/^[A-Z]\)\s*/i, '');
                    
                    return (
                      <button
                        key={`${currentQuestion.id}-option-${idx}`}
                        onClick={() => handleSelectAnswer(option)}
                        disabled={isPaused}
                        type="button"
                        className={cn(
                          "w-full p-4 rounded-xl border text-left transition-all",
                          "hover:border-primary/50 hover:bg-primary/5",
                          isSelected && "border-primary bg-primary/10 ring-2 ring-primary/20",
                          isPaused && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center font-medium text-sm flex-shrink-0",
                            isSelected 
                              ? "bg-primary text-primary-foreground" 
                              : "bg-muted text-muted-foreground"
                          )}>
                            {letter}
                          </div>
                          <span className="flex-1 pt-1">{optionText}</span>
                          {isSelected && <Check className="w-5 h-5 text-primary flex-shrink-0" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Keywords */}
                {(currentQuestion.keywordsEnglish?.length || currentQuestion.keywordsLocal?.length) && (
                  <div className="mt-8 pt-6 border-t">
                    <p className="text-sm text-muted-foreground mb-2">Keywords:</p>
                    <div className="flex flex-wrap gap-2">
                      {currentQuestion.keywordsEnglish?.map((kw, i) => (
                        <Badge key={`en-${i}`} variant="outline">{kw}</Badge>
                      ))}
                      {currentQuestion.keywordsLocal?.map((kw, i) => (
                        <Badge key={`local-${i}`} variant="secondary">{kw}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </ScrollArea>

          {/* Bottom Actions */}
          <div className="mt-4 flex flex-wrap gap-3 items-center justify-between bg-background py-4">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAnswer}
                disabled={!answers[currentQuestion.id] || isPaused}
                className="gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Clear
              </Button>
              <Button
                variant={questionStates[currentIndex] === 'doubtful' ? "default" : "outline"}
                size="sm"
                onClick={handleMarkDoubtful}
                disabled={isPaused}
                className="gap-2"
              >
                <Flag className="w-4 h-4" />
                {questionStates[currentIndex] === 'doubtful' ? 'Marked' : 'Mark for Review'}
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                disabled={currentIndex === 0 || isPaused}
                className="gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>

              {currentIndex < totalQuestions - 1 ? (
                <Button
                  onClick={() => setCurrentIndex(currentIndex + 1)}
                  disabled={isPaused}
                  className="gap-2"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={() => setShowSubmitDialog(true)}
                  disabled={isPaused}
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  <Send className="w-4 h-4" />
                  Submit Quiz
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Exit Quiz?</AlertDialogTitle>
            <AlertDialogDescription>
              Your progress will be lost. Are you sure you want to exit?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Quiz</AlertDialogCancel>
            <AlertDialogAction onClick={onCancel} className="bg-destructive hover:bg-destructive/90">
              Exit Quiz
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Submit Dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Quiz?</AlertDialogTitle>
            <AlertDialogDescription>
              You have answered {answeredCount} out of {totalQuestions} questions.
              {answeredCount < totalQuestions && (
                <span className="block mt-2 text-orange-500">
                  Warning: {totalQuestions - answeredCount} questions are unanswered.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Review Answers</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit}>
              Submit Quiz
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
