import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Lightbulb,
} from "lucide-react";

interface Flashcard {
  id: string;
  front: string;
  back: string;
  hint?: string;
}

interface FlashcardViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cards: Flashcard[] | null;
}

export const FlashcardViewer = ({
  open,
  onOpenChange,
  cards,
}: FlashcardViewerProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);

  if (!cards || cards.length === 0) return null;

  const currentCard = cards[currentIndex];

  const nextCard = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
      setShowHint(false);
    }
  };

  const prevCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setIsFlipped(false);
      setShowHint(false);
    }
  };

  const resetCards = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowHint(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Flashcards</DialogTitle>
            <span className="text-sm text-muted-foreground">
              {currentIndex + 1} / {cards.length}
            </span>
          </div>
        </DialogHeader>

        <div className="py-4">
          {/* Flashcard */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className={cn(
              "relative min-h-[200px] rounded-xl cursor-pointer transition-all duration-500 preserve-3d",
              "hover:shadow-lg"
            )}
            style={{
              perspective: '1000px',
            }}
          >
            <div
              className={cn(
                "absolute inset-0 backface-hidden rounded-xl p-6 flex items-center justify-center text-center transition-transform duration-500",
                "bg-gradient-to-br from-primary/20 to-accent/20 border border-border/50",
                isFlipped && "rotate-y-180"
              )}
              style={{
                backfaceVisibility: 'hidden',
                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              }}
            >
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Question</p>
                <p className="text-lg font-medium text-foreground">{currentCard.front}</p>
              </div>
            </div>

            <div
              className={cn(
                "absolute inset-0 backface-hidden rounded-xl p-6 flex items-center justify-center text-center transition-transform duration-500",
                "bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30"
              )}
              style={{
                backfaceVisibility: 'hidden',
                transform: isFlipped ? 'rotateY(0deg)' : 'rotateY(-180deg)',
              }}
            >
              <div>
                <p className="text-xs text-green-400 uppercase tracking-wider mb-2">Answer</p>
                <p className="text-lg font-medium text-foreground">{currentCard.back}</p>
              </div>
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-3">
            Click the card to flip it
          </p>

          {/* Hint */}
          {currentCard.hint && (
            <div className="mt-4">
              {showHint ? (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 animate-fade-in">
                  <p className="text-sm text-yellow-400">
                    <Lightbulb className="w-4 h-4 inline mr-2" />
                    {currentCard.hint}
                  </p>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHint(true)}
                  className="w-full text-muted-foreground"
                >
                  <Lightbulb className="w-4 h-4 mr-2" />
                  Show Hint
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={prevCard}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={resetCards}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Restart
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={nextCard}
            disabled={currentIndex === cards.length - 1}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-1 mt-4">
          {cards.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentIndex(index);
                setIsFlipped(false);
                setShowHint(false);
              }}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                index === currentIndex ? "bg-primary w-4" : "bg-muted-foreground/30"
              )}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
