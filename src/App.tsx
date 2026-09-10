import { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { ThreeParallaxCanvas } from './components/ThreeParallaxCanvas';
import { Hero3DSpotlight } from './components/Hero3DSpotlight';
import { RecommendationEnginePanel } from './components/RecommendationEnginePanel';
import { SearchAndFilters } from './components/SearchAndFilters';
import { Movie3DCard } from './components/Movie3DCard';
import { MovieShelf } from './components/MovieShelf';
import { TrailerModal } from './components/TrailerModal';
import { WatchlistModal } from './components/WatchlistModal';
import { DownloadModal } from './components/DownloadModal';
import { LocalDriveManagerModal } from './components/LocalDriveManagerModal';
import { MOVIES_DATABASE } from './data/movies';
import { Movie, ViewingHistoryItem, Genre, DownloadTask, OfflineSavedMovie } from './types';
import {
  getViewingHistory,
  recordMovieWatched,
  toggleMovieLike,
  toggleWatchlist,
  rateMovie,
  getPersonalizedRecommendations,
  getBecauseYouWatchedCluster,
  clearHistory,
} from './utils/recommendationEngine';
import {
  getStoredDownloadTasks,
  getStoredOfflineMovies,
  subscribeToDownloads,
} from './utils/downloadManager';
import { soundFx } from './utils/soundEffects';
import { Sparkles, Film, Flame, Ghost, Clapperboard, Compass, Heart, Bookmark, HardDrive, Tv, WifiOff } from 'lucide-react';

export default function App() {
  const [history, setHistory] = useState<ViewingHistoryItem[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All Genres');
  const [sortBy, setSortBy] = useState('recommended');
  const [isWatchlistOpen, setIsWatchlistOpen] = useState(false);
  
  // Local Drive & Full Movie Player States
  const [downloadModalMovie, setDownloadModalMovie] = useState<Movie | null>(null);
  const [isLocalDriveManagerOpen, setIsLocalDriveManagerOpen] = useState(false);
  const [downloadTasks, setDownloadTasks] = useState<DownloadTask[]>([]);
  const [offlineMovies, setOfflineMovies] = useState<OfflineSavedMovie[]>([]);
  const [playerInitialMode, setPlayerInitialMode] = useState<'full' | 'trailer'>('full');

  // Initialize history & download manager from localStorage
  useEffect(() => {
    const loadedHistory = getViewingHistory();
    setHistory(loadedHistory);

    setDownloadTasks(getStoredDownloadTasks());
    setOfflineMovies(getStoredOfflineMovies());

    const unsubscribe = subscribeToDownloads((tasks, offline) => {
      setDownloadTasks(tasks);
      setOfflineMovies(offline);
    });

    const handleStorageUpdate = () => {
      setHistory(getViewingHistory());
    };
    window.addEventListener('cineverse_history_updated', handleStorageUpdate);
    return () => {
      unsubscribe();
      window.removeEventListener('cineverse_history_updated', handleStorageUpdate);
    };
  }, []);

  // Featured Spotlight Movies (First 4 featured)
  const featuredMovies = useMemo(() => {
    return MOVIES_DATABASE.filter(m => m.featured);
  }, []);

  // Compute Personalized Recommendations
  const personalizedRecommendations = useMemo(() => {
    return getPersonalizedRecommendations(history, MOVIES_DATABASE);
  }, [history]);

  // Compute "Because You Watched" Cluster
  const becauseYouWatched = useMemo(() => {
    return getBecauseYouWatchedCluster(history, MOVIES_DATABASE);
  }, [history]);

  // Watchlist IDs
  const watchlistIds = useMemo(() => {
    return history.filter(h => h.watchlist).map(h => h.movieId);
  }, [history]);

  // Offline Movie IDs set for instant lookup
  const offlineMovieIds = useMemo(() => {
    return new Set(offlineMovies.map(o => o.movieId));
  }, [offlineMovies]);

  // Active downloads count
  const activeDownloadCount = useMemo(() => {
    return downloadTasks.filter(t => t.status === 'downloading' || t.status === 'saving').length;
  }, [downloadTasks]);

  // Movies saved on local drive mapped to Movie objects
  const offlineFullMovies = useMemo(() => {
    const movieMap = new Map(MOVIES_DATABASE.map(m => [m.id, m]));
    return offlineMovies
      .map(o => movieMap.get(o.movieId))
      .filter((m): m is Movie => !!m);
  }, [offlineMovies]);

  // Full feature length films available for cinema streaming & drive download
  const fullCinemaMovies = useMemo(() => {
    return MOVIES_DATABASE.filter(m => m.fullMovieAvailable);
  }, []);

  // Handle User Interactions
  const handleSelectMovie = (movie: Movie) => {
    setPlayerInitialMode(movie.fullMovieAvailable ? 'full' : 'trailer');
    setSelectedMovie(movie);
  };

  const handleWatchFullMovie = (movie: Movie) => {
    setPlayerInitialMode('full');
    setSelectedMovie(movie);
  };

  const handleWatchTrailerOnly = (movie: Movie) => {
    setPlayerInitialMode('trailer');
    setSelectedMovie(movie);
  };

  const handleOpenDownloadModal = (movie: Movie) => {
    setDownloadModalMovie(movie);
  };

  const handleMarkWatched = (movieId: string) => {
    const updated = recordMovieWatched(movieId);
    setHistory([...updated]);
  };

  const handleToggleLike = (movieId: string) => {
    const { history: updated } = toggleMovieLike(movieId);
    setHistory([...updated]);
  };

  const handleToggleWatchlist = (movieId: string) => {
    const { history: updated } = toggleWatchlist(movieId);
    setHistory([...updated]);
  };

  const handleRateMovie = (movieId: string, rating: number) => {
    const updated = rateMovie(movieId, rating);
    setHistory([...updated]);
  };

  const handleClearHistory = () => {
    clearHistory();
    setHistory([]);
  };

  const handleFocusSearch = () => {
    const input = document.getElementById('movie-search-input');
    input?.focus();
    input?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // Filter and Sort Movies for the Main Grid
  const filteredMovies = useMemo(() => {
    let list = [...MOVIES_DATABASE];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(m =>
        m.title.toLowerCase().includes(q) ||
        m.genres.some(g => g.toLowerCase().includes(q)) ||
        m.director.toLowerCase().includes(q) ||
        m.cast.some(c => c.toLowerCase().includes(q)) ||
        m.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    // Genre filter
    if (selectedGenre === 'For You (AI Match)') {
      // Re-ordered by AI recommendation match
      const recMap = new Map(personalizedRecommendations.map(r => [r.movie.id, r]));
      return personalizedRecommendations.map(r => r.movie);
    } else if (selectedGenre === 'Upcoming Trailers') {
      list = list.filter(m => m.status === 'upcoming');
    } else if (selectedGenre === 'Classics') {
      list = list.filter(m => m.status === 'classic');
    } else if (selectedGenre !== 'All Genres') {
      list = list.filter(m => m.genres.includes(selectedGenre as Genre));
    }

    // Sorting
    const recMap = new Map<string, number>(personalizedRecommendations.map(r => [r.movie.id, r.matchPercentage]));
    list.sort((a, b) => {
      if (sortBy === 'recommended') {
        const scoreA = Number(recMap.get(a.id) ?? 50);
        const scoreB = Number(recMap.get(b.id) ?? 50);
        return scoreB - scoreA;
      }
      if (sortBy === 'rating') {
        return b.rating - a.rating;
      }
      if (sortBy === 'year-desc') {
        return b.releaseYear - a.releaseYear;
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

    return list;
  }, [searchQuery, selectedGenre, sortBy, personalizedRecommendations]);

  // Categorized Shelves for standard browsing
  const upcomingMovies = useMemo(() => {
    return MOVIES_DATABASE.filter(m => m.status === 'upcoming');
  }, []);

  const actionAdventureMovies = useMemo(() => {
    return MOVIES_DATABASE.filter(m => m.genres.includes('Action') || m.genres.includes('Adventure'));
  }, []);

  const horrorThrillerMovies = useMemo(() => {
    return MOVIES_DATABASE.filter(m => m.genres.includes('Horror') || m.genres.includes('Thriller'));
  }, []);

  const comedyAnimationMovies = useMemo(() => {
    return MOVIES_DATABASE.filter(m => m.genres.includes('Comedy') || m.genres.includes('Animation'));
  }, []);

  return (
    <div className="relative min-h-screen bg-[#05070d] text-slate-100 selection:bg-amber-500/30 selection:text-amber-200">
      
      {/* 3D WebGL Particle & Torus Parallax Canvas */}
      <ThreeParallaxCanvas />

      {/* Navigation Bar */}
      <Navbar
        watchlistCount={watchlistIds.length}
        onOpenWatchlist={() => setIsWatchlistOpen(true)}
        onFocusSearch={handleFocusSearch}
        onSelectGenre={genre => setSelectedGenre(genre)}
        onOpenLocalDriveManager={() => setIsLocalDriveManagerOpen(true)}
        activeDownloadCount={activeDownloadCount}
        offlineMovieCount={offlineMovies.length}
      />

      {/* Hero 3D Spotlight Carousel */}
      <Hero3DSpotlight
        featuredMovies={featuredMovies}
        onPlayTrailer={handleWatchTrailerOnly}
        onWatchFullMovie={handleWatchFullMovie}
        onOpenDownloadModal={handleOpenDownloadModal}
        onToggleWatchlist={handleToggleWatchlist}
        watchlist={watchlistIds}
        offlineMovieIds={offlineMovieIds}
      />

      {/* AI Recommendation Engine Live Control Panel */}
      <RecommendationEnginePanel
        history={history}
        allMovies={MOVIES_DATABASE}
        onHistoryUpdated={() => setHistory(getViewingHistory())}
        onSelectMovie={handleSelectMovie}
      />

      {/* Search & Real-Time Genre Filter Bar */}
      <SearchAndFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedGenre={selectedGenre}
        onGenreSelect={setSelectedGenre}
        sortBy={sortBy}
        onSortChange={setSortBy}
        allMovies={MOVIES_DATABASE}
        onSelectMovie={handleSelectMovie}
        totalCount={filteredMovies.length}
      />

      {/* Main Movie Shelves & Grid */}
      <main className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pb-24" id="trailers-grid">
        
        {/* Offline Saved Movies Shelf on Local Drive */}
        {!searchQuery && selectedGenre === 'All Genres' && offlineFullMovies.length > 0 && (
          <div className="mb-8 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 p-6 backdrop-blur-xl">
            <MovieShelf
              title="Saved on Your Local Drive Device"
              subtitle="Stored on your local hard drive. Ready for offline high-fidelity playback without buffering."
              movies={offlineFullMovies}
              onSelectMovie={handleWatchFullMovie}
              history={history}
              onToggleLike={handleToggleLike}
              onToggleWatchlist={handleToggleWatchlist}
              onOpenDownloadModal={handleOpenDownloadModal}
              offlineMovieIds={offlineMovieIds}
              icon={<HardDrive className="h-5 w-5 text-emerald-400" />}
              badgeText={`${offlineFullMovies.length} Saved Offline`}
            />
          </div>
        )}

        {/* Dynamic "Because You Watched" Cluster (If user has watched something and not currently searching) */}
        {!searchQuery && selectedGenre === 'All Genres' && becauseYouWatched && (
          <div className="mb-6 rounded-2xl bg-slate-900/60 border border-amber-500/20 p-6 backdrop-blur-xl">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Personalized Recommendation Cluster
              </span>
            </div>
            <MovieShelf
              title={`Because You Watched "${becauseYouWatched.sourceMovie.title}"`}
              subtitle={`Curated matches matching ${becauseYouWatched.sourceMovie.genres.join(', ')} directed by ${becauseYouWatched.sourceMovie.director}`}
              movies={becauseYouWatched.recommendations}
              onSelectMovie={handleSelectMovie}
              history={history}
              onToggleLike={handleToggleLike}
              onToggleWatchlist={handleToggleWatchlist}
              onOpenDownloadModal={handleOpenDownloadModal}
              offlineMovieIds={offlineMovieIds}
              badgeText="Dynamic Match"
            />
          </div>
        )}

        {/* 4K Full Movies Shelf (Stream & Download) */}
        {!searchQuery && selectedGenre === 'All Genres' && (
          <div className="mb-8 rounded-2xl bg-gradient-to-r from-amber-950/20 via-slate-900/40 to-amber-950/20 border border-amber-500/30 p-6 backdrop-blur-xl">
            <MovieShelf
              title="Watch Full Movies & Download to Local Drive"
              subtitle="Full feature-length cinematic releases. Stream instantly in 4K or save directly to your computer's local drive device."
              movies={fullCinemaMovies}
              onSelectMovie={handleWatchFullMovie}
              history={history}
              onToggleLike={handleToggleLike}
              onToggleWatchlist={handleToggleWatchlist}
              onOpenDownloadModal={handleOpenDownloadModal}
              offlineMovieIds={offlineMovieIds}
              icon={<Tv className="h-5 w-5 text-amber-400" />}
              badgeText="4K Full Movies"
            />
          </div>
        )}

        {/* Primary Filtered Grid */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-cinzel text-2xl sm:text-3xl font-extrabold text-white tracking-wide flex items-center gap-3">
                <span>{selectedGenre === 'All Genres' ? 'All Masterpiece Cinema & Trailers' : selectedGenre}</span>
                {selectedGenre === 'For You (AI Match)' && (
                  <span className="rounded-full bg-amber-500/20 border border-amber-500/40 px-3 py-0.5 text-xs font-bold text-amber-300">
                    Ranked by Viewing History
                  </span>
                )}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                {selectedGenre === 'For You (AI Match)'
                  ? 'Trailers & full films sorted specifically to your personal taste profile and interactions.'
                  : 'Hover for interactive 3D perspective depth tilt. Click to stream full movie, watch trailer, or download.'}
              </p>
            </div>
          </div>

          {filteredMovies.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
              {filteredMovies.map(movie => {
                const rec = personalizedRecommendations.find(r => r.movie.id === movie.id);
                const userHistory = history.find(h => h.movieId === movie.id);

                return (
                  <Movie3DCard
                    key={movie.id}
                    movie={movie}
                    onSelect={handleSelectMovie}
                    matchPercentage={rec?.matchPercentage}
                    matchReasons={rec?.reasons}
                    isLiked={!!userHistory?.liked}
                    onToggleLike={handleToggleLike}
                    inWatchlist={!!userHistory?.watchlist}
                    onToggleWatchlist={handleToggleWatchlist}
                    onOpenDownloadModal={handleOpenDownloadModal}
                    isSavedOffline={offlineMovieIds.has(movie.id)}
                  />
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl bg-slate-950/60 border border-slate-800">
              <Film className="h-12 w-12 text-slate-600 stroke-1 mb-3" />
              <h3 className="font-cinzel text-lg font-bold text-white">No Movies Match Your Search</h3>
              <p className="text-sm text-slate-400 mt-1 max-w-sm">
                We couldn't find any titles matching "{searchQuery}". Try searching for another keyword or clear filters.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedGenre('All Genres');
                }}
                className="mt-4 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-colors"
              >
                Clear Search & Filters
              </button>
            </div>
          )}
        </div>

        {/* Categorized Shelves (Only shown when not searching for specific keywords) */}
        {!searchQuery && selectedGenre === 'All Genres' && (
          <div className="mt-12 space-y-8">
            <MovieShelf
              title="Anticipated 2025 Upcoming Premieres"
              subtitle="First-look trailers hitting global theaters soon"
              movies={upcomingMovies}
              onSelectMovie={handleSelectMovie}
              history={history}
              onToggleLike={handleToggleLike}
              onToggleWatchlist={handleToggleWatchlist}
              onOpenDownloadModal={handleOpenDownloadModal}
              offlineMovieIds={offlineMovieIds}
              icon={<Film className="h-5 w-5 text-blue-400" />}
              badgeText="Upcoming"
            />

            <MovieShelf
              title="High-Octane Action & Adventures"
              subtitle="Explosive set pieces, death-defying stunts, and adrenaline rushes"
              movies={actionAdventureMovies}
              onSelectMovie={handleSelectMovie}
              history={history}
              onToggleLike={handleToggleLike}
              onToggleWatchlist={handleToggleWatchlist}
              onOpenDownloadModal={handleOpenDownloadModal}
              offlineMovieIds={offlineMovieIds}
              icon={<Flame className="h-5 w-5 text-amber-500" />}
            />

            <MovieShelf
              title="Midnight Horror & Psychological Thrillers"
              subtitle="Atmospheric dread, gothic nightmares, and mind-bending tension"
              movies={horrorThrillerMovies}
              onSelectMovie={handleSelectMovie}
              history={history}
              onToggleLike={handleToggleLike}
              onToggleWatchlist={handleToggleWatchlist}
              onOpenDownloadModal={handleOpenDownloadModal}
              offlineMovieIds={offlineMovieIds}
              icon={<Ghost className="h-5 w-5 text-purple-400" />}
            />

            <MovieShelf
              title="Clever Comedies & Award-Winning Animation"
              subtitle="Hilarious buddy dynamics, colorful multiverses, and heartfelt journeys"
              movies={comedyAnimationMovies}
              onSelectMovie={handleSelectMovie}
              history={history}
              onToggleLike={handleToggleLike}
              onToggleWatchlist={handleToggleWatchlist}
              onOpenDownloadModal={handleOpenDownloadModal}
              offlineMovieIds={offlineMovieIds}
              icon={<Sparkles className="h-5 w-5 text-emerald-400" />}
            />
          </div>
        )}

      </main>

      {/* Trailer & Full Movie Theater Lightbox Modal */}
      {selectedMovie && (
        <TrailerModal
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
          onSelectMovie={handleSelectMovie}
          allMovies={MOVIES_DATABASE}
          historyItem={history.find(h => h.movieId === selectedMovie.id)}
          onToggleLike={handleToggleLike}
          onToggleWatchlist={handleToggleWatchlist}
          onRateMovie={handleRateMovie}
          onMarkWatched={handleMarkWatched}
          onOpenDownloadModal={handleOpenDownloadModal}
          isSavedOffline={offlineMovieIds.has(selectedMovie.id)}
          initialMode={playerInitialMode}
        />
      )}

      {/* Download to Local Drive Modal */}
      {downloadModalMovie && (
        <DownloadModal
          movie={downloadModalMovie}
          isOpen={!!downloadModalMovie}
          onClose={() => setDownloadModalMovie(null)}
          activeTasks={downloadTasks}
          onOpenCinemaPlayer={handleWatchFullMovie}
          onOpenDriveManager={() => {
            setDownloadModalMovie(null);
            setIsLocalDriveManagerOpen(true);
          }}
        />
      )}

      {/* Local Drive & Downloads Manager Modal */}
      <LocalDriveManagerModal
        isOpen={isLocalDriveManagerOpen}
        onClose={() => setIsLocalDriveManagerOpen(false)}
        tasks={downloadTasks}
        offlineMovies={offlineMovies}
        allMovies={MOVIES_DATABASE}
        onPlayMovie={movie => {
          setIsLocalDriveManagerOpen(false);
          handleWatchFullMovie(movie);
        }}
        onOpenDownloadModal={movie => {
          setIsLocalDriveManagerOpen(false);
          handleOpenDownloadModal(movie);
        }}
      />

      {/* Watchlist & History Drawer */}
      <WatchlistModal
        isOpen={isWatchlistOpen}
        onClose={() => setIsWatchlistOpen(false)}
        history={history}
        allMovies={MOVIES_DATABASE}
        onSelectMovie={handleSelectMovie}
        onToggleWatchlist={handleToggleWatchlist}
        onClearHistory={handleClearHistory}
      />

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-[#05070d]/95 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500 text-slate-950 font-bold">
              <Clapperboard className="h-5 w-5" />
            </div>
            <div>
              <div className="font-cinzel text-base font-bold text-white tracking-wider">
                CINE<span className="text-amber-400">VERSE</span> 3D
              </div>
              <div className="text-xs text-slate-500">
                Immersive 3D Movie Trailer & Recommendation Experience
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-400 flex flex-wrap items-center gap-4">
            <span>Powered by WebGL 3D & Vector Affinity Engine</span>
            <span>•</span>
            <button
              onClick={handleClearHistory}
              className="text-slate-400 hover:text-amber-400 transition-colors"
            >
              Reset Viewing History
            </button>
            <span>•</span>
            <span>Official High Definition 4K Trailers</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
