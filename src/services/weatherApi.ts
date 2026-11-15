import type {
  WeatherDataPayload,
  GeoLocationResult,
  CurrentWeather,
  HourlyForecastItem,
  DailyForecastItem,
  WeatherConditionType,
  AirQualityData,
} from "../../convex/weather/types";
import { generateSimulatedWeather } from "../../convex/lib/utils";
import { calculateCpcbAqi } from "./aqiService";

// Map WMO Weather Interpretation Codes to condition string, description, and icon
interface WmoMapping {
  condition: WeatherConditionType;
  description: string;
  dayIcon: string;
  nightIcon: string;
}

export function mapWmoCode(code: number): WmoMapping {
  switch (code) {
    case 0:
      return { condition: "Clear", description: "Clear sky and sunshine", dayIcon: "01d", nightIcon: "01n" };
    case 1:
      return { condition: "Clear", description: "Mainly clear", dayIcon: "02d", nightIcon: "02n" };
    case 2:
      return { condition: "Clouds", description: "Partly cloudy", dayIcon: "03d", nightIcon: "03n" };
    case 3:
      return { condition: "Clouds", description: "Overcast cloud cover", dayIcon: "04d", nightIcon: "04n" };
    case 45:
      return { condition: "Fog", description: "Atmospheric fog", dayIcon: "50d", nightIcon: "50n" };
    case 48:
      return { condition: "Fog", description: "Depositing rime fog", dayIcon: "50d", nightIcon: "50n" };
    case 51:
      return { condition: "Drizzle", description: "Light drizzle", dayIcon: "09d", nightIcon: "09n" };
    case 53:
      return { condition: "Drizzle", description: "Moderate drizzle", dayIcon: "09d", nightIcon: "09n" };
    case 55:
      return { condition: "Drizzle", description: "Dense drizzle", dayIcon: "09d", nightIcon: "09n" };
    case 56:
    case 57:
      return { condition: "Drizzle", description: "Freezing drizzle", dayIcon: "09d", nightIcon: "09n" };
    case 61:
      return { condition: "Rain", description: "Slight rain showers", dayIcon: "10d", nightIcon: "10n" };
    case 63:
      return { condition: "Rain", description: "Moderate steady rain", dayIcon: "10d", nightIcon: "10n" };
    case 65:
      return { condition: "Rain", description: "Heavy downpour", dayIcon: "10d", nightIcon: "10n" };
    case 66:
    case 67:
      return { condition: "Rain", description: "Freezing rain", dayIcon: "10d", nightIcon: "10n" };
    case 71:
      return { condition: "Snow", description: "Slight snowfall", dayIcon: "13d", nightIcon: "13n" };
    case 73:
      return { condition: "Snow", description: "Moderate snowfall", dayIcon: "13d", nightIcon: "13n" };
    case 75:
      return { condition: "Snow", description: "Heavy snowfall blizzard", dayIcon: "13d", nightIcon: "13n" };
    case 77:
      return { condition: "Snow", description: "Snow grains", dayIcon: "13d", nightIcon: "13n" };
    case 80:
      return { condition: "Rain", description: "Slight rain showers", dayIcon: "09d", nightIcon: "09n" };
    case 81:
      return { condition: "Rain", description: "Moderate rain showers", dayIcon: "09d", nightIcon: "09n" };
    case 82:
      return { condition: "Rain", description: "Violent rain showers", dayIcon: "09d", nightIcon: "09n" };
    case 85:
    case 86:
      return { condition: "Snow", description: "Heavy snow showers", dayIcon: "13d", nightIcon: "13n" };
    case 95:
      return { condition: "Thunderstorm", description: "Thunderstorm with lightning", dayIcon: "11d", nightIcon: "11n" };
    case 96:
    case 99:
      return { condition: "Thunderstorm", description: "Severe thunderstorm with hail", dayIcon: "11d", nightIcon: "11n" };
    default:
      return { condition: "Clear", description: "Fair atmospheric conditions", dayIcon: "01d", nightIcon: "01n" };
  }
}

/**
 * Searches ANY address in the world:
 * - Street addresses & house numbers (e.g. "10 Downing St", "1600 Pennsylvania Ave", "221B Baker St")
 * - Postal / Zip codes (e.g. "90210", "SW1A 1AA", "560038", "10001")
 * - Cities, counties, towns, villages, districts, neighborhoods (e.g. "Orange County", "Indiranagar", "Manhattan")
 * - Landmarks, buildings, parks, stations, universities
 * - Raw GPS coordinates ("12.97, 77.59")
 *
 * Powered by OpenStreetMap (Photon & Nominatim worldwide index).
 */
