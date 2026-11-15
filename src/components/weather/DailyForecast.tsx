import { motion } from "framer-motion";
import { Calendar } from "lucide-react";
import type { DailyForecastItem } from "../../../convex/weather/types";
import { WeatherIcon } from "./WeatherIcon";
import { useLanguage } from "../../context/LanguageContext";
import { translateCondition, formatLocalizedNumber } from "../../services/i18n";

interface DailyForecastProps {
  daily: DailyForecastItem[];
  formatTemp: (celsius: number) => string;
}

export const DailyForecast = ({
  daily,
  formatTemp,
}: DailyForecastProps) => {
  const { currentLang, currentMeta, t } = useLanguage();

  if (!daily || daily.length === 0) return null;

  // Calculate global min and max across all 5 days for relative temperature bars
  const allMins = daily.map((d) => d.minTemp);
  const allMaxs = daily.map((d) => d.maxTemp);
  const globalMin = Math.min(...allMins);
  const globalMax = Math.max(...allMaxs);
  const range = Math.max(1, globalMax - globalMin);

  return (
    <div className="glass-panel rounded-3xl p-6 backdrop-blur-xl border border-white/10">
      <div className="flex items-center gap-2 mb-4 text-slate-300 font-medium text-sm">
        <Calendar size={16} className="text-sky-400" />
        <span>
          {currentLang === "kn"
            ? `${formatLocalizedNumber(daily.length, currentLang)} ದಿನಗಳ ಮುನ್ಸೂಚನೆ`
            : `${daily.length}-Day Forecast`}
        </span>
      </div>

      <div className="space-y-3">
        {daily.map((item, index) => {
          // Relative bar coordinates
          const leftPercent = Math.max(0, ((item.minTemp - globalMin) / range) * 100);
          const rightPercent = Math.max(leftPercent + 10, ((item.maxTemp - globalMin) / range) * 100);
          const barWidth = Math.max(12, rightPercent - leftPercent);

          const dayLabel =
            item.dayName === "Today" || index === 0
              ? t("today")
              : new Date(item.date + "T12:00:00").toLocaleDateString(currentMeta.bcp47, {
                  weekday: "short",
                });

          const condLabel = translateCondition(item.condition, currentLang);

          return (
            <motion.div
              key={item.date}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08, duration: 0.4 }}
              className="flex items-center justify-between py-2.5 px-3 rounded-2xl hover:bg-white/5 transition-colors gap-3"
            >
              {/* Day name */}
              <div className="w-14 sm:w-16 md:w-20 font-medium text-xs md:text-sm text-slate-200 capitalize whitespace-nowrap shrink-0">
                {dayLabel}
              </div>

              {/* Condition icon & precip probability */}
              <div className="flex items-center gap-1.5 w-12 shrink-0 justify-center" title={condLabel}>
                <WeatherIcon condition={item.condition} iconCode={item.icon} size={22} />
                {item.pop > 0.1 && (
                  <span className="text-[10px] text-sky-400 font-medium whitespace-nowrap">
                    {formatLocalizedNumber(Math.round(item.pop * 100), currentLang)}%
                  </span>
                )}
              </div>

              {/* Min Temp */}
              <span className="text-xs md:text-sm font-semibold text-slate-400 w-10 md:w-12 text-right shrink-0">
                {formatTemp(item.minTemp)}
              </span>

              {/* Visual Temperature Bar */}
              <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden relative mx-2.5 min-w-[50px]">
                <div
                  className="absolute top-0 bottom-0 rounded-full bg-gradient-to-r from-sky-400 via-amber-300 to-rose-400"
                  style={{
                    left: `${leftPercent}%`,
                    width: `${barWidth}%`,
                  }}
                />
              </div>

              {/* Max Temp */}
              <span className="text-xs md:text-sm font-bold text-white w-10 md:w-12 text-right shrink-0">
                {formatTemp(item.maxTemp)}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
