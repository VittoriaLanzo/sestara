import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Play,
  Timer,
  Layers,
  FileText,
  Youtube,
  BookOpen,
  Sparkles,
  Settings2,
} from "lucide-react";

export interface QuizConfig {
  questionCount: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  quizType: 'mcq' | 'short' | 'mixed';
  source: 'topic' | 'subject' | 'pdf' | 'youtube';
  sourceUrl?: string;
  timerEnabled: boolean;
  timerMinutes: number;
  focusMode: boolean;
}

interface QuizConfigPanelProps {
  onStart: (config: QuizConfig) => void;
  isLoading?: boolean;
  defaultSource?: 'topic' | 'subject';
}

export const QuizConfigPanel = ({
  onStart,
  isLoading = false,
  defaultSource = 'topic',
}: QuizConfigPanelProps) => {
  const [config, setConfig] = useState<QuizConfig>({
    questionCount: 10,
    difficulty: 'mixed',
    quizType: 'mixed',
    source: defaultSource,
    timerEnabled: false,
    timerMinutes: 10,
    focusMode: false,
  });

  const presetCounts = [5, 10, 15, 20];

  const suggestedTime = Math.ceil(config.questionCount * 1.5);

  const handleSourceChange = (source: QuizConfig['source']) => {
    setConfig(prev => ({ ...prev, source, sourceUrl: undefined }));
  };

  return (
    <Card className="glass-card">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-primary" />
          Quiz Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Question Count */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Number of Questions</Label>
          <div className="flex gap-2 flex-wrap">
            {presetCounts.map((count) => (
              <Button
                key={count}
                variant={config.questionCount === count ? "default" : "outline"}
                size="sm"
                onClick={() => setConfig(prev => ({ ...prev, questionCount: count }))}
              >
                {count}
              </Button>
            ))}
            <Input
              type="number"
              min={1}
              max={50}
              value={config.questionCount}
              onChange={(e) => setConfig(prev => ({ 
                ...prev, 
                questionCount: Math.min(50, Math.max(1, parseInt(e.target.value) || 5)) 
              }))}
              className="w-20 h-9"
            />
          </div>
        </div>

        {/* Difficulty */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Difficulty Level</Label>
          <div className="flex gap-2 flex-wrap">
            {(['easy', 'medium', 'hard', 'mixed'] as const).map((level) => (
              <Button
                key={level}
                variant={config.difficulty === level ? "default" : "outline"}
                size="sm"
                onClick={() => setConfig(prev => ({ ...prev, difficulty: level }))}
                className="capitalize"
              >
                {level}
              </Button>
            ))}
          </div>
        </div>

        {/* Quiz Type */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Question Format</Label>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={config.quizType === 'mcq' ? "default" : "outline"}
              size="sm"
              onClick={() => setConfig(prev => ({ ...prev, quizType: 'mcq' }))}
            >
              Multiple Choice
            </Button>
            <Button
              variant={config.quizType === 'short' ? "default" : "outline"}
              size="sm"
              onClick={() => setConfig(prev => ({ ...prev, quizType: 'short' }))}
            >
              Short Answer
            </Button>
            <Button
              variant={config.quizType === 'mixed' ? "default" : "outline"}
              size="sm"
              onClick={() => setConfig(prev => ({ ...prev, quizType: 'mixed' }))}
            >
              Mixed
            </Button>
          </div>
        </div>

        {/* Source Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Quiz Source</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={config.source === 'topic' ? "default" : "outline"}
              size="sm"
              onClick={() => handleSourceChange('topic')}
              className="justify-start gap-2"
            >
              <BookOpen className="w-4 h-4" />
              Current Topic
            </Button>
            <Button
              variant={config.source === 'subject' ? "default" : "outline"}
              size="sm"
              onClick={() => handleSourceChange('subject')}
              className="justify-start gap-2"
            >
              <Layers className="w-4 h-4" />
              Entire Subject
            </Button>
            <Button
              variant={config.source === 'pdf' ? "default" : "outline"}
              size="sm"
              onClick={() => handleSourceChange('pdf')}
              className="justify-start gap-2"
            >
              <FileText className="w-4 h-4" />
              From PDF
            </Button>
            <Button
              variant={config.source === 'youtube' ? "default" : "outline"}
              size="sm"
              onClick={() => handleSourceChange('youtube')}
              className="justify-start gap-2"
            >
              <Youtube className="w-4 h-4" />
              From YouTube
            </Button>
          </div>

          {config.source === 'youtube' && (
            <Input
              placeholder="Paste YouTube video URL..."
              value={config.sourceUrl || ''}
              onChange={(e) => setConfig(prev => ({ ...prev, sourceUrl: e.target.value }))}
              className="mt-2"
            />
          )}

          {config.source === 'pdf' && (
            <div className="mt-2 p-4 border border-dashed border-border rounded-lg text-center text-muted-foreground">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">PDF upload coming soon</p>
            </div>
          )}
        </div>

        {/* Timer Settings */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Timer className="w-4 h-4" />
              Enable Timer
            </Label>
            <Switch
              checked={config.timerEnabled}
              onCheckedChange={(checked) => setConfig(prev => ({ 
                ...prev, 
                timerEnabled: checked,
                timerMinutes: checked ? suggestedTime : prev.timerMinutes
              }))}
            />
          </div>

          {config.timerEnabled && (
            <div className="flex items-center gap-3 pl-6">
              <Input
                type="number"
                min={1}
                max={120}
                value={config.timerMinutes}
                onChange={(e) => setConfig(prev => ({ 
                  ...prev, 
                  timerMinutes: Math.min(120, Math.max(1, parseInt(e.target.value) || 1)) 
                }))}
                className="w-20"
              />
              <span className="text-sm text-muted-foreground">minutes</span>
              <span className="text-xs text-muted-foreground">
                (Suggested: {suggestedTime} min)
              </span>
            </div>
          )}
        </div>

        {/* Focus Mode */}
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Fullscreen Focus Mode
          </Label>
          <Switch
            checked={config.focusMode}
            onCheckedChange={(checked) => setConfig(prev => ({ ...prev, focusMode: checked }))}
          />
        </div>

        {/* Start Button */}
        <Button
          className="w-full gap-2"
          size="lg"
          onClick={() => onStart(config)}
          disabled={isLoading || (config.source === 'youtube' && !config.sourceUrl)}
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Generating Quiz...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Start Quiz
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
