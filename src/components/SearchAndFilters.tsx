import { useState, useRef, useEffect } from 'react';
import { Search, X, SlidersHorizontal, Sparkles, Film, Star, Play } from 'lucide-react';
import { Movie, Genre } from '../types';
import { soundFx } from '../utils/soundEffects';

interface SearchAndFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedGenre: string;
  onGenreSelect: (genre: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  allMovies: Movie[];
  onSelectMovie: (movie: Movie) => void;
  totalCount: number;
}

const GENRE_FILTERS = [
  'All Genres',
  'For You (AI Match)',
  'Upcoming Trailers',
  'Action',
  'Adventure',
  'Horror',
  'Comedy',
  'Sci-Fi',
  'Thriller',
  'Animation',
  'Drama',
  'Classics',
];

export function SearchAndFilters({
  searchQuery,
  onSearchChange,
  selectedGenre,
  onGenreSelect,
  sortBy,
  onSortChange,
  allMovies,
  onSelectMovie,
  totalCount,
}: SearchAndFiltersProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut '/' or 'cmd+k'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key === 'k')) && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter for instant live search dropdown preview
  const liveResults = searchQuery.trim().length > 0
    ? allMovies.filter(movie => {
        const query = searchQuery.toLowerCase();
        return (
          movie.title.toLowerCase().includes(query) ||
          movie.genres.some(g => g.toLowerCase().includes(query)) ||
          movie.director.toLowerCase().includes(query) ||
          movie.cast.some(c => c.toLowerCase().includes(query)) ||
          movie.tags.some(t => t.toLowerCase().includes(query))
        );
      }).slice(0, 5)
    : [];

  return (
    <div className="relative z-30 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 pb-4" id="search-filter-section">
      
      {/* Search Input Bar */}
      <div className="relative flex flex-col md:flex-row items-stretch md:items-center gap-4">
        <div className="relative flex-1">
          <div
            className={`relative flex items-center rounded-2xl bg-slate-900/90 border transition-all duration-300 backdrop-blur-xl ${
              isFocused
                ? 'border-amber-500 shadow-lg shadow-amber-500/20 ring-2 ring-amber-500/20'
                : 'border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="pl-4 pr-2 text-slate-400">
              <Search className="h-5 w-5" />
            </div>

            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 200)}
              placeholder="Search trailers by title, genre, director (e.g. Nolan, Dune, Horror)..."
              className="w-full bg-transparent py-3.5 pr-10 text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none"
              id="movie-search-input"
            />

            {searchQuery ? (
              <button
                onClick={() => {
                  onSearchChange('');
                  inputRef.current?.focus();
                }}
                className="pr-4 text-slate-400 hover:text-white transition-colors"
                aria-label="Clear search query"
              >
                <X className="h-5 w-5" />
              </button>
            ) : (
              <div className="hidden sm:flex items-center pr-4">
                <kbd className="rounded border border-slate-700 bg-slate-800/80 px-2 py-0.5 text-[11px] font-mono text-slate-400">
                  /
                </kbd>
              </div>
            )}
          </div>

          {/* Real-time Interactive Search Dropdown Popover */}
          {isFocused && liveResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl bg-[#090d16]/95 backdrop-blur-2xl border border-slate-800 shadow-2xl p-2 z-50 overflow-hidden">
              <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-800/60 mb-1 flex items-center justify-between">
                <span>Instant Matches</span>
                <span>{liveResults.length} trailers found</span>
              </div>
              <div className="space-y-1">
                {liveResults.map(movie => (
                  <div
                    key={movie.id}
                    onMouseDown={() => {
                      soundFx.playCinematicHit();
                      onSelectMovie(movie);
                    }}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800/80 transition-colors cursor-pointer group"
                  >
                    <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-950">
                      <img
                        src={movie.backdropUrl}
                        alt={movie.title}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="h-4 w-4 text-amber-400 fill-amber-400" />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-cinzel text-sm font-bold text-white truncate group-hover:text-amber-300">
                          {movie.title}
                        </span>
                        <span className="text-[10px] text-amber-400 font-semibold">
                          ★ {movie.rating}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 truncate flex items-center gap-2">
                        <span>{movie.releaseYear}</span>
                        <span>•</span>
                        <span>{movie.genres.join(', ')}</span>
                        <span>•</span>
                        <span className="text-slate-500">{movie.director}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-2xl bg-slate-900/90 border border-slate-800 px-3.5 py-3 text-xs sm:text-sm text-slate-300 backdrop-blur-xl">
            <SlidersHorizontal className="h-4 w-4 text-amber-400 shrink-0" />
            <span className="text-slate-500 font-medium hidden sm:inline">Sort:</span>
            <select
              value={sortBy}
              onChange={e => {
                soundFx.playWhoosh();
                onSortChange(e.target.value);
              }}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
              id="sort-select"
            >
              <option value="recommended" className="bg-slate-900 text-white">Recommended For You</option>
              <option value="rating" className="bg-slate-900 text-white">Highest Rated</option>
              <option value="year-desc" className="bg-slate-900 text-white">Release Date (Newest)</option>
              <option value="title" className="bg-slate-900 text-white">Title (A - Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Genre Filter Chips Ribbon */}
      <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-2 pt-1 no-scrollbar">
        {GENRE_FILTERS.map(genre => {
          const isSelected = selectedGenre === genre;
          const isAi = genre.includes('For You');
          const isUpcoming = genre.includes('Upcoming');

          return (
            <button
              key={genre}
              onClick={() => {
                soundFx.playWhoosh();
                onGenreSelect(genre);
              }}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-200 cursor-pointer border ${
                isSelected
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20 font-bold scale-105'
                  : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800 hover:border-slate-700'
              }`}
            >
              {isAi && <Sparkles className={`h-3.5 w-3.5 ${isSelected ? 'text-slate-950' : 'text-amber-400'}`} />}
              {isUpcoming && <Film className={`h-3.5 w-3.5 ${isSelected ? 'text-slate-950' : 'text-blue-400'}`} />}
              <span>{genre}</span>
            </button>
          );
        })}
      </div>

      {/* Results summary counter */}
      <div className="mt-2 flex items-center justify-between text-xs text-slate-400 px-1">
        <span>
          Showing <strong className="text-white font-semibold">{totalCount}</strong> cinematic trailer{totalCount !== 1 ? 's' : ''}
          {selectedGenre !== 'All Genres' && ` in ${selectedGenre}`}
        </span>
        {searchQuery && (
          <span>
            Search results for "<strong className="text-amber-300">{searchQuery}</strong>"
          </span>
        )}
      </div>

    </div>
  );
}
