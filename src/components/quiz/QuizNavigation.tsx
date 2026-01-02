import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Grid3X3, Check, HelpCircle, SkipForward } from "lucide-react";

export type QuestionState = 'unanswered' | 'answered' | 'skipped' | 'doubtful';

interface QuizNavigationProps {
  totalQuestions: number;
  currentIndex: number;
  questionStates: QuestionState[];
  onJumpTo: (index: number) => void;
}

export const QuizNavigation = ({
  totalQuestions,
  currentIndex,
  questionStates,
  onJumpTo,
}: QuizNavigationProps) => {
  const getStateIcon = (state: QuestionState) => {
    switch (state) {
      case 'answered': return <Check className="w-3 h-3" />;
      case 'skipped': return <SkipForward className="w-3 h-3" />;
      case 'doubtful': return <HelpCircle className="w-3 h-3" />;
      default: return null;
    }
  };

  const getStateColor = (state: QuestionState, isCurrent: boolean) => {
    if (isCurrent) return "ring-2 ring-primary ring-offset-2 ring-offset-background";
    
    switch (state) {
      case 'answered': return "bg-green-500/20 text-green-500 border-green-500/50";
      case 'skipped': return "bg-yellow-500/20 text-yellow-500 border-yellow-500/50";
      case 'doubtful': return "bg-orange-500/20 text-orange-500 border-orange-500/50";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const answeredCount = questionStates.filter(s => s === 'answered').length;
  const skippedCount = questionStates.filter(s => s === 'skipped').length;
  const doubtfulCount = questionStates.filter(s => s === 'doubtful').length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Grid3X3 className="w-4 h-4" />
          <span>{currentIndex + 1} / {totalQuestions}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Question Navigator</span>
            <div className="flex gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                {answeredCount}
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                {skippedCount}
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-orange-500" />
                {doubtfulCount}
              </span>
            </div>
          </div>

          <ScrollArea className="h-[200px]">
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: totalQuestions }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => onJumpTo(index)}
                  className={cn(
                    "w-10 h-10 rounded-lg border flex items-center justify-center text-sm font-medium transition-all hover:scale-105",
                    getStateColor(questionStates[index], index === currentIndex)
                  )}
                >
                  {getStateIcon(questionStates[index]) || (index + 1)}
                </button>
              ))}
            </div>
          </ScrollArea>

          <div className="flex flex-wrap gap-2 text-xs border-t pt-3">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded border bg-muted" />
              <span className="text-muted-foreground">Not answered</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-500/20 border-green-500/50" />
              <span className="text-muted-foreground">Answered</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-yellow-500/20 border-yellow-500/50" />
              <span className="text-muted-foreground">Skipped</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-orange-500/20 border-orange-500/50" />
              <span className="text-muted-foreground">Doubtful</span>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
