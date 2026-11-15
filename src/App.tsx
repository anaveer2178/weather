import { useState, useMemo, useEffect, useCallback } from "react";
import { CloudLightning, Info, Radio, LayoutDashboard, Users, Sliders } from "lucide-react";
import { useWeather } from "./hooks/useWeather";
import { useGeolocation } from "./hooks/useGeolocation";
import { WeatherAtmosphere } from "./components/weather/WeatherAtmosphere";
import { CurrentWeatherCard } from "./components/weather/CurrentWeatherCard";
import { HourlyForecast } from "./components/weather/HourlyForecast";
import { DailyForecast } from "./components/weather/DailyForecast";
import { WeatherMetrics } from "./components/weather/WeatherMetrics";
import { HyperlocalAlertBanner } from "./components/weather/HyperlocalAlertBanner";
import { GroundTruthCard } from "./components/weather/GroundTruthCard";
import { CrowdWeatherReportModal } from "./components/weather/CrowdWeatherReportModal";
import { SearchBar } from "./components/navigation/SearchBar";
import { PinnedCitiesBar } from "./components/navigation/PinnedCitiesBar";
import { UnitToggle } from "./components/navigation/UnitToggle";
import { LanguageSelector } from "./components/navigation/LanguageSelector";
import { LiveNewsTicker } from "./components/news/LiveNewsTicker";
import { LiveWeatherNewsSection } from "./components/news/LiveWeatherNewsSection";
import { WeatherArticleModal } from "./components/news/WeatherArticleModal";
import type { WeatherNewsArticle } from "./services/weatherNewsService";
import { useLanguage } from "./context/LanguageContext";
import { translateCondition, formatLocalizedNumber } from "./services/i18n";
import { computeHyperlocalNowcast, type NowcastAlert } from "./services/nowcastAlertService";
import { evaluateGroundTruthCalibration, type GroundTruthCalibration } from "./services/groundTruthService";
import { CrowdFeedbackService } from "./services/crowdFeedbackService";

