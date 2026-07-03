import { Sun, CloudRain, Heart, Github, Globe, Shield, Terminal } from "lucide-react";

export default function Footer() {
  return (
    <footer id="app-footer" className="relative mt-auto border-t border-white/5 bg-slate-950 pt-16 pb-8 overflow-hidden">
      {/* Animated Flowing SVG Wave at the Top */}
      <div className="absolute top-0 left-0 right-0 h-10 w-full overflow-hidden pointer-events-none opacity-10">
        <svg
          className="absolute left-0 w-[200%] h-12"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          style={{ animation: "wave-flow 20s linear infinite" }}
        >
          <path
            d="M0,60 C150,100 350,20 500,60 C650,100 850,20 1000,60 C1150,100 1350,20 1500,60 L1500,120 L0,120 Z"
            fill="url(#waveGrad)"
          />
          <defs>
            <linearGradient id="waveGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#4f46e5" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 border-b border-white/5 pb-10">
          {/* Brand Info */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-sky-400 to-indigo-500 text-white">
                <Sun className="h-5 w-5" />
              </div>
              <span className="font-sans text-base font-bold text-white tracking-tight">
                AetherSky
              </span>
            </div>
            <p className="font-sans text-xs text-slate-400 leading-relaxed">
              Professional, glassmorphic meteorological analytics suite supplying microclimate forecasting, atmospheric charts, satellite cloud radars, and real-time hazard warnings.
            </p>
          </div>

          {/* Resources Column */}
          <div className="flex flex-col gap-3">
            <span className="font-sans text-xs font-bold text-slate-400 uppercase tracking-wider">
              Diagnostic Core
            </span>
            <ul className="space-y-2 font-sans text-xs text-slate-400">
              <li>
                <span className="hover:text-white transition-colors cursor-pointer">Microclimate Doppler</span>
              </li>
              <li>
                <span className="hover:text-white transition-colors cursor-pointer">Thermal Contour Satellites</span>
              </li>
              <li>
                <span className="hover:text-white transition-colors cursor-pointer">Particulate Matter AQI</span>
              </li>
              <li>
                <span className="hover:text-white transition-colors cursor-pointer">Barometric Isobar Maps</span>
              </li>
            </ul>
          </div>

          {/* API Credits Column */}
          <div className="flex flex-col gap-3">
            <span className="font-sans text-xs font-bold text-slate-400 uppercase tracking-wider">
              Meteorology Partners
            </span>
            <ul className="space-y-2 font-sans text-xs text-slate-400">
              <li>
                <span className="hover:text-white transition-colors cursor-pointer">Open-Meteo Weather APIs</span>
              </li>
              <li>
                <span className="hover:text-white transition-colors cursor-pointer">OpenStreetMap Nominatim</span>
              </li>
              <li>
                <span className="hover:text-white transition-colors cursor-pointer">European AQI Database</span>
              </li>
              <li>
                <span className="hover:text-white transition-colors cursor-pointer">WMO Weather Codes</span>
              </li>
            </ul>
          </div>

          {/* Legal / Contact Column */}
          <div className="flex flex-col gap-3">
            <span className="font-sans text-xs font-bold text-slate-400 uppercase tracking-wider">
              Platform Agreements
            </span>
            <ul className="space-y-2 font-sans text-xs text-slate-400">
              <li>
                <span className="hover:text-white transition-colors cursor-pointer">Privacy & Cookie Policy</span>
              </li>
              <li>
                <span className="hover:text-white transition-colors cursor-pointer">Terms of Service</span>
              </li>
              <li>
                <span className="hover:text-white transition-colors cursor-pointer">Security Certifications</span>
              </li>
              <li>
                <span className="hover:text-white transition-colors cursor-pointer">Developer Contact</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Meta Credits */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-sans text-[11px] text-slate-500">
            © 2026 AetherSky Weather Corp. All rights reserved. Made for premium UI experiences.
          </span>

          <div className="flex items-center gap-4 text-slate-400">
            <span className="font-sans text-[11px] text-slate-500 flex items-center gap-1">
              Crafted with <Heart className="h-3 w-3 text-rose-500 fill-rose-500" /> & React
            </span>
            <span className="h-4 w-[1px] bg-white/10" />
            <div className="flex items-center gap-3">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-white cursor-pointer" title="GitHub Project">
                <Github className="h-4 w-4" />
              </a>
              <span className="hover:text-white cursor-pointer" title="Global Scope">
                <Globe className="h-4 w-4" />
              </span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes wave-flow {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </footer>
  );
}
