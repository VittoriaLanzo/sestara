import { Flame, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, subDays } from "date-fns";
import { useTranslation } from "react-i18next";

interface StreakWidgetProps {
  currentStreak: number;
  longestStreak: number;
  weekData: boolean[];
  loading?: boolean;
}

export const StreakWidget = ({ currentStreak, longestStreak, weekData, loading }: StreakWidgetProps) => {
  const { t } = useTranslation();
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
    <div className="glass-card-elevated p-5 border-border/60">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg", currentStreak > 0 ? "bg-warning/20" : "bg-muted")}>
            <Flame className={cn("w-5 h-5", currentStreak > 0 ? "text-warning" : "text-muted-foreground")} />
          </div>
          <div>
            <p className="text-lg font-display font-bold text-foreground">
              {currentStreak > 0 ? t('streak.day_streak', { count: currentStreak }) : t('streak.start_streak')}
            </p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Trophy className="w-3 h-3" />
              <span>{t('streak.best', { count: longestStreak })}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-1">
        {weekData.map((studied, index) => (
          <div key={index} className="flex flex-col items-center gap-1 flex-1">
            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center transition-all", studied ? "bg-gradient-to-br from-primary to-accent" : "bg-muted/50 border border-border")}>
              {studied && <Flame className="w-4 h-4 text-primary-foreground" />}
            </div>
            <span className={cn("text-[10px] font-medium", index === 6 ? "text-primary" : "text-muted-foreground")}>
              {dayLabels[index]}
            </span>
          </div>
        ))}
      </div>

      {currentStreak === 0 && (
        <p className="text-xs text-muted-foreground mt-3 text-center">
          {t('streak.start_message')}
        </p>
      )}
    </div>
  );
};
