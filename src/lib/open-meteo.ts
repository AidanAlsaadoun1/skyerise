import type { Coords, Place, WeatherSnapshot } from "./types";

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search";
const REVERSE_URL = "https://geocoding-api.open-meteo.com/v1/reverse";
const AIR_URL = "https://air-quality-api.open-meteo.com/v1/air-quality";

type ForecastResponse = {
  timezone: string;
  utc_offset_seconds: number;
  daily: {
    time: string[];
    sunrise: string[];
    sunset: string[];
  };
  hourly: {
    time: string[];
    cloud_cover: number[];
    cloud_cover_low: number[];
    cloud_cover_mid: number[];
    cloud_cover_high: number[];
    visibility: number[];
    relative_humidity_2m: number[];
    temperature_2m: number[];
    weather_code: number[];
  };
};

type AirQualityResponse = {
  hourly: {
    time: string[];
    european_aqi: (number | null)[];
    pm2_5: (number | null)[];
  };
};

export type Forecast = {
  timezone: string;
  utcOffsetSeconds: number;
  sunrises: { dateLocal: string; iso: string }[];
  sunsets: { dateLocal: string; iso: string }[];
  hourly: ForecastResponse["hourly"];
};

export type AirSeries = {
  time: string[];
  europeanAqi: (number | null)[];
  pm25: (number | null)[];
};

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Request failed (${res.status}): ${url}`);
  }
  return (await res.json()) as T;
}

export async function fetchForecast(
  { latitude, longitude }: Coords,
  forecastDays = 7,
): Promise<Forecast> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    daily: "sunrise,sunset",
    hourly: [
      "cloud_cover",
      "cloud_cover_low",
      "cloud_cover_mid",
      "cloud_cover_high",
      "visibility",
      "relative_humidity_2m",
      "temperature_2m",
      "weather_code",
    ].join(","),
    timezone: "auto",
    forecast_days: String(forecastDays),
  });
  const data = await getJson<ForecastResponse>(`${FORECAST_URL}?${params}`);
  return {
    timezone: data.timezone,
    utcOffsetSeconds: data.utc_offset_seconds,
    sunrises: data.daily.sunrise.map((iso, i) => ({
      dateLocal: data.daily.time[i],
      iso,
    })),
    sunsets: data.daily.sunset.map((iso, i) => ({
      dateLocal: data.daily.time[i],
      iso,
    })),
    hourly: data.hourly,
  };
}

export async function fetchAirQuality(
  { latitude, longitude }: Coords,
  forecastDays = 7,
): Promise<AirSeries | null> {
  try {
    const params = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      hourly: "european_aqi,pm2_5",
      timezone: "auto",
      forecast_days: String(forecastDays),
    });
    const data = await getJson<AirQualityResponse>(`${AIR_URL}?${params}`);
    return {
      time: data.hourly.time,
      europeanAqi: data.hourly.european_aqi,
      pm25: data.hourly.pm2_5,
    };
  } catch {
    // Air-quality is best-effort; if the endpoint is unavailable in a region
    // we still return a useful sunrise/sunset score without it.
    return null;
  }
}

export async function searchPlaces(query: string): Promise<Place[]> {
  if (!query.trim()) return [];
  const params = new URLSearchParams({
    name: query.trim(),
    count: "8",
    language: "en",
    format: "json",
  });
  type R = {
    results?: {
      id: number;
      name: string;
      latitude: number;
      longitude: number;
      country?: string;
      admin1?: string;
      timezone?: string;
    }[];
  };
  const data = await getJson<R>(`${GEOCODE_URL}?${params}`);
  return (data.results ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    latitude: r.latitude,
    longitude: r.longitude,
    country: r.country,
    admin1: r.admin1,
    timezone: r.timezone,
  }));
}

export async function reverseGeocode(coords: Coords): Promise<Place | null> {
  const params = new URLSearchParams({
    latitude: String(coords.latitude),
    longitude: String(coords.longitude),
    count: "1",
    language: "en",
    format: "json",
  });
  type R = {
    results?: {
      id: number;
      name: string;
      latitude: number;
      longitude: number;
      country?: string;
      admin1?: string;
      timezone?: string;
    }[];
  };
  try {
    const data = await getJson<R>(`${REVERSE_URL}?${params}`);
    const r = data.results?.[0];
    if (!r) return null;
    return {
      id: r.id,
      name: r.name,
      latitude: r.latitude,
      longitude: r.longitude,
      country: r.country,
      admin1: r.admin1,
      timezone: r.timezone,
    };
  } catch {
    return null;
  }
}

/**
 * Find the hourly index closest to a given local-iso time (e.g. "2026-05-01T20:15").
 * Open-Meteo hourly times are on the hour in the same local timezone, so we
 * snap to the nearest hour.
 */
export function nearestHourIndex(
  hourlyTimes: string[],
  targetIso: string,
): number {
  const target = new Date(targetIso).getTime();
  let best = 0;
  let bestDelta = Number.POSITIVE_INFINITY;
  for (let i = 0; i < hourlyTimes.length; i++) {
    const t = new Date(hourlyTimes[i]).getTime();
    const delta = Math.abs(t - target);
    if (delta < bestDelta) {
      bestDelta = delta;
      best = i;
    }
  }
  return best;
}

export function snapshotAt(
  hourly: ForecastResponse["hourly"],
  index: number,
): WeatherSnapshot {
  return {
    cloudCover: hourly.cloud_cover[index] ?? 0,
    cloudLow: hourly.cloud_cover_low[index] ?? 0,
    cloudMid: hourly.cloud_cover_mid[index] ?? 0,
    cloudHigh: hourly.cloud_cover_high[index] ?? 0,
    humidity: hourly.relative_humidity_2m[index] ?? 0,
    visibilityMeters: hourly.visibility[index] ?? 24000,
    temperatureC: hourly.temperature_2m[index] ?? 0,
    weatherCode: hourly.weather_code[index] ?? 0,
  };
}
