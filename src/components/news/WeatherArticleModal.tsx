import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShieldAlert, Radio, Clock, MapPin, CheckCircle, Share2 } from "lucide-react";
import type { WeatherNewsArticle } from "../../services/weatherNewsService";
import { useLanguage } from "../../context/LanguageContext";

interface WeatherArticleModalProps {
  article: WeatherNewsArticle | null;
  onClose: () => void;
}

export const WeatherArticleModal: React.FC<WeatherArticleModalProps> = ({
  article,
  onClose,
}) => {
  const { t } = useLanguage();
  // Close on escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  if (!article) return null;

  const severityColor =
    article.severity === "CRITICAL"
      ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
      : article.severity === "WARNING"
      ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
      : "bg-sky-500/20 text-sky-300 border-sky-500/40";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-[#101827] border border-white/15 rounded-3xl p-6 md:p-8 shadow-2xl text-slate-100"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-xl border flex items-center gap-1.5 ${severityColor}`}
              >
                <ShieldAlert size={14} />
                {article.severity} {t("reportLabel")}
              </span>
              <span className="text-xs px-2.5 py-1 rounded-xl bg-white/10 text-slate-300 capitalize font-medium">
                {article.category} {t("weatherLabel")}
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Title */}
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white mb-3 leading-snug">
            {article.title}
          </h2>

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pb-4 mb-5 border-b border-white/10">
            <div className="flex items-center gap-1.5">
              <Radio size={13} className="text-sky-400" />
              <span>{t("sourceLabel")}: <strong className="text-slate-200">{article.source}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin size={13} className="text-emerald-400" />
              <span>{article.region}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={13} className="text-amber-400" />
              <span>{article.publishedTime}</span>
            </div>
          </div>

          {/* Impact Metrics Banner */}
          {article.impactMetrics && article.impactMetrics.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-6 bg-white/5 p-4 rounded-2xl border border-white/10">
              {article.impactMetrics.map((metric, i) => (
                <div key={i} className="text-center">
                  <div className="text-[11px] text-slate-400 uppercase font-medium">
                    {metric.label}
                  </div>
                  <div className="text-sm md:text-base font-bold text-white mt-0.5">
                    {metric.value}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Summary Lead */}
          <p className="text-sm md:text-base font-medium text-slate-200 leading-relaxed mb-4 bg-sky-500/10 p-4 rounded-2xl border border-sky-500/20">
            {article.summary}
          </p>

          {/* Detailed Paragraphs */}
          <div className="space-y-3 text-sm text-slate-300 leading-relaxed mb-6">
            {article.content.map((paragraph, idx) => (
              <p key={idx}>{paragraph}</p>
            ))}
          </div>

          {/* Safety & Preparedness Checklist */}
          {article.safetyAdvice && article.safetyAdvice.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 mb-6">
              <div className="flex items-center gap-2 text-amber-300 font-semibold text-sm mb-3">
                <ShieldAlert size={16} />
                <span>{t("safetyDirective")}</span>
              </div>
              <ul className="space-y-2">
                {article.safetyAdvice.map((item, index) => (
                  <li key={index} className="flex items-start gap-2.5 text-xs md:text-sm text-slate-200">
                    <CheckCircle size={15} className="text-amber-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10 text-xs text-slate-400">
            <span>{t("reportingDesk")}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (navigator.clipboard) {
                    navigator.clipboard.writeText(
                      `${article.title}\n\n${article.summary}\nSource: ${article.source}`
                    );
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
              >
                <Share2 size={13} />
                <span>{t("copySummary")}</span>
              </button>
              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-medium transition-colors"
              >
                {t("closeReport")}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
