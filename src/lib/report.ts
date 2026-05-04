import {
  fetchAirQuality,
  fetchForecast,
  nearestHourIndex,
  snapshotAt,
  type AirSeries,
} from "./open-meteo";
import { buildEventReport } from "./scoring";
import type { DayReport, Place, WeekReport } from "./types";

const DEFAULT_DAYS = 7;

function todayInTimezone(timezone: string): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(new Date());
}

function aqiAt(
  air: AirSeries | null,
  isoTime: string,
): { aqi: number | null; pm25: number | null } {
  if (!air) return { aqi: null, pm25: null };
  const idx = nearestHourIndex(air.time, isoTime);
  return {
    aqi: air.europeanAqi[idx] ?? null,
    pm25: air.pm25[idx] ?? null,
  };
}

/**
 * Build a 7-day sunrise/sunset report. `days[0]` is the earliest day in the
 * forecast window (typically today in the place's local timezone), and
 * `todayIndex` points at "today" in case the API returns a longer window.
 */
export async function buildWeekReport(
  place: Place,
  forecastDays = DEFAULT_DAYS,
): Promise<WeekReport> {
  const [forecast, air] = await Promise.all([
    fetchForecast(place, forecastDays),
    fetchAirQuality(place, forecastDays),
  ]);

  const local = forecast.timezone || place.timezone || "UTC";
  const today = todayInTimezone(local);

  const days: DayReport[] = forecast.sunrises.map((sr, i) => {
    const ss = forecast.sunsets[i];
    const dateLocal = sr.dateLocal;
    const sunriseIdx = nearestHourIndex(forecast.hourly.time, sr.iso);
    const sunsetIdx = nearestHourIndex(forecast.hourly.time, ss.iso);

    const srWeather = snapshotAt(forecast.hourly, sunriseIdx);
    const ssWeather = snapshotAt(forecast.hourly, sunsetIdx);

    const srAir = aqiAt(air, sr.iso);
    const ssAir = aqiAt(air, ss.iso);

    return {
      place,
      date: dateLocal,
      timezone: local,
      sunrise: buildEventReport(
        "sunrise",
        sr.iso,
        new Date(sr.iso).getTime() / 1000,
        srWeather,
        srAir.aqi,
        srAir.pm25,
      ),
      sunset: buildEventReport(
        "sunset",
        ss.iso,
        new Date(ss.iso).getTime() / 1000,
        ssWeather,
        ssAir.aqi,
        ssAir.pm25,
      ),
    };
  });

  let todayIndex = days.findIndex((d) => d.date === today);
  if (todayIndex < 0) todayIndex = 0;

  return {
    place,
    timezone: local,
    todayIndex,
    days,
    generatedAt: new Date().toISOString(),
  };
}

/** Back-compat: just today's report. */
export async function buildDayReport(place: Place): Promise<DayReport> {
  const week = await buildWeekReport(place, 2);
  return week.days[week.todayIndex];
}
