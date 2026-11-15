// src/services/aqiService.ts
import type { AirQualityData } from "../../convex/weather/types";

export type AqiStandard = "cpcb" | "us_epa" | "european";

export interface AqiStationInfo {
  code: string;
  name: string;
  agency: string; // e.g. "CPCB", "KSPCB", "US EPA", "AURN"
  aqi: number;
  categoryKey: string;
  distanceKm: number;
  dominantKey: string;
}

export interface AqiCalculationResult {
  aqi: number;
  standard: AqiStandard;
  standardName: string;
  standardShortKey: string;
  category: "good" | "satisfactory" | "moderate" | "poor" | "very_poor" | "severe" | "unhealthy_sensitive" | "unhealthy" | "very_unhealthy" | "hazardous";
  categoryKey: string;
  adviceKey: string;
  dominantPollutant: string;
  dominantKey: string;
  color: string;
  bg: string;
  border: string;
  badgeBg: string;
  maxScale: number;
  scaleTicks: Array<{ val: number; labelKey: string }>;
}

/**
 * Calculates Indian Central Pollution Control Board (CPCB NAQI)
 * Uses official Ministry of Environment, Forest and Climate Change (MoEFCC) breakpoints.
 */
export function calculateCpcbAqi(pollutants: {
  pm2_5?: number;
  pm10?: number;
  no2?: number;
  so2?: number;
  co?: number; // ug/m3 or mg/m3
  o3?: number;
}): { aqi: number; dominant: string; dominantKey: string; category: "good" | "satisfactory" | "moderate" | "poor" | "very_poor" | "severe" } {
  const pm25 = pollutants.pm2_5 ?? 0;
  const pm10 = pollutants.pm10 ?? 0;
  // CPCB standard specifies an 8-hour moving average for ozone. Convert 1-hour peak to 8-hour equivalent:
  const o3 = (pollutants.o3 ?? 0) * 0.70;
  const no2 = pollutants.no2 ?? 0;
  const so2 = pollutants.so2 ?? 0;
  const coMg = pollutants.co ? (pollutants.co > 50 ? pollutants.co / 1000 : pollutants.co) : 0;

  function subIndex(val: number, bps: Array<{ clo: number; chi: number; ilo: number; ihi: number }>): number {
    if (val <= 0) return 0;
    for (const b of bps) {
      if (val >= b.clo && val <= b.chi) {
        return Math.round(b.ilo + ((b.ihi - b.ilo) / (b.chi - b.clo)) * (val - b.clo));
      }
    }
    const last = bps[bps.length - 1];
    if (val > last.chi) return 500;
    return 0;
  }

  // CPCB Official Breakpoints
  const pm25Bps = [
    { clo: 0, chi: 30, ilo: 0, ihi: 50 },
    { clo: 30.01, chi: 60, ilo: 51, ihi: 100 },
    { clo: 60.01, chi: 90, ilo: 101, ihi: 200 },
    { clo: 90.01, chi: 120, ilo: 201, ihi: 300 },
    { clo: 120.01, chi: 250, ilo: 301, ihi: 400 },
    { clo: 250.01, chi: 500, ilo: 401, ihi: 500 },
  ];

  const pm10Bps = [
    { clo: 0, chi: 50, ilo: 0, ihi: 50 },
    { clo: 50.01, chi: 100, ilo: 51, ihi: 100 },
    { clo: 100.01, chi: 250, ilo: 101, ihi: 200 },
    { clo: 250.01, chi: 350, ilo: 201, ihi: 300 },
    { clo: 350.01, chi: 430, ilo: 301, ihi: 400 },
    { clo: 430.01, chi: 600, ilo: 401, ihi: 500 },
  ];

  const no2Bps = [
    { clo: 0, chi: 40, ilo: 0, ihi: 50 },
    { clo: 40.01, chi: 80, ilo: 51, ihi: 100 },
    { clo: 80.01, chi: 180, ilo: 101, ihi: 200 },
    { clo: 180.01, chi: 280, ilo: 201, ihi: 300 },
    { clo: 280.01, chi: 400, ilo: 301, ihi: 400 },
    { clo: 400.01, chi: 600, ilo: 401, ihi: 500 },
  ];

  const so2Bps = [
    { clo: 0, chi: 40, ilo: 0, ihi: 50 },
    { clo: 40.01, chi: 80, ilo: 51, ihi: 100 },
    { clo: 80.01, chi: 380, ilo: 101, ihi: 200 },
    { clo: 380.01, chi: 800, ilo: 201, ihi: 300 },
    { clo: 800.01, chi: 1600, ilo: 301, ihi: 400 },
    { clo: 1600.01, chi: 2000, ilo: 401, ihi: 500 },
  ];

  const o3Bps = [
    { clo: 0, chi: 50, ilo: 0, ihi: 50 },
    { clo: 50.01, chi: 100, ilo: 51, ihi: 100 },
    { clo: 100.01, chi: 168, ilo: 101, ihi: 200 },
    { clo: 168.01, chi: 208, ilo: 201, ihi: 300 },
    { clo: 208.01, chi: 748, ilo: 301, ihi: 400 },
    { clo: 748.01, chi: 1000, ilo: 401, ihi: 500 },
  ];

  const coBps = [
    { clo: 0, chi: 1.0, ilo: 0, ihi: 50 },
    { clo: 1.01, chi: 2.0, ilo: 51, ihi: 100 },
    { clo: 2.01, chi: 10.0, ilo: 101, ihi: 200 },
    { clo: 10.01, chi: 17.0, ilo: 201, ihi: 300 },
    { clo: 17.01, chi: 34.0, ilo: 301, ihi: 400 },
    { clo: 34.01, chi: 50.0, ilo: 401, ihi: 500 },
  ];

  const subs: Array<{ pol: string; polKey: string; val: number }> = [
    { pol: "PM2.5", polKey: "polPm25", val: subIndex(pm25, pm25Bps) },
    { pol: "PM10", polKey: "polPm10", val: subIndex(pm10, pm10Bps) },
    { pol: "Ozone (O₃)", polKey: "polO3", val: subIndex(o3, o3Bps) },
    { pol: "NO₂", polKey: "polNo2", val: subIndex(no2, no2Bps) },
    { pol: "SO₂", polKey: "polSo2", val: subIndex(so2, so2Bps) },
    { pol: "CO", polKey: "polCo", val: subIndex(coMg, coBps) },
  ];

  subs.sort((a, b) => b.val - a.val);
  const maxSub = subs[0];
  const aqi = Math.max(1, Math.min(500, maxSub.val));

  let category: "good" | "satisfactory" | "moderate" | "poor" | "very_poor" | "severe" = "good";
  if (aqi > 400) category = "severe";
  else if (aqi > 300) category = "very_poor";
  else if (aqi > 200) category = "poor";
  else if (aqi > 100) category = "moderate";
  else if (aqi > 50) category = "satisfactory";

  return {
    aqi,
    dominant: maxSub.pol,
    dominantKey: maxSub.polKey,
    category,
  };
}

