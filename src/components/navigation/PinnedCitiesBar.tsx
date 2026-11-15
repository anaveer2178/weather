import { motion, AnimatePresence } from "framer-motion";
import { Bookmark, X } from "lucide-react";
import type { PinnedCity } from "../../hooks/useWeather";
import type { GeoLocationResult } from "../../../convex/weather/types";
import { useLanguage } from "../../context/LanguageContext";

interface PinnedCitiesBarProps {
  pinnedCities: PinnedCity[];
  activeCoords: { lat: number; lon: number };
  onSelectCity: (loc: GeoLocationResult) => void;
  onRemoveCity: (city: string, country: string, lat: number, lon: number) => void;
}

export const PinnedCitiesBar = ({
  pinnedCities,
  activeCoords,
  onSelectCity,
  onRemoveCity,
}: PinnedCitiesBarProps) => {
  const { t } = useLanguage();
  if (pinnedCities.length === 0) return null;

  return (
    <div className="flex items-center gap-2 overflow-x-auto py-2 scrollbar-none">
      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 pl-1 pr-2 shrink-0">
        <Bookmark size={14} className="text-amber-400" />
        <span>{t("favorites")}</span>
      </div>

      <div className="flex items-center gap-2">
        <AnimatePresence>
          {pinnedCities.map((city) => {
            const isActive =
              Math.abs(city.lat - activeCoords.lat) < 0.05 &&
              Math.abs(city.lon - activeCoords.lon) < 0.05;

            return (
              <motion.div
                key={`${city.lat}-${city.lon}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="group relative flex items-center shrink-0"
              >
                <button
                  onClick={() =>
                    onSelectCity({
                      name: city.name,
                      country: city.country,
                      lat: city.lat,
                      lon: city.lon,
                    })
                  }
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? "bg-white/20 text-white border border-white/30 shadow-sm"
                      : "bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5"
                  }`}
                >
                  <span>{city.name}</span>
                  {city.country && (
                    <span className="text-[10px] text-slate-400 opacity-80">
                      {city.country}
                    </span>
                  )}
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveCity(city.name, city.country, city.lat, city.lon);
                  }}
                  title={t("removeFavorite")}
                  className="opacity-0 group-hover:opacity-100 -ml-1 mr-1 p-0.5 rounded-full hover:bg-white/20 text-slate-400 hover:text-white transition-opacity"
                >
                  <X size={12} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};
