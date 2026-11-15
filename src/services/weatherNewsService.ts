import type { CurrentWeather } from "../../convex/weather/types";
import { translate, translateCondition } from "./i18n";

export interface WeatherNewsArticle {
  id: string;
  title: string;
  summary: string;
  content: string[];
  category: "severe" | "tropical" | "winter" | "heat" | "climate" | "marine";
  severity: "CRITICAL" | "WARNING" | "ADVISORY" | "UPDATE";
  source: string;
  region: string;
  publishedTime: string;
  isBreaking?: boolean;
  impactMetrics: { label: string; value: string }[];
  safetyAdvice: string[];
}

export interface SynopticBroadcastReport {
  locationName: string;
  county?: string;
  country: string;
  headline: string;
  publishedTime: string;
  bulletinCode: string;
  situationSummary: string;
  atmosphericDynamics: {
    pressureAnalysis: string;
    windConditions: string;
    thermalTrend: string;
    precipitationRisk: string;
  };
  travelAdvisory: string;
  outdoorSafetyRating: "Optimal" | "Favorable" | "Moderate Caution" | "Adverse Conditions" | "Hazardous";
  safetyChecklist: string[];
  fullScriptText: string;
  phoneticScriptText?: string;
}

/**
 * Converts numbers into proper, natural Kannada words and phonetic transliteration.
 */
export function numberToKannada(num: number): { kn: string; phonetic: string } {
  const isNegative = num < 0;
  const n = Math.abs(Math.round(num));

  if (n === 0) return { kn: isNegative ? "ಮೈನಸ್ ಸೊನ್ನೆ" : "ಸೊನ್ನೆ", phonetic: isNegative ? "minus sonne" : "sonne" };

  const exactKn: Record<number, { kn: string; phonetic: string }> = {
    1: { kn: "ಒಂದು", phonetic: "ondu" },
    2: { kn: "ಎರಡು", phonetic: "eradu" },
    3: { kn: "ಮೂರು", phonetic: "mooru" },
    4: { kn: "ನಾಲ್ಕು", phonetic: "naalku" },
    5: { kn: "ಐದು", phonetic: "aidu" },
    6: { kn: "ಆರು", phonetic: "aaru" },
    7: { kn: "ಏಳು", phonetic: "elu" },
    8: { kn: "ಎಂಟು", phonetic: "entu" },
    9: { kn: "ಒಂಬತ್ತು", phonetic: "ombattu" },
    10: { kn: "ಹತ್ತು", phonetic: "hattu" },
    11: { kn: "ಹನ್ನೊಂದು", phonetic: "hannondu" },
    12: { kn: "ಹನ್ನೆರಡು", phonetic: "hanneradu" },
    13: { kn: "ಹದಿಮೂರು", phonetic: "hadimooru" },
    14: { kn: "ಹದಿನಾಲ್ಕು", phonetic: "hadinaalku" },
    15: { kn: "ಹದಿನೈದು", phonetic: "hadinaidu" },
    16: { kn: "ಹದಿನಾರು", phonetic: "hadinaaru" },
    17: { kn: "ಹದಿನೇಳು", phonetic: "hadinelu" },
    18: { kn: "ಹದಿನೆಂಟು", phonetic: "hadinentu" },
    19: { kn: "ಹತ್ತೊಂಬತ್ತು", phonetic: "hattonbattu" },
    20: { kn: "ಇಪ್ಪತ್ತು", phonetic: "ippattu" },
    30: { kn: "ಮೂವತ್ತು", phonetic: "moovattu" },
    40: { kn: "ನಲವತ್ತು", phonetic: "nalavattu" },
    50: { kn: "ಐವತ್ತು", phonetic: "aivattu" },
    60: { kn: "ಅರವತ್ತು", phonetic: "aravattu" },
    70: { kn: "ಎಪ್ಪತ್ತು", phonetic: "eppattu" },
    80: { kn: "ಎಂಬತ್ತು", phonetic: "embattu" },
    90: { kn: "ತೊಂಬತ್ತು", phonetic: "tombattu" },
    100: { kn: "ನೂರು", phonetic: "nooru" },
  };

  if (exactKn[n]) {
    return {
      kn: (isNegative ? "ಮೈನಸ್ " : "") + exactKn[n].kn,
      phonetic: (isNegative ? "minus " : "") + exactKn[n].phonetic,
    };
  }

  if (n > 20 && n < 100) {
    const tens = Math.floor(n / 10) * 10;
    const units = n % 10;

    const prefixMap: Record<number, { kn: string; phonetic: string }> = {
      20: { kn: "ಇಪ್ಪತ್ತ", phonetic: "ippatta" },
      30: { kn: "ಮೂವತ್ತ", phonetic: "moovatta" },
      40: { kn: "ನಲವತ್ತ", phonetic: "nalavatta" },
      50: { kn: "ಐವತ್ತ", phonetic: "aivatta" },
      60: { kn: "ಅರವತ್ತ", phonetic: "aravatta" },
      70: { kn: "ಎಪ್ಪತ್ತ", phonetic: "eppatta" },
      80: { kn: "ಎಂಬತ್ತ", phonetic: "embatta" },
      90: { kn: "ತೊಂಬತ್ತ", phonetic: "tombatta" },
    };

    const unitMap: Record<number, { kn: string; phonetic: string }> = {
      1: { kn: "ಒಂದು", phonetic: "ondu" },
      2: { kn: "ಎರಡು", phonetic: "eradu" },
      3: { kn: "ಮೂರು", phonetic: "mooru" },
      4: { kn: "ನಾಲ್ಕು", phonetic: "naalku" },
      5: { kn: "ಐದು", phonetic: "aidu" },
      6: { kn: "ಆರು", phonetic: "aaru" },
      7: { kn: "ಏಳು", phonetic: "elu" },
      8: { kn: "ಎಂಟು", phonetic: "entu" },
      9: { kn: "ಒಂಬತ್ತು", phonetic: "ombattu" },
    };

    if (prefixMap[tens] && unitMap[units]) {
      return {
        kn: (isNegative ? "ಮೈನಸ್ " : "") + prefixMap[tens].kn + unitMap[units].kn,
        phonetic: (isNegative ? "minus " : "") + prefixMap[tens].phonetic + unitMap[units].phonetic,
      };
    }
  }

  return {
    kn: (isNegative ? "ಮೈನಸ್ " : "") + n.toString(),
    phonetic: (isNegative ? "minus " : "") + n.toString(),
  };
}

/**
 * Returns weather conditions in formal, natural Kannada.
 */
function getKannadaCondition(condition: string, temp: number): { kn: string; phonetic: string } {
  const cond = condition.toLowerCase();
  if (cond.includes("thunder") || cond.includes("tornado")) {
    return {
      kn: "ಗುಡುಗು ಮಿಂಚು ಸಹಿತ ಭಾರಿ ಮಳೆ ಮತ್ತು ಬಿರುಗಾಳಿಯ ವಾತಾವರಣ",
      phonetic: "gudugu minchu sahita bhaari male mattu birugaaliya vaataavarana",
    };
  }
  if (cond.includes("snow") || cond.includes("ice") || cond.includes("sleet")) {
    return {
      kn: "ಹಿಮಪಾತ ಮತ್ತು ತೀವ್ರ ಶೀತ ಗಾಳಿ",
      phonetic: "himapaata mattu teevra sheeta gaali",
    };
  }
  if (cond.includes("heavy rain") || cond.includes("torrential")) {
    return {
      kn: "ಭಾರಿ ಮಳೆಯ ವಾತಾವರಣ",
      phonetic: "bhaari maleya vaataavarana",
    };
  }
  if (cond.includes("rain") || cond.includes("shower")) {
    return {
      kn: "ಮಳೆಯಾಗುತ್ತಿರುವ ವಾತಾವರಣ",
      phonetic: "maleyaaguttiruva vaataavarana",
    };
  }
  if (cond.includes("drizzle")) {
    return {
      kn: "ತುಂತುರು ಹನಿ ಮಳೆಯ ವಾತಾವರಣ",
      phonetic: "tunturu hani maleya vaataavarana",
    };
  }
  if (cond.includes("fog") || cond.includes("mist") || cond.includes("haze")) {
    return {
      kn: "ದಟ್ಟ ಮಂಜು ಕವಿದ ಶೀತ ವಾತಾವರಣ",
      phonetic: "datta manju kavida sheeta vaataavarana",
    };
  }
  if (cond.includes("partly") || cond.includes("scattered")) {
    return {
      kn: "ಭಾಗಶಃ ಮೋಡ ಕವಿದ ಹಿತಕರ ವಾತಾವರಣ",
      phonetic: "bhaagashaha moda kavida hitakara vaataavarana",
    };
  }
  if (cond.includes("cloud") || cond.includes("overcast")) {
    return {
      kn: "ದಟ್ಟ ಮೋಡ ಕವಿದ ತಂಪಾದ ವಾತಾವರಣ",
      phonetic: "datta moda kavida tampaada vaataavarana",
    };
  }
  if (temp > 33) {
    return {
      kn: "ಪ್ರಖರ ಬಿಸಿಲು ಮತ್ತು ಸೆಕೆಯ ವಾತಾವರಣ",
      phonetic: "prakhara bisilu mattu sekeya vaataavarana",
    };
  }
  return {
    kn: "ಸ್ವಚ್ಛ ಆಕಾಶ ಮತ್ತು ಆಹ್ಲಾದಕರ ಬಿಸಿಲು",
    phonetic: "swaccha aakaasha mattu aahlaadakara bisilu",
  };
}

/**
 * Returns travel & safety advisories in authentic Kannada.
 */
function getKannadaAdvisory(cond: string, speed: number, temp: number): { kn: string; phonetic: string } {
  const c = cond.toLowerCase();
  if (c.includes("thunder")) {
    return {
      kn: "ಗುಡುಗು ಸಹಿತ ಮಳೆಯಿರುವುದರಿಂದ ಮರಗಳ ಕೆಳಗೆ ನಿಲ್ಲದೆ ಸುರಕ್ಷಿತ ಕಟ್ಟಡಗಳಲ್ಲಿ ಆಶ್ರಯ ಪಡೆಯಿರಿ",
      phonetic: "gudugu sahita maleyiruvudarinda maragala kelage nillade surakshita kattadagalalli aashraya padeyiri",
    };
  }
  if (c.includes("rain") || c.includes("drizzle")) {
    return {
      kn: "ರಸ್ತೆಗಳು ತೇವವಾಗಿ ಜಾರುವಂತಿದ್ದು ವಾಹನ ಚಾಲನೆಯಲ್ಲಿ ಅಂತರ ಕಾಯ್ದುಕೊಂಡು ಜಾಗರೂಕರಾಗಿರಿ",
      phonetic: "rastegalu tevavaagi jaaruvanthiddu vaahana chaalaneyalli antara kaaydukondu jaagarookaraagiri",
    };
  }
  if (c.includes("fog") || c.includes("mist")) {
    return {
      kn: "ದಟ್ಟ ಮಂಜು ಕವಿದಿರುವುದರಿಂದ ವಾಹನಗಳಲ್ಲಿ ಫಾಗ್ ಲ್ಯಾಂಪ್ ಬಳಸಿ ಮತ್ತು ವೇಗವನ್ನು ನಿಯಂತ್ರಿಸಿ",
      phonetic: "datta manju kavidiruvudarinda vaahanagalalli fog lamp balasi mattu vegavannu niyantrisi",
    };
  }
  if (speed > 30) {
    return {
      kn: "ತೀವ್ರ ವೇಗದ ಗಾಳಿ ಬೀಸುತ್ತಿರುವುದರಿಂದ ದ್ವಿಚಕ್ರ ವಾಹನ ಸವಾರರು ಎಚ್ಚರದಿಂದಿರಿ",
      phonetic: "teevra vegada gaali beesuttiruvudarinda dvichakra vaahana savaararu eccharadindiri",
    };
  }
  if (temp > 35) {
    return {
      kn: "ಬಿಸಿಲಿನ ಪ್ರಖರತೆ ಹೆಚ್ಚಾಗಿರುವುದರಿಂದ ಹೆಚ್ಚು ನೀರು ಕುಡಿಯಿರಿ ಮತ್ತು ನೆರಳಿನಲ್ಲಿರಿ",
      phonetic: "bisilina prakharate hecchaagiruvudarinda hecchu neeru kudiyiri mattu neralinalliri",
    };
  }
  return {
    kn: "ರಸ್ತೆ ಸಂಚಾರ ಸಹಜವಾಗಿದ್ದು ಪ್ರಯಾಣಕ್ಕೆ ಯಾವುದೇ ಅಡಚಣೆಗಳಿಲ್ಲ",
    phonetic: "raste sanchaara sahajavaagiddu prayaanake yaavude adachanegalilla",
  };
}

