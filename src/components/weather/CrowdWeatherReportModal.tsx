import React, { useState, useEffect } from "react";
import {
  X,
  Send,
  Users,
  CheckCircle2,
  CloudRain,
  Sun,
  Zap,
  Wind,
  CloudFog,
  Sparkles,
  ThumbsUp,
} from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import {
  CrowdFeedbackService,
  type CrowdReportItem,
} from "../../services/crowdFeedbackService";
import { playAlertChime } from "../../services/nowcastAlertService";
import { formatLocalizedNumber } from "../../services/i18n";

interface CrowdWeatherReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  locationName: string;
  lat: number;
  lon: number;
  currentWeatherCondition?: string;
  onReportSubmitted?: (report: CrowdReportItem) => void;
}

export const CrowdWeatherReportModal: React.FC<CrowdWeatherReportModalProps> = ({
  isOpen,
  onClose,
  locationName,
  lat,
  lon,
  currentWeatherCondition = "Clouds",
  onReportSubmitted,
}) => {
  const { currentLang, t } = useLanguage();

  const [selectedCondition, setSelectedCondition] = useState<
    "Rain" | "Clear" | "Thunderstorm" | "Fog" | "Snow" | "High Wind"
  >("Rain");
  const [selectedIntensity, setSelectedIntensity] = useState<
    "Light" | "Moderate" | "Severe"
  >("Moderate");
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [recentReports, setRecentReports] = useState<CrowdReportItem[]>([]);

  useEffect(() => {
    if (isOpen) {
      setSubmitted(false);
      setRecentReports(CrowdFeedbackService.getReports(lat, lon, locationName, currentWeatherCondition));
    }
  }, [isOpen, lat, lon, locationName, currentWeatherCondition]);

  if (!isOpen) return null;

  const conditionOptions: Array<{
    key: "Rain" | "Clear" | "Thunderstorm" | "Fog" | "Snow" | "High Wind";
    labelKey: "rainingHere" | "sunnyDryHere" | "thunderHere" | "fogHere" | "snowHailHere" | "windyHere";
    icon: React.ReactNode;
    color: string;
  }> = [
    {
      key: "Rain",
      labelKey: "rainingHere",
      icon: <CloudRain className="w-5 h-5 text-blue-400" />,
      color: "border-blue-500/40 bg-blue-500/10 hover:bg-blue-500/20 text-blue-200",
    },
    {
      key: "Clear",
      labelKey: "sunnyDryHere",
      icon: <Sun className="w-5 h-5 text-amber-400" />,
      color: "border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-200",
    },
    {
      key: "Thunderstorm",
      labelKey: "thunderHere",
      icon: <Zap className="w-5 h-5 text-purple-400" />,
      color: "border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20 text-purple-200",
    },
    {
      key: "Fog",
      labelKey: "fogHere",
      icon: <CloudFog className="w-5 h-5 text-slate-300" />,
      color: "border-slate-500/40 bg-slate-500/10 hover:bg-slate-500/20 text-slate-200",
    },
    {
      key: "Snow",
      labelKey: "snowHailHere",
      icon: <Sparkles className="w-5 h-5 text-cyan-300" />,
      color: "border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-200",
    },
    {
      key: "High Wind",
      labelKey: "windyHere",
      icon: <Wind className="w-5 h-5 text-teal-400" />,
      color: "border-teal-500/40 bg-teal-500/10 hover:bg-teal-500/20 text-teal-200",
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rep = CrowdFeedbackService.submitReport(
      selectedCondition,
      selectedIntensity,
      locationName,
      lat,
      lon
    );
    playAlertChime("info");
    setSubmitted(true);
    setRecentReports([rep, ...recentReports]);
    onReportSubmitted?.(rep);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div
        className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-3xl border border-white/15 bg-slate-900/95 p-5 md:p-6 shadow-2xl text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                {t("reportWeather")}
              </h3>
              <p className="text-xs text-white/60">{locationName}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            aria-label={t("closeModal")}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          /* Confirmation View */
          <div className="py-8 text-center animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4 animate-bounce">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h4 className="text-xl font-bold text-white mb-2">
              {t("reportSuccess")}
            </h4>
            <p className="text-sm text-white/70 max-w-sm mx-auto mb-6">
              Your live feedback has been incorporated into the real-time forecast calibration algorithm.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-colors shadow-lg"
            >
              {t("closeModal")}
            </button>
          </div>
        ) : (
          /* Submission Form */
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs md:text-sm font-semibold text-white/90 mb-2.5">
                {t("whatIsHappening")}
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {conditionOptions.map((opt) => {
                  const isSelected = selectedCondition === opt.key;
                  return (
                    <button
                      type="button"
                      key={opt.key}
                      onClick={() => setSelectedCondition(opt.key)}
                      className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left text-xs md:text-sm font-medium transition-all ${
                        isSelected
                          ? `ring-2 ring-indigo-400 font-bold ${opt.color} shadow-lg`
                          : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
                      }`}
                    >
                      <div className="p-1.5 rounded-xl bg-white/10">{opt.icon}</div>
                      <span className="flex-1 leading-snug">{t(opt.labelKey)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Intensity Selector */}
            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1.5">
                Observed Intensity
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["Light", "Moderate", "Severe"] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setSelectedIntensity(lvl)}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border text-center transition-all ${
                      selectedIntensity === lvl
                        ? "bg-indigo-600/30 border-indigo-400 text-indigo-200 font-bold"
                        : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-semibold text-sm shadow-xl transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <Send className="w-4 h-4" />
              <span>{t("submitReport")}</span>
            </button>
          </form>
        )}

        {/* Recent Community Feed */}
        <div className="mt-6 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between mb-2.5">
            <h5 className="text-xs font-bold uppercase tracking-wider text-white/60">
              {t("recentCommunityReports")}
            </h5>
            <span className="text-[11px] text-white/40">
              {formatLocalizedNumber(recentReports.length, currentLang)} {t("verifiedByUsers")}
            </span>
          </div>

          <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
            {recentReports.slice(0, 4).map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                  <span className="font-medium text-white/90">{r.label}</span>
                </div>
                <div className="flex items-center gap-2 text-white/50 text-[11px]">
                  <span>{r.timeAgoStr}</span>
                  <span className="flex items-center gap-0.5 text-emerald-400/90 font-semibold">
                    <ThumbsUp className="w-3 h-3" />
                    {formatLocalizedNumber(r.upvotes, currentLang)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
