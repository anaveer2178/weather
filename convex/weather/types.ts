export type WeatherConditionType =
  | "Clear"
  | "Clouds"
  | "Rain"
  | "Drizzle"
  | "Thunderstorm"
  | "Snow"
  | "Mist"
  | "Smoke"
  | "Haze"
  | "Dust"
  | "Fog"
  | "Sand"
  | "Ash"
  | "Squall"
  | "Tornado";

export type AqiCategory =
  | "good"
  | "satisfactory"
  | "moderate"
  | "poor"
  | "very_poor"
  | "veryPoor"
  | "severe"
  | "unhealthySensitive"
  | "unhealthy_sensitive"
  | "unhealthy"
  | "veryUnhealthy"
  | "very_unhealthy"
  | "hazardous";

export interface AirQualityData {
  aqi: number; // Primary display AQI
  cpcbAqi?: number; // Indian CPCB NAQI (0 - 500)
  usAqi?: number; // US EPA AQI (0 - 500)
  europeanAqi?: number; // European EAQI (0 - 100+)
  category: AqiCategory;
  cpcbCategory?: string;
  dominantPollutant?: string;
  pm2_5: number; // µg/m³
  pm10: number; // µg/m³
  co?: number; // µg/m³
  no2?: number; // µg/m³
  so2?: number; // µg/m³
  o3?: number; // µg/m³
}

export interface CurrentWeather {
  city: string;
  country: string;
  county?: string;
  state?: string;
  district?: string;
  postcode?: string;
  fullAddress?: string;
  lat: number;
  lon: number;
  temp: number;
  feelsLike: number;
  tempMin: number;
  tempMax: number;
  humidity: number;
  pressure: number;
  visibility: number; // in meters or km
  windSpeed: number; // in m/s or km/h
  windDeg: number;
  condition: WeatherConditionType | string;
  description: string;
  icon: string;
  sunrise: number; // timestamp
  sunset: number; // timestamp
  uvIndex?: number;
  cloudiness: number; // %
  timestamp: number;
  airQuality?: AirQualityData;
}

export interface HourlyForecastItem {
  dt: number;
  temp: number;
  feelsLike: number;
  condition: WeatherConditionType | string;
  description: string;
  icon: string;
  pop: number; // Probability of precipitation (0 to 1)
  rainAmount?: number;
  windSpeed: number;
}

export interface DailyForecastItem {
  date: string; // YYYY-MM-DD
  dayName: string; // "Mon", "Tue", etc.
  dt: number;
  minTemp: number;
  maxTemp: number;
  condition: WeatherConditionType | string;
  description: string;
  icon: string;
  pop: number;
  humidity: number;
  windSpeed: number;
}

export interface WeatherDataPayload {
  current: CurrentWeather;
  hourly: HourlyForecastItem[];
  daily: DailyForecastItem[];
  isSimulated?: boolean;
}

export interface GeoLocationResult {
  name: string;
  country: string;
  city?: string;
  state?: string;
  county?: string;
  district?: string;
  postcode?: string;
  fullAddress?: string;
  lat: number;
  lon: number;
}
