import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { Flag, MessageCircle, AlertTriangle, HelpCircle } from "lucide-react";

interface DoubtReportButtonProps {
  quizAttemptId?: string;
  questionIndex: number;
  userId: string;
}

export const DoubtReportButton = ({
  quizAttemptId,
  questionIndex,
  userId,
}: DoubtReportButtonProps) => {
  const [open, setOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const doubtTypes = [
    { id: 'confusing', label: 'Question is confusing', icon: HelpCircle },
    { id: 'incorrect', label: 'Answer seems incorrect', icon: AlertTriangle },
    { id: 'unclear', label: 'Explanation unclear', icon: MessageCircle },
  ];

  const handleSubmit = async () => {
    if (!selectedType) {
      toast.error("Please select a reason");
      return;
    }

    setIsSubmitting(true);
    try {
      // Store locally if no quiz attempt ID yet
      if (!quizAttemptId) {
        toast.success("Feedback noted! It will be saved when you complete the quiz.");
        setOpen(false);
        return;
      }

      const { error } = await supabase.from('quiz_doubt_reports').insert({
        quiz_attempt_id: quizAttemptId,
        question_index: questionIndex,
        doubt_type: selectedType,
        user_notes: notes || null,
        user_id: userId,
      });

      if (error) throw error;

      toast.success("Thank you for your feedback!");
      setOpen(false);
      setSelectedType(null);
      setNotes("");
    } catch (error) {
      console.error("Failed to submit doubt report:", error);
      toast.error("Failed to submit feedback");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground gap-2">
          <Flag className="w-4 h-4" />
          Report Issue
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="start">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-sm mb-2">Report an issue</h4>
            <p className="text-xs text-muted-foreground">
              Help us improve by reporting problems with this question.
            </p>
          </div>

          <div className="space-y-2">
            {doubtTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`w-full flex items-center gap-2 p-2 rounded-lg text-sm text-left transition-colors ${
                  selectedType === type.id
                    ? 'bg-primary/20 text-primary border border-primary/50'
                    : 'hover:bg-muted'
                }`}
              >
                <type.icon className="w-4 h-4" />
                {type.label}
              </button>
            ))}
          </div>

          <Textarea
            placeholder="Additional notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="h-20 text-sm"
          />

          <Button 
            onClick={handleSubmit} 
            className="w-full" 
            size="sm"
            disabled={!selectedType || isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit Report"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
