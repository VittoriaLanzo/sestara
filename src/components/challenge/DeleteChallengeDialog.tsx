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
import { AlertTriangle } from "lucide-react";

interface DeleteChallengeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  challengeTitle: string;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export const DeleteChallengeDialog = ({
  open,
  onOpenChange,
  challengeTitle,
  onConfirm,
  isDeleting = false,
}: DeleteChallengeDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Delete Challenge Permanently?
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              You are about to permanently delete the challenge: <strong>"{challengeTitle}"</strong>
            </p>
            <p className="font-medium text-destructive">
              This will permanently delete the challenge for all users and cannot be undone.
            </p>
            <p>
              All leaderboard data and participant scores will also be deleted.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting..." : "Delete Permanently"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