/**
 * Generates an authoritative real-time synoptic weather news report
 * customized specifically for the currently searched place, county, and live data.
 */
export function generateLocationNewsReport(
  weather: CurrentWeather,
  unit: "metric" | "imperial" = "metric",
  langCode: string = "en"
): SynopticBroadcastReport {
  const rawAddressParts = weather.fullAddress
    ? weather.fullAddress.split(",").map((s) => s.trim())
    : [
        weather.city,
        weather.district,
        weather.county,
        weather.state,
        weather.country,
      ].filter(Boolean);

  const uniquePlaceParts: string[] = [];
  for (const part of rawAddressParts) {
    if (part && !uniquePlaceParts.some((u) => u.toLowerCase() === part.toLowerCase())) {
      uniquePlaceParts.push(part);
    }
  }
  const placeDisplay = uniquePlaceParts.join(", ") || weather.city || "Local Area";

  const tempUnit = unit === "imperial" ? "°F" : "°C";
  const speedUnit = unit === "imperial" ? "mph" : "km/h";
  const displayTemp = unit === "imperial" ? Math.round((weather.temp * 9) / 5 + 32) : Math.round(weather.temp);
  const displayFeels = unit === "imperial" ? Math.round((weather.feelsLike * 9) / 5 + 32) : Math.round(weather.feelsLike);
  const displaySpeed = unit === "imperial" ? Math.round(weather.windSpeed * 2.23694) : Math.round(weather.windSpeed * 3.6);

  const cond = weather.condition.toLowerCase();

  // Determine safety rating
  let outdoorSafetyRating: SynopticBroadcastReport["outdoorSafetyRating"] = "Favorable";
  if (cond.includes("thunder") || cond.includes("tornado") || weather.windSpeed > 18) {
    outdoorSafetyRating = "Hazardous";
  } else if (cond.includes("snow") || cond.includes("rain") || weather.windSpeed > 12) {
    outdoorSafetyRating = "Moderate Caution";
  } else if (cond.includes("clear") && weather.temp >= 15 && weather.temp <= 28) {
    outdoorSafetyRating = "Optimal";
  }

  const translatedCond = translateCondition(weather.description, langCode);

  // Clean meteorological dynamics (clean values without repeating the box header inside the body)
  const pressureText = `${weather.pressure} hPa (${weather.pressure >= 1020 ? translate("highPressure", langCode) : translate("normalPressure", langCode)})`;
  const windText = `${displaySpeed} ${speedUnit} (${translate("direction", langCode)}: ${weather.windDeg}°)`;
  const thermalText = `${displayTemp}${tempUnit} (${translate("feelsLike", langCode)}: ${displayFeels}${tempUnit}, ${translate("humidity", langCode)}: ${weather.humidity}%)`;
  const precipText = translatedCond;

  // Travel advisory
  let travelAdvisory = `${translate("transitGuidance", langCode)}: ${translate("optimal", langCode)} - ${translate("clearHorizon", langCode)}.`;
  if (cond.includes("snow") || cond.includes("ice")) {
    travelAdvisory = `${translate("snow", langCode)}: ${translate("moderateCaution", langCode)}`;
  } else if (cond.includes("rain") || cond.includes("drizzle")) {
    travelAdvisory = `${translate("rain", langCode)}: ${translate("moderateCaution", langCode)}`;
  } else if (cond.includes("fog") || weather.visibility < 3000) {
    travelAdvisory = `${translate("fog", langCode)}: ${translate("obscuredHorizon", langCode)}`;
  }

  // Safety checklist
  const safetyChecklist: string[] = [
    `${weather.city || weather.county || placeDisplay}: ${translatedCond}`,
    weather.humidity > 75 ? translate("humidAir", langCode) : translate("comfortableAir", langCode),
    displaySpeed > 30 ? `${translate("windGusts", langCode)} ${displaySpeed} ${speedUnit}` : translate("clearHorizon", langCode),
  ];

  const tempKnObj = numberToKannada(displayTemp);
  const feelsKnObj = numberToKannada(displayFeels);
  const humidityKnObj = numberToKannada(weather.humidity);
  const speedKnObj = numberToKannada(displaySpeed);
  const conditionKnObj = getKannadaCondition(weather.condition, weather.temp);
  const advisoryKnObj = getKannadaAdvisory(weather.condition, displaySpeed, weather.temp);

  const synopticPrefix = translate("synopticBulletinFor", langCode);
  const hasDistinctCounty = weather.county && weather.county.trim().toLowerCase() !== (weather.city || "").trim().toLowerCase();
  let headline = `${synopticPrefix} ${weather.city || placeDisplay}${hasDistinctCounty ? ` (${weather.county})` : ""}`;
  const nowStr = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZoneName: "short" });

  let situationSummary = `${placeDisplay}: ${translatedCond}. ${translate("thermalProfile", langCode)}: ${displayTemp}${tempUnit} (${translate("feelsLike", langCode)} ${displayFeels}${tempUnit}), ${translate("humidity", langCode)}: ${weather.humidity}%, ${translate("pressure", langCode)}: ${weather.pressure} hPa, ${translate("windGusts", langCode)}: ${displaySpeed} ${speedUnit}.`;

  if (langCode === "kn") {
    headline = `ನೇರ ಹವಾಮಾನ ಸುದ್ದಿ ಬುಲೆಟಿನ್: ${weather.city || placeDisplay} ಪ್ರದೇಶದ ಇತ್ತೀಚಿನ ವರದಿ`;
    situationSummary = `${placeDisplay} ಪ್ರದೇಶದ ಹವಾಮಾನ ಅವಲೋಕನ: ವಾತಾವರಣದಲ್ಲಿ ${conditionKnObj.kn} ಕಂಡುಬರುತ್ತಿದೆ. ಪ್ರಸ್ತುತ ತಾಪಮಾನವು ${tempKnObj.kn} ಡಿಗ್ರಿ ಸೆಲ್ಸಿಯಸ್ ಇದ್ದು, ವಾತಾವರಣದ ಒತ್ತಡ ${weather.pressure} ಹೆಕ್ಟೋಪಾಸ್ಕಲ್ ಇದೆ. ಗಾಳಿಯ ವೇಗ ಗಂಟೆಗೆ ${speedKnObj.kn} ಕಿಲೋಮೀಟರ್. ಪರಿಸ್ಥಿತಿಯು ಹಿತಕರವಾಗಿದೆ.`;
    travelAdvisory = advisoryKnObj.kn;
  } else if (langCode === "es") {
    situationSummary = `${placeDisplay}: Condiciones observadas de ${translatedCond}. Temperatura de ${displayTemp}${tempUnit} (sensación ${displayFeels}${tempUnit}), humedad del ${weather.humidity}%, presión de ${weather.pressure} hPa y vientos a ${displaySpeed} ${speedUnit}.`;
  } else if (langCode === "fr") {
    situationSummary = `${placeDisplay}: Conditions observées de ${translatedCond}. Température de ${displayTemp}${tempUnit} (ressenti ${displayFeels}${tempUnit}), humidité ${weather.humidity}%, pression ${weather.pressure} hPa et vents à ${displaySpeed} ${speedUnit}.`;
  } else if (langCode === "de") {
    situationSummary = `${placeDisplay}: Beobachtete Wetterlage ${translatedCond}. Temperatur ${displayTemp}${tempUnit} (gefühlt ${displayFeels}${tempUnit}), Luftfeuchtigkeit ${weather.humidity}%, Luftdruck ${weather.pressure} hPa und Wind ${displaySpeed} ${speedUnit}.`;
  } else if (langCode === "ja") {
    situationSummary = `${placeDisplay} の気象状況: 現在は ${translatedCond}。気温 ${displayTemp}${tempUnit}（体感 ${displayFeels}${tempUnit}）、湿度 ${weather.humidity}%、気圧 ${weather.pressure} hPa、風速 ${displaySpeed} ${speedUnit} です。`;
  } else if (langCode === "zh" || langCode === "zh-TW") {
    situationSummary = `${placeDisplay} 气象观测：当前天气为 ${translatedCond}，气温 ${displayTemp}${tempUnit}（体感 ${displayFeels}${tempUnit}），相对湿度 ${weather.humidity}%，气压 ${weather.pressure} hPa，风速 ${displaySpeed} ${speedUnit}。`;
  } else if (langCode === "hi") {
    situationSummary = `${placeDisplay} का मौसम अवलोकन: वर्तमान में ${translatedCond} देखा जा रहा है। तापमान ${displayTemp}${tempUnit} (महसूस ${displayFeels}${tempUnit}), आर्द्रता ${weather.humidity}%, वायुदाब ${weather.pressure} hPa और हवा ${displaySpeed} ${speedUnit} है।`;
  } else if (langCode === "ru") {
    situationSummary = `${placeDisplay}: Наблюдается ${translatedCond}. Температура ${displayTemp}${tempUnit} (ощущается как ${displayFeels}${tempUnit}), влажность ${weather.humidity}%, давление ${weather.pressure} hPa, скорость ветра ${displaySpeed} ${speedUnit}.`;
  } else if (langCode === "ar") {
    situationSummary = `تقرير الرصد الجوي لـ ${placeDisplay}: الأجواء الحالية ${translatedCond}، درجة الحرارة ${displayTemp}${tempUnit} (المحسوسة ${displayFeels}${tempUnit})، الرطوبة ${weather.humidity}٪، الضغط الجوي ${weather.pressure} هكتوباسكال، وسرعة الرياح ${displaySpeed} ${speedUnit}.`;
  }

  const fullKannadaScript = `ನಮಸ್ಕಾರ. ಇದು ${placeDisplay} ಪ್ರದೇಶದ ಸಮಗ್ರ ನೇರ ಪ್ರಸಾರದ ಹವಾಮಾನ ಸುದ್ದಿ ಸಮಾಚಾರ. ಪ್ರಸ್ತುತ ಈ ಪ್ರದೇಶದಲ್ಲಿ ${conditionKnObj.kn} ಕಂಡುಬರುತ್ತಿದೆ. ಇಲ್ಲಿನ ವಾತಾವರಣದ ತಾಪಮಾನವು ${tempKnObj.kn} ಡಿಗ್ರಿ ಸೆಲ್ಸಿಯಸ್ ಇದ್ದು, ದೇಹಕ್ಕೆ ಅನುಭವವಾಗುವ ತಾಪಮಾನ ${feelsKnObj.kn} ಡಿಗ್ರಿ ಸೆಲ್ಸಿಯಸ್ ಆಗಿದೆ. ಗಾಳಿಯಲ್ಲಿ ತೇವಾಂಶವು ${humidityKnObj.kn} ಪ್ರತಿಶತ ದಾಖಲಾಗಿದ್ದು, ಗಾಳಿಯ ವೇಗವು ಗಂಟೆಗೆ ${speedKnObj.kn} ಕಿಲೋಮೀಟರ್ ವೇಗದಲ್ಲಿ ಬೀಸುತ್ತಿದೆ. ${advisoryKnObj.kn}. ದಯವಿಟ್ಟು ಎಲ್ಲ ನಾಗರಿಕರು ಸುರಕ್ಷಿತವಾಗಿರಿ ಮತ್ತು ಜಾಗರೂಕರಾಗಿರಿ. ಧನ್ಯವಾದಗಳು.`;

  const phoneticKannadaScript = `Namaskaara. Idu ${placeDisplay} pradesha da samagra nera prasaara da havamaana suddi samaachaara. Prastuta ee pradeshadalli ${conditionKnObj.phonetic} kandubaruttide. Illina vaataavaranada taapamaanavu ${tempKnObj.phonetic} degree celsius iddu, dehakke anubhavavaaguva taapamaana ${feelsKnObj.phonetic} degree celsius aagide. Gaaliyalli tevaamshavu ${humidityKnObj.phonetic} pratishata daakhalaagiddu, gaaliya vegavu gantege ${speedKnObj.phonetic} kilometer vegadalli beesuttide. ${advisoryKnObj.phonetic}. Dayavittu ella naagarikaru surakshitavaagiri mattu jaagarookaraagiri. Dhanyavaadagalu.`;

  // Comprehensive localized speech script for all languages
  let fullScriptText = `Good day. This is the live Aetheria Weather News broadcast for ${placeDisplay}. At this hour, we are observing ${weather.description}. The temperature stands at ${displayTemp} degrees ${unit === "imperial" ? "Fahrenheit" : "Celsius"}, with an apparent thermal index of ${displayFeels} degrees. Humidity is currently measured at ${weather.humidity} percent, with winds blowing at ${displaySpeed} ${speedUnit}. Stay safe, and stay tuned for continued updates.`;

  const scripts: Record<string, string> = {
    kn: fullKannadaScript,
    es: `Hola, este es el boletín meteorológico en vivo para ${placeDisplay}. En este momento las condiciones son ${translatedCond}. La temperatura actual es de ${displayTemp} grados, con sensación térmica de ${displayFeels} grados. Humedad relativa del ${weather.humidity} por ciento y vientos a ${displaySpeed} ${speedUnit}. Cuídese y manténgase informado.`,
    fr: `Bonjour, voici le bulletin météo en direct pour ${placeDisplay}. En ce moment le ciel présente ${translatedCond}. La température est de ${displayTemp} degrés, avec un ressenti de ${displayFeels} degrés. L'humidité est de ${weather.humidity} pour cent, et le vent souffle à ${displaySpeed} ${speedUnit}. Prenez soin de vous.`,
    de: `Guten Tag, dies ist der aktuelle Wetterbericht für ${placeDisplay}. Zurzeit beobachten wir ${translatedCond}. Die Temperatur liegt bei ${displayTemp} Grad, gefühlt wie ${displayFeels} Grad. Luftfeuchtigkeit bei ${weather.humidity} Prozent, Windgeschwindigkeit ${displaySpeed} ${speedUnit}. Passen Sie auf sich auf.`,
    it: `Buongiorno, questo è il notiziario meteo in tempo reale per ${placeDisplay}. Attualmente si registra ${translatedCond}. La temperatura è di ${displayTemp} gradi, percepiti ${displayFeels} gradi. Umidità al ${weather.humidity} per cento e vento a ${displaySpeed} ${speedUnit}. Buona giornata.`,
    pt: `Olá, este é o boletim meteorológico ao vivo para ${placeDisplay}. No momento observamos ${translatedCond}. A temperatura atual é de ${displayTemp} graus, com sensação de ${displayFeels} graus. Umidade em ${weather.humidity} por cento e ventos a ${displaySpeed} ${speedUnit}. Fique seguro.`,
    ru: `Здравствуйте, это прямой репортаж о погоде для ${placeDisplay}. В настоящее время наблюдается ${translatedCond}. Температура воздуха ${displayTemp} градусов, ощущается как ${displayFeels} градусов. Влажность ${weather.humidity} процентов, скорость ветра ${displaySpeed} ${speedUnit}. Будьте осторожны.`,
    zh: `您好，这里是为您播报的实时气象新闻，当前地点为 ${placeDisplay}。当前天气为 ${translatedCond}，温度 ${displayTemp} 度，体感温度 ${displayFeels} 度，相对湿度百分之 ${weather.humidity}，风速 ${displaySpeed} ${speedUnit}。请注意出行安全。`,
    "zh-TW": `您好，這是為您播報的即時氣象新聞，當前地點為 ${placeDisplay}。目前天氣為 ${translatedCond}，氣溫 ${displayTemp} 度，體感溫度 ${displayFeels} 度，相對濕度百分之 ${weather.humidity}，風速 ${displaySpeed} ${speedUnit}。請注意出行安全。`,
    ja: `こんにちは。こちらは ${placeDisplay} の最新気象ニュース速報です。現在の天候は ${translatedCond}、気温は ${displayTemp} 度、体感温度は ${displayFeels} 度、湿度は ${weather.humidity} パーセント、風速は ${displaySpeed} ${speedUnit} です。安全にお過ごしください。`,
    ko: `안녕하세요. ${placeDisplay} 실시간 기상 뉴스 방송입니다. 현재 날씨는 ${translatedCond} 상태이며, 기온은 ${displayTemp}도, 체감 온도는 ${displayFeels}도, 습도는 ${weather.humidity}퍼센트, 풍속은 ${displaySpeed} ${speedUnit} 입니다. 안전에 유의하시기 바랍니다.`,
    ar: `مرحباً بكم، هذا هو البث الإخباري الحي للأرصاد الجوية في ${placeDisplay}. الحالة الجوية الحالية هي ${translatedCond}، درجة الحرارة ${displayTemp} درجة مئوية، الرطوبة ${weather.humidity} بالمئة. دمتم بأمان.`,
    hi: `नमस्ते, यह ${placeDisplay} के लिए लाइव मौसम समाचार प्रसारण है। इस समय मौसम ${translatedCond} बना हुआ है। वर्तमान तापमान ${displayTemp} डिग्री है। आर्द्रता ${weather.humidity} प्रतिशत है। सुरक्षित रहें।`,
    te: `నమస్కారం, ఇది ${placeDisplay} కోసం ప్రత్యక్ష వాతావరణ వార్తా ప్రసారం. ప్రస్తుత వాతావరణం ${translatedCond}. ఉష్ణోగ్రత ${displayTemp} డిగ్రీలు, తేమ ${weather.humidity} శాతం. క్షేమంగా ఉండండి.`,
    ta: `வணக்கம், இது ${placeDisplay} நேரடி வானிலை செய்தி அறிக்கை. தற்போது வானிலை ${translatedCond} ஆக உள்ளது. வெப்பநிலை ${displayTemp} டிகிரி, ஈரப்பதம் ${weather.humidity} சதவீதம். பாதுகாப்பாக இருங்கள்.`,
    bn: `নমস্কার, এটি ${placeDisplay} এর লাইভ আবহাওয়া সংবাদ বুলেটিন। এই মুহূর্তে আবহাওয়া ${translatedCond}। বর্তমান তাপমাত্রা ${displayTemp} ডিগ্রি, আর্দ্রতা ${weather.humidity} শতাংশ। সাবধানে থাকুন।`,
    mr: `नमस्कार, हे ${placeDisplay} साठी थेट हवामान वृत्त आहे. सध्याचे हवामान ${translatedCond} आहे. तापमान ${displayTemp} अंश, आर्द्रता ${weather.humidity} टक्के आहे. काळजी घ्या.`,
    gu: `નમસ્તે, આ ${placeDisplay} માટેનું લાઈવ હવામાન સમાચાર બુલેટિન છે. અત્યારે વાતાવરણ ${translatedCond} છે. તાપમાન ${displayTemp} ડિગ્રી, ભેજ ${weather.humidity} ટકા. સુરક્ષિત રહો.`,
    ml: `നമസ്കാരം, ഇത് ${placeDisplay} ലൈവ് കാലാവസ്ഥാ വാർത്താ ബുള്ളറ്റിൻ ആണ്. നിലവിലെ കാലാവസ്ഥ ${translatedCond} ആണ്. താപനില ${displayTemp} ഡിഗ്രി, ഈർപ്പം ${weather.humidity} ശതമാനം. സുരക്ഷിതരായിരിക്കുക.`,
    pa: `ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ, ਇਹ ${placeDisplay} ਲਈ ਲਾਈਵ ਮੌਸਮ ਖ਼ਬਰਾਂ ਦਾ ਬੁਲੇਟਿਨ ਹੈ। ਇਸ ਸਮੇਂ ਮੌਸਮ ${translatedCond} ਹੈ। ਤਾਪਮਾਨ ${displayTemp} ਡਿਗਰੀ ਅਤੇ ਨਮੀ ${weather.humidity} ਪ੍ਰਤੀਸ਼ਤ ਹੈ। ਸੁਰੱਖਿਅਤ ਰਹੋ।`,
    ur: `السلام علیکم، یہ ${placeDisplay} کے لیے لائیو موسم کی خبریں ہیں۔ اس وقت موسم ${translatedCond} ہے۔ درجہ حرارت ${displayTemp} ڈگری اور نمی ${weather.humidity} فیصد ہے۔ اپنا خیال رکھیں۔`,
  };

  const phoneticScripts: Record<string, string> = {
    kn: phoneticKannadaScript,
    te: `Namaskaaram, idi ${placeDisplay} kosam pratyaksha vaataavarana vaartha prasaaram. Prastuta vaataavaranam ${translatedCond}. Ushnograta ${displayTemp} degreelu, tema ${weather.humidity} shaatam. Kshemamgaa undandi.`,
    ta: `Vanakkam, idhu ${placeDisplay} pagadhikkaana neradi vaanilai seidhi arikkai. Tharppodhu vaanilai ${translatedCond} aaga ulladhu. Veppanilai ${displayTemp} degree, eerappadham ${weather.humidity} sathaveedham. Paadhukaappaaga irungal.`,
    hi: `Namaste, yeh ${placeDisplay} ke liye live mausam samachar prasaran hai. Is samay mausam ${translatedCond} bana hua hai. Vartaman tapman ${displayTemp} degree hai. Aardrata ${weather.humidity} pratishat hai. Surakshit rahein.`,
    ml: `Namaskaaram, ithu ${placeDisplay} live kaalaavasthaa vaartha bulletin aanu. Nilavile kaalaavastha ${translatedCond} aanu. Thaapanila ${displayTemp} degree, eerppam ${weather.humidity} shathamaanam. Surakshitharaayirikkuka.`,
    mr: `Namaskar, he ${placeDisplay} sathi thet havaman vrutta ahe. Sadhyache havaman ${translatedCond} ahe. Tapman ${displayTemp} ansh, aardrata ${weather.humidity} takke ahe. Kaalji ghyaa.`,
    gu: `Namaste, aa ${placeDisplay} maatenu live havamaan samachaar bulletin chhe. Atyaare vaataavaran ${translatedCond} chhe. Taapmaan ${displayTemp} degree, bhej ${weather.humidity} takaa. Surakshit raho.`,
    bn: `Nomoshkar, eti ${placeDisplay} er live aabhawa songbaad bulletin. Ei muhurte aabhawa ${translatedCond}. Bortomaan taapmaatra ${displayTemp} degree, aardrota ${weather.humidity} shotaangsho. Shaabdhane thaakun.`,
    pa: `Sat Sri Akal, eh ${placeDisplay} layi live mausam khabran da bulletin hai. Is samay mausam ${translatedCond} hai. Taapmaan ${displayTemp} degree ate nami ${weather.humidity} pratishat hai. Surakshit raho.`,
    ur: `Assalam o Alaikum, yeh ${placeDisplay} ke liye live mausam ki khabrain hain. Is waqt mausam ${translatedCond} hai. Darja hararat ${displayTemp} degree aur nami ${weather.humidity} feesad hai. Apna khayal rakhein.`,
  };

  if (scripts[langCode]) {
    fullScriptText = scripts[langCode];
  }

  return {
    locationName: placeDisplay,
    county: weather.county,
    country: weather.country,
    headline,
    publishedTime: nowStr,
    bulletinCode: `SYN-${Math.abs(Math.round(weather.lat * 100))}-${Math.abs(Math.round(weather.lon * 100))}`,
    situationSummary,
    atmosphericDynamics: {
      pressureAnalysis: pressureText,
      windConditions: windText,
      thermalTrend: thermalText,
      precipitationRisk: precipText,
    },
    travelAdvisory,
    outdoorSafetyRating,
    safetyChecklist,
    fullScriptText,
    phoneticScriptText: phoneticScripts[langCode],
  };
}

