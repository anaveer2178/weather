// src/hooks/useLiveAqi.ts
import { useState, useEffect, useCallback, useRef } from "react";
import { fetchLiveAqiData, type LiveAqiPayload } from "../services/liveAqiService";

export function useLiveAqi(lat: number, lon: number, city: string, country: string) {
  const [data, setData] = useState<LiveAqiPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const isMounted = useRef(true);

  const fetchAqi = useCallback(
    async (isManual = false) => {
      if (isManual) setIsRefreshing(true);
      setError(null);
      try {
        const payload = await fetchLiveAqiData(lat, lon, city, country);
        if (isMounted.current) {
          setData(payload);
          // Broadcast live update so any other listening component updates immediately
          try {
            window.dispatchEvent(
              new CustomEvent("aetheria:live-aqi-update", { detail: payload.current })
            );
          } catch {}
        }
      } catch (err: any) {
        if (isMounted.current) {
          setError(err?.message || "Failed to load live AQI telemetry");
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [lat, lon, city, country]
  );

  // Initial fetch and on coordinates change
  useEffect(() => {
    isMounted.current = true;
    fetchAqi(false);

    // Auto-refresh interval: poll every 45 seconds for true live continuous air quality telemetry
    const timer = setInterval(() => {
      fetchAqi(false);
    }, 45000);

    return () => {
      isMounted.current = false;
      clearInterval(timer);
    };
  }, [fetchAqi]);

  const refreshAqi = useCallback(() => {
    return fetchAqi(true);
  }, [fetchAqi]);

  return {
    aqiData: data?.current,
    hourlyAqi: data?.hourlyAqi || [],
    stations: data?.stations || [],
    lastUpdated: data?.lastUpdated,
    isLive: data?.isLive ?? true,
    stationName: data?.stationName,
    loading,
    isRefreshing,
    error,
    refreshAqi,
  };
}
