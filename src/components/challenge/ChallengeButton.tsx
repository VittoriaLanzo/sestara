import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreateChallengeDialog } from "./CreateChallengeDialog";
import { Users } from "lucide-react";
import type { CustomQuiz } from "@/hooks/useCustomQuizzes";
import { cn } from "@/lib/utils";

interface ChallengeButtonProps {
  quiz: CustomQuiz;
  sourceQuizId?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showLabel?: boolean;
}

/**
 * Unified Challenge Button component for creating challenges from any quiz context.
 * Works with Topic quizzes, Custom quizzes, and Library quizzes.
 */
export const ChallengeButton = ({
  quiz,
  sourceQuizId,
  variant = "outline",
  size = "default",
  className,
  showLabel = true,
}: ChallengeButtonProps) => {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setShowDialog(true)}
        className={cn("gap-2", className)}
      >
        <Users className="w-4 h-4" />
        {showLabel && "Challenge Friends"}
      </Button>

      <CreateChallengeDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        quiz={quiz}
        sourceQuizId={sourceQuizId}
      />
    </>
  );
};
