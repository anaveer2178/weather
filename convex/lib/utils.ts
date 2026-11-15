import type { WeatherDataPayload, WeatherConditionType, AqiCategory } from "../weather/types";

export function formatCacheKey(lat: number, lon: number): string {
  return `coords:${lat.toFixed(2)},${lon.toFixed(2)}`;
}

export function formatCityCacheKey(cityName: string): string {
  return `city:${cityName.trim().toLowerCase()}`;
}

export function kelvinToCelsius(kelvin: number): number {
  return Math.round((kelvin - 273.15) * 10) / 10;
}

export function celsiusToFahrenheit(celsius: number): number {
  return Math.round(((celsius * 9) / 5 + 32) * 10) / 10;
}

export function msToKmh(ms: number): number {
  return Math.round(ms * 3.6 * 10) / 10;
}

export function msToMph(ms: number): number {
  return Math.round(ms * 2.23694 * 10) / 10;
}

export function generateSimulatedWeather(
  cityName: string,
  country: string,
  lat: number,
  lon: number
): WeatherDataPayload {
  const now = Math.floor(Date.now() / 1000);
  const nowMs = Date.now();
  
  const seed = (Math.abs(Math.sin(lat * 12.9898 + lon * 78.233)) * 10000) % 1;
  
  let baseCondition: WeatherConditionType = "Clouds";
  if (seed < 0.35) baseCondition = "Clear";
  else if (seed < 0.55) baseCondition = "Clouds";
  else if (seed < 0.75) baseCondition = "Rain";
  else if (seed < 0.88) baseCondition = "Thunderstorm";
  else if (lat > 55 || lat < -55) baseCondition = "Snow";
  else if (seed < 0.95) baseCondition = "Drizzle";
  else baseCondition = "Fog";

  const latFactor = Math.cos((lat * Math.PI) / 180);
  const baseTemp = Math.round((latFactor * 26 + (seed * 8 - 4)) * 10) / 10;
  const humidity = Math.min(95, Math.max(30, Math.round(45 + seed * 45)));
  const windSpeed = Math.round((2.5 + seed * 6.5) * 10) / 10;
  const pressure = Math.round(1012 + (seed - 0.5) * 18);

  const current = {
    city: cityName || "Sample City",
    country: country || "US",
    lat,
    lon,
    temp: baseTemp,
    feelsLike: Math.round((baseTemp + (humidity > 60 ? 1.5 : -1.0)) * 10) / 10,
    tempMin: Math.round((baseTemp - 3.5) * 10) / 10,
    tempMax: Math.round((baseTemp + 4.2) * 10) / 10,
    humidity,
    pressure,
    visibility: baseCondition === "Fog" ? 2500 : 10000,
    windSpeed,
    windDeg: Math.round(seed * 360),
    condition: baseCondition,
    description:
      baseCondition === "Clear"
        ? "Clear sky and sunshine"
        : baseCondition === "Clouds"
        ? "Scattered cloud cover"
        : baseCondition === "Rain"
        ? "Moderate passing rain showers"
        : baseCondition === "Thunderstorm"
        ? "Isolated thunderstorm with lightning"
        : baseCondition === "Snow"
        ? "Light falling snow"
        : baseCondition === "Fog"
        ? "Dense atmospheric fog"
        : "Overcast with light drizzle",
    icon: baseCondition === "Clear" ? "01d" : baseCondition === "Clouds" ? "03d" : "10d",
    sunrise: now - (now % 86400) + 6 * 3600,
    sunset: now - (now % 86400) + 18.5 * 3600,
    uvIndex: baseCondition === "Clear" ? 7.2 : 3.4,
    cloudiness: baseCondition === "Clear" ? 5 : 75,
    timestamp: nowMs,
    airQuality: {
      aqi: baseCondition === "Clear" ? 38 : 68,
      category: (baseCondition === "Clear" ? "good" : "moderate") as AqiCategory,
      pm2_5: baseCondition === "Clear" ? 9.2 : 22.4,
      pm10: baseCondition === "Clear" ? 18.0 : 38.6,
      no2: 18.2,
      o3: 65.0,
    },
  };

  const hourly = Array.from({ length: 24 }).map((_, i) => {
    const time = now + i * 3600;
    const hourOfDay = new Date(time * 1000).getHours();
    const diurnalDelta = Math.sin(((hourOfDay - 9) / 24) * 2 * Math.PI) * 4;
    const hourTemp = Math.round((baseTemp + diurnalDelta + (Math.sin(i) * 0.8)) * 10) / 10;
    const pop = baseCondition === "Rain" ? Math.min(1, Math.max(0.2, 0.4 + Math.sin(i * 0.7) * 0.5)) : 0.05;

    return {
      dt: time,
      temp: hourTemp,
      feelsLike: hourTemp,
      condition: i % 4 === 0 && baseCondition === "Clouds" ? "Clear" : baseCondition,
      description: current.description,
      icon: current.icon,
      pop: Math.round(pop * 100) / 100,
      rainAmount: pop > 0.4 ? Math.round(pop * 2.5 * 10) / 10 : 0,
      windSpeed: Math.round((windSpeed + Math.sin(i) * 1.5) * 10) / 10,
    };
  });

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const daily = Array.from({ length: 5 }).map((_, i) => {
    const dateObj = new Date(nowMs + i * 86400000);
    const dayName = i === 0 ? "Today" : days[dateObj.getDay()];
    const dateStr = dateObj.toISOString().split("T")[0];
    const daySeed = (seed + i * 0.17) % 1;
    
    let cond: WeatherConditionType = baseCondition;
    if (daySeed > 0.6) cond = "Clear";
    else if (daySeed > 0.3) cond = "Clouds";
    else cond = "Rain";

    const dayDelta = Math.sin(i) * 2.5;

    return {
      date: dateStr,
      dayName,
      dt: Math.floor(dateObj.getTime() / 1000),
      minTemp: Math.round((baseTemp - 4 + dayDelta) * 10) / 10,
      maxTemp: Math.round((baseTemp + 5 + dayDelta) * 10) / 10,
      condition: cond,
      description: cond === "Clear" ? "Sunny" : cond === "Rain" ? "Showers" : "Partly cloudy",
      icon: cond === "Clear" ? "01d" : cond === "Rain" ? "10d" : "03d",
      pop: cond === "Rain" ? 0.75 : 0.1,
      humidity: Math.round(50 + daySeed * 30),
      windSpeed: Math.round((windSpeed + (daySeed - 0.5) * 2) * 10) / 10,
    };
  });

  return {
    current,
    hourly,
    daily,
    isSimulated: true,
  };
}
