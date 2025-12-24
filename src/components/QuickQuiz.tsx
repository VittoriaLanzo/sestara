import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { CheckCircle2, XCircle, Sparkles } from "lucide-react";

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

interface QuickQuizProps {
  topic: string;
  questions: QuizQuestion[];
  onComplete?: (score: number) => void;
}

export const QuickQuiz = ({ topic, questions, onComplete }: QuickQuizProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);

  const currentQuestion = questions[currentIndex];
  const isCorrect = selectedAnswer === currentQuestion?.correctIndex;
  const isLastQuestion = currentIndex === questions.length - 1;

  const handleAnswer = (index: number) => {
    if (showResult) return;
    setSelectedAnswer(index);
    setShowResult(true);
    if (index === currentQuestion.correctIndex) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (isLastQuestion) {
      onComplete?.(score + (isCorrect ? 1 : 0));
    } else {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-primary" />
        <h3 className="font-display font-semibold text-foreground">Quick Quiz: {topic}</h3>
        <span className="ml-auto text-sm text-muted-foreground">
          {currentIndex + 1}/{questions.length}
        </span>
      </div>

      <p className="text-foreground mb-4">{currentQuestion.question}</p>

      <div className="space-y-2 mb-4">
        {currentQuestion.options.map((option, index) => {
          const isSelected = selectedAnswer === index;
          const isCorrectOption = index === currentQuestion.correctIndex;

          return (
            <button
              key={index}
              onClick={() => handleAnswer(index)}
              disabled={showResult}
              className={cn(
                "w-full p-3 rounded-lg text-left text-sm transition-all duration-200",
                "border border-border hover:border-primary/50",
                !showResult && "hover:bg-secondary",
                showResult && isCorrectOption && "bg-success/20 border-success text-success",
                showResult && isSelected && !isCorrectOption && "bg-destructive/20 border-destructive text-destructive",
                !showResult && isSelected && "bg-primary/10 border-primary"
              )}
            >
              <div className="flex items-center gap-2">
                {showResult && isCorrectOption && <CheckCircle2 className="w-4 h-4 text-success" />}
                {showResult && isSelected && !isCorrectOption && <XCircle className="w-4 h-4 text-destructive" />}
                <span>{option}</span>
              </div>
            </button>
          );
        })}
      </div>

      {showResult && (
        <div className="flex items-center justify-between">
          <p className={cn(
            "text-sm font-medium",
            isCorrect ? "text-success" : "text-destructive"
          )}>
            {isCorrect ? "Correct! 🎉" : "Not quite. Keep learning!"}
          </p>
          <Button onClick={handleNext} size="sm">
            {isLastQuestion ? "Finish" : "Next"}
          </Button>
        </div>
      )}
    </div>
  );
};
