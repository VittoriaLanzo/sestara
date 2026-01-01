import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { X, Check, Calculator, Sparkles, Loader2 } from "lucide-react";
import katex from "katex";
import "katex/dist/katex.min.css";

interface MathRendererProps {
  latex: string;
  display?: boolean;
  className?: string;
}

export const MathRenderer = ({ latex, display = false, className }: MathRendererProps) => {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (containerRef.current && latex) {
      try {
        katex.render(latex, containerRef.current, {
          displayMode: display,
          throwOnError: false,
          trust: true,
        });
      } catch (error) {
        if (containerRef.current) {
          containerRef.current.textContent = latex;
        }
      }
    }
  }, [latex, display]);

  return <span ref={containerRef} className={className} />;
};

interface MathInputProps {
  onInsert: (latex: string) => void;
  onClose: () => void;
  onAIConvert?: (text: string) => Promise<string>;
}

export const MathInput = ({ onInsert, onClose, onAIConvert }: MathInputProps) => {
  const [latex, setLatex] = useState("");
  const [plainText, setPlainText] = useState("");
  const [mode, setMode] = useState<"latex" | "ai">("latex");
  const [loading, setLoading] = useState(false);

  const handleInsert = () => {
    if (latex.trim()) {
      onInsert(latex);
      onClose();
    }
  };

  const handleAIConvert = async () => {
    if (!plainText.trim() || !onAIConvert) return;
    
    setLoading(true);
    try {
      const result = await onAIConvert(plainText);
      setLatex(result);
      setMode("latex");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-4 space-y-4 bg-background border-border">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={mode === "latex" ? "default" : "outline"}
            onClick={() => setMode("latex")}
          >
            <Calculator className="h-4 w-4 mr-1" />
            LaTeX
          </Button>
          {onAIConvert && (
            <Button
              size="sm"
              variant={mode === "ai" ? "default" : "outline"}
              onClick={() => setMode("ai")}
            >
              <Sparkles className="h-4 w-4 mr-1" />
              AI Convert
            </Button>
          )}
        </div>
        <Button size="sm" variant="ghost" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {mode === "latex" ? (
        <div className="space-y-3">
          <Input
            value={latex}
            onChange={(e) => setLatex(e.target.value)}
            placeholder="e.g., \frac{a}{b} or x^2 + y^2 = z^2"
            className="font-mono"
          />
          {latex && (
            <div className="p-3 bg-muted/30 rounded-lg text-center overflow-x-auto">
              <MathRenderer latex={latex} display />
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <Input
            value={plainText}
            onChange={(e) => setPlainText(e.target.value)}
            placeholder="e.g., 'a over b' or 'x squared plus y squared'"
          />
          <Button
            onClick={handleAIConvert}
            disabled={!plainText.trim() || loading}
            className="w-full"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Convert to Math
          </Button>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleInsert} disabled={!latex.trim()}>
          <Check className="h-4 w-4 mr-1" />
          Insert
        </Button>
      </div>
    </Card>
  );
};
