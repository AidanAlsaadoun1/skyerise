import type { EventReport, SubScore, WeatherSnapshot } from "./types";
import { describeWeatherCode } from "./weather-codes";

/**
 * Sunrise/sunset quality heuristic.
 *
 * The literature on what makes a good sunset (Smithsonian / SunsetWx-style work,
 * NOAA cloud guides, hobbyist photography references) generally agrees:
 *  - HIGH clouds (cirrus, ~6km+) at 30–70 % coverage are the *good* clouds —
 *    they catch and scatter the orange/red wavelengths after the sun has
 *    already passed below the horizon.
 *  - LOW clouds near the horizon block the show entirely.
 *  - MID clouds are mixed: a thin deck can still take colour, a thick deck blocks it.
 *  - LOW humidity sharpens colour and contrast.
 *  - Long visibility (clean air, no haze) helps a lot.
 *  - Air quality matters but mildly — a *little* aerosol can deepen reds, a lot kills them.
 *
 * Each sub-score is 0–100; the final score is a weighted mean.
 */

const W = {
  highClouds: 0.32,
  lowClouds: 0.28,
  midClouds: 0.12,
  humidity: 0.1,
  visibility: 0.1,
  airQuality: 0.08,
} as const;

function clamp(n: number, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, n));
}

/** Triangle-shaped peak around `peak` (0..100). 0 → score 0, peak → 100, 100 → 0. */
function triangular(value: number, peak: number, slack = 0): number {
  const v = clamp(value);
  if (Math.abs(v - peak) <= slack) return 100;
  if (v < peak) return clamp((v / Math.max(peak - slack, 1)) * 100);
  return clamp(((100 - v) / Math.max(100 - peak - slack, 1)) * 100);
}

function scoreHighClouds(pct: number): SubScore {
  // Sweet spot is ~50 % high-cloud coverage. 0 = clear (no canvas), 100 = blanket.
  const value = triangular(pct, 50, 10);
  return {
    key: "highClouds",
    label: "High clouds",
    value: Math.round(value),
    weight: W.highClouds,
    detail:
      pct < 15
        ? "Sky is too clear — no clouds to catch colour."
        : pct > 85
          ? "Solid high-cloud blanket — light gets diffused away."
          : "Cirrus-altitude clouds in the sweet spot for colour.",
  };
}

function scoreLowClouds(pct: number): SubScore {
  // Lower is better. 0 % low cloud = perfect; >70 % = no view at all.
  const value = clamp(100 - pct * 1.15);
  return {
    key: "lowClouds",
    label: "Low clouds",
    value: Math.round(value),
    weight: W.lowClouds,
    detail:
      pct < 20
        ? "Horizon looks clear — nothing in the way of the sun."
        : pct < 60
          ? "Some low cloud near the horizon may obscure parts of the show."
          : "Heavy low cloud near the horizon will likely block the view.",
  };
}

function scoreMidClouds(pct: number): SubScore {
  // Mild penalty for very heavy mid-cloud, slight benefit for light cover.
  let value: number;
  if (pct < 25) value = 90;
  else if (pct < 55) value = 70;
  else if (pct < 75) value = 45;
  else value = 20;
  return {
    key: "midClouds",
    label: "Mid clouds",
    value,
    weight: W.midClouds,
    detail:
      pct > 60
        ? "Thick mid-altitude deck may dim the colours."
        : "Mid-altitude clouds are thin enough to take colour.",
  };
}

function scoreHumidity(pct: number): SubScore {
  // Crisp air (low RH) gives sharper colour. Above ~85 % is hazy/muted.
  const value = clamp(110 - pct * 1.0);
  return {
    key: "humidity",
    label: "Humidity",
    value: Math.round(clamp(value)),
    weight: W.humidity,
    detail:
      pct < 55
        ? "Air is dry — colours will look crisp."
        : pct < 80
          ? "Mild humidity — slight softening of contrast."
          : "Very humid — expect muted, hazy colours.",
  };
}

