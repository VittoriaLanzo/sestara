import { Badge } from "@/components/ui/badge";
import { Tag } from "lucide-react";

interface KeywordChipsProps {
  keywords: string[];
}

export const KeywordChips = ({ keywords }: KeywordChipsProps) => {
  if (!keywords || keywords.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {keywords.map((keyword, index) => (
        <Badge
          key={index}
          variant="secondary"
          className="px-3 py-1.5 text-sm font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
        >
          <Tag className="w-3 h-3 mr-1.5" />
          {keyword}
        </Badge>
      ))}
    </div>
  );
};
