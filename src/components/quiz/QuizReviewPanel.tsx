import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Trophy,
  Target,
  Brain,
  Sparkles,
  RotateCcw,
  Layers,
  CheckCircle2,
  XCircle,
  Lightbulb,
  TrendingUp,
  Loader2,
  Users,
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

interface QuizReviewPanelProps {
  questions: Question[];
  answers: Record<string, string>;
  score: number;
  totalTime?: number;
  onRetake: () => void;
  onNewQuiz: () => void;
  onConvertToFlashcards: (wrongQuestions: Question[]) => void;
  onClose: () => void;
  topicTitle: string;
  onChallengeCreate?: () => void;
}

export const QuizReviewPanel = ({
  questions,
  answers,
  score,
  totalTime,
  onRetake,
  onNewQuiz,
  onConvertToFlashcards,
  onClose,
  topicTitle,
  onChallengeCreate,
}: QuizReviewPanelProps) => {
  const [showDetails, setShowDetails] = useState(false);
  const [loadingExplanation, setLoadingExplanation] = useState<string | null>(null);
  const [aiExplanations, setAiExplanations] = useState<Record<string, string>>({});

  const percentage = Math.round((score / questions.length) * 100);
  
  const wrongQuestions = questions.filter(q => {
    const userAnswer = answers[q.id];
    if (!userAnswer) return true;
    if (q.type === 'mcq') return userAnswer !== q.correctAnswer;
    const normalized = userAnswer.toLowerCase().trim();
    const correct = q.correctAnswer.toLowerCase().trim();
    return normalized !== correct && !correct.includes(normalized) && !normalized.includes(correct);
  });

  const getPerformanceMessage = () => {
    if (percentage === 100) return { text: "Perfect score! You've mastered this! 🌟", color: "text-yellow-400" };
    if (percentage >= 80) return { text: "Excellent work! Almost there! 🎉", color: "text-green-400" };
    if (percentage >= 60) return { text: "Good job! Keep practicing! 💪", color: "text-blue-400" };
    if (percentage >= 40) return { text: "Nice effort! Review and try again! 📚", color: "text-orange-400" };
    return { text: "Every attempt is progress! You've got this! 🌱", color: "text-purple-400" };
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getAIExplanation = async (question: Question) => {
    if (aiExplanations[question.id]) return;
    
    setLoadingExplanation(question.id);
    try {
      const userAnswer = answers[question.id] || "(no answer)";
      const { data, error } = await supabase.functions.invoke('topic-ai', {
        body: {
          action: 'explain-wrong',
          topicTitle: topicTitle,
          question: question.question,
          correctAnswer: question.correctAnswer,
          userAnswer: userAnswer,
        }
      });

      if (error) throw error;
      setAiExplanations(prev => ({ ...prev, [question.id]: data.content }));
    } catch (error) {
      toast.error("Failed to get AI explanation");
    } finally {
      setLoadingExplanation(null);
    }
  };

  const performance = getPerformanceMessage();

  return (
    <div className="space-y-6">
      {/* Score Overview */}
      <div className="text-center py-6">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center">
          <Trophy className={cn(
            "w-12 h-12",
            percentage >= 80 ? "text-yellow-400" : "text-primary"
          )} />
        </div>

        <h2 className="text-3xl font-bold text-foreground mb-2">
          {score} / {questions.length}
        </h2>
        <p className="text-xl text-muted-foreground mb-2">{percentage}% correct</p>
        
        {totalTime && (
          <p className="text-sm text-muted-foreground mb-4">
            Completed in {formatTime(totalTime)}
          </p>
        )}

        <div className="bg-primary/10 rounded-lg p-4 inline-block">
          <Sparkles className="w-5 h-5 text-primary mx-auto mb-2" />
          <p className={cn("font-medium", performance.color)}>{performance.text}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-4 text-center">
            <CheckCircle2 className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{score}</p>
            <p className="text-xs text-muted-foreground">Correct</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-4 text-center">
            <XCircle className="w-6 h-6 text-red-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{wrongQuestions.length}</p>
            <p className="text-xs text-muted-foreground">Incorrect</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-4 text-center">
            <Target className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{percentage}%</p>
            <p className="text-xs text-muted-foreground">Accuracy</p>
          </CardContent>
        </Card>
      </div>

      {/* Weak Areas */}
      {wrongQuestions.length > 0 && (
        <Card className="glass-card border-orange-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="w-5 h-5 text-orange-400" />
              Areas for Improvement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Review these {wrongQuestions.length} question{wrongQuestions.length > 1 ? 's' : ''} to strengthen your understanding.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? 'Hide Details' : 'Show Details'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Detailed Review */}
      {showDetails && wrongQuestions.length > 0 && (
        <ScrollArea className="h-[300px]">
          <div className="space-y-4">
            {wrongQuestions.map((question, index) => (
              <Card key={question.id} className="glass-card">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-3">
                    <Badge variant="outline" className="text-red-400 border-red-400/50">
                      Question {questions.indexOf(question) + 1}
                    </Badge>
                    {question.difficulty && (
                      <Badge variant="secondary" className="capitalize">
                        {question.difficulty}
                      </Badge>
                    )}
                  </div>
                  
                  <p className="font-medium text-foreground mb-3">{question.question}</p>
                  
                  <div className="space-y-2 text-sm">
                    <p className="text-muted-foreground">
                      <span className="text-red-400">Your answer:</span> {answers[question.id] || "(no answer)"}
                    </p>
                    <p className="text-muted-foreground">
                      <span className="text-green-400">Correct answer:</span> {question.correctAnswer}
                    </p>
                    <p className="text-muted-foreground italic">
                      {question.explanation}
                    </p>
                  </div>

                  {/* AI Explanation */}
                  <div className="mt-3">
                    {aiExplanations[question.id] ? (
                      <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
                        <div className="flex items-center gap-2 mb-2">
                          <Brain className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium text-primary">AI Explanation</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{aiExplanations[question.id]}</p>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => getAIExplanation(question)}
                        disabled={loadingExplanation === question.id}
                        className="text-primary"
                      >
                        {loadingExplanation === question.id ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Getting explanation...
                          </>
                        ) : (
                          <>
                            <Lightbulb className="w-4 h-4 mr-2" />
                            Explain this
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}

      <Separator />

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" onClick={onRetake} className="gap-2">
          <RotateCcw className="w-4 h-4" />
          Retake Quiz
        </Button>
        <Button variant="outline" onClick={onNewQuiz} className="gap-2">
          <Sparkles className="w-4 h-4" />
          New Quiz
        </Button>
        {onChallengeCreate && (
          <Button 
            variant="outline" 
            onClick={onChallengeCreate}
            className="col-span-2 gap-2"
          >
            <Users className="w-4 h-4" />
            Challenge Friends
          </Button>
        )}
        {wrongQuestions.length > 0 && (
          <Button 
            variant="outline" 
            onClick={() => onConvertToFlashcards(wrongQuestions)}
            className="col-span-2 gap-2"
          >
            <Layers className="w-4 h-4" />
            Convert Wrong Answers to Flashcards
          </Button>
        )}
        <Button variant="default" onClick={onClose} className="col-span-2">
          Done
        </Button>
      </div>
    </div>
  );
};
