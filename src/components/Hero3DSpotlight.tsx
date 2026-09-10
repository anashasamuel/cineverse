import React, { useState, useEffect, useRef, MouseEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Bookmark, Star, Sparkles, ChevronRight, ChevronLeft, Volume2, VolumeX, Flame, Download, HardDrive, Tv } from 'lucide-react';
import { Movie } from '../types';
import { soundFx } from '../utils/soundEffects';

interface Hero3DSpotlightProps {
  featuredMovies: Movie[];
  onPlayTrailer: (movie: Movie) => void;
  onWatchFullMovie?: (movie: Movie) => void;
  onOpenDownloadModal?: (movie: Movie) => void;
  onToggleWatchlist: (movieId: string) => void;
  watchlist: string[];
  offlineMovieIds?: Set<string>;
}

export function Hero3DSpotlight({
  featuredMovies,
  onPlayTrailer,
  onWatchFullMovie,
  onOpenDownloadModal,
  onToggleWatchlist,
  watchlist,
  offlineMovieIds,
}: Hero3DSpotlightProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const activeMovie = featuredMovies[currentIndex] || featuredMovies[0];
  const inWatchlist = watchlist.includes(activeMovie?.id);

  // Auto-advance every 7 seconds if not hovered
  useEffect(() => {
    if (isHovered || featuredMovies.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % featuredMovies.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [isHovered, featuredMovies.length]);

  // Mouse Parallax Calculation
  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    setMousePos({ x, y });
  };

  const goToSlide = (index: number) => {
    soundFx.playWhoosh();
    setCurrentIndex(index);
  };

  const nextSlide = () => {
    soundFx.playWhoosh();
    setCurrentIndex(prev => (prev + 1) % featuredMovies.length);
  };

  const prevSlide = () => {
    soundFx.playWhoosh();
    setCurrentIndex(prev => (prev - 1 + featuredMovies.length) % featuredMovies.length);
  };

  const handleWatchTrailer = () => {
    soundFx.playCinematicHit();
    onPlayTrailer(activeMovie);
  };

  const handleToggleWatchlist = () => {
    soundFx.playWhoosh();
    onToggleWatchlist(activeMovie.id);
  };

  return (
    <section
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setMousePos({ x: 0, y: 0 });
      }}
      className="relative min-h-[85vh] lg:min-h-[92vh] w-full overflow-hidden flex items-center justify-center pt-20 pb-12 perspective-2000"
      id="hero-spotlight"
    >
      {/* Dynamic 3D Layered Background */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeMovie.id}
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{
            opacity: 1,
            scale: 1,
            x: mousePos.x * -18,
            y: mousePos.y * -14,
          }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 z-0 will-change-transform"
        >
          <img
            src={activeMovie.backdropUrl}
            alt={activeMovie.title}
            className="h-full w-full object-cover object-center"
          />

          {/* Multiple Deep Cinematic Vignette Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#05070d] via-[#05070d]/70 to-[#05070d]/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#05070d] via-[#05070d]/80 to-transparent" />
          <div className="absolute inset-0 bg-radial from-transparent via-[#05070d]/50 to-[#05070d]" />

          {/* Atmospheric Ambient Lighting Glow */}
          <div
            className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full blur-[140px] opacity-30 pointer-events-none transition-colors duration-1000"
            style={{ backgroundColor: activeMovie.accentColor }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Floating 3D Main Stage Container */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Content Column */}
        <div
          className="lg:col-span-7 flex flex-col items-start transform-style-3d will-change-transform"
          style={{
            transform: `perspective(1000px) rotateY(${mousePos.x * 4}deg) rotateX(${-mousePos.y * 4}deg)`,
            transition: 'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
          }}
        >
          {/* Tag Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="flex items-center gap-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 px-3 py-1 text-xs font-semibold text-amber-300 backdrop-blur-md">
              <Flame className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
              SPOTLIGHT PREMIERE
            </span>
            <span className="rounded-full bg-white/10 border border-white/10 px-3 py-1 text-xs font-medium text-slate-300 backdrop-blur-md">
              IMAX Enhanced 4K
            </span>
            <span className="rounded-full bg-slate-800/80 px-2.5 py-1 text-xs font-bold text-slate-300 border border-slate-700">
              {activeMovie.maturityRating}
            </span>
          </div>

          {/* Movie Title */}
          <h1
            className="font-cinzel text-4xl sm:text-6xl xl:text-7xl font-extrabold text-white leading-tight tracking-tight drop-shadow-2xl"
            style={{
              textShadow: `0 4px 30px rgba(0,0,0,0.8), 0 0 40px ${activeMovie.accentColor}33`,
            }}
          >
            {activeMovie.title}
          </h1>

          {/* Tagline */}
          <p className="mt-2 text-lg sm:text-xl text-amber-400/95 font-medium italic">
            "{activeMovie.tagline}"
          </p>

          {/* Metadata Row */}
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-300">
            <div className="flex items-center gap-1.5 font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
              <Star className="h-4 w-4 fill-amber-400" />
              <span>{activeMovie.rating} / 10</span>
              <span className="text-xs font-normal text-slate-400">({activeMovie.reviewCount} votes)</span>
            </div>
            <span className="text-slate-500">•</span>
            <span className="font-semibold text-slate-200">{activeMovie.releaseYear}</span>
            <span className="text-slate-500">•</span>
            <span>{activeMovie.duration}</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">Dir. <strong className="text-slate-200 font-semibold">{activeMovie.director}</strong></span>
          </div>

          {/* Synopsis */}
          <p className="mt-4 text-sm sm:text-base text-slate-300/90 leading-relaxed max-w-2xl line-clamp-3">
            {activeMovie.synopsis}
          </p>

          {/* Cast Chips */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Cast:</span>
            {activeMovie.cast.slice(0, 4).map(actor => (
              <span
                key={actor}
                className="rounded-lg bg-slate-900/80 px-2.5 py-1 text-xs text-slate-300 border border-slate-800"
              >
                {actor}
              </span>
            ))}
          </div>

          {/* Primary Action Buttons */}
          <div className="mt-8 flex flex-wrap items-center gap-3 sm:gap-4">
            <button
              onClick={() => {
                soundFx.playCinematicHit();
                if (onWatchFullMovie) {
                  onWatchFullMovie(activeMovie);
                } else {
                  onPlayTrailer(activeMovie);
                }
              }}
              id="hero-watch-full-btn"
              className="group relative inline-flex items-center gap-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 px-6 py-3.5 text-base font-extrabold text-slate-950 shadow-xl shadow-amber-500/30 transition-all duration-300 hover:scale-105 hover:shadow-amber-500/50 active:scale-95"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-950 text-amber-400 shadow-sm transition-transform duration-300 group-hover:scale-110">
                <Tv className="h-4 w-4" />
              </span>
              <span>Watch Full Movie</span>
              <span className="rounded bg-slate-950/20 px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider">
                4K UHD
              </span>
            </button>

            {onOpenDownloadModal && (
              <button
                onClick={() => {
                  soundFx.playWhoosh();
                  onOpenDownloadModal(activeMovie);
                }}
                id="hero-download-btn"
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900/90 border border-slate-700 hover:border-amber-500/60 hover:bg-slate-800 px-5 py-3.5 text-sm font-bold text-amber-400 backdrop-blur-md shadow-lg transition-all duration-300 hover:scale-105 active:scale-95"
              >
                <HardDrive className="h-4 w-4" />
                <span>
                  {offlineMovieIds?.has(activeMovie.id) ? 'Saved on Drive' : 'Download to Local Drive'}
                </span>
              </button>
            )}

            <button
              onClick={handleWatchTrailer}
              id="hero-watch-trailer-btn"
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 px-4 py-3.5 text-sm font-semibold text-slate-200 backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Trailer</span>
              <span className="text-xs font-normal text-slate-400">({activeMovie.trailerDuration})</span>
            </button>

            <button
              onClick={handleToggleWatchlist}
              id="hero-watchlist-btn"
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-3.5 text-sm font-semibold backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-95 ${
                inWatchlist
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                  : 'bg-black/40 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Bookmark className={`h-4 w-4 ${inWatchlist ? 'fill-current' : ''}`} />
              <span>{inWatchlist ? 'Saved' : 'Watchlist'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: 3D Floating Interactive Film Reel Cards */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Featured Premieres ({currentIndex + 1}/{featuredMovies.length})
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={prevSlide}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/80 text-slate-300 border border-slate-800 hover:bg-amber-500 hover:text-slate-950 transition-colors"
                aria-label="Previous featured trailer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={nextSlide}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/80 text-slate-300 border border-slate-800 hover:bg-amber-500 hover:text-slate-950 transition-colors"
                aria-label="Next featured trailer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Film Strip Thumbnails */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
            {featuredMovies.map((movie, idx) => {
              const isActive = idx === currentIndex;
              return (
                <div
                  key={movie.id}
                  onClick={() => goToSlide(idx)}
                  className={`relative flex items-center gap-4 rounded-xl p-2.5 transition-all duration-300 cursor-pointer border backdrop-blur-md ${
                    isActive
                      ? 'bg-slate-900/90 border-amber-500/80 shadow-lg shadow-amber-500/20 translate-x-1.5'
                      : 'bg-slate-950/50 border-slate-800/80 hover:bg-slate-900/60 hover:border-slate-700'
                  }`}
                >
                  <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg">
                    <img
                      src={movie.backdropUrl}
                      alt={movie.title}
                      className="h-full w-full object-cover object-center"
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <Play className="h-4 w-4 text-white fill-white/80" />
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-amber-400">
                        ★ {movie.rating}
                      </span>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                        {movie.genres[0]}
                      </span>
                    </div>
                    <h4 className="font-cinzel text-sm font-bold text-white truncate">
                      {movie.title}
                    </h4>
                    <p className="text-xs text-slate-400 truncate">
                      {movie.tagline}
                    </p>
                  </div>

                  {isActive && (
                    <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse shrink-0 mr-2" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Auto-Slide Progress Indicators */}
          <div className="flex items-center gap-1.5 mt-2">
            {featuredMovies.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goToSlide(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentIndex
                    ? 'w-8 bg-amber-400'
                    : 'w-2 bg-slate-700 hover:bg-slate-500'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
