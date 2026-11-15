import React, { useState, useEffect } from "react";
import { AlertTriangle, Bell, BellRing, Volume2, X, Clock, ShieldAlert } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import {
  type NowcastAlert,
  PushNotificationManager,
  playAlertChime,
} from "../../services/nowcastAlertService";
import { formatLocalizedNumber } from "../../services/i18n";

interface HyperlocalAlertBannerProps {
  alert: NowcastAlert | null;
  onDismiss?: () => void;
}

export const HyperlocalAlertBanner: React.FC<HyperlocalAlertBannerProps> = ({
  alert,
  onDismiss,
}) => {
  const { currentLang, t } = useLanguage();
  const [pushEnabled, setPushEnabled] = useState<boolean>(false);
  const [dismissed, setDismissed] = useState<boolean>(false);
  const [lastChimedId, setLastChimedId] = useState<string>("");

  useEffect(() => {
    setPushEnabled(PushNotificationManager.isEnabled());
  }, []);

  // When a high-severity alert appears, chime automatically once
  useEffect(() => {
    if (alert && (alert.severity === "critical" || alert.severity === "warning")) {
      if (lastChimedId !== alert.id) {
        setLastChimedId(alert.id);
        playAlertChime("warning");
        PushNotificationManager.sendNotification(alert);
      }
    }
  }, [alert, lastChimedId]);

  if (!alert || dismissed) return null;

  const handleTogglePush = async () => {
    if (pushEnabled) {
      PushNotificationManager.setEnabled(false);
      setPushEnabled(false);
    } else {
      const granted = await PushNotificationManager.requestPermission();
      setPushEnabled(granted);
      if (granted && alert) {
        PushNotificationManager.sendNotification(alert);
      }
    }
  };

  const handleTestChime = () => {
    playAlertChime("warning");
  };

  const severityColors = {
    critical: "from-rose-950/80 via-red-900/60 to-rose-900/40 border-red-500/50 text-red-200",
    warning: "from-amber-950/80 via-orange-900/60 to-amber-900/40 border-amber-500/50 text-amber-200",
    advisory: "from-blue-950/80 via-indigo-900/60 to-blue-900/40 border-blue-500/50 text-blue-200",
    info: "from-emerald-950/80 via-teal-900/60 to-emerald-900/40 border-emerald-500/50 text-emerald-200",
  }[alert.severity];

  const badgeColors = {
    critical: "bg-red-500/20 text-red-300 border-red-500/30",
    warning: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    advisory: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    info: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  }[alert.severity];

  const localizedMinutes = formatLocalizedNumber(alert.minutesRemaining, currentLang);
  const localizedMinutesStr = t("nowcastMinutes").replace("{min}", localizedMinutes);

  return (
    <div
      role="alert"
      className={`relative w-full rounded-2xl border backdrop-blur-xl p-4 md:p-5 shadow-2xl transition-all duration-300 bg-gradient-to-r ${severityColors} mb-4`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left column: Icon + Headline + Timing */}
        <div className="flex items-start gap-3.5 flex-1 min-w-0">
          <div className="mt-0.5 p-2 rounded-xl bg-white/10 shrink-0 animate-pulse">
            {alert.severity === "critical" ? (
              <ShieldAlert className="w-6 h-6 text-red-400" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-amber-400" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeColors} uppercase tracking-wider`}>
                {t("nowcastAlert")}
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-white/10 text-white/90">
                <Clock className="w-3.5 h-3.5" />
                {localizedMinutesStr}
              </span>
              {alert.expectedIntensity && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-black/20 text-white/80 hidden sm:inline-block">
                  {alert.expectedIntensity}
                </span>
              )}
            </div>

            <h3 className="text-base md:text-lg font-bold text-white tracking-tight leading-snug">
              {alert.headline}
            </h3>
            <p className="text-xs md:text-sm text-white/80 mt-1 leading-relaxed line-clamp-2 md:line-clamp-none">
              {alert.detail}
            </p>
          </div>
        </div>

        {/* Right column: Action Controls (Responsive wrap) */}
        <div className="flex items-center flex-wrap gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-white/10">
          {/* Test Audio Chime */}
          <button
            onClick={handleTestChime}
            title={t("testAlert")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <Volume2 className="w-4 h-4 text-amber-300" />
            <span>{t("testAlert")}</span>
          </button>

          {/* Web Push Notification Toggle */}
          <button
            onClick={handleTogglePush}
            title={t("pushNotification")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
              pushEnabled
                ? "bg-emerald-500/20 text-emerald-200 border border-emerald-500/40 hover:bg-emerald-500/30"
                : "bg-white/10 hover:bg-white/20 text-white"
            }`}
          >
            {pushEnabled ? (
              <>
                <BellRing className="w-4 h-4 text-emerald-400 animate-bounce" />
                <span>{t("alertsEnabled")}</span>
              </>
            ) : (
              <>
                <Bell className="w-4 h-4" />
                <span>{t("enableAlerts")}</span>
              </>
            )}
          </button>

          {/* Dismiss Button */}
          <button
            onClick={() => {
              setDismissed(true);
              onDismiss?.();
            }}
            title={t("alertDismiss")}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors ml-auto md:ml-0"
            aria-label={t("alertDismiss")}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