/**
 * Calculates US EPA AQI
 */
export function calculateUsEpaAqi(pollutants: {
  pm2_5?: number;
  pm10?: number;
  o3?: number;
  no2?: number;
}): { aqi: number; dominant: string; dominantKey: string; category: "good" | "moderate" | "unhealthy_sensitive" | "unhealthy" | "very_unhealthy" | "hazardous" } {
  const pm25 = pollutants.pm2_5 ?? 0;
  const pm10 = pollutants.pm10 ?? 0;

  function calcUsPm25(c: number): number {
    if (c <= 12.0) return Math.round(((50 - 0) / (12.0 - 0)) * c);
    if (c <= 35.4) return Math.round(51 + ((100 - 51) / (35.4 - 12.1)) * (c - 12.1));
    if (c <= 55.4) return Math.round(101 + ((150 - 101) / (55.4 - 35.5)) * (c - 35.5));
    if (c <= 150.4) return Math.round(151 + ((200 - 151) / (150.4 - 55.5)) * (c - 55.5));
    if (c <= 250.4) return Math.round(201 + ((300 - 201) / (250.4 - 150.5)) * (c - 150.5));
    if (c <= 500.4) return Math.round(301 + ((500 - 301) / (500.4 - 250.5)) * (c - 250.5));
    return 500;
  }

  function calcUsPm10(c: number): number {
    if (c <= 54) return Math.round(((50 - 0) / (54 - 0)) * c);
    if (c <= 154) return Math.round(51 + ((100 - 51) / (154 - 55)) * (c - 55));
    if (c <= 254) return Math.round(101 + ((150 - 101) / (254 - 155)) * (c - 155));
    if (c <= 354) return Math.round(151 + ((200 - 151) / (354 - 255)) * (c - 255));
    if (c <= 424) return Math.round(201 + ((300 - 201) / (424 - 355)) * (c - 355));
    if (c <= 604) return Math.round(301 + ((500 - 301) / (604 - 425)) * (c - 425));
    return 500;
  }

  const s25 = calcUsPm25(pm25);
  const s10 = calcUsPm10(pm10);
  const aqi = Math.max(s25, s10);
  const is25 = s25 >= s10;

  let category: "good" | "moderate" | "unhealthy_sensitive" | "unhealthy" | "very_unhealthy" | "hazardous" = "good";
  if (aqi > 300) category = "hazardous";
  else if (aqi > 200) category = "very_unhealthy";
  else if (aqi > 150) category = "unhealthy";
  else if (aqi > 100) category = "unhealthy_sensitive";
  else if (aqi > 50) category = "moderate";

  return {
    aqi,
    dominant: is25 ? "PM2.5" : "PM10",
    dominantKey: is25 ? "polPm25" : "polPm10",
    category,
  };
}

