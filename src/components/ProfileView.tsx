import React, { useState } from "react";
import { User, SearchHistoryItem } from "../types";
import { User as UserIcon, Calendar, Mail, Search, Trash2, Edit2, CheckCircle2, History, Loader2 } from "lucide-react";
import { motion } from "motion/react";

interface ProfileViewProps {
  user: User | null;
  searchHistory: SearchHistoryItem[];
  onSelectCity: (lat: number, lon: number, name: string, country: string, state?: string) => void;
  onClearHistory: () => void;
  onUpdateProfile: (name: string) => Promise<boolean>;
  onOpenAuth: () => void;
}

export default function ProfileView({
  user,
  searchHistory,
  onSelectCity,
  onClearHistory,
  onUpdateProfile,
  onOpenAuth,
}: ProfileViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(user?.name || "");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!user) {
    return (
      <div id="profile-unauth-view" className="flex flex-col items-center justify-center py-20 text-center px-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-900/40 border border-white/10 mb-5">
          <UserIcon className="h-8 w-8 text-slate-500" />
        </div>
        <h2 className="font-sans text-xl font-bold text-white">Your Weather Profile</h2>
        <p className="mt-2 max-w-sm font-sans text-xs text-slate-400 leading-relaxed">
          Log in or register an account to view your search histories, edit personal profile sheets, and customize pinned favorites.
        </p>
        <button
          id="profile-sign-in-btn"
          onClick={onOpenAuth}
          className="mt-6 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-6 py-2.5 text-xs font-bold text-white hover:opacity-95 shadow-lg shadow-sky-500/25 cursor-pointer"
        >
          Sign In Now
        </button>
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editedName.trim() || editedName === user.name) {
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    const ok = await onUpdateProfile(editedName.trim());
    setIsSaving(false);
    if (ok) {
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  return (
    <div id="profile-tab-view" className="flex flex-col gap-6 p-4 md:p-6 lg:p-8 w-full max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="font-sans text-xl font-bold text-white flex items-center gap-2">
          <UserIcon className="h-5 w-5 text-indigo-400 animate-pulse" />
          AetherSky Profile
        </h2>
        <p className="font-sans text-xs text-slate-400">
          Manage your personal identifiers and view your synchronized travel search footprints.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column: User Identity Cards */}
        <div className="md:col-span-1 flex flex-col gap-6">
          <div className="flex flex-col items-center text-center rounded-2xl border border-white/10 bg-slate-900/40 p-6 backdrop-blur-md">
            {/* Avatar block */}
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-400 to-indigo-600 text-white text-3xl font-bold shadow-xl shadow-sky-500/10 mb-4">
              {user.name.charAt(0).toUpperCase()}
            </div>

            {isEditing ? (
              <form onSubmit={handleSave} className="w-full flex flex-col gap-2">
                <input
                  id="profile-edit-name-input"
                  type="text"
                  required
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-1.5 font-sans text-xs text-white text-center focus:border-sky-500 focus:outline-none"
                  autoFocus
                />
                <div className="flex gap-1">
                  <button
                    id="profile-save-name-btn"
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 rounded-lg bg-sky-500 py-1.5 font-sans text-[10px] font-bold text-white hover:opacity-90 cursor-pointer"
                  >
                    {isSaving ? <Loader2 className="h-3 w-3 animate-spin mx-auto" /> : "Save"}
                  </button>
                  <button
                    id="profile-cancel-edit-btn"
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setEditedName(user.name);
                    }}
                    className="flex-1 rounded-lg border border-white/10 py-1.5 font-sans text-[10px] text-slate-400 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col items-center">
                <span className="font-sans text-base font-bold text-white flex items-center gap-1.5">
                  {user.name}
                  <button
                    id="profile-edit-trigger"
                    onClick={() => setIsEditing(true)}
                    className="rounded p-1 text-slate-500 hover:bg-white/5 hover:text-white cursor-pointer"
                    title="Edit Name"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                </span>
                <span className="font-mono text-[9px] text-slate-500 mt-1 uppercase tracking-widest">
                  MEMBER SES_ID
                </span>
              </div>
            )}

            {saveSuccess && (
              <span className="font-sans text-[10px] text-emerald-400 font-semibold mt-2 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Name updated successfully.
              </span>
            )}

            {/* Meta statistics list */}
            <div className="mt-6 w-full space-y-3.5 text-left text-xs border-t border-white/5 pt-5">
              <div className="flex items-center gap-2.5 text-slate-300">
                <Mail className="h-4 w-4 text-slate-500 shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-300">
                <Calendar className="h-4 w-4 text-slate-500 shrink-0" />
                <span>Since: {new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Search footprint tracker */}
        <div className="md:col-span-2 rounded-2xl border border-white/10 bg-slate-900/40 p-5 md:p-6 backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-white/5 pb-3.5 mb-5">
            <span className="font-sans text-xs font-bold text-white flex items-center gap-1.5">
              <History className="h-4.5 w-4.5 text-sky-400" />
              Recent Search History
            </span>
            {searchHistory.length > 0 && (
              <button
                id="profile-clear-history-btn"
                onClick={onClearHistory}
                className="flex items-center gap-1 font-sans text-[10px] font-semibold text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear Footprint
              </button>
            )}
          </div>

          {searchHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-slate-700 text-slate-600 mb-3">
                <Search className="h-5 w-5" />
              </div>
              <span className="font-sans text-xs font-semibold text-slate-400">
                History is Empty
              </span>
              <p className="mt-1 max-w-xs font-sans text-[10px] text-slate-600 leading-normal">
                No recent coordinates searched. Run autocomplete queries on the dashboard to populate logs.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {searchHistory.map((item) => (
                <div
                  key={item.id}
                  id={`history-item-${item.id}`}
                  onClick={() => onSelectCity(item.lat, item.lon, item.name, item.country, item.state)}
                  className="group flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-slate-950/20 p-3 hover:bg-slate-950/40 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Search className="h-4 w-4 text-slate-500 shrink-0" />
                    <div className="min-w-0">
                      <span className="font-sans text-xs font-bold text-white group-hover:text-sky-300 transition-colors block truncate">
                        {item.name}
                      </span>
                      <span className="font-sans text-[10px] text-slate-400 truncate block">
                        {item.state ? `${item.state}, ` : ""}{item.country}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex flex-col shrink-0">
                    <span className="font-mono text-[9px] text-slate-500">
                      {item.lat.toFixed(2)}°, {item.lon.toFixed(2)}°
                    </span>
                    <span className="font-sans text-[9px] text-slate-500 mt-0.5">
                      {new Date(item.searchedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
