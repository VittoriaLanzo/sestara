import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Lightbulb,
  Shuffle,
  Play,
  Pause,
  Maximize2,
  Minimize2,
  Edit3,
  ThumbsUp,
  ThumbsDown,
  Minus,
  X,
} from "lucide-react";

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  hint?: string;
  mastery?: 'easy' | 'medium' | 'hard';
}

interface EnhancedFlashcardViewerProps {
  cards: Flashcard[];
  setId?: string;
  userId?: string;
  onClose: () => void;
  onEdit?: (card: Flashcard) => void;
}

export const EnhancedFlashcardViewer = ({
  cards: initialCards,
  setId,
  userId,
  onClose,
  onEdit,
}: EnhancedFlashcardViewerProps) => {
  const [cards, setCards] = useState<Flashcard[]>(initialCards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [autoPlayInterval, setAutoPlayInterval] = useState(5);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [masteryData, setMasteryData] = useState<Record<string, 'easy' | 'medium' | 'hard'>>({});
  
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
  const originalCards = useRef(initialCards);

  const currentCard = cards[currentIndex];

  // Stats
  const easyCount = Object.values(masteryData).filter(m => m === 'easy').length;
  const mediumCount = Object.values(masteryData).filter(m => m === 'medium').length;
  const hardCount = Object.values(masteryData).filter(m => m === 'hard').length;
  const studiedCount = Object.keys(masteryData).length;

  // Auto-play logic
  useEffect(() => {
    if (isAutoPlay) {
      autoPlayRef.current = setInterval(() => {
        setIsFlipped(prev => {
          if (prev) {
            // If already flipped, go to next card
            setCurrentIndex(i => (i + 1) % cards.length);
            return false;
          }
          return true;
        });
      }, autoPlayInterval * 1000);
    }

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [isAutoPlay, autoPlayInterval, cards.length]);

  const shuffleCards = useCallback(() => {
    if (isShuffled) {
      setCards([...originalCards.current]);
      setIsShuffled(false);
    } else {
      const shuffled = [...cards].sort(() => Math.random() - 0.5);
      setCards(shuffled);
      setIsShuffled(true);
    }
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowHint(false);
  }, [isShuffled, cards]);

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
    setCards([...originalCards.current]);
    setIsShuffled(false);
    setMasteryData({});
  };

  const markMastery = async (level: 'easy' | 'medium' | 'hard') => {
    setMasteryData(prev => ({ ...prev, [currentCard.id]: level }));
    
    // If hard, move card to end for more practice
    if (level === 'hard') {
      const newCards = [...cards];
      const [card] = newCards.splice(currentIndex, 1);
      newCards.push(card);
      setCards(newCards);
    } else {
      // Move to next card
      if (currentIndex < cards.length - 1) {
        nextCard();
      }
    }

    // Save to database if we have a set ID
    if (setId && userId) {
      try {
        const updatedMastery = { ...masteryData, [currentCard.id]: level };
        await supabase.from('flashcard_sets').update({
          mastery_data: updatedMastery,
          last_studied_at: new Date().toISOString(),
        }).eq('id', setId);
      } catch (error) {
        console.error('Failed to save mastery:', error);
      }
    }
  };

  const getMasteryColor = (cardId: string) => {
    const mastery = masteryData[cardId];
    switch (mastery) {
      case 'easy': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'hard': return 'bg-red-500';
      default: return 'bg-muted-foreground/30';
    }
  };

  return (
    <div className={cn(
      "flex flex-col",
      isFocusMode && "fixed inset-0 z-50 bg-background p-6"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold">Flashcards</h2>
          <Badge variant="outline">
            {currentIndex + 1} / {cards.length}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={isAutoPlay ? "default" : "outline"}
            size="sm"
            onClick={() => setIsAutoPlay(!isAutoPlay)}
            className="gap-2"
          >
            {isAutoPlay ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            Auto-play
          </Button>

          <Button
            variant={isShuffled ? "default" : "outline"}
            size="sm"
            onClick={shuffleCards}
            className="gap-2"
          >
            <Shuffle className="w-4 h-4" />
            Shuffle
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsFocusMode(!isFocusMode)}
          >
            {isFocusMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>

          {!isFocusMode && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex items-center gap-4 mb-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-muted-foreground">Easy: {easyCount}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <span className="text-muted-foreground">Medium: {mediumCount}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-muted-foreground">Hard: {hardCount}</span>
        </div>
        <span className="text-muted-foreground ml-auto">
          Progress: {studiedCount}/{cards.length}
        </span>
      </div>

      <Progress value={(studiedCount / cards.length) * 100} className="h-1 mb-6" />

      {/* Flashcard */}
      <div className="flex-1 flex items-center justify-center py-4">
        <div
          onClick={() => setIsFlipped(!isFlipped)}
          className={cn(
            "relative w-full max-w-lg aspect-[3/2] rounded-xl cursor-pointer transition-all duration-500",
            "hover:shadow-lg",
            isFocusMode && "max-w-2xl"
          )}
          style={{ perspective: '1000px' }}
        >
          <div
            className={cn(
              "absolute inset-0 backface-hidden rounded-xl p-6 flex flex-col items-center justify-center text-center transition-transform duration-500",
              "bg-gradient-to-br from-primary/20 to-accent/20 border border-border/50"
            )}
            style={{
              backfaceVisibility: 'hidden',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
          >
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Question</p>
            <p className={cn(
              "font-medium text-foreground",
              isFocusMode ? "text-2xl" : "text-lg"
            )}>
              {currentCard.front}
            </p>
            {masteryData[currentCard.id] && (
              <Badge 
                className={cn(
                  "mt-4 capitalize",
                  masteryData[currentCard.id] === 'easy' && "bg-green-500/20 text-green-400 border-green-500/50",
                  masteryData[currentCard.id] === 'medium' && "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
                  masteryData[currentCard.id] === 'hard' && "bg-red-500/20 text-red-400 border-red-500/50"
                )}
              >
                {masteryData[currentCard.id]}
              </Badge>
            )}
          </div>

          <div
            className={cn(
              "absolute inset-0 backface-hidden rounded-xl p-6 flex flex-col items-center justify-center text-center transition-transform duration-500",
              "bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30"
            )}
            style={{
              backfaceVisibility: 'hidden',
              transform: isFlipped ? 'rotateY(0deg)' : 'rotateY(-180deg)',
            }}
          >
            <p className="text-xs text-green-400 uppercase tracking-wider mb-3">Answer</p>
            <p className={cn(
              "font-medium text-foreground",
              isFocusMode ? "text-2xl" : "text-lg"
            )}>
              {currentCard.back}
            </p>
          </div>
        </div>
      </div>

      <p className="text-center text-sm text-muted-foreground mb-4">
        Click the card to flip it
      </p>

      {/* Hint */}
      {currentCard.hint && (
        <div className="mb-4">
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

      {/* Mastery Buttons (show when flipped) */}
      {isFlipped && (
        <div className="flex items-center justify-center gap-3 mb-4 animate-fade-in">
          <span className="text-sm text-muted-foreground mr-2">How well did you know this?</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => markMastery('hard')}
            className="gap-2 border-red-500/50 text-red-400 hover:bg-red-500/20"
          >
            <ThumbsDown className="w-4 h-4" />
            Hard
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => markMastery('medium')}
            className="gap-2 border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/20"
          >
            <Minus className="w-4 h-4" />
            Medium
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => markMastery('easy')}
            className="gap-2 border-green-500/50 text-green-400 hover:bg-green-500/20"
          >
            <ThumbsUp className="w-4 h-4" />
            Easy
          </Button>
        </div>
      )}

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

        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={resetCards}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Restart
          </Button>
          {onEdit && (
            <Button variant="ghost" size="sm" onClick={() => onEdit(currentCard)}>
              <Edit3 className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
        </div>

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
      <div className="flex justify-center gap-1 mt-4 flex-wrap max-w-md mx-auto">
        {cards.map((card, index) => (
          <button
            key={card.id}
            onClick={() => {
              setCurrentIndex(index);
              setIsFlipped(false);
              setShowHint(false);
            }}
            className={cn(
              "w-2 h-2 rounded-full transition-all",
              index === currentIndex ? "w-4" : "",
              index === currentIndex ? "bg-primary" : getMasteryColor(card.id)
            )}
          />
        ))}
      </div>
    </div>
  );
};