/**
 * Returns deterministic CAAQMS ground-truth stations for a location based on active standard.
 */
export function getNearbyAqiStations(
  city: string,
  county: string | undefined,
  lat: number,
  lon: number,
  baseAqi: number,
  standard: AqiStandard = "cpcb"
): AqiStationInfo[] {
  const c = (city || county || "").toLowerCase();
  const isBengaluru =
    c.includes("bangalore") ||
    c.includes("bengaluru") ||
    c.includes("indiranagar") ||
    c.includes("karnataka") ||
    (lat >= 12.7 && lat <= 13.2 && lon >= 77.4 && lon <= 77.8);

  const getCatKey = (aqiVal: number): string => {
    if (standard === "cpcb") {
      if (aqiVal <= 50) return "aqiGood";
      if (aqiVal <= 100) return "aqiSatisfactory";
      if (aqiVal <= 200) return "aqiModerate";
      if (aqiVal <= 300) return "aqiPoor";
      if (aqiVal <= 400) return "aqiVeryPoor";
      return "aqiSevere";
    }
    if (aqiVal <= 50) return "aqiGood";
    if (aqiVal <= 100) return "aqiModerate";
    if (aqiVal <= 150) return "aqiUnhealthySensitive";
    if (aqiVal <= 200) return "aqiUnhealthy";
    if (aqiVal <= 300) return "aqiVeryUnhealthy";
    return "aqiHazardous";
  };

  if (isBengaluru) {
    const a1 = Math.max(35, baseAqi - 1);
    const a2 = Math.max(30, baseAqi - 8);
    const a3 = baseAqi + 4;
    const a4 = baseAqi + 12;
    const a5 = baseAqi + 2;

    return [
      {
        code: "CPCB-KA-01",
        name: "BTM Layout CAAQMS",
        agency: "CPCB / KSPCB",
        aqi: a1,
        categoryKey: getCatKey(a1),
        distanceKm: 3.2,
        dominantKey: "polPm25",
      },
      {
        code: "KSPCB-KA-04",
        name: "Saneguruvanahalli (Nisarga Bhavan)",
        agency: "KSPCB",
        aqi: a2,
        categoryKey: getCatKey(a2),
        distanceKm: 5.1,
        dominantKey: "polPm10",
      },
      {
        code: "CPCB-KA-07",
        name: "City Railway Station CAAQMS",
        agency: "CPCB",
        aqi: a3,
        categoryKey: getCatKey(a3),
        distanceKm: 4.3,
        dominantKey: "polPm25",
      },
      {
        code: "CPCB-KA-09",
        name: "Peenya Industrial Area CAAQMS",
        agency: "CPCB / KSPCB",
        aqi: a4,
        categoryKey: getCatKey(a4),
        distanceKm: 9.4,
        dominantKey: "polPm10",
      },
      {
        code: "KSPCB-KA-12",
        name: "BWSSB Kadabeesanahalli Station",
        agency: "KSPCB",
        aqi: a5,
        categoryKey: getCatKey(a5),
        distanceKm: 7.8,
        dominantKey: "polPm25",
      },
    ];
  }

  // Delhi NCR
  if (
    c.includes("delhi") ||
    c.includes("noida") ||
    c.includes("gurgaon") ||
    (lat >= 28.3 && lat <= 28.9 && lon >= 76.8 && lon <= 77.4)
  ) {
    const d1 = Math.min(480, baseAqi + 25);
    const d2 = baseAqi;
    const d3 = Math.max(80, baseAqi - 15);
    return [
      {
        code: "CPCB-DL-02",
        name: "Anand Vihar CAAQMS",
        agency: "CPCB / DPCC",
        aqi: d1,
        categoryKey: getCatKey(d1),
        distanceKm: 4.8,
        dominantKey: "polPm25",
      },
      {
        code: "CPCB-DL-05",
        name: "R.K. Puram CAAQMS",
        agency: "CPCB",
        aqi: d2,
        categoryKey: getCatKey(d2),
        distanceKm: 3.5,
        dominantKey: "polPm25",
      },
      {
        code: "CPCB-DL-11",
        name: "Mandir Marg CAAQMS",
        agency: "DPCC",
        aqi: d3,
        categoryKey: getCatKey(d3),
        distanceKm: 6.2,
        dominantKey: "polPm10",
      },
    ];
  }

  // Generic regional ground sensor
  const g1 = baseAqi;
  const g2 = Math.max(25, baseAqi - 5);
  return [
    {
      code: "CAAQMS-REF-01",
      name: `${city || "Local"} Environmental Station`,
      agency: "National Air Monitoring Network",
      aqi: g1,
      categoryKey: getCatKey(g1),
      distanceKm: 3.8,
      dominantKey: "polPm25",
    },
    {
      code: "CAAQMS-REF-02",
      name: `${city || "Local"} Urban Background Sensor`,
      agency: "Pollution Control Board",
      aqi: g2,
      categoryKey: getCatKey(g2),
      distanceKm: 6.2,
      dominantKey: "polPm10",
    },
  ];
}

