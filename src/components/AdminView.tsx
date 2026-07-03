import React, { useState, useEffect } from "react";
import { User, WeatherAlert } from "../types";
import { 
  Users, 
  Radio, 
  TrendingUp, 
  Database, 
  Trash2, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  ShieldCheck, 
  Lock, 
  Mail, 
  Loader2, 
  PlusCircle, 
  Send,
  UserCheck,
  Megaphone,
  BellRing
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AdminViewProps {
  currentUser: User | null;
  onAuthSuccess: (token: string, user: any) => void;
}

interface AdminStats {
  totalUsers: number;
  totalFavorites: number;
  totalHistory: number;
  activeAlertsCount: number;
  dbType: string;
}

export default function AdminView({ currentUser, onAuthSuccess }: AdminViewProps) {
  // Login State (if not logged in as the admin)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Admin Dashboard States
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [broadcastsList, setBroadcastsList] = useState<WeatherAlert[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingData, setIsLoadingData] = useState(false);

  // New Alert Broadcast Form States
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertSeverity, setAlertSeverity] = useState<"info" | "warning" | "danger">("warning");
  const [alertType, setAlertType] = useState("System Advisory");
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  const isAdmin = currentUser?.email?.toLowerCase().trim() === "69nirjalmaharjan@gmail.com";

  // Fetch admin dashboard details
  const fetchAdminData = async () => {
    if (!isAdmin) return;
    setIsLoadingData(true);
    try {
      const token = localStorage.getItem("aether_token");
      const headers = { "Authorization": `Bearer ${token}` };

      const [statsRes, usersRes, alertsRes] = await Promise.all([
        fetch("/api/admin/stats", { headers }),
        fetch("/api/admin/users", { headers }),
        fetch("/api/admin/alerts", { headers })
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsersList(usersData);
      }
      if (alertsRes.ok) {
        const alertsData = await alertsRes.json();
        setBroadcastsList(alertsData);
      }
    } catch (error) {
      console.error("Failed to load admin telemetry", error);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAdminData();
    }
  }, [currentUser]);

  // Handle Admin Login Form
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || "Authentication failed");
      }

      // Check if this is the designated admin account
      if (resData.user.email.toLowerCase().trim() !== "69nirjalmaharjan@gmail.com") {
        throw new Error("This account does not have developer administrator privileges.");
      }

      // Store token and elevate user
      localStorage.setItem("aether_token", resData.token);
      localStorage.setItem("aether_user", JSON.stringify(resData.user));
      onAuthSuccess(resData.token, resData.user);
    } catch (err: any) {
      setLoginError(err.message || "Invalid credentials. Please verify credentials.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Creating a New Broadcast Announcement
  const handleCreateBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertTitle || !alertMessage) return;

    setIsBroadcasting(true);
    setBroadcastSuccess(false);

    try {
      const token = localStorage.getItem("aether_token");
      const response = await fetch("/api/admin/alerts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          title: alertTitle,
          message: alertMessage,
          severity: alertSeverity,
          type: alertType
        })
      });

      if (response.ok) {
        setAlertTitle("");
        setAlertMessage("");
        setAlertType("System Advisory");
        setBroadcastSuccess(true);
        setTimeout(() => setBroadcastSuccess(false), 4000);
        // Refresh
        fetchAdminData();
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Failed to issue broadcast.");
      }
    } catch (error) {
      console.error("Failed to issue broadcast alert", error);
    } finally {
      setIsBroadcasting(false);
    }
  };

  // Handle Deleting a Broadcast alert
  const handleDeleteBroadcast = async (alertId: string) => {
    if (!confirm("Are you sure you want to retract this system alert announcement?")) return;

    try {
      const token = localStorage.getItem("aether_token");
      const response = await fetch(`/api/admin/alerts/${alertId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (response.ok) {
        fetchAdminData();
      }
    } catch (error) {
      console.error("Retraction failed", error);
    }
  };

  // Handle Deleting a User account
  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (userEmail.toLowerCase().trim() === "69nirjalmaharjan@gmail.com") {
      alert("Self-deletion of administrator account is prevented.");
      return;
    }

    if (!confirm(`Are you absolutely sure you want to permanently delete the user account "${userEmail}"? All saved favorites and preferences will be permanently purged.`)) {
      return;
    }

    try {
      const token = localStorage.getItem("aether_token");
      const response = await fetch(`/api/admin/delete-user/${userId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (response.ok) {
        fetchAdminData();
      } else {
        const err = await response.json();
        alert(err.error || "Deactivation failed.");
      }
    } catch (error) {
      console.error("Deactivation failed", error);
    }
  };

  // Quick Seed Admin Credentials for easier click
  const prefillCredentials = () => {
    setEmail("69nirjalmaharjan@gmail.com");
    setPassword("616931367@nm");
  };

  // Filter users list by search query
  const filteredUsers = usersList.filter(u => 
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.id?.includes(searchQuery)
  );

  // 1. NON-ADMIN GATEWAY (Secure Login Page)
  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 flex items-center justify-center min-h-[70vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-slate-900/40 p-8 shadow-2xl backdrop-blur-xl relative"
        >
          {/* Subtle colored glow behind portal */}
          <div className="absolute -top-12 -left-12 w-36 h-36 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 w-36 h-36 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="text-center mb-8">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Lock className="h-7 w-7 animate-pulse" />
            </div>
            <h2 className="font-sans text-xl font-extrabold text-white">Admin Command Console</h2>
            <p className="mt-2 font-sans text-xs text-slate-400">
              Access database registries, weather broadcasters, and system telemetry stats.
            </p>
          </div>

          {loginError && (
            <div className="mb-5 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 p-3.5 text-xs text-red-400">
              <AlertTriangle className="h-4.5 w-4.5 flex-shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="flex flex-col gap-1">
              <label className="font-sans text-xs font-semibold text-slate-300">Admin Email ID</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="69nirjalmaharjan@gmail.com"
                  className="w-full rounded-xl border border-white/10 bg-slate-950/40 py-2.5 pl-10 pr-4 font-sans text-xs text-white placeholder-slate-600 focus:border-sky-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-sans text-xs font-semibold text-slate-300">Developer Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-white/10 bg-slate-950/40 py-2.5 pl-10 pr-4 font-sans text-xs text-white placeholder-slate-600 focus:border-sky-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="flex h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 font-sans text-sm font-bold text-white hover:opacity-95 disabled:opacity-50 shadow-lg shadow-indigo-500/20 transition-all cursor-pointer"
            >
              {isLoggingIn ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "Authenticate & Open Console"
              )}
            </button>
          </form>

          {/* Quick Help Seeding for Developer Demonstration */}
          <div className="mt-8 border-t border-white/5 pt-4 text-center">
            <button
              onClick={prefillCredentials}
              className="px-4 py-2 text-[11px] font-mono font-semibold text-indigo-400 bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/10 rounded-lg transition-all"
            >
              ⚡ Click to Prefill Verified Admin Credentials
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // 2. MAIN AUTHORIZED ADMINISTRATOR CONSOLE
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 space-y-6">
      {/* Header Profile Info Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-indigo-950/40 to-slate-900/40 p-6 rounded-2xl border border-indigo-500/20 backdrop-blur-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500/5 blur-3xl pointer-events-none" />
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 shadow-inner">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-sans text-xl font-black text-white flex items-center gap-2">
              System Control Room
              <span className="text-[10px] font-mono uppercase bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">
                Authorized Admin
              </span>
            </h1>
            <p className="font-sans text-xs text-slate-400 mt-1">
              Currently logged in as: <span className="text-white font-semibold font-mono">{currentUser.email}</span>
            </p>
          </div>
        </div>
        <button
          onClick={fetchAdminData}
          disabled={isLoadingData}
          className="px-4 h-9 rounded-xl border border-white/10 bg-slate-800/40 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all flex items-center gap-2"
        >
          {isLoadingData ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            "Sync Telemetry"
          )}
        </button>
      </div>

      {/* KPI METRICS SHELF */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 flex items-center justify-between backdrop-blur-md">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Registered users</span>
            <span className="text-2xl font-black text-white tracking-tight">
              {stats ? stats.totalUsers : <Loader2 className="h-5 w-5 animate-spin text-slate-500" />}
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
            <Users className="h-5 w-5" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 flex items-center justify-between backdrop-blur-md">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Total Favorites Saved</span>
            <span className="text-2xl font-black text-white tracking-tight">
              {stats ? stats.totalFavorites : <Loader2 className="h-5 w-5 animate-spin text-slate-500" />}
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center">
            <Radio className="h-5 w-5 animate-pulse" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 flex items-center justify-between backdrop-blur-md">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Average Lookups Logged</span>
            <span className="text-2xl font-black text-white tracking-tight">
              {stats ? stats.totalHistory : <Loader2 className="h-5 w-5 animate-spin text-slate-500" />}
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 flex items-center justify-between backdrop-blur-md">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Primary Storage</span>
            <span className="text-sm font-bold text-emerald-400 tracking-tight flex items-center gap-1.5 pt-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              {stats ? stats.dbType : "Active Client"}
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Database className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* ADMIN CONSOLES: Alerts Broadcaster & Users Database */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Meteorology Alerts Broadcaster (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 backdrop-blur-md space-y-4">
            <div className="flex items-center gap-2 border-b border-white/5 pb-3">
              <Megaphone className="h-5 w-5 text-indigo-400" />
              <h2 className="font-sans text-sm font-bold text-white">Meteorology Alerts Dispatch</h2>
            </div>

            {broadcastSuccess && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-emerald-400">
                <CheckCircle className="h-4 w-4" />
                <span>Emergency weather broadcast dispatched successfully!</span>
              </div>
            )}

            <form onSubmit={handleCreateBroadcast} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-slate-300 uppercase">Alert Severity</label>
                  <select
                    value={alertSeverity}
                    onChange={(e) => setAlertSeverity(e.target.value as any)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/50 p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="info">Info (Blue Advisory)</option>
                    <option value="warning">Warning (Yellow Alert)</option>
                    <option value="danger">Danger (Critical Storm)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-slate-300 uppercase">Alert Category</label>
                  <input
                    type="text"
                    required
                    value={alertType}
                    onChange={(e) => setAlertType(e.target.value)}
                    placeholder="System Announcement"
                    className="w-full rounded-xl border border-white/10 bg-slate-950/50 p-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold text-slate-300 uppercase">Warning Title</label>
                <input
                  type="text"
                  required
                  value={alertTitle}
                  onChange={(e) => setAlertTitle(e.target.value)}
                  placeholder="Gale Warnings/Maintenance schedule..."
                  className="w-full rounded-xl border border-white/10 bg-slate-950/50 p-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold text-slate-300 uppercase">Warning Description</label>
                <textarea
                  required
                  rows={3}
                  value={alertMessage}
                  onChange={(e) => setAlertMessage(e.target.value)}
                  placeholder="Atmospheric cells are merging... / Server migrating to secure hosting nodes..."
                  className="w-full rounded-xl border border-white/10 bg-slate-950/50 p-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={isBroadcasting}
                className="w-full h-10 rounded-xl bg-gradient-to-r from-indigo-500 to-sky-600 text-xs font-bold text-white hover:opacity-95 shadow-lg shadow-indigo-500/10 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {isBroadcasting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Dispatch Live Advisory
                  </>
                )}
              </button>
            </form>
          </div>

          {/* ACTIVE DISPATCHES LIST */}
          <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 backdrop-blur-md space-y-4">
            <div className="flex items-center gap-2 justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <BellRing className="h-5 w-5 text-indigo-400" />
                <h2 className="font-sans text-sm font-bold text-white">Active System Bulletins</h2>
              </div>
              <span className="text-[10px] bg-slate-800 text-indigo-300 font-mono px-2 py-0.5 rounded-full">
                {broadcastsList.length} Active
              </span>
            </div>

            {broadcastsList.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">No custom admin broadcasts are currently active.</p>
            ) : (
              <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                {broadcastsList.map((broadcast) => (
                  <div 
                    key={broadcast.id}
                    className={`p-3 rounded-xl border flex justify-between items-start gap-2 text-xs transition-all ${
                      broadcast.severity === "danger" 
                        ? "bg-red-500/5 border-red-500/20 text-red-200" 
                        : broadcast.severity === "warning"
                        ? "bg-amber-500/5 border-amber-500/20 text-amber-200"
                        : "bg-blue-500/5 border-blue-500/20 text-blue-200"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{broadcast.title}</span>
                        <span className="text-[8px] font-mono px-1.5 py-0.2 bg-white/5 rounded uppercase">
                          {broadcast.type}
                        </span>
                      </div>
                      <p className="text-slate-400 leading-relaxed text-[11px]">{broadcast.message}</p>
                      <span className="text-[9px] font-mono text-slate-500 block">
                        {new Date(broadcast.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteBroadcast(broadcast.id)}
                      className="text-slate-400 hover:text-red-400 p-1 rounded hover:bg-white/5 transition-colors"
                      title="Delete Broadcast"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Users Directory (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/40 border border-white/5 rounded-2xl p-6 backdrop-blur-md flex flex-col space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-indigo-400" />
              <h2 className="font-sans text-sm font-bold text-white">User Registry Database</h2>
            </div>
            {/* Search Input bar */}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email ID..."
              className="px-3 py-1.5 rounded-lg border border-white/10 bg-slate-950/40 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 w-full sm:w-48"
            />
          </div>

          <div className="flex-1 overflow-x-auto">
            {isLoadingData ? (
              <div className="py-20 text-center flex flex-col items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-slate-500 mb-2" />
                <span className="text-xs text-slate-400 font-sans">Compiling registered directories...</span>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-20 text-center text-slate-500 text-xs">
                No matching registered users located.
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] font-mono text-slate-400 uppercase">
                    <th className="py-2 px-3">Subscriber name</th>
                    <th className="py-2 px-3">Email identification</th>
                    <th className="py-2 px-3">Registered date</th>
                    <th className="py-2 px-3 text-right">Registry action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                  {filteredUsers.map((item) => {
                    const isCurrentUserAdmin = item.email.toLowerCase().trim() === "69nirjalmaharjan@gmail.com";
                    return (
                      <tr key={item.id} className="hover:bg-white/2 transition-colors">
                        <td className="py-3 px-3 font-semibold text-white">{item.name}</td>
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-400">{item.email}</td>
                        <td className="py-3 px-3 font-mono text-[10px]">
                          {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "Historical"}
                        </td>
                        <td className="py-3 px-3 text-right">
                          {isCurrentUserAdmin ? (
                            <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full uppercase">
                              Admin Root
                            </span>
                          ) : (
                            <button
                              onClick={() => handleDeleteUser(item.id, item.email)}
                              className="text-rose-400 hover:text-rose-300 p-1.5 rounded-lg border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 transition-all text-[11px] font-semibold flex items-center gap-1.5 ml-auto"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Deactivate
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