export async function searchLocations(query: string): Promise<GeoLocationResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  // 1. Direct Coordinates input check
  const coordRegex = /^(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)$/;
  const coordMatch = trimmed.match(coordRegex);
  if (coordMatch) {
    const lat = parseFloat(coordMatch[1]);
    const lon = parseFloat(coordMatch[2]);
    if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      return [
        {
          name: `Coordinates (${lat.toFixed(4)}, ${lon.toFixed(4)})`,
          country: "GPS",
          state: "Direct Location",
          county: "Exact Coordinates",
          fullAddress: `Latitude: ${lat.toFixed(4)}, Longitude: ${lon.toFixed(4)}`,
          lat,
          lon,
        },
      ];
    }
  }

  const results: GeoLocationResult[] = [];

  // Helper to deduplicate results by proximity
  const addResult = (item: GeoLocationResult) => {
    const exists = results.some(
      (r) => Math.abs(r.lat - item.lat) < 0.005 && Math.abs(r.lon - item.lon) < 0.005
    );
    if (!exists) {
      results.push(item);
    }
  };

  // 2. Primary Provider: Photon (OpenStreetMap global addresses index)
  try {
    const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(
      trimmed
    )}&limit=12&lang=en`;

    const res = await fetch(photonUrl);
    if (res.ok) {
      const data = await res.json();
      if (data.features && Array.isArray(data.features)) {
        for (const feature of data.features) {
          const coords = feature.geometry?.coordinates;
          const props = feature.properties;
          if (!coords || coords.length < 2 || !props) continue;

          const lon = coords[0];
          const lat = coords[1];

          // Determine best display name
          const streetAddr = props.street
            ? props.housenumber
              ? `${props.housenumber} ${props.street}`
              : props.street
            : "";

          const mainName = props.name || streetAddr || props.city || props.district || trimmed;

          const district = props.district || props.locality || props.quarter || props.suburb || "";
          const city = props.city || props.town || props.village || props.municipality || "";
          const county = props.county || "";
          const state = props.state || "";
          const postcode = props.postcode || "";
          const country = props.country || props.countrycode || "";

          // Build clean full address string
          const parts = [
            props.name && streetAddr && props.name !== streetAddr ? `${props.name}, ${streetAddr}` : props.name || streetAddr,
            district,
            city,
            county && county !== city ? county : "",
            state,
            postcode,
            country,
          ].filter(Boolean);

          const fullAddress = Array.from(new Set(parts)).join(", ");

          addResult({
            name: mainName,
            country,
            state: state || undefined,
            county: county || district || undefined,
            district: district || undefined,
            city: city || undefined,
            postcode: postcode || undefined,
            fullAddress: fullAddress || mainName,
            lat,
            lon,
          });
        }
      }
    }
  } catch (err) {
    console.warn("Photon address search failed, attempting Nominatim fallback:", err);
  }

  // 3. Secondary Provider: OpenStreetMap Nominatim (Search all world addresses, streets & postal codes)
  if (results.length < 3) {
    try {
      const nomUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        trimmed
      )}&format=json&addressdetails=1&limit=8`;

      const res = await fetch(nomUrl, {
        headers: { "User-Agent": "AetheriaWeatherApp/1.0" },
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          for (const item of data) {
            const lat = parseFloat(item.lat);
            const lon = parseFloat(item.lon);
            const addr = item.address || {};

            const streetAddr = addr.road
              ? addr.house_number
                ? `${addr.house_number} ${addr.road}`
                : addr.road
              : "";

            const mainName = item.name || streetAddr || addr.city || addr.suburb || trimmed;
            const county = addr.county || addr.state_district || "";
            const district = addr.suburb || addr.neighbourhood || addr.quarter || "";
            const city = addr.city || addr.town || addr.village || addr.municipality || "";
            const state = addr.state || addr.region || "";
            const country = addr.country || "";
            const postcode = addr.postcode || "";

            addResult({
              name: mainName,
              country,
              state: state || undefined,
              county: county || district || undefined,
              district: district || undefined,
              city: city || undefined,
              postcode: postcode || undefined,
              fullAddress: item.display_name || mainName,
              lat,
              lon,
            });
          }
        }
      }
    } catch (err) {
      console.warn("Nominatim address search failed:", err);
    }
  }

  // 4. Fallback Provider: Open-Meteo Geocoding
  if (results.length === 0) {
    try {
      const cleanName = trimmed.split(",")[0].trim();
      const omUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        cleanName
      )}&count=10&language=en&format=json`;

      const res = await fetch(omUrl);
      if (res.ok) {
        const data = await res.json();
        if (data.results && Array.isArray(data.results)) {
          for (const item of data.results) {
            addResult({
              name: item.name,
              country: item.country || item.country_code || "",
              state: item.admin1 || "",
              county: item.admin2 || (item.admin3 ? item.admin3 : ""),
              fullAddress: [item.name, item.admin2, item.admin1, item.country].filter(Boolean).join(", "),
              lat: item.latitude,
              lon: item.longitude,
            });
          }
        }
      }
    } catch (err) {
      console.warn("Open-Meteo geocoding fallback failed:", err);
    }
  }

  return results;
}

/**
 * Reverse geocodes coordinates to find the exact Address, City, County, State, and Country.
 * Uses BigDataCloud and OpenStreetMap Nominatim.
 */
export async function reverseGeocodeLocation(
  lat: number,
  lon: number
): Promise<{
  city: string;
  county?: string;
  state?: string;
  district?: string;
  country: string;
  fullAddress?: string;
}> {
  // Try BigDataCloud
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const city =
        data.city ||
        data.locality ||
        data.principalSubdivision ||
        "Current Location";
      const country = data.countryName || data.countryCode || "";
      const state = data.principalSubdivision || "";

      let county = "";
      let district = data.locality || "";
      if (data.localityInfo && Array.isArray(data.localityInfo.administrative)) {
        const countyObj = data.localityInfo.administrative.find(
          (admin: any) =>
            admin.order === 12 ||
            admin.adminLevel === 6 ||
            (admin.name && (admin.name.includes("County") || admin.name.includes("District") || admin.name.includes("Parish")))
        );
        if (countyObj && countyObj.name) {
          county = countyObj.name;
        }
      }

      const fullAddress = [data.locality, city, county, state, country].filter(Boolean).join(", ");

      return {
        city,
        county: county || undefined,
        district: district || undefined,
        state: state || undefined,
        country,
        fullAddress,
      };
    }
  } catch (err) {
    console.warn("BigDataCloud reverse geocode failed, trying Nominatim:", err);
  }

  // Fallback to OpenStreetMap Nominatim reverse geocode
  try {
    const nomRevUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`;
    const res = await fetch(nomRevUrl, {
      headers: { "User-Agent": "AetheriaWeatherApp/1.0" },
    });
    if (res.ok) {
      const item = await res.json();
      const addr = item.address || {};
      const city = addr.city || addr.town || addr.village || addr.municipality || "Current Location";
      const county = addr.county || addr.state_district || "";
      const district = addr.suburb || addr.neighbourhood || addr.quarter || "";
      const state = addr.state || addr.region || "";
      const country = addr.country || "";

      return {
        city,
        county: county || undefined,
        district: district || undefined,
        state: state || undefined,
        country,
        fullAddress: item.display_name,
      };
    }
  } catch (err) {
    console.warn("Nominatim reverse geocode failed:", err);
  }

  return {
    city: "Current Location",
    country: "",
  };
}

