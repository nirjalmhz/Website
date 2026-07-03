import { useState, useEffect } from "react";
import { User, UserPreferences, FavoriteCity, SearchHistoryItem, WeatherData, WeatherAlert } from "./types";
import WeatherBackground from "./components/WeatherBackground";
import Navbar from "./components/Navbar";
import NotificationCenter from "./components/NotificationCenter";
import DashboardView from "./components/DashboardView";
import ForecastView from "./components/ForecastView";
import AirQualityView from "./components/AirQualityView";
import MapsView from "./components/MapsView";
import FavoritesView from "./components/FavoritesView";
import ProfileView from "./components/ProfileView";
import SettingsView from "./components/SettingsView";
import AdminView from "./components/AdminView";
import Footer from "./components/Footer";
import AuthModal from "./components/AuthModal";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);

  // Authentication State
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Preferences State (default values)
  const [preferences, setPreferences] = useState<UserPreferences>({
    tempUnit: "C",
    windUnit: "kmh",
    theme: "dark",
    notificationsEnabled: true,
  });

  const [apiKey, setApiKey] = useState<string>("");

  // Location & Weather State
  // Default coordinates: Tokyo, Japan
  const [coords, setCoords] = useState({ lat: 35.6762, lon: 139.6503, name: "Tokyo", country: "Japan", state: undefined as string | undefined });
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  // Lists synchronized with Database
  const [favorites, setFavorites] = useState<FavoriteCity[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [isFavHistoryLoading, setIsFavHistoryLoading] = useState(false);

  // Weather Alerts list
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [activeToast, setActiveToast] = useState<WeatherAlert | null>(null);
  const [unreadAlertsCount, setUnreadAlertsCount] = useState(0);

  // 1. Check existing session and preferences on initial load
  useEffect(() => {
    const savedToken = localStorage.getItem("aether_token");
    const savedUser = localStorage.getItem("aether_user");
    const savedApiKey = localStorage.getItem("aether_api_key");

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }

    if (savedApiKey) {
      setApiKey(savedApiKey);
    }

    // Auto-detect user geolocation on load if supported
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          try {
            // Geocode location coordinates to retrieve city name
            const res = await fetch(`/api/weather/reverse-geocode?lat=${lat}&lon=${lon}`);
            const data = await res.json();
            setCoords({
              lat,
              lon,
              name: data.name || "Custom Location",
              country: data.country || "Unknown",
              state: data.state,
            });
          } catch {
            setCoords({ lat, lon, name: "Detected Location", country: "Local Coordinates", state: undefined });
          }
        },
        () => {
          // If Geolocation denied, keep default coordinates (Tokyo)
          console.log("Geolocation permission denied, falling back to default city.");
        }
      );
    }
  }, []);

  // 2. Load and Sync Auth-Dependent Data (Favorites, History, Preferences)
  useEffect(() => {
    if (!token) {
      setFavorites([]);
      setSearchHistory([]);
      return;
    }

    const loadUserData = async () => {
      setIsFavHistoryLoading(true);
      try {
        const headers = { Authorization: `Bearer ${token}` };

        // Concurrent profile queries
        const [favsRes, historyRes, prefsRes] = await Promise.all([
          fetch("/api/favorites", { headers }),
          fetch("/api/history", { headers }),
          fetch("/api/preferences", { headers }),
        ]);

        if (favsRes.ok) {
          const favs = await favsRes.json();
          setFavorites(favs);
        }
        if (historyRes.ok) {
          const history = await historyRes.json();
          setSearchHistory(history);
        }
        if (prefsRes.ok) {
          const prefs = await prefsRes.json();
          setPreferences(prefs);
        }
      } catch (err) {
        console.error("Failed to sync user data from database:", err);
      } finally {
        setIsFavHistoryLoading(false);
      }
    };

    loadUserData();
  }, [token]);

  // Apply theme settings to HTML element
  useEffect(() => {
    const root = window.document.documentElement;
    if (preferences.theme === "dark") {
      root.classList.add("dark");
      root.style.backgroundColor = "#0b0e14"; // matches weather canvas deep dark sky
    } else {
      root.classList.remove("dark");
      root.style.backgroundColor = "#f8fafc"; // light gray sky flow
    }
  }, [preferences.theme]);

  // 3. Fetch Meteorology Data whenever coordinates or unit parameters adjust
  const fetchWeather = async () => {
    setIsWeatherLoading(true);
    setWeatherError(null);
    try {
      const qParams = new URLSearchParams({
        lat: coords.lat.toString(),
        lon: coords.lon.toString(),
        name: coords.name,
        country: coords.country,
      });
      if (coords.state) qParams.append("state", coords.state);

      const response = await fetch(`/api/weather?${qParams.toString()}`);
      if (!response.ok) {
        throw new Error("Meteorological servers returned an invalid package.");
      }

      const data: WeatherData = await response.json();
      setWeatherData(data);

      // Generate dynamic weather alerts based on metrics
      if (preferences.notificationsEnabled) {
        generateMeteorologyAlerts(data);
      }
    } catch (err: any) {
      setWeatherError(err.message || "Failed to establish a data connection to weather networks.");
    } finally {
      setIsWeatherLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, [coords, preferences.tempUnit]);

  // 4. Generate dynamic weather alerts based on physical weather indicators
  const generateMeteorologyAlerts = async (data: WeatherData) => {
    const generatedAlerts: WeatherAlert[] = [];
    
    // Fetch system-wide global administrator bulletins
    try {
      const gRes = await fetch("/api/alerts/global");
      if (gRes.ok) {
        const globalAlerts = await gRes.json();
        if (Array.isArray(globalAlerts)) {
          generatedAlerts.push(...globalAlerts);
        }
      }
    } catch (err) {
      console.error("Failed to load global admin bulletins:", err);
    }

    const idPrefix = Date.now().toString();

    // Condition 1: High Wind Speed (Storm warning)
    if (data.current.windSpeed > 35) {
      generatedAlerts.push({
        id: `${idPrefix}-storm`,
        type: "Storm Watch",
        title: "Severe Regional Gale Warning",
        message: `Winds of ${data.current.windSpeed} km/h recorded in ${data.location.name}. High turbulence. Anchor secure assets immediately.`,
        severity: "danger",
        createdAt: new Date().toISOString(),
      });
    }

    // Condition 2: Heavy Rainfall (Rain/Flood warning)
    if (data.current.humidity > 85 && data.current.cloudCover > 85) {
      generatedAlerts.push({
        id: `${idPrefix}-flood`,
        type: "Heavy Rain",
        title: "Precipitation Flash Flood Watch",
        message: "Convection storm cells are consolidating. Roadway pooling and local visibility reductions in effect.",
        severity: "warning",
        createdAt: new Date().toISOString(),
      });
    }

    // Condition 3: Extreme Heat or Extreme Cold
    if (data.current.temp > 35) {
      generatedAlerts.push({
        id: `${idPrefix}-heatwave`,
        type: "Heatwave",
        title: "Thermal Solar Alert",
        message: "High ambient temperature registered. Hydrate continuously and minimize direct sunlight exposure.",
        severity: "danger",
        createdAt: new Date().toISOString(),
      });
    } else if (data.current.temp < 2) {
      generatedAlerts.push({
        id: `${idPrefix}-frost`,
        type: "Snow Watch",
        title: "Slippery Frost Freeze Watch",
        message: "Ambient freezing point boundaries reached. Watch for black ice formations along road networks.",
        severity: "warning",
        createdAt: new Date().toISOString(),
      });
    }

    // Default interactive alert if none match to show fully dynamic notification counts!
    if (generatedAlerts.length === 0) {
      generatedAlerts.push({
        id: `${idPrefix}-stable`,
        type: "Stable Watch",
        title: "Microclimate Stable Advisory",
        message: `Atmospheric measurements across ${data.location.name} are thoroughly stable. Ideal for standard operations.`,
        severity: "info",
        createdAt: new Date().toISOString(),
      });
    }

    setAlerts(generatedAlerts);
    setUnreadAlertsCount(generatedAlerts.length);

    // Show top toast for the most severe alert
    const majorAlert = generatedAlerts.find((a) => a.severity === "danger") || generatedAlerts[0];
    if (majorAlert) {
      setActiveToast(majorAlert);
    }
  };

  // 5. Autocomplete Worldwide City Search Proxy Handler
  const handleSearchCity = async (query: string): Promise<any[]> => {
    try {
      const response = await fetch(`/api/weather/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      console.error("Geocoding search failed:", err);
    }
    return [];
  };

  const handleSelectCity = async (lat: number, lon: number, name: string, country: string, state?: string) => {
    setCoords({ lat, lon, name, country, state });
    setActiveTab("dashboard");

    // Add to history in database if logged in
    if (token) {
      try {
        await fetch("/api/history", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ id: `${lat.toFixed(4)},${lon.toFixed(4)}`, lat, lon, name, country, state }),
        });
        // Reload history
        const historyRes = await fetch("/api/history", { headers: { Authorization: `Bearer ${token}` } });
        if (historyRes.ok) {
          const history = await historyRes.json();
          setSearchHistory(history);
        }
      } catch (err) {
        console.error("Failed to append search history:", err);
      }
    }
  };

  // 6. Favorites Add & Remove
  const handleAddFavorite = async (city: Omit<FavoriteCity, "id" | "addedAt">) => {
    if (!token) {
      // Prompt log in if not authenticated
      setIsAuthOpen(true);
      return;
    }
    try {
      const response = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: `${city.lat.toFixed(4)},${city.lon.toFixed(4)}`, ...city }),
      });
      if (response.ok) {
        const favsRes = await fetch("/api/favorites", { headers: { Authorization: `Bearer ${token}` } });
        if (favsRes.ok) {
          setFavorites(await favsRes.json());
        }
      }
    } catch (err) {
      console.error("Failed to append city favorite:", err);
    }
  };

  const handleRemoveFavorite = async (id: string) => {
    if (!token) return;
    try {
      const response = await fetch(`/api/favorites/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setFavorites(favorites.filter((f) => f.id !== id));
      }
    } catch (err) {
      console.error("Failed to remove city favorite:", err);
    }
  };

  const handleReorderFavorites = async (reorderedIds: string[]) => {
    if (!token) return;
    try {
      const response = await fetch("/api/favorites/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reorderedIds }),
      });
      if (response.ok) {
        setFavorites(await response.json());
      }
    } catch (err) {
      console.error("Failed to sync favorites order:", err);
    }
  };

  // 7. Profile Edit Name
  const handleUpdateProfile = async (name: string): Promise<boolean> => {
    if (!token || !user) return false;
    try {
      // Simulate profile updates or append names in session
      const updatedUser = { ...user, name };
      setUser(updatedUser);
      localStorage.setItem("aether_user", JSON.stringify(updatedUser));
      return true;
    } catch {
      return false;
    }
  };

  // Clear search logs
  const handleClearHistory = async () => {
    if (!token) return;
    try {
      const response = await fetch("/api/history", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setSearchHistory([]);
      }
    } catch (err) {
      console.error("Failed to clear search footprint:", err);
    }
  };

  // Preference overrides
  const handleUpdatePreferences = async (newPrefs: Partial<UserPreferences>) => {
    const updated = { ...preferences, ...newPrefs };
    setPreferences(updated);

    if (token) {
      try {
        await fetch("/api/preferences", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(updated),
        });
      } catch (err) {
        console.error("Failed to save updated preferences:", err);
      }
    }
  };

  const handleUpdateApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem("aether_api_key", key);
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setFavorites([]);
    setSearchHistory([]);
    localStorage.removeItem("aether_token");
    localStorage.removeItem("aether_user");
  };

  return (
    <div
      className={`min-h-screen flex flex-col relative overflow-hidden transition-colors duration-1000 ${
        preferences.theme === "dark" ? "text-slate-100 bg-[#0b0e14]" : "text-slate-900 bg-slate-50"
      }`}
    >
      {/* Background meteorology canvas particle layers */}
      <WeatherBackground
        conditionCode={weatherData?.current.conditionCode ?? 0}
        isDay={weatherData?.current.isDay ?? true}
      />

      {/* Frosted Glass ambient glowing radial lights */}
      {preferences.theme === "dark" ? (
        <>
          <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-600/15 blur-[140px] rounded-full pointer-events-none z-0" />
          <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-purple-600/15 blur-[140px] rounded-full pointer-events-none z-0" />
        </>
      ) : (
        <>
          <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-sky-200/40 blur-[140px] rounded-full pointer-events-none z-0" />
          <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-violet-200/40 blur-[140px] rounded-full pointer-events-none z-0" />
        </>
      )}

      {/* Primary Sticky Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onLogout={handleLogout}
        onOpenAuth={() => setIsAuthOpen(true)}
        alerts={alerts}
        onOpenAlerts={() => {
          setIsAlertsOpen(true);
          setUnreadAlertsCount(0);
        }}
        unreadAlertsCount={unreadAlertsCount}
      />

      {/* Floating alert notifications */}
      <NotificationCenter
        isOpen={isAlertsOpen}
        onClose={() => setIsAlertsOpen(false)}
        alerts={alerts}
        onDismissAlert={(id) => setAlerts(alerts.filter((a) => a.id !== id))}
        onDismissAll={() => setAlerts([])}
        activeToast={activeToast}
        onCloseToast={() => setActiveToast(null)}
      />

      {/* Authentication Gateway */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={(t, u) => {
          setToken(t);
          setUser(u);
        }}
      />

      {/* Central Interactive Workspace */}
      <main className="flex-1 w-full flex flex-col py-6 relative z-10">
        {isWeatherLoading && !weatherData ? (
          <div className="flex-1 flex flex-col items-center justify-center py-28 text-center">
            <Loader2 className="h-12 w-12 text-sky-400 animate-spin mb-4" />
            <span className="font-sans text-sm font-semibold text-slate-400">
              Fetching meteorological packages...
            </span>
          </div>
        ) : weatherError ? (
          <div className="mx-auto max-w-md my-16 rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center backdrop-blur-md">
            <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-4 animate-bounce" />
            <h3 className="font-sans text-base font-bold text-white">Meteorology Connection Error</h3>
            <p className="mt-2 font-sans text-xs text-slate-300 leading-relaxed">
              {weatherError}
            </p>
            <button
              id="error-retry-weather"
              onClick={fetchWeather}
              className="mt-6 flex h-9 items-center gap-1.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 px-5 text-xs font-bold text-white hover:opacity-90 mx-auto shadow-md cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reconnect Servers
            </button>
          </div>
        ) : weatherData ? (
          <>
            {activeTab === "dashboard" && (
              <DashboardView
                weatherData={weatherData}
                preferences={preferences}
                favorites={favorites}
                onAddFavorite={handleAddFavorite}
                onRemoveFavorite={handleRemoveFavorite}
                onSearchCity={handleSearchCity}
                onSelectCity={handleSelectCity}
                onRefresh={fetchWeather}
                isLoading={isWeatherLoading}
              />
            )}

            {activeTab === "forecast" && (
              <ForecastView
                weatherData={weatherData}
                preferences={preferences}
              />
            )}

            {activeTab === "airquality" && (
              <AirQualityView
                airQuality={weatherData.airQuality}
              />
            )}

            {activeTab === "maps" && (
              <MapsView
                weatherData={weatherData}
                preferences={preferences}
              />
            )}

            {activeTab === "favorites" && (
              <FavoritesView
                favorites={favorites}
                onSelectCity={handleSelectCity}
                onRemoveFavorite={handleRemoveFavorite}
                onReorderFavorites={handleReorderFavorites}
                isLoading={isFavHistoryLoading}
              />
            )}

            {activeTab === "profile" && (
              <ProfileView
                user={user}
                searchHistory={searchHistory}
                onSelectCity={handleSelectCity}
                onClearHistory={handleClearHistory}
                onUpdateProfile={handleUpdateProfile}
                onOpenAuth={() => setIsAuthOpen(true)}
              />
            )}

            {activeTab === "settings" && (
              <SettingsView
                preferences={preferences}
                onUpdatePreferences={handleUpdatePreferences}
                apiKey={apiKey}
                onUpdateApiKey={handleUpdateApiKey}
              />
            )}

            {activeTab === "admin" && (
              <AdminView
                currentUser={user}
                onAuthSuccess={(t, u) => {
                  setToken(t);
                  setUser(u);
                }}
              />
            )}
          </>
        ) : null}
      </main>

      {/* Footer Waves */}
      <Footer />
    </div>
  );
}