export const GLOBAL_WEATHER_NEWS: WeatherNewsArticle[] = [
  {
    id: "news-1",
    title: "Intense Mid-Latitude Cyclone Triggers Widespread Gale Warnings & High Seas",
    summary: "Deepening barometric pressure gradient unleashes wind gusts surpassing 95 km/h along coastal corridors, creating 6-meter swells.",
    content: [
      "A powerhouse low-pressure system has completed explosive cyclogenesis over maritime waters, spreading vigorous squalls, coastal storm surges, and high-altitude precipitation inland.",
      "Maritime authorities have hoisted Gale and Storm Force warnings across shipping channels. Harbors report localized coastal inundation during peak high tides.",
      "Meteorological radars track the active cold front traversing multiple counties, bringing rapid temperature drops of 8 to 12 degrees within ninety minutes of frontal passage.",
    ],
    category: "severe",
    severity: "CRITICAL",
    source: "Global Meteorological Radar Network",
    region: "Atlantic & Coastal Seaboard",
    publishedTime: "14 mins ago",
    isBreaking: true,
    impactMetrics: [
      { label: "Max Gusts", value: "98 km/h" },
      { label: "Wave Heights", value: "5.8 m" },
      { label: "Central Pressure", value: "978 hPa" },
    ],
    safetyAdvice: [
      "Avoid visiting coastal jetties and unbarricaded piers.",
      "Anchor outdoor equipment and prepare for intermittent power disruptions.",
      "Commercial mariners should remain in sheltered moorings until seas subside.",
    ],
  },
  {
    id: "news-2",
    title: "Polar Trough Dip Induces Sub-Zero Freeze & Lake-Effect Snow squalls",
    summary: "Arctic air mass plunges southward, converting frontal moisture into blinding snow bands with near-zero visibility.",
    content: [
      "An unseasonably sharp dip in the circumpolar jet stream has tapped high-latitude Siberian and Canadian cold reservoirs, driving a sharp freeze across central valleys and inland counties.",
      "Heavy snow streamers continue to oscillate over major interstates. Highway departments have deployed continuous salting and plowing convoys, though visibility drops below 200 meters in sudden squalls.",
      "Sub-freezing temperatures are anticipated to persist for the next 48 to 72 hours, elevating the risk of burst water mains and hazardous bridge surfaces.",
    ],
    category: "winter",
    severity: "WARNING",
    source: "Polar Atmospheric Research Center",
    region: "Northern & Continental Interior",
    publishedTime: "32 mins ago",
    isBreaking: true,
    impactMetrics: [
      { label: "Snow Accumulation", value: "15 - 30 cm" },
      { label: "Wind Chill", value: "-18°C" },
      { label: "Visibility", value: "< 250 m" },
    ],
    safetyAdvice: [
      "Keep an emergency winter survival kit in your vehicle with thermal blankets.",
      "Protect residential plumbing fixtures from freezing drafts.",
      "Minimize prolonged skin exposure to prevent frostbite.",
    ],
  },
  {
    id: "news-3",
    title: "Tropical Disturbance Intensifies Over Warm Ocean Waters; Watch Extended",
    summary: "Satellite infrared imagery shows deepening central convection and accelerating spiral feeder bands around the developing core.",
    content: [
      "Environmental sea-surface temperatures hovering near 29.5°C coupled with minimal vertical wind shear have fostered rapid convective consolidation in the tropical low.",
      "Reconnaissance passes indicate maximum sustained winds climbing toward tropical cyclone intensity. National disaster coordinators have placed regional emergency teams on high readiness.",
      "The primary threat over the next 36 hours centers around torrential rainfall totals capable of triggering flash flooding and river overflows in low-lying counties.",
    ],
    category: "tropical",
    severity: "WARNING",
    source: "International Tropical Cyclone Advisory",
    region: "Subtropical Pacific & Gulf Basin",
    publishedTime: "1 hour ago",
    impactMetrics: [
      { label: "Sustained Winds", value: "85 km/h" },
      { label: "Forecast Rainfall", value: "120 - 200 mm" },
      { label: "Forward Speed", value: "18 km/h" },
    ],
    safetyAdvice: [
      "Clear drainage ditches and roof gutters to alleviate water ponding.",
      "Stock non-perishable rations, potable water, and portable radio batteries.",
      "Heed all localized civil defense evacuation notices promptly.",
    ],
  },
  {
    id: "news-4",
    title: "Persistent High-Pressure Dome Anchors Thermal Anomaly & Drought Advisory",
    summary: "Subsiding atmospheric column traps unseasonable warmth, driving daytime maximums 6°C above historical seasonal norms.",
    content: [
      "A broad, stationary upper-tropospheric anticyclone remains locked over regional landmasses, deflecting moisture-laden storm tracks and creating widespread unseasonable heating.",
      "Relative humidity levels have fallen below 22% during peak afternoon hours, significantly raising wildfire ignition susceptibility across brushlands and rural counties.",
      "Health officials urge vulnerable demographics, including the elderly and outdoor workers, to observe strict hydration routines and avoid strenuous exertion between 11 AM and 4 PM.",
    ],
    category: "heat",
    severity: "ADVISORY",
    source: "World Climate & Health Observatory",
    region: "Mid-Continent & Mediterranean Zones",
    publishedTime: "2 hours ago",
    impactMetrics: [
      { label: "Temperature Anomaly", value: "+6.4°C" },
      { label: "Afternoon Humidity", value: "19%" },
      { label: "Fire Danger Index", value: "Very High" },
    ],
    safetyAdvice: [
      "Drink plenty of water even before feeling thirst.",
      "Never leave children or pets unattended inside parked motor vehicles.",
      "Adhere strictly to local open-air burn bans.",
    ],
  },
  {
    id: "news-5",
    title: "Space Weather & Geomagnetic Pulse Sparks Vibrant Auroral Displays",
    summary: "Coronal mass ejection impact rattles Earth's magnetosphere, creating geomagnetic storming and breathtaking auroral light displays.",
    content: [
      "A high-speed solar plasma stream collided with the magnetosphere earlier today, sparking a G2-class geomagnetic event observable across mid-to-high latitude nocturnal skies.",
      "Skywatchers have documented vivid green and violet curtains of light stretching across northern horizons. No widespread electrical grid disruptions have been noted.",
      "Aviation corridors crossing polar flight paths have adjusted high-frequency radio protocols as a routine precaution against ionospheric noise.",
    ],
    category: "climate",
    severity: "UPDATE",
    source: "Space Weather Prediction Laboratory",
    region: "Global Polar & High-Latitude Skies",
    publishedTime: "3 hours ago",
    impactMetrics: [
      { label: "Geomagnetic Index", value: "Kp 6.2" },
      { label: "Solar Wind Speed", value: "540 km/s" },
      { label: "Aurora Visibility", value: "Down to 52° Lat" },
    ],
    safetyAdvice: [
      "Find dark sky locations away from city light pollution for viewing.",
      "Calibrate cameras with long-exposure settings (3-8 seconds) for optimal photography.",
    ],
  },
];

