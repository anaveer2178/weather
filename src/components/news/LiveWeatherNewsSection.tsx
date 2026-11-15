import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Radio,
  Volume2,
  VolumeX,
  Play,
  Square,
  ShieldAlert,
  Wind,
  Thermometer,
  CloudRain,
  Gauge,
  Car,
  CheckCircle,
  Copy,
  Check,
  Search,
  ExternalLink,
  Flame,
  Snowflake,
  Compass,
} from "lucide-react";
import type { CurrentWeather } from "../../../convex/weather/types";
import {
  generateLocationNewsReport,
  getLocalizedNewsArticles,
  audioBroadcast,
  type WeatherNewsArticle,
} from "../../services/weatherNewsService";
import { WeatherArticleModal } from "./WeatherArticleModal";
import { useLanguage } from "../../context/LanguageContext";

interface LiveWeatherNewsSectionProps {
  weather: CurrentWeather;
  unit: "metric" | "imperial";
}

export const LiveWeatherNewsSection: React.FC<LiveWeatherNewsSectionProps> = ({
  weather,
  unit,
}) => {
  const { currentLang, currentMeta, t } = useLanguage();

  const report = useMemo(
    () => generateLocationNewsReport(weather, unit, currentLang),
    [weather, unit, currentLang]
  );

  const [selectedArticle, setSelectedArticle] = useState<WeatherNewsArticle | null>(null);
  const [newsFilter, setNewsFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [copied, setCopied] = useState(false);

  // Audio broadcast state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      audioBroadcast.stop();
    };
  }, []);

  const handleToggleAudio = () => {
    if (isPlayingAudio) {
      audioBroadcast.stop();
      setIsPlayingAudio(false);
    } else {
      setAudioError(null);
      audioBroadcast.speak(
        report.fullScriptText,
        () => setIsPlayingAudio(true),
        () => setIsPlayingAudio(false),
        (err) => {
          setIsPlayingAudio(false);
          setAudioError(typeof err === "string" ? err : "Speech synthesis error.");
        },
        currentMeta.bcp47,
        report.phoneticScriptText
      );
    }
  };

  const handleCopyReport = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(
        `${report.headline}\nBulletin Code: ${report.bulletinCode}\nTimestamp: ${report.publishedTime}\n\n${report.situationSummary}\n\nTravel Advisory: ${report.travelAdvisory}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Location-specific, genuine weather news articles
  const localizedArticles = useMemo(
    () => getLocalizedNewsArticles(currentLang, weather, unit),
    [currentLang, weather, unit]
  );

  const filteredNews = localizedArticles.filter((item) => {
    const matchesCategory = newsFilter === "all" || item.category === newsFilter;
    const matchesSearch =
      !searchQuery ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.region.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const ratingColor =
    report.outdoorSafetyRating === "Hazardous"
      ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
      : report.outdoorSafetyRating === "Moderate Caution"
      ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
      : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";

  return (
    <div className="flex flex-col gap-6">
      {/* SECTION 1: Local Synoptic Live Broadcast Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-panel rounded-3xl p-6 md:p-8 backdrop-blur-xl border border-white/10 relative overflow-hidden"
      >
        {/* Background glow badge */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header of the Bulletin */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/10 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-lg shadow-rose-500/10">
              <Radio size={22} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
                  {t("newsDeskTitle")}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-slate-300 font-mono">
                  {report.bulletinCode}
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white mt-0.5">
                {report.headline}
              </h2>
            </div>
          </div>

          {/* Action buttons: Speech Audio & Copy */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={handleToggleAudio}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all border shadow-lg ${
                isPlayingAudio
                  ? "bg-rose-500 text-white border-rose-400 animate-pulse"
                  : "bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border-sky-500/30"
              }`}
            >
              {isPlayingAudio ? (
                <>
                  <Square size={14} className="fill-current" />
                  <span>{t("stopBroadcast")}</span>
                </>
              ) : (
                <>
                  <Play size={14} className="fill-current" />
                  <span>{t("listenAudio")}</span>
                </>
              )}
            </button>

            <button
              onClick={handleCopyReport}
              title={t("copySummary")}
              className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors border border-white/5"
            >
              {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
            </button>
          </div>
        </div>

        {/* Audio Waveform Animation if playing */}
        {isPlayingAudio && (
          <div className="my-4 px-4 py-3 rounded-2xl bg-rose-950/30 border border-rose-500/30 flex items-center justify-between text-xs text-rose-200">
            <div className="flex items-center gap-3">
              <div className="flex items-end gap-1 h-5">
                {[40, 80, 50, 100, 70, 90, 60, 30].map((h, i) => (
                  <span
                    key={i}
                    className="w-1 bg-rose-400 rounded-full animate-bounce"
                    style={{
                      height: `${h}%`,
                      animationDelay: `${i * 0.15}s`,
                    }}
                  />
                ))}
              </div>
              <span>
                {currentMeta.flag} {t("liveAudioBroadcasting")} ({currentMeta.name}) -{" "}
                <strong>{report.locationName}</strong>...
              </span>
            </div>
            <button
              onClick={() => audioBroadcast.stop()}
              className="text-xs text-rose-300 hover:underline"
            >
              {t("mute")}
            </button>
          </div>
        )}

        {audioError && (
          <div className="my-3 p-3 rounded-xl bg-amber-500/20 text-amber-200 text-xs flex items-center gap-2">
            <VolumeX size={15} />
            <span>{audioError}</span>
          </div>
        )}

        {/* Situation Summary & Outdoor Safety Rating */}
        <div className="my-5 flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-white/5 border border-white/10">
          <div className="space-y-1">
            <div className="text-xs font-semibold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
              <Volume2 size={13} />
              <span>
                {t("synopticAssessment")} • {report.publishedTime}
              </span>
            </div>
            <p className="text-sm md:text-base text-slate-200 font-medium leading-relaxed">
              {report.situationSummary}
            </p>
          </div>

          <div className="shrink-0 flex md:flex-col items-center md:items-end justify-between md:justify-center border-t md:border-t-0 md:border-l border-white/10 pt-3 md:pt-0 md:pl-5">
            <span className="text-[11px] text-slate-400 uppercase font-semibold">
              {t("activityRating")}
            </span>
            <span
              className={`text-xs md:text-sm font-bold px-3 py-1.5 rounded-xl border mt-1 ${ratingColor}`}
            >
              {report.outdoorSafetyRating === "Optimal"
                ? t("optimal")
                : report.outdoorSafetyRating === "Favorable"
                ? t("favorable")
                : report.outdoorSafetyRating === "Moderate Caution"
                ? t("moderateCaution")
                : t("hazardous")}
            </span>
          </div>
        </div>

        {/* 4 Meteorological Dynamics Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-5">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-300">
              <Thermometer size={15} />
              <span>{t("thermalProfile")}</span>
            </div>
            <p className="text-xs text-slate-300 leading-normal">
              {report.atmosphericDynamics.thermalTrend}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-teal-300">
              <Wind size={15} />
              <span>{t("windDynamics")}</span>
            </div>
            <p className="text-xs text-slate-300 leading-normal">
              {report.atmosphericDynamics.windConditions}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-sky-300">
              <CloudRain size={15} />
              <span>{t("precipRisk")}</span>
            </div>
            <p className="text-xs text-slate-300 leading-normal">
              {report.atmosphericDynamics.precipitationRisk}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300">
              <Gauge size={15} />
              <span>{t("barometricColumn")}</span>
            </div>
            <p className="text-xs text-slate-300 leading-normal">
              {report.atmosphericDynamics.pressureAnalysis}
            </p>
          </div>
        </div>

        {/* Highway & Commute Advisory */}
        <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-start gap-3 my-4">
          <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 shrink-0 mt-0.5">
            <Car size={18} />
          </div>
          <div>
            <div className="text-xs font-bold text-sky-300 uppercase tracking-wider">
              {t("transitGuidance")}
            </div>
            <p className="text-xs md:text-sm text-slate-200 mt-0.5 leading-relaxed">
              {report.travelAdvisory}
            </p>
          </div>
        </div>

        {/* Safety checklist items */}
        <div className="pt-3 border-t border-white/10">
          <div className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
            <CheckCircle size={14} className="text-emerald-400" />
            <span>
              {t("safetyChecklist")} ({weather.county || weather.city})
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {report.safetyChecklist.map((item, i) => (
              <div
                key={i}
                className="text-[11px] text-slate-300 bg-white/5 px-3 py-2 rounded-xl border border-white/5 flex items-center gap-2"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* SECTION 2: Global Breaking Weather News Feed */}
      <div className="space-y-4">
        {/* News Feed Header & Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg md:text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Radio size={18} className="text-rose-400" />
              <span>{t("newsWire")}</span>
            </h3>
            <p className="text-xs text-slate-400">
              {t("newsWireSubtitle")}
            </p>
          </div>

          {/* Search within news */}
          <div className="relative w-full md:w-64">
            <Search size={14} className="absolute left-3 top-3 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("searchNewsPlaceholder")}
              className="w-full bg-white/10 hover:bg-white/15 focus:bg-white/20 text-white placeholder-slate-400 pl-9 pr-3 py-2 rounded-xl border border-white/10 text-xs outline-none"
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: "all", label: t("allNews"), icon: Compass },
            { id: "severe", label: t("severeStorms"), icon: ShieldAlert },
            { id: "tropical", label: t("cyclonesMarine"), icon: Wind },
            { id: "winter", label: t("winterStorms"), icon: Snowflake },
            { id: "heat", label: t("heatwaves"), icon: Flame },
            { id: "climate", label: t("climateOrbit"), icon: Compass },
          ].map((cat) => {
            const Icon = cat.icon;
            const active = newsFilter === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setNewsFilter(cat.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 ${
                  active
                    ? "bg-sky-500 text-white shadow-md shadow-sky-500/20"
                    : "bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5"
                }`}
              >
                <Icon size={13} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* News Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNews.map((article, index) => {
            const sevBadge =
              article.severity === "CRITICAL"
                ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                : article.severity === "WARNING"
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                : "bg-sky-500/20 text-sky-300 border-sky-500/40";

            return (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.4 }}
                onClick={() => setSelectedArticle(article)}
                className="glass-panel rounded-3xl p-5 border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between cursor-pointer group hover:-translate-y-0.5"
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg border ${sevBadge}`}
                    >
                      {article.severity}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {article.publishedTime}
                    </span>
                  </div>

                  {/* Title */}
                  <h4 className="text-sm font-semibold text-white group-hover:text-sky-300 transition-colors line-clamp-3 min-h-[3rem] leading-snug mb-2">
                    {article.title}
                  </h4>

                  {/* Summary */}
                  <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed mb-4">
                    {article.summary}
                  </p>
                </div>

                {/* Footer Metrics & Region */}
                <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="truncate pr-2 font-medium text-slate-300">
                    {article.region}
                  </span>
                  <span className="flex items-center gap-1 text-sky-400 group-hover:translate-x-0.5 transition-transform shrink-0">
                    <span>{t("readReport")}</span>
                    <ExternalLink size={12} />
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {filteredNews.length === 0 && (
          <div className="glass-panel rounded-2xl p-8 text-center text-slate-400 text-xs">
            {t("noNewsFound")}
          </div>
        )}
      </div>

      {/* Modal reader for any selected article */}
      <WeatherArticleModal
        article={selectedArticle}
        onClose={() => setSelectedArticle(null)}
      />
    </div>
  );
};
