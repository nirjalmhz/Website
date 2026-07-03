import { FavoriteCity } from "../types";
import { Heart, Trash2, ArrowUp, ArrowDown, MapPin, Cloud, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface FavoritesViewProps {
  favorites: FavoriteCity[];
  onSelectCity: (lat: number, lon: number, name: string, country: string, state?: string) => void;
  onRemoveFavorite: (id: string) => void;
  onReorderFavorites: (reorderedIds: string[]) => void;
  isLoading: boolean;
}

export default function FavoritesView({
  favorites,
  onSelectCity,
  onRemoveFavorite,
  onReorderFavorites,
  isLoading,
}: FavoritesViewProps) {
  const handleMove = (index: number, direction: "up" | "down") => {
    const newFavs = [...favorites];
    const targetIdx = direction === "up" ? index - 1 : index + 1;

    if (targetIdx < 0 || targetIdx >= favorites.length) return;

    // Swap items
    const temp = newFavs[index];
    newFavs[index] = newFavs[targetIdx];
    newFavs[targetIdx] = temp;

    onReorderFavorites(newFavs.map((f) => f.id));
  };

  return (
    <div id="favorites-tab-view" className="flex flex-col gap-6 p-4 md:p-6 lg:p-8 w-full">
      {/* Header */}
      <div>
        <h2 className="font-sans text-xl font-bold text-white flex items-center gap-2">
          <Heart className="h-5 w-5 text-rose-500 fill-rose-500 animate-pulse" />
          Saved Favorite Cities
        </h2>
        <p className="font-sans text-xs text-slate-400">
          Pin, remove, and reorder cities worldwide for instant-access microclimate diagnostics.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-10 w-10 text-sky-400 animate-spin" />
        </div>
      ) : favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-white/10 bg-slate-900/40 p-8 backdrop-blur-md">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-slate-700 text-slate-500 mb-4">
            <Heart className="h-6 w-6" />
          </div>
          <span className="font-sans text-sm font-semibold text-slate-400">
            No Saved Locations
          </span>
          <p className="mt-1 max-w-xs font-sans text-xs text-slate-500 leading-relaxed">
            Search for any city worldwide on the Dashboard and click the heart icon next to its name to pin it here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {favorites.map((fav, index) => (
              <motion.div
                key={fav.id}
                id={`favorite-card-${fav.id}`}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="group relative flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-slate-900/40 p-4 backdrop-blur-md hover:border-white/20 transition-all hover:bg-slate-900/60"
              >
                {/* Details Section */}
                <div
                  id={`favorite-details-${fav.id}`}
                  onClick={() => onSelectCity(fav.lat, fav.lon, fav.name, fav.country, fav.state)}
                  className="flex-1 min-w-0 cursor-pointer flex items-start gap-3"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 group-hover:scale-105 transition-transform">
                    <Cloud className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="font-sans text-sm font-bold text-white group-hover:text-sky-300 transition-colors block truncate">
                      {fav.name}
                    </span>
                    <span className="font-sans text-[11px] text-slate-400 truncate block">
                      {fav.state ? `${fav.state}, ` : ""}{fav.country}
                    </span>
                    <span className="font-mono text-[9px] text-slate-500 mt-1 block">
                      {fav.lat.toFixed(2)}°N, {fav.lon.toFixed(2)}°E
                    </span>
                  </div>
                </div>

                {/* Operations Panel */}
                <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                  {/* Reorder Up */}
                  <button
                    id={`btn-fav-up-${fav.id}`}
                    onClick={() => handleMove(index, "up")}
                    disabled={index === 0}
                    className="rounded p-1 text-slate-400 hover:bg-white/5 hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                    title="Move Up"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>

                  {/* Reorder Down */}
                  <button
                    id={`btn-fav-down-${fav.id}`}
                    onClick={() => handleMove(index, "down")}
                    disabled={index === favorites.length - 1}
                    className="rounded p-1 text-slate-400 hover:bg-white/5 hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                    title="Move Down"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>

                  {/* Delete */}
                  <button
                    id={`btn-fav-remove-${fav.id}`}
                    onClick={() => onRemoveFavorite(fav.id)}
                    className="rounded p-1 text-rose-500/70 hover:bg-rose-500/10 hover:text-rose-400 cursor-pointer ml-1"
                    title="Remove from Favorites"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
