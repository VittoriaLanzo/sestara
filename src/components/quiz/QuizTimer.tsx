import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Timer, Pause, Play, RotateCcw } from "lucide-react";

interface QuizTimerProps {
  totalSeconds: number;
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
  onTimeUp: () => void;
  onReset?: () => void;
  className?: string;
}

export const QuizTimer = ({
  totalSeconds,
  isPaused,
  onPause,
  onResume,
  onTimeUp,
  onReset,
  className,
}: QuizTimerProps) => {
  const [remainingSeconds, setRemainingSeconds] = useState(totalSeconds);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useEffect(() => {
    if (isPaused || !isVisible) return;

    const interval = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, isVisible, onTimeUp]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const percentage = (remainingSeconds / totalSeconds) * 100;
  const isLowTime = remainingSeconds <= 60;
  const isCriticalTime = remainingSeconds <= 30;

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-full font-mono text-lg transition-colors",
        isCriticalTime ? "bg-destructive/20 text-destructive animate-pulse" :
        isLowTime ? "bg-yellow-500/20 text-yellow-500" :
        "bg-primary/10 text-primary"
      )}>
        <Timer className="w-5 h-5" />
        <span className="min-w-[60px] text-center">{formatTime(remainingSeconds)}</span>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={isPaused ? onResume : onPause}
        className="h-9 w-9"
      >
        {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
      </Button>

      {onReset && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setRemainingSeconds(totalSeconds);
            onReset();
          }}
          className="h-9 w-9"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
      )}

      {/* Visual progress bar */}
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden max-w-[200px]">
        <div
          className={cn(
            "h-full transition-all duration-1000 rounded-full",
            isCriticalTime ? "bg-destructive" :
            isLowTime ? "bg-yellow-500" :
            "bg-primary"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
