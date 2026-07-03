import { AirQuality } from "../types";
import { Wind, ShieldAlert, CheckCircle2, Heart, Trees, AlertTriangle } from "lucide-react";
import { motion } from "motion/react";

interface AirQualityViewProps {
  airQuality: AirQuality;
}

export default function AirQualityView({ airQuality }: AirQualityViewProps) {
  // Saturation scores for sub-pollutants relative to WHO standards
  // PM2.5: standard 15 ug/m3, PM10: standard 45 ug/m3, NO2: standard 40 ug/m3, O3: standard 100 ug/m3
  const pm25Perc = Math.min(Math.round((airQuality.pm25 / 25) * 100), 100);
  const pm10Perc = Math.min(Math.round((airQuality.pm10 / 50) * 100), 100);
  const coPerc = Math.min(Math.round((airQuality.co / 10000) * 100), 100);
  const no2Perc = Math.min(Math.round((airQuality.no2 / 40) * 100), 100);
  const o3Perc = Math.min(Math.round((airQuality.o3 / 100) * 100), 100);
  const so2Perc = Math.min(Math.round((airQuality.so2 / 20) * 100), 100);

  // Pollutant mapping definitions
  const pollutants = [
    { label: "PM2.5 (Fine Particles)", val: `${airQuality.pm25} µg/m³`, perc: pm25Perc, color: "bg-amber-400", desc: "Fine inhalable particles, with diameters that are generally 2.5 micrometers and smaller." },
    { label: "PM10 (Coarse Particles)", val: `${airQuality.pm10} µg/m³`, perc: pm10Perc, color: "bg-emerald-400", desc: "Inhalable coarse particles, with diameters larger than 2.5 and smaller than 10 micrometers." },
    { label: "CO (Carbon Monoxide)", val: `${airQuality.co} µg/m³`, perc: coPerc, color: "bg-sky-400", desc: "Odorless, colorless toxic gas emitted primarily by vehicles and industrial combustion." },
    { label: "NO₂ (Nitrogen Dioxide)", val: `${airQuality.no2} µg/m³`, perc: no2Perc, color: "bg-red-400", desc: "Highly reactive traffic emissions gas contributing to respiratory irritation." },
    { label: "O₃ (Ground-Level Ozone)", val: `${airQuality.o3} µg/m³`, perc: o3Perc, color: "bg-indigo-400", desc: "Secondary pollutant formed via sunlight reacting with emissions, causing severe lung irritation." },
    { label: "SO₂ (Sulphur Dioxide)", val: `${airQuality.so2} µg/m³`, perc: so2Perc, color: "bg-pink-400", desc: "Pungent, choking gas produced mainly by burning coal or oil in power plants." },
  ];

  // Fetch contextual guidelines icon based on rating
  const getSafetyIcon = () => {
    switch (airQuality.rating) {
      case "Good":
      case "Fair":
        return CheckCircle2;
      case "Moderate":
        return Heart;
      case "Poor":
        return AlertTriangle;
      default:
        return ShieldAlert;
    }
  };

  const SafetyIcon = getSafetyIcon();

  // Circular progress SVG values
  // Radius = 50, Circumference = 314
  const aqiValue = airQuality.aqi;
  const maxAqi = 100;
  const strokeOffset = 314 - (314 * Math.min(aqiValue, maxAqi)) / maxAqi;

  return (
    <div id="airquality-tab-view" className="flex flex-col gap-6 p-4 md:p-6 lg:p-8 w-full">
      {/* Header */}
      <div>
        <h2 className="font-sans text-xl font-bold text-white flex items-center gap-2">
          <Wind className="h-5 w-5 text-teal-400 animate-pulse" />
          Air Quality Diagnostics
        </h2>
        <p className="font-sans text-xs text-slate-400">
          Real-time measurement of particulate pollutants, toxic gases, and safety recommendations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: AQI Circular Speedometer Gauge */}
        <div className="md:col-span-1 flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-slate-900/40 p-6 backdrop-blur-md text-center">
          <span className="font-sans text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
            Air Quality Index
          </span>

          {/* SVG Circular Gauge */}
          <div className="relative flex h-48 w-48 items-center justify-center">
            <svg className="h-full w-full -rotate-90">
              {/* Back track */}
              <circle
                cx="96"
                cy="96"
                r="70"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="10"
                fill="none"
              />
              {/* Active saturation track */}
              <circle
                cx="96"
                cy="96"
                r="70"
                stroke="currentColor"
                strokeWidth="12"
                strokeDasharray="440"
                strokeDashoffset={strokeOffset}
                strokeLinecap="round"
                fill="none"
                className={`transition-all duration-1000 ease-out ${airQuality.colorClass.split(" ")[0]}`}
              />
            </svg>

            {/* Inner Content */}
            <div className="absolute flex flex-col items-center justify-center">
              <span className="font-sans text-xs text-slate-500 font-semibold">AQI (EAQI)</span>
              <span className="font-sans text-5xl font-extrabold tracking-tighter text-white my-1">
                {aqiValue}
              </span>
              <span className={`font-sans text-xs font-bold rounded-full px-2.5 py-0.5 border ${airQuality.colorClass}`}>
                {airQuality.rating}
              </span>
            </div>
          </div>

          {/* European AQI Scale Indicators */}
          <div className="mt-6 w-full space-y-2">
            <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold border-b border-white/5 pb-1">
              <span>RATING THRESHOLDS</span>
              <span>INDEX</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-emerald-400">Good / Fair</span>
              <span className="font-mono text-slate-400">0 - 25</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-amber-400">Moderate</span>
              <span className="font-mono text-slate-400">26 - 50</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-orange-400">Poor</span>
              <span className="font-mono text-slate-400">51 - 75</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-rose-500">Severe / Extreme</span>
              <span className="font-mono text-slate-400">&gt; 75</span>
            </div>
          </div>
        </div>

        {/* Right Column: Pollutants Grid & Health Recommendations */}
        <div className="md:col-span-2 flex flex-col gap-6">
          {/* Health Recommendation Card */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 backdrop-blur-md flex gap-4 items-start">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${airQuality.colorClass}`}>
              <SafetyIcon className="h-6 w-6" />
            </div>
            <div>
              <span className="font-sans text-xs font-bold text-slate-400 flex items-center gap-1">
                <Trees className="h-4 w-4 text-emerald-400" />
                Safety & Health Recommendation
              </span>
              <p className="mt-1.5 font-sans text-sm leading-relaxed text-slate-200">
                {airQuality.recommendation}
              </p>
            </div>
          </div>

          {/* Pollutant levels indicators progress bars */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 backdrop-blur-md flex-1">
            <span className="font-sans text-xs font-bold text-slate-400 block mb-4">
              Individual Pollutant Saturation Levels
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {pollutants.map((item, idx) => (
                <div key={idx} id={`pollutant-${idx}`} className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-sans font-semibold text-slate-300">{item.label}</span>
                    <span className="font-mono font-bold text-white">{item.val}</span>
                  </div>
                  {/* Saturation progress bar */}
                  <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.perc}%` }}
                      transition={{ duration: 0.8, delay: idx * 0.1 }}
                      className={`h-full rounded-full ${item.color}`}
                    />
                  </div>
                  <span className="text-[9px] text-slate-500 leading-normal">
                    {item.desc}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
