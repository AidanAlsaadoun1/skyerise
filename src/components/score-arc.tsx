"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  score: number;
  label: string;
  rating: string;
  className?: string;
};

const SIZE = 220;
const STROKE = 14;
const RADIUS = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * RADIUS;
// Three-quarter arc: leave the bottom 90° gap.
const ARC_FRACTION = 0.75;
const ARC_LENGTH = CIRC * ARC_FRACTION;

export function ScoreArc({ score, label, rating, className }: Props) {
  const [animated, setAnimated] = useState(0);
  useEffect(() => {
    const id = window.setTimeout(() => setAnimated(score), 60);
    return () => window.clearTimeout(id);
  }, [score]);
  const offset = ARC_LENGTH * (1 - animated / 100);

  return (
    <div className={cn("relative flex flex-col items-center", className)}>
      <svg
        width={SIZE}
        height={SIZE * 0.78}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="drop-shadow-[0_8px_24px_hsl(var(--primary)/0.25)]"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="scoreGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="hsl(var(--accent))" />
            <stop offset="55%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(48 100% 60%)" />
          </linearGradient>
        </defs>
        <g transform={`rotate(135 ${SIZE / 2} ${SIZE / 2})`}>
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            strokeWidth={STROKE}
            strokeLinecap="round"
            className="score-track"
            strokeDasharray={`${ARC_LENGTH} ${CIRC}`}
          />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            strokeWidth={STROKE}
            strokeLinecap="round"
            className="score-fill"
            strokeDasharray={`${ARC_LENGTH} ${CIRC}`}
            strokeDashoffset={offset}
          />
        </g>
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pt-2">
        <div className="text-[64px] font-semibold leading-none tracking-tight tabular-nums">
          {Math.round(animated)}
        </div>
        <div className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </div>
        <div className="mt-2 rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary">
          {rating}
        </div>
      </div>
    </div>
  );
}
