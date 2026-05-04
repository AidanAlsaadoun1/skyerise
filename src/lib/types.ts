export type Coords = { latitude: number; longitude: number };

export type Place = {
  id?: number;
  name: string;
  admin1?: string;
  country?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
};

export type WeatherSnapshot = {
  cloudCover: number; // 0-100, total
  cloudLow: number; // 0-100
  cloudMid: number; // 0-100
  cloudHigh: number; // 0-100
  humidity: number; // 0-100, %
  visibilityMeters: number; // metres
  temperatureC: number;
  weatherCode: number;
};

export type SubScore = {
  key:
    | "highClouds"
    | "lowClouds"
    | "midClouds"
    | "humidity"
    | "visibility"
    | "airQuality";
  label: string;
  value: number; // 0-100
  weight: number;
  detail: string;
};

export type EventReport = {
  type: "sunrise" | "sunset";
  isoTime: string; // local ISO without timezone
  unixSeconds: number;
  weather: WeatherSnapshot;
  airQualityIndex: number | null; // European AQI; null if unavailable
  pm25: number | null;
  score: number; // 0-100
  rating: "Poor" | "Average" | "Good" | "Great" | "Spectacular";
  subScores: SubScore[];
  summary: string;
};

export type DayReport = {
  place: Place;
  date: string; // YYYY-MM-DD in local tz
  timezone: string;
  sunrise: EventReport;
  sunset: EventReport;
};

export type WeekReport = {
  place: Place;
  timezone: string;
  todayIndex: number; // index into days[] for "today" in the place's tz
  days: DayReport[];
  generatedAt: string;
};