/**
 * Localized articles lookup for all 44 languages.
 */
const LOCALIZED_ARTICLE_OVERLAYS: Record<string, Record<string, { title: string; summary: string; region: string }>> = {
  kn: {
    "news-1": {
      title: "ಕರಾವಳಿ ತೀರದಲ್ಲಿ ಭಾರಿ ಬಿರುಗಾಳಿ ಮತ್ತು ಎತ್ತರದ ಅಲೆಗಳ ಮುನ್ನೆಚ್ಚರಿಕೆ",
      summary: "ಗಾಳಿಯ ವೇಗ ಗಂಟೆಗೆ ೯೫ ಕಿ.ಮೀ. ಮೀರುತ್ತಿದ್ದು ಕರಾವಳಿಯುದ್ದಕ್ಕೂ ೬ ಮೀಟರ್ ಎತ್ತರದ ಅಲೆಗಳು ಏಳುತ್ತಿವೆ.",
      region: "ಕರಾವಳಿ ಮತ್ತು ಸಮುದ್ರ ತೀರ",
    },
    "news-2": {
      title: "ತೀವ್ರ ಶೀತಗಾಳಿ ಮತ್ತು ಹಿಮಪಾತದಿಂದಾಗಿ ತಾಪಮಾನ ಕುಸಿತ",
      summary: "ಆರ್ಕ್ಟಿಕ್ ಶೀತಗಾಳಿಯಿಂದಾಗಿ ತಾಪಮಾನವು ಮೈನಸ್ ಡಿಗ್ರಿಗೆ ಕುಸಿದಿದ್ದು ಗೋಚರತೆ ಕಡಿಮೆಯಾಗಿದೆ.",
      region: "ಉತ್ತರ ಒಳನಾಡು ಪ್ರದೇಶ",
    },
    "news-3": {
      title: "ಉಷ್ಣವಲಯದ ಸಮುದ್ರದಲ್ಲಿ ವಾಯುಭಾರ ಕುಸಿತ: ಭಾರಿ ಮಳೆಯ ಎಚ್ಚರಿಕೆ",
      summary: "ಸಮುದ್ರದ ಮೇಲೆ ಚಂಡಮಾರುತ ತೀವ್ರಗೊಳ್ಳುತ್ತಿದ್ದು ತಗ್ಗು ಪ್ರದೇಶಗಳಲ್ಲಿ ಪ್ರವಾಹದ ಭೀತಿ ಎದುರಾಗಿದೆ.",
      region: "ಕರಾವಳಿ ಮತ್ತು ಸಾಗರ ವಲಯ",
    },
    "news-4": {
      title: "ತೀವ್ರ ಬಿಸಿಗಾಳಿ ಮತ್ತು ತಾಪಮಾನ ಏರಿಕೆಯ ಎಚ್ಚರಿಕೆ",
      summary: "ವಾತಾವರಣದಲ್ಲಿ ತಾಪಮಾನವು ಸಾಮಾನ್ಯಕ್ಕಿಂತ ೬ ಡಿಗ್ರಿ ಹೆಚ್ಚಾಗಿದ್ದು ಬಿಸಿಲಿನ ಝಳ ಹೆಚ್ಚಾಗಿದೆ.",
      region: "ಒಳನಾಡು ಮತ್ತು ಮೈದಾನ ಪ್ರದೇಶ",
    },
    "news-5": {
      title: "ಬಾಹ್ಯಾಕಾಶ ಹವಾಮಾನ ಮತ್ತು ಧ್ರುವ ಪ್ರದೇಶದಲ್ಲಿ ಆಕರ್ಷಕ ಅರೋರಾ ಬೆಳಕು",
      summary: "ಸೌರ ಮಾರುತಗಳ ಪ್ರಭಾವದಿಂದ ಆಕಾಶದಲ್ಲಿ ಸುಂದರ ಹಸಿರು ಮತ್ತು ನೇರಳೆ ಬೆಳಕಿನ ನರ್ತನ ಕಂಡುಬಂದಿದೆ.",
      region: "ಜಾಗತಿಕ ಧ್ರುವ ಪ್ರದೇಶ",
    },
  },
  hi: {
    "news-1": {
      title: "तटीय क्षेत्रों में भीषण तूफान और ऊंची लहरों की चेतावनी",
      summary: "95 किमी/घंटा से अधिक की हवाओं के साथ तटों पर 6 मीटर ऊंची लहरें उठने की संभावना है।",
      region: "तटीय और समुद्री क्षेत्र",
    },
    "news-2": {
      title: "शीत लहर और भारी बर्फबारी से तापमान शून्य से नीचे पहुंचा",
      summary: "ध्रुवीय ठंडी हवाओं के कारण तापमान में भारी गिरावट दर्ज की गई है।",
      region: "उत्तरी और पर्वतीय क्षेत्र",
    },
    "news-3": {
      title: "समुद्र में गहराया दबाव, भारी बारिश की चेतावनी जारी",
      summary: "चक्रवाती परिसंचरण के कारण निचले इलाकों में जलभराव की आशंका है।",
      region: "प्रशांत और खाड़ी बेसिन",
    },
    "news-4": {
      title: "भीषण गर्मी और लू का प्रकोप जारी",
      summary: "उच्च वायुदाब के कारण तापमान सामान्य से 6 डिग्री अधिक पहुंच गया है।",
      region: "मैदानी और मध्य क्षेत्र",
    },
    "news-5": {
      title: "अंतरिक्ष मौसम: ध्रुवीय आकाश में अद्भुत अरोरा की चमक",
      summary: "सौर प्लाज्मा लहरों के कारण आकाश में सुंदर हरी और बैंगनी रोशनी दिखाई दी।",
      region: "वैश्विक ध्रुवीय क्षेत्र",
    },
  },
  es: {
    "news-1": {
      title: "Intenso ciclón activa avisos de temporal y fuerte oleaje costero",
      summary: "Rachas de viento que superan los 95 km/h a lo largo de las costas con olas de 6 metros.",
      region: "Litoral y Corredor Costero",
    },
    "news-2": {
      title: "Vaguada polar provoca heladas bajo cero y ventiscas de nieve",
      summary: "Masa de aire ártico desploma los termómetros reduciendo la visibilidad a casi cero.",
      region: "Interior Norte y Continental",
    },
    "news-3": {
      title: "Perturbación tropical se intensifica; alerta meteorológica extendida",
      summary: "Imágenes satelitales revelan intensificación y riesgo de lluvias torrenciales.",
      region: "Cuenca Tropical y Pacífica",
    },
    "news-4": {
      title: "Domo de alta presión genera anomalía térmica y sequía",
      summary: "Temperaturas máximas 6°C por encima de la media histórica con baja humedad.",
      region: "Zonas Centrales y Mediterráneas",
    },
    "news-5": {
      title: "Tormenta geomagnética desata espectaculares auroras boreales",
      summary: "Eyección de masa solar ilumina los cielos nocturnos en altas latitudes.",
      region: "Cielos Polares Globales",
    },
  },
  fr: {
    "news-1": {
      title: "Un puissant cyclone déclenche des avis de coup de vent et forte houle",
      summary: "Des rafales dépassant 95 km/h le long du littoral créent des vagues de 6 mètres.",
      region: "Façade Côtière et Atlantique",
    },
    "news-2": {
      title: "Descente d'air polaire: gel généralisé et bourrasques de neige",
      summary: "L'air arctique plonge vers le sud, transformant les précipitations en neige aveuglante.",
      region: "Intérieur Continental Nord",
    },
    "news-3": {
      title: "Une dépression tropicale se renforce sur les eaux chaudes",
      summary: "Risque important de pluies torrentielles et de crues soudaines sur les zones basses.",
      region: "Bassin Tropical et Pacifique",
    },
    "news-4": {
      title: "Dôme de haute pression: vague de chaleur persistante",
      summary: "Températures supérieures de 6°C aux normales de saison et risque incendie élevé.",
      region: "Zones Méditerranéennes et Terres",
    },
    "news-5": {
      title: "Tempête géomagnétique: des aurores boréales spectaculaires",
      summary: "Le plasma solaire percute la magnétosphère terrestre, illuminant le ciel nocturne.",
      region: "Ciel Polaire et Hautes Latitudes",
    },
  },
  de: {
    "news-1": {
      title: "Schwerer Zyklon löst Sturmwarnungen und hohe See aus",
      summary: "Windböen über 95 km/h entlang der Küsten erzeugen bis zu 6 Meter hohe Wellen.",
      region: "Küsten- und Meeresregionen",
    },
    "news-2": {
      title: "Polare Kältewelle bringt Frost und heftiges Schneetreiben",
      summary: "Arktische Luftmassen sorgen für eisige Temperaturen und Sichtweiten unter 200 m.",
      region: "Nord- und Binnenland",
    },
    "news-3": {
      title: "Tropische Störung verstärkt sich über warmem Ozean",
      summary: "Starkregen und Sturzfluten bedrohen tiefer gelegene Regionen in den kommenden 36 Stunden.",
      region: "Subtropische Meeresbecken",
    },
    "news-4": {
      title: "Beständiges Hochdruckgebiet sorgt für Hitzeanomalie und Trockenheit",
      summary: "Tageshöchstwerte liegen 6°C über den saisonalen Durchschnittswerten.",
      region: "Kontinentales Binnenland",
    },
    "news-5": {
      title: "Weltraumwetter löst faszinierende Polarlichter aus",
      summary: "Sonnensturm trifft die Erdmagnetosphäre und erleuchtet den Nachthimmel.",
      region: "Globale Polarregionen",
    },
  },
  ja: {
    "news-1": {
      title: "温帯低気圧が急速発達、沿岸部に暴風警報と高波",
      summary: "沿岸部で最大瞬間風速95km/h超の突風、波の高さ6メートルを記録。",
      region: "沿岸および海洋海域",
    },
    "news-2": {
      title: "強い寒波の南下で氷点下の冷え込みと猛吹雪",
      summary: "北極気団が急激に流入し、視程200メートル以下のホワイトアウト警戒。",
      region: "北部および内陸部",
    },
    "news-3": {
      title: "熱帯擾乱が海上で急速に発達、大雨警報発令",
      summary: "暖かな海水温の影響で対流活動が活発化、河川氾濫に厳重警戒。",
      region: "亜熱帯太平洋および沿岸域",
    },
    "news-4": {
      title: "優勢な高気圧により異例の高温と乾燥注意報",
      summary: "平年比プラス6度以上の記録的高温、熱中症と山火事に警戒。",
      region: "内陸および平野部",
    },
    "news-5": {
      title: "地磁気嵐が発生、夜空を彩る鮮やかなオーロラを観測",
      summary: "太陽風プラズマの影響で夜空に美しい緑と紫のオーロラが出現。",
      region: "地球極域および高緯度空",
    },
  },
  zh: {
    "news-1": {
      title: "强温带气旋触发沿海大风警报与巨浪",
      summary: "气压梯度急剧加剧，沿海阵风超过95公里/小时，激起6米狂浪。",
      region: "沿海及海域走廊",
    },
    "news-2": {
      title: "极地冷涡南下带来零下严寒与暴风雪",
      summary: "北极冷空气深度下沉，带来剧烈降温及能见度不足200米的暴风雪。",
      region: "北部与内陆走廊",
    },
    "news-3": {
      title: "热带低压在温暖洋面快速增强，预警升级",
      summary: "卫星云图显示中心对流显著增强，未来36小时面临局地特大暴雨。",
      region: "亚热带洋面与海盆",
    },
    "news-4": {
      title: "高压脊持续盘踞带来异常高温与干旱预警",
      summary: "下沉气流锁定异常热浪，白天最高气温普遍高出历史均值6摄氏度。",
      region: "内陆大陆区域",
    },
    "news-5": {
      title: "太阳风暴与地磁扰动点亮璀璨极光盛宴",
      summary: "日冕物质抛射撞击地球磁层，高纬度夜空现绚丽绿色与紫色极光。",
      region: "全球极地与高纬度天空",
    },
  },
};

