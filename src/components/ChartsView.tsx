import { useState } from "react";
import { WeatherData, UserPreferences } from "../types";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line, Legend, ComposedChart } from "recharts";
import { TrendingUp, Thermometer, Wind, CloudRain, Shield, Eye, Calendar, Clock } from "lucide-react";

interface ChartsViewProps {
  weatherData: WeatherData;
  preferences: UserPreferences;
}

type ChartType = "temperature" | "precipitation" | "humidity" | "wind_pressure";

export default function ChartsView({ weatherData, preferences }: ChartsViewProps) {
  const [activeChart, setActiveChart] = useState<ChartType>("temperature");

  // Convert temperature to preferred unit
  const tempVal = (c: number) => {
    if (preferences.tempUnit === "F") {
      return Math.round((c * 9) / 5 + 32);
    }
    return Math.round(c);
  };

  // Convert wind speed to preferred unit
  const windVal = (kmh: number) => {
    if (preferences.windUnit === "mph") {
      return Math.round(kmh * 0.621371);
    }
    if (preferences.windUnit === "ms") {
      return Math.round(kmh / 3.6);
    }
    return Math.round(kmh);
  };

  // 1. Prepare Hourly Data (next 12 hours for cleaner view)
  const hourlyData = weatherData.hourly.slice(0, 12).map((item) => ({
    time: item.time,
    temperature: tempVal(item.temp),
    feelsLike: tempVal(item.temp - 1.5), // simulated feels-like
    humidity: item.humidity,
    precipitation: item.precipProb,
    wind: windVal(item.windSpeed),
  }));

  // 2. Prepare 7-Day Forecast Data
  const dailyData = weatherData.daily.map((item) => ({
    day: item.date,
    maxTemp: tempVal(item.maxTemp),
    minTemp: tempVal(item.minTemp),
    precipitation: item.precipProb,
    uvIndex: item.uvIndex,
  }));

  const chartOptions = [
    { id: "temperature", label: "Temperature & Thermal Index", icon: Thermometer, color: "from-amber-400 to-orange-500" },
    { id: "precipitation", label: "Rainfall Probability", icon: CloudRain, color: "from-sky-400 to-blue-500" },
    { id: "humidity", label: "Moisture & Humidity Trends", icon: Shield, color: "from-emerald-400 to-teal-500" },
    { id: "wind_pressure", label: "Barometric & Velocity Dynamics", icon: Wind, color: "from-violet-400 to-fuchsia-500" },
  ];

  // Custom tooltips matching glassmorphism style
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl border border-white/10 bg-slate-950/80 p-3 shadow-2xl backdrop-blur-md">
          <p className="font-sans text-xs font-bold text-white mb-1.5">{label}</p>
          <div className="flex flex-col gap-1">
            {payload.map((pld: any, idx: number) => (
              <div key={idx} className="flex items-center gap-2 text-xs">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: pld.color }} />
                <span className="font-sans text-slate-400">{pld.name}:</span>
                <span className="font-mono font-bold text-white">{pld.value}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div id="charts-tab-view" className="flex flex-col gap-6 p-4 md:p-6 lg:p-8 w-full">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-sans text-xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-sky-400 animate-pulse" />
            Atmospheric Analytics & Trends
          </h2>
          <p className="font-sans text-xs text-slate-400">
            Interactive metrics charting microclimate trends across hourly and weekly intervals.
          </p>
        </div>

        {/* Chart Selector Tabs */}
        <div className="flex flex-wrap gap-2">
          {chartOptions.map((opt) => {
            const Icon = opt.icon;
            const isSel = activeChart === opt.id;
            return (
              <button
                key={opt.id}
                id={`chart-tab-${opt.id}`}
                onClick={() => setActiveChart(opt.id as ChartType)}
                className={`flex items-center gap-1.5 rounded-xl border px-4 py-2 font-sans text-xs font-semibold transition-all cursor-pointer ${
                  isSel
                    ? "border-sky-400 bg-sky-500/10 text-sky-400 shadow-md shadow-sky-500/5"
                    : "border-white/10 bg-slate-800/20 text-slate-400 hover:text-white hover:border-white/20"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {opt.label.split(" ")[0]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Charts container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: 12-Hour Micro Trends */}
        <div className="lg:col-span-2 flex flex-col gap-4 rounded-2xl border border-white/10 bg-slate-900/40 p-4 md:p-6 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="font-sans text-xs font-bold text-white flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-sky-400" />
              12-Hour Projection
            </span>
            <span className="font-mono text-[9px] uppercase tracking-wider text-slate-500">
              Live Interval Data
            </span>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              {(() => {
                switch (activeChart) {
                  case "temperature":
                    return (
                      <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorFeels" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 11, fontFamily: "sans-serif", paddingTop: 10 }} />
                        <Area type="monotone" dataKey="temperature" name={`Temperature (°${preferences.tempUnit})`} stroke="#fbbf24" strokeWidth={2.5} fillOpacity={1} fill="url(#colorTemp)" activeDot={{ r: 6 }} />
                        <Area type="monotone" dataKey="feelsLike" name={`Feels Like (°${preferences.tempUnit})`} stroke="#f97316" strokeWidth={1.5} fillOpacity={1} fill="url(#colorFeels)" strokeDasharray="4 4" />
                      </AreaChart>
                    );
                  case "precipitation":
                    return (
                      <BarChart data={hourlyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={10} tickLine={false} unit="%" />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 11, fontFamily: "sans-serif", paddingTop: 10 }} />
                        <Bar dataKey="precipitation" name="Probability of Rain" fill="#38bdf8" radius={[4, 4, 0, 0]} barSize={24} />
                      </BarChart>
                    );
                  case "humidity":
                    return (
                      <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorHumid" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={10} tickLine={false} unit="%" />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 11, fontFamily: "sans-serif", paddingTop: 10 }} />
                        <Area type="monotone" dataKey="humidity" name="Relative Humidity" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorHumid)" />
                      </AreaChart>
                    );
                  case "wind_pressure":
                    return (
                      <ComposedChart data={hourlyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 11, fontFamily: "sans-serif", paddingTop: 10 }} />
                        <Bar dataKey="wind" name={`Wind Speed (${preferences.windUnit})`} fill="#a78bfa" radius={[4, 4, 0, 0]} barSize={16} />
                      </ComposedChart>
                    );
                }
              })()}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right column: 7-Day Macro Outlook */}
        <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-slate-900/40 p-4 md:p-6 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="font-sans text-xs font-bold text-white flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-sky-400" />
              7-Day Macro Outlook
            </span>
            <span className="font-mono text-[9px] uppercase tracking-wider text-slate-500">
              Weekly Overview
            </span>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, fontFamily: "sans-serif", paddingTop: 10 }} />
                <Line type="monotone" dataKey="maxTemp" name={`High (°${preferences.tempUnit})`} stroke="#fb7185" strokeWidth={2.5} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="minTemp" name={`Low (°${preferences.tempUnit})`} stroke="#38bdf8" strokeWidth={1.5} strokeDasharray="3 3" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
