import React, { useState } from "react";
import { UserPreferences } from "../types";
import { Settings, Thermometer, Wind, Eye, Key, Bell, CheckCircle2, Moon, Sun } from "lucide-react";
import { motion } from "motion/react";

interface SettingsViewProps {
  preferences: UserPreferences;
  onUpdatePreferences: (prefs: Partial<UserPreferences>) => void;
  apiKey: string;
  onUpdateApiKey: (key: string) => void;
}

export default function SettingsView({
  preferences,
  onUpdatePreferences,
  apiKey,
  onUpdateApiKey,
}: SettingsViewProps) {
  const [localKey, setLocalKey] = useState(apiKey);
  const [showKeySuccess, setShowKeySuccess] = useState(false);

  const handleKeySave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateApiKey(localKey.trim());
    setShowKeySuccess(true);
    setTimeout(() => setShowKeySuccess(false), 3000);
  };

  return (
    <div id="settings-tab-view" className="flex flex-col gap-6 p-4 md:p-6 lg:p-8 w-full max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="font-sans text-xl font-bold text-white flex items-center gap-2">
          <Settings className="h-5 w-5 text-indigo-400 animate-spin-slow" />
          System Preferences
        </h2>
        <p className="font-sans text-xs text-slate-400">
          Personalize metrics measurement, toggle localized alert configurations, and customize visual themes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Visuals and Units */}
        <div className="flex flex-col gap-6 rounded-2xl border border-white/10 bg-slate-900/40 p-5 md:p-6 backdrop-blur-md">
          <span className="font-sans text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-white/5 pb-2">
            Metrics & Measurement
          </span>

          {/* Temperature Units */}
          <div className="flex flex-col gap-2">
            <label className="font-sans text-sm font-semibold text-white flex items-center gap-1.5">
              <Thermometer className="h-4 w-4 text-amber-400" />
              Temperature Unit
            </label>
            <div className="grid grid-cols-2 gap-2 bg-slate-950/60 rounded-xl p-1.5 border border-white/5">
              <button
                id="pref-temp-c"
                onClick={() => onUpdatePreferences({ tempUnit: "C" })}
                className={`py-2 text-center rounded-lg font-sans text-xs font-bold transition-all cursor-pointer ${
                  preferences.tempUnit === "C"
                    ? "bg-sky-500 text-white shadow-md shadow-sky-500/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Celsius (°C)
              </button>
              <button
                id="pref-temp-f"
                onClick={() => onUpdatePreferences({ tempUnit: "F" })}
                className={`py-2 text-center rounded-lg font-sans text-xs font-bold transition-all cursor-pointer ${
                  preferences.tempUnit === "F"
                    ? "bg-sky-500 text-white shadow-md shadow-sky-500/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Fahrenheit (°F)
              </button>
            </div>
          </div>

          {/* Wind Speed Units */}
          <div className="flex flex-col gap-2">
            <label className="font-sans text-sm font-semibold text-white flex items-center gap-1.5">
              <Wind className="h-4 w-4 text-teal-400" />
              Wind Speed Unit
            </label>
            <div className="grid grid-cols-3 gap-2 bg-slate-950/60 rounded-xl p-1.5 border border-white/5">
              {(["kmh", "mph", "ms"] as const).map((unit) => (
                <button
                  key={unit}
                  id={`pref-wind-${unit}`}
                  onClick={() => onUpdatePreferences({ windUnit: unit })}
                  className={`py-2 text-center rounded-lg font-sans text-[10px] font-bold uppercase transition-all cursor-pointer ${
                    preferences.windUnit === unit
                      ? "bg-sky-500 text-white shadow-md shadow-sky-500/20"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {unit === "kmh" ? "km/h" : unit === "mph" ? "mph" : "m/s"}
                </button>
              ))}
            </div>
          </div>

          {/* Theme custom toggle */}
          <div className="flex flex-col gap-2">
            <label className="font-sans text-sm font-semibold text-white flex items-center gap-1.5">
              <Sun className="h-4 w-4 text-yellow-400" />
              Visual Theme Mode
            </label>
            <div className="grid grid-cols-2 gap-2 bg-slate-950/60 rounded-xl p-1.5 border border-white/5">
              <button
                id="pref-theme-light"
                onClick={() => onUpdatePreferences({ theme: "light" })}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-lg font-sans text-xs font-bold transition-all cursor-pointer ${
                  preferences.theme === "light"
                    ? "bg-sky-500 text-white shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Sun className="h-3.5 w-3.5" />
                Light Glow
              </button>
              <button
                id="pref-theme-dark"
                onClick={() => onUpdatePreferences({ theme: "dark" })}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-lg font-sans text-xs font-bold transition-all cursor-pointer ${
                  preferences.theme === "dark"
                    ? "bg-sky-500 text-white shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Moon className="h-3.5 w-3.5" />
                Dark Cosmic
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Key Configurations and Alerts */}
        <div className="flex flex-col gap-6 rounded-2xl border border-white/10 bg-slate-900/40 p-5 md:p-6 backdrop-blur-md">
          <span className="font-sans text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-white/5 pb-2">
            API & Security Override
          </span>

          {/* Custom OpenWeatherMap API key field */}
          <form onSubmit={handleKeySave} className="flex flex-col gap-3">
            <div className="flex flex-col">
              <label className="font-sans text-sm font-semibold text-white flex items-center gap-1.5">
                <Key className="h-4 w-4 text-violet-400" />
                OpenWeatherMap API Token
              </label>
              <span className="font-sans text-[10px] text-slate-400 mt-0.5 leading-normal">
                By default, this app operates using Open-Meteo's fully free keyless service. Save your own custom OpenWeather token below if you desire to connect real OpenWeatherMap structures.
              </span>
            </div>

            <div className="flex gap-2">
              <input
                id="settings-api-key-input"
                type="password"
                value={localKey}
                onChange={(e) => setLocalKey(e.target.value)}
                placeholder="Paste token e.g. a1b2c3d4e5f6..."
                className="flex-1 rounded-xl border border-white/10 bg-slate-950/40 px-4 py-2 font-sans text-xs text-white placeholder-slate-600 focus:border-sky-500 focus:outline-none"
              />
              <button
                id="settings-api-key-submit"
                type="submit"
                className="rounded-xl bg-gradient-to-r from-indigo-500 to-sky-500 px-4 py-2 font-sans text-xs font-bold text-white hover:opacity-90 transition-all cursor-pointer"
              >
                Save
              </button>
            </div>

            {showKeySuccess && (
              <span className="font-sans text-[10px] text-emerald-400 font-semibold flex items-center gap-1 mt-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Token registered. Key securely processed server-side.
              </span>
            )}
          </form>

          {/* Local alert toggling options */}
          <div className="flex flex-col gap-3">
            <span className="font-sans text-sm font-semibold text-white flex items-center gap-1.5">
              <Bell className="h-4 w-4 text-sky-400" />
              Notifications & Alerts
            </span>

            <label className="flex items-start gap-3 rounded-xl border border-white/5 bg-slate-950/30 p-3 hover:bg-slate-950/50 cursor-pointer">
              <input
                id="settings-toggle-alerts"
                type="checkbox"
                checked={preferences.notificationsEnabled}
                onChange={(e) => onUpdatePreferences({ notificationsEnabled: e.target.checked })}
                className="mt-0.5 h-4 w-4 rounded border-white/10 bg-slate-950/50 text-sky-500 focus:ring-sky-500 focus:ring-offset-slate-900"
              />
              <div className="flex flex-col">
                <span className="font-sans text-xs font-semibold text-white">Enable Real-Time Weather Warnings</span>
                <span className="font-sans text-[10px] text-slate-500 leading-tight mt-0.5">
                  Receive instant toast popups regarding severe regional events (Gales, Heatwaves, Thunderstorms, Floods).
                </span>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