function scoreVisibility(metres: number): SubScore {
  // <5 km poor, 24 km perfect.
  const km = metres / 1000;
  const value = clamp(((km - 2) / (24 - 2)) * 100);
  return {
    key: "visibility",
    label: "Visibility",
    value: Math.round(value),
    weight: W.visibility,
    detail:
      km < 8
        ? `Visibility only ${km.toFixed(1)} km — distant features will be hidden.`
        : km < 18
          ? `Decent visibility (${km.toFixed(0)} km).`
          : `Excellent visibility (${km.toFixed(0)} km) — long horizon shot.`,
  };
}

function scoreAirQuality(aqi: number | null, pm25: number | null): SubScore {
  // Open-Meteo's european_aqi: 0–20 very good, 20–40 good, 40–60 medium, 60–80 poor, 80–100+ very poor.
  if (aqi == null) {
    return {
      key: "airQuality",
      label: "Air quality",
      value: 70,
      weight: W.airQuality,
      detail: "Air quality data unavailable — using a neutral estimate.",
    };
  }
  let value: number;
  if (aqi <= 20) value = 92;
  else if (aqi <= 40) value = 85;
  else if (aqi <= 60) value = 70;
  else if (aqi <= 80) value = 50;
  else value = 25;
  const pmText = pm25 != null ? `, PM2.5 ${pm25.toFixed(0)} µg/m³` : "";
  return {
    key: "airQuality",
    label: "Air quality",
    value,
    weight: W.airQuality,
    detail: `European AQI ${aqi.toFixed(0)}${pmText}.`,
  };
}

export function ratingFor(score: number): EventReport["rating"] {
  if (score >= 85) return "Spectacular";
  if (score >= 70) return "Great";
  if (score >= 55) return "Good";
  if (score >= 35) return "Average";
  return "Poor";
}

function summarize(
  type: "sunrise" | "sunset",
  score: number,
  subs: SubScore[],
  weather: WeatherSnapshot,
): string {
  const rating = ratingFor(score);
  const weakest = [...subs].sort((a, b) => a.value - b.value)[0];
  const strongest = [...subs].sort((a, b) => b.value - a.value)[0];
  const wx = describeWeatherCode(weather.weatherCode);
  if (rating === "Spectacular" || rating === "Great") {
    return `${rating} ${type} on the cards — ${strongest.label.toLowerCase()} are dialled in (${wx.toLowerCase()}).`;
  }
  if (rating === "Good") {
    return `Pleasant ${type}, but ${weakest.label.toLowerCase()} are the limiting factor.`;
  }
  if (rating === "Average") {
    return `Middle-of-the-road ${type} — ${weakest.label.toLowerCase()} will hold it back.`;
  }
  return `Tough ${type} ahead — ${weakest.label.toLowerCase()} look bad and ${wx.toLowerCase()} doesn't help.`;
}

export function buildEventReport(
  type: "sunrise" | "sunset",
  isoTime: string,
  unixSeconds: number,
  weather: WeatherSnapshot,
  airQualityIndex: number | null,
  pm25: number | null,
): EventReport {
  const subScores: SubScore[] = [
    scoreHighClouds(weather.cloudHigh),
    scoreLowClouds(weather.cloudLow),
    scoreMidClouds(weather.cloudMid),
    scoreHumidity(weather.humidity),
    scoreVisibility(weather.visibilityMeters),
    scoreAirQuality(airQualityIndex, pm25),
  ];
  const score = Math.round(
    subScores.reduce((acc, s) => acc + s.value * s.weight, 0),
  );
  const rating = ratingFor(score);
  const summary = summarize(type, score, subScores, weather);
  return {
    type,
    isoTime,
    unixSeconds,
    weather,
    airQualityIndex,
    pm25,
    score,
    rating,
    subScores,
    summary,
  };
}
