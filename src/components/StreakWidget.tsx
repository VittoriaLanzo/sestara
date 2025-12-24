import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreakWidgetProps {
  currentStreak: number;
  longestStreak: number;
  weekData: boolean[]; // 7 days, true = studied
}

const dayLabels = ["M", "T", "W", "T", "F", "S", "S"];

export const StreakWidget = ({ currentStreak, longestStreak, weekData }: StreakWidgetProps) => {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-warning/20">
          <Flame className="w-6 h-6 text-warning" />
        </div>
        <div>
          <p className="text-2xl font-display font-bold text-foreground">{currentStreak} day streak!</p>
          <p className="text-xs text-muted-foreground">Best: {longestStreak} days</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        {weekData.map((studied, index) => (
          <div key={index} className="flex flex-col items-center gap-1">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all",
                studied
                  ? "bg-gradient-to-br from-primary to-accent text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {studied && <Flame className="w-4 h-4" />}
            </div>
            <span className="text-xs text-muted-foreground">{dayLabels[index]}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
