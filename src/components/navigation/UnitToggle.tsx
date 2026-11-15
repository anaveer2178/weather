import { motion } from "framer-motion";
import type { UnitSystem } from "../../hooks/useWeather";

interface UnitToggleProps {
  unit: UnitSystem;
  onChange: (unit: UnitSystem) => void;
}

export const UnitToggle = ({ unit, onChange }: UnitToggleProps) => {
  return (
    <div className="flex items-center p-1 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
      <button
        onClick={() => onChange("metric")}
        className={`relative px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
          unit === "metric" ? "text-white" : "text-slate-400 hover:text-slate-200"
        }`}
      >
        {unit === "metric" && (
          <motion.div
            layoutId="unit-active-pill"
            className="absolute inset-0 bg-white/20 rounded-xl border border-white/20 shadow-sm"
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        )}
        <span className="relative z-10">°C</span>
      </button>

      <button
        onClick={() => onChange("imperial")}
        className={`relative px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
          unit === "imperial" ? "text-white" : "text-slate-400 hover:text-slate-200"
        }`}
      >
        {unit === "imperial" && (
          <motion.div
            layoutId="unit-active-pill"
            className="absolute inset-0 bg-white/20 rounded-xl border border-white/20 shadow-sm"
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        )}
        <span className="relative z-10">°F</span>
      </button>
    </div>
  );
};
