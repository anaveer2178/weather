import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, ChevronRight, AlertTriangle } from "lucide-react";
import type { CurrentWeather } from "../../../convex/weather/types";
import { getLocalizedNewsArticles, type WeatherNewsArticle } from "../../services/weatherNewsService";
import { useLanguage } from "../../context/LanguageContext";

interface LiveNewsTickerProps {
  onSelectArticle: (article: WeatherNewsArticle) => void;
  onOpenNewsTab: () => void;
  weather?: CurrentWeather;
  unit?: "metric" | "imperial";
}

export const LiveNewsTicker: React.FC<LiveNewsTickerProps> = ({
  onSelectArticle,
  onOpenNewsTab,
  weather,
  unit = "metric",
}) => {
  const { currentLang, t } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);

  const articles = useMemo(
    () => getLocalizedNewsArticles(currentLang, weather, unit),
    [currentLang, weather, unit]
  );

  // Auto-cycle news headlines every 7 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % articles.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [articles.length]);

  const activeArticle = articles[currentIndex] || articles[0];

  return (
    <div className="w-full bg-gradient-to-r from-rose-950/40 via-[#131b2e]/70 to-sky-950/40 backdrop-blur-xl border border-white/10 rounded-2xl px-3 py-2 flex items-center justify-between gap-3 text-xs shadow-lg">
      <div className="flex items-center gap-2.5 overflow-hidden">
        {/* Blinking Live Badge */}
        <div
          onClick={onOpenNewsTab}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold tracking-wider text-[10px] uppercase shrink-0 cursor-pointer hover:bg-rose-500/30 transition-colors"
        >
          <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse inline-block" />
          <Radio size={12} className="text-rose-400 animate-spin-slow" />
          <span>{t("liveNews")}</span>
        </div>

        {/* Headline cycler */}
        <div className="overflow-hidden h-5 flex items-center flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeArticle.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35 }}
              onClick={() => onSelectArticle(activeArticle)}
              className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors truncate"
            >
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-amber-300 shrink-0 flex items-center gap-1">
                <AlertTriangle size={10} />
                {activeArticle.severity}
              </span>
              <span className="text-slate-200 font-medium truncate">
                {activeArticle.title}
              </span>
              <span className="text-slate-400 text-[11px] hidden sm:inline shrink-0">
                • {activeArticle.region} ({activeArticle.publishedTime})
              </span>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Action button */}
      <button
        onClick={onOpenNewsTab}
        className="flex items-center gap-1 text-[11px] font-medium text-sky-400 hover:text-sky-300 hover:underline shrink-0 pl-2 border-l border-white/10"
      >
        <span>{t("fullReport")}</span>
        <ChevronRight size={13} />
      </button>
    </div>
  );
};