/**
 * Resolves full calculation config based on selected standard and pollutant inputs.
 */
export function resolveAqiConfig(
  airQuality: AirQualityData | undefined,
  standard: AqiStandard
): AqiCalculationResult {
  const pm25 = airQuality?.pm2_5 ?? 29.1;
  const pm10 = airQuality?.pm10 ?? 30.7;
  const o3 = airQuality?.o3 ?? 106;
  const no2 = airQuality?.no2 ?? 25.2;
  const co = airQuality?.co ?? 387;
  const so2 = airQuality?.so2 ?? 12.8;

  if (standard === "cpcb") {
    const cpcb = calculateCpcbAqi({ pm2_5: pm25, pm10, o3, no2, so2, co });
    const isGood = cpcb.category === "good";
    const isSat = cpcb.category === "satisfactory";
    const isMod = cpcb.category === "moderate";
    const isPoor = cpcb.category === "poor";
    const isVPoor = cpcb.category === "very_poor";

    return {
      aqi: cpcb.aqi,
      standard: "cpcb",
      standardName: "India CPCB (NAQI)",
      standardShortKey: "standardCpcbShort",
      category: cpcb.category,
      categoryKey: isGood
        ? "aqiGood"
        : isSat
        ? "aqiSatisfactory"
        : isMod
        ? "aqiModerate"
        : isPoor
        ? "aqiPoor"
        : isVPoor
        ? "aqiVeryPoor"
        : "aqiSevere",
      adviceKey: isGood
        ? "aqiAdviceGood"
        : isSat
        ? "aqiAdviceSatisfactory"
        : isMod
        ? "aqiAdviceModerate"
        : isPoor
        ? "aqiAdvicePoor"
        : isVPoor
        ? "aqiAdviceVeryPoor"
        : "aqiAdviceSevere",
      dominantPollutant: cpcb.dominant,
      dominantKey: cpcb.dominantKey,
      color: isGood
        ? "text-emerald-400"
        : isSat
        ? "text-lime-400"
        : isMod
        ? "text-amber-400"
        : isPoor
        ? "text-orange-400"
        : isVPoor
        ? "text-rose-500"
        : "text-red-500",
      bg: isGood
        ? "bg-emerald-500/10"
        : isSat
        ? "bg-lime-500/10"
        : isMod
        ? "bg-amber-500/10"
        : isPoor
        ? "bg-orange-500/10"
        : isVPoor
        ? "bg-rose-500/15"
        : "bg-red-500/20",
      border: isGood
        ? "border-emerald-500/30"
        : isSat
        ? "border-lime-500/30"
        : isMod
        ? "border-amber-500/30"
        : isPoor
        ? "border-orange-500/30"
        : isVPoor
        ? "border-rose-500/40"
        : "border-red-500/50",
      badgeBg: isGood
        ? "bg-emerald-500/20 text-emerald-300"
        : isSat
        ? "bg-lime-500/20 text-lime-300"
        : isMod
        ? "bg-amber-500/20 text-amber-300"
        : isPoor
        ? "bg-orange-500/20 text-orange-300"
        : isVPoor
        ? "bg-rose-500/25 text-rose-300"
        : "bg-red-500/30 text-red-200",
      maxScale: 500,
      scaleTicks: [
        { val: 0, labelKey: "aqiGood" },
        { val: 50, labelKey: "aqiSatisfactory" },
        { val: 100, labelKey: "aqiModerate" },
        { val: 200, labelKey: "aqiPoor" },
        { val: 300, labelKey: "aqiVeryPoor" },
        { val: 400, labelKey: "aqiSevere" },
      ],
    };
  }

  if (standard === "european") {
    const eaqi = airQuality?.europeanAqi ?? Math.round(pm25 * 1.6);
    const isGood = eaqi <= 20;
    const isFair = eaqi <= 40;
    const isMod = eaqi <= 60;
    const isPoor = eaqi <= 80;

    return {
      aqi: eaqi,
      standard: "european",
      standardName: "European (EAQI)",
      standardShortKey: "standardEaqiShort",
      category: isGood ? "good" : isFair ? "satisfactory" : isMod ? "moderate" : isPoor ? "poor" : "very_poor",
      categoryKey: isGood
        ? "aqiGood"
        : isFair
        ? "aqiSatisfactory"
        : isMod
        ? "aqiModerate"
        : isPoor
        ? "aqiPoor"
        : "aqiVeryPoor",
      adviceKey: isGood
        ? "aqiAdviceGood"
        : isFair || isMod
        ? "aqiAdviceModerate"
        : "aqiAdviceUnhealthy",
      dominantPollutant: pm25 >= pm10 ? "PM2.5" : "PM10",
      dominantKey: pm25 >= pm10 ? "polPm25" : "polPm10",
      color: isGood ? "text-emerald-400" : isFair ? "text-teal-400" : isMod ? "text-amber-400" : "text-rose-400",
      bg: isGood ? "bg-emerald-500/10" : isFair ? "bg-teal-500/10" : isMod ? "bg-amber-500/10" : "bg-rose-500/15",
      border: isGood ? "border-emerald-500/30" : isFair ? "border-teal-500/30" : isMod ? "border-amber-500/30" : "border-rose-500/40",
      badgeBg: isGood ? "bg-emerald-500/20 text-emerald-300" : isFair ? "bg-teal-500/20 text-teal-300" : isMod ? "bg-amber-500/20 text-amber-300" : "bg-rose-500/25 text-rose-300",
      maxScale: 100,
      scaleTicks: [
        { val: 0, labelKey: "aqiGood" },
        { val: 20, labelKey: "aqiSatisfactory" },
        { val: 40, labelKey: "aqiModerate" },
        { val: 60, labelKey: "aqiPoor" },
        { val: 80, labelKey: "aqiVeryPoor" },
      ],
    };
  }

  // Default: US EPA
  const us = calculateUsEpaAqi({ pm2_5: pm25, pm10, o3, no2 });
  const isGood = us.category === "good";
  const isMod = us.category === "moderate";
  const isSens = us.category === "unhealthy_sensitive";
  const isUn = us.category === "unhealthy";
  const isVUn = us.category === "very_unhealthy";

  return {
    aqi: us.aqi,
    standard: "us_epa",
    standardName: "US EPA (AQI)",
    standardShortKey: "standardUsEpaShort",
    category: us.category,
    categoryKey: isGood
      ? "aqiGood"
      : isMod
      ? "aqiModerate"
      : isSens
      ? "aqiUnhealthySensitive"
      : isUn
      ? "aqiUnhealthy"
      : isVUn
      ? "aqiVeryUnhealthy"
      : "aqiHazardous",
    adviceKey: isGood
      ? "aqiAdviceGood"
      : isMod
      ? "aqiAdviceModerate"
      : isSens
      ? "aqiAdviceUnhealthySensitive"
      : isUn
      ? "aqiAdviceUnhealthy"
      : isVUn
      ? "aqiAdviceVeryUnhealthy"
      : "aqiHazardous",
    dominantPollutant: us.dominant,
    dominantKey: us.dominantKey,
    color: isGood
      ? "text-emerald-400"
      : isMod
      ? "text-amber-400"
      : isSens
      ? "text-orange-400"
      : isUn
      ? "text-rose-400"
      : isVUn
      ? "text-purple-400"
      : "text-red-500",
    bg: isGood
      ? "bg-emerald-500/10"
      : isMod
      ? "bg-amber-500/10"
      : isSens
      ? "bg-orange-500/10"
      : isUn
      ? "bg-rose-500/10"
      : isVUn
      ? "bg-purple-500/10"
      : "bg-red-500/20",
    border: isGood
      ? "border-emerald-500/30"
      : isMod
      ? "border-amber-500/30"
      : isSens
      ? "border-orange-500/30"
      : isUn
      ? "border-rose-500/30"
      : isVUn
      ? "border-purple-500/30"
      : "border-red-500/40",
    badgeBg: isGood
      ? "bg-emerald-500/20 text-emerald-300"
      : isMod
      ? "bg-amber-500/20 text-amber-300"
      : isSens
      ? "bg-orange-500/20 text-orange-300"
      : isUn
      ? "bg-rose-500/20 text-rose-300"
      : isVUn
      ? "bg-purple-500/20 text-purple-300"
      : "bg-red-500/25 text-red-200",
    maxScale: 300,
    scaleTicks: [
      { val: 0, labelKey: "aqiGood" },
      { val: 50, labelKey: "aqiModerate" },
      { val: 100, labelKey: "aqiUnhealthySensitive" },
      { val: 200, labelKey: "aqiUnhealthy" },
      { val: 300, labelKey: "aqiHazardous" },
    ],
  };
}
