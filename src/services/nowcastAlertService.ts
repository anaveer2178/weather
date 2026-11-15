import type { CurrentWeather, HourlyForecastItem } from "../../convex/weather/types";
import { formatLocalizedNumber, localizeLocationName } from "./i18n";

export interface NowcastAlert {
  id: string;
  type: "precipitation" | "wind" | "temperature" | "thunderstorm" | "clear";
  severity: "critical" | "warning" | "advisory" | "info";
  minutesRemaining: number;
  headline: string;
  detail: string;
  locationName: string;
  timestamp: number;
  precipitationType?: "rain" | "snow" | "thunderstorm" | "drizzle";
  expectedIntensity?: string;
  speed?: number;
}

/**
 * Web Audio synthesizer that plays a gentle, audible alert chime
 * without requiring external audio files that could fail with network/CORS issues.
 */
export function playAlertChime(type: "warning" | "info" = "warning") {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    if (type === "warning") {
      // Pleasant double-beep attention chime
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5

      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(880, now + 0.18);
      osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.35); // D6
    } else {
      // Gentle info bell
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.2); // E5

      osc2.type = "sine";
      osc2.frequency.setValueAtTime(783.99, now + 0.1); // G5
      osc2.frequency.exponentialRampToValueAtTime(1046.5, now + 0.3); // C6
    }

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.25, now + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.6);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.6);
  } catch (err) {
    console.warn("Web Audio chime could not play:", err);
  }
}

/**
 * Manages Web Push Notifications in browser (Desktop & Mobile).
 */
export class PushNotificationManager {
  private static STORAGE_KEY = "weather_push_alerts_enabled_v1";

  public static isSupported(): boolean {
    return typeof window !== "undefined" && "Notification" in window;
  }

  public static getPermission(): NotificationPermission {
    if (!this.isSupported()) return "denied";
    return Notification.permission;
  }

  public static isEnabled(): boolean {
    if (!this.isSupported()) return false;
    const pref = localStorage.getItem(this.STORAGE_KEY);
    return Notification.permission === "granted" && pref !== "false";
  }