/**
 * Fetches real live weather data from Open-Meteo for any latitude and longitude.
 * Supports full street addresses, counties, and postal areas worldwide.
 */
export async function fetchLiveWeatherData(
  lat: number,
  lon: number,
  cityName?: string,
  country?: string,
  county?: string,
  state?: string,
  district?: string,
  postcode?: string,
  fullAddress?: string
): Promise<WeatherDataPayload> {
  const resolvedCity = cityName || "Current Location";
  const resolvedCountry = country || "";

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,cloud_cover&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,precipitation_probability_max,wind_speed_10m_max&wind_speed_unit=ms&timezone=auto`;
    const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,european_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone`;

    const [res, aqiRes] = await Promise.all([
      fetch(url),
      fetch(aqiUrl).catch((err) => {
        console.warn("Air quality API request failed:", err);
        return null;
      }),
    ]);

    if (!res.ok) {
      throw new Error(`Open-Meteo API returned status ${res.status}`);
    }

    const data = await res.json();
    const cur = data.current;
    const isDay = cur.is_day === 1;
    const mapping = mapWmoCode(cur.weather_code);
    const icon = isDay ? mapping.dayIcon : mapping.nightIcon;

    // Air Quality Index parsing
    let airQuality: AirQualityData | undefined;
    if (aqiRes && aqiRes.ok) {
      try {
        const aqiJson = await aqiRes.json();
        const cAqi = aqiJson?.current;
        if (cAqi) {
          const usAqi = Math.round(cAqi.us_aqi ?? 48);
          let usCat: AirQualityData["category"] = "good";
          if (usAqi > 300) usCat = "hazardous";
          else if (usAqi > 200) usCat = "veryUnhealthy";
          else if (usAqi > 150) usCat = "unhealthy";
          else if (usAqi > 100) usCat = "unhealthySensitive";
          else if (usAqi > 50) usCat = "moderate";

          const rawPm25 = Math.round((cAqi.pm2_5 ?? 15.2) * 10) / 10;
          const rawPm10 = Math.round((cAqi.pm10 ?? 26.4) * 10) / 10;
          const rawO3 = cAqi.ozone !== undefined ? Math.round(cAqi.ozone * 10) / 10 : undefined;
          const rawNo2 = cAqi.nitrogen_dioxide !== undefined ? Math.round(cAqi.nitrogen_dioxide * 10) / 10 : undefined;
          const rawSo2 = cAqi.sulphur_dioxide !== undefined ? Math.round(cAqi.sulphur_dioxide * 10) / 10 : undefined;
          const rawCo = cAqi.carbon_monoxide ? Math.round(cAqi.carbon_monoxide) : undefined;

          // Official Indian CPCB NAQI calculation
          const cpcbResult = calculateCpcbAqi({
            pm2_5: rawPm25,
            pm10: rawPm10,
            o3: rawO3,
            no2: rawNo2,
            so2: rawSo2,
            co: rawCo,
          });

          // If location is in India, default active primary aqi to Indian CPCB NAQI
          const isIndia = resolvedCountry.toLowerCase().includes("india") || (lat >= 6 && lat <= 38 && lon >= 68 && lon <= 98);
          const primaryAqi = isIndia ? cpcbResult.aqi : usAqi;
          const primaryCategory = isIndia ? cpcbResult.category : usCat;

          airQuality = {
            aqi: primaryAqi,
            cpcbAqi: cpcbResult.aqi,
            usAqi,
            europeanAqi: cAqi.european_aqi !== undefined ? Math.round(cAqi.european_aqi) : undefined,
            category: primaryCategory,
            cpcbCategory: cpcbResult.category,
            dominantPollutant: cpcbResult.dominant,
            pm2_5: rawPm25,
            pm10: rawPm10,
            co: rawCo,
            no2: rawNo2,
            so2: rawSo2,
            o3: rawO3,
          };
        }
      } catch (e) {
        console.warn("Failed parsing AQI JSON:", e);
      }
    }

    if (!airQuality) {
      // High-quality fallback derived from atmospheric dynamics
      const estAqi = Math.min(180, Math.max(30, Math.round(55 + (cur.relative_humidity_2m > 70 ? 15 : 0) - cur.wind_speed_10m * 1.5)));
      let category: AirQualityData["category"] = "moderate";
      if (estAqi <= 50) category = "good";
      else if (estAqi > 150) category = "unhealthy";
      else if (estAqi > 100) category = "unhealthySensitive";

      airQuality = {
        aqi: estAqi,
        category,
        pm2_5: Math.round(estAqi * 0.35 * 10) / 10,
        pm10: Math.round(estAqi * 0.55 * 10) / 10,
      };
    }

    // Daily sunrise / sunset parsing
    let sunriseTs = Math.floor(Date.now() / 1000) - 14400;
    let sunsetTs = Math.floor(Date.now() / 1000) + 14400;
    let todayMin = cur.temperature_2m - 3;
    let todayMax = cur.temperature_2m + 4;

    if (data.daily && data.daily.time && data.daily.time.length > 0) {
      if (data.daily.sunrise && data.daily.sunrise[0]) {
        sunriseTs = Math.floor(new Date(data.daily.sunrise[0]).getTime() / 1000);
      }
      if (data.daily.sunset && data.daily.sunset[0]) {
        sunsetTs = Math.floor(new Date(data.daily.sunset[0]).getTime() / 1000);
      }
      if (data.daily.temperature_2m_min && data.daily.temperature_2m_min[0] !== undefined) {
        todayMin = data.daily.temperature_2m_min[0];
      }
      if (data.daily.temperature_2m_max && data.daily.temperature_2m_max[0] !== undefined) {
        todayMax = data.daily.temperature_2m_max[0];
      }
    }

    // Realistic UV calculation
    const hour = new Date().getHours();
    let baseUv = 0;
    if (hour >= 6 && hour <= 18) {
      const solarFactor = Math.sin(((hour - 6) / 12) * Math.PI);
      const cloudFactor = 1 - (cur.cloud_cover / 100) * 0.7;
      baseUv = Math.round(solarFactor * 8.5 * cloudFactor * 10) / 10;
    }

    // Visibility estimation
    let visibility = 10000;
    if (cur.weather_code >= 45 && cur.weather_code <= 48) visibility = 1500;
    else if (cur.weather_code >= 61 && cur.weather_code <= 65) visibility = 6000;
    else if (cur.weather_code >= 71) visibility = 3500;

    const current: CurrentWeather = {
      city: resolvedCity,
      country: resolvedCountry,
      county: county,
      state: state,
      district: district,
      postcode: postcode,
      fullAddress: fullAddress,
      lat,
      lon,
      temp: Math.round(cur.temperature_2m * 10) / 10,
      feelsLike: Math.round(cur.apparent_temperature * 10) / 10,
      tempMin: Math.round(todayMin * 10) / 10,
      tempMax: Math.round(todayMax * 10) / 10,
      humidity: Math.round(cur.relative_humidity_2m),
      pressure: Math.round(cur.surface_pressure),
      visibility,
      windSpeed: Math.round(cur.wind_speed_10m * 10) / 10,
      windDeg: Math.round(cur.wind_direction_10m),
      condition: mapping.condition,
      description: mapping.description,
      icon,
      sunrise: sunriseTs,
      sunset: sunsetTs,
      uvIndex: baseUv,
      cloudiness: Math.round(cur.cloud_cover),
      timestamp: Date.now(),
      airQuality,
    };

    // Parse Hourly (next 24 hours starting from current time)
    const hourlyItems: HourlyForecastItem[] = [];
    if (data.hourly && data.hourly.time) {
      const nowTs = Date.now();
      let startIndex = data.hourly.time.findIndex(
        (t: string) => new Date(t).getTime() >= nowTs - 3600000
      );
      if (startIndex < 0) startIndex = 0;

      for (let i = startIndex; i < Math.min(startIndex + 24, data.hourly.time.length); i++) {
        const timeIso = data.hourly.time[i];
        const dt = Math.floor(new Date(timeIso).getTime() / 1000);
        const code = data.hourly.weather_code ? data.hourly.weather_code[i] : 0;
        const hMap = mapWmoCode(code);
        const itemHour = new Date(timeIso).getHours();
        const isItemDay = itemHour >= 6 && itemHour <= 19;
        const pop = data.hourly.precipitation_probability ? data.hourly.precipitation_probability[i] / 100 : 0;

        hourlyItems.push({
          dt,
          temp: Math.round(data.hourly.temperature_2m[i] * 10) / 10,
          feelsLike: Math.round(
            (data.hourly.apparent_temperature ? data.hourly.apparent_temperature[i] : data.hourly.temperature_2m[i]) * 10
          ) / 10,
          condition: hMap.condition,
          description: hMap.description,
          icon: isItemDay ? hMap.dayIcon : hMap.nightIcon,
          pop: Math.round(pop * 100) / 100,
          windSpeed: Math.round((data.hourly.wind_speed_10m ? data.hourly.wind_speed_10m[i] : 2.5) * 10) / 10,
        });
      }
    }

    // Parse Daily (7-day forecast)
    const dailyItems: DailyForecastItem[] = [];
    if (data.daily && data.daily.time) {
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      for (let i = 0; i < Math.min(7, data.daily.time.length); i++) {
        const dateStr = data.daily.time[i];
        const dateObj = new Date(dateStr + "T12:00:00");
        const dayName = i === 0 ? "Today" : days[dateObj.getDay()];
        const code = data.daily.weather_code ? data.daily.weather_code[i] : 0;
        const dMap = mapWmoCode(code);
        const pop = data.daily.precipitation_probability_max ? data.daily.precipitation_probability_max[i] / 100 : 0;

        dailyItems.push({
          date: dateStr,
          dayName,
          dt: Math.floor(dateObj.getTime() / 1000),
          minTemp: Math.round(data.daily.temperature_2m_min[i] * 10) / 10,
          maxTemp: Math.round(data.daily.temperature_2m_max[i] * 10) / 10,
          condition: dMap.condition,
          description: dMap.description,
          icon: dMap.dayIcon,
          pop: Math.round(pop * 100) / 100,
          humidity: current.humidity,
          windSpeed: Math.round(
            (data.daily.wind_speed_10m_max ? data.daily.wind_speed_10m_max[i] / 3.6 : 3.0) * 10
          ) / 10,
        });
      }
    }

    return {
      current,
      hourly: hourlyItems,
      daily: dailyItems,
      isSimulated: false,
    };
  } catch (error) {
    console.warn("Failed fetching live weather from Open-Meteo, falling back to simulated engine:", error);
    return generateSimulatedWeather(resolvedCity, resolvedCountry, lat, lon);
  }
}
