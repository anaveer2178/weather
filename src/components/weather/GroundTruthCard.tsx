import React, { useState, useMemo } from "react";
import {
  Radio,
  Sliders,
  ChevronDown,
  ChevronUp,
  Thermometer,
  CloudRain,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import type { GroundTruthCalibration } from "../../services/groundTruthService";
import { formatLocalizedNumber, translateCondition, localizeLocationName } from "../../services/i18n";

interface GroundTruthCardProps {
  calibration: GroundTruthCalibration;
  autoCorrectEnabled: boolean;
  onToggleAutoCorrect: (enabled: boolean) => void;
}

export const GroundTruthCard: React.FC<GroundTruthCardProps> = ({
  calibration,
  autoCorrectEnabled,
  onToggleAutoCorrect,
}) => {
  const { currentLang, t } = useLanguage();
  const [expanded, setExpanded] = useState<boolean>(false);

  const { station, discrepancyDetected, discrepancySummary, confidenceScore } = calibration;

  const localizedDistance = formatLocalizedNumber(station.distanceKm, currentLang);
  const localizedConfidence = formatLocalizedNumber(confidenceScore, currentLang);

  const rawConditionText = translateCondition(calibration.rawForecastCondition, currentLang);
  const observedConditionText = translateCondition(station.observedCondition, currentLang);

  const rawTempStr = `${formatLocalizedNumber(Math.round(calibration.rawForecastTemp), currentLang)}°C`;
  const observedTempStr = `${formatLocalizedNumber(Math.round(station.observedTemp), currentLang)}°C`;

  const localizedStationName = useMemo(() => {
    if (currentLang === "kn") {
      const name = station.stationName.toLowerCase();
      if (name.includes("hal") || name.includes("bangalore")) {
        return "ಬೆಂಗಳೂರು ಎಚ್‌ಎಎಲ್ ಹವಾಮಾನ ವೀಕ್ಷಣಾಲಯ (HAL)";
      }
      return localizeLocationName(station.stationName, currentLang);
    }
    return station.stationName;
  }, [station.stationName, currentLang]);

  const localizedStationType = useMemo(() => {
    if (currentLang === "kn") {
      const type = station.stationType.toLowerCase();
      if (type.includes("airport") || type.includes("metar")) return "ವಿಮಾನ ನಿಲ್ದಾಣ ಅಧಿಕೃತ ಸಂವೇದಕ (METAR)";
      if (type.includes("caaqms")) return "ಅಧಿಕೃತ ವಾಯು ಮಾಲಿನ್ಯ ನಿಗಾ ಕೇಂದ್ರ (CAAQMS)";
      return "ಸ್ವಯಂಚಾಲಿತ ಹವಾಮಾನ ಕೇಂದ್ರ";
    }
    return station.stationType;
  }, [station.stationType, currentLang]);

  const localizedSummary = useMemo(() => {
    if (currentLang === "kn") {
      const deltaStr = (Math.abs(station.observedTemp - calibration.rawForecastTemp)).toFixed(1);
      const obsTempKn = formatLocalizedNumber(station.observedTemp.toFixed(1), currentLang);
      const deltaKn = formatLocalizedNumber(deltaStr, currentLang);
      if (discrepancyDetected) {
        return `ಕೇಂದ್ರ ${station.stationCode} ಸಂವೇದಕಗಳು ನೈಜ ತಾಪಮಾನವನ್ನು ${obsTempKn}°C ಎಂದು ನಿಖರವಾಗಿ ದಾಖಲಿಸಿವೆ (${deltaKn}°C ವ್ಯತ್ಯಾಸ ಸರಿಪಡಿಸಲಾಗಿದೆ). ನೈಜ ನೆಲದ ದತ್ತಾಂಶಕ್ಕೆ ಅನುಗುಣವಾಗಿ ಮಾಪನಾಂಕ ನಿರ್ಣಯಿಸಲಾಗಿದೆ.`;
      }
      return `ಕೇಂದ್ರ ${station.stationCode} ಸಂವೇದಕಗಳು ನಿಖರವಾದ ಸ್ಥಳೀಯ ಹವಾಮಾನವನ್ನು ಖಚಿತಪಡಿಸಿವೆ.`;
    }
    return discrepancySummary;
  }, [discrepancySummary, currentLang, station, calibration, discrepancyDetected]);

  return (
    <div className="w-full rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl p-4 md:p-5 shadow-xl transition-all duration-300 mb-4">
      {/* Header bar: Station Status & Calibration Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
            <Radio className="w-5 h-5 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                {t("groundTruth")}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <CheckCircle2 className="w-3 h-3" />
                {t("groundTruthCalibrated")} ({localizedConfidence}%)
              </span>
            </div>
            <h4 className="text-sm md:text-base font-semibold text-white/95 mt-0.5">
              {localizedStationName}
            </h4>
            <p className="text-xs text-white/60">
              {station.stationCode} • {localizedDistance} km • {localizedStationType}
            </p>
          </div>
        </div>

        {/* Right side controls: Auto-correct switch & Expand details button */}
        <div className="flex items-center gap-2.5 self-end sm:self-center">
          {/* Toggle Auto-Correction Switch */}
          <button
            onClick={() => onToggleAutoCorrect(!autoCorrectEnabled)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
              autoCorrectEnabled
                ? "bg-emerald-500/20 text-emerald-200 border-emerald-500/40 hover:bg-emerald-500/30"
                : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10"
            }`}
            title={t("toggleCalibration")}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{t("autoCorrectionActive")}</span>
            <span
              className={`w-3 h-3 rounded-full ${
                autoCorrectEnabled ? "bg-emerald-400 shadow-sm shadow-emerald-400" : "bg-white/30"
              }`}
            />
          </button>

          {/* Expand/Collapse details */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            aria-label="Toggle details"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Variance Alert Banner (Noticeable if discrepancy exists) */}
      {discrepancyDetected && (
        <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs md:text-sm flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 leading-relaxed">
            <span className="font-semibold text-amber-300">{t("varianceDetected")}: </span>
            <span>{localizedSummary}</span>
          </div>
        </div>
      )}

      {/* Expandable Comparison Panel */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-3.5 animate-fadeIn">
          {/* Box 1: Raw Forecast Model */}
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between text-xs text-white/60 mb-2">
              <span className="font-medium uppercase tracking-wider">{t("rawForecast")}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10">GFS / ECMWF Grid</span>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-xl font-bold text-white/90">{rawConditionText}</div>
              <div className="text-2xl font-black text-white/80">{rawTempStr}</div>
            </div>
            <p className="text-xs text-white/50 mt-1.5">
              Standard numerical weather prediction calculation prior to ground sensor telemetry calibration.
            </p>
          </div>

          {/* Box 2: Live Ground Station Sensors */}
          <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
            <div className="flex items-center justify-between text-xs text-emerald-400 mb-2">
              <span className="font-semibold uppercase tracking-wider">{t("liveStation")}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                {station.lastObservationTime}
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-xl font-bold text-emerald-300 flex items-center gap-1.5">
                <CloudRain className="w-5 h-5 text-emerald-400" />
                {observedConditionText}
              </div>
              <div className="text-2xl font-black text-emerald-300 flex items-center gap-1">
                <Thermometer className="w-5 h-5 text-emerald-400" />
                {observedTempStr}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-3 pt-2 border-t border-emerald-500/20 text-[11px] text-white/80">
              <div>
                <span className="text-white/50 block">Precipitation</span>
                <span className="font-semibold text-emerald-300">
                  {formatLocalizedNumber(station.precipitationRate, currentLang)} mm/h
                </span>
              </div>
              <div>
                <span className="text-white/50 block">Humidity</span>
                <span className="font-semibold text-emerald-300">
                  {formatLocalizedNumber(station.observedHumidity, currentLang)}%
                </span>
              </div>
              <div>
                <span className="text-white/50 block">Sensor Quality</span>
                <span className="font-semibold text-emerald-300">
                  {formatLocalizedNumber(station.qualityIndex, currentLang)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
