import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import {
  GraduationCap, Briefcase, Code, Brain, Trophy, BookOpen,
  ChevronRight, ChevronLeft, Sparkles, Calendar, Target, Loader2,
} from "lucide-react";

type GoalType = "competitive" | "college" | "job" | "certification" | "custom";

interface GoalOption {
  id: GoalType;
  titleKey: string;
  descKey: string;
  icon: typeof GraduationCap;
  color: string;
  examples: string[];
}

const goalOptions: GoalOption[] = [
  { id: "competitive", titleKey: "onboarding.goal_competitive", descKey: "onboarding.goal_competitive_desc", icon: Trophy, color: "from-amber-500 to-orange-600", examples: ["GATE", "CAT", "GRE", "GMAT", "UPSC", "JEE", "NEET"] },
  { id: "college", titleKey: "onboarding.goal_college", descKey: "onboarding.goal_college_desc", icon: GraduationCap, color: "from-blue-500 to-indigo-600", examples: ["Computer Science", "Mathematics", "Physics", "Chemistry", "Biology"] },
  { id: "job", titleKey: "onboarding.goal_job", descKey: "onboarding.goal_job_desc", icon: Briefcase, color: "from-emerald-500 to-teal-600", examples: ["Frontend Developer", "Backend Developer", "Data Scientist", "DevOps Engineer"] },
  { id: "certification", titleKey: "onboarding.goal_certification", descKey: "onboarding.goal_certification_desc", icon: Brain, color: "from-purple-500 to-pink-600", examples: ["AWS", "Google Cloud", "Azure", "Kubernetes", "Terraform"] },
  { id: "custom", titleKey: "onboarding.goal_custom", descKey: "onboarding.goal_custom_desc", icon: Target, color: "from-cyan-500 to-blue-600", examples: [] },
];

