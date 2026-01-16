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
import {
  GraduationCap,
  Briefcase,
  Code,
  Brain,
  Trophy,
  BookOpen,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Calendar,
  Target,
  Loader2,
} from "lucide-react";

type GoalType = "competitive" | "college" | "job" | "certification" | "custom";

interface GoalOption {
  id: GoalType;
  title: string;
  description: string;
  icon: typeof GraduationCap;
  color: string;
  examples: string[];
}

const goalOptions: GoalOption[] = [
  {
    id: "competitive",
    title: "Competitive Exams",
    description: "Prepare for standardized tests",
    icon: Trophy,
    color: "from-amber-500 to-orange-600",
    examples: ["GATE", "CAT", "GRE", "GMAT", "UPSC", "JEE", "NEET"],
  },
  {
    id: "college",
    title: "College Subjects",
    description: "Semester prep and coursework",
    icon: GraduationCap,
    color: "from-blue-500 to-indigo-600",
    examples: ["Computer Science", "Mathematics", "Physics", "Chemistry", "Biology"],
  },
  {
    id: "job",
    title: "Job Preparation",
    description: "Interviews and placements",
    icon: Briefcase,
    color: "from-emerald-500 to-teal-600",
    examples: ["Frontend Developer", "Backend Developer", "Data Scientist", "DevOps Engineer"],
  },
  {
    id: "certification",
    title: "Certifications",
    description: "Professional certifications",
    icon: Brain,
    color: "from-purple-500 to-pink-600",
    examples: ["AWS", "Google Cloud", "Azure", "Kubernetes", "Terraform"],
  },
  {
    id: "custom",
    title: "Custom Goal",
    description: "Define your own learning path",
    icon: Target,
    color: "from-cyan-500 to-blue-600",
    examples: [],
  },
];

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

  const selectedGoalOption = goalOptions.find((g) => g.id === selectedGoal);

  const handleGenerateRoadmap = async () => {
    if (!user || !selectedGoal) return;

    setLoading(true);

    try {
      // Call the AI edge function
      const { data: aiData, error: aiError } = await supabase.functions.invoke("generate-roadmap", {
        body: {
          goalType: selectedGoal,
          title: title || specificGoal,
          goalDetails: {
            specificGoal,
            targetDate,
            additionalInfo,
          },
        },
      });

      if (aiError) {
        console.error("AI generation error:", aiError);
        toast.error("Failed to generate roadmap. Please try again.");
        setLoading(false);
        return;
      }

      const roadmapData = aiData.roadmap;

      // Create the roadmap in database
      const { data: roadmap, error: roadmapError } = await supabase
        .from("roadmaps")
        .insert({
          user_id: user.id,
          title: title || specificGoal || `${selectedGoalOption?.title} Roadmap`,
          goal_type: selectedGoal,
          goal_details: { specificGoal, additionalInfo },
          target_date: targetDate || null,
        })
        .select()
        .single();

      if (roadmapError) {
        console.error("Roadmap creation error:", roadmapError);
        toast.error("Failed to save roadmap.");
        setLoading(false);
        return;
      }

      // Insert subjects and topics
      for (const subject of roadmapData.subjects) {
        const { data: subjectData, error: subjectError } = await supabase
          .from("subjects")
          .insert({
            roadmap_id: roadmap.id,
            title: subject.title,
            description: subject.description,
            order_index: subject.order_index,
          })
          .select()
          .single();

        if (subjectError) {
          console.error("Subject creation error:", subjectError);
          continue;
        }

        if (subject.topics && subject.topics.length > 0) {
          const topicsToInsert = subject.topics.map((topic: any) => ({
            subject_id: subjectData.id,
            title: topic.title,
            description: topic.description,
            order_index: topic.order_index,
            estimated_hours: topic.estimated_hours,
          }));

          const { error: topicsError } = await supabase.from("topics").insert(topicsToInsert);

          if (topicsError) {
            console.error("Topics creation error:", topicsError);
          }
        }
      }

      toast.success("Your personalized roadmap is ready!");
      navigate(`/roadmap/${roadmap.id}`);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const canProceedStep1 = selectedGoal !== null;
  const canProceedStep2 = specificGoal.trim() !== "" || title.trim() !== "";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
      </div>

      <main className="relative z-10 container mx-auto px-4 pt-24 pb-12 flex flex-col items-center justify-center min-h-[calc(100vh-6rem)]">
        <div className="w-full max-w-3xl">
        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={cn(
                "w-12 h-1.5 rounded-full transition-all duration-300",
                s <= step ? "bg-gradient-to-r from-primary to-accent" : "bg-muted"
              )}
            />
          ))}
        </div>

        {/* Step 1: Goal Type Selection */}
        {step === 1 && (
          <div className="animate-slide-up">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm mb-4">
                <Sparkles className="w-4 h-4" />
                Step 1 of 3
              </div>
              <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">
                What are you <span className="gradient-text">preparing for</span>?
              </h1>
              <p className="text-muted-foreground">
                Select your primary learning goal
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {goalOptions.map((goal, index) => {
                const Icon = goal.icon;
                const isSelected = selectedGoal === goal.id;

                return (
                  <button
                    key={goal.id}
                    onClick={() => setSelectedGoal(goal.id)}
                    className={cn(
                      "glass-card p-5 text-left transition-all duration-300 animate-slide-up",
                      isSelected && "ring-2 ring-primary glow-effect"
                    )}
                    style={{ animationDelay: `${0.1 * index}s` }}
                  >
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-3 bg-gradient-to-br", goal.color)}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-display font-semibold text-foreground mb-1">{goal.title}</h3>
                    <p className="text-sm text-muted-foreground">{goal.description}</p>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-center">
              <Button
                variant="gradient"
                size="xl"
                disabled={!canProceedStep1}
                onClick={() => setStep(2)}
                className="gap-2"
              >
                Continue
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Goal Details */}
        {step === 2 && (
          <div className="animate-slide-up">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm mb-4">
                <Sparkles className="w-4 h-4" />
                Step 2 of 3
              </div>
              <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">
                Tell us <span className="gradient-text">more details</span>
              </h1>
              <p className="text-muted-foreground">
                Help us personalize your roadmap
              </p>
            </div>

            <div className="glass-card p-6 mb-8 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="title">Roadmap Title</Label>
                <Input
                  id="title"
                  placeholder={`e.g., ${selectedGoalOption?.examples[0] || "My Learning Journey"} 2025`}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="specificGoal">
                  {selectedGoal === "competitive" && "Which exam are you preparing for?"}
                  {selectedGoal === "college" && "Which subjects do you want to study?"}
                  {selectedGoal === "job" && "What role are you targeting?"}
                  {selectedGoal === "certification" && "Which certification?"}
                  {selectedGoal === "custom" && "Describe your learning goal"}
                </Label>
                <Input
                  id="specificGoal"
                  placeholder={
                    selectedGoalOption?.examples.length
                      ? `e.g., ${selectedGoalOption.examples.slice(0, 3).join(", ")}`
                      : "Describe your goal..."
                  }
                  value={specificGoal}
                  onChange={(e) => setSpecificGoal(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetDate" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Target Date (Optional)
                </Label>
                <Input
                  id="targetDate"
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="additionalInfo">Additional Information (Optional)</Label>
                <Input
                  id="additionalInfo"
                  placeholder="Current level, specific topics to focus on, time available per day..."
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" size="lg" onClick={() => setStep(1)} className="gap-2">
                <ChevronLeft className="w-5 h-5" />
                Back
              </Button>
              <Button
                variant="gradient"
                size="xl"
                disabled={!canProceedStep2}
                onClick={() => setStep(3)}
                className="gap-2"
              >
                Continue
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Generate Roadmap */}
        {step === 3 && (
          <div className="animate-slide-up">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm mb-4">
                <Sparkles className="w-4 h-4" />
                Step 3 of 3
              </div>
              <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">
                Ready to <span className="gradient-text">generate</span>?
              </h1>
              <p className="text-muted-foreground">
                Our AI will create a personalized roadmap just for you
              </p>
            </div>

            <div className="glass-card p-6 mb-8">
              <h3 className="font-display font-semibold text-foreground mb-4">Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br", selectedGoalOption?.color)}>
                    {selectedGoalOption && <selectedGoalOption.icon className="w-5 h-5 text-white" />}
                  </div>
                  <div>
                    <p className="text-muted-foreground">Goal Type</p>
                    <p className="font-medium text-foreground">{selectedGoalOption?.title}</p>
                  </div>
                </div>

                {(title || specificGoal) && (
                  <div className="flex items-start gap-3 pt-2 border-t border-border">
                    <Target className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-muted-foreground">Focus</p>
                      <p className="font-medium text-foreground">{title || specificGoal}</p>
                    </div>
                  </div>
                )}

                {targetDate && (
                  <div className="flex items-start gap-3 pt-2 border-t border-border">
                    <Calendar className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-muted-foreground">Target Date</p>
                      <p className="font-medium text-foreground">{new Date(targetDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" size="lg" onClick={() => setStep(2)} className="gap-2">
                <ChevronLeft className="w-5 h-5" />
                Back
              </Button>
              <Button
                variant="gradient"
                size="xl"
                onClick={handleGenerateRoadmap}
                disabled={loading}
                className="gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate My Roadmap
                  </>
                )}
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
