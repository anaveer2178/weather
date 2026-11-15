import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bookmark, BookmarkCheck, ArrowUp, ArrowDown, MapPin, RefreshCw, Users, CheckCircle2 } from "lucide-react";
import type { CurrentWeather } from "../../../convex/weather/types";
import { WeatherIcon } from "./WeatherIcon";
import { useLanguage } from "../../context/LanguageContext";
import { formatLocalizedNumber, translateCondition, localizeLocationName, formatLocalizedDate, formatLocalizedTime, type TranslationKey } from "../../services/i18n";
import { resolveAqiConfig, type AqiStandard } from "../../services/aqiService";

interface CurrentWeatherCardProps {
  weather: CurrentWeather;
  formatTemp: (celsius: number) => string;
  isPinned: boolean;
  onTogglePin: () => void;
  onRefresh?: () => void;
  isSimulated?: boolean;
  onOpenReportModal?: () => void;
  isCalibrated?: boolean;
  stationCode?: string;
  crowdVerifiedCount?: number;
}

function cleanFullAddress(addr: string, lang: string): string {
  if (!addr) return "";
  const parts = addr.split(",").map((p) => p.trim()).filter(Boolean);
  const deduped: string[] = [];
  for (const part of parts) {
    const loc = localizeLocationName(part, lang);
    if (!deduped.some((d) => d.toLowerCase() === loc.toLowerCase())) {
      deduped.push(loc);
    }
  }
  return deduped.join(", ");
}

