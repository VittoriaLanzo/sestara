import { useEffect, useRef, useState, useCallback } from "react";
import { Canvas as FabricCanvas, PencilBrush, Circle, Rect, Line, FabricObject } from "fabric";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Pencil,
  Highlighter,
  Eraser,
  Circle as CircleIcon,
  Square,
  Minus,
  Trash2,
  Undo,
  Redo,
  Move,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DrawingCanvasProps {
  initialData?: any;
  onChange?: (data: any) => void;
  className?: string;
}

type Tool = "select" | "pen" | "highlighter" | "eraser" | "circle" | "rectangle" | "line";

const COLORS = [
  "#000000", // Black
  "#EF4444", // Red
  "#F97316", // Orange
  "#EAB308", // Yellow
  "#22C55E", // Green
  "#3B82F6", // Blue
  "#8B5CF6", // Purple
  "#EC4899", // Pink
];

export const DrawingCanvas = ({
  initialData,
  onChange,
  className,
}: DrawingCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvas, setCanvas] = useState<FabricCanvas | null>(null);
  const [activeTool, setActiveTool] = useState<Tool>("pen");
  const [activeColor, setActiveColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState([3]);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUpdatingRef = useRef(false);

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = 400;

    const fabricCanvas = new FabricCanvas(canvasRef.current, {
      width,
      height,
      backgroundColor: "#ffffff",
      isDrawingMode: true,
    });

    fabricCanvas.freeDrawingBrush = new PencilBrush(fabricCanvas);
    fabricCanvas.freeDrawingBrush.color = activeColor;
    fabricCanvas.freeDrawingBrush.width = strokeWidth[0];

    setCanvas(fabricCanvas);

    // Load initial data
    if (initialData && typeof initialData === "object" && initialData.objects) {
      fabricCanvas.loadFromJSON(initialData).then(() => {
        fabricCanvas.renderAll();
      });
    }

    // Save state on changes
    const handleChange = () => {
      if (isUpdatingRef.current) return;
      onChange?.(fabricCanvas.toJSON());
      
      // Add to history
      const json = JSON.stringify(fabricCanvas.toJSON());
      setHistory((prev) => {
        const newHistory = prev.slice(0, historyIndex + 1);
        return [...newHistory, json];
      });
      setHistoryIndex((prev) => prev + 1);
    };

    fabricCanvas.on("object:added", handleChange);
    fabricCanvas.on("object:modified", handleChange);
    fabricCanvas.on("object:removed", handleChange);

    return () => {
      fabricCanvas.dispose();
    };
  }, []);

  // Update brush settings
  useEffect(() => {
    if (!canvas) return;

    if (activeTool === "pen" || activeTool === "highlighter" || activeTool === "eraser") {
      canvas.isDrawingMode = true;
      if (canvas.freeDrawingBrush) {
        if (activeTool === "eraser") {
          canvas.freeDrawingBrush.color = "#ffffff";
          canvas.freeDrawingBrush.width = strokeWidth[0] * 3;
        } else if (activeTool === "highlighter") {
          // Create semi-transparent color for highlighter
          const hex = activeColor;
          canvas.freeDrawingBrush.color = hex + "40";
          canvas.freeDrawingBrush.width = strokeWidth[0] * 4;
        } else {
          canvas.freeDrawingBrush.color = activeColor;
          canvas.freeDrawingBrush.width = strokeWidth[0];
        }
      }
    } else {
      canvas.isDrawingMode = false;
    }
  }, [canvas, activeTool, activeColor, strokeWidth]);

  const handleToolClick = useCallback(
    (tool: Tool) => {
      setActiveTool(tool);

      if (!canvas) return;

      if (tool === "circle") {
        const circle = new Circle({
          left: 100,
          top: 100,
          fill: "transparent",
          stroke: activeColor,
          strokeWidth: strokeWidth[0],
          radius: 50,
        });
        canvas.add(circle);
        canvas.setActiveObject(circle);
      } else if (tool === "rectangle") {
        const rect = new Rect({
          left: 100,
          top: 100,
          fill: "transparent",
          stroke: activeColor,
          strokeWidth: strokeWidth[0],
          width: 100,
          height: 80,
        });
        canvas.add(rect);
        canvas.setActiveObject(rect);
      } else if (tool === "line") {
        const line = new Line([50, 50, 200, 50], {
          stroke: activeColor,
          strokeWidth: strokeWidth[0],
        });
        canvas.add(line);
        canvas.setActiveObject(line);
      }
    },
    [canvas, activeColor, strokeWidth]
  );

  const handleClear = useCallback(() => {
    if (!canvas) return;
    canvas.clear();
    canvas.backgroundColor = "#ffffff";
    canvas.renderAll();
    onChange?.({ objects: [], background: "#ffffff" });
  }, [canvas, onChange]);

  const handleUndo = useCallback(() => {
    if (historyIndex <= 0 || !canvas) return;
    
    isUpdatingRef.current = true;
    const prevState = history[historyIndex - 1];
    canvas.loadFromJSON(JSON.parse(prevState)).then(() => {
      canvas.renderAll();
      setHistoryIndex((prev) => prev - 1);
      isUpdatingRef.current = false;
    });
  }, [canvas, history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex >= history.length - 1 || !canvas) return;
    
    isUpdatingRef.current = true;
    const nextState = history[historyIndex + 1];
    canvas.loadFromJSON(JSON.parse(nextState)).then(() => {
      canvas.renderAll();
      setHistoryIndex((prev) => prev + 1);
      isUpdatingRef.current = false;
    });
  }, [canvas, history, historyIndex]);

  const handleDownload = useCallback(() => {
    if (!canvas) return;
    
    const dataURL = canvas.toDataURL({
      format: "png",
      quality: 1,
      multiplier: 2,
    });
    
    const link = document.createElement("a");
    link.download = "drawing.png";
    link.href = dataURL;
    link.click();
  }, [canvas]);

  const ToolButton = ({
    tool,
    icon: Icon,
    title,
  }: {
    tool: Tool;
    icon: any;
    title: string;
  }) => (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => handleToolClick(tool)}
      className={cn(
        "h-9 w-9 p-0",
        activeTool === tool && "bg-primary/20 text-primary"
      )}
      title={title}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );

  return (
    <div className={cn("space-y-3", className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-2 bg-muted/30 rounded-lg border border-border">
        <div className="flex gap-1">
          <ToolButton tool="select" icon={Move} title="Select" />
          <ToolButton tool="pen" icon={Pencil} title="Pen" />
          <ToolButton tool="highlighter" icon={Highlighter} title="Highlighter" />
          <ToolButton tool="eraser" icon={Eraser} title="Eraser" />
        </div>

        <div className="w-px h-6 bg-border" />

        <div className="flex gap-1">
          <ToolButton tool="circle" icon={CircleIcon} title="Circle" />
          <ToolButton tool="rectangle" icon={Square} title="Rectangle" />
          <ToolButton tool="line" icon={Minus} title="Line" />
        </div>

        <div className="w-px h-6 bg-border" />

        {/* Colors */}
        <div className="flex gap-1">
          {COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setActiveColor(color)}
              className={cn(
                "w-6 h-6 rounded-full border-2 transition-transform",
                activeColor === color
                  ? "border-primary scale-110"
                  : "border-transparent hover:scale-105"
              )}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>

        <div className="w-px h-6 bg-border" />

        {/* Stroke Width */}
        <div className="flex items-center gap-2 min-w-[100px]">
          <span className="text-xs text-muted-foreground">Size:</span>
          <Slider
            value={strokeWidth}
            onValueChange={setStrokeWidth}
            min={1}
            max={20}
            step={1}
            className="w-20"
          />
        </div>

        <div className="flex-1" />

        {/* Actions */}
        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="h-9 w-9 p-0"
            title="Undo"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="h-9 w-9 p-0"
            title="Redo"
          >
            <Redo className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="h-9 w-9 p-0"
            title="Download"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-9 w-9 p-0 text-destructive hover:text-destructive"
            title="Clear"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="border border-border rounded-lg overflow-hidden bg-white"
      >
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
};