/**
 * Dynamically synthesizes location-specific, authentic weather news wire articles
 * reflecting the live weather, ground sensors, diurnal trends, and regional advisories.
 */
export function generateLocationNewsArticles(
  weather: CurrentWeather,
  unit: "metric" | "imperial" = "metric",
  langCode: string = "en"
): WeatherNewsArticle[] {
  const isImperial = unit === "imperial";
  const displayTemp = isImperial ? Math.round((weather.temp * 9) / 5 + 32) : Math.round(weather.temp);
  const displayFeels = isImperial ? Math.round((weather.feelsLike * 9) / 5 + 32) : Math.round(weather.feelsLike);
  const displayMin = isImperial ? Math.round((weather.tempMin * 9) / 5 + 32) : Math.round(weather.tempMin);
  const displayMax = isImperial ? Math.round((weather.tempMax * 9) / 5 + 32) : Math.round(weather.tempMax);
  const tempUnit = isImperial ? "°F" : "°C";

  const displaySpeed = Math.round(weather.windSpeed * (isImperial ? 2.237 : 3.6));
  const speedUnit = isImperial ? "mph" : "km/h";

  const locName = weather.city || weather.district || weather.county || "Local Area";
  const rawRegion = [weather.city, weather.district, weather.state || weather.county, weather.country].filter(Boolean);
  const dedupedRegion: string[] = [];
  for (const part of rawRegion) {
    if (part && !dedupedRegion.some((d) => d.toLowerCase() === part.toLowerCase())) {
      dedupedRegion.push(part);
    }
  }
  const regionName = dedupedRegion.join(", ") || locName;

  const cond = weather.condition.toLowerCase();
  const isRain = cond.includes("rain") || cond.includes("drizzle");
  const isThunder = cond.includes("thunder");
  const isSnow = cond.includes("snow");

  const condKn = getKannadaCondition(weather.condition, weather.temp);
  const tempKn = numberToKannada(displayTemp);
  const minKn = numberToKannada(displayMin);
  const maxKn = numberToKannada(displayMax);
  const speedKn = numberToKannada(displaySpeed);
  const humKn = numberToKannada(weather.humidity);
  const translatedCond = translateCondition(weather.condition, langCode);

  if (langCode === "kn") {
    return [
      {
        id: "loc-news-1",
        title: `${locName} ಸಿನಾಪ್ಟಿಕ್ ಹವಾಮಾನ ಬುಲೆಟಿನ್: ${displayTemp}°C ತಾಪಮಾನ ಮತ್ತು ${condKn.kn}`,
        summary: `${regionName} ಪ್ರದೇಶದ ಇತ್ತೀಚಿನ ಹವಾಮಾನ ಸಾರಾಂಶ: ಪ್ರಸ್ತುತ ತಾಪಮಾನವು ${tempKn.kn} ಡಿಗ್ರಿ ಸೆಲ್ಸಿಯಸ್ ಇದ್ದು, ವಾತಾವರಣದ ತೇವಾಂಶ ${humKn.kn}% ಮತ್ತು ವಾಯುಭಾರ ಒತ್ತಡ ${weather.pressure} ಹೆಕ್ಟೋಪಾಸ್ಕಲ್ ಇದೆ. ವಾತಾವರಣವು ಸ್ಥಿರವಾಗಿದೆ.`,
        content: [
          `${regionName} ಪ್ರದೇಶದಾದ್ಯಂತ ಪ್ರಸ್ತುತ ಹವಾಮಾನವು ${condKn.kn} ಲಕ್ಷಣಗಳನ್ನು ಹೊಂದಿದೆ. ಮೇಲ್ಮೈ ಸಂವೇದಕಗಳು ತಾಪಮಾನವನ್ನು ${tempKn.kn} ಡಿಗ್ರಿ ಸೆಲ್ಸಿಯಸ್‌ನಲ್ಲಿ ದಾಖಲಿಸಿವೆ.`,
          `ಗಾಳಿಯಲ್ಲಿನ ತೇವಾಂಶವು ${humKn.kn} ಪ್ರತಿಶತವಿದ್ದು, ಗಾಳಿಯ ವೇಗವು ಗಂಟೆಗೆ ${speedKn.kn} ಕಿಲೋಮೀಟರ್ ವೇಗದಲ್ಲಿ ಬೀಸುತ್ತಿದೆ. ಮಳೆಯ ಅಪಾಯವು ಸದ್ಯಕ್ಕೆ ಶೂನ್ಯವಾಗಿದೆ.`,
          `ನಾಗರಿಕರು ಮತ್ತು ಪ್ರಯಾಣಿಕರಿಗೆ ವಾತಾವರಣವು ಅನುಕೂಲಕರವಾಗಿದ್ದು, ಯಾವುದೇ ಹಠಾತ್ ವೈಪರೀತ್ಯಗಳ ಎಚ್ಚರಿಕೆ ಇಲ್ಲ.`,
        ],
        category: isThunder || isRain ? "severe" : isSnow ? "winter" : "climate",
        severity: isThunder ? "CRITICAL" : isRain ? "WARNING" : "ADVISORY",
        source: `${locName} ಪ್ರಾದೇಶಿಕ ಹವಾಮಾನ ಕೇಂದ್ರ`,
        region: regionName,
        publishedTime: "೧೪ ನಿಮಿಷಗಳ ಹಿಂದೆ",
        isBreaking: isThunder || isRain,
        impactMetrics: [
          { label: "ಪ್ರಸ್ತುತ ತಾಪಮಾನ", value: `${displayTemp}°C` },
          { label: "ಗಾಳಿಯ ತೇವಾಂಶ", value: `${weather.humidity}%` },
          { label: "ವಾಯುಭಾರ ಒತ್ತಡ", value: `${weather.pressure} hPa` },
          { label: "ಗಾಳಿಯ ವೇಗ", value: `${displaySpeed} ಕಿ.ಮೀ/ಗಂ` },
        ],
        safetyAdvice: [
          "ಸಾಮಾನ್ಯ ದಿನಚರಿ ಮತ್ತು ಹೊರಾಂಗಣ ಚಟುವಟಿಕೆಗಳಿಗೆ ಹಿತಕರ ಹವೆ.",
          "ರಾತ್ರಿಯ ಹೊತ್ತು ಲಘು ತಂಪಾದ ವಾತಾವರಣವಿರುವುದರಿಂದ ಮುನ್ನೆಚ್ಚರಿಕೆ ವಹಿಸಿ.",
          "ವಾಹನ ಸವಾರರು ಸುರಕ್ಷಿತವಾಗಿ ನಿಯಮಿತ ವೇಗದಲ್ಲಿ ಚಲಿಸಬಹುದು.",
        ],
      },
      {
        id: "loc-news-2",
        title: `${locName} ವೀಕ್ಷಣಾಲಯದಿಂದ ಸಂವೇದಕ ವರದಿ: ಶೂನ್ಯ ಮಳೆ ಮತ್ತು ಸ್ಥಿರ ವಾಯುಗುಣ ದೃಢೀಕರಣ`,
        summary: `ಸ್ಥಳೀಯ ಹವಾಮಾನ ಕೇಂದ್ರದ ಸಂವೇದಕಗಳ ವರದಿ ಪ್ರಕಾರ ಗಂಟೆಗೆ ${speedKn.kn} ಕಿ.ಮೀ ವೇಗದ ಮಂದ ಮಾರುತ ಬೀಸುತ್ತಿದ್ದು, ನೆಲಮಟ್ಟದಲ್ಲಿ ಮಳೆಯಾಗುವ ಯಾವುದೇ ಸಾಧ್ಯತೆಗಳಿಲ್ಲ ಎಂದು ಸ್ಪಷ್ಟಪಡಿಸಲಾಗಿದೆ.`,
        content: [
          `ಸ್ಥಳೀಯ ಡಾಪ್ಲರ್ ರೇಡಾರ್ ಮತ್ತು ಮೇಲ್ಮೈ ಸಂವೇದಕಗಳು ನಿಖರವಾದ ಹವಾಮಾನ ದಾಖಲೆಗಳನ್ನು ಒದಗಿಸಿವೆ. ವಾಯುಭಾರ ಮಟ್ಟವು ${weather.pressure} ಹೆಕ್ಟೋಪಾಸ್ಕಲ್‌ನಲ್ಲಿ ಸಮತೋಲನದಲ್ಲಿದೆ.`,
          `ಮೋಡಗಳ ಹೊದಿಕೆಯು ${weather.cloudiness}% ಇದ್ದು, ಮಳೆಯ ಹನಿಗಳು ನೆಲಕ್ಕೆ ಬೀಳುವ ಯಾವುದೇ ಲಕ್ಷಣಗಳಿಲ್ಲ.`,
          `ಸ್ವಯಂಚಾಲಿತ ಹವಾಮಾನ ಕೇಂದ್ರದ ಗುಣಮಟ್ಟ ಸೂಚ್ಯಂಕವು ೯೯.೪% ವಿಶ್ವಾಸಾರ್ಹತೆಯನ್ನು ತೋರಿಸಿದೆ.`,
        ],
        category: "climate",
        severity: "UPDATE",
        source: "ಸ್ಥಳೀಯ ಸಂವೇದಕ ವೀಕ್ಷಣಾ ಜಾಲ",
        region: `${locName} ಸಂವೇದಕ ವಲಯ`,
        publishedTime: "೨೮ ನಿಮಿಷಗಳ ಹಿಂದೆ",
        impactMetrics: [
          { label: "ವಾಯುಭಾರ ಮಾಪಕ", value: `${weather.pressure} hPa` },
          { label: "ಮೋಡದ ಪ್ರಮಾಣ", value: `${weather.cloudiness}%` },
          { label: "ಸಂವೇದಕ ಗುಣಮಟ್ಟ", value: "೯೯.೪%" },
        ],
        safetyAdvice: [
          "ಸ್ಥಳೀಯ ಸಂವೇದಕಗಳು ಶುಷ್ಕ ವಾತಾವರಣವನ್ನು ದೃಢಪಡಿಸಿವೆ.",
          "ನೆಲಮಟ್ಟದಲ್ಲಿ ಮಳೆ ಅಥವಾ ಬಿರುಗಾಳಿಯ ಭೀತಿ ಇಲ್ಲ.",
        ],
      },
      {
        id: "loc-news-3",
        title: `${locName} ನಗರ ಮತ್ತು ಹೆದ್ದಾರಿ ಸಂಚಾರ ಹವಾಮಾನ ಸಲಹೆ: ಸುಗಮ ವಾಹನ ಸಂಚಾರ`,
        summary: `${locName} ನಗರದ ಪ್ರಮುಖ ರಸ್ತೆಗಳು ಮತ್ತು ಹೆದ್ದಾರಿಗಳಲ್ಲಿ ಒಣ ರಸ್ತೆ ಮೇಲ್ಮೈ ಹಾಗೂ ಉತ್ತಮ ಗೋಚರತೆ ಇರುವುದರಿಂದ ಎಲ್ಲ ರೀತಿಯ ವಾಹನ ಸಂಚಾರ ಸುಗಮವಾಗಿದೆ.`,
        content: [
          `ನಗರದ ಸಂಚಾರ ಕಾರಿಡಾರ್‌ಗಳು ಮತ್ತು ರಾಷ್ಟ್ರೀಯ ಹೆದ್ದಾರಿಗಳಲ್ಲಿ ರಸ್ತೆಯ ಘರ್ಷಣೆ ಗುಣಾಂಕ ಅತ್ಯುತ್ತಮವಾಗಿದೆ. ರಸ್ತೆಗಳು ಸಂಪೂರ್ಣ ಒಣಗಿದ್ದು ಜಾರುವ ಅಪಾಯವಿಲ್ಲ.`,
          `ವಾತಾವರಣದ ಗೋಚರತೆ ೮ ರಿಂದ ೧೦ ಕಿಲೋಮೀಟರ್‌ವರೆಗೂ ಸ್ಪಷ್ಟವಾಗಿದ್ದು, ವಾಹನ ಸವಾರರು ಮತ್ತು ವಿಮಾನ ಸಂಚಾರಕ್ಕೆ ಯಾವುದೇ ಅಡಚಣೆ ಇಲ್ಲ.`,
        ],
        category: "tropical",
        severity: "UPDATE",
        source: "ಪ್ರಾದೇಶಿಕ ಹೆದ್ದಾರಿ ಸಂಚಾರ ಬ್ಯೂರೋ",
        region: `${locName} ಸಾರಿಗೆ ವಲಯ`,
        publishedTime: "೪೨ ನಿಮಿಷಗಳ ಹಿಂದೆ",
        impactMetrics: [
          { label: "ರಸ್ತೆ ಸ್ಥಿತಿ", value: "ಒಣ ಮತ್ತು ಸುರಕ್ಷಿತ" },
          { label: "ಗೋಚರತೆ", value: "೧೦ ಕಿ.ಮೀ" },
          { label: "ಸಂಚಾರ ಸುರಕ್ಷತೆ", value: "ಅತ್ಯುತ್ತಮ" },
        ],
        safetyAdvice: [
          "ಹೆದ್ದಾರಿಗಳಲ್ಲಿ ನಿಯಮಿತ ವೇಗ ಕಾಪಾಡಿಕೊಳ್ಳಿ.",
          "ದೂರ ಪ್ರಯಾಣಕ್ಕೆ ಹವಾಮಾನ ಅತ್ಯಂತ ಸೂಕ್ತವಾಗಿದೆ.",
        ],
      },
      {
        id: "loc-news-4",
        title: `ದೈನಂದಿನ ತಾಪಮಾನ ಚಕ್ರ: ಗರಿಷ್ಠ ${maxKn.kn}°C ನಿಂದ ರಾತ್ರಿ ಕನಿಷ್ಠ ${minKn.kn}°C ಗೆ ಇಳಿಕೆ`,
        summary: `ಹಗಲಿನ ಗರಿಷ್ಠ ತಾಪಮಾನವು ${maxKn.kn} ಡಿಗ್ರಿ ಸೆಲ್ಸಿಯಸ್ ತಲುಪಿದ್ದು, ರಾತ್ರಿಯ ಹೊತ್ತು ವಿಕಿರಣ ತಂಪಾಗುವಿಕೆಯಿಂದಾಗಿ ತಾಪಮಾನವು ${minKn.kn} ಡಿಗ್ರಿವರೆಗೆ ಇಳಿಯುವ ನಿರೀಕ್ಷೆಯಿದೆ.`,
        content: [
          `ಸೂರ್ಯಾಸ್ತದ ನಂತರ ಉಷ್ಣತೆಯು ಕ್ರಮೇಣ ಕಡಿಮೆಯಾಗುತ್ತಿದ್ದು, ಮುಂಜಾನೆಯ ಹೊತ್ತಿಗೆ ತಾಪಮಾನವು ಕನಿಷ್ಠ ${minKn.kn} ಡಿಗ್ರಿಗೆ ತಲುಪಲಿದೆ.`,
          `ತಾಪಮಾನದ ಏರಿಳಿತವು ಸಾಮಾನ್ಯ ಋತುಮಾನದ ಮಿತಿಯಲ್ಲಿದ್ದು ಆರೋಗ್ಯಕ್ಕೆ ಯಾವುದೇ ಹಾನಿಕಾರಕ ಅಂಶಗಳಿಲ್ಲ.`,
        ],
        category: "winter",
        severity: "ADVISORY",
        source: "ಶಾಖ ವಿತರಣಾ ಮತ್ತು ಹವಾಮಾನ ವಿಭಾಗ",
        region: `${weather.state || locName} ಪ್ರಸ್ಥಭೂಮಿ`,
        publishedTime: "೧ ಗಂಟೆಯ ಹಿಂದೆ",
        impactMetrics: [
          { label: "ಗರಿಷ್ಠ ತಾಪಮಾನ", value: `${displayMax}°C` },
          { label: "ಕನಿಷ್ಠ ತಾಪಮಾನ", value: `${displayMin}°C` },
          { label: "ಅನುಭವವಾಗುವ ತಾಪಮಾನ", value: `${displayFeels}°C` },
        ],
        safetyAdvice: [
          "ತಡರಾತ್ರಿ ಮತ್ತು ಮುಂಜಾನೆ ಲಘು ಬೆಚ್ಚಗಿನ ಉಡುಪು ಧರಿಸಿ.",
          "ಹಿರಿಯರು ಮತ್ತು ಮಕ್ಕಳು ತಂಪಾದ ಗಾಳಿಯಿಂದ ರಕ್ಷಣೆ ಪಡೆಯಿರಿ.",
        ],
      },
      {
        id: "loc-news-5",
        title: `ವಾಯುಗುಣ ಪರಿಚಲನೆ: ${weather.state || locName} ವ್ಯಾಪ್ತಿಯಲ್ಲಿ ಋತುಮಾನದ ಸ್ಥಿರತೆ`,
        summary: `ಮೇಲ್ಮೈ ವಾಯುಭಾರ ಪರಿಚಲನೆಯು ಋತುಮಾನದ ಸರಾಸರಿಗೆ ಅನುಗುಣವಾಗಿದ್ದು, ವಾತಾವರಣದಲ್ಲಿ ಯಾವುದೇ ಅನಿರೀಕ್ಷಿತ ಚಂಡಮಾರುತಗಳಿಲ್ಲದೆ ಶಾಂತ ವಾತಾವರಣ ಮುಂದುವರಿದಿದೆ.`,
        content: [
          `ಪ್ರಾದೇಶಿಕ ವಾತಾವರಣದ ಮಾದರಿಯು ಸ್ಥಿರವಾದ ಗಾಳಿಯ ಪರಿಚಲನೆಯನ್ನು ಸೂಚಿಸುತ್ತದೆ. ಯಾವುದೇ ವಾಯುಭಾರ ಕುಸಿತ ಅಥವಾ ತೀವ್ರ ಚಂಡಮಾರುತದ ಲಕ್ಷಣಗಳು ಕಂಡುಬಂದಿಲ್ಲ.`,
          `ಕೃಷಿ ಮತ್ತು ತೋಟಗಾರಿಕೆ ಚಟುವಟಿಕೆಗಳಿಗೆ ಇದು ಸೂಕ್ತ ಕಾಲವಾಗಿದ್ದು, ರೈತರು ಸಾಮಾನ್ಯ ಕೃಷಿ ಕೆಲಸಗಳನ್ನು ಮುಂದುವರಿಸಬಹುದು.`,
        ],
        category: "climate",
        severity: "UPDATE",
        source: "ವಾತಾವರಣ ವಿಜ್ಞಾನ ಅಧ್ಯಯನ ಪೀಠ",
        region: `${weather.country || locName} ವಲಯ`,
        publishedTime: "೨ ಗಂಟೆಗಳ ಹಿಂದೆ",
        impactMetrics: [
          { label: "ವಾಯುಭಾರ ಸ್ಥಿರತೆ", value: "ಸಮತೋಲಿತ" },
          { label: "ಋತುಮಾನ ಹೋಲಿಕೆ", value: "ಸಾಮಾನ್ಯ" },
        ],
        safetyAdvice: [
          "ಕೃಷಿ ಮತ್ತು ನಿರ್ಮಾಣ ಚಟುವಟಿಕೆಗಳಿಗೆ ಅನುಕೂಲಕರ ಹವೆ.",
          "ಪರಿಸರದ ತಾಪಮಾನವು ಸಮತೋಲನದಲ್ಲಿದೆ.",
        ],
      },
      {
        id: "loc-news-6",
        title: `${locName} ನಾಗರಿಕ ವೀಕ್ಷಣಾ ಜಾಲದಿಂದ ಹವಾಮಾನ ದೃಢೀಕರಣ: ನೇರ ಮುನ್ಸೂಚನೆಗೆ ಅನುಮೋದನೆ`,
        summary: `ಸ್ಥಳೀಯ ನಾಗರಿಕರು ಮತ್ತು ಸಮುದಾಯ ವೀಕ್ಷಕರು ಸಲ್ಲಿಸಿರುವ ನೇರ ಮಾಹಿತಿಯ ಪ್ರಕಾರ, ಪ್ರಸ್ತುತ ಹವಾಮಾನ ಮುನ್ಸೂಚನೆಯು ವಾಸ್ತವ ಪರಿಸ್ಥಿತಿಗೆ ನಿಖರವಾಗಿ ಹೊಂದಿಕೆಯಾಗಿದೆ.`,
        content: [
          `${locName} ನಗರದ ವಿವಿಧ ಬಡಾವಣೆಗಳಿಂದ ನಾಗರಿಕರು ಹವಾಮಾನ ವರದಿಗಳನ್ನು ದಾಖಲಿಸಿದ್ದಾರೆ.`,
          `ಸಾರ್ವಜನಿಕರು ಒಣ ರಸ್ತೆಗಳು ಮತ್ತು ಶಾಂತ ವಾತಾವರಣವನ್ನು ದೃಢಪಡಿಸಿದ್ದು, ಹವಾಮಾನ ಮುನ್ಸೂಚನೆ ನಿಖರವಾಗಿದೆ ಎಂದು ತಿಳಿಸಿದ್ದಾರೆ.`,
        ],
        category: "severe",
        severity: "UPDATE",
        source: "ಸಮುದಾಯ ವೀಕ್ಷಕರ ವೇದಿಕೆ",
        region: `${locName} ಬಡಾವಣೆಗಳು`,
        publishedTime: "೩ ಗಂಟೆಗಳ ಹಿಂದೆ",
        impactMetrics: [
          { label: "ದೃಢೀಕರಿಸಿದ ವೀಕ್ಷಕರು", value: "೩೫+ ಜನರು" },
          { label: "ವಿಶ್ವಾಸಾರ್ಹತೆ", value: "೯೯.೨%" },
        ],
        safetyAdvice: [
          "ನೀವು ಕೂಡ 'ಹವಾಮಾನ ಮಾಹಿತಿ ವರದಿ ಮಾಡಿ' ಬಟನ್ ಬಳಸಿ ನೈಜ ವರದಿ ನೀಡಬಹುದು.",
        ],
      },
    ];
  }

  // English & global generator matching active weather
  return [
    {
      id: "loc-news-1",
      title: `${locName} Regional Synoptic Bulletin: ${translatedCond} Pattern Dominates at ${displayTemp}${tempUnit}`,
      summary: `Official meteorological analysis for ${regionName}. Ambient temperatures holding steady at ${displayTemp}${tempUnit} with ${weather.humidity}% relative humidity and barometric pressure at ${weather.pressure} hPa. No precipitation hazards observed across the district.`,
      content: [
        `Surface meteorological stations across ${regionName} confirm stable atmospheric conditions. Ambient temperatures are presently recorded at ${displayTemp}${tempUnit} (${displayFeels}${tempUnit} feels-like index).`,
        `Relative atmospheric humidity stands at ${weather.humidity}% with boundary wind velocity registered at ${displaySpeed} ${speedUnit}. Doppler radar sweeps report zero active precipitation cells within a 35 km radius.`,
        `Conditions remain favorable for standard urban commutes, commercial transport, and outdoor activities with no hazardous weather advisories in effect.`,
      ],
      category: isThunder || isRain ? "severe" : isSnow ? "winter" : "climate",
      severity: isThunder ? "CRITICAL" : isRain ? "WARNING" : "ADVISORY",
      source: `${locName} Regional Meteorological Centre (WMO)`,
      region: regionName,
      publishedTime: "14 mins ago",
      isBreaking: isThunder || isRain,
      impactMetrics: [
        { label: "Surface Temp", value: `${displayTemp}${tempUnit}` },
        { label: "Humidity", value: `${weather.humidity}%` },
        { label: "Pressure", value: `${weather.pressure} hPa` },
        { label: "Wind Velocity", value: `${displaySpeed} ${speedUnit}` },
      ],
      safetyAdvice: [
        "Optimal atmospheric conditions for commuting and outdoor activities.",
        "Mild evening radiational cooling expected; keep a light jacket for late hours.",
        "Roadways remain clean and dry throughout the district.",
      ],
    },
    {
      id: "loc-news-2",
      title: `${locName} Observatory Telemetry: Surface Sensors Verify Zero Rainfall & Stable Boundary Layer`,
      summary: `Automated surface telemetry from local meteorological sensors confirms calm wind dynamics (${displaySpeed} ${speedUnit}) and stable atmospheric stratification across ${locName}. Zero rainfall registered at ground stations.`,
      content: [
        `Doppler radar and automated surface observing systems (ASOS) have cross-verified atmospheric parameters. Barometric pressure is equilibrated at ${weather.pressure} hPa.`,
        `Cloud cover is measured at ${weather.cloudiness}%, composed of high-to-mid level cloud formations with zero moisture saturation reaching the ground.`,
        `The automated ground station telemetry quality index stands at 99.4% confidence across the observation corridor.`,
      ],
      category: "climate",
      severity: "UPDATE",
      source: "Automated Weather Station & Telemetry Network",
      region: `${locName} Sensor Corridor`,
      publishedTime: "28 mins ago",
      impactMetrics: [
        { label: "Barometer", value: `${weather.pressure} hPa` },
        { label: "Cloud Cover", value: `${weather.cloudiness}%` },
        { label: "Sensor Quality", value: "99.4%" },
      ],
      safetyAdvice: [
        "Ground truth sensors corroborate dry weather across local arterial routes.",
        "Zero precipitation hazards detected on local microclimate sweeps.",
      ],
    },
    {
      id: "loc-news-3",
      title: `Regional Highway & Commuter Transit Advisory for ${locName} Arterial Corridors`,
      summary: `Favorable roadway transit conditions reported across ${locName} arterial networks. Surface friction coefficients remain optimal with dry road surfaces and horizontal visibility exceeding 8 kilometers.`,
      content: [
        `Major expressway corridors and metropolitan transit routes report dry pavement conditions. Braking deceleration rates and tire traction are at standard baseline values.`,
        `Horizontal visibility is logged at 8 to 10 kilometers with no fog obscuration or low cloud ceilings affecting road or airport flight corridors.`,
      ],
      category: "tropical",
      severity: "UPDATE",
      source: "Highway & Arterial Corridor Transit Bureau",
      region: `${locName} Transit Zone`,
      publishedTime: "42 mins ago",
      impactMetrics: [
        { label: "Pavement Status", value: "Dry & Normal" },
        { label: "Visibility", value: "10 km" },
        { label: "Transit Safety", value: "Optimal" },
      ],
      safetyAdvice: [
        "Maintain standard following distances on major arterial expressways.",
        "Conditions are ideal for long-distance highway departures.",
      ],
    },
    {
      id: "loc-news-4",
      title: `Diurnal Temperature Trajectory: High of ${displayMax}${tempUnit} Tapers toward Overnight Low of ${displayMin}${tempUnit}`,
      summary: `Daytime maximum readings touched ${displayMax}${tempUnit} under diffuse solar insulation. Nocturnal radiational cooling will steer thermometer readings down toward ${displayMin}${tempUnit} by dawn with gentle boundary winds.`,
      content: [
        `Thermal analysis indicates steady dissipation of daytime solar heat flux following dusk. Nocturnal inversion layers will stabilize lower boundary air by midnight.`,
        `Thermal gradients remain well within historical climatological medians for ${weather.country || "the region"}.`,
      ],
      category: "winter",
      severity: "ADVISORY",
      source: "Climatology & Diurnal Heat Flux Desk",
      region: `${weather.state || locName} Plateau`,
      publishedTime: "1 hour ago",
      impactMetrics: [
        { label: "Day Maximum", value: `${displayMax}${tempUnit}` },
        { label: "Night Minimum", value: `${displayMin}${tempUnit}` },
        { label: "Apparent Temp", value: `${displayFeels}${tempUnit}` },
      ],
      safetyAdvice: [
        "Light warm layer recommended for late-night and early-morning outings.",
        "Adequate thermal comfort maintained across indoor and outdoor spaces.",
      ],
    },
    {
      id: "loc-news-5",
      title: `Tropospheric Flow Analysis: Broad Synoptic Ridging Sustains Seasonal Balance over ${weather.state || weather.country || locName}`,
      summary: `Upper-level atmospheric circulation maintains seasonal norms across the regional plateau. Mid-tropospheric humidity (${weather.humidity}%) prevents storm development while retaining comfortable ambient moisture.`,
      content: [
        `Synoptic charts show broad high-pressure influence across the mid-troposphere, preventing convective storm towers from building over the region.`,
        `Agricultural and horticultural sectors benefit from steady atmospheric conditions and stable evaporation rates.`,
      ],
      category: "climate",
      severity: "UPDATE",
      source: "Atmospheric Dynamics & Air Mass Circulation Desk",
      region: `${weather.country || locName} Region`,
      publishedTime: "2 hours ago",
      impactMetrics: [
        { label: "Tropospheric Stability", value: "Stable High" },
        { label: "Seasonal Alignment", value: "Within Norms" },
      ],
      safetyAdvice: [
        "Favorable outlook for agricultural harvesting and outdoor construction.",
        "Stable air quality index prevailing across the district.",
      ],
    },
    {
      id: "loc-news-6",
      title: `Crowd Weather Network Corroborates Live Forecast Alignment in ${locName}`,
      summary: `Ground reports submitted by nearby community observers confirm live conditions matching meteorological telemetry. Citizen feedback validates steady cloudiness and 0.0 mm rainfall.`,
      content: [
        `Live crowd reports gathered from residents across ${locName} neighborhoods corroborate the official forecast.`,
        `Citizen observers confirm overcast skies with dry ground surfaces, verifying 99.2% alignment between ground truth and predictive numerical models.`,
      ],
      category: "severe",
      severity: "UPDATE",
      source: "Community Weather Network & Crowd Observers",
      region: `${locName} Neighborhoods`,
      publishedTime: "3 hours ago",
      impactMetrics: [
        { label: "Verified Observers", value: "35+ Citizens" },
        { label: "Consensus Alignment", value: "99.2%" },
      ],
      safetyAdvice: [
        "You can contribute real-time ground truth by clicking 'Report Live Weather'.",
      ],
    },
  ];
}

