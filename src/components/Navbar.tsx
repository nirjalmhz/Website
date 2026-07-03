import { User, WeatherAlert } from "../types";
import { Sun, Wind, Map, Heart, User as UserIcon, Settings, Calendar, LogOut, Bell, CloudRain, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: User | null;
  onLogout: () => void;
  onOpenAuth: () => void;
  alerts: WeatherAlert[];
  onOpenAlerts: () => void;
  unreadAlertsCount: number;
}

export default function Navbar({
  activeTab,
  setActiveTab,
  user,
  onLogout,
  onOpenAuth,
  alerts,
  onOpenAlerts,
  unreadAlertsCount,
}: NavbarProps) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: Sun },
    { id: "forecast", label: "Forecast", icon: Calendar },
    { id: "airquality", label: "Air Quality", icon: Wind },
    { id: "maps", label: "Interactive Maps", icon: Map },
    { id: "favorites", label: "Favorites", icon: Heart },
    { id: "profile", label: "Profile", icon: UserIcon },
    { id: "admin", label: "Admin Console", icon: ShieldCheck },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <header id="app-header" className="sticky top-0 z-40 w-full border-b border-white/10 bg-slate-900/40 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <div
          id="navbar-logo"
          className="flex cursor-pointer items-center gap-2"
          onClick={() => setActiveTab("dashboard")}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-400 to-indigo-500 text-white shadow-lg shadow-sky-500/25">
            <CloudRain className="h-6 w-6 animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="font-sans text-lg font-bold tracking-tight text-white">
              AetherSky
            </span>
            <span className="font-mono text-[9px] tracking-widest text-sky-400 uppercase">
              Dashboard
            </span>
          </div>
        </div>

        {/* Navigation Items - Scrollable on mobile */}
        <nav className="hidden lg:flex items-center space-x-1" aria-label="Main Navigation">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-lg font-sans text-sm font-medium transition-colors ${
                  isActive ? "text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-sky-400" : "text-slate-400"}`} />
                {item.label}
                {isActive && (
                  <motion.div
                    layoutId="activeUnderline"
                    className="absolute bottom-0 left-2 right-2 h-[2px] bg-sky-400"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* User Session & Alert Actions */}
        <div className="flex items-center gap-3">
          {/* Notifications Trigger */}
          <button
            id="nav-alert-bell"
            onClick={onOpenAlerts}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-slate-800/30 text-slate-300 hover:bg-slate-800/60 hover:text-white transition-colors"
          >
            <Bell className="h-5 w-5" />
            {unreadAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-slate-900">
                {unreadAlertsCount}
              </span>
            )}
          </button>

          {/* Authentication State button */}
          {user ? (
            <div className="flex items-center gap-2">
              <button
                id="nav-user-profile"
                onClick={() => setActiveTab("profile")}
                className="hidden md:flex flex-col items-end cursor-pointer"
              >
                <span className="font-sans text-xs font-semibold text-white">
                  {user.name}
                </span>
                <span className="font-mono text-[9px] text-slate-400">
                  Logged In
                </span>
              </button>
              <button
                id="nav-logout-btn"
                onClick={onLogout}
                title="Log Out"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 transition-colors cursor-pointer"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <button
              id="nav-login-btn"
              onClick={onOpenAuth}
              className="flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-5 text-sm font-semibold text-white hover:opacity-90 shadow-lg shadow-sky-500/20 transition-all cursor-pointer"
            >
              <UserIcon className="h-4 w-4" />
              Sign In
            </button>
          )}
        </div>
      </div>

      {/* Mobile Sub-Navigation menu bar */}
      <div className="lg:hidden flex border-t border-white/5 bg-slate-900/60 overflow-x-auto scrollbar-none py-1">
        <div className="flex space-x-1 px-4 min-w-max">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-mobile-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-sans text-xs font-semibold transition-colors ${
                  isActive ? "bg-sky-500/10 text-sky-400" : "text-slate-400"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
