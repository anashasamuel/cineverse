import React, { ReactNode } from 'react';
import { Movie, ViewingHistoryItem } from '../types';
import { Movie3DCard } from './Movie3DCard';
import { ChevronRight, Sparkles } from 'lucide-react';
import { soundFx } from '../utils/soundEffects';

interface MovieShelfProps {
  title: string;
  subtitle?: string;
  movies: Movie[];
  onSelectMovie: (movie: Movie) => void;
  history: ViewingHistoryItem[];
  onToggleLike: (movieId: string) => void;
  onToggleWatchlist: (movieId: string) => void;
  onOpenDownloadModal?: (movie: Movie) => void;
  offlineMovieIds?: Set<string>;
  icon?: ReactNode;
  badgeText?: string;
  compact?: boolean;
}

export function MovieShelf({
  title,
  subtitle,
  movies,
  onSelectMovie,
  history,
  onToggleLike,
  onToggleWatchlist,
  onOpenDownloadModal,
  offlineMovieIds,
  icon,
  badgeText,
  compact = false,
}: MovieShelfProps) {
  if (movies.length === 0) return null;

  const historyMap = new Map(history.map(h => [h.movieId, h]));

  return (
    <div className="relative z-10 py-6">
      {/* Shelf Header */}
      <div className="flex items-end justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            {icon}
            <h3 className="font-cinzel text-xl sm:text-2xl font-bold text-white tracking-wide">
              {title}
            </h3>
            {badgeText && (
              <span className="rounded-full bg-amber-500/20 border border-amber-500/30 px-2.5 py-0.5 text-[10px] font-bold text-amber-300">
                {badgeText}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Grid of 3D Parallax Tilt Cards */}
      <div className={`grid gap-5 ${
        compact
          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
          : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'
      }`}>
        {movies.map(movie => {
          const userItem = historyMap.get(movie.id);
          return (
            <Movie3DCard
              key={movie.id}
              movie={movie}
              onSelect={onSelectMovie}
              isLiked={!!userItem?.liked}
              onToggleLike={onToggleLike}
              inWatchlist={!!userItem?.watchlist}
              onToggleWatchlist={onToggleWatchlist}
              onOpenDownloadModal={onOpenDownloadModal}
              isSavedOffline={offlineMovieIds?.has(movie.id)}
              compact={compact}
            />
          );
        })}
      </div>
    </div>
  );
}