export function App() {
  const [activeTab, setActiveTab] = useState<"forecast" | "news">("forecast");
  const [selectedArticle, setSelectedArticle] = useState<WeatherNewsArticle | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [autoCorrectEnabled, setAutoCorrectEnabled] = useState<boolean>(true);
  const [crowdConsensus, setCrowdConsensus] = useState<{
    hasConsensus: boolean;
    condition: string;
    verifiedUserCount: number;
    summary: string;
  }>({
    hasConsensus: false,
    condition: "",
    verifiedUserCount: 0,
    summary: "",
  });

  const { currentLang, t, isRtl } = useLanguage();

  const {
    weatherData,
    loading,
    error,
    currentCoords,
    unit,
    setUnit,
    pinnedCities,
    recentSearches,
    selectLocation,
    fetchWeatherForCoords,
    togglePin,
    isCurrentPinned,
    formatTemp,
    formatSpeed,
  } = useWeather();

  const localizedFormatTemp = useCallback(
    (celsius: number) => formatTemp(celsius, currentLang),
    [formatTemp, currentLang]
  );

  const localizedFormatSpeed = useCallback(
    (ms: number) => formatSpeed(ms, currentLang),
    [formatSpeed, currentLang]
  );

  const {
    loading: geoLoading,
    error: geoError,
    requestLocation,
  } = useGeolocation();

  const handleUseGeolocation = async () => {
    const loc = await requestLocation();
    if (loc) {
      fetchWeatherForCoords(
        loc.lat,
        loc.lon,
        loc.city,
        loc.country,
        loc.county,
        loc.state,
        loc.district,
        undefined,
        loc.fullAddress
      );
    }
  };

  const handleRefresh = () => {
    fetchWeatherForCoords(
      currentCoords.lat,
      currentCoords.lon,
      currentCoords.city,
      currentCoords.country,
      currentCoords.county,
      currentCoords.state,
      currentCoords.district,
      currentCoords.postcode,
      currentCoords.fullAddress
    );
  };

  const activeLocationName = useMemo(() => {
    if (!weatherData?.current) return currentCoords.city;
    return weatherData.current.district || weatherData.current.county || weatherData.current.city;
  }, [weatherData?.current, currentCoords.city]);

  // Sync crowd consensus on load and location change
  useEffect(() => {
    if (currentCoords) {
      const consensus = CrowdFeedbackService.getConsensus(
        currentCoords.lat,
        currentCoords.lon,
        activeLocationName,
        weatherData?.current?.condition || "Clouds"
      );
      setCrowdConsensus(consensus);
    }
  }, [currentCoords, activeLocationName, weatherData?.current?.condition]);

  // Real-time listener for crowd feedback events
  useEffect(() => {
    const handleCrowdUpdate = () => {
      const consensus = CrowdFeedbackService.getConsensus(
        currentCoords.lat,
        currentCoords.lon,
        activeLocationName,
        weatherData?.current?.condition || "Clouds"
      );
      setCrowdConsensus(consensus);
    };

    window.addEventListener("weather:crowd-report-submitted" as any, handleCrowdUpdate);
    return () => {
      window.removeEventListener("weather:crowd-report-submitted" as any, handleCrowdUpdate);
    };
  }, [currentCoords, activeLocationName, weatherData?.current?.condition]);

  // 1. Compute Hyperlocal Nowcast Alert ("Alert Gaps")
  const nowcastAlert: NowcastAlert | null = useMemo(() => {
    if (!weatherData?.current || !weatherData?.hourly) return null;
    return computeHyperlocalNowcast(weatherData.current, weatherData.hourly, currentLang);
  }, [weatherData?.current, weatherData?.hourly, currentLang]);

  // 2. Compute Ground Truth Calibration ("No ground truth")
  const groundTruthCalibration: GroundTruthCalibration | null = useMemo(() => {
    if (!weatherData?.current) return null;
    return evaluateGroundTruthCalibration(weatherData.current, autoCorrectEnabled);
  }, [weatherData?.current, autoCorrectEnabled]);

  // 3. Calibrated Effective Weather incorporating Ground Truth + Crowd Feedback
  const effectiveWeather = useMemo(() => {
    if (!weatherData?.current) return null;
    let base = { ...weatherData.current };

    if (autoCorrectEnabled && groundTruthCalibration && groundTruthCalibration.discrepancyDetected) {
      base.temp = groundTruthCalibration.calibratedTemp;
      base.feelsLike = groundTruthCalibration.calibratedFeelsLike;
      // Only calibrate condition if actual ground station precipitation is detected
      if (groundTruthCalibration.station.precipitationRate > 0) {
        base.condition = groundTruthCalibration.calibratedCondition;
      }
    }

    // Only apply crowd consensus if an actual user submitted an observation
    if (crowdConsensus.hasConsensus && crowdConsensus.condition) {
      base.condition = crowdConsensus.condition as any;
    }

    return base;
  }, [weatherData?.current, autoCorrectEnabled, groundTruthCalibration, crowdConsensus]);

  const currentCondition = effectiveWeather?.condition || weatherData?.current?.condition || "Clear";
  const iconCode = weatherData?.current?.icon || "01d";
  const isNight = iconCode.endsWith("n");

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      className="relative min-h-screen text-slate-100 flex flex-col selection:bg-sky-500/30"
    >
      {/* Dynamic GSAP particle & gradient atmosphere */}
      <WeatherAtmosphere condition={currentCondition} isNight={isNight} />

      {/* Main Content Area */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 py-6 md:py-8 flex flex-col gap-5">
        {/* Top Navbar */}
        <header className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 self-start md:self-auto">
            <div className="p-2.5 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30 shadow-lg shadow-sky-500/10 shrink-0">
              <CloudLightning size={24} />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white block">
                {t("appName")}
              </span>
              <span className="text-xs text-slate-400 block -mt-0.5">
                {t("appTagline")}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-end flex-wrap">
            <div className="flex-1 md:w-80 lg:w-96 min-w-[220px]">
              <SearchBar
                onSelectCity={selectLocation}
                onRequestGeolocation={handleUseGeolocation}
                geoLoading={geoLoading}
                recentSearches={recentSearches}
              />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIsReportModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 text-xs font-semibold transition-all hover:scale-105 shadow-md shadow-indigo-500/10"
                title={t("reportWeather")}
              >
                <Users size={15} />
                <span className="hidden sm:inline">{t("reportWeather")}</span>
              </button>
              <LanguageSelector />
              <UnitToggle unit={unit} onChange={setUnit} />
            </div>
          </div>
        </header>

        {/* Live Weather News Ticker */}
        <LiveNewsTicker
          weather={effectiveWeather || weatherData?.current}
          unit={unit}
          onSelectArticle={(article) => setSelectedArticle(article)}
          onOpenNewsTab={() => setActiveTab("news")}
        />

        {/* Hyperlocal Nowcast Alert Banner */}
        <HyperlocalAlertBanner alert={nowcastAlert} />

        {/* Navigation Tabs: Forecast vs Live Weather News Report */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("forecast")}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs md:text-sm font-semibold transition-all ${
                activeTab === "forecast"
                  ? "bg-white/20 text-white border border-white/30 shadow-md backdrop-blur-md"
                  : "bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
              }`}
            >
              <LayoutDashboard size={15} />
              <span>{t("forecastDashboard")}</span>
            </button>

            <button
              onClick={() => setActiveTab("news")}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs md:text-sm font-semibold transition-all relative ${
                activeTab === "news"
                  ? "bg-rose-500/25 text-rose-300 border border-rose-500/40 shadow-md backdrop-blur-md"
                  : "bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
              <Radio size={15} className="text-rose-400" />
              <span>{t("liveNewsReport")}</span>
            </button>
          </div>

          {(currentCoords.county || currentCoords.city) && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-sky-400 bg-sky-500/10 px-3 py-1.5 rounded-xl border border-sky-500/20">
              <span className="text-slate-400">{t("activeCounty")}:</span>
              <span className="font-semibold truncate max-w-[180px]">
                {currentCoords.county || currentCoords.city}
              </span>
            </div>
          )}
        </div>

        {/* Pinned / Favorite Cities Bar */}
        <PinnedCitiesBar
          pinnedCities={pinnedCities}
          activeCoords={currentCoords}
          onSelectCity={selectLocation}
          onRemoveCity={(city: string, country: string, lat: number, lon: number) =>
            togglePin(city, country, lat, lon)
          }
        />

        {/* Error message banner */}
        {(error || geoError) && (
          <div className="p-4 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-200 text-sm flex items-center gap-3">
            <Info size={18} className="shrink-0" />
            <span>{error || geoError}</span>
          </div>
        )}

        {/* Content Area */}
        {!loading && weatherData && weatherData.current ? (
          activeTab === "forecast" ? (
            <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Hero Card & Hourly Forecast (7 columns on large) */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                {/* Ground Truth Sensor Station Calibration */}
                {groundTruthCalibration && (
                  <GroundTruthCard
                    calibration={groundTruthCalibration}
                    autoCorrectEnabled={autoCorrectEnabled}
                    onToggleAutoCorrect={setAutoCorrectEnabled}
                  />
                )}

                <CurrentWeatherCard
                  weather={effectiveWeather || weatherData.current}
                  formatTemp={localizedFormatTemp}
                  isPinned={isCurrentPinned}
                  onTogglePin={() =>
                    togglePin(
                      weatherData.current.city,
                      weatherData.current.country,
                      weatherData.current.lat,
                      weatherData.current.lon,
                      weatherData.current.county,
                      weatherData.current.state,
                      weatherData.current.fullAddress
                    )
                  }
                  onRefresh={handleRefresh}
                  isSimulated={weatherData.isSimulated}
                  onOpenReportModal={() => setIsReportModalOpen(true)}
                  isCalibrated={autoCorrectEnabled && !!groundTruthCalibration?.discrepancyDetected}
                  stationCode={groundTruthCalibration?.station?.stationCode}
                  crowdVerifiedCount={crowdConsensus.hasConsensus ? crowdConsensus.verifiedUserCount : undefined}
                />

                <HourlyForecast
                  hourly={weatherData.hourly}
                  formatTemp={localizedFormatTemp}
                />

                {/* Meteorological Indicators Grid */}
                <WeatherMetrics
                  weather={effectiveWeather || weatherData.current}
                  formatSpeed={localizedFormatSpeed}
                />
              </div>

              {/* Right Column: 5-Day Forecast & Live News Teaser (5 columns on large) */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                <DailyForecast
                  daily={weatherData.daily}
                  formatTemp={localizedFormatTemp}
                />

                {/* Live News Spotlight Teaser Card */}
                <div
                  onClick={() => setActiveTab("news")}
                  className="glass-panel rounded-3xl p-6 backdrop-blur-xl border border-rose-500/30 hover:border-rose-500/50 cursor-pointer transition-all bg-gradient-to-br from-rose-950/20 to-sky-950/20 group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                      <span className="text-xs font-bold uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
                        <Radio size={14} />
                        {t("newsDeskTitle")}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-sky-400 group-hover:underline">
                      {t("openReport")} →
                    </span>
                  </div>

                  <h4 className="text-sm md:text-base font-semibold text-white group-hover:text-rose-200 transition-colors">
                    {t("synopticBulletinFor")} {weatherData.current.city}
                    {weatherData.current.county ? ` (${weatherData.current.county})` : ""}
                  </h4>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed line-clamp-2">
                    {t("spotlightSubtitle")}
                  </p>
                </div>

                {/* Atmospheric Summary Card */}
                <div className="glass-panel rounded-3xl p-6 backdrop-blur-xl border border-white/10 text-xs text-slate-300 leading-relaxed space-y-3">
                  <div className="flex items-center gap-2 font-semibold text-white text-sm">
                    <Info size={16} className="text-sky-400" />
                    <span>{t("atmosphericSummary")}</span>
                  </div>
                  <p>
                    <strong className="text-white">{t("today")}</strong> -{" "}
                    <strong className="text-white">{weatherData.current.city}</strong>
                    {weatherData.current.county ? ` (${weatherData.current.county})` : ""}:{" "}
                    {translateCondition(weatherData.current.description, currentLang)}.{" "}
                    {t("feelsLike")}: <strong className="text-white">{localizedFormatTemp(weatherData.current.feelsLike)}</strong>,{" "}
                    {t("today")}: <strong className="text-white">{localizedFormatTemp((effectiveWeather || weatherData.current).temp)}</strong> (
                    <strong className="text-white">{localizedFormatTemp(weatherData.current.tempMax)}</strong> /{" "}
                    <strong className="text-white">{localizedFormatTemp(weatherData.current.tempMin)}</strong>),{" "}
                    {t("humidity")}: <strong className="text-white">{formatLocalizedNumber(weatherData.current.humidity, currentLang)}%</strong>.
                  </p>
                  <div className="pt-2 border-t border-white/10 flex items-center justify-between text-slate-400 text-[11px]">
                    <span>{t("cloudCover")}: {formatLocalizedNumber(weatherData.current.cloudiness, currentLang)}%</span>
                    <span>{t("providerSync")}</span>
                  </div>
                </div>
              </div>
            </main>
          ) : (
            /* Live Weather News Report View */
            <LiveWeatherNewsSection
              weather={effectiveWeather || weatherData.current}
              unit={unit}
            />
          )
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
            <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">{t("fetchingData")}</span>
          </div>
        )}
      </div>

      {/* Floating Mobile Action Bar (Responsive across all mobile screen sizes) */}
      <div className="md:hidden fixed bottom-4 inset-x-4 z-40 bg-slate-900/90 backdrop-blur-xl border border-white/20 rounded-2xl p-2.5 shadow-2xl flex items-center justify-between">
        <button
          onClick={() => setIsReportModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-xs font-semibold shadow-md active:scale-95"
        >
          <Users size={14} />
          <span>{t("reportWeather")}</span>
        </button>

        <div className="flex items-center gap-2">
          {groundTruthCalibration && (
            <button
              onClick={() => setAutoCorrectEnabled(!autoCorrectEnabled)}
              className={`flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-xl border transition-colors ${
                autoCorrectEnabled
                  ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                  : "bg-white/5 text-white/50 border-white/10"
              }`}
              title={t("toggleCalibration")}
            >
              <Sliders size={12} />
              <span>{autoCorrectEnabled ? t("groundTruth") : t("rawForecast")}</span>
            </button>
          )}
        </div>
      </div>

      {/* Crowd Weather Reporting Modal */}
      <CrowdWeatherReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        locationName={activeLocationName}
        lat={currentCoords.lat}
        lon={currentCoords.lon}
        currentWeatherCondition={weatherData?.current?.condition}
      />

      {/* Global article modal triggered from ticker */}
      <WeatherArticleModal
        article={selectedArticle}
        onClose={() => setSelectedArticle(null)}
      />

      {/* Footer */}
      <footer className="mt-auto py-6 text-center text-xs text-slate-500 border-t border-white/5 relative z-10">
        <p>{t("footerTagline")}</p>
      </footer>
    </div>
  );
}

export default App;
