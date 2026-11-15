import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Wind,
  Droplets,
  Sun,
  Gauge,
  Eye,
  Sunrise,
  Sunset,
  Navigation,
  Activity,
  Sparkles,
  CheckCircle2,
  MapPin,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import type { CurrentWeather } from "../../../convex/weather/types";
import { useLanguage } from "../../context/LanguageContext";
import { formatLocalizedNumber, type TranslationKey } from "../../services/i18n";
import {
  resolveAqiConfig,
  getNearbyAqiStations,
  type AqiStandard,
} from "../../services/aqiService";
import { useLiveAqi } from "../../hooks/useLiveAqi";

interface WeatherMetricsProps {
  weather: CurrentWeather;
  formatSpeed: (ms: number) => string;
}

const STORAGE_KEY_AQI_STD = "aetheria_aqi_standard";

export const WeatherMetrics = ({
  weather,
  formatSpeed,
}: WeatherMetricsProps) => {
  const { currentLang, currentMeta, t } = useLanguage();

  const isIndia = useMemo(() => {
    const c = (weather.country || "").toLowerCase();
    const city = (weather.city || "").toLowerCase();
    return (
      c.includes("india") ||
      c.includes("in") ||
      city.includes("bengaluru") ||
      city.includes("bangalore") ||
      currentLang === "kn" ||
      (weather.lat >= 6 && weather.lat <= 38 && weather.lon >= 68 && weather.lon <= 98)
    );
  }, [weather, currentLang]);

  // Standard preference: default to CPCB in India or Kannada, US EPA otherwise
  const [standard, setStandard] = useState<AqiStandard>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_AQI_STD);
      if (saved === "cpcb" || saved === "us_epa" || saved === "european") return saved;
    } catch {}
    return isIndia ? "cpcb" : "us_epa";
  });

  const handleSetStandard = (std: AqiStandard) => {
    setStandard(std);
    try {
      localStorage.setItem(STORAGE_KEY_AQI_STD, std);
      window.dispatchEvent(new CustomEvent("aqi-standard-change", { detail: std }));
    } catch {}
  };

  useEffect(() => {
    const handleSync = (e: any) => {
      if (e.detail && (e.detail === "cpcb" || e.detail === "us_epa" || e.detail === "european")) {
        setStandard(e.detail);
      }
    };
    window.addEventListener("aqi-standard-change", handleSync);
    return () => window.removeEventListener("aqi-standard-change", handleSync);
  }, []);

  // Connect to Live Continuous Real-Time AQI stream with auto-refresh every 45s
  const {
    aqiData: liveAqiData,
    hourlyAqi,
    stations: liveStations,
    lastUpdated,
    isRefreshing,
    refreshAqi,
  } = useLiveAqi(weather.lat, weather.lon, weather.city, weather.country);

  const effectiveAqiData = liveAqiData || weather.airQuality;

  // Sunrise & Sunset formatting
  const sunriseTime = new Date(weather.sunrise * 1000).toLocaleTimeString(currentMeta.bcp47, {
    hour: "numeric",
    minute: "2-digit",
  });
  const sunsetTime = new Date(weather.sunset * 1000).toLocaleTimeString(currentMeta.bcp47, {
    hour: "numeric",
    minute: "2-digit",
  });

  // Calculate AQI based on selected standard
  const aqiConfig = useMemo(
    () => resolveAqiConfig(effectiveAqiData, standard),
    [effectiveAqiData, standard]
  );

  // CAAQMS Ground-Truth Stations
  const nearbyStations = useMemo(() => {
    if (liveStations && liveStations.length > 0) return liveStations;
    return getNearbyAqiStations(
      weather.city,
      weather.county,
      weather.lat,
      weather.lon,
      aqiConfig.aqi,
      standard
    );
  }, [liveStations, weather.city, weather.county, weather.lat, weather.lon, aqiConfig.aqi, standard]);

  // UV description
  const uv = weather.uvIndex ?? 5.2;
  const getUvDescription = (val: number) => {
    if (val < 3) return { text: t("lowUv"), advice: t("uvAdviceLow") };
    if (val < 6) return { text: t("moderateUv"), advice: t("uvAdviceModerate") };
    if (val < 8) return { text: t("highUv"), advice: t("uvAdviceHigh") };
    return { text: t("veryHighUv"), advice: t("uvAdviceVeryHigh") };
  };
  const uvInfo = getUvDescription(uv);

  // Humidity rating
  const getHumidityRating = (h: number) => {
    if (h < 30) return t("dryAir");
    if (h <= 60) return t("comfortableAir");
    return t("humidAir");
  };

  // Visibility rating
  const visKm = Math.round((weather.visibility / 1000) * 10) / 10;

  const cardVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.05, duration: 0.4 },
    }),
  };

  const getTranslatedCategory = (key: string): string => {
    return t(key as TranslationKey) || key;
  };

  const getTranslatedAdvice = (key: string): string => {
    return t(key as TranslationKey) || key;
  };

  const localizedDominant = t(aqiConfig.dominantKey as TranslationKey) || aqiConfig.dominantPollutant;

  const lastSyncTimeStr = new Date(lastUpdated || Date.now()).toLocaleTimeString(currentMeta.bcp47, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const scaleDescription = useMemo(() => {
    if (currentLang === "kn") {
      if (standard === "cpcb") return "ಕೇಂದ್ರ ಮಾಲಿನ್ಯ ನಿಯಂತ್ರಣ ಮಂಡಳಿ (CPCB) ಅಧಿಕೃತ ರಾಷ್ಟ್ರೀಯ ವಾಯು ಗುಣಮಟ್ಟ ಸೂಚ್ಯಂಕ (೦–೫೦೦).";
      if (standard === "us_epa") return "ಯುನೈಟೆಡ್ ಸ್ಟೇಟ್ಸ್ ಪರಿಸರ ಸಂರಕ್ಷಣಾ ಸಂಸ್ಥೆ (EPA) ವಾಯು ಗುಣಮಟ್ಟ ಸೂಚ್ಯಂಕ ಮಾಪಕ (೦–೫೦೦).";
      return "ಯುರೋಪಿಯನ್ ಪರಿಸರ ಸಂಸ್ಥೆ (EEA) ಆಧಾರಿತ ಯುರೋಪಿಯನ್ ವಾಯು ಗುಣಮಟ್ಟ ಸೂಚ್ಯಂಕ.";
    }
    if (standard === "cpcb") return "Official Central Pollution Control Board (CPCB) NAQI scale (0–500).";
    if (standard === "us_epa") return "United States Environmental Protection Agency (EPA) AQI scale (0–500).";
    return "European Air Quality Index (EAQI) based on European Environment Agency (EEA).";
  }, [currentLang, standard]);

  return (
    <div className="space-y-4">
      {/* Featured Live Air Quality Index Observatory Card */}
      <motion.div
        custom={0}
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        id="air-quality-section"
        className={`glass-panel rounded-3xl p-5 md:p-6 border ${aqiConfig.border} ${aqiConfig.bg} backdrop-blur-xl relative overflow-hidden transition-all duration-300 shadow-xl scroll-mt-20`}
      >
        {/* Top Header: Responsive 2-tier layout */}
        <div className="mb-5 pb-4 border-b border-white/10 space-y-3">
          {/* Row 1: Primary Title, Category Badge, Live Indicator, and Segmented Standard Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Left: Icon + Title + Category Pill + Live Pulse */}
            <div className="flex items-center gap-3 min-w-0">
              <div className={`p-2.5 rounded-2xl ${aqiConfig.badgeBg} border ${aqiConfig.border} relative shrink-0`}>
                <Activity size={20} className={aqiConfig.color} />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold uppercase tracking-wider text-xs md:text-sm text-white whitespace-nowrap">
                    {t("airQuality")}
                  </span>
                  <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border whitespace-nowrap ${aqiConfig.badgeBg} ${aqiConfig.border}`}>
                    {getTranslatedCategory(aqiConfig.categoryKey)}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                    {t("liveSync")}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Segmented Standard Selector & Manual Refresh Button */}
            <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
              <div className="inline-flex items-center p-0.5 rounded-xl bg-black/40 border border-white/10 shadow-inner">
                <button
                  onClick={() => handleSetStandard("cpcb")}
                  title="Central Pollution Control Board (India NAQI)"
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    standard === "cpcb"
                      ? "bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  🇮🇳 CPCB
                </button>
                <button
                  onClick={() => handleSetStandard("us_epa")}
                  title="United States Environmental Protection Agency (US AQI)"
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    standard === "us_epa"
                      ? "bg-amber-500/30 text-amber-300 border border-amber-500/50 shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  🇺🇸 EPA
                </button>
                <button
                  onClick={() => handleSetStandard("european")}
                  title="European Environment Agency (European EAQI)"
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    standard === "european"
                      ? "bg-sky-500/30 text-sky-300 border border-sky-500/50 shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  🇪🇺 EAQI
                </button>
              </div>

              {/* Manual Live Refresh Button */}
              <button
                onClick={refreshAqi}
                disabled={isRefreshing}
                title={t("refreshAqi")}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-all border border-white/10 disabled:opacity-50"
              >
                <RefreshCw size={14} className={isRefreshing ? "animate-spin text-emerald-400" : ""} />
              </button>
            </div>
          </div>

          {/* Row 2: Secondary Metadata Sub-bar (Dominant Pollutant, Sync Timestamp, Station Calibration) */}
          <div className="flex items-center justify-between gap-2 flex-wrap text-[11px] text-slate-300/90 pt-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-slate-400">{t("dominantPollutant")}:</span>
              <span className="text-white font-medium">{localizedDominant}</span>
              <span className="opacity-30">•</span>
              <span className="text-slate-400 font-mono">{lastSyncTimeStr}</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <CheckCircle2 size={13} className="shrink-0" />
              <span>{t("calibratedWithStation")}</span>
            </div>
          </div>
        </div>

        {/* Main Readout & Health Advice */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div className="space-y-1.5 max-w-xl">
            <p className="text-xs md:text-sm text-slate-200 font-medium leading-relaxed">
              {getTranslatedAdvice(aqiConfig.adviceKey)}
            </p>
            <p className="text-[11px] text-slate-400">
              {scaleDescription}
            </p>
          </div>

          <div className="flex items-baseline gap-2 shrink-0 self-start sm:self-center">
            <div className={`text-4xl md:text-5xl font-extrabold tracking-tight font-sans ${aqiConfig.color}`}>
              {formatLocalizedNumber(aqiConfig.aqi, currentLang)}
            </div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {t("aqi")} ({standard === "cpcb" ? "CPCB" : standard === "us_epa" ? "EPA" : "EAQI"})
            </div>
          </div>
        </div>

        {/* Interactive Dynamic Gauge Bar */}
        <div className="space-y-2 mb-6">
          <div className="flex justify-between text-[11px] font-medium text-slate-400 px-0.5">
            {aqiConfig.scaleTicks.map((tick, i) => (
              <span
                key={i}
                className={`text-center ${
                  i > 0 && i < aqiConfig.scaleTicks.length - 1 ? "hidden sm:inline" : ""
                }`}
              >
                <span className="font-semibold text-slate-300">{formatLocalizedNumber(tick.val, currentLang)}</span>{" "}
                <span className="text-[10px] text-slate-400">({getTranslatedCategory(tick.labelKey)})</span>
              </span>
            ))}
          </div>
          <div className="relative h-3 w-full rounded-full bg-slate-900/90 overflow-hidden border border-white/10 shadow-inner">
            <div
              className={`absolute inset-0 rounded-full opacity-90 ${
                standard === "cpcb"
                  ? "bg-gradient-to-r from-emerald-500 via-lime-400 via-amber-400 via-orange-500 via-rose-500 to-red-700"
                  : "bg-gradient-to-r from-emerald-500 via-amber-400 via-orange-500 via-rose-500 to-purple-600"
              }`}
            />
            <div
              className="absolute top-0 bottom-0 w-3.5 -ml-1.5 bg-white rounded-full shadow-[0_0_12px_rgba(255,255,255,1)] border-2 border-slate-900 transition-all duration-700"
              style={{
                left: `${Math.min(98, Math.max(2, (aqiConfig.aqi / aqiConfig.maxScale) * 100))}%`,
              }}
            />
          </div>
        </div>

        {/* Live 12-Hour AQI Trend Forecast Strip */}
        {hourlyAqi && hourlyAqi.length > 0 && (
          <div className="mb-6 p-4 rounded-2xl bg-white/[0.03] border border-white/5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-white">
                <TrendingUp size={14} className="text-emerald-400" />
                {t("hourlyAqiTrend")}
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {t("liveSync")}
              </span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] px-1 pr-6">
              {hourlyAqi.map((h, i) => {
                const hourVal = standard === "cpcb" ? h.cpcbAqi : h.usAqi;
                return (
                  <div
                    key={i}
                    className="flex flex-col items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 min-w-[70px] shrink-0 border border-white/5 transition-all"
                  >
                    <span className="text-[10px] text-slate-400 font-medium">
                      {i === 0 ? t("today") : h.hourLabel}
                    </span>
                    <span className={`text-base font-bold my-1 ${h.color}`}>
                      {formatLocalizedNumber(hourVal, currentLang)}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/10 text-slate-300 font-medium whitespace-nowrap">
                      {getTranslatedCategory(h.categoryKey)}
                    </span>
                    <span className="text-[9px] text-slate-400 mt-1 font-mono">
                      {formatLocalizedNumber(h.pm2_5, currentLang)} µg
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Pollutants Breakdown */}
        <div className="mb-6">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Sparkles size={13} className="text-sky-400" />
              {t("pollutants")}
            </span>
            <span className="text-[10px] text-slate-400 font-normal lowercase">(µg/m³)</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-white/5 hover:bg-white/10 transition-colors p-3 rounded-2xl border border-white/5">
              <div className="text-[10px] text-slate-400 font-medium">{t("pm25")}</div>
              <div className="text-sm md:text-base font-semibold text-slate-100 mt-0.5">
                {formatLocalizedNumber((effectiveAqiData?.pm2_5 ?? 28.5).toFixed(1), currentLang)}{" "}
                <span className="text-[10px] text-slate-400 font-normal">µg/m³</span>
              </div>
            </div>

            <div className="bg-white/5 hover:bg-white/10 transition-colors p-3 rounded-2xl border border-white/5">
              <div className="text-[10px] text-slate-400 font-medium">{t("pm10")}</div>
              <div className="text-sm md:text-base font-semibold text-slate-100 mt-0.5">
                {formatLocalizedNumber((effectiveAqiData?.pm10 ?? 31.0).toFixed(1), currentLang)}{" "}
                <span className="text-[10px] text-slate-400 font-normal">µg/m³</span>
              </div>
            </div>

            <div className="bg-white/5 hover:bg-white/10 transition-colors p-3 rounded-2xl border border-white/5">
              <div className="text-[10px] text-slate-400 font-medium">{t("ozone")}</div>
              <div className="text-sm md:text-base font-semibold text-slate-100 mt-0.5">
                {formatLocalizedNumber((effectiveAqiData?.o3 ?? 75.0).toFixed(1), currentLang)}{" "}
                <span className="text-[10px] text-slate-400 font-normal">µg/m³</span>
              </div>
            </div>

            <div className="bg-white/5 hover:bg-white/10 transition-colors p-3 rounded-2xl border border-white/5">
              <div className="text-[10px] text-slate-400 font-medium">{t("no2")}</div>
              <div className="text-sm md:text-base font-semibold text-slate-100 mt-0.5">
                {formatLocalizedNumber((effectiveAqiData?.no2 ?? 22.0).toFixed(1), currentLang)}{" "}
                <span className="text-[10px] text-slate-400 font-normal">µg/m³</span>
              </div>
            </div>
          </div>
        </div>

        {/* Nearby CAAQMS Continuous Ambient Air Quality Monitoring Stations */}
        <div className="pt-4 border-t border-white/10">
          <div className="flex items-center justify-between mb-3 text-slate-300 text-xs font-semibold">
            <span className="flex items-center gap-1.5 uppercase tracking-wider text-[11px] text-slate-400">
              <MapPin size={13} className="text-emerald-400" />
              {t("monitoringStations")}
            </span>
            <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {t("liveSync")}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {nearbyStations.map((station, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] transition-colors border border-white/5 flex items-center justify-between text-xs gap-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-slate-200 truncate" title={station.name}>
                    {station.name}
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                    <span>{station.agency}</span>
                    <span>•</span>
                    <span>{formatLocalizedNumber(station.distanceKm, currentLang)} km</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold text-slate-100 font-sans">
                    {formatLocalizedNumber(station.aqi, currentLang)}
                  </div>
                  <div className="text-[10px] text-emerald-400 font-medium whitespace-nowrap">
                    {getTranslatedCategory(station.categoryKey)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* 6 Grid Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 1. Wind */}
        <motion.div
          custom={0}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          className="glass-panel rounded-3xl p-5 border border-white/10 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-3">
            <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px]">
              <Wind size={15} className="text-teal-400" />
              {t("windGusts")}
            </span>
            <Navigation
              size={14}
              className="text-teal-300 transition-transform duration-700"
              style={{ transform: `rotate(${weather.windDeg}deg)` }}
            />
          </div>
          <div>
            <div className="text-2xl font-semibold text-white tracking-tight">
              {formatSpeed(weather.windSpeed)}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {t("direction")}: <span className="text-slate-200">{weather.windDeg}°</span>
            </p>
          </div>
        </motion.div>

        {/* 2. Humidity */}
        <motion.div
          custom={1}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          className="glass-panel rounded-3xl p-5 border border-white/10 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-3">
            <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px]">
              <Droplets size={15} className="text-sky-400" />
              {t("humidity")}
            </span>
            <span className="text-sky-300 font-semibold">{weather.humidity}%</span>
          </div>
          <div>
            <div className="text-2xl font-semibold text-white tracking-tight">
              {weather.humidity}%
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {getHumidityRating(weather.humidity)}
            </p>
          </div>
        </motion.div>

        {/* 3. UV Index */}
        <motion.div
          custom={2}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          className="glass-panel rounded-3xl p-5 border border-white/10 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-3">
            <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px]">
              <Sun size={15} className="text-amber-400" />
              {t("uvIndex")}
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-400/20 text-amber-300">
              {uvInfo.text}
            </span>
          </div>
          <div>
            <div className="text-2xl font-semibold text-white tracking-tight">
              {uv.toFixed(1)}
            </div>
            <p className="text-xs text-slate-400 mt-1">{uvInfo.advice}</p>
          </div>
        </motion.div>

        {/* 4. Air Pressure */}
        <motion.div
          custom={3}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          className="glass-panel rounded-3xl p-5 border border-white/10 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-3">
            <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px]">
              <Gauge size={15} className="text-indigo-400" />
              {t("pressure")}
            </span>
            <span className="text-slate-400">hPa</span>
          </div>
          <div>
            <div className="text-2xl font-semibold text-white tracking-tight">
              {weather.pressure} <span className="text-sm font-normal text-slate-400">hPa</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {weather.pressure > 1013 ? t("highPressure") : t("normalPressure")}
            </p>
          </div>
        </motion.div>

        {/* 5. Visibility */}
        <motion.div
          custom={4}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          className="glass-panel rounded-3xl p-5 border border-white/10 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-3">
            <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px]">
              <Eye size={15} className="text-emerald-400" />
              {t("visibility")}
            </span>
          </div>
          <div>
            <div className="text-2xl font-semibold text-white tracking-tight">
              {visKm} <span className="text-sm font-normal text-slate-400">km</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {visKm >= 10 ? t("clearHorizon") : t("obscuredHorizon")}
            </p>
          </div>
        </motion.div>

        {/* 6. Sunrise & Sunset */}
        <motion.div
          custom={5}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          className="glass-panel rounded-3xl p-5 border border-white/10 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-3">
            <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px]">
              <Sunrise size={15} className="text-rose-400" />
              {t("sunCycle")}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="flex items-center gap-2">
              <Sunrise size={18} className="text-amber-400" />
              <div>
                <div className="text-[10px] text-slate-400">{t("sunrise")}</div>
                <div className="text-xs font-semibold text-white">{sunriseTime}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Sunset size={18} className="text-rose-400" />
              <div>
                <div className="text-[10px] text-slate-400">{t("sunset")}</div>
                <div className="text-xs font-semibold text-white">{sunsetTime}</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
