import { useState, useEffect } from 'react';
import { Film, Volume2, VolumeX, Bookmark, Search, Sparkles, Clapperboard, HardDrive, ArrowDownToLine } from 'lucide-react';
import { soundFx } from '../utils/soundEffects';

interface NavbarProps {
  watchlistCount: number;
  onOpenWatchlist: () => void;
  onFocusSearch: () => void;
  onSelectGenre: (genre: string) => void;
  onOpenLocalDriveManager?: () => void;
  activeDownloadCount?: number;
  offlineMovieCount?: number;
}

export function Navbar({
  watchlistCount,
  onOpenWatchlist,
  onFocusSearch,
  onSelectGenre,
  onOpenLocalDriveManager,
  activeDownloadCount = 0,
  offlineMovieCount = 0,
}: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMuted, setIsMuted] = useState(soundFx.isMuted);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleToggleAudio = () => {
    const nextMuted = soundFx.toggleMute();
    setIsMuted(nextMuted);
  };

  return (
    <header
      className={`fixed top-0 inset-x-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#05070d]/90 backdrop-blur-xl border-b border-slate-800/80 py-3 shadow-2xl'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand Logo */}
        <a
          href="#"
          onClick={() => soundFx.playWhoosh()}
          className="flex items-center gap-2.5 group"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 shadow-lg shadow-amber-500/30 group-hover:scale-105 transition-transform">
            <Clapperboard className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-cinzel text-lg sm:text-xl font-black text-white tracking-widest">
                CINE<span className="text-amber-400">VERSE</span>
              </span>
              <span className="rounded bg-amber-500/20 px-1.5 py-0.2 text-[10px] font-bold text-amber-300 border border-amber-500/30">
                3D
              </span>
            </div>
            <span className="text-[10px] tracking-widest text-slate-400 uppercase font-mono hidden sm:inline">
              Cinema & Trailer Experience
            </span>
          </div>
        </a>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs sm:text-sm font-semibold text-slate-300">
          <a
            href="#hero-spotlight"
            onClick={() => soundFx.playWhoosh()}
            className="hover:text-amber-400 transition-colors"
          >
            Spotlight
          </a>
          <button
            onClick={() => {
              soundFx.playWhoosh();
              onSelectGenre('For You (AI Match)');
              document.getElementById('trailers-grid')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI Recommendations</span>
          </button>
          <button
            onClick={() => {
              soundFx.playWhoosh();
              onSelectGenre('Upcoming Trailers');
              document.getElementById('trailers-grid')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="hover:text-amber-400 transition-colors"
          >
            Upcoming
          </button>
          <button
            onClick={() => {
              soundFx.playWhoosh();
              onSelectGenre('All Genres');
              document.getElementById('trailers-grid')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="hover:text-amber-400 transition-colors"
          >
            Explore All
          </button>
        </nav>

        {/* Right Action Icons */}
        <div className="flex items-center gap-2.5">
          {/* Audio Synthesizer Mute Toggle */}
          <button
            onClick={handleToggleAudio}
            title={isMuted ? 'Unmute Cinematic Audio Effects' : 'Mute Cinematic Audio Effects'}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900/80 text-slate-300 border border-slate-800 hover:border-amber-500/50 hover:text-amber-300 transition-all"
            aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4 text-amber-400" />}
          </button>

          {/* Search Trigger */}
          <button
            onClick={() => {
              soundFx.playWhoosh();
              onFocusSearch();
            }}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900/80 text-slate-300 border border-slate-800 hover:border-amber-500/50 hover:text-amber-300 transition-all"
            aria-label="Search trailers"
          >
            <Search className="h-4 w-4" />
          </button>

          {/* Local Drive & Downloads Manager Trigger */}
          {onOpenLocalDriveManager && (
            <button
              onClick={() => {
                soundFx.playWhoosh();
                onOpenLocalDriveManager();
              }}
              id="navbar-local-drive-btn"
              className="relative flex items-center gap-2 rounded-xl bg-slate-900/90 border border-slate-700 hover:border-amber-500/60 hover:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 transition-all"
              title="Open Local Drive Device Manager & Downloads"
            >
              <HardDrive className={`h-4 w-4 ${activeDownloadCount > 0 ? 'text-amber-400 animate-bounce' : 'text-slate-400'}`} />
              <span className="hidden sm:inline">Local Drive</span>
              {(activeDownloadCount > 0 || offlineMovieCount > 0) && (
                <span className={`flex h-5 items-center justify-center rounded-full px-1.5 text-[10px] font-extrabold ${
                  activeDownloadCount > 0
                    ? 'bg-amber-500 text-slate-950 animate-pulse'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                }`}>
                  {activeDownloadCount > 0 ? `↓${activeDownloadCount}` : offlineMovieCount}
                </span>
              )}
            </button>
          )}

          {/* Watchlist Trigger with Counter Badge */}
          <button
            onClick={() => {
              soundFx.playWhoosh();
              onOpenWatchlist();
            }}
            id="navbar-watchlist-btn"
            className="relative flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition-all"
          >
            <Bookmark className="h-4 w-4 fill-amber-400/20" />
            <span className="hidden sm:inline">Watchlist</span>
            {watchlistCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-extrabold text-slate-950">
                {watchlistCount}
              </span>
            )}
          </button>
        </div>

      </div>
    </header>
  );
}
