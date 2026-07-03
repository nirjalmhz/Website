import { WeatherData, UserPreferences } from "../types";
import { Sun, Cloud, CloudRain, CloudSnow, AlertTriangle, Wind, Droplets, Calendar, Clock } from "lucide-react";
import { motion } from "motion/react";

interface ForecastViewProps {
  weatherData: WeatherData;
  preferences: UserPreferences;
}

export default function ForecastView({ weatherData, preferences }: ForecastViewProps) {
  // Convert temperature to preferred unit
  const formatTemp = (celsius: number) => {
    if (preferences.tempUnit === "F") {
      return `${Math.round((celsius * 9) / 5 + 32)}°F`;
    }
    return `${Math.round(celsius)}°C`;
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

  // Condition icon mapper
  const getWeatherIcon = (code: number, sizeClass = "h-6 w-6") => {
    if (code === 0) return <Sun className={`${sizeClass} text-yellow-400`} />;
    if ([1, 2, 3].includes(code)) return <Cloud className={`${sizeClass} text-slate-300`} />;
    if ([45, 48].includes(code)) return <Cloud className={`${sizeClass} text-slate-400`} />;
    if ([51, 53, 55, 56, 57].includes(code)) return <CloudRain className={`${sizeClass} text-blue-300`} />;
    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return <CloudRain className={`${sizeClass} text-blue-400`} />;
    if ([71, 73, 75, 77, 85, 86].includes(code)) return <CloudSnow className={`${sizeClass} text-sky-200`} />;
    return <AlertTriangle className={`${sizeClass} text-amber-500`} />;
  };

  const getWeatherConditionName = (code: number) => {
    if (code === 0) return "Clear Sunny";
    if ([1, 2, 3].includes(code)) return "Partly Cloudy";
    if ([45, 48].includes(code)) return "Foggy Mist";
    if ([51, 53, 55, 56, 57].includes(code)) return "Drizzle";
    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "Cascading Rain";
    if ([71, 73, 75, 77, 85, 86].includes(code)) return "Swirling Snow";
    return "Thunderstorms";
  };

  return (
    <div id="forecast-tab-view" className="flex flex-col gap-6 p-4 md:p-6 lg:p-8 w-full max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="font-sans text-xl font-bold text-white flex items-center gap-2">
          <Calendar className="h-5 w-5 text-sky-400" />
          Extended Multi-Interval Forecast
        </h2>
        <p className="font-sans text-xs text-slate-400">
          Scroll through hourly temperature projections and view full 7-day structural climate trends.
        </p>
      </div>

      {/* Hourly Section */}
      <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-900/40 p-4 md:p-5 backdrop-blur-md">
        <span className="font-sans text-xs font-bold text-slate-400 flex items-center gap-1.5 mb-2">
          <Clock className="h-4 w-4 text-sky-400" />
          24-Hour Projected Stream
        </span>

        {/* Scrollable horizontal container */}
        <div id="hourly-forecast-scroll" className="flex gap-3 overflow-x-auto pb-3 pt-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {weatherData.hourly.map((item, idx) => (
            <div
              key={idx}
              id={`hourly-item-${idx}`}
              className="flex flex-col items-center justify-between gap-2 rounded-xl bg-slate-950/20 border border-white/5 p-3 min-w-[90px] text-center hover:bg-slate-950/40 transition-colors"
            >
              <span className="font-sans text-[10px] font-semibold text-slate-400 uppercase">
                {item.time}
              </span>
              <div className="my-1 shrink-0">{getWeatherIcon(item.conditionCode, "h-7 w-7")}</div>
              <span className="font-sans text-sm font-bold text-white">{formatTemp(item.temp)}</span>

              {/* Extras detail */}
              <div className="flex flex-col gap-0.5 text-[8px] font-mono text-slate-500 mt-1">
                <span className="flex items-center gap-0.5"><Droplets className="h-2 w-2 text-sky-400" /> {item.precipProb}%</span>
                <span className="flex items-center gap-0.5"><Wind className="h-2 w-2 text-teal-400" /> {formatWind(item.windSpeed)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 7-Day Forecast Grid */}
      <div className="flex flex-col gap-4">
        <span className="font-sans text-xs font-bold text-slate-400 flex items-center gap-1.5">
          <Calendar className="h-4 w-4 text-sky-400 animate-pulse" />
          7-Day Meteorological Outlook
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {weatherData.daily.map((item, idx) => (
            <motion.div
              key={idx}
              id={`daily-forecast-card-${idx}`}
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/40 p-4 backdrop-blur-md flex flex-col gap-4 justify-between"
            >
              {/* Top Section */}
              <div className="flex justify-between items-start gap-2">
                <div className="flex flex-col">
                  <span className="font-sans text-sm font-extrabold text-white">{item.date}</span>
                  <span className="font-sans text-[10px] text-slate-400 mt-0.5 truncate max-w-[120px]">
                    {getWeatherConditionName(item.conditionCode)}
                  </span>
                </div>
                <div className="shrink-0">{getWeatherIcon(item.conditionCode, "h-8 w-8")}</div>
              </div>

              {/* Temperatures */}
              <div className="flex items-end justify-between border-t border-white/5 pt-3 mt-1">
                <div className="flex flex-col">
                  <span className="font-sans text-xs text-slate-500">MAX / MIN</span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="font-sans text-base font-bold text-white">{formatTemp(item.maxTemp)}</span>
                    <span className="font-sans text-xs text-slate-400">{formatTemp(item.minTemp)}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end">
                  <span className="font-sans text-[8px] font-bold text-sky-400 uppercase flex items-center gap-0.5">
                    <Droplets className="h-3 w-3" />
                    RAIN: {item.precipProb}%
                  </span>
                  <span className="font-sans text-[8px] font-semibold text-slate-500 mt-0.5">
                    UV INDEX: {Math.round(item.uvIndex)}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
