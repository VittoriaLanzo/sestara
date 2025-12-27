import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { TopicCard } from "@/components/TopicCard";
import { RoadmapProgressOverview } from "@/components/progress/RoadmapProgressOverview";
import { ProgressBar } from "@/components/progress/ProgressBar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronDown,
  Sparkles,
  Loader2,
} from "lucide-react";

interface Topic {
  id: string;
  title: string;
  description: string | null;
  status: string;
  progress: number;
  estimated_hours: number | null;
  order_index: number;
}

interface Subject {
  id: string;
  title: string;
  description: string | null;
  is_completed: boolean;
  order_index: number;
  topics: Topic[];
}

interface Roadmap {
  id: string;
  title: string;
  goal_type: string;
  goal_details: any;
  target_date: string | null;
  created_at: string;
}

const RoadmapView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !id) return;
    fetchRoadmap();
  }, [user, id]);

  const fetchRoadmap = async () => {
    try {
      // Fetch roadmap
      const { data: roadmapData, error: roadmapError } = await supabase
        .from("roadmaps")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (roadmapError || !roadmapData) {
        toast.error("Roadmap not found");
        navigate("/dashboard");
        return;
      }

      setRoadmap(roadmapData);

      // Fetch subjects with topics
      const { data: subjectsData, error: subjectsError } = await supabase
        .from("subjects")
        .select("*")
        .eq("roadmap_id", id)
        .order("order_index");

      if (subjectsError) {
        console.error("Error fetching subjects:", subjectsError);
        return;
      }

      // Fetch topics for all subjects
      const subjectIds = subjectsData.map((s) => s.id);
      const { data: topicsData, error: topicsError } = await supabase
        .from("topics")
        .select("*")
        .in("subject_id", subjectIds)
        .order("order_index");

      if (topicsError) {
        console.error("Error fetching topics:", topicsError);
      }

      // Combine subjects with their topics
      const subjectsWithTopics = subjectsData.map((subject) => ({
        ...subject,
        topics: (topicsData || []).filter((t) => t.subject_id === subject.id),
      }));

      setSubjects(subjectsWithTopics);

      // Expand first subject by default
      if (subjectsWithTopics.length > 0) {
        setExpandedSubjects(new Set([subjectsWithTopics[0].id]));
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to load roadmap");
    } finally {
      setLoading(false);
    }
  };

  const toggleSubject = (subjectId: string) => {
    setExpandedSubjects((prev) => {
      const next = new Set(prev);
      if (next.has(subjectId)) {
        next.delete(subjectId);
      } else {
        next.add(subjectId);
      }
      return next;
    });
  };

  const updateTopicStatus = async (topicId: string, newStatus: string, newProgress: number) => {
    const { error } = await supabase
      .from("topics")
      .update({ status: newStatus, progress: newProgress })
      .eq("id", topicId);

    if (error) {
      toast.error("Failed to update progress");
      return;
    }

    // Update local state
    setSubjects((prev) =>
      prev.map((subject) => ({
        ...subject,
        topics: subject.topics.map((topic) =>
          topic.id === topicId ? { ...topic, status: newStatus, progress: newProgress } : topic
        ),
      }))
    );

    toast.success("Progress updated!");
  };

  const calculateOverallProgress = () => {
    const allTopics = subjects.flatMap((s) => s.topics);
    if (allTopics.length === 0) return 0;
    const totalProgress = allTopics.reduce((sum, t) => sum + (t.progress || 0), 0);
    return Math.round(totalProgress / allTopics.length);
  };

  const calculateSubjectProgress = (subject: Subject) => {
    if (subject.topics.length === 0) return 0;
    const totalProgress = subject.topics.reduce((sum, t) => sum + (t.progress || 0), 0);
    return Math.round(totalProgress / subject.topics.length);
  };

  const getTotalEstimatedHours = () => {
    return subjects
      .flatMap((s) => s.topics)
      .reduce((sum, t) => sum + (t.estimated_hours || 0), 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!roadmap) return null;

  const overallProgress = calculateOverallProgress();
  const totalHours = getTotalEstimatedHours();
  const completedTopics = subjects.flatMap((s) => s.topics).filter((t) => t.status === "completed").length;
  const totalTopics = subjects.flatMap((s) => s.topics).length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <main className="relative z-10 container mx-auto px-4 pt-24 pb-12">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/dashboard")}
          className="mb-6 text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        {/* Progress Overview */}
        <div className="mb-8 animate-slide-up">
          <RoadmapProgressOverview
            roadmapTitle={roadmap.title}
            overallProgress={overallProgress}
            completedTopics={completedTopics}
            totalTopics={totalTopics}
            totalHours={totalHours}
            targetDate={roadmap.target_date}
            subjects={subjects.map((s) => ({
              id: s.id,
              title: s.title,
              completedTopics: s.topics.filter((t) => t.status === "completed").length,
              totalTopics: s.topics.length,
              progress: calculateSubjectProgress(s),
              isCompleted: s.is_completed || calculateSubjectProgress(s) === 100,
            }))}
            streak={0}
            trend="stable"
          />
        </div>

        {/* Subjects List */}
        <div className="space-y-4">
          {subjects.map((subject, index) => {
            const isExpanded = expandedSubjects.has(subject.id);
            const subjectProgress = calculateSubjectProgress(subject);

            return (
              <div
                key={subject.id}
                className="animate-slide-up"
                style={{ animationDelay: `${0.1 * index}s` }}
              >
                {/* Subject Header */}
                <button
                  onClick={() => toggleSubject(subject.id)}
                  className="w-full glass-card p-4 hover-lift flex items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-primary">{subjectProgress}%</span>
                  </div>

                  <div className="flex-1 text-left min-w-0">
                    <h3 className="font-display font-semibold text-foreground">{subject.title}</h3>
                    {subject.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1">{subject.description}</p>
                    )}
                    <div className="mt-2">
                      <ProgressBar progress={subjectProgress} size="sm" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {subject.topics.filter((t) => t.status === "completed").length}/{subject.topics.length} topics completed
                    </p>
                  </div>

                  <ChevronDown
                    className={cn(
                      "w-5 h-5 text-muted-foreground transition-transform duration-300 flex-shrink-0",
                      isExpanded && "rotate-180"
                    )}
                  />
                </button>

                {/* Topics List */}
                {isExpanded && (
                  <div className="mt-2 ml-6 space-y-2 animate-fade-in">
                    {subject.topics.map((topic) => (
                      <TopicCard
                        key={topic.id}
                        title={topic.title}
                        description={topic.description || ""}
                        progress={topic.progress}
                        status={topic.status as any}
                        estimatedTime={topic.estimated_hours ? `${topic.estimated_hours}h` : undefined}
                        onClick={() => navigate(`/topic/${topic.id}`)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {subjects.length === 0 && (
          <div className="glass-card p-12 text-center">
            <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-display font-semibold text-foreground mb-2">No subjects yet</h3>
            <p className="text-muted-foreground mb-4">This roadmap doesn't have any subjects.</p>
            <Button variant="gradient">Add Subject</Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default RoadmapView;
