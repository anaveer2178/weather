import { useState, useEffect, useCallback } from "react";
import { reverseGeocodeLocation } from "../services/weatherApi";

export interface GeolocationState {
  lat: number;
  lon: number;
  city: string;
  country: string;
  county?: string;
  state?: string;
  district?: string;
  fullAddress?: string;
  loading: boolean;
  error: string | null;
}

// Default fallback location (New York City)
const DEFAULT_LOCATION = {
  lat: 40.7128,
  lon: -74.006,
  city: "New York",
  county: "New York County",
  state: "New York",
  country: "United States",
  fullAddress: "New York, New York County, NY, United States",
};

export function useGeolocation() {
  const [location, setLocation] = useState<GeolocationState>({
    ...DEFAULT_LOCATION,
    loading: false,
    error: null,
  });

  const requestLocation = useCallback(async (): Promise<GeolocationState | null> => {
    if (!navigator.geolocation) {
      const errState = {
        ...DEFAULT_LOCATION,
        loading: false,
        error: "Geolocation is not supported by your browser.",
      };
      setLocation(errState);
      return errState;
    }

    setLocation((prev) => ({ ...prev, loading: true, error: null }));

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;

          try {
            // Reverse geocode to get real City, County, State, Country, Address
            const geoInfo = await reverseGeocodeLocation(lat, lon);
            const newState: GeolocationState = {
              lat,
              lon,
              city: geoInfo.city || "Current Location",
              county: geoInfo.county,
              state: geoInfo.state,
              district: geoInfo.district,
              country: geoInfo.country,
              fullAddress: geoInfo.fullAddress,
              loading: false,
              error: null,
            };
            setLocation(newState);
            resolve(newState);
          } catch {
            const fallbackState: GeolocationState = {
              lat,
              lon,
              city: "Current Location",
              country: "",
              loading: false,
              error: null,
            };
            setLocation(fallbackState);
            resolve(fallbackState);
          }
        },
        (err) => {
          console.warn("Geolocation permission or error:", err.message);
          let userMsg = "Location access was denied or unavailable.";
          if (err.code === 1) {
            userMsg = "Location permission denied. You can search any city or county above.";
          } else if (err.code === 2) {
            userMsg = "Position unavailable. Please search for your city or county.";
          } else if (err.code === 3) {
            userMsg = "Location request timed out. Please try searching your location.";
          }

          setLocation((prev) => ({
            ...prev,
            loading: false,
            error: userMsg,
          }));
          resolve(null);
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    });
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  return { ...location, requestLocation, setLocation };
}
