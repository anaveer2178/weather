import { useState, useEffect, useRef } from "react";
import { Search, MapPin, X, Navigation, History, Loader2, Compass, Home } from "lucide-react";
import type { GeoLocationResult } from "../../../convex/weather/types";
import { searchLocations } from "../../services/weatherApi";

import { useLanguage } from "../../context/LanguageContext";

interface SearchBarProps {
  onSelectCity: (loc: GeoLocationResult) => void;
  onRequestGeolocation: () => void;
  geoLoading?: boolean;
  recentSearches: GeoLocationResult[];
}

// Popular featured address examples
const FEATURED_SUGGESTIONS: GeoLocationResult[] = [
  {
    name: "Times Square",
    district: "Manhattan",
    city: "New York",
    county: "New York County",
    state: "New York",
    country: "United States",
    postcode: "10036",
    fullAddress: "Times Square, Manhattan, New York, NY 10036, United States",
    lat: 40.758,
    lon: -73.9855,
  },
  {
    name: "10 Downing Street",
    district: "Westminster",
    city: "London",
    county: "Greater London",
    state: "England",
    country: "United Kingdom",
    postcode: "SW1A 2AA",
    fullAddress: "10 Downing Street, Westminster, London, SW1A 2AA, United Kingdom",
    lat: 51.5034,
    lon: -0.1276,
  },
  {
    name: "Eiffel Tower",
    district: "7th Arrondissement",
    city: "Paris",
    state: "Île-de-France",
    country: "France",
    postcode: "75007",
    fullAddress: "Tour Eiffel, 5 Avenue Anatole France, 75007 Paris, France",
    lat: 48.8584,
    lon: 2.2945,
  },
  {
    name: "Orange County",
    county: "Orange County",
    state: "California",
    country: "United States",
    fullAddress: "Orange County, California, United States",
    lat: 33.7175,
    lon: -117.8311,
  },
  {
    name: "Indiranagar",
    district: "Bangalore East",
    city: "Bengaluru",
    county: "Bangalore North",
    state: "Karnataka",
    country: "India",
    postcode: "560038",
    fullAddress: "Indiranagar, Bengaluru, Karnataka, 560038, India",
    lat: 12.9784,
    lon: 77.6409,
  },
  {
    name: "Tokyo Tower",
    district: "Minato",
    city: "Tokyo",
    state: "Tokyo",
    country: "Japan",
    postcode: "105-0011",
    fullAddress: "4-2-8 Shibakoen, Minato City, Tokyo 105-0011, Japan",
    lat: 35.6586,
    lon: 139.7454,
  },
];

