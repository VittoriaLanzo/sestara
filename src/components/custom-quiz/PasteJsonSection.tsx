import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { 
  ClipboardPaste, CheckCircle2, AlertCircle, Play, 
  Timer, Clock, Info 
} from "lucide-react";
import { toast } from "sonner";
import { CustomQuiz, CustomQuizQuestion } from "@/pages/CustomQuizPage";

interface PasteJsonSectionProps {
  studyLanguage: string;
  onStartQuiz: (quiz: CustomQuiz, mode: 'timer' | 'track', minutes: number) => void;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  quiz?: CustomQuiz;
}

export const PasteJsonSection = ({ studyLanguage, onStartQuiz }: PasteJsonSectionProps) => {
  const [jsonInput, setJsonInput] = useState("");
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [durationMode, setDurationMode] = useState<'timer' | 'track'>('track');
  const [timerMinutes, setTimerMinutes] = useState(15);
  const [showModeSelection, setShowModeSelection] = useState(false);

  const validateJson = () => {
    const errors: string[] = [];
    
    if (!jsonInput.trim()) {
      setValidationResult({ valid: false, errors: ["Please paste your JSON quiz data"] });
      return;
    }

    try {
      const parsed = JSON.parse(jsonInput);
      
      // Validate required fields
      if (!parsed.questions || !Array.isArray(parsed.questions)) {
        errors.push("Missing 'questions' array");
      } else if (parsed.questions.length === 0) {
        errors.push("Questions array is empty");
      } else {
        parsed.questions.forEach((q: any, index: number) => {
          if (!q.question) {
            errors.push(`Question ${index + 1}: Missing 'question' text`);
          }
          if (!q.options || !Array.isArray(q.options) || q.options.length < 2) {
            errors.push(`Question ${index + 1}: Missing or invalid 'options' (need at least 2)`);
          }
          if (!q.correctAnswer) {
            errors.push(`Question ${index + 1}: Missing 'correctAnswer'`);
          }
          // Add id if missing
          if (!q.id) {
            q.id = `q${index + 1}`;
          }
        });
      }

      if (errors.length === 0) {
        const quiz: CustomQuiz = {
          quizTitle: parsed.quizTitle || 'Custom Quiz',
          description: parsed.description,
          examLevel: parsed.examLevel,
          language: parsed.language || studyLanguage,
          durationMode: parsed.durationMode || 'track',
          timerMinutes: parsed.timerMinutes,
          questions: parsed.questions.map((q: any, i: number) => ({
            id: q.id || `q${i + 1}`,
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            difficulty: q.difficulty,
            keywordsEnglish: q.keywordsEnglish,
            keywordsLocal: q.keywordsLocal,
          })),
        };

        // Calculate suggested timer
        const suggestedMinutes = Math.ceil(quiz.questions.length * 1.5);
        setTimerMinutes(suggestedMinutes);

        setValidationResult({ valid: true, errors: [], quiz });
        setShowModeSelection(true);
        toast.success(`Valid quiz with ${quiz.questions.length} questions!`);
      } else {
        setValidationResult({ valid: false, errors });
      }
    } catch (e) {
      setValidationResult({ 
        valid: false, 
        errors: ["Invalid JSON format. Make sure the AI output is pure JSON without extra text."] 
      });
    }
  };

  const handleStartQuiz = () => {
    if (validationResult?.valid && validationResult.quiz) {
      onStartQuiz(validationResult.quiz, durationMode, timerMinutes);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardPaste className="w-5 h-5 text-primary" />
            Paste Quiz JSON
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Paste your AI-generated JSON here</Label>
            <Textarea
              value={jsonInput}
              onChange={(e) => {
                setJsonInput(e.target.value);
                setValidationResult(null);
                setShowModeSelection(false);
              }}
              placeholder={`{
  "quizTitle": "My Quiz",
  "questions": [
    {
      "question": "...",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "correctAnswer": "A"
    }
  ]
}`}
              className="h-64 font-mono text-sm"
            />
          </div>

          <div className="flex gap-3">
            <Button onClick={validateJson} className="gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Validate JSON
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setJsonInput("");
                setValidationResult(null);
                setShowModeSelection(false);
              }}
            >
              Clear
            </Button>
          </div>

          {/* Validation Result */}
          {validationResult && (
            <div className={`p-4 rounded-lg ${
              validationResult.valid 
                ? 'bg-green-500/10 border border-green-500/20' 
                : 'bg-destructive/10 border border-destructive/20'
            }`}>
              {validationResult.valid ? (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-medium">
                    Valid! {validationResult.quiz?.questions.length} questions found
                  </span>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">Validation Errors</span>
                  </div>
                  <ul className="list-disc list-inside text-sm space-y-1 text-destructive/80">
                    {validationResult.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mode Selection */}
      {showModeSelection && validationResult?.valid && (
        <Card className="glass-card border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Timer className="w-5 h-5 text-primary" />
              Quiz Mode Selection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <RadioGroup 
              value={durationMode} 
              onValueChange={(v) => setDurationMode(v as 'timer' | 'track')}
              className="space-y-3"
            >
              <div className={`flex items-start gap-3 p-4 rounded-lg border transition-colors ${
                durationMode === 'timer' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
              }`}>
                <RadioGroupItem value="timer" id="timer" className="mt-1" />
                <Label htmlFor="timer" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2 font-medium">
                    <Timer className="w-4 h-4 text-primary" />
                    Timer Mode
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Countdown timer with auto-submit when time expires
                  </p>
                </Label>
              </div>
              
              <div className={`flex items-start gap-3 p-4 rounded-lg border transition-colors ${
                durationMode === 'track' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
              }`}>
                <RadioGroupItem value="track" id="track" className="mt-1" />
                <Label htmlFor="track" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2 font-medium">
                    <Clock className="w-4 h-4 text-primary" />
                    Track Time Mode
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    No time limit - records total time taken
                  </p>
                </Label>
              </div>
            </RadioGroup>

            {durationMode === 'timer' && (
              <div className="space-y-2">
                <Label>Timer Duration (minutes)</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    type="number"
                    min={1}
                    max={180}
                    value={timerMinutes}
                    onChange={(e) => setTimerMinutes(Math.max(1, parseInt(e.target.value) || 15))}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">
                    Suggested: {Math.ceil((validationResult.quiz?.questions.length || 10) * 1.5)} min
                  </span>
                </div>
              </div>
            )}

            <div className="p-3 rounded-lg bg-muted/50 flex items-start gap-2">
              <Info className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                Quiz: <strong>{validationResult.quiz?.quizTitle}</strong> • 
                {validationResult.quiz?.questions.length} questions
                {validationResult.quiz?.examLevel && ` • ${validationResult.quiz.examLevel}`}
              </p>
            </div>

            <Button onClick={handleStartQuiz} size="lg" className="w-full gap-2">
              <Play className="w-5 h-5" />
              Start Quiz
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
