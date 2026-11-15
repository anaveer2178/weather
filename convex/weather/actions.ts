import { action } from "../_generated/server";
import { v } from "convex/values";
import { generateSimulatedWeather } from "../lib/utils";
import type {
  WeatherDataPayload,
  GeoLocationResult,
  HourlyForecastItem,
  DailyForecastItem,
  CurrentWeather,
} from "./types";

const POPULAR_CITIES: GeoLocationResult[] = [
  { name: "London", country: "GB", state: "England", lat: 51.5074, lon: -0.1278 },
  { name: "New York", country: "US", state: "New York", lat: 40.7128, lon: -74.006 },
  { name: "Tokyo", country: "JP", state: "Tokyo", lat: 35.6762, lon: 139.6503 },
  { name: "Paris", country: "FR", state: "Île-de-France", lat: 48.8566, lon: 2.3522 },
  { name: "Sydney", country: "AU", state: "New South Wales", lat: -33.8688, lon: 151.2093 },
  { name: "Dubai", country: "AE", state: "Dubai", lat: 25.2048, lon: 55.2708 },
  { name: "Singapore", country: "SG", state: "Central", lat: 1.3521, lon: 103.8198 },
  { name: "Mumbai", country: "IN", state: "Maharashtra", lat: 19.076, lon: 72.8777 },
  { name: "San Francisco", country: "US", state: "California", lat: 37.7749, lon: -122.4194 },
  { name: "Berlin", country: "DE", state: "Berlin", lat: 52.52, lon: 13.405 },
  { name: "Toronto", country: "CA", state: "Ontario", lat: 43.6532, lon: -79.3832 },
  { name: "Seoul", country: "KR", state: "Seoul", lat: 37.5665, lon: 126.978 },
];

