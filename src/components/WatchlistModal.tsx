import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Bookmark, History, Play, Trash2, Heart, Clock, Star } from 'lucide-react';
import { Movie, ViewingHistoryItem } from '../types';
import { soundFx } from '../utils/soundEffects';

interface WatchlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: ViewingHistoryItem[];
  allMovies: Movie[];
  onSelectMovie: (movie: Movie) => void;
  onToggleWatchlist: (movieId: string) => void;
  onClearHistory: () => void;
}

export function WatchlistModal({
  isOpen,
  onClose,
  history,
  allMovies,
  onSelectMovie,
  onToggleWatchlist,
  onClearHistory,
}: WatchlistModalProps) {
  const [activeTab, setActiveTab] = useState<'watchlist' | 'history'>('watchlist');

  if (!isOpen) return null;

  const movieMap = new Map(allMovies.map(m => [m.id, m]));

  const watchlistMovies = history
    .filter(h => h.watchlist)
    .map(h => movieMap.get(h.movieId))
    .filter((m): m is Movie => !!m);

  const watchedHistoryMovies = history
    .filter(h => h.viewCount > 0)
    .sort((a, b) => b.watchedAt - a.watchedAt)
    .map(h => ({
      movie: movieMap.get(h.movieId),
      item: h,
    }))
    .filter((entry): entry is { movie: Movie; item: ViewingHistoryItem } => !!entry.movie);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-md"
      />

      {/* Slide-in Drawer */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="relative z-10 h-full w-full max-w-md bg-[#090d16] border-l border-slate-800 p-6 flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <Bookmark className="h-5 w-5 text-amber-400" />
            <h3 className="font-cinzel text-lg font-bold text-white">
              My Cinema Vault
            </h3>
          </div>
          <button
            onClick={() => {
              soundFx.playWhoosh();
              onClose();
            }}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-2 mt-4 p-1 rounded-xl bg-slate-950 border border-slate-800/80">
          <button
            onClick={() => {
              soundFx.playWhoosh();
              setActiveTab('watchlist');
            }}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'watchlist'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bookmark className="h-3.5 w-3.5" />
            <span>Watchlist ({watchlistMovies.length})</span>
          </button>
          <button
            onClick={() => {
              soundFx.playWhoosh();
              setActiveTab('history');
            }}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'history'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="h-3.5 w-3.5" />
            <span>History ({watchedHistoryMovies.length})</span>
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto mt-4 space-y-3 pr-1">
          {activeTab === 'watchlist' ? (
            watchlistMovies.length > 0 ? (
              watchlistMovies.map(movie => (
                <div
                  key={movie.id}
                  onClick={() => {
                    soundFx.playCinematicHit();
                    onSelectMovie(movie);
                    onClose();
                  }}
                  className="group relative flex items-center gap-3.5 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-amber-500/50 hover:bg-slate-900 transition-all cursor-pointer"
                >
                  <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg">
                    <img
                      src={movie.backdropUrl}
                      alt={movie.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="h-4 w-4 text-amber-400 fill-amber-400" />
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="font-cinzel text-sm font-bold text-white truncate group-hover:text-amber-300">
                      {movie.title}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <span>{movie.releaseYear}</span>
                      <span>•</span>
                      <span className="text-amber-400">★ {movie.rating}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block truncate mt-0.5">
                      {movie.genres.join(', ')}
                    </span>
                  </div>

                  <button
                    onClick={e => {
                      e.stopPropagation();
                      soundFx.playWhoosh();
                      onToggleWatchlist(movie.id);
                    }}
                    title="Remove from watchlist"
                    className="p-2 text-slate-500 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-16 text-slate-500">
                <Bookmark className="h-10 w-10 stroke-1 mb-3 text-slate-600" />
                <h4 className="font-bold text-white text-sm">Your watchlist is empty</h4>
                <p className="text-xs max-w-xs mt-1 text-slate-400">
                  Bookmark trailers while browsing to save them for your next cinema night!
                </p>
              </div>
            )
          ) : (
            watchedHistoryMovies.length > 0 ? (
              <div className="space-y-3">
                <div className="flex justify-end">
                  <button
                    onClick={onClearHistory}
                    className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
                  >
                    <Trash2 className="h-3 w-3" />
                    Clear History
                  </button>
                </div>
                {watchedHistoryMovies.map(({ movie, item }) => (
                  <div
                    key={movie.id}
                    onClick={() => {
                      soundFx.playCinematicHit();
                      onSelectMovie(movie);
                      onClose();
                    }}
                    className="group relative flex items-center gap-3.5 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-amber-500/50 hover:bg-slate-900 transition-all cursor-pointer"
                  >
                    <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg">
                      <img
                        src={movie.backdropUrl}
                        alt={movie.title}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="h-4 w-4 text-amber-400 fill-amber-400" />
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="font-cinzel text-sm font-bold text-white truncate group-hover:text-amber-300">
                        {movie.title}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <span className="text-amber-400">Watched {item.viewCount}x</span>
                        {item.userScore && (
                          <span className="text-amber-300">★ {item.userScore}/5</span>
                        )}
                        {item.liked && (
                          <Heart className="h-3 w-3 text-rose-500 fill-rose-500" />
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 block truncate mt-0.5">
                        {new Date(item.watchedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-16 text-slate-500">
                <History className="h-10 w-10 stroke-1 mb-3 text-slate-600" />
                <h4 className="font-bold text-white text-sm">No watch history yet</h4>
                <p className="text-xs max-w-xs mt-1 text-slate-400">
                  Click on any movie trailer to preview, and your taste profile will learn your preferences.
                </p>
              </div>
            )
          )}
        </div>

      </motion.div>
    </div>
  );
}
