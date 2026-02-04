import { ProgressRing } from "@/components/ProgressRing";
import { ProgressBar } from "./ProgressBar";
import { ConsistencyIndicator } from "./ConsistencyIndicator";
import { SubjectProgressCard } from "./SubjectProgressCard";
import { BookOpen, Clock, Target, Calendar, TrendingUp } from "lucide-react";

interface SubjectData {
  id: string;
  title: string;
  completedTopics: number;
  totalTopics: number;
  progress: number;
  isCompleted: boolean;
}

interface RoadmapProgressOverviewProps {
  roadmapTitle: string;
  overallProgress: number;
  completedTopics: number;
  totalTopics: number;
  totalHours: number;
  targetDate?: string | null;
  subjects: SubjectData[];
  streak?: number;
  trend?: "up" | "down" | "stable";
}

export const RoadmapProgressOverview = ({
  roadmapTitle,
  overallProgress,
  completedTopics,
  totalTopics,
  totalHours,
  targetDate,
  subjects,
  streak = 0,
  trend = "stable",
}: RoadmapProgressOverviewProps) => {
  const daysUntilTarget = targetDate
    ? Math.ceil((new Date(targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="space-y-6">
      {/* Main Progress Card */}
      <div className="glass-card p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <ProgressRing progress={overallProgress} size={120} strokeWidth={10}>
            <div className="text-center">
              <span className="text-2xl font-bold text-foreground">{overallProgress}%</span>
              <p className="text-xs text-muted-foreground">Complete</p>
            </div>
          </ProgressRing>

          <div className="flex-1 space-y-4">
            <div>
              <h2 className="text-xl font-display font-bold text-foreground mb-1">
                {roadmapTitle}
              </h2>
              <ConsistencyIndicator trend={trend} streak={streak} />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <BookOpen className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {completedTopics}/{totalTopics}
                  </p>
                  <p className="text-xs text-muted-foreground">Topics</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-accent/10">
                  <Clock className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {totalHours.toFixed(0)}h
                  </p>
                  <p className="text-xs text-muted-foreground">Estimated</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-success/10">
                  <TrendingUp className="w-4 h-4 text-success" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {subjects.filter((s) => s.isCompleted).length}/{subjects.length}
                  </p>
                  <p className="text-xs text-muted-foreground">Subjects</p>
                </div>
              </div>

              {daysUntilTarget !== null && (
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-warning/10">
                    <Calendar className="w-4 h-4 text-warning" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {daysUntilTarget > 0 ? daysUntilTarget : 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Days left</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
