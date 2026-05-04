"use client";

import { useEffect, useRef } from "react";
import { Sunrise, Sunset } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DayReport } from "@/lib/types";

type Props = {
  days: DayReport[];
  selectedIndex: number;
  todayIndex: number;
  onSelect: (i: number) => void;
  /** Which event the user is looking at — affects the "primary" score shown big. */
  focus: "sunrise" | "sunset";
};

function dayLabel(date: string, isToday: boolean, timezone: string): string {
  if (isToday) return "Today";
  const d = new Date(`${date}T12:00:00`);
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    timeZone: timezone,
  }).format(d);
}

function dateLabel(date: string, timezone: string): string {
  const d = new Date(`${date}T12:00:00`);
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    timeZone: timezone,
  }).format(d);
}

function ratingColor(score: number): string {
  // Maps 0–100 to a hue from red → orange → gold for visual scanning.
  if (score >= 85) return "from-yellow-300 to-primary";
  if (score >= 70) return "from-primary to-accent";
  if (score >= 55) return "from-accent to-fuchsia-500";
  if (score >= 35) return "from-fuchsia-500/80 to-violet-500/80";
  return "from-slate-500 to-slate-600";
}

export function WeeklyStrip({
  days,
  selectedIndex,
  todayIndex,
  onSelect,
  focus,
}: Props) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const selectedRef = useRef<HTMLButtonElement | null>(null);

  // Keep the selected day in view when it changes (mobile horizontal scroll).
  useEffect(() => {
    selectedRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [selectedIndex]);

  return (
    <div
      ref={scrollRef}
      className={cn(
        "no-scrollbar -mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-1",
        "sm:mx-0 sm:grid sm:grid-cols-7 sm:gap-2 sm:overflow-visible sm:px-0",
      )}
      role="tablist"
      aria-label="Weekly forecast"
    >
      {days.map((d, i) => {
        const primary = focus === "sunrise" ? d.sunrise : d.sunset;
        const secondary = focus === "sunrise" ? d.sunset : d.sunrise;
        const isSelected = i === selectedIndex;
        const isToday = i === todayIndex;
        return (
          <button
            ref={isSelected ? selectedRef : null}
            key={d.date}
            type="button"
            role="tab"
            aria-selected={isSelected}
            onClick={() => onSelect(i)}
            className={cn(
              "group relative flex w-[88px] shrink-0 snap-center flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 text-center transition-all sm:w-auto",
              "border-border/60 bg-card/60 backdrop-blur-sm",
              "hover:border-primary/50 hover:bg-card/80",
              isSelected &&
                "border-primary/70 bg-card shadow-md shadow-primary/15",
            )}
          >
            <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {dayLabel(d.date, isToday, d.timezone)}
            </div>
            <div className="text-[10px] text-muted-foreground/80">
              {dateLabel(d.date, d.timezone)}
            </div>
            <div
              className={cn(
                "mt-1 grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br text-base font-semibold text-primary-foreground shadow-inner",
                ratingColor(primary.score),
              )}
            >
              <span className="tabular-nums">{primary.score}</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              {focus === "sunrise" ? (
                <Sunset className="h-3 w-3" aria-hidden="true" />
              ) : (
                <Sunrise className="h-3 w-3" aria-hidden="true" />
              )}
              <span className="tabular-nums">{secondary.score}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
