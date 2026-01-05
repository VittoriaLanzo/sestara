import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import { KeywordChips } from "@/components/topic/KeywordChips";
import {
  Lightbulb,
  Tag,
  HelpCircle,
  Layers,
  Loader2,
  Sparkles,
} from "lucide-react";

interface TopicAIActionsProps {
  topic: {
    id: string;
    title: string;
    description: string | null;
  };
  notes: string;
  explanation: string | null;
  setExplanation: (val: string | null) => void;
  keywords: string[] | null;
  setKeywords: (val: string[] | null) => void;
  flashcards: any[] | null;
  setFlashcards: (val: any[] | null) => void;
  onShowFlashcards: () => void;
  onGenerateQuiz: () => void;
  onGenerateFlashcards?: () => void;
  hasExistingFlashcards?: boolean;
  examContext?: {
    examName?: string;
    examType?: string;
    goalType?: string;
    studyLanguage?: string;
    subjectTitle?: string;
  };
}

export const TopicAIActions = ({
  topic,
  notes,
  explanation,
  setExplanation,
  keywords,
  setKeywords,
  flashcards,
  setFlashcards,
  onShowFlashcards,
  onGenerateQuiz,
  onGenerateFlashcards,
  hasExistingFlashcards,
  examContext,
}: TopicAIActionsProps) => {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const callAI = async (action: 'explain' | 'summarize' | 'flashcards') => {
    setLoadingAction(action);
    try {
      const { data, error } = await supabase.functions.invoke('topic-ai', {
        body: {
          action,
          topicTitle: topic.title,
          topicDescription: topic.description,
          userNotes: notes || undefined,
          // Pass exam context
          ...examContext,
        }
      });

      if (error) throw error;

      switch (action) {
        case 'explain':
          setExplanation(data.content);
          break;
        case 'summarize':
          setKeywords(data.keywords);
          break;
        case 'flashcards':
          setFlashcards(data.cards);
          onShowFlashcards();
          break;
      }
    } catch (error: any) {
      toast.error(error.message || `Failed to ${action}`);
    } finally {
      setLoadingAction(null);
    }
  };

  const aiActions = [
    {
      id: 'explain',
      icon: Lightbulb,
      label: 'Explain Simply',
      description: 'Get a simple, easy-to-understand explanation',
      onClick: () => callAI('explain'),
      color: 'text-yellow-400',
    },
    {
      id: 'summarize',
      icon: Tag,
      label: 'Important Keywords',
      description: 'Extract key terms and concepts',
      onClick: () => callAI('summarize'),
      color: 'text-blue-400',
    },
    {
      id: 'quiz',
      icon: HelpCircle,
      label: 'Take Quiz',
      description: 'Test your knowledge with AI-generated questions',
      onClick: onGenerateQuiz,
      color: 'text-green-400',
    },
    {
      id: 'flashcards',
      icon: Layers,
      label: hasExistingFlashcards ? 'View Flashcards' : 'Generate Flashcards',
      description: hasExistingFlashcards ? 'Review your flashcards' : 'Generate flashcards for quick review',
      onClick: hasExistingFlashcards ? onShowFlashcards : (onGenerateFlashcards || (() => callAI('flashcards'))),
      color: 'text-purple-400',
    },
  ];

  const hasContent = explanation || keywords || flashcards;

  return (
    <div className="space-y-6">
      {/* AI Actions Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {aiActions.map((action) => (
          <Button
            key={action.id}
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-2 hover-lift relative overflow-hidden"
            onClick={action.onClick}
            disabled={loadingAction !== null}
          >
            {loadingAction === action.id ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <action.icon className={`w-6 h-6 ${action.color}`} />
            )}
            <span className="text-sm font-medium">{action.label}</span>
          </Button>
        ))}
      </div>

      {/* AI Generated Content - New content appears at top */}
      <div className="space-y-4">
        {/* Explanation Card */}
        {explanation && (
          <Card className="glass-card animate-fade-in transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Lightbulb className="w-5 h-5 text-yellow-400" />
                Simple Explanation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MarkdownRenderer content={explanation} />
            </CardContent>
          </Card>
        )}

        {/* Keywords Card */}
        {keywords && keywords.length > 0 && (
          <Card className="glass-card animate-fade-in transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Tag className="w-5 h-5 text-blue-400" />
                Important Keywords
              </CardTitle>
            </CardHeader>
            <CardContent>
              <KeywordChips keywords={keywords} />
            </CardContent>
          </Card>
        )}

        {/* View Flashcards Button */}
        {flashcards && flashcards.length > 0 && (
          <Button
            variant="outline"
            onClick={onShowFlashcards}
            className="w-full gap-2 animate-fade-in"
          >
            <Layers className="w-4 h-4 text-purple-400" />
            View {flashcards.length} Flashcards
          </Button>
        )}
      </div>

      {/* Empty State */}
      {!hasContent && !loadingAction && (
        <Card className="glass-card border-dashed">
          <CardContent className="py-12 text-center">
            <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              AI-Powered Learning Tools
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Click any button above to get AI-generated explanations, keywords, 
              quizzes, or flashcards for this topic.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Loading State Indicator */}
      {loadingAction && !hasContent && (
        <Card className="glass-card animate-pulse">
          <CardContent className="py-12 text-center">
            <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Generating Content...
            </h3>
            <p className="text-muted-foreground">
              AI is working on your request
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
