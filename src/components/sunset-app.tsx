"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Sunrise, Sunset } from "lucide-react";
import { LocationBar } from "./location-bar";
import { EventPanel } from "./event-panel";
import { WeeklyStrip } from "./weekly-strip";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { reverseGeocode } from "@/lib/open-meteo";
import { buildWeekReport } from "@/lib/report";
import type { Place, WeekReport } from "@/lib/types";

const STORAGE_KEY = "golden:lastPlace";

export function SunsetApp() {
  const [place, setPlace] = useState<Place | null>(null);
  const [week, setWeek] = useState<WeekReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"sunset" | "sunrise">(
    typeof window !== "undefined" && new Date().getHours() >= 12
      ? "sunset"
      : "sunrise",
  );
  const [selectedDay, setSelectedDay] = useState<number>(0);

  // Restore last place from localStorage, or auto-locate.
  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const p = JSON.parse(raw) as Place;
        if (p && typeof p.latitude === "number") {
          setPlace(p);
          return;
        }
      } catch {
        /* ignore */
      }
    }
    locate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist + fetch when place changes.
  useEffect(() => {
    if (!place) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(place));
    let cancelled = false;
    setLoading(true);
    setError(null);
    buildWeekReport(place)
      .then((r) => {
        if (cancelled) return;
        setWeek(r);
        setSelectedDay(r.todayIndex);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          const msg = e instanceof Error ? e.message : "Something went wrong";
          setError(msg);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [place]);

  const locate = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setError("This browser doesn't support geolocation. Search instead.");
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        const found = await reverseGeocode(coords);
        const guess: Place = found ?? { name: "Your location", ...coords };
        setPlace(guess);
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setError(
            "Location permission denied — search for a city instead.",
          );
        } else {
          setError("Couldn't get your location. Search for a city instead.");
        }
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60 * 1000 },
    );
  }, []);

  const activeDay = useMemo(() => {
    if (!week) return null;
    return week.days[selectedDay] ?? week.days[week.todayIndex];
  }, [week, selectedDay]);

  const headerLabel = useMemo(() => {
    if (!week || !activeDay) return "—";
    const isToday = selectedDay === week.todayIndex;
    const d = new Date(`${activeDay.date}T12:00:00`);
    const fmt = new Intl.DateTimeFormat(undefined, {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone: week.timezone,
    });
    return isToday ? `Today · ${fmt.format(d)}` : fmt.format(d);
  }, [week, activeDay, selectedDay]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-4 px-4 pb-10 pt-6 sm:max-w-2xl sm:gap-6 sm:pt-10">
      <header className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <h1 className="bg-gradient-to-br from-yellow-300 via-primary to-accent bg-clip-text text-3xl font-semibold tracking-tight text-transparent sm:text-4xl">
            Golden
          </h1>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {headerLabel}
          </p>
        </div>
        <LocationBar
          place={place}
          locating={locating}
          onPick={(p) => setPlace(p)}
          onLocate={locate}
        />
        {error && (
          <div
            role="status"
            className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {error}
          </div>
        )}
      </header>

      {/* Weekly strip */}
      {week ? (
        <WeeklyStrip
          days={week.days}
          selectedIndex={selectedDay}
          todayIndex={week.todayIndex}
          onSelect={setSelectedDay}
          focus={tab}
        />
      ) : (
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-[112px] w-[88px] rounded-2xl" />
          ))}
        </div>
      )}

      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as "sunrise" | "sunset")}
        className="flex flex-col"
      >
        <div className="flex justify-center">
          <TabsList>
            <TabsTrigger value="sunrise" className="gap-2">
              <Sunrise className="h-4 w-4" aria-hidden="true" />
              Sunrise
            </TabsTrigger>
            <TabsTrigger value="sunset" className="gap-2">
              <Sunset className="h-4 w-4" aria-hidden="true" />
              Sunset
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="sunrise">
          {loading || !activeDay ? (
            <LoadingPanel />
          ) : (
            <EventPanel event={activeDay.sunrise} timezone={activeDay.timezone} />
          )}
        </TabsContent>
        <TabsContent value="sunset">
          {loading || !activeDay ? (
            <LoadingPanel />
          ) : (
            <EventPanel event={activeDay.sunset} timezone={activeDay.timezone} />
          )}
        </TabsContent>
      </Tabs>

      <footer className="mt-auto pt-4 text-center text-[11px] leading-relaxed text-muted-foreground">
        Forecast &amp; air-quality data from{" "}
        <a
          className="underline decoration-dotted underline-offset-2 hover:text-foreground"
          href="https://open-meteo.com/"
          target="_blank"
          rel="noreferrer noopener"
        >
          Open-Meteo
        </a>
        . Quality score is heuristic, not a guarantee — keep your eyes on the
        sky.
      </footer>
    </main>
  );
}

function LoadingPanel() {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-border/60 bg-card/70 p-6 backdrop-blur-md">
        <Skeleton className="mx-auto h-6 w-40" />
        <Skeleton className="mx-auto mt-6 h-44 w-44 rounded-full" />
        <Skeleton className="mx-auto mt-4 h-4 w-56" />
        <div className="mt-4 grid grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-border/60 bg-card/70 p-4 backdrop-blur-md">
        <Skeleton className="h-4 w-32" />
        <div className="mt-3 grid gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      </div>
    </div>
  );
}
