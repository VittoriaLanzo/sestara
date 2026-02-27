import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  children?: React.ReactNode;
}

export const ProgressRing = ({
  progress,
  size = 120,
  strokeWidth = 5,
  className,
  children,
}: ProgressRingProps) => {
  const arcRef = useRef<SVGPathElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  // Arc length for the semicircle: π * radius
  const arcLength = 125.66;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const offset = visible ? arcLength * (1 - progress / 100) : arcLength;

  // Scale viewBox to fit desired size ratio
  const viewW = 100;
  const viewH = 55;
  const aspect = viewW / viewH;
  const displayW = size;
  const displayH = size / aspect;

  return (
    <div ref={containerRef} className={cn("relative inline-flex flex-col items-center justify-center", className)} style={{ width: displayW, height: displayH + 20 }}>
      <svg viewBox="0 0 100 55" width={displayW} height={displayH}>
        {/* Background arc */}
        <path
          d="M 10 50 A 40 40 0 0 1 90 50"
          fill="none"
          stroke="hsl(var(--secondary))"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Progress arc */}
        <path
          ref={arcRef}
          d="M 10 50 A 40 40 0 0 1 90 50"
          fill="none"
          stroke="hsl(var(--accent))"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={arcLength}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease-in-out' }}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ paddingTop: 4 }}>
          {children}
        </div>
      )}
    </div>
  );
};
