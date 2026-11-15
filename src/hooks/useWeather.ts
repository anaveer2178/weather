import { useState, useEffect, useCallback } from "react";
import type {
  WeatherDataPayload,
  GeoLocationResult,
} from "../../convex/weather/types";
import {
  celsiusToFahrenheit,
  msToMph,
  msToKmh,
} from "../../convex/lib/utils";
import { fetchLiveWeatherData } from "../services/weatherApi";
import { formatLocalizedNumber } from "../services/i18n";

export type UnitSystem = "metric" | "imperial";

export interface PinnedCity {
  id: string;
  name: string;
  country: string;
  county?: string;
  state?: string;
  district?: string;
  fullAddress?: string;
  lat: number;
  lon: number;
}

const STORAGE_KEY_PINNED = "weather_pinned_cities_v3";
const STORAGE_KEY_RECENT = "weather_recent_searches_v3";
const STORAGE_KEY_UNIT = "weather_unit_pref_v3";
const STORAGE_KEY_LAST_LOC = "weather_last_location_v3";

const DEFAULT_PINNED: PinnedCity[] = [
  { id: "1", name: "New York", county: "New York County", state: "New York", country: "United States", fullAddress: "New York, NY, United States", lat: 40.7128, lon: -74.006 },
  { id: "2", name: "London", county: "Greater London", state: "England", country: "United Kingdom", fullAddress: "London, England, United Kingdom", lat: 51.5074, lon: -0.1278 },
  { id: "3", name: "Tokyo", county: "Kanto", state: "Tokyo", country: "Japan", fullAddress: "Tokyo, Japan", lat: 35.6762, lon: 139.6503 },
  { id: "4", name: "Orange County", county: "Orange County", state: "California", country: "United States", fullAddress: "Orange County, CA, United States", lat: 33.7175, lon: -117.8311 },
];

