"use client";

import { useEffect, useState } from "react";
import type { SubScore } from "@/lib/types";

const ICONS: Record<SubScore["key"], string> = {
  highClouds: "☁︎",
  midClouds: "⛅︎",
  lowClouds: "🌫",
  humidity: "💧",
  visibility: "👁",
  airQuality: "🍃",
};

export function SubScoreBar({ sub }: { sub: SubScore }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const id = window.setTimeout(() => setW(sub.value), 80);
    return () => window.clearTimeout(id);
  }, [sub.value]);

  return (
    <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-card/50 p-3 backdrop-blur-sm">
      <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-muted/70 text-base">
        <span aria-hidden="true">{ICONS[sub.key]}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <div className="text-sm font-medium">{sub.label}</div>
          <div className="text-sm tabular-nums text-muted-foreground">
            {sub.value}
          </div>
        </div>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent via-primary to-yellow-400 transition-[width] duration-700 ease-out"
            style={{ width: `${w}%` }}
          />
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
          {sub.detail}
        </p>
      </div>
    </div>
  );
}
