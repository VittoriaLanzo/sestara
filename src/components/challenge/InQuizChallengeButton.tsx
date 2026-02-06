import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreateChallengeDialog } from "./CreateChallengeDialog";
import { Users, Share2 } from "lucide-react";
import type { CustomQuiz } from "@/hooks/useCustomQuizzes";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface InQuizChallengeButtonProps {
  quiz: CustomQuiz;
  sourceQuizId?: string;
  isCompact?: boolean;
}

/**
 * Challenge button that can be used during quiz play.
 * Creates a frozen snapshot of the quiz for consistent challenge experience.
 */
export const InQuizChallengeButton = ({
  quiz,
  sourceQuizId,
  isCompact = false,
}: InQuizChallengeButtonProps) => {
  const [showDialog, setShowDialog] = useState(false);

  if (isCompact) {
    return (
      <>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowDialog(true)}
                className="h-8 w-8"
              >
                <Share2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Challenge Friends</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <CreateChallengeDialog
          open={showDialog}
          onOpenChange={setShowDialog}
          quiz={quiz}
          sourceQuizId={sourceQuizId}
        />
      </>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowDialog(true)}
        className="gap-2"
      >
        <Users className="w-4 h-4" />
        Challenge
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
