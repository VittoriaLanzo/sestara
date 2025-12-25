import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, CheckCircle2 } from "lucide-react";

interface CompletionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmWithQuiz: () => void;
  onConfirmWithoutQuiz: () => void;
}

export const CompletionDialog = ({
  open,
  onOpenChange,
  onConfirmWithQuiz,
  onConfirmWithoutQuiz,
}: CompletionDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="glass-card">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            Great Progress!
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            You're about to mark this topic as complete. Would you like to take a quick 
            AI-generated quiz to reinforce what you've learned?
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-4">
          <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-foreground">Recommended: Take a quick quiz</p>
                <p className="text-sm text-muted-foreground mt-1">
                  A 5-question quiz helps solidify your understanding and identify any gaps. 
                  It only takes a few minutes!
                </p>
              </div>
            </div>
          </div>
        </div>

        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel asChild>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </AlertDialogCancel>
          <Button variant="outline" onClick={onConfirmWithoutQuiz}>
            Skip Quiz
          </Button>
          <Button variant="default" onClick={onConfirmWithQuiz} className="gap-2">
            <Sparkles className="w-4 h-4" />
            Take Quiz
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