const goalQuestionKeys: Record<GoalType, string> = {
  competitive: "onboarding.which_exam",
  college: "onboarding.which_subjects",
  job: "onboarding.which_role",
  certification: "onboarding.which_certification",
  custom: "onboarding.describe_goal",
};

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [selectedGoal, setSelectedGoal] = useState<GoalType | null>(null);
  const [title, setTitle] = useState("");
  const [specificGoal, setSpecificGoal] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const selectedGoalOption = goalOptions.find((g) => g.id === selectedGoal);

  const handleGenerateRoadmap = async () => {
    if (!user || !selectedGoal) return;
    setLoading(true);
    try {
      const { data: aiData, error: aiError } = await supabase.functions.invoke("generate-roadmap", {
        body: { goalType: selectedGoal, title: title || specificGoal, goalDetails: { specificGoal, targetDate, additionalInfo } },
      });
      if (aiError) { toast.error(t('onboarding.generate_failed')); setLoading(false); return; }

      const roadmapData = aiData.roadmap;
      const { data: roadmap, error: roadmapError } = await supabase
        .from("roadmaps")
        .insert({ user_id: user.id, title: title || specificGoal || `${t(selectedGoalOption?.titleKey || '')} Roadmap`, goal_type: selectedGoal, goal_details: { specificGoal, additionalInfo }, target_date: targetDate || null })
        .select().single();

      if (roadmapError) { toast.error(t('onboarding.save_failed')); setLoading(false); return; }

      for (const subject of roadmapData.subjects) {
        const { data: subjectData, error: subjectError } = await supabase
          .from("subjects").insert({ roadmap_id: roadmap.id, title: subject.title, description: subject.description, order_index: subject.order_index }).select().single();
        if (subjectError) continue;
        if (subject.topics?.length > 0) {
          const topicsToInsert = subject.topics.map((topic: any) => ({ subject_id: subjectData.id, title: topic.title, description: topic.description, order_index: topic.order_index, estimated_hours: topic.estimated_hours }));
          await supabase.from("topics").insert(topicsToInsert);
        }
      }
      toast.success(t('onboarding.roadmap_ready'));
      navigate(`/roadmap/${roadmap.id}`);
    } catch (error) {
      toast.error(t('onboarding.something_wrong'));
    } finally {
      setLoading(false);
    }
  };

  const canProceedStep1 = selectedGoal !== null;
  const canProceedStep2 = specificGoal.trim() !== "" || title.trim() !== "";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
      </div>

      <main className="relative z-10 container mx-auto px-4 pt-24 pb-12 flex flex-col items-center justify-center min-h-[calc(100vh-6rem)]">
        <div className="w-full max-w-3xl">
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className={cn("w-12 h-1.5 rounded-full transition-all duration-300", s <= step ? "bg-gradient-to-r from-primary to-accent" : "bg-muted")} />
            ))}
          </div>

          {step === 1 && (
            <div className="animate-slide-up">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm mb-4">
                  <Sparkles className="w-4 h-4" />
                  {t('onboarding.step_of', { current: 1, total: 3 })}
                </div>
                <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">
                  {t('onboarding.step1_title')} <span className="gradient-text">{t('onboarding.step1_accent')}</span>?
                </h1>
                <p className="text-muted-foreground">{t('onboarding.step1_subtitle')}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {goalOptions.map((goal, index) => {
                  const Icon = goal.icon;
                  const isSelected = selectedGoal === goal.id;
                  return (
                    <button key={goal.id} onClick={() => setSelectedGoal(goal.id)} className={cn("glass-card p-5 text-left transition-all duration-300 animate-slide-up", isSelected && "ring-2 ring-primary glow-effect")} style={{ animationDelay: `${0.1 * index}s` }}>
                      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-3 bg-gradient-to-br", goal.color)}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-display font-semibold text-foreground mb-1">{t(goal.titleKey)}</h3>
                      <p className="text-sm text-muted-foreground">{t(goal.descKey)}</p>
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-center">
                <Button variant="gradient" size="xl" disabled={!canProceedStep1} onClick={() => setStep(2)} className="gap-2">
                  {t('common.continue')} <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-slide-up">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm mb-4">
                  <Sparkles className="w-4 h-4" />
                  {t('onboarding.step_of', { current: 2, total: 3 })}
                </div>
                <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">
                  {t('onboarding.step2_title')} <span className="gradient-text">{t('onboarding.step2_accent')}</span>
                </h1>
                <p className="text-muted-foreground">{t('onboarding.step2_subtitle')}</p>
              </div>

              <div className="glass-card p-6 mb-8 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="title">{t('onboarding.roadmap_title')}</Label>
                  <Input id="title" placeholder={`e.g., ${selectedGoalOption?.examples[0] || "My Learning Journey"} 2025`} value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specificGoal">{selectedGoal ? t(goalQuestionKeys[selectedGoal]) : ''}</Label>
                  <Input id="specificGoal" placeholder={selectedGoalOption?.examples.length ? `e.g., ${selectedGoalOption.examples.slice(0, 3).join(", ")}` : "..."} value={specificGoal} onChange={(e) => setSpecificGoal(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="targetDate" className="flex items-center gap-2"><Calendar className="w-4 h-4" />{t('onboarding.target_date_optional')}</Label>
                  <Input id="targetDate" type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="additionalInfo">{t('onboarding.additional_info')}</Label>
                  <Input id="additionalInfo" placeholder={t('onboarding.additional_info_placeholder')} value={additionalInfo} onChange={(e) => setAdditionalInfo(e.target.value)} />
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" size="lg" onClick={() => setStep(1)} className="gap-2"><ChevronLeft className="w-5 h-5" />{t('common.back')}</Button>
                <Button variant="gradient" size="xl" disabled={!canProceedStep2} onClick={() => setStep(3)} className="gap-2">{t('common.continue')} <ChevronRight className="w-5 h-5" /></Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-slide-up">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm mb-4">
                  <Sparkles className="w-4 h-4" />
                  {t('onboarding.step_of', { current: 3, total: 3 })}
                </div>
                <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">
                  {t('onboarding.step3_title')} <span className="gradient-text">{t('onboarding.step3_accent')}</span>?
                </h1>
                <p className="text-muted-foreground">{t('onboarding.step3_subtitle')}</p>
              </div>

              <div className="glass-card p-6 mb-8">
                <h3 className="font-display font-semibold text-foreground mb-4">{t('common.summary')}</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br", selectedGoalOption?.color)}>
                      {selectedGoalOption && <selectedGoalOption.icon className="w-5 h-5 text-white" />}
                    </div>
                    <div>
                      <p className="text-muted-foreground">{t('common.goal_type')}</p>
                      <p className="font-medium text-foreground">{selectedGoalOption ? t(selectedGoalOption.titleKey) : ''}</p>
                    </div>
                  </div>
                  {(title || specificGoal) && (
                    <div className="flex items-start gap-3 pt-2 border-t border-border">
                      <Target className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-muted-foreground">{t('common.focus')}</p>
                        <p className="font-medium text-foreground">{title || specificGoal}</p>
                      </div>
                    </div>
                  )}
                  {targetDate && (
                    <div className="flex items-start gap-3 pt-2 border-t border-border">
                      <Calendar className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-muted-foreground">{t('common.target_date')}</p>
                        <p className="font-medium text-foreground">{new Date(targetDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" size="lg" onClick={() => setStep(2)} className="gap-2"><ChevronLeft className="w-5 h-5" />{t('common.back')}</Button>
                <Button variant="gradient" size="xl" onClick={handleGenerateRoadmap} disabled={loading} className="gap-2">
                  {loading ? (<><Loader2 className="w-5 h-5 animate-spin" />{t('common.generating')}</>) : (<><Sparkles className="w-5 h-5" />{t('onboarding.generate_my_roadmap')}</>)}
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Onboarding;
