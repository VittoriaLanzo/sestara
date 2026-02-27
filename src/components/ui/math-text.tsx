import React from "react";
import { MathRenderer } from "@/components/notes/MathRenderer";

interface MathTextProps {
  children: string;
  className?: string;
}

/**
 * Renders text that may contain inline LaTeX formulas.
 * LaTeX is delimited by $...$ (inline) or $$...$$ (display).
 */
export const MathText = ({ children, className }: MathTextProps) => {
  const parts = children.split(/(\$\$[\s\S]+?\$\$|\$[^$]+?\$)/g);

  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (part.startsWith("$$") && part.endsWith("$$")) {
          const latex = part.slice(2, -2).trim();
          return <MathRenderer key={i} latex={latex} display className="my-2" />;
        }
        if (part.startsWith("$") && part.endsWith("$") && part.length > 2) {
          const latex = part.slice(1, -1).trim();
          return <MathRenderer key={i} latex={latex} />;
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </span>
  );
};
