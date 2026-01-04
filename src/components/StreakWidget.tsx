import { Flame, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, subDays } from "date-fns";

interface StreakWidgetProps {
  currentStreak: number;
  longestStreak: number;
  weekData: boolean[]; // 7 days, true = studied
  loading?: boolean;
}

export const StreakWidget = ({ currentStreak, longestStreak, weekData, loading }: StreakWidgetProps) => {
  // Generate day labels based on the last 7 days
  const today = new Date();
  const dayLabels = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(today, 6 - i);
    return format(date, "EEE").charAt(0);
  });

  if (loading) {
    return (
      <div className="glass-card p-5 animate-pulse">
        <div className="h-8 bg-muted rounded mb-4 w-1/2" />
        <div className="flex gap-2 justify-between">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="w-8 h-8 rounded-full bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-5">
      {/* Header with streak info */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 rounded-lg",
            currentStreak > 0 ? "bg-warning/20" : "bg-muted"
          )}>
            <Flame className={cn(
              "w-5 h-5",
              currentStreak > 0 ? "text-warning" : "text-muted-foreground"
            )} />
          </div>
          <div>
            <p className="text-lg font-display font-bold text-foreground">
              {currentStreak > 0 ? `${currentStreak} day streak!` : "Start your streak!"}
            </p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Trophy className="w-3 h-3" />
              <span>Best: {longestStreak} days</span>
            </div>
          </div>
        </div>
      </div>

      {/* Week calendar strip */}
      <div className="flex items-center justify-between gap-1">
        {weekData.map((studied, index) => (
          <div key={index} className="flex flex-col items-center gap-1 flex-1">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                studied
                  ? "bg-gradient-to-br from-primary to-accent"
                  : "bg-muted/50 border border-border"
              )}
            >
              {studied && <Flame className="w-4 h-4 text-primary-foreground" />}
            </div>
            <span className={cn(
              "text-[10px] font-medium",
              index === 6 ? "text-primary" : "text-muted-foreground"
            )}>
              {dayLabels[index]}
            </span>
          </div>
        ))}
      </div>

      {/* Motivational message */}
      {currentStreak === 0 && (
        <p className="text-xs text-muted-foreground mt-3 text-center">
          Complete a quiz, study flashcards, or finish a topic to start your streak!
        </p>
      )}
    </div>
  );
};