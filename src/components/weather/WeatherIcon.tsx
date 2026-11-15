import {
  Sun,
  Moon,
  Cloud,
  CloudSun,
  CloudMoon,
  CloudRain,
  CloudDrizzle,
  CloudLightning,
  Snowflake,
  CloudFog,
  Wind,
  Tornado,
} from "lucide-react";

interface WeatherIconProps {
  condition: string;
  iconCode?: string;
  className?: string;
  size?: number;
}

export const WeatherIcon = ({
  condition = "Clear",
  iconCode = "01d",
  className = "",
  size = 28,
}: WeatherIconProps) => {
  const isNight = iconCode.endsWith("n");
  const cond = condition.toLowerCase();

  if (cond.includes("thunder")) {
    return <CloudLightning size={size} className={`text-amber-400 ${className}`} />;
  }
  if (cond.includes("snow")) {
    return <Snowflake size={size} className={`text-cyan-200 animate-pulse ${className}`} />;
  }
  if (cond.includes("drizzle")) {
    return <CloudDrizzle size={size} className={`text-sky-300 ${className}`} />;
  }
  if (cond.includes("rain")) {
    return <CloudRain size={size} className={`text-blue-400 ${className}`} />;
  }
  if (cond.includes("fog") || cond.includes("mist") || cond.includes("haze")) {
    return <CloudFog size={size} className={`text-slate-300 ${className}`} />;
  }
  if (cond.includes("wind") || cond.includes("squall")) {
    return <Wind size={size} className={`text-teal-300 ${className}`} />;
  }
  if (cond.includes("tornado")) {
    return <Tornado size={size} className={`text-rose-400 ${className}`} />;
  }
  if (cond.includes("cloud")) {
    if (cond.includes("scattered") || cond.includes("few")) {
      return isNight ? (
        <CloudMoon size={size} className={`text-slate-300 ${className}`} />
      ) : (
        <CloudSun size={size} className={`text-amber-300 ${className}`} />
      );
    }
    return <Cloud size={size} className={`text-slate-300 ${className}`} />;
  }

  // Clear / Default
  return isNight ? (
    <Moon size={size} className={`text-indigo-200 ${className}`} />
  ) : (
    <Sun size={size} className={`text-amber-400 animate-spin-slow ${className}`} />
  );
};
