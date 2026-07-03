import { useState, useEffect, useRef } from "react";
import { WeatherData, UserPreferences, FavoriteCity } from "../types";
import {
  Search,
  Mic,
  MapPin,
  Heart,
  Share2,
  Download,
  Sun,
  Moon,
  Wind,
  Droplets,
  Gauge,
  Eye,
  Compass,
  Cloud,
  Loader2,
  RefreshCw,
  Copy,
  CheckCircle2,
  X,
  Volume2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface DashboardViewProps {
  weatherData: WeatherData;
  preferences: UserPreferences;
  favorites: FavoriteCity[];
  onAddFavorite: (city: Omit<FavoriteCity, "id" | "addedAt">) => void;
  onRemoveFavorite: (id: string) => void;
  onSearchCity: (query: string) => Promise<any[]>;
  onSelectCity: (lat: number, lon: number, name: string, country: string, state?: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export default function DashboardView({
  weatherData,
  preferences,
  favorites,
  onAddFavorite,
  onRemoveFavorite,
  onSearchCity,
  onSelectCity,
  onRefresh,
  isLoading,
}: DashboardViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceText, setVoiceText] = useState("");

  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Counter animation values
  const [tempCount, setTempCount] = useState(0);

  const autocompleteRef = useRef<HTMLDivElement | null>(null);

  // Close suggestions on outside clicks
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  // Update animated counter when weather temperature changes
  useEffect(() => {
    let start = 0;
    const end = Math.round(weatherData.current.temp);
    if (start === end) {
      setTempCount(end);
      return;
    }
    const duration = 800; // ms
    const increment = end > start ? 1 : -1;
    const stepTime = Math.abs(Math.floor(duration / (end - start || 1)));

    const timer = setInterval(() => {
      start += increment;
      setTempCount(start);
      if (start === end) clearInterval(timer);
    }, Math.max(stepTime, 20));

    return () => clearInterval(timer);
  }, [weatherData.current.temp]);

  // Autocomplete fetcher with debounce
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      const results = await onSearchCity(searchQuery);
      setSuggestions(results);
      setShowSuggestions(true);
      setIsSearching(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Voice Search Simulation
  const handleVoiceSearch = () => {
    setIsVoiceActive(true);
    setVoiceText("Listening...");
    const phrases = ["New York", "London", "Tokyo", "Paris", "Sydney", "Singapore", "Berlin"];
    const randomCity = phrases[Math.floor(Math.random() * phrases.length)];

    setTimeout(() => {
      setVoiceText(`Analyzing: "${randomCity}"`);
    }, 1500);

    setTimeout(() => {
      setSearchQuery(randomCity);
      setIsVoiceActive(false);
      setVoiceText("");
    }, 2800);
  };

  // Convert temperature to preferred unit
  const formatTemp = (celsius: number) => {
    if (preferences.tempUnit === "F") {
      return `${Math.round((celsius * 9) / 5 + 32)}°F`;
    }
    return `${Math.round(celsius)}°C`;
  };

  const getTempNumberOnly = (celsius: number) => {
    if (preferences.tempUnit === "F") {
      return Math.round((celsius * 9) / 5 + 32);
    }
    return Math.round(celsius);
  };

  // Convert wind speed to preferred unit
  const formatWind = (kmh: number) => {
    if (preferences.windUnit === "mph") {
      return `${Math.round(kmh * 0.621371)} mph`;
    }
    if (preferences.windUnit === "ms") {
      return `${Math.round(kmh / 3.6)} m/s`;
    }
    return `${Math.round(kmh)} km/h`;
  };

  // Check if current location is favorited
  const currentFavId = `${weatherData.location.lat.toFixed(4)},${weatherData.location.lon.toFixed(4)}`;
  const isFavorited = favorites.some((f) => f.id === currentFavId || (Math.abs(f.lat - weatherData.location.lat) < 0.01 && Math.abs(f.lon - weatherData.location.lon) < 0.01));

  const handleFavoriteToggle = () => {
    if (isFavorited) {
      const favItem = favorites.find((f) => f.id === currentFavId || (Math.abs(f.lat - weatherData.location.lat) < 0.01 && Math.abs(f.lon - weatherData.location.lon) < 0.01));
      if (favItem) onRemoveFavorite(favItem.id);
    } else {
      onAddFavorite({
        name: weatherData.location.name,
        country: weatherData.location.country,
        state: weatherData.location.state,
        lat: weatherData.location.lat,
        lon: weatherData.location.lon,
      });
    }
  };

  // Share Clipboard Copy
  const handleCopyShare = () => {
    const text = `AetherSky Weather Report for ${weatherData.location.name}: Currently ${formatTemp(weatherData.current.temp)}, feels like ${formatTemp(weatherData.current.feelsLike)}, with ${weatherData.current.humidity}% humidity. Wind speed ${formatWind(weatherData.current.windSpeed)}. Current local time: ${weatherData.current.localTime}.`;
    navigator.clipboard.writeText(text);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  // Download PDF simulation
  const handleDownloadPDF = () => {
    setIsDownloading(true);
    setTimeout(() => {
      setIsDownloading(false);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    }, 2000);
  };

  // Get weather condition label
  const getWeatherConditionName = (code: number) => {
    if (code === 0) return "Clear Sunny";
    if ([1, 2, 3].includes(code)) return "Partly Cloudy";
    if ([45, 48].includes(code)) return "Foggy Mist";
    if ([51, 53, 55, 56, 57].includes(code)) return "Drizzly Rain";
    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "Cascading Rain";
    if ([71, 73, 75, 77, 85, 86].includes(code)) return "Swirling Snow";
    return "Thunderstorm Watch";
  };

  return (
    <div id="dashboard-tab-view" className="flex flex-col gap-6 p-4 md:p-6 lg:p-8 w-full max-w-5xl mx-auto">
      {/* Search Autocomplete Panel */}
      <div ref={autocompleteRef} className="relative w-full max-w-lg mx-auto z-30">
        <div className="relative flex items-center bg-slate-900/50 backdrop-blur-md rounded-2xl border border-white/10 px-4 py-3 shadow-xl hover:border-white/20 transition-all">
          <Search className="h-5 w-5 text-slate-400 shrink-0 mr-3" />
          <input
            id="dashboard-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search city worldwide e.g., Tokyo, London, Paris..."
            className="flex-1 bg-transparent font-sans text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          {isSearching ? (
            <Loader2 className="h-4 w-4 text-sky-400 animate-spin shrink-0" />
          ) : (
            <button
              id="dashboard-search-voice"
              onClick={handleVoiceSearch}
              title="Voice Search Simulation"
              className="rounded-lg p-1 text-slate-400 hover:bg-white/5 hover:text-white transition-colors shrink-0"
            >
              <Mic className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Suggestions Tray */}
        <AnimatePresence>
          {showSuggestions && suggestions.length > 0 && (
            <motion.div
              id="search-suggestions-tray"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute left-0 right-0 mt-2 rounded-2xl border border-white/10 bg-slate-950/95 p-2 shadow-2xl backdrop-blur-xl max-h-[250px] overflow-y-auto"
            >
              {suggestions.map((city) => (
                <button
                  key={city.id}
                  id={`suggestion-${city.id}`}
                  onClick={() => {
                    onSelectCity(city.lat, city.lon, city.name, city.country, city.state);
                    setShowSuggestions(false);
                    setSearchQuery("");
                  }}
                  className="w-full flex items-center justify-between text-left px-4 py-2.5 rounded-xl hover:bg-white/5 text-xs text-white group"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="font-sans font-bold group-hover:text-sky-400 transition-colors truncate">
                      {city.name}
                    </span>
                    <span className="font-sans text-[10px] text-slate-400 truncate mt-0.5">
                      {city.state ? `${city.state}, ` : ""}{city.country}
                    </span>
                  </div>
                  <span className="font-mono text-[9px] text-slate-500 shrink-0">
                    POP: {city.population ? city.population.toLocaleString() : "N/A"}
                  </span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Voice Simulation Banner */}
      <AnimatePresence>
        {isVoiceActive && (
          <motion.div
            id="voice-mic-banner"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex items-center justify-center gap-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 max-w-sm mx-auto"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500 text-white animate-pulse">
              <Volume2 className="h-4.5 w-4.5" />
            </div>
            <span className="font-sans text-xs font-semibold text-indigo-300">
              {voiceText}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Primary Weather Glass Card */}
      <div id="main-glass-weather-card" className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/40 p-6 md:p-8 backdrop-blur-lg shadow-2xl flex flex-col md:flex-row gap-8 justify-between">
        {/* Floating background gradient light */}
        <div className="absolute -top-1/2 -left-1/4 h-[300px] w-[300px] rounded-full bg-sky-500/10 blur-[100px] pointer-events-none" />

        {/* Left Side: General Overview, Temp, Condition, Clock */}
        <div className="flex-1 flex flex-col justify-between z-10 gap-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <h1 className="font-sans text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
                <MapPin className="h-6 w-6 text-sky-400 shrink-0" />
                {weatherData.location.name}
              </h1>
              <span className="font-sans text-xs text-slate-400 mt-1">
                {weatherData.location.state ? `${weatherData.location.state}, ` : ""}{weatherData.location.country}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                id="refresh-weather-btn"
                onClick={onRefresh}
                disabled={isLoading}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-slate-800/40 text-slate-300 hover:bg-slate-800/70 hover:text-white disabled:opacity-50 transition-colors cursor-pointer"
                title="Refresh Weather Data"
              >
                <RefreshCw className={`h-4.5 w-4.5 ${isLoading ? "animate-spin" : ""}`} />
              </button>

              <button
                id="add-favorite-toggle"
                onClick={handleFavoriteToggle}
                className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-colors cursor-pointer ${
                  isFavorited
                    ? "border-rose-500/30 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20"
                    : "border-white/10 bg-slate-800/40 text-slate-300 hover:bg-slate-800/70 hover:text-white"
                }`}
                title={isFavorited ? "Remove from Favorites" : "Add to Favorites"}
              >
                <Heart className={`h-4.5 w-4.5 ${isFavorited ? "fill-rose-500" : ""}`} />
              </button>
            </div>
          </div>

          {/* Temperature and Main Visual Icon */}
          <div className="flex items-end gap-5 my-2">
            <span className="font-sans text-7xl md:text-8xl font-black tracking-tighter text-white select-none">
              {getTempNumberOnly(tempCount)}°
            </span>
            <div className="flex flex-col mb-2.5">
              <span className="font-sans text-sm font-extrabold text-white flex items-center gap-1">
                {getWeatherConditionName(weatherData.current.conditionCode)}
              </span>
              <span className="font-sans text-xs text-slate-400 mt-0.5">
                Feels like: {formatTemp(weatherData.current.feelsLike)}
              </span>
            </div>
          </div>

          {/* Live timezone clock */}
          <div className="flex items-center gap-3 text-slate-400 text-xs font-semibold border-t border-white/5 pt-4">
            <span className="font-sans">CLOCK: <span className="text-white">{weatherData.current.localTime}</span></span>
            <span className="h-3 w-[1px] bg-white/10" />
            <span className="font-sans">TZ: <span className="text-white">{weatherData.location.timezone}</span></span>
          </div>
        </div>

        {/* Right Side: Grid of 9 detailed microclimate cards */}
        <div className="md:w-1/2 grid grid-cols-2 gap-3.5 z-10">
          {/* Card 1: Humidity */}
          <div className="rounded-2xl border border-white/5 bg-slate-950/20 p-3.5 flex items-start gap-3 hover:bg-slate-950/40 transition-colors">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 shrink-0">
              <Droplets className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <span className="font-sans text-[10px] text-slate-500 uppercase tracking-wider block">Humidity</span>
              <span className="font-sans text-sm font-bold text-white block mt-0.5">{weatherData.current.humidity}%</span>
            </div>
          </div>

          {/* Card 2: Wind */}
          <div className="rounded-2xl border border-white/5 bg-slate-950/20 p-3.5 flex items-start gap-3 hover:bg-slate-950/40 transition-colors">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400 shrink-0">
              <Wind className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <span className="font-sans text-[10px] text-slate-500 uppercase tracking-wider block">Wind Speed</span>
              <span className="font-sans text-sm font-bold text-white block mt-0.5">{formatWind(weatherData.current.windSpeed)}</span>
            </div>
          </div>

          {/* Card 3: Pressure */}
          <div className="rounded-2xl border border-white/5 bg-slate-950/20 p-3.5 flex items-start gap-3 hover:bg-slate-950/40 transition-colors">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 shrink-0">
              <Gauge className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <span className="font-sans text-[10px] text-slate-500 uppercase tracking-wider block">Pressure</span>
              <span className="font-sans text-sm font-bold text-white block mt-0.5">{weatherData.current.pressure} hPa</span>
            </div>
          </div>

          {/* Card 4: Visibility */}
          <div className="rounded-2xl border border-white/5 bg-slate-950/20 p-3.5 flex items-start gap-3 hover:bg-slate-950/40 transition-colors">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 shrink-0">
              <Eye className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <span className="font-sans text-[10px] text-slate-500 uppercase tracking-wider block">Visibility</span>
              <span className="font-sans text-sm font-bold text-white block mt-0.5">{weatherData.current.visibility.toFixed(1)} km</span>
            </div>
          </div>

          {/* Card 5: Sunrise */}
          <div className="rounded-2xl border border-white/5 bg-slate-950/20 p-3.5 flex items-start gap-3 hover:bg-slate-950/40 transition-colors">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400 shrink-0">
              <Sun className="h-5 w-5 animate-spin-slow" />
            </div>
            <div className="min-w-0">
              <span className="font-sans text-[10px] text-slate-500 uppercase tracking-wider block">Sunrise</span>
              <span className="font-sans text-sm font-bold text-white block mt-0.5">{weatherData.current.sunrise}</span>
            </div>
          </div>

          {/* Card 6: Sunset */}
          <div className="rounded-2xl border border-white/5 bg-slate-950/20 p-3.5 flex items-start gap-3 hover:bg-slate-950/40 transition-colors">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 shrink-0">
              <Moon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <span className="font-sans text-[10px] text-slate-500 uppercase tracking-wider block">Sunset</span>
              <span className="font-sans text-sm font-bold text-white block mt-0.5">{weatherData.current.sunset}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating utility shortcuts: Share weather, download meteorology summary */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          id="dashboard-btn-share"
          onClick={() => setShowShareModal(true)}
          className="flex h-10 items-center gap-1.5 rounded-xl border border-white/10 bg-slate-900/40 px-4 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors cursor-pointer"
        >
          <Share2 className="h-4 w-4" />
          Share Report
        </button>

        <button
          id="dashboard-btn-pdf"
          onClick={handleDownloadPDF}
          disabled={isDownloading}
          className="flex h-10 items-center gap-1.5 rounded-xl border border-white/10 bg-slate-900/40 px-4 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors cursor-pointer"
        >
          {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {downloadSuccess ? "PDF Compiled!" : "Download PDF"}
        </button>
      </div>

      {/* Modal: Share Report */}
      <AnimatePresence>
        {showShareModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShareModal(false)}
              className="fixed inset-0 z-50 bg-black"
            />
            <motion.div
              id="share-report-modal"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-slate-900/95 p-6 shadow-2xl backdrop-blur-xl"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-3.5 mb-4">
                <span className="font-sans text-sm font-bold text-white">Share Meteorological Report</span>
                <button
                  id="close-share-modal"
                  onClick={() => setShowShareModal(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-white/5 hover:text-white"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              <div className="bg-slate-950/50 p-4 rounded-xl border border-white/5 font-sans text-xs text-slate-300 leading-relaxed mb-4">
                {`AetherSky Report: ${weatherData.location.name} currently ${formatTemp(weatherData.current.temp)}, feels like ${formatTemp(weatherData.current.feelsLike)}, ${weatherData.current.humidity}% humidity. local time: ${weatherData.current.localTime}`}
              </div>

              <button
                id="copy-share-btn"
                onClick={handleCopyShare}
                className="w-full flex h-10 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-4 text-xs font-bold text-white hover:opacity-90 transition-all cursor-pointer"
              >
                {copiedShare ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copiedShare ? "Copied to Clipboard!" : "Copy Report Text"}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
