"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScoreArc } from "./score-arc";
import { SubScoreBar } from "./sub-score-bar";
import type { EventReport } from "@/lib/types";
import { describeWeatherCode } from "@/lib/weather-codes";
import { Clock, Droplets, Eye, Thermometer, Wind } from "lucide-react";

type Props = {
  event: EventReport;
  timezone: string;
};

function formatTime(iso: string, timezone: string) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    timeZone: timezone,
  }).format(d);
}

function formatRelative(iso: string) {
  const target = new Date(iso).getTime();
  const now = Date.now();
  const diff = target - now;
  const absMin = Math.round(Math.abs(diff) / 60000);
  if (absMin < 1) return "now";
  if (absMin < 60)
    return diff > 0 ? `in ${absMin} min` : `${absMin} min ago`;
  const hours = Math.round(absMin / 60);
  if (hours < 24)
    return diff > 0 ? `in ${hours} h` : `${hours} h ago`;
  const days = Math.round(hours / 24);
  return diff > 0 ? `in ${days} d` : `${days} d ago`;
}

export function EventPanel({ event, timezone }: Props) {
  const heading = event.type === "sunrise" ? "Sunrise" : "Sunset";
  const time = formatTime(event.isoTime, timezone);
  const relative = formatRelative(event.isoTime);
  const wx = describeWeatherCode(event.weather.weatherCode);

  return (
    <div className="flex flex-col gap-4">
      <Card className="overflow-hidden">
        <CardHeader className="items-center text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-lg">
            {heading}
            <span className="text-muted-foreground">·</span>
            <span className="tabular-nums text-foreground">{time}</span>
          </CardTitle>
          <CardDescription className="flex items-center justify-center gap-1.5">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{relative}</span>
            <span aria-hidden="true">·</span>
            <span>{wx}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <ScoreArc
            score={event.score}
            label="quality score"
            rating={event.rating}
            className="mx-auto"
          />
          <p className="mx-auto mt-2 max-w-[28ch] text-center text-sm text-muted-foreground">
            {event.summary}
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
            <Stat
              icon={<Thermometer className="h-3.5 w-3.5" aria-hidden="true" />}
              label="Temp"
              value={`${Math.round(event.weather.temperatureC)}°C`}
            />
            <Stat
              icon={<Droplets className="h-3.5 w-3.5" aria-hidden="true" />}
              label="Humidity"
              value={`${Math.round(event.weather.humidity)}%`}
            />
            <Stat
              icon={<Eye className="h-3.5 w-3.5" aria-hidden="true" />}
              label="Visibility"
              value={`${Math.round(event.weather.visibilityMeters / 1000)} km`}
            />
            <Stat
              icon={<Wind className="h-3.5 w-3.5" aria-hidden="true" />}
              label="Cloud"
              value={`${Math.round(event.weather.cloudCover)}%`}
            />
            <Stat
              label="AQI"
              value={
                event.airQualityIndex == null
                  ? "—"
                  : `${Math.round(event.airQualityIndex)}`
              }
            />
            <Stat
              label="PM2.5"
              value={
                event.pm25 == null
                  ? "—"
                  : `${event.pm25.toFixed(0)} µg/m³`
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Why this score</CardTitle>
          <CardDescription>
            Each factor is weighted; high clouds and low clouds matter most.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2">
          {event.subScores.map((s) => (
            <SubScoreBar key={s.key} sub={s} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-muted/40 p-2 text-center">
      <div className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-0.5 text-sm font-medium tabular-nums">{value}</div>
    </div>
  );
}