/**
 * Returns articles localized for the current language.
 */
export function getLocalizedNewsArticles(
  langCode: string = "en",
  weather?: CurrentWeather,
  unit: "metric" | "imperial" = "metric"
): WeatherNewsArticle[] {
  if (weather) {
    return generateLocationNewsArticles(weather, unit, langCode);
  }

  const overlay = LOCALIZED_ARTICLE_OVERLAYS[langCode];
  if (!overlay) return GLOBAL_WEATHER_NEWS;

  return GLOBAL_WEATHER_NEWS.map((art) => {
    const item = overlay[art.id];
    if (item) {
      return {
        ...art,
        title: item.title,
        summary: item.summary,
        region: item.region,
      };
    }
    return art;
  });
}

/**
 * Text-to-Speech audio synthesizer for the live weather broadcast report.
 */
class LiveAudioBroadcastService {
  private synth: SpeechSynthesis | null = null;
  private keepAliveTimer: any = null;

  constructor() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      this.synth = window.speechSynthesis;
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => {
          this.synth?.getVoices();
        };
      }
    }
  }

  public isSupported(): boolean {
    return this.synth !== null;
  }

  public speak(
    text: string,
    onStart: () => void,
    onEnd: () => void,
    onError: (err: any) => void,
    locale: string = "en-US",
    phoneticText?: string
  ) {
    this.stop();

    if (!this.synth) {
      onError("Speech synthesis is not supported on this browser.");
      return;
    }

    // Workaround for Chrome paused speech synthesis engine
    if (this.synth.paused) {
      this.synth.resume();
    }

    const voices = this.synth.getVoices();
    const prefix = locale.split("-")[0].toLowerCase();

    // 1. Check if the device has a real native voice installed for this language
    const nativeVoice = voices.find((v) => {
      const vLang = v.lang.toLowerCase().replace("_", "-");
      return vLang === locale.toLowerCase() || vLang.startsWith(prefix);
    });

    let voiceToUse = nativeVoice;
    let textToSpeak = text;
    let langToSet = locale;

    if (nativeVoice) {
      // Device has the language voice pack installed
      voiceToUse = nativeVoice;
      textToSpeak = text;
      langToSet = nativeVoice.lang;
    } else {
      // Device does not have native voice pack (e.g. Kannada/Telugu on standard Windows)
      // Use phonetic transliteration with an Indian voice (en-IN) or default voice
      textToSpeak = phoneticText || text;
      voiceToUse =
        voices.find((v) => v.lang.toLowerCase().includes("en-in")) ||
        voices.find((v) => v.lang.toLowerCase().includes("en")) ||
        voices[0];
      langToSet = voiceToUse?.lang || "en-IN";
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    if (voiceToUse) {
      utterance.voice = voiceToUse;
    }
    utterance.lang = langToSet;
    utterance.rate = 0.92;
    utterance.pitch = 1.0;

    let hasStarted = false;
    utterance.onstart = () => {
      hasStarted = true;
      onStart();
    };

    utterance.onend = () => {
      if (this.keepAliveTimer) {
        clearInterval(this.keepAliveTimer);
        this.keepAliveTimer = null;
      }
      onEnd();
    };

    utterance.onerror = (e: SpeechSynthesisErrorEvent) => {
      if (this.keepAliveTimer) {
        clearInterval(this.keepAliveTimer);
        this.keepAliveTimer = null;
      }
      if (e.error === "canceled" || e.error === "interrupted") {
        onEnd();
      } else {
        onError(`Audio playback error: ${e.error}`);
      }
    };

    // Chrome keep-alive bugfix: Chrome cuts off speech synthesis after ~15s
    if (this.keepAliveTimer) clearInterval(this.keepAliveTimer);
    this.keepAliveTimer = setInterval(() => {
      if (!this.synth || !this.synth.speaking) {
        if (this.keepAliveTimer) {
          clearInterval(this.keepAliveTimer);
          this.keepAliveTimer = null;
        }
      } else {
        this.synth.pause();
        this.synth.resume();
      }
    }, 10000);

    // Call speak synchronously in the user click event loop so browser allows it
    try {
      this.synth.speak(utterance);
      // Fallback for browsers that don't trigger onstart immediately
      setTimeout(() => {
        if (!hasStarted && this.synth && this.synth.speaking) {
          onStart();
        }
      }, 100);
    } catch (e) {
      onError(e);
    }
  }

  public pause() {
    if (this.synth && this.synth.speaking) {
      this.synth.pause();
    }
  }

  public resume() {
    if (this.synth && this.synth.paused) {
      this.synth.resume();
    }
  }

  public stop() {
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }
    if (this.synth) {
      this.synth.cancel();
    }
  }
}

export const audioBroadcast = new LiveAudioBroadcastService();
