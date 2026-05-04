"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin, Search, Locate } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { searchPlaces } from "@/lib/open-meteo";
import type { Place } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  place: Place | null;
  onPick: (p: Place) => void;
  onLocate: () => void;
  locating: boolean;
};

export function LocationBar({ place, onPick, onLocate, locating }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Place[]>([]);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const id = window.setTimeout(async () => {
      try {
        const r = await searchPlaces(query);
        if (!cancelled) setResults(r);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [query]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const placeLabel = place
    ? [place.name, place.admin1, place.country].filter(Boolean).join(", ")
    : "Find your spot";

  return (
    <div ref={wrapRef} className="relative">
      <div className="flex items-stretch gap-2">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder={placeLabel}
            className="pl-9"
            inputMode="search"
            autoCapitalize="words"
            spellCheck={false}
            enterKeyHint="search"
            aria-label="Search for a city"
          />
        </div>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          aria-label="Use my location"
          onClick={onLocate}
          disabled={locating}
        >
          {locating ? (
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          ) : (
            <Locate className="h-5 w-5" aria-hidden="true" />
          )}
        </Button>
      </div>

      {open && (query.trim() || place) && (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 max-h-72 overflow-y-auto rounded-xl border border-border/70 bg-card/95 p-1 shadow-xl backdrop-blur-md">
          {loading && (
            <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Searching…
            </div>
          )}
          {!loading && query.trim() && results.length === 0 && (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              No matches for &ldquo;{query}&rdquo;
            </div>
          )}
          {!loading &&
            results.map((r) => (
              <button
                key={`${r.id}-${r.latitude}-${r.longitude}`}
                type="button"
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-accent/15",
                )}
                onClick={() => {
                  onPick(r);
                  setQuery("");
                  setOpen(false);
                }}
              >
                <MapPin
                  className="h-4 w-4 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <span className="truncate">
                  <span className="font-medium">{r.name}</span>
                  <span className="ml-1 text-muted-foreground">
                    {[r.admin1, r.country].filter(Boolean).join(", ")}
                  </span>
                </span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
