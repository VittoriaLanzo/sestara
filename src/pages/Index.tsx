import { useState } from "react";
import { GoalSelector } from "@/components/GoalSelector";
import { Dashboard } from "@/components/Dashboard";

const Index = () => {
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);

  if (!selectedGoal) {
    return <GoalSelector onSelect={setSelectedGoal} />;
  }

  return <Dashboard />;
};

export default Index;
