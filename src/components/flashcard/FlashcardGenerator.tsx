import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Sparkles,
  FileText,
  Youtube,
  BookOpen,
  StickyNote,
  Loader2,
} from "lucide-react";

interface FlashcardGeneratorProps {
  topicId: string;
  topicTitle: string;
  topicDescription?: string;
  userNotes?: string;
  userId: string;
  onGenerated: (cards: any[]) => void;
}

export const FlashcardGenerator = ({
  topicId,
  topicTitle,
  topicDescription,
  userNotes,
  userId,
  onGenerated,
}: FlashcardGeneratorProps) => {
  const [source, setSource] = useState<'topic' | 'notes' | 'pdf' | 'youtube' | 'manual'>('topic');
  const [sourceUrl, setSourceUrl] = useState('');
  const [cardCount, setCardCount] = useState(10);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      let content = '';
      
      if (source === 'topic') {
        content = `Topic: ${topicTitle}\n${topicDescription || ''}`;
      } else if (source === 'notes') {
        if (!userNotes) {
          toast.error("No notes available for this topic");
          return;
        }
        content = userNotes;
      } else if (source === 'youtube') {
        if (!sourceUrl) {
          toast.error("Please enter a YouTube URL");
          return;
        }
        // Call edge function to extract YouTube content
        const { data: ytData, error: ytError } = await supabase.functions.invoke('topic-ai', {
          body: {
            action: 'youtube-extract',
            sourceUrl,
          }
        });
        
        if (ytError) throw ytError;
        content = ytData.content || '';
      } else if (source === 'pdf') {
        toast.info("PDF upload will be available soon");
        return;
      }

      const { data, error } = await supabase.functions.invoke('topic-ai', {
        body: {
          action: 'flashcards',
          topicTitle,
          topicDescription,
          userNotes: content,
          cardCount,
        }
      });

      if (error) throw error;

      // Save to database
      const { data: savedSet, error: saveError } = await supabase.from('flashcard_sets').upsert({
        topic_id: topicId,
        user_id: userId,
        cards: data.cards,
        source_type: source,
        source_url: source === 'youtube' ? sourceUrl : null,
      }, {
        onConflict: 'topic_id,user_id',
      }).select().single();

      if (saveError) throw saveError;

      toast.success(`Generated ${data.cards.length} flashcards!`);
      onGenerated(data.cards);
    } catch (error: any) {
      console.error('Failed to generate flashcards:', error);
      toast.error(error.message || "Failed to generate flashcards");
    } finally {
      setIsGenerating(false);
    }
  };

  const sourceOptions = [
    { value: 'topic', label: 'Current Topic', icon: BookOpen },
    { value: 'notes', label: 'From Notes', icon: StickyNote },
    { value: 'youtube', label: 'From YouTube', icon: Youtube },
    { value: 'pdf', label: 'From PDF', icon: FileText, disabled: true },
  ];

  return (
    <Card className="glass-card">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="w-5 h-5 text-primary" />
          Generate Flashcards
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Source</Label>
          <div className="grid grid-cols-2 gap-2">
            {sourceOptions.map((option) => (
              <Button
                key={option.value}
                variant={source === option.value ? "default" : "outline"}
                size="sm"
                disabled={option.disabled}
                onClick={() => setSource(option.value as any)}
                className="justify-start gap-2"
              >
                <option.icon className="w-4 h-4" />
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        {source === 'youtube' && (
          <div className="space-y-2">
            <Label>YouTube URL</Label>
            <Input
              placeholder="https://youtube.com/watch?v=..."
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
            />
          </div>
        )}

        <div className="space-y-2">
          <Label>Number of Cards</Label>
          <Select
            value={cardCount.toString()}
            onValueChange={(v) => setCardCount(parseInt(v))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 cards</SelectItem>
              <SelectItem value="10">10 cards</SelectItem>
              <SelectItem value="15">15 cards</SelectItem>
              <SelectItem value="20">20 cards</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={isGenerating || (source === 'youtube' && !sourceUrl)}
          className="w-full gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate Flashcards
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