export const searchCities = action({
  args: {
    query: v.string(),
  },
  handler: async (_ctx, { query }): Promise<GeoLocationResult[]> => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) return [];

    const apiKey = process.env.OPENWEATHER_API_KEY;

    if (apiKey) {
      try {
        const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(
          trimmed
        )}&limit=6&appid=${apiKey}`;
        const response = await fetch(geoUrl);
        if (response.ok) {
          const data = (await response.json()) as any[];
          return data.map((item) => ({
            name: item.name,
            country: item.country,
            state: item.state,
            lat: item.lat,
            lon: item.lon,
          }));
        }
      } catch (err) {
        console.warn("OpenWeather geocoding API error, falling back to local dataset:", err);
      }
    }

    // Fallback: match query against curated popular cities
    const qLower = trimmed.toLowerCase();
    const matches = POPULAR_CITIES.filter(
      (c) =>
        c.name.toLowerCase().includes(qLower) ||
        c.country.toLowerCase().includes(qLower) ||
        (c.state && c.state.toLowerCase().includes(qLower))
    );

    if (matches.length > 0) return matches;

    // Dynamic mock for any unknown custom query
    return [
      {
        name: trimmed.charAt(0).toUpperCase() + trimmed.slice(1),
        country: "World",
        state: "Region",
        lat: 40.0 + (trimmed.length % 20),
        lon: -70.0 + (trimmed.length % 40),
      },
    ];
  },
});

export const fetchWeather = action({
  args: {
    lat: v.number(),
    lon: v.number(),
    cityName: v.optional(v.string()),
    country: v.optional(v.string()),
  },
  handler: async (_ctx, { lat, lon, cityName, country }): Promise<WeatherDataPayload> => {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    const resolvedCity = cityName || "Current Location";
    const resolvedCountry = country || "";

    if (!apiKey) {
      // Use high-fidelity realistic simulated data
      return generateSimulatedWeather(resolvedCity, resolvedCountry, lat, lon);
    }

    try {
      // Fetch current weather
      const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
      const currentRes = await fetch(currentUrl);

      if (!currentRes.ok) {
        throw new Error(`OpenWeather current API returned ${currentRes.status}`);
      }
      const curData = await currentRes.json();

      // Fetch 5-day / 3-hour forecast
      const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
      const forecastRes = await fetch(forecastUrl);

      if (!forecastRes.ok) {
        throw new Error(`OpenWeather forecast API returned ${forecastRes.status}`);
      }
      const forecastData = await forecastRes.json();

      // Normalize current weather
      const current: CurrentWeather = {
        city: curData.name || resolvedCity,
        country: curData.sys?.country || resolvedCountry,
        lat: curData.coord?.lat ?? lat,
        lon: curData.coord?.lon ?? lon,
        temp: Math.round(curData.main.temp * 10) / 10,
        feelsLike: Math.round(curData.main.feels_like * 10) / 10,
        tempMin: Math.round(curData.main.temp_min * 10) / 10,
        tempMax: Math.round(curData.main.temp_max * 10) / 10,
        humidity: curData.main.humidity,
        pressure: curData.main.pressure,
        visibility: curData.visibility,
        windSpeed: curData.wind?.speed ?? 0,
        windDeg: curData.wind?.deg ?? 0,
        condition: curData.weather?.[0]?.main || "Clear",
        description: curData.weather?.[0]?.description || "Clear sky",
        icon: curData.weather?.[0]?.icon || "01d",
        sunrise: curData.sys?.sunrise ?? Math.floor(Date.now() / 1000) - 10000,
        sunset: curData.sys?.sunset ?? Math.floor(Date.now() / 1000) + 10000,
        cloudiness: curData.clouds?.all ?? 0,
        timestamp: Date.now(),
      };

      // Hourly forecast (next 24 hours from 3-hour chunks)
      const hourly: HourlyForecastItem[] = (forecastData.list || []).slice(0, 8).map((item: any) => ({
        dt: item.dt,
        temp: Math.round(item.main.temp * 10) / 10,
        feelsLike: Math.round(item.main.feels_like * 10) / 10,
        condition: item.weather?.[0]?.main || "Clear",
        description: item.weather?.[0]?.description || "",
        icon: item.weather?.[0]?.icon || "01d",
        pop: item.pop ?? 0,
        rainAmount: item.rain?.["3h"] ?? 0,
        windSpeed: item.wind?.speed ?? 0,
      }));

      // Group into 5-day daily forecast
      const daysMap = new Map<string, any[]>();
      for (const item of forecastData.list || []) {
        const dateKey = item.dt_txt ? item.dt_txt.split(" ")[0] : new Date(item.dt * 1000).toISOString().split("T")[0];
        if (!daysMap.has(dateKey)) daysMap.set(dateKey, []);
        daysMap.get(dateKey)!.push(item);
      }

      const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const daily: DailyForecastItem[] = Array.from(daysMap.entries())
        .slice(0, 5)
        .map(([dateKey, items], index) => {
          const dateObj = new Date(dateKey);
          const temps = items.map((i) => i.main.temp);
          const minTemp = Math.min(...temps);
          const maxTemp = Math.max(...temps);
          const middayItem = items[Math.floor(items.length / 2)] || items[0];

          return {
            date: dateKey,
            dayName: index === 0 ? "Today" : daysOfWeek[dateObj.getDay()],
            dt: middayItem.dt,
            minTemp: Math.round(minTemp * 10) / 10,
            maxTemp: Math.round(maxTemp * 10) / 10,
            condition: middayItem.weather?.[0]?.main || "Clear",
            description: middayItem.weather?.[0]?.description || "",
            icon: middayItem.weather?.[0]?.icon || "01d",
            pop: Math.max(...items.map((i) => i.pop ?? 0)),
            humidity: middayItem.main.humidity,
            windSpeed: middayItem.wind?.speed ?? 0,
          };
        });

      return {
        current,
        hourly,
        daily,
        isSimulated: false,
      };
    } catch (error) {
      console.warn("Failed fetching from OpenWeather API, using simulated data:", error);
      return generateSimulatedWeather(resolvedCity, resolvedCountry, lat, lon);
    }
  },
});