export const CurrentWeatherCard: React.FC<CurrentWeatherCardProps> = ({
  weather,
  formatTemp,
  isPinned,
  onTogglePin,
  onRefresh,
  isSimulated = false,
  onOpenReportModal,
  isCalibrated = false,
  stationCode,
  crowdVerifiedCount,
}) => {
  const { currentLang, currentMeta, t } = useLanguage();

  const currentDate = formatLocalizedDate(new Date(weather.timestamp), currentLang, currentMeta.bcp47);
  const currentTime = formatLocalizedTime(new Date(weather.timestamp), currentLang, currentMeta.bcp47);

  const translatedCondition = translateCondition(weather.condition, currentLang);
  const translatedDesc = translateCondition(weather.description, currentLang);

  // Guard against inverted Country/City where country name was saved as city
  const isCityCountryName =
    weather.city &&
    weather.country &&
    (weather.city.trim().toLowerCase() === weather.country.trim().toLowerCase() ||
      weather.city.trim().toLowerCase() === "united states" ||
      weather.city.trim().toLowerCase() === "india");

  const effectiveCityName =
    isCityCountryName && (weather.district || weather.county)
      ? (weather.district || weather.county || weather.city)
      : weather.city;

  // Localized location names
  const localizedCity = localizeLocationName(effectiveCityName, currentLang);
  const localizedDistrict = weather.district && weather.district.toLowerCase() !== effectiveCityName.toLowerCase()
    ? localizeLocationName(weather.district, currentLang)
    : "";
  const localizedCounty = weather.county && weather.county.toLowerCase() !== effectiveCityName.toLowerCase() && weather.county.toLowerCase() !== (weather.district || "").toLowerCase()
    ? localizeLocationName(weather.county, currentLang)
    : "";
  const localizedState = weather.state && weather.state.toLowerCase() !== effectiveCityName.toLowerCase()
    ? localizeLocationName(weather.state, currentLang)
    : "";
  const localizedCountry = weather.country && weather.country.toLowerCase() !== effectiveCityName.toLowerCase() && weather.country.toLowerCase() !== (weather.state || "").toLowerCase()
    ? localizeLocationName(weather.country, currentLang)
    : "";

  const isIndia =
    (weather.country || "").toLowerCase().includes("india") ||
    (weather.city || "").toLowerCase().includes("bangalore") ||
    (weather.city || "").toLowerCase().includes("bengaluru") ||
    currentLang === "kn" ||
    (weather.lat >= 6 && weather.lat <= 38 && weather.lon >= 68 && weather.lon <= 98);

  const [standard, setStandard] = useState<AqiStandard>(() => {
    try {
      const saved = localStorage.getItem("aetheria_aqi_standard");
      if (saved === "cpcb" || saved === "us_epa" || saved === "european") return saved;
    } catch {}
    return isIndia ? "cpcb" : "us_epa";
  });

  useEffect(() => {
    const handleSync = (e: any) => {
      if (e.detail && (e.detail === "cpcb" || e.detail === "us_epa" || e.detail === "european")) {
        setStandard(e.detail);
      }
    };
    window.addEventListener("aqi-standard-change", handleSync);
    return () => window.removeEventListener("aqi-standard-change", handleSync);
  }, []);

  const [liveAqi, setLiveAqi] = useState<any>(weather.airQuality);

  useEffect(() => {
    setLiveAqi(weather.airQuality);
  }, [weather.airQuality]);

  useEffect(() => {
    const handleLiveAqi = (e: any) => {
      if (e.detail) setLiveAqi(e.detail);
    };
    window.addEventListener("aetheria:live-aqi-update", handleLiveAqi);
    return () => window.removeEventListener("aetheria:live-aqi-update", handleLiveAqi);
  }, []);

  const aqiConfig = resolveAqiConfig(liveAqi || weather.airQuality, standard);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="glass-panel rounded-3xl p-6 md:p-8 relative overflow-hidden backdrop-blur-xl border border-white/10"
    >
      {/* Top Header: Location, Action Buttons, Date & Time */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 relative z-10">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <MapPin size={20} className="text-sky-400 shrink-0" />
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white m-0">
              {localizedCity}
            </h1>
            {localizedDistrict && localizedDistrict !== localizedCity && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">
                {localizedDistrict}
              </span>
            )}
            {localizedCounty && localizedCounty !== localizedCity && localizedCounty !== localizedDistrict && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 font-medium">
                {localizedCounty}
              </span>
            )}
            {weather.postcode && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono font-medium">
                {formatLocalizedNumber(weather.postcode, currentLang)}
              </span>
            )}
            {localizedState && localizedState !== localizedCity && localizedState !== localizedDistrict && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-slate-300 font-medium">
                {localizedState}
              </span>
            )}
            {localizedCountry && localizedCountry !== localizedCity && localizedCountry !== localizedState && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/80 font-medium">
                {localizedCountry}
              </span>
            )}
          </div>
          {weather.fullAddress && weather.fullAddress !== weather.city && (
            <p className="text-xs text-sky-300/80 font-medium mb-1 line-clamp-1">
              📍 {cleanFullAddress(weather.fullAddress, currentLang)}
            </p>
          )}
          <p className="text-xs md:text-sm text-slate-400 font-medium flex items-center gap-2 flex-wrap">
            <span className="whitespace-nowrap">{currentDate}</span>
            <span className="opacity-40">•</span>
            <span className="text-slate-300 font-mono whitespace-nowrap">{currentTime}</span>
          </p>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          {onOpenReportModal && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onOpenReportModal}
              title={t("reportWeather")}
              className="h-10 px-3.5 flex items-center gap-2 rounded-2xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 text-xs font-semibold whitespace-nowrap shadow-sm transition-all"
            >
              <Users size={15} className="shrink-0" />
              <span>{t("reportWeather")}</span>
            </motion.button>
          )}

          {onRefresh && (
            <motion.button
              whileTap={{ rotate: 180 }}
              onClick={onRefresh}
              title={t("refreshWeather")}
              className="h-10 w-10 flex items-center justify-center rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors border border-white/10"
            >
              <RefreshCw size={17} />
            </motion.button>
          )}

          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={onTogglePin}
            title={isPinned ? t("unpinCity") : t("pinCity")}
            className={`h-10 w-10 flex items-center justify-center rounded-2xl transition-all border ${
              isPinned
                ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                : "bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border-white/10"
            }`}
          >
            {isPinned ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
          </motion.button>
        </div>
      </div>

      {/* Main Temperature & Weather Condition Display */}
      <div className="my-6 flex flex-wrap items-center justify-between gap-4 relative z-10">
        {/* Left Side: Big Temperature + High/Low & Feels Like */}
        <div className="flex items-center gap-4 shrink-0">
          <motion.div
            key={weather.temp}
            initial={{ scale: 0.95, opacity: 0.8 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-6xl sm:text-7xl lg:text-8xl font-light tracking-tighter text-white font-sans shrink-0"
          >
            {formatTemp(weather.temp)}
          </motion.div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-300 whitespace-nowrap">
              <span className="flex items-center text-emerald-400">
                <ArrowUp size={14} className="mr-0.5" />
                {formatTemp(weather.tempMax)}
              </span>
              <span className="text-slate-500">•</span>
              <span className="flex items-center text-sky-400">
                <ArrowDown size={14} className="mr-0.5" />
                {formatTemp(weather.tempMin)}
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium whitespace-nowrap">
              {t("feelsLike")} <span className="text-white font-semibold">{formatTemp(weather.feelsLike)}</span>
            </p>
          </div>
        </div>

        {/* Right Side: Weather Condition Box */}
        <div className="flex items-center gap-3.5 bg-white/5 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 shrink-0 shadow-sm">
          <WeatherIcon condition={weather.condition} iconCode={weather.icon} size={42} />
          <div className="min-w-0">
            <div className="text-base sm:text-lg font-bold text-white capitalize leading-snug whitespace-nowrap">
              {translatedCondition}
            </div>
            <div className="text-xs text-slate-300 font-medium mt-0.5 whitespace-nowrap">
              {translatedDesc && translatedDesc.toLowerCase() !== translatedCondition.toLowerCase()
                ? translatedDesc
                : (weather.cloudiness !== undefined
                    ? `${currentLang === "kn" ? "ಮೋಡದ ಪ್ರಮಾಣ" : "Cloud Cover"}: ${formatLocalizedNumber(weather.cloudiness, currentLang)}%`
                    : "")}
            </div>
          </div>
        </div>
      </div>

      {/* Telemetry Strip: AQI Badge, Sensor Calibration, and Crowd Consensus */}
      <div className="flex items-center gap-2.5 flex-wrap mb-4 relative z-10">
        {/* Live Air Quality Index Badge */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            const el = document.getElementById("air-quality-section");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}
          className={`flex items-center gap-1.5 text-[11px] px-3 py-1 rounded-full border font-semibold shadow-sm transition-all cursor-pointer whitespace-nowrap ${aqiConfig.badgeBg} ${aqiConfig.border}`}
          title={aqiConfig.standardName}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="text-xs">🍃</span>
          <span>
            {standard === "cpcb" ? "CPCB" : standard === "us_epa" ? "EPA" : "EAQI"}: {formatLocalizedNumber(aqiConfig.aqi, currentLang)}
          </span>
          <span className="opacity-60">•</span>
          <span>{t(aqiConfig.categoryKey as TranslationKey)}</span>
        </motion.button>

        {isCalibrated && (
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-300 bg-emerald-500/15 px-3 py-1 rounded-full border border-emerald-500/30 font-medium whitespace-nowrap shadow-sm">
            <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
            <span>{t("groundTruthCalibrated")}</span>
            {stationCode && (
              <span className="opacity-80 font-mono text-[10px] bg-emerald-500/25 px-1.5 py-0.5 rounded ml-1 whitespace-nowrap">
                {stationCode}
              </span>
            )}
          </div>
        )}

        {crowdVerifiedCount !== undefined && crowdVerifiedCount > 0 && (
          <div className="flex items-center gap-1.5 text-[11px] text-indigo-300 bg-indigo-500/15 px-3 py-1 rounded-full border border-indigo-500/30 font-medium whitespace-nowrap shadow-sm">
            <Users size={13} className="text-indigo-400 shrink-0" />
            <span>{formatLocalizedNumber(crowdVerifiedCount, currentLang)} {t("verifiedByUsers")}</span>
          </div>
        )}
      </div>

      {/* Bottom status bar */}
      <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400 relative z-10">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
          <span className="text-slate-300 font-medium">{t("liveSync")}</span>
          {isSimulated && (
            <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px] font-semibold border border-blue-500/30">
              {t("simulatedMode")}
            </span>
          )}
        </div>
        <div>
          {t("updatedJustNow")}
        </div>
      </div>
    </motion.div>
  );
};
