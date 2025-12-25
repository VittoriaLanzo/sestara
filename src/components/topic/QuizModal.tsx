import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  Trophy,
  Sparkles,
  RotateCcw,
} from "lucide-react";

interface Question {
  id: string;
  type: 'mcq' | 'short';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  encouragement: string;
}

interface QuizModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questions: Question[] | null;
  topicId: string;
  userId: string;
}

export const QuizModal = ({
  open,
  onOpenChange,
  questions,
  topicId,
  userId,
}: QuizModalProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [shortAnswer, setShortAnswer] = useState("");
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (open) {
      resetQuiz();
    }
  }, [open, questions]);

  const resetQuiz = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShortAnswer("");
    setIsAnswered(false);
    setIsCorrect(false);
    setScore(0);
    setAnswers({});
    setShowResults(false);
  };

  if (!questions || questions.length === 0) return null;

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

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
      // For short answers, do a fuzzy match
      const normalizedUser = userAnswer.toLowerCase().trim();
      const normalizedCorrect = currentQuestion.correctAnswer.toLowerCase().trim();
      correct = normalizedUser === normalizedCorrect || 
                normalizedCorrect.includes(normalizedUser) ||
                normalizedUser.includes(normalizedCorrect);
    }

    setIsCorrect(correct);
    setIsAnswered(true);
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: userAnswer }));
    
    if (correct) {
      setScore(prev => prev + 1);
    }
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShortAnswer("");
      setIsAnswered(false);
      setIsCorrect(false);
    } else {
      // Quiz complete
      saveQuizAttempt();
      setShowResults(true);
    }
  };

  const saveQuizAttempt = async () => {
    try {
      await supabase.from("quiz_attempts").insert({
        topic_id: topicId,
        user_id: userId,
        quiz_type: 'mixed',
        questions: questions as any,
        answers: answers as any,
        score: score + (isCorrect ? 1 : 0),
        max_score: questions.length,
        completed_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Failed to save quiz attempt:", error);
    }
  };

  const getEncouragingMessage = () => {
    const percentage = ((score + (isCorrect ? 1 : 0)) / questions.length) * 100;
    if (percentage === 100) return "Perfect score! You've mastered this topic! 🌟";
    if (percentage >= 80) return "Excellent work! You're doing great! 🎉";
    if (percentage >= 60) return "Good job! Keep practicing and you'll get even better! 💪";
    if (percentage >= 40) return "Nice effort! Review the topic and try again - you've got this! 📚";
    return "Every attempt is a step forward! Review the material and give it another shot! 🌱";
  };

  if (showResults) {
    const finalScore = score + (isCorrect ? 1 : 0);
    const percentage = Math.round((finalScore / questions.length) * 100);

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="glass-card max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Quiz Complete!</DialogTitle>
          </DialogHeader>

          <div className="text-center py-6">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center">
              <Trophy className={cn(
                "w-12 h-12",
                percentage >= 80 ? "text-yellow-400" : "text-primary"
              )} />
            </div>

            <h3 className="text-3xl font-bold text-foreground mb-2">
              {finalScore} / {questions.length}
            </h3>
            <p className="text-xl text-muted-foreground mb-4">{percentage}% correct</p>

            <div className="bg-primary/10 rounded-lg p-4 mb-6">
              <Sparkles className="w-5 h-5 text-primary mx-auto mb-2" />
              <p className="text-foreground">{getEncouragingMessage()}</p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={resetQuiz}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <Button
                variant="default"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Question {currentIndex + 1} of {questions.length}</DialogTitle>
            <span className="text-sm text-muted-foreground">Score: {score}</span>
          </div>
          <Progress value={progress} className="h-1 mt-2" />
        </DialogHeader>

        <div className="py-4">
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

        <div className="flex justify-end gap-3">
          {!isAnswered ? (
            <Button onClick={checkAnswer} variant="default">
              Check Answer
            </Button>
          ) : (
            <Button onClick={nextQuestion} variant="default">
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
      </DialogContent>
    </Dialog>
  );
};
