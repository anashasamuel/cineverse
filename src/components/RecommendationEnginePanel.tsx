import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, BrainCircuit, RefreshCw, ChevronDown, ChevronUp, Sliders, Flame, Ghost, Smile, Compass, Check } from 'lucide-react';
import { Movie, ViewingHistoryItem, TasteProfile, Genre } from '../types';
import { TASTE_PROFILES } from '../data/movies';
import { calculateUserAffinity, applyPresetProfile, clearHistory } from '../utils/recommendationEngine';
import { soundFx } from '../utils/soundEffects';

interface RecommendationEnginePanelProps {
  history: ViewingHistoryItem[];
  allMovies: Movie[];
  onHistoryUpdated: () => void;
  onSelectMovie: (movie: Movie) => void;
}

export function RecommendationEnginePanel({
  history,
  allMovies,
  onHistoryUpdated,
  onSelectMovie,
}: RecommendationEnginePanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeProfileName, setActiveProfileName] = useState<string | null>(null);

  const { genreScores, favoriteDirectors, totalWeight } = calculateUserAffinity(history, allMovies);

  const watchedCount = history.filter(h => h.viewCount > 0).length;
  const likedCount = history.filter(h => h.liked).length;
  const watchlistCount = history.filter(h => h.watchlist).length;

  // Calculate top genres with percentage
  const totalGenreScore = Object.values(genreScores).reduce((a, b) => a + b, 0) || 1;
  const sortedGenres = (Object.entries(genreScores) as [Genre, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([genre, score]) => ({
      genre,
      percentage: Math.round((score / totalGenreScore) * 100),
    }));

  const handleApplyPreset = (profile: TasteProfile) => {
    soundFx.playChime();
    setActiveProfileName(profile.name);
    applyPresetProfile(profile, allMovies);
    onHistoryUpdated();
  };

  const handleResetHistory = () => {
    soundFx.playWhoosh();
    clearHistory();
    setActiveProfileName(null);
    onHistoryUpdated();
  };

  const getProfileIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sparkles': return <Sparkles className="h-4 w-4" />;
      case 'Flame': return <Flame className="h-4 w-4" />;
      case 'Ghost': return <Ghost className="h-4 w-4" />;
      default: return <Smile className="h-4 w-4" />;
    }
  };

  return (
    <section className="relative z-20 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-4" id="recommendation-engine-panel">
      <div className="rounded-2xl bg-gradient-to-r from-slate-900/90 via-[#0c1222]/90 to-slate-900/90 border border-amber-500/30 p-5 sm:p-6 backdrop-blur-2xl shadow-xl shadow-amber-500/5">
        
        {/* Banner Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 shadow-lg shadow-amber-500/30">
              <BrainCircuit className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-cinzel text-lg sm:text-xl font-bold text-white tracking-wide">
                  AI CineRecommendation Engine
                </h3>
                <span className="flex items-center gap-1 rounded-full bg-amber-400/10 border border-amber-400/30 px-2.5 py-0.5 text-[10px] font-bold text-amber-300">
                  <Sparkles className="h-3 w-3" /> Live
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Dynamic affinity matching based on your trailer watch history, ratings, and saved watchlist.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 px-3.5 py-2 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
            >
              <Sliders className="h-3.5 w-3.5 text-amber-400" />
              <span>{isExpanded ? 'Hide Taste Matrix' : 'Customize Taste Profile'}</span>
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Live Taste Matrix Stats Bar */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-slate-800/80 pt-4 text-xs">
          <div className="rounded-xl bg-slate-950/40 p-2.5 border border-slate-800/50">
            <span className="text-slate-500 block text-[11px]">Trailers Watched</span>
            <span className="text-base font-bold text-white">{watchedCount} films</span>
          </div>

          <div className="rounded-xl bg-slate-950/40 p-2.5 border border-slate-800/50">
            <span className="text-slate-500 block text-[11px]">Liked & Favorited</span>
            <span className="text-base font-bold text-rose-400">{likedCount} films</span>
          </div>

          <div className="rounded-xl bg-slate-950/40 p-2.5 border border-slate-800/50">
            <span className="text-slate-500 block text-[11px]">In Watchlist</span>
            <span className="text-base font-bold text-amber-400">{watchlistCount} saved</span>
          </div>

          <div className="rounded-xl bg-slate-950/40 p-2.5 border border-slate-800/50">
            <span className="text-slate-500 block text-[11px]">Top Genre Affinity</span>
            <span className="text-base font-bold text-cyan-400">
              {sortedGenres[0]?.genre || 'Sci-Fi'} ({sortedGenres[0]?.percentage || 65}%)
            </span>
          </div>
        </div>

        {/* Collapsible Customizer Drawer */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-6 pt-6 border-t border-slate-800/80 overflow-hidden space-y-6"
            >
              {/* Dynamic Genre Affinity Bars */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-1.5">
                  <Compass className="h-3.5 w-3.5 text-amber-400" />
                  Your Real-Time Genre Affinity Breakdown
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {sortedGenres.length > 0 ? (
                    sortedGenres.map(item => (
                      <div key={item.genre} className="space-y-1">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-slate-300">{item.genre}</span>
                          <span className="text-amber-400 font-bold">{item.percentage}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${item.percentage}%` }}
                            transition={{ duration: 0.6 }}
                            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300"
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-400 italic">
                      Watch trailers or rate movies to generate your personal affinity graph!
                    </div>
                  )}
                </div>
              </div>

              {/* Instant Preset Taste Profiles */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Switch Taste Profile (One-Click Auto-Calibration)
                  </h4>
                  <button
                    onClick={handleResetHistory}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-rose-400 transition-colors"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Reset Taste Data
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {TASTE_PROFILES.map(profile => {
                    const isActive = activeProfileName === profile.name;
                    return (
                      <button
                        key={profile.name}
                        onClick={() => handleApplyPreset(profile)}
                        className={`text-left p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                          isActive
                            ? 'bg-amber-500/10 border-amber-500 text-white ring-1 ring-amber-500'
                            : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold flex items-center gap-1.5 text-amber-400">
                            {getProfileIcon(profile.icon)}
                            {profile.name}
                          </span>
                          {isActive && <Check className="h-4 w-4 text-amber-400" />}
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-2">
                          {profile.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </section>
  );
}
