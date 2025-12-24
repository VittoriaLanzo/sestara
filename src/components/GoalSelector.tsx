import { useState } from "react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { 
  GraduationCap, 
  Briefcase, 
  Code, 
  Brain, 
  Trophy, 
  BookOpen,
  ChevronRight,
  Sparkles
} from "lucide-react";

interface Goal {
  id: string;
  title: string;
  description: string;
  icon: typeof GraduationCap;
  color: string;
}

const goals: Goal[] = [
  {
    id: "competitive",
    title: "Competitive Exams",
    description: "UPSC, CAT, GATE, GRE, GMAT",
    icon: Trophy,
    color: "from-amber-500 to-orange-600",
  },
  {
    id: "college",
    title: "College Subjects",
    description: "Semester prep, assignments",
    icon: GraduationCap,
    color: "from-blue-500 to-indigo-600",
  },
  {
    id: "job",
    title: "Job Preparation",
    description: "Interviews, placements",
    icon: Briefcase,
    color: "from-emerald-500 to-teal-600",
  },
  {
    id: "coding",
    title: "Programming & DSA",
    description: "LeetCode, system design",
    icon: Code,
    color: "from-purple-500 to-pink-600",
  },
  {
    id: "certification",
    title: "Certifications",
    description: "AWS, Google, Microsoft",
    icon: Brain,
    color: "from-cyan-500 to-blue-600",
  },
  {
    id: "language",
    title: "Language Learning",
    description: "English, French, Japanese",
    icon: BookOpen,
    color: "from-rose-500 to-red-600",
  },
];

interface GoalSelectorProps {
  onSelect: (goalId: string) => void;
}

export const GoalSelector = ({ onSelect }: GoalSelectorProps) => {
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
      </div>

      <div className="relative z-10 max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12 animate-slide-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm mb-4">
            <Sparkles className="w-4 h-4" />
            AI-Powered Learning
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
            What's your <span className="gradient-text">learning goal</span>?
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Select your primary focus and we'll create a personalized roadmap just for you
          </p>
        </div>

        {/* Goals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {goals.map((goal, index) => {
            const Icon = goal.icon;
            const isSelected = selectedGoal === goal.id;

            return (
              <button
                key={goal.id}
                onClick={() => setSelectedGoal(goal.id)}
                className={cn(
                  "glass-card p-5 text-left transition-all duration-300 opacity-0 animate-slide-up",
                  isSelected && "ring-2 ring-primary glow-effect",
                  `stagger-${index + 1}`
                )}
                style={{ animationDelay: `${0.1 * (index + 1)}s` }}
              >
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center mb-3 bg-gradient-to-br",
                  goal.color
                )}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-display font-semibold text-foreground mb-1">{goal.title}</h3>
                <p className="text-sm text-muted-foreground">{goal.description}</p>
              </button>
            );
          })}
        </div>

        {/* Continue Button */}
        <div className="flex justify-center animate-slide-up" style={{ animationDelay: "0.7s" }}>
          <Button
            variant="gradient"
            size="xl"
            disabled={!selectedGoal}
            onClick={() => selectedGoal && onSelect(selectedGoal)}
            className="gap-2"
          >
            Continue with AI Roadmap
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