export const SearchBar: React.FC<SearchBarProps> = ({
  onSelectCity,
  onRequestGeolocation,
  geoLoading = false,
  recentSearches,
}) => {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeoLocationResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Debounced live geocoding query covering all world addresses
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const found = await searchLocations(trimmed);
        if (found.length > 0) {
          setResults(found);
        } else {
          // If no direct API match, filter featured suggestions
          const localMatches = FEATURED_SUGGESTIONS.filter(
            (c) =>
              c.name.toLowerCase().includes(trimmed.toLowerCase()) ||
              (c.fullAddress && c.fullAddress.toLowerCase().includes(trimmed.toLowerCase())) ||
              (c.county && c.county.toLowerCase().includes(trimmed.toLowerCase())) ||
              c.country.toLowerCase().includes(trimmed.toLowerCase())
          );
          setResults(localMatches);
        }
      } catch (err) {
        console.warn("Search geocode error:", err);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (loc: GeoLocationResult) => {
    onSelectCity(loc);
    setQuery("");
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") setIsOpen(true);
      return;
    }

    const totalItems = results.length > 0 ? results.length : recentSearches.length;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results.length > 0 && selectedIndex >= 0 && selectedIndex < results.length) {
        handleSelect(results[selectedIndex]);
      } else if (results.length > 0) {
        handleSelect(results[0]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative w-full max-w-lg">
      <div className="relative flex items-center">
        <Search
          size={18}
          className="absolute left-4 text-slate-400 pointer-events-none"
        />

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={t("searchPlaceholder")}
          className="w-full bg-white/10 hover:bg-white/15 focus:bg-white/20 text-white placeholder-slate-400 pl-11 pr-24 py-3 rounded-2xl border border-white/10 focus:border-sky-400/50 outline-none backdrop-blur-md transition-all text-sm font-medium"
        />

        <div className="absolute right-2 flex items-center gap-1.5">
          {searching ? (
            <div className="p-1.5 text-sky-400">
              <Loader2 size={16} className="animate-spin" />
            </div>
          ) : query ? (
            <button
              onClick={() => {
                setQuery("");
                setResults([]);
              }}
              title={t("clearInput")}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={15} />
            </button>
          ) : null}

          <button
            onClick={onRequestGeolocation}
            disabled={geoLoading}
            title={t("useGpsLocation")}
            className="p-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 border border-sky-500/30 transition-all flex items-center justify-center disabled:opacity-50 group"
          >
            {geoLoading ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Navigation size={15} className="group-hover:rotate-45 transition-transform" />
            )}
          </button>
        </div>
      </div>

      {/* Dropdown for Autocomplete / Address Results */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 bg-[#0b1220]/95 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl overflow-hidden z-50 py-2 max-h-96 overflow-y-auto"
        >
          {query.trim().length >= 2 ? (
            results.length > 0 ? (
              <div>
                <div className="px-4 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-white/10 pb-1.5 mb-1">
                  <span className="flex items-center gap-1.5">
                    <MapPin size={12} className="text-sky-400" />
                    {t("worldwideMatches")}
                  </span>
                  <span className="text-[10px] text-sky-400 font-mono">{t("osmGlobal")}</span>
                </div>

                {results.map((loc, idx) => (
                  <button
                    key={`${loc.name}-${loc.lat}-${loc.lon}-${idx}`}
                    onClick={() => handleSelect(loc)}
                    className={`w-full text-left px-4 py-3 flex items-start justify-between text-sm transition-colors border-b border-white/5 last:border-b-0 gap-3 ${
                      selectedIndex === idx
                        ? "bg-white/15 text-white"
                        : "hover:bg-white/10 text-slate-200"
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <div className="p-1 rounded-lg bg-sky-500/20 text-sky-400 mt-0.5 shrink-0">
                        <Home size={14} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-white text-sm">{loc.name}</span>
                          {loc.postcode && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono font-medium">
                              {loc.postcode}
                            </span>
                          )}
                          {loc.county && loc.county !== loc.name && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 font-medium">
                              {loc.county}
                            </span>
                          )}
                        </div>

                        {/* Full address string */}
                        <div className="text-xs text-slate-400 mt-1 line-clamp-1 leading-normal">
                          {loc.fullAddress || [loc.district, loc.city, loc.state, loc.country].filter(Boolean).join(", ")}
                        </div>
                      </div>
                    </div>

                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white/10 text-slate-300 shrink-0 self-start mt-1">
                      {loc.country}
                    </span>
                  </button>
                ))}
              </div>
            ) : searching ? (
              <div className="px-4 py-8 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
                <Loader2 size={18} className="animate-spin text-sky-400" />
                <span>{t("searchingAddresses")}</span>
              </div>
            ) : (
              <div className="px-4 py-8 text-center text-xs text-slate-400">
                {t("noMatchingAddress")}
              </div>
            )
          ) : (
            <div>
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div className="mb-2">
                  <div className="px-4 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-1">
                    <History size={12} className="text-sky-400" />
                    <span>{t("recentAddresses")}</span>
                  </div>
                  {recentSearches.map((loc, idx) => (
                    <button
                      key={`recent-${loc.name}-${loc.lat}-${idx}`}
                      onClick={() => handleSelect(loc)}
                      className={`w-full text-left px-4 py-2.5 flex items-center justify-between text-sm transition-colors border-b border-white/5 last:border-b-0 ${
                        selectedIndex === idx
                          ? "bg-white/15 text-white"
                          : "hover:bg-white/10 text-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <History size={14} className="text-slate-400 shrink-0" />
                        <div className="truncate">
                          <span className="font-medium text-white truncate block">{loc.name}</span>
                          {loc.fullAddress && (
                            <span className="text-[11px] text-slate-400 truncate block">
                              {loc.fullAddress}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white/10 text-slate-300 shrink-0 ml-2">
                        {loc.country}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Featured / Popular suggestions */}
              <div>
                <div className="px-4 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-1">
                  <Compass size={12} className="text-amber-400" />
                  <span>{t("featuredAddresses")}</span>
                </div>
                {FEATURED_SUGGESTIONS.map((loc) => (
                  <button
                    key={`featured-${loc.name}`}
                    onClick={() => handleSelect(loc)}
                    className="w-full text-left px-4 py-2.5 flex items-start justify-between text-sm hover:bg-white/10 text-slate-200 transition-colors border-b border-white/5 last:border-b-0"
                  >
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <MapPin size={15} className="text-amber-400/80 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-white">{loc.name}</span>
                          {loc.county && (
                            <span className="text-[10px] text-slate-400">
                              ({loc.county})
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">
                          {loc.fullAddress}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white/10 text-slate-300 shrink-0 ml-2">
                      {loc.country}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
