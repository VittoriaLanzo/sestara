import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  FileText,
  StickyNote,
  Download,
  Loader2,
} from "lucide-react";

export type ArtifactType = "notes" | "summary" | "export";

interface MessageActionsProps {
  messageContent: string;
  messageIndex: number;
  onAction: (type: ArtifactType, content: string, index: number) => void;
  isGenerating?: boolean;
  generatingType?: ArtifactType | null;
}

const actions: { type: ArtifactType; label: string; icon: React.ElementType }[] = [
  { type: "summary", label: "Summarise", icon: FileText },
  { type: "notes", label: "Notes", icon: StickyNote },
  { type: "export", label: "Export", icon: Download },
];

export const MessageActions = ({
  messageContent,
  messageIndex,
  onAction,
  isGenerating,
  generatingType,
}: MessageActionsProps) => {
  return (
    <div className="flex items-center gap-0.5">
      {actions.map(({ type, label, icon: Icon }) => {
        const isThisGenerating = isGenerating && generatingType === type;
        return (
          <Tooltip key={type}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-md"
                disabled={isGenerating}
                onClick={() => onAction(type, messageContent, messageIndex)}
              >
                {isThisGenerating ? (
                  <Loader2 className="w-3 h-3 animate-spin text-primary" />
                ) : (
                  <Icon className="w-3 h-3 text-muted-foreground" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {label}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
};