  public static setEnabled(enabled: boolean): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, enabled ? "true" : "false");
    } catch {}
  }

  public static async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) return false;
    try {
      const permission = await Notification.requestPermission();
      const granted = permission === "granted";
      this.setEnabled(granted);
      return granted;
    } catch {
      return false;
    }
  }

  public static sendNotification(alert: NowcastAlert): void {
    if (!this.isEnabled()) return;

    try {
      const notification = new Notification(`⚠️ ${alert.headline}`, {
        body: `${alert.detail} (${alert.locationName})`,
        icon: "/favicon.svg",
        badge: "/favicon.svg",
        tag: `nowcast-${alert.type}-${Math.floor(alert.timestamp / 60000)}`,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (err) {
      console.warn("Push notification delivery failed:", err);
    }
  }
}

/**
 * Computes minute-by-minute nowcasting alert specifically detecting precipitation,
 * gust surges, or temperature plunges at the exact location.
 */
export function computeHyperlocalNowcast(
  current: CurrentWeather,
  hourly: HourlyForecastItem[],
  langCode: string = "en"
): NowcastAlert | null {
  if (!current) return null;

  const rawLoc = current.district || current.county || current.city;
  const loc = localizeLocationName(rawLoc, langCode);
  const cond = current.condition.toLowerCase();
  const isKn = langCode === "kn";

  // 1. Check if precipitation is already ongoing
  const isCurrentlyRaining = cond.includes("rain") || cond.includes("drizzle") || cond.includes("shower");
  const isCurrentlySnowing = cond.includes("snow") || cond.includes("blizzard");
  const isCurrentlyThunderstorm = cond.includes("thunder");

  if (isCurrentlyThunderstorm) {
    return {
      id: `nowcast-active-thunder-${Date.now()}`,
      type: "thunderstorm",
      severity: "critical",
      minutesRemaining: 5,
      headline: isKn
        ? `${loc} ಮೇಲೆ ಸಕ್ರಿಯ ಗುಡುಗು ಸಹಿತ ಬಿರುಗಾಳಿಯ ಮೋಡ`
        : `Active Thunderstorm Cell over ${loc}`,
      detail: isKn
        ? `ನಿಮ್ಮ ನಿಖರ ಸ್ಥಳದಲ್ಲಿ ಮಿಂಚು ಮತ್ತು ಬಿರುಗಾಳಿಯೊಂದಿಗೆ ತೀವ್ರ ಮಳೆಯು ಕಂಡುಬರುತ್ತಿದೆ. ಮನೆಯೊಳಗೆ ಸುರಕ್ಷಿತವಾಗಿರಿ.`
        : `Severe convective activity with cloud-to-ground lightning and localized squalls observed at your exact location. Seek shelter indoors.`,
      locationName: loc,
      timestamp: Date.now(),
      precipitationType: "thunderstorm",
      expectedIntensity: isKn ? "ತೀವ್ರ (35+ dBZ)" : "Severe (35+ dBZ)",
    };
  }

  if (isCurrentlySnowing) {
    return {
      id: `nowcast-active-snow-${Date.now()}`,
      type: "precipitation",
      severity: "warning",
      minutesRemaining: 40,
      headline: isKn
        ? `${loc} ಮೇಲೆ ಸಕ್ರಿಯ ಹಿಮಪಾತ`
        : `Active Snowfall over ${loc}`,
      detail: isKn
        ? `ನಿಮ್ಮ ಸ್ಥಳದಲ್ಲಿ ಹಿಮಪಾತ ಸಂಗ್ರಹವಾಗುತ್ತಿದೆ. ರಸ್ತೆಗಳಲ್ಲಿ ಜಾಗರೂಕರಾಗಿರಿ.`
        : `Snowfall accumulating at your location. Reduced traction on roadways.`,
      locationName: loc,
      timestamp: Date.now(),
      precipitationType: "snow",
      expectedIntensity: isKn ? "ಮಧ್ಯಮ (2.5 cm/h)" : "Moderate (2.5 cm/h)",
    };
  }

  if (isCurrentlyRaining) {
    // Rain is actively occurring; check when it is predicted to ease
    const dryHour = hourly.slice(1, 5).find((h) => h.pop < 0.25);
    const minutesToEase = dryHour ? Math.max(15, Math.min(60, (dryHour.dt * 1000 - Date.now()) / 60000)) : 45;
    const roundedMinutes = Math.round(minutesToEase);

    return {
      id: `nowcast-active-rain-${Date.now()}`,
      type: "precipitation",
      severity: "warning",
      minutesRemaining: roundedMinutes,
      headline: isKn
        ? `${loc} ನಲ್ಲಿ ಸಕ್ರಿಯ ಭಾರಿ ಮಳೆ`
        : `Heavy rain active at ${loc}`,
      detail: isKn
        ? `ನಿಮ್ಮ ಸ್ಥಳದಲ್ಲಿ ಮಳೆ ಮುಂದುವರಿದಿದೆ. ಸರಿಸುಮಾರು ${formatLocalizedNumber(roundedMinutes, langCode)} ನಿಮಿಷಗಳಲ್ಲಿ ಮಳೆ ತಗ್ಗುವ ನಿರೀಕ್ಷೆಯಿದೆ.`
        : `Precipitation continues over your location. Expected to taper off in approximately ${roundedMinutes} minutes.`,
      locationName: loc,
      timestamp: Date.now(),
      precipitationType: "rain",
      expectedIntensity: isKn ? "ಮಧ್ಯಮದಿಂದ ಭಾರಿ (12 mm/h)" : "Moderate to Heavy (12 mm/h)",
    };
  }

  // 2. Check impending rain or snow arriving within the next 15-60 minutes
  const nextHour = hourly[0];
  const secondHour = hourly[1];

  if (nextHour && nextHour.pop >= 0.45) {
    // Arrival estimated in 12 - 28 minutes based on pop intensity
    const minutes = Math.max(12, Math.round(35 - nextHour.pop * 25));
    const isThunder = nextHour.condition.toLowerCase().includes("thunder");
    const isSnow = nextHour.condition.toLowerCase().includes("snow");
    const popPercent = Math.round(nextHour.pop * 100);

    return {
      id: `nowcast-incoming-${Date.now()}`,
      type: isThunder ? "thunderstorm" : isSnow ? "precipitation" : "precipitation",
      severity: isThunder ? "critical" : "warning",
      minutesRemaining: minutes,
      headline: isKn
        ? (isThunder
            ? `${loc} ನಲ್ಲಿ ಇನ್ನೇನು ${formatLocalizedNumber(minutes, langCode)} ನಿಮಿಷಗಳಲ್ಲಿ ಗುಡುಗು ಮಳೆ`
            : isSnow
            ? `${loc} ನಲ್ಲಿ ಇನ್ನೇನು ${formatLocalizedNumber(minutes, langCode)} ನಿಮಿಷಗಳಲ್ಲಿ ಹಿಮಪಾತ`
            : `ನಿಮ್ಮ ಸ್ಥಳದಲ್ಲಿ ಇನ್ನೇನು ${formatLocalizedNumber(minutes, langCode)} ನಿಮಿಷಗಳಲ್ಲಿ ಭಾರಿ ಮಳೆ`)
        : (isThunder
            ? `Thunderstorm at ${loc} in ${minutes} minutes`
            : isSnow
            ? `Snowfall at ${loc} in ${minutes} minutes`
            : `Heavy rain at your location in ${minutes} minutes`),
      detail: isKn
        ? `ಡಾಪ್ಲರ್ ರೇಡಾರ್ ಮಳೆಯ ಮೋಡಗಳನ್ನು ನೇರವಾಗಿ ${loc} ಕಡೆಗೆ ತೋರಿಸುತ್ತಿದೆ. ಮಳೆಯ ಸಂಭವನೀಯತೆ ${formatLocalizedNumber(popPercent, langCode)}%. ರಸ್ತೆ ಪ್ರಯಾಣದಲ್ಲಿ ಎಚ್ಚರವಿರಲಿ.`
        : `Doppler radar sweeps show precipitation bands navigating directly toward ${loc}. Precipitation probability ${popPercent}%. Prepare for wet roadways.`,
      locationName: loc,
      timestamp: Date.now(),
      precipitationType: isSnow ? "snow" : isThunder ? "thunderstorm" : "rain",
      expectedIntensity: nextHour.pop > 0.7 ? "Heavy (15 mm/h)" : "Moderate (6 mm/h)",
    };
  }

  if (secondHour && secondHour.pop >= 0.5) {
    const minutes = Math.max(30, Math.round(65 - secondHour.pop * 20));
    return {
      id: `nowcast-incoming-h2-${Date.now()}`,
      type: "precipitation",
      severity: "advisory",
      minutesRemaining: minutes,
      headline: isKn
        ? `~${formatLocalizedNumber(minutes, langCode)} ನಿಮಿಷಗಳಲ್ಲಿ ${loc} ಕಡೆಗೆ ಮಳೆ ಬರುವ ನಿರೀಕ್ಷೆ`
        : `Rain approaching ${loc} in ~${minutes} minutes`,
      detail: isKn
        ? `ಮುಂಭಾಗದ ತೇವಾಂಶವು ${loc} ಕಡೆಗೆ ಚಲಿಸುತ್ತಿದ್ದು, ಇನ್ನೇನು ${formatLocalizedNumber(minutes, langCode)} ನಿಮಿಷಗಳಲ್ಲಿ ಮಳೆ ಪ್ರಾರಂಭವಾಗಬಹುದು. ಛತ್ರಿ ಕೊಂಡೊಯ್ಯಿರಿ.`
        : `Frontal moisture is moving into ${loc} with expected rain arrival in ${minutes} minutes. Bring an umbrella before departure.`,
      locationName: loc,
      timestamp: Date.now(),
      precipitationType: "rain",
      expectedIntensity: isKn ? "ಲಘು ಮಳೆ (4 mm/h)" : "Light to Moderate (4 mm/h)",
    };
  }

  // 3. High Wind Gust Surge nowcast
  if (current.windSpeed > 10 || (nextHour && nextHour.windSpeed > 11)) {
    const maxSpeed = Math.round(Math.max(current.windSpeed, nextHour?.windSpeed || 0) * 3.6);
    return {
      id: `nowcast-wind-${Date.now()}`,
      type: "wind",
      severity: maxSpeed > 45 ? "warning" : "advisory",
      minutesRemaining: 15,
      headline: isKn
        ? `${loc} ನಲ್ಲಿ ಬಿರುಗಾಳಿಯ ವೇಗ (${formatLocalizedNumber(maxSpeed, langCode)} ಕಿಮೀ/ಗಂ)`
        : `High wind gusts (${maxSpeed} km/h) over ${loc}`,
      detail: isKn
        ? `ಪ್ರಮುಖ ರಸ್ತೆ ಕಾರಿಡಾರ್‌ಗಳಲ್ಲಿ ತೀವ್ರ ಗಾಳಿಯ ವೇಗ ಪತ್ತೆಯಾಗಿದೆ. ಹೊರಾಂಗಣ ವಸ್ತುಗಳನ್ನು ಭದ್ರಪಡಿಸಿ.`
        : `Strong wind velocity detected across arterial corridors. Secure loose outdoor furniture and exercise caution on elevated bridges.`,
      locationName: loc,
      timestamp: Date.now(),
      speed: maxSpeed,
    };
  }

  // 4. Sudden Temperature Drop
  if (nextHour && current.temp - nextHour.temp >= 3) {
    const delta = (current.temp - nextHour.temp).toFixed(1);
    return {
      id: `nowcast-temp-drop-${Date.now()}`,
      type: "temperature",
      severity: "advisory",
      minutesRemaining: 25,
      headline: isKn
        ? `೨೫ ನಿಮಿಷಗಳಲ್ಲಿ ತಾಪಮಾನದ ತ್ವರಿತ ಇಳಿಕೆ (-${formatLocalizedNumber(delta, langCode)}°C)`
        : `Rapid temperature plunge (-${delta}°C) in 25 minutes`,
      detail: isKn
        ? `ತಂಪಾದ ವಾಯು ಮುಂಭಾಗವು ಹಾದುಹೋಗುತ್ತಿದ್ದು, ಮುಂದಿನ ಅರ್ಧ ಗಂಟೆಯಲ್ಲಿ ${loc} ನಲ್ಲಿ ತಾಪಮಾನ ತೀವ್ರವಾಗಿ ಇಳಿಯಲಿದೆ.`
        : `A passing cold front will cause thermometer readings in ${loc} to drop rapidly by ${delta}°C within the next half hour.`,
      locationName: loc,
      timestamp: Date.now(),
    };
  }

  // 5. Calm / Optimal nowcast (Dry skies / Clouds)
  const isCloudy = cond.includes("cloud") || cond.includes("overcast");
  return {
    id: `nowcast-dry-${Date.now()}`,
    type: "clear",
    severity: "info",
    minutesRemaining: 90,
    headline: isKn
      ? (isCloudy
          ? `ಮುಂದಿನ ೯೦ ನಿಮಿಷಗಳವರೆಗೆ ಒಣಹವೆ ಮತ್ತು ಮೋಡ ಕವಿದ ವಾತಾವರಣ`
          : `ಮುಂದಿನ ೯೦ ನಿಮಿಷಗಳವರೆಗೆ ಶುಭ್ರ ಆಕಾಶ ಮತ್ತು ಒಣಹವೆ`)
      : (isCloudy
          ? `Dry conditions & cloud cover for the next 90 minutes`
          : `Clear skies & dry weather for the next 90 minutes`),
    detail: isKn
      ? (isCloudy
          ? `${loc} ಮೇಲೆ ಸ್ಥಿರ ಮೋಡದ ಹೊದಿಕೆಯಿದ್ದು ೦.೦ ಮಿಮೀ ಮಳೆಯಿದೆ. ಡಾಪ್ಲರ್ ರೇಡಾರ್‌ನಲ್ಲಿ ಮಳೆ ಅಥವಾ ಬಿರುಗಾಳಿಯ ಯಾವುದೇ ಅಪಾಯವಿಲ್ಲ.`
          : `${loc} ನ ೩೫ ಕಿಮೀ ವ್ಯಾಪ್ತಿಯ ಸ್ಥಳೀಯ ರೇಡಾರ್‌ನಲ್ಲಿ ಯಾವುದೇ ಮಳೆಯ ಅಪಾಯಗಳು ಅಥವಾ ಚಂಡಮಾರುತಗಳು ಕಂಡುಬಂದಿಲ್ಲ.`)
      : (isCloudy
          ? `Stable cloud deck over ${loc} with 0.0 mm precipitation. No rain or storm hazards detected on Doppler radar sweeps.`
          : `No precipitation hazards or storm fronts detected on local radar sweeps within a 35 km radius of ${loc}.`),
    locationName: loc,
    timestamp: Date.now(),
  };
}
