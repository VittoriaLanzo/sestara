import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Trophy, Clock, Target, CheckCircle2, XCircle, 
  RotateCcw, Plus, Save, ChevronDown, ChevronUp,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CustomQuiz } from "@/hooks/useCustomQuizzes";
import { motion } from "framer-motion";

interface CustomQuizResultsProps {
  quiz: CustomQuiz;
  answers: Record<string, string>;
  score: number;
  timeTaken: number;
  onRetake: () => void;
  onNewQuiz: () => void;
  onSaveQuiz?: () => void;
}

export const CustomQuizResults = ({
  quiz,
  answers,
  score,
  timeTaken,
  onRetake,
  onNewQuiz,
  onSaveQuiz,
}: CustomQuizResultsProps) => {
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  const totalQuestions = quiz.questions.length;
  const percentage = Math.round((score / totalQuestions) * 100);
  const skippedCount = totalQuestions - Object.keys(answers).length;
  const incorrectCount = totalQuestions - score - skippedCount;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getPerformanceMessage = () => {
    if (percentage === 100) return { text: "Perfect score! You're amazing! 🌟", color: "text-yellow-400" };
    if (percentage >= 80) return { text: "Excellent work! Almost perfect! 🎉", color: "text-green-400" };
    if (percentage >= 60) return { text: "Good job! Keep practicing! 💪", color: "text-blue-400" };
    if (percentage >= 40) return { text: "Nice effort! Review and improve! 📚", color: "text-orange-400" };
    return { text: "Every attempt is progress! Keep going! 🌱", color: "text-purple-400" };
  };

  const performance = getPerformanceMessage();

  const getAnswerStatus = (questionId: string, correctAnswer: string) => {
    const userAnswer = answers[questionId];
    if (!userAnswer) return 'skipped';
    return userAnswer.toUpperCase() === correctAnswer.toUpperCase() ? 'correct' : 'incorrect';
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-4xl mx-auto"
        >
          {/* Score Card */}
          <Card className="glass-card overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-background shadow-xl mb-4"
              >
                <Trophy className={cn(
                  "w-12 h-12",
                  percentage >= 80 ? "text-yellow-500" : 
                  percentage >= 60 ? "text-green-500" : 
                  percentage >= 40 ? "text-blue-500" : "text-muted-foreground"
                )} />
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-5xl font-bold mb-2"
              >
                {percentage}%
              </motion.h1>
              <p className={cn("text-lg font-medium", performance.color)}>
                {performance.text}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {quiz.quizTitle}
              </p>
            </div>

            <CardContent className="p-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 rounded-lg bg-muted/30">
                  <div className="flex items-center justify-center gap-2 text-green-500 mb-1">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="text-2xl font-bold">{score}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Correct</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/30">
                  <div className="flex items-center justify-center gap-2 text-red-500 mb-1">
                    <XCircle className="w-5 h-5" />
                    <span className="text-2xl font-bold">{incorrectCount}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Incorrect</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/30">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
                    <Target className="w-5 h-5" />
                    <span className="text-2xl font-bold">{skippedCount}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Skipped</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/30">
                  <div className="flex items-center justify-center gap-2 text-primary mb-1">
                    <Clock className="w-5 h-5" />
                    <span className="text-2xl font-bold">{formatTime(timeTaken)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Time Taken</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3 justify-center">
                <Button onClick={onRetake} variant="outline" className="gap-2">
                  <RotateCcw className="w-4 h-4" />
                  Retake Quiz
                </Button>
                {onSaveQuiz && (
                  <Button onClick={onSaveQuiz} variant="outline" className="gap-2">
                    <Save className="w-4 h-4" />
                    Save to Library
                  </Button>
                )}
                <Button onClick={onNewQuiz} className="gap-2">
                  <Plus className="w-4 h-4" />
                  New Quiz
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Review Section */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Review Answers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all">
                <TabsList className="mb-4">
                  <TabsTrigger value="all">All ({totalQuestions})</TabsTrigger>
                  <TabsTrigger value="incorrect">Incorrect ({incorrectCount})</TabsTrigger>
                  <TabsTrigger value="skipped">Skipped ({skippedCount})</TabsTrigger>
                </TabsList>

                <TabsContent value="all">
                  <ReviewList 
                    questions={quiz.questions}
                    answers={answers}
                    expandedQuestion={expandedQuestion}
                    setExpandedQuestion={setExpandedQuestion}
                  />
                </TabsContent>
                <TabsContent value="incorrect">
                  <ReviewList 
                    questions={quiz.questions.filter(q => 
                      answers[q.id] && answers[q.id].toUpperCase() !== q.correctAnswer.toUpperCase()
                    )}
                    answers={answers}
                    expandedQuestion={expandedQuestion}
                    setExpandedQuestion={setExpandedQuestion}
                  />
                </TabsContent>
                <TabsContent value="skipped">
                  <ReviewList 
                    questions={quiz.questions.filter(q => !answers[q.id])}
                    answers={answers}
                    expandedQuestion={expandedQuestion}
                    setExpandedQuestion={setExpandedQuestion}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

interface ReviewListProps {
  questions: CustomQuiz['questions'];
  answers: Record<string, string>;
  expandedQuestion: string | null;
  setExpandedQuestion: (id: string | null) => void;
}

const ReviewList = ({ questions, answers, expandedQuestion, setExpandedQuestion }: ReviewListProps) => {
  if (questions.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No questions to show in this category.
      </div>
    );
  }

  return (
    <ScrollArea className="h-[500px]">
      <div className="space-y-3 pr-4">
        {questions.map((q, idx) => {
          const userAnswer = answers[q.id];
          const isCorrect = userAnswer?.toUpperCase() === q.correctAnswer.toUpperCase();
          const isSkipped = !userAnswer;
          const isExpanded = expandedQuestion === q.id;

          return (
            <div
              key={q.id}
              className={cn(
                "border rounded-lg overflow-hidden transition-colors",
                isCorrect && "border-green-500/30 bg-green-500/5",
                !isCorrect && !isSkipped && "border-red-500/30 bg-red-500/5",
                isSkipped && "border-muted"
              )}
            >
              <button
                onClick={() => setExpandedQuestion(isExpanded ? null : q.id)}
                className="w-full p-4 text-left flex items-start gap-3"
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                  isCorrect && "bg-green-500/20 text-green-500",
                  !isCorrect && !isSkipped && "bg-red-500/20 text-red-500",
                  isSkipped && "bg-muted text-muted-foreground"
                )}>
                  {isCorrect ? <CheckCircle2 className="w-4 h-4" /> : 
                   isSkipped ? <Target className="w-4 h-4" /> : 
                   <XCircle className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium line-clamp-2">{q.question}</p>
                  <div className="flex gap-2 mt-1">
                    {userAnswer && (
                      <Badge variant={isCorrect ? "default" : "destructive"} className="text-xs">
                        Your answer: {userAnswer}
                      </Badge>
                    )}
                    {!isCorrect && (
                      <Badge variant="outline" className="text-xs text-green-600">
                        Correct: {q.correctAnswer}
                      </Badge>
                    )}
                  </div>
                </div>
                {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 pt-0 border-t bg-muted/20">
                  <div className="mt-4 space-y-4">
                    {/* Options */}
                    <div className="space-y-2">
                      {q.options.map((opt, i) => {
                        const letter = opt.charAt(0).toUpperCase();
                        const isCorrectOption = letter === q.correctAnswer.toUpperCase();
                        const isUserOption = letter === userAnswer?.toUpperCase();
                        
                        return (
                          <div
                            key={i}
                            className={cn(
                              "p-3 rounded-lg text-sm flex items-center gap-2",
                              isCorrectOption && "bg-green-500/10 border border-green-500/30",
                              isUserOption && !isCorrectOption && "bg-red-500/10 border border-red-500/30",
                              !isCorrectOption && !isUserOption && "bg-muted/30"
                            )}
                          >
                            {isCorrectOption && <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />}
                            {isUserOption && !isCorrectOption && <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />}
                            <span>{opt}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    {q.explanation && (
                      <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                        <p className="text-sm font-medium mb-1">Explanation:</p>
                        <p className="text-sm text-muted-foreground">{q.explanation}</p>
                      </div>
                    )}

                    {/* Keywords */}
                    {(q.keywordsEnglish?.length || q.keywordsLocal?.length) && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Keywords:</p>
                        <div className="flex flex-wrap gap-1">
                          {q.keywordsEnglish?.map((kw, i) => (
                            <Badge key={`en-${i}`} variant="outline" className="text-xs">{kw}</Badge>
                          ))}
                          {q.keywordsLocal?.map((kw, i) => (
                            <Badge key={`local-${i}`} variant="secondary" className="text-xs">{kw}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
};
