import React, { useState, useRef, useEffect } from "react";
import { WeatherData, UserPreferences } from "../types";
import { ZoomIn, ZoomOut, Maximize2, Minimize2, MapPin, Wind, Sun, Cloud, CloudRain, Thermometer, Gauge } from "lucide-react";
import { motion } from "motion/react";

interface MapsViewProps {
  weatherData: WeatherData;
  preferences: UserPreferences;
}

type LayerType = "rain" | "clouds" | "wind" | "temp" | "pressure";

export default function MapsView({ weatherData, preferences }: MapsViewProps) {
  const [activeLayer, setActiveLayer] = useState<LayerType>("rain");
  const [zoom, setZoom] = useState<number>(1.5);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

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

  // Drag interaction
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Layer detail configuration
  const layerConfig = {
    rain: {
      label: "Precipitation Radar",
      icon: CloudRain,
      color: "text-blue-400",
      legend: ["Light", "Moderate", "Heavy", "Severe"],
      legendColors: ["bg-blue-400/30", "bg-emerald-400/50", "bg-yellow-400/70", "bg-rose-500/90"],
      unit: "dBZ",
      desc: "Live Doppler simulation indicating rainfall cells, convection, and active cell paths.",
    },
    clouds: {
      label: "Cloud Cover Satellite",
      icon: Cloud,
      color: "text-slate-300",
      legend: ["Clear", "Partly", "Mostly", "Overcast"],
      legendColors: ["bg-slate-700/10", "bg-slate-500/20", "bg-slate-300/40", "bg-slate-100/70"],
      unit: "%",
      desc: "Volumetric cloud satellite layers measuring density, moisture pockets, and fronts.",
    },
    wind: {
      label: "Streamlines Vector",
      icon: Wind,
      color: "text-teal-400",
      legend: ["Calm", "Breeze", "Gale", "Storm"],
      legendColors: ["bg-teal-500/10", "bg-teal-400/30", "bg-cyan-400/50", "bg-indigo-500/80"],
      unit: "km/h",
      desc: "Active streamline velocity and laminar particle flow indicating surface wind fields.",
    },
    temp: {
      label: "Thermal Contours",
      icon: Thermometer,
      color: "text-orange-400",
      legend: ["Freezing", "Cool", "Warm", "Hot"],
      legendColors: ["bg-blue-600/50", "bg-cyan-400/50", "bg-orange-400/60", "bg-red-500/80"],
      unit: "°C/°F",
      desc: "Thermal density contours representing regional warming indices and isobar boundaries.",
    },
    pressure: {
      label: "Isobaric Pressure",
      icon: Gauge,
      color: "text-purple-400",
      legend: ["Low", "Standard", "High"],
      legendColors: ["bg-indigo-500/20", "bg-purple-500/40", "bg-fuchsia-500/70"],
      unit: "hPa",
      desc: "Sea-level pressure maps mapped with isobaric contours, showing cyclones and anticylones.",
    },
  };

  const currentLayer = layerConfig[activeLayer];

  return (
    <div
      id="maps-tab-view"
      className={`relative flex flex-col gap-6 p-4 md:p-6 lg:p-8 transition-all ${
        isFullscreen ? "fixed inset-0 z-50 bg-slate-950 p-4" : "w-full"
      }`}
    >
      {/* Header and Controls */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-sans text-xl font-bold text-white flex items-center gap-2">
            <MapPin className="h-5 w-5 text-sky-400" />
            Interactive Weather Layers
          </h2>
          <p className="font-sans text-xs text-slate-400">
            Current perspective centered on {weatherData.location.name} ({weatherData.location.lat.toFixed(2)}°, {weatherData.location.lon.toFixed(2)}°)
          </p>
        </div>

        {/* Toolbar selectors */}
        <div className="flex flex-wrap items-center gap-2">
          {(Object.keys(layerConfig) as LayerType[]).map((layer) => {
            const Icon = layerConfig[layer].icon;
            const isSel = activeLayer === layer;
            return (
              <button
                key={layer}
                id={`map-layer-${layer}`}
                onClick={() => setActiveTabLayer(layer)}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-sans text-xs font-semibold transition-colors cursor-pointer ${
                  isSel
                    ? "border-sky-500 bg-sky-500/10 text-sky-400"
                    : "border-white/10 bg-slate-800/20 text-slate-400 hover:text-white hover:border-white/20"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {layerConfig[layer].label.split(" ")[0]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Map Container */}
      <div
        ref={mapContainerRef}
        id="interactive-map-frame"
        className={`relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl select-none ${
          isFullscreen ? "flex-1" : "h-[450px]"
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: isDragging ? "grabbing" : "grab" }}
      >
        {/* Dynamic Vector Layer Rendering */}
        <div
          className="absolute inset-0 transition-transform duration-100 ease-out flex items-center justify-center"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
            transformOrigin: "center center",
          }}
        >
          {/* Base Grid Overlay */}
          <div className="absolute w-[800px] h-[800px] bg-slate-950/20 rounded-full border border-dashed border-white/5 flex items-center justify-center">
            <div className="absolute w-[600px] h-[600px] rounded-full border border-dashed border-white/5 flex items-center justify-center">
              <div className="absolute w-[400px] h-[400px] rounded-full border border-dashed border-white/5" />
            </div>
          </div>

          {/* Grid lines */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[1200px] h-[2px] bg-white/5 absolute" />
            <div className="h-[1200px] w-[2px] bg-white/5 absolute" />
          </div>

          {/* City Anchor Indicator */}
          <div className="absolute z-30 flex flex-col items-center gap-1">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-500 shadow-lg shadow-sky-500/50 ring-4 ring-white/10 animate-bounce">
              <MapPin className="h-3 w-3 text-white" />
            </div>
            <div className="rounded bg-slate-950/80 px-2 py-0.5 text-[10px] font-bold text-white border border-white/10">
              {weatherData.location.name}
            </div>
          </div>

          {/* Sibling regions/cities around to feel like a real map */}
          <div className="absolute translate-x-[150px] -translate-y-[100px] text-slate-500 text-[9px] font-bold flex flex-col items-center">
            <div className="h-2 w-2 rounded-full bg-slate-700 mb-1" />
            <span>Northeast Sector</span>
          </div>
          <div className="absolute -translate-x-[200px] translate-y-[80px] text-slate-500 text-[9px] font-bold flex flex-col items-center">
            <div className="h-2 w-2 rounded-full bg-slate-700 mb-1" />
            <span>Western Ridge</span>
          </div>
          <div className="absolute translate-x-[80px] translate-y-[150px] text-slate-500 text-[9px] font-bold flex flex-col items-center">
            <div className="h-2 w-2 rounded-full bg-slate-700 mb-1" />
            <span>Southern Basin</span>
          </div>

          {/* Dynamic Layer-Specific SVG Streamlines/Radar Blobs */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-60" viewBox="0 0 1000 1000">
            <defs>
              <radialGradient id="radar-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#10b981" stopOpacity="0.5" />
                <stop offset="80%" stopColor="#eab308" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="cloud-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.75" />
                <stop offset="60%" stopColor="#cbd5e1" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#1e293b" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="temp-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
                <stop offset="30%" stopColor="#f97316" stopOpacity="0.5" />
                <stop offset="70%" stopColor="#38bdf8" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Render selected layer simulation */}
            {activeLayer === "rain" && (
              <>
                {/* Simulated colorful precipitation contours */}
                <circle cx="500" cy="500" r={100 + (weatherData.hourly[0]?.precipProb || 0) * 1.5} fill="url(#radar-glow)" className="animate-pulse" />
                <path d="M400,350 Q550,200 650,420 T400,600 Z" fill="rgba(59, 130, 246, 0.45)" />
                <path d="M520,480 Q600,400 650,520 T520,620 Z" fill="rgba(16, 185, 129, 0.5)" />
                <path d="M480,480 Q500,450 510,490 T480,510 Z" fill="rgba(239, 68, 68, 0.6)" />
              </>
            )}

            {/* Clouds Overlay */}
            {activeLayer === "clouds" && (
              <>
                <circle cx="480" cy="460" r={180 + weatherData.current.cloudCover * 1.5} fill="url(#cloud-glow)" />
                <circle cx="600" cy="530" r={120} fill="url(#cloud-glow)" />
                <circle cx="380" cy="550" r={150} fill="url(#cloud-glow)" />
              </>
            )}

            {/* Wind Flow Streamlines */}
            {activeLayer === "wind" && (
              <g stroke="rgba(45, 212, 191, 0.65)" strokeWidth="3" fill="none" strokeLinecap="round">
                {/* Drifting paths */}
                <path d="M100,450 C300,400 500,500 900,450" strokeDasharray="15, 350" strokeDashoffset={Date.now() % 5000} className="transition-all" style={{ animation: `dash ${120 / (weatherData.current.windSpeed || 10)}s linear infinite` }} />
                <path d="M150,500 C350,470 550,530 850,500" strokeDasharray="20, 250" className="transition-all" style={{ animation: `dash ${80 / (weatherData.current.windSpeed || 10)}s linear infinite` }} />
                <path d="M200,380 C400,320 600,420 800,380" strokeDasharray="25, 300" className="transition-all" style={{ animation: `dash ${100 / (weatherData.current.windSpeed || 10)}s linear infinite` }} />
                <path d="M120,550 C320,520 520,580 880,550" strokeDasharray="18, 280" className="transition-all" style={{ animation: `dash ${90 / (weatherData.current.windSpeed || 10)}s linear infinite` }} />
              </g>
            )}

            {/* Temperature heat gradient contours */}
            {activeLayer === "temp" && (
              <>
                <circle cx="500" cy="500" r={250} fill="url(#temp-glow)" />
                <path d="M 250,500 A 250,250 0 0,1 750,500" stroke="rgba(239, 68, 68, 0.4)" strokeWidth="2" fill="none" strokeDasharray="5,5" />
                <path d="M 350,500 A 150,150 0 0,1 650,500" stroke="rgba(249, 115, 22, 0.4)" strokeWidth="2" fill="none" strokeDasharray="5,5" />
              </>
            )}

            {/* Pressure contours */}
            {activeLayer === "pressure" && (
              <g stroke="rgba(192, 132, 252, 0.5)" strokeWidth="1.5" fill="none">
                {/* Simulated pressure isobars */}
                <circle cx="500" cy="500" r="100" />
                <text x="500" y="390" fill="#c084fc" fontSize="11" textAnchor="middle" fontFamily="monospace">1008 hPa</text>
                <circle cx="500" cy="500" r="200" />
                <text x="500" y="290" fill="#c084fc" fontSize="11" textAnchor="middle" fontFamily="monospace">1012 hPa</text>
                <circle cx="500" cy="500" r="300" />
                <text x="500" y="190" fill="#c084fc" fontSize="11" textAnchor="middle" fontFamily="monospace">1016 hPa</text>
                {/* L / H pressure core icons */}
                <circle cx="500" cy="500" r="24" fill="rgba(88, 28, 135, 0.4)" stroke="#c084fc" strokeWidth="2" />
                <text x="500" y="506" fill="#c084fc" fontSize="18" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">L</text>
              </g>
            )}
          </svg>
        </div>

        {/* Navigation / Compass Overlay (Bottom-left) */}
        <div className="absolute bottom-5 left-5 z-20 rounded-xl border border-white/10 bg-slate-950/80 p-3 backdrop-blur-md">
          <div className="flex flex-col gap-1 font-sans text-[10px] text-slate-400">
            <span className="font-bold text-white uppercase tracking-wider">Map Coordinates</span>
            <span>LAT: {(weatherData.location.lat + panOffset.y / 200).toFixed(4)}°</span>
            <span>LON: {(weatherData.location.lon + panOffset.x / 200).toFixed(4)}°</span>
            <span className="mt-1 font-semibold text-sky-400">FPS: 60 • LAYER READY</span>
          </div>
        </div>

        {/* Floating Zoom & Immersive Navigation Actions (Top-right) */}
        <div className="absolute top-5 right-5 z-20 flex flex-col gap-2">
          <button
            id="map-btn-zoom-in"
            onClick={() => setZoom(Math.min(zoom + 0.25, 4.0))}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-slate-950/80 text-slate-300 hover:bg-slate-900 hover:text-white transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="h-5 w-5" />
          </button>
          <button
            id="map-btn-zoom-out"
            onClick={() => setZoom(Math.max(zoom - 0.25, 1.0))}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-slate-950/80 text-slate-300 hover:bg-slate-900 hover:text-white transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="h-5 w-5" />
          </button>
          <button
            id="map-btn-recenter"
            onClick={() => {
              setZoom(1.5);
              setPanOffset({ x: 0, y: 0 });
            }}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-slate-950/80 text-slate-300 hover:bg-slate-900 hover:text-white transition-colors cursor-pointer"
            title="Recenter Map"
          >
            <MapPin className="h-5 w-5" />
          </button>
          <button
            id="map-btn-fullscreen"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-slate-950/80 text-slate-300 hover:bg-slate-900 hover:text-white transition-colors cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Radar"}
          >
            {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
          </button>
        </div>

        {/* Legend Scale (Bottom-right) */}
        <div className="absolute bottom-5 right-5 z-20 flex flex-col gap-2 rounded-xl border border-white/10 bg-slate-950/80 p-3.5 backdrop-blur-md w-44">
          <span className="font-sans text-[10px] font-bold text-white uppercase tracking-wider">
            {currentLayer.label} ({currentLayer.unit})
          </span>
          <div className="flex items-center gap-1">
            {currentLayer.legendColors.map((color, idx) => (
              <div key={idx} className="flex-1 flex flex-col gap-1 items-center">
                <div className={`h-2.5 w-full rounded-sm ${color}`} />
                <span className="text-[8px] font-mono text-slate-500">{currentLayer.legend[idx]}</span>
              </div>
            ))}
          </div>
          <p className="font-sans text-[9px] leading-relaxed text-slate-400">
            {currentLayer.desc}
          </p>
        </div>
      </div>

      <style>{`
        @keyframes dash {
          to {
            stroke-dashoffset: -400px;
          }
        }
      `}</style>
    </div>
  );

  function setActiveTabLayer(layer: LayerType) {
    setActiveLayer(layer);
  }
}
