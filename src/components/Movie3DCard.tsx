import React, { useState, useRef, MouseEvent } from 'react';
import { motion } from 'motion/react';
import { Play, Star, Heart, Bookmark, Clock, Sparkles, Download, CheckCircle2, Tv } from 'lucide-react';
import { Movie } from '../types';
import { soundFx } from '../utils/soundEffects';

export interface Movie3DCardProps {
  key?: string;
  movie: Movie;
  onSelect: (movie: Movie) => void;
  matchPercentage?: number;
  matchReasons?: string[];
  isLiked?: boolean;
  onToggleLike?: (movieId: string) => void;
  inWatchlist?: boolean;
  onToggleWatchlist?: (movieId: string) => void;
  onOpenDownloadModal?: (movie: Movie) => void;
  isSavedOffline?: boolean;
  compact?: boolean;
}

export function Movie3DCard({
  movie,
  onSelect,
  matchPercentage,
  matchReasons,
  isLiked = false,
  onToggleLike,
  inWatchlist = false,
  onToggleWatchlist,
  onOpenDownloadModal,
  isSavedOffline = false,
  compact = false,
}: Movie3DCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glarePosition, setGlarePosition] = useState({ x: 50, y: 50, opacity: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotX = ((y - centerY) / centerY) * -14;
    const rotY = ((x - centerX) / centerX) * 14;

    setRotateX(rotX);
    setRotateY(rotY);

    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;
    setGlarePosition({ x: glareX, y: glareY, opacity: 0.25 });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    soundFx.playChime();
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
    setGlarePosition(prev => ({ ...prev, opacity: 0 }));
  };

  const handlePlayClick = (e: MouseEvent) => {
    e.stopPropagation();
    soundFx.playCinematicHit();
    onSelect(movie);
  };

  const handleLikeClick = (e: MouseEvent) => {
    e.stopPropagation();
    soundFx.playWhoosh();
    onToggleLike?.(movie.id);
  };

  const handleWatchlistClick = (e: MouseEvent) => {
    e.stopPropagation();
    soundFx.playWhoosh();
    onToggleWatchlist?.(movie.id);
  };

  const handleDownloadClick = (e: MouseEvent) => {
    e.stopPropagation();
    soundFx.playWhoosh();
    onOpenDownloadModal?.(movie);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => {
        soundFx.playCinematicHit();
        onSelect(movie);
      }}
      className="group relative cursor-pointer select-none perspective-1000"
      id={`movie-card-${movie.id}`}
    >
      <motion.div
        animate={{
          rotateX,
          rotateY,
          scale: isHovered ? 1.03 : 1,
          boxShadow: isHovered
            ? `0 20px 40px -15px ${movie.accentColor}55, 0 0 25px -5px ${movie.accentColor}33`
            : '0 10px 25px -10px rgba(0,0,0,0.7)',
        }}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        className="relative overflow-hidden rounded-2xl bg-[#0b101d] border border-slate-800/80 transition-colors duration-300 transform-style-3d will-change-transform"
        style={{
          aspectRatio: compact ? '16/10' : '2/3',
        }}
      >
        {/* Dynamic Holographic Glare Overlay */}
        <div
          className="pointer-events-none absolute inset-0 z-30 transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle at ${glarePosition.x}% ${glarePosition.y}%, rgba(255,255,255,${glarePosition.opacity}), transparent 60%)`,
          }}
        />

        {/* Poster / Backdrop Image with Depth Zoom */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src={compact ? movie.backdropUrl : movie.posterUrl}
            alt={movie.title}
            className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-110"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070b14] via-[#070b14]/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />
        </div>

        {/* Top Badges (Match % & Status) */}
        <div
          className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between gap-2"
          style={{ transform: 'translateZ(25px)' }}
        >
          {matchPercentage !== undefined ? (
            <span className="flex items-center gap-1.5 rounded-full bg-amber-500/90 backdrop-blur-md px-2.5 py-1 text-xs font-bold text-slate-950 shadow-lg">
              <Sparkles className="h-3 w-3 fill-slate-950" />
              {matchPercentage}% Match
            </span>
          ) : (
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold backdrop-blur-md border ${
                movie.status === 'upcoming'
                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                  : movie.status === 'classic'
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}
            >
              {movie.status === 'upcoming'
                ? 'Premiere'
                : movie.status === 'classic'
                ? 'Masterpiece'
                : 'Now Showing'}
            </span>
          )}

          {/* Action Quick Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleDownloadClick}
              title={isSavedOffline ? 'Saved on local drive' : 'Download to local drive device'}
              className={`flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-md transition-all duration-200 ${
                isSavedOffline
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/40'
                  : 'bg-black/50 text-slate-300 hover:bg-amber-500 hover:text-slate-950'
              }`}
            >
              {isSavedOffline ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <Download className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={handleLikeClick}
              title={isLiked ? 'Unlike' : 'Like'}
              className={`flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-md transition-all duration-200 ${
                isLiked
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/40'
                  : 'bg-black/50 text-slate-300 hover:bg-rose-600/80 hover:text-white'
              }`}
            >
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={handleWatchlistClick}
              title={inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
              className={`flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-md transition-all duration-200 ${
                inWatchlist
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/40'
                  : 'bg-black/50 text-slate-300 hover:bg-amber-500 hover:text-slate-950'
              }`}
            >
              <Bookmark className={`h-4 w-4 ${inWatchlist ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>

        {/* Center Hover Play Button (Pops out in 3D) */}
        <div
          className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
          style={{ transform: 'translateZ(45px)' }}
        >
          <motion.div
            animate={{
              scale: isHovered ? 1 : 0.7,
              opacity: isHovered ? 1 : 0,
            }}
            transition={{ duration: 0.2 }}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500 text-slate-950 shadow-2xl shadow-amber-500/60 ring-4 ring-amber-500/30"
          >
            <Play className="h-6 w-6 fill-current ml-0.5" />
          </motion.div>
        </div>

        {/* Bottom Content Metadata */}
        <div
          className="absolute bottom-0 inset-x-0 z-20 p-4 pt-10"
          style={{ transform: 'translateZ(30px)' }}
        >
          <div className="flex items-center gap-2 text-xs text-amber-400/90 mb-1 font-medium">
            <span className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-current text-amber-400" />
              {movie.rating}
            </span>
            <span className="text-slate-600">•</span>
            <span>{movie.releaseYear}</span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center gap-1 text-slate-400">
              <Clock className="h-3 w-3" />
              {movie.trailerDuration}
            </span>
          </div>

          <h3 className="font-cinzel text-lg sm:text-xl font-bold text-white tracking-wide leading-tight line-clamp-1 group-hover:text-amber-300 transition-colors">
            {movie.title}
          </h3>

          <p className="text-xs text-slate-400 line-clamp-1 mt-1 font-light italic">
            "{movie.tagline}"
          </p>

          <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
            {movie.genres.slice(0, 2).map(g => (
              <span
                key={g}
                className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-medium text-slate-300 backdrop-blur-xs border border-white/5"
              >
                {g}
              </span>
            ))}
            <span className="rounded-md bg-slate-800/80 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 border border-slate-700">
              {movie.maturityRating}
            </span>
          </div>

          {matchReasons && matchReasons.length > 0 && (
            <div className="mt-2 text-[11px] text-amber-300/80 line-clamp-1 flex items-center gap-1">
              <Sparkles className="h-3 w-3 shrink-0 text-amber-400" />
              {matchReasons[0]}
            </div>
          )}

          {/* Action Footer on Hover */}
          <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
            <span className="text-slate-400 text-[11px] truncate max-w-[100px]">
              {movie.director}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePlayClick}
                className="flex items-center gap-1 font-bold text-amber-400 hover:text-amber-300 transition-colors"
                title="Watch Full Movie or Trailer"
              >
                <span>Full Movie</span>
                <Tv className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Accent Color Edge Glow */}
        <div
          className="absolute bottom-0 inset-x-0 h-1 transition-all duration-300 group-hover:h-1.5"
          style={{
            backgroundColor: movie.accentColor,
            boxShadow: `0 0 16px ${movie.accentColor}`,
          }}
        />
      </motion.div>
    </div>
  );
}
