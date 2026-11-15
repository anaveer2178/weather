import { motion } from "framer-motion";
import { Clock, Droplets } from "lucide-react";
import type { HourlyForecastItem } from "../../../convex/weather/types";
import { WeatherIcon } from "./WeatherIcon";
import { useLanguage } from "../../context/LanguageContext";
import { formatLocalizedNumber, formatLocalizedTime } from "../../services/i18n";

interface HourlyForecastProps {
  hourly: HourlyForecastItem[];
  formatTemp: (celsius: number) => string;
}

export const HourlyForecast = ({
  hourly,
  formatTemp,
}: HourlyForecastProps) => {
  const { currentLang, currentMeta, t } = useLanguage();
  if (!hourly || hourly.length === 0) return null;

  return (
    <div className="glass-panel rounded-3xl p-6 backdrop-blur-xl border border-white/10">
      <div className="flex items-center gap-2 mb-4 text-slate-300 font-medium text-sm">
        <Clock size={16} className="text-sky-400" />
        <span>{t("hourlyForecast")}</span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 pt-1 scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] px-1 pr-6">
        {hourly.map((item, index) => {
          const itemDate = new Date(item.dt * 1000);
          const isNow = index === 0;
          const timeLabel = isNow
            ? t("today")
            : formatLocalizedTime(itemDate, currentLang, currentMeta.bcp47 || "en-US");

          return (
            <motion.div
              key={item.dt}
              whileHover={{ y: -4, scale: 1.03 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className={`flex flex-col items-center justify-between min-w-[85px] py-3 px-2 rounded-2xl border transition-all ${
                isNow
                  ? "bg-white/15 border-white/25 shadow-lg shadow-black/20"
                  : "bg-white/5 border-white/5 hover:bg-white/10"
              }`}
            >
              <span className={`text-xs font-medium ${isNow ? "text-sky-300" : "text-slate-400"}`}>
                {timeLabel}
              </span>

              <div className="my-2.5">
                <WeatherIcon condition={item.condition} iconCode={item.icon} size={26} />
              </div>

              <span className="text-sm font-semibold text-white">
                {formatTemp(item.temp)}
              </span>

              {item.pop > 0 ? (
                <div className="flex items-center gap-0.5 mt-2 text-[10px] text-sky-400 font-medium">
                  <Droplets size={10} />
                  <span>{formatLocalizedNumber(Math.round(item.pop * 100), currentLang)}%</span>
                </div>
              ) : (
                <div className="h-4 mt-2" />
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
