import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useStreak } from "@/hooks/useStreak";
import { useStudyTime } from "@/hooks/useStudyTime";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { StatCard } from "@/components/StatCard";
import { StreakWidget } from "@/components/StreakWidget";
import { CompactRemindersWidget } from "@/components/reminders/CompactRemindersWidget";
import { Button } from "@/components/ui/button";
import { ProgressRing } from "@/components/ProgressRing";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import {
  BookOpen, Target, Clock, Plus, ChevronRight, Sparkles, Loader2, Map, Video,
} from "lucide-react";

interface RoadmapWithProgress {
  id: string;
  title: string;
  goal_type: string;
  target_date: string | null;
  created_at: string;
  totalTopics: number;
  completedTopics: number;
  progress: number;
}

const DashboardPage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { currentStreak, longestStreak, weekData, loading: streakLoading } = useStreak();
  const { totalMinutesThisWeek, formatTime, loading: studyTimeLoading } = useStudyTime();
  const { t } = useTranslation();

  const [roadmaps, setRoadmaps] = useState<RoadmapWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState<string>("");

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (profile?.display_name) {
        setDisplayName(profile.display_name);
      }

      const { data: roadmapsData, error: roadmapsError } = await supabase
        .from("roadmaps")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (roadmapsError) {
        console.error("Error fetching roadmaps:", roadmapsError);
        return;
      }

      const roadmapsWithProgress: RoadmapWithProgress[] = await Promise.all(
        (roadmapsData || []).map(async (roadmap) => {
          const { data: subjects } = await supabase
            .from("subjects")
            .select("id")
            .eq("roadmap_id", roadmap.id);

          if (!subjects || subjects.length === 0) {
            return { ...roadmap, totalTopics: 0, completedTopics: 0, progress: 0 };
          }

          const subjectIds = subjects.map((s) => s.id);
          const { data: topics } = await supabase
            .from("topics")
            .select("status")
            .in("subject_id", subjectIds);

          const totalTopics = topics?.length || 0;
          const completedTopics = topics?.filter((t) => t.status === "completed").length || 0;
          const progress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

          return { ...roadmap, totalTopics, completedTopics, progress };
        })
      );

      setRoadmaps(roadmapsWithProgress);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalTopics = roadmaps.reduce((sum, r) => sum + r.totalTopics, 0);
  const completedTopics = roadmaps.reduce((sum, r) => sum + r.completedTopics, 0);
  const overallProgress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <main className="relative z-10 container mx-auto px-4 pt-24 pb-12">
        <div className="mb-8 animate-slide-up">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <span>👋</span>
            <span>{t('dashboard.welcome_back')}{displayName ? `, ${displayName}` : ""}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">
            {t('dashboard.learning_dashboard_start')} <span className="gradient-text">{t('dashboard.learning_dashboard_accent')}</span>
          </h1>
          <p className="text-muted-foreground">
            {roadmaps.length > 0 ? t('dashboard.continue_message') : t('dashboard.get_started_message')}
          </p>
        </div>

        {roadmaps.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard title={t('dashboard.active_roadmaps')} value={roadmaps.length} subtitle={t('dashboard.learning_paths')} icon={Map} className="animate-slide-up stagger-1" />
            <StatCard title={t('dashboard.topics_completed')} value={completedTopics} subtitle={t('dashboard.out_of_topics', { total: totalTopics })} icon={BookOpen} className="animate-slide-up stagger-2" />
            <StatCard title={t('dashboard.overall_progress')} value={`${overallProgress}%`} subtitle={t('dashboard.across_all_roadmaps')} icon={Target} className="animate-slide-up stagger-3" />
            <StatCard title={t('dashboard.study_time')} value={studyTimeLoading ? "..." : formatTime(totalMinutesThisWeek)} subtitle={t('dashboard.this_week')} icon={Clock} className="animate-slide-up stagger-4" />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-display font-semibold text-foreground">{t('dashboard.your_roadmaps')}</h2>
                <Button variant="gradient" size="sm" onClick={() => navigate("/onboarding")} className="gap-2">
                  <Plus className="w-4 h-4" />
                  {t('dashboard.new_roadmap')}
                </Button>
              </div>

              {roadmaps.length === 0 ? (
                <div className="glass-card p-12 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-accent" />
                  </div>
                  <h3 className="text-xl font-display font-semibold text-foreground mb-2">{t('dashboard.create_first_roadmap')}</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">{t('dashboard.create_first_roadmap_desc')}</p>
                  <Button variant="gradient" size="lg" onClick={() => navigate("/onboarding")} className="gap-2">
                    <Sparkles className="w-5 h-5" />
                    {t('common.get_started')}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {roadmaps.map((roadmap, index) => (
                    <div key={roadmap.id} className={cn("glass-card p-5 hover-lift animate-slide-up")} style={{ animationDelay: `${0.1 * (index + 1)}s` }}>
                      <button onClick={() => navigate(`/roadmap/${roadmap.id}`)} className="w-full flex items-center gap-4 text-left">
                        <ProgressRing progress={roadmap.progress} size={56} strokeWidth={4}>
                          <span className="text-xs font-semibold text-foreground">{roadmap.progress}%</span>
                        </ProgressRing>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-display font-semibold text-foreground truncate group-hover:text-primary transition-colors">{roadmap.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {t('dashboard.topics_completed_count', { completed: roadmap.completedTopics, total: roadmap.totalTopics })}
                            {roadmap.target_date && (
                              <span className="ml-2">• {t('dashboard.target_label', { date: new Date(roadmap.target_date).toLocaleDateString() })}</span>
                            )}
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </button>
                      <div className="mt-3 pt-3 border-t border-border">
                        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/roadmap/${roadmap.id}/resources`); }} className="w-full gap-2 text-muted-foreground hover:text-foreground">
                          <Video className="w-4 h-4" />
                          {t('dashboard.study_materials')}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="animate-slide-up" style={{ animationDelay: "0.4s" }}>
              <StreakWidget currentStreak={currentStreak} longestStreak={longestStreak} weekData={weekData} loading={streakLoading} />
            </div>
            <div className="animate-slide-up" style={{ animationDelay: "0.5s" }}>
              <CompactRemindersWidget />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
