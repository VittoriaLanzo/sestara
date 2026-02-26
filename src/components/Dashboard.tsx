import { useState } from "react";
import { Navbar } from "./Navbar";
import { StatCard } from "./StatCard";
import { TopicCard } from "./TopicCard";
import { RoadmapNode } from "./RoadmapNode";
import { QuickQuiz } from "./QuickQuiz";
import { StreakWidget } from "./StreakWidget";
import { Button } from "./ui/button";
import { 
  BookOpen, 
  Target, 
  Clock, 
  Zap, 
  ChevronRight,
  Play,
  Sparkles
} from "lucide-react";

const mockTopics = [
  {
    id: "1",
    title: "Data Structures Basics",
    description: "Arrays, linked lists, stacks, and queues fundamentals",
    progress: 100,
    status: "completed" as const,
    estimatedTime: "2 hours",
  },
  {
    id: "2",
    title: "Trees and Graphs",
    description: "Binary trees, BST, BFS, DFS algorithms",
    progress: 65,
    status: "in-progress" as const,
    estimatedTime: "3 hours",
  },
  {
    id: "3",
    title: "Dynamic Programming",
    description: "Memoization, tabulation, common DP patterns",
    progress: 0,
    status: "not-started" as const,
    estimatedTime: "4 hours",
  },
  {
    id: "4",
    title: "System Design",
    description: "Scalability, distributed systems, design patterns",
    progress: 0,
    status: "locked" as const,
    estimatedTime: "5 hours",
  },
];

const mockRoadmap = [
  { title: "Introduction to DSA", status: "completed" as const },
  { title: "Arrays & Strings", status: "completed" as const },
  { title: "Linked Lists", status: "completed" as const },
  { title: "Trees & Graphs", status: "current" as const },
  { title: "Dynamic Programming", status: "upcoming" as const },
  { title: "System Design", status: "locked" as const },
];

const mockQuiz = [
  {
    question: "What is the time complexity of binary search?",
    options: ["O(n)", "O(log n)", "O(n²)", "O(1)"],
    correctIndex: 1,
  },
  {
    question: "Which data structure uses LIFO principle?",
    options: ["Queue", "Stack", "Array", "Linked List"],
    correctIndex: 1,
  },
  {
    question: "What is the worst-case time complexity of quicksort?",
    options: ["O(n log n)", "O(n)", "O(n²)", "O(log n)"],
    correctIndex: 2,
  },
];

export const Dashboard = () => {
  const [quizCompleted, setQuizCompleted] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <main className="relative z-10 container mx-auto px-4 pt-24 pb-12">
        {/* Welcome Section */}
        <div className="mb-8 animate-slide-up">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <span>👋</span>
            <span>Welcome back, John</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-2">
            Continue your <span className="text-primary">learning journey</span>
          </h1>
          <p className="text-muted-foreground">
            You're on track! Keep up the great work.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Topics Completed"
            value="12"
            subtitle="out of 24 topics"
            icon={BookOpen}
            trend={{ value: 15, isPositive: true }}
            className="animate-slide-up stagger-1"
          />
          <StatCard
            title="Current Progress"
            value="50%"
            subtitle="overall completion"
            icon={Target}
            trend={{ value: 8, isPositive: true }}
            className="animate-slide-up stagger-2"
          />
          <StatCard
            title="Study Time"
            value="24h"
            subtitle="this week"
            icon={Clock}
            trend={{ value: 12, isPositive: true }}
            className="animate-slide-up stagger-3"
          />
          <StatCard
            title="Quiz Score"
            value="85%"
            subtitle="average accuracy"
            icon={Zap}
            trend={{ value: 5, isPositive: true }}
            className="animate-slide-up stagger-4"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Continue Learning */}
            <div className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-display font-semibold text-foreground">Continue Learning</h2>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground gap-1">
                  View all <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              {/* Current Topic Highlight */}
              <div className="glass-card p-6 mb-4 gradient-border">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-primary">
                    <Play className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-primary font-medium mb-1">CURRENTLY STUDYING</p>
                    <h3 className="font-display font-semibold text-lg text-foreground">Trees and Graphs</h3>
                    <p className="text-sm text-muted-foreground">65% complete • 1.5 hours remaining</p>
                  </div>
                  <Button variant="gradient" className="gap-2">
                    <Play className="w-4 h-4" />
                    Resume
                  </Button>
                </div>
              </div>

              {/* Topic Cards */}
              <div className="space-y-3">
                {mockTopics.map((topic) => (
                  <TopicCard
                    key={topic.id}
                    title={topic.title}
                    description={topic.description}
                    progress={topic.progress}
                    status={topic.status}
                    estimatedTime={topic.estimatedTime}
                  />
                ))}
              </div>
            </div>

            {/* Quick Quiz */}
            <div className="animate-slide-up" style={{ animationDelay: "0.4s" }}>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-display font-semibold text-foreground">Daily Quick Quiz</h2>
              </div>
              {!quizCompleted ? (
                <QuickQuiz
                  topic="Data Structures"
                  questions={mockQuiz}
                  onComplete={(score) => {
                    setQuizCompleted(true);
                    console.log("Quiz completed with score:", score);
                  }}
                />
              ) : (
                <div className="glass-card p-6 text-center">
                  <div className="text-4xl mb-2">🎉</div>
                  <h3 className="font-display font-semibold text-foreground mb-1">Quiz Completed!</h3>
                  <p className="text-sm text-muted-foreground">Come back tomorrow for a new challenge</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Streak Widget */}
            <div className="animate-slide-up" style={{ animationDelay: "0.5s" }}>
              <StreakWidget
                currentStreak={7}
                longestStreak={14}
                weekData={[true, true, true, true, true, true, true]}
              />
            </div>

            {/* Roadmap */}
            <div className="animate-slide-up" style={{ animationDelay: "0.6s" }}>
              <h2 className="text-xl font-display font-semibold text-foreground mb-4">Your Roadmap</h2>
              <div className="glass-card p-5 space-y-6">
                {mockRoadmap.map((node, index) => (
                  <RoadmapNode
                    key={index}
                    title={node.title}
                    status={node.status}
                    isLast={index === mockRoadmap.length - 1}
                  />
                ))}
              </div>
            </div>

            {/* AI Assistant Prompt */}
            <div className="animate-slide-up" style={{ animationDelay: "0.7s" }}>
              <div className="glass-card p-5 gradient-border">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-primary">
                    <Sparkles className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <h3 className="font-display font-semibold text-foreground">AI Study Assistant</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Need help understanding a concept? Ask your AI tutor anything!
                </p>
                <Button variant="outline" className="w-full">
                  Ask a Question
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