export function useWeather() {
  const [unit, setUnit] = useState<UnitSystem>(() => {
    return (localStorage.getItem(STORAGE_KEY_UNIT) as UnitSystem) || "metric";
  });

  const [currentCoords, setCurrentCoords] = useState<{
    lat: number;
    lon: number;
    city: string;
    country: string;
    county?: string;
    state?: string;
    district?: string;
    postcode?: string;
    fullAddress?: string;
  }>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LAST_LOC);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Sanity clean: check for Frankenstein corrupted state
        const c = (parsed.country || "").toLowerCase();
        const s = (parsed.state || "").toLowerCase();
        const d = (parsed.district || "").toLowerCase();
        if (c.includes("united states") && (s.includes("karnataka") || d.includes("bengaluru"))) {
          return {
            lat: 12.9716,
            lon: 77.5946,
            city: "Bengaluru",
            district: "Bengaluru",
            state: "Karnataka",
            country: "India",
            fullAddress: "Bengaluru, Karnataka, India",
          };
        }
        return parsed;
      }
    } catch {}
    return {
      lat: 12.9716,
      lon: 77.5946,
      city: "Bengaluru",
      district: "Bengaluru",
      state: "Karnataka",
      country: "India",
      fullAddress: "Bengaluru, Karnataka, India",
    };
  });

  const [weatherData, setWeatherData] = useState<WeatherDataPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [pinnedCities, setPinnedCities] = useState<PinnedCity[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PINNED);
      return stored ? JSON.parse(stored) : DEFAULT_PINNED;
    } catch {
      return DEFAULT_PINNED;
    }
  });

  const [recentSearches, setRecentSearches] = useState<GeoLocationResult[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_RECENT);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Persist pinned cities
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PINNED, JSON.stringify(pinnedCities));
    } catch (e) {
      console.error(e);
    }
  }, [pinnedCities]);

  // Persist unit preference
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_UNIT, unit);
    } catch (e) {
      console.error(e);
    }
  }, [unit]);

  // Fetch real live weather data for given coordinates
  const fetchWeatherForCoords = useCallback(
    async (
      lat: number,
      lon: number,
      cityName?: string,
      country?: string,
      county?: string,
      state?: string,
      district?: string,
      postcode?: string,
      fullAddress?: string
    ) => {
      setLoading(true);
      setError(null);

      try {
        // Only inherit fields if fetching for the same coordinates (~5km threshold)
        const isSameCoords =
          Math.abs(currentCoords.lat - lat) < 0.05 && Math.abs(currentCoords.lon - lon) < 0.05;

        const effectiveCity = cityName || (isSameCoords ? currentCoords.city : "Current Location");
        const effectiveCountry = country !== undefined ? country : (isSameCoords ? currentCoords.country : "");
        const effectiveCounty = county !== undefined ? county : (isSameCoords ? currentCoords.county : undefined);
        const effectiveState = state !== undefined ? state : (isSameCoords ? currentCoords.state : undefined);
        const effectiveDistrict = district !== undefined ? district : (isSameCoords ? currentCoords.district : undefined);
        const effectivePostcode = postcode !== undefined ? postcode : (isSameCoords ? currentCoords.postcode : undefined);
        const effectiveFullAddress = fullAddress !== undefined ? fullAddress : (isSameCoords ? currentCoords.fullAddress : undefined);

        const data = await fetchLiveWeatherData(
          lat,
          lon,
          effectiveCity,
          effectiveCountry,
          effectiveCounty,
          effectiveState,
          effectiveDistrict,
          effectivePostcode,
          effectiveFullAddress
        );

        setWeatherData(data);

        const newLoc = {
          lat,
          lon,
          city: cityName || data.current.city,
          country: country !== undefined ? country : data.current.country,
          county: county !== undefined ? county : data.current.county,
          state: state !== undefined ? state : data.current.state,
          district: district !== undefined ? district : data.current.district,
          postcode: postcode !== undefined ? postcode : data.current.postcode,
          fullAddress: fullAddress !== undefined ? fullAddress : data.current.fullAddress,
        };

        setCurrentCoords(newLoc);
        try {
          localStorage.setItem(STORAGE_KEY_LAST_LOC, JSON.stringify(newLoc));
        } catch {}
      } catch (err: any) {
        setError(err.message || "Failed to load live forecast data");
      } finally {
        setLoading(false);
      }
    },
    [currentCoords.city, currentCoords.country, currentCoords.county, currentCoords.state, currentCoords.district, currentCoords.postcode, currentCoords.fullAddress, currentCoords.lat, currentCoords.lon]
  );

  // Initial load
  useEffect(() => {
    fetchWeatherForCoords(
      currentCoords.lat,
      currentCoords.lon,
      currentCoords.city,
      currentCoords.country,
      currentCoords.county,
      currentCoords.state,
      currentCoords.district,
      currentCoords.postcode,
      currentCoords.fullAddress
    );
  }, []);

  // Select a new location
  const selectLocation = useCallback(
    (loc: GeoLocationResult) => {
      setCurrentCoords({
        lat: loc.lat,
        lon: loc.lon,
        city: loc.name,
        country: loc.country,
        county: loc.county,
        state: loc.state,
        district: loc.district,
        postcode: loc.postcode,
        fullAddress: loc.fullAddress,
      });

      // Add to recent searches
      setRecentSearches((prev) => {
        const filtered = prev.filter(
          (p) =>
            Math.abs(p.lat - loc.lat) > 0.01 ||
            Math.abs(p.lon - loc.lon) > 0.01
        );
        const updated = [loc, ...filtered].slice(0, 10);
        try {
          localStorage.setItem(STORAGE_KEY_RECENT, JSON.stringify(updated));
        } catch {}
        return updated;
      });

      fetchWeatherForCoords(
        loc.lat,
        loc.lon,
        loc.name,
        loc.country,
        loc.county,
        loc.state,
        loc.district,
        loc.postcode,
        loc.fullAddress
      );
    },
    [fetchWeatherForCoords]
  );

  // Toggle pinning a location
  const togglePin = useCallback(
    (
      city: string,
      country: string,
      lat: number,
      lon: number,
      county?: string,
      state?: string,
      fullAddress?: string
    ) => {
      setPinnedCities((prev) => {
        const exists = prev.some(
          (p) => Math.abs(p.lat - lat) < 0.02 && Math.abs(p.lon - lon) < 0.02
        );
        if (exists) {
          return prev.filter(
            (p) => Math.abs(p.lat - lat) >= 0.02 || Math.abs(p.lon - lon) >= 0.02
          );
        } else {
          return [
            ...prev,
            {
              id: `${Date.now()}`,
              name: city,
              country,
              county,
              state,
              fullAddress,
              lat,
              lon,
            },
          ];
        }
      });
    },
    []
  );

  const isCurrentPinned = pinnedCities.some(
    (p) =>
      Math.abs(p.lat - currentCoords.lat) < 0.02 &&
      Math.abs(p.lon - currentCoords.lon) < 0.02
  );

  // Unit conversion helper for UI with native locale numbers
  const formatTemp = (celsius: number, lang?: string): string => {
    const val = unit === "imperial" ? Math.round(celsiusToFahrenheit(celsius)) : Math.round(celsius);
    const unitSymbol = unit === "imperial" ? "°F" : "°C";
    if (lang) {
      return `${formatLocalizedNumber(val, lang)}${unitSymbol}`;
    }
    return `${val}${unitSymbol}`;
  };

  const formatSpeed = (ms: number, lang?: string): string => {
    const val = unit === "imperial" ? msToMph(ms) : msToKmh(ms);
    const unitStr = unit === "imperial" ? "mph" : "km/h";
    if (lang) {
      return `${formatLocalizedNumber(val, lang)} ${unitStr}`;
    }
    return `${val} ${unitStr}`;
  };

  return {
    weatherData,
    loading,
    error,
    currentCoords,
    unit,
    setUnit,
    pinnedCities,
    recentSearches,
    selectLocation,
    fetchWeatherForCoords,
    togglePin,
    isCurrentPinned,
    formatTemp,
    formatSpeed,
  };
}
