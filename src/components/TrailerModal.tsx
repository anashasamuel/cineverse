import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Star,
  Heart,
  Bookmark,
  Check,
  Share2,
  Play,
  Sparkles,
  Clock,
  Calendar,
  User,
  Film,
  Download,
  HardDrive,
  Tv,
  CheckCircle2
} from 'lucide-react';
import { Movie, ViewingHistoryItem } from '../types';
import { soundFx } from '../utils/soundEffects';
import { CinemaPlayer } from './CinemaPlayer';

interface TrailerModalProps {
  movie: Movie | null;
  onClose: () => void;
  onSelectMovie: (movie: Movie) => void;
  allMovies: Movie[];
  historyItem?: ViewingHistoryItem;
  onToggleLike: (movieId: string) => void;
  onToggleWatchlist: (movieId: string) => void;
  onRateMovie: (movieId: string, rating: number) => void;
  onMarkWatched: (movieId: string) => void;
  onOpenDownloadModal?: (movie: Movie) => void;
  isSavedOffline?: boolean;
  initialMode?: 'full' | 'trailer';
}

export function TrailerModal({
  movie,
  onClose,
  onSelectMovie,
  allMovies,
  historyItem,
  onToggleLike,
  onToggleWatchlist,
  onRateMovie,
  onMarkWatched,
  onOpenDownloadModal,
  isSavedOffline = false,
  initialMode = 'full',
}: TrailerModalProps) {
  const [copied, setCopied] = useState(false);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [playerMode, setPlayerMode] = useState<'full' | 'trailer'>(initialMode);

  useEffect(() => {
    if (movie) {
      if (initialMode === 'full' && movie.fullMovieAvailable) {
        setPlayerMode('full');
      } else if (initialMode === 'trailer') {
        setPlayerMode('trailer');
      } else {
        setPlayerMode(movie.fullMovieAvailable ? 'full' : 'trailer');
      }
    }
  }, [movie?.id, initialMode]);

  useEffect(() => {
    if (!movie) return;

    // Automatically record watch in history on trailer open
    onMarkWatched(movie.id);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [movie?.id]);

  if (!movie) return null;

  const isLiked = !!historyItem?.liked;
  const inWatchlist = !!historyItem?.watchlist;
  const currentRating = historyItem?.userScore || 0;

  // Find related movies
  const relatedMovies = allMovies
    .filter(m => m.id !== movie.id && m.genres.some(g => movie.genres.includes(g)))
    .slice(0, 4);

  const handleShare = () => {
    soundFx.playChime();
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/90 backdrop-blur-xl"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="relative z-10 w-full max-w-5xl rounded-2xl bg-[#090d16] border border-slate-800 shadow-2xl overflow-hidden my-auto"
        >
          {/* Ambient Top Glow */}
          <div
            className="absolute top-0 inset-x-0 h-32 blur-3xl opacity-25 pointer-events-none"
            style={{ backgroundColor: movie.accentColor }}
          />

          {/* Close button */}
          <button
            onClick={() => {
              soundFx.playWhoosh();
              onClose();
            }}
            className="absolute top-4 right-4 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-slate-900/80 text-slate-300 border border-slate-700 hover:bg-amber-500 hover:text-slate-950 transition-colors shadow-lg"
            aria-label="Close trailer theater"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Cinema Mode Switcher Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-6 py-2.5 bg-slate-950 border-b border-slate-800">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={() => {
                  soundFx.playChime();
                  setPlayerMode('full');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  playerMode === 'full'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Tv className="h-3.5 w-3.5" />
                <span>Watch Full Movie (4K)</span>
              </button>

              <button
                onClick={() => {
                  soundFx.playChime();
                  setPlayerMode('trailer');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  playerMode === 'trailer'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Film className="h-3.5 w-3.5" />
                <span>Official Trailer</span>
              </button>
            </div>

            {onOpenDownloadModal && (
              <button
                onClick={() => {
                  soundFx.playWhoosh();
                  onOpenDownloadModal(movie);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all"
              >
                <HardDrive className="h-3.5 w-3.5" />
                <span>Download to Local Drive</span>
              </button>
            )}
          </div>

          {/* Video Player Section */}
          {playerMode === 'full' ? (
            <CinemaPlayer
              movie={movie}
              onOpenDownloadModal={onOpenDownloadModal || (() => {})}
              isSavedOffline={isSavedOffline}
            />
          ) : (
            <div className="relative w-full aspect-video bg-black overflow-hidden shadow-2xl">
              <iframe
                src={`https://www.youtube.com/embed/${movie.youtubeTrailerId}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1`}
                title={`${movie.title} Official Trailer`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="absolute inset-0 h-full w-full border-0"
              />
            </div>
          )}

          {/* Modal Body & Metadata */}
          <div className="p-6 sm:p-8 space-y-6">
            
            {/* Header & Quick Action Row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-0.5 text-xs font-semibold">
                    {movie.status === 'upcoming' ? 'Upcoming Trailer' : 'Official Premiere'}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {movie.duration}
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {movie.releaseDateText}
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-slate-300 border border-slate-700">
                    {movie.maturityRating}
                  </span>
                </div>

                <h2 className="font-cinzel text-2xl sm:text-3xl font-extrabold text-white">
                  {movie.title}
                </h2>
                <p className="text-sm text-amber-400/90 font-medium italic mt-1">
                  "{movie.tagline}"
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5">
                {onOpenDownloadModal && (
                  <button
                    onClick={() => {
                      soundFx.playWhoosh();
                      onOpenDownloadModal(movie);
                    }}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold px-4 py-2.5 text-sm shadow-lg shadow-amber-500/25 transition-all active:scale-95"
                  >
                    {isSavedOffline ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-slate-950" />
                        <span>Saved on Drive</span>
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 stroke-[2.5]" />
                        <span>Download to Drive</span>
                      </>
                    )}
                  </button>
                )}

                <button
                  onClick={() => {
                    soundFx.playWhoosh();
                    onToggleLike(movie.id);
                  }}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all border ${
                    isLiked
                      ? 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-600/30'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                  <span>{isLiked ? 'Liked' : 'Like'}</span>
                </button>

                <button
                  onClick={() => {
                    soundFx.playWhoosh();
                    onToggleWatchlist(movie.id);
                  }}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all border ${
                    inWatchlist
                      ? 'bg-amber-500 border-amber-400 text-slate-950 font-bold shadow-lg shadow-amber-500/30'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Bookmark className={`h-4 w-4 ${inWatchlist ? 'fill-current' : ''}`} />
                  <span>{inWatchlist ? 'Watchlist' : 'Add to List'}</span>
                </button>

                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Share2 className="h-4 w-4" />}
                  <span>{copied ? 'Link Copied!' : 'Share'}</span>
                </button>
              </div>
            </div>

            {/* User Interactive Star Rating & Watched Status */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold">
                  <Star className="h-5 w-5 fill-amber-400" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    Rate This Film
                    {currentRating > 0 && (
                      <span className="text-xs font-normal text-amber-400">
                        (You rated: {currentRating}/5)
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400">
                    Your rating instantly personalizes future movie recommendations
                  </div>
                </div>
              </div>

              {/* 5-Star Interactive Rating Selector */}
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map(star => {
                  const active = (hoverRating !== null ? star <= hoverRating : star <= currentRating);
                  return (
                    <button
                      key={star}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(null)}
                      onClick={() => {
                        soundFx.playChime();
                        onRateMovie(movie.id, star);
                      }}
                      className="p-1 text-slate-600 hover:scale-125 transition-transform"
                      aria-label={`Rate ${star} star`}
                    >
                      <Star
                        className={`h-6 w-6 transition-colors ${
                          active ? 'text-amber-400 fill-amber-400' : 'text-slate-700'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Synopsis & Film Credits Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-4">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Synopsis
                  </h4>
                  <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-light">
                    {movie.synopsis}
                  </p>
                </div>

                {/* Genre Tags */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Genres & Keywords
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {movie.genres.map(g => (
                      <span
                        key={g}
                        className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-300"
                      >
                        {g}
                      </span>
                    ))}
                    {movie.tags.map(t => (
                      <span
                        key={t}
                        className="rounded-lg bg-slate-900 border border-slate-800 px-3 py-1 text-xs text-slate-400"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar Credits */}
              <div className="rounded-xl bg-slate-950/40 p-4 border border-slate-800/80 space-y-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-1">
                    <User className="h-3.5 w-3.5" /> Director
                  </span>
                  <span className="text-sm font-semibold text-white">
                    {movie.director}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-1">
                    <Film className="h-3.5 w-3.5" /> Starring Cast
                  </span>
                  <div className="space-y-1">
                    {movie.cast.map(actor => (
                      <div key={actor} className="text-xs text-slate-300">
                        {actor}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    IMDb & Critics
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-extrabold text-amber-400">
                      ★ {movie.rating}
                    </span>
                    <span className="text-xs text-slate-400">
                      from {movie.reviewCount} reviews
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Related Trailers Carousel / Shelf */}
            {relatedMovies.length > 0 && (
              <div className="border-t border-slate-800/80 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-400" />
                    Recommended Next Trailers
                  </h4>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {relatedMovies.map(rel => (
                    <div
                      key={rel.id}
                      onClick={() => {
                        soundFx.playCinematicHit();
                        onSelectMovie(rel);
                      }}
                      className="group relative cursor-pointer overflow-hidden rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 transition-all p-2"
                    >
                      <div className="relative aspect-video w-full overflow-hidden rounded-lg mb-2">
                        <img
                          src={rel.backdropUrl}
                          alt={rel.title}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="h-4 w-4 text-amber-400 fill-amber-400" />
                        </div>
                      </div>
                      <h5 className="font-cinzel text-xs font-bold text-white truncate group-hover:text-amber-300">
                        {rel.title}
                      </h5>
                      <span className="text-[10px] text-slate-400">
                        ★ {rel.rating} • {rel.genres[0]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
