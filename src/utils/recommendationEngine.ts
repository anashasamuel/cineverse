import { Movie, ViewingHistoryItem, RecommendationResult, Genre, TasteProfile } from '../types';

const STORAGE_KEY = 'cineverse_viewing_history_v1';

export function getViewingHistory(): ViewingHistoryItem[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      // Default initial mock seed so first-time visitors immediately experience personalized recommendations!
      const initialSeed: ViewingHistoryItem[] = [
        { movieId: 'dune-part-two', watchedAt: Date.now() - 3600000 * 24 * 2, viewCount: 2, liked: true, userScore: 5 },
        { movieId: 'interstellar', watchedAt: Date.now() - 3600000 * 24 * 5, viewCount: 1, liked: true, userScore: 5 },
        { movieId: 'spider-man-across-spider-verse', watchedAt: Date.now() - 3600000 * 24 * 7, viewCount: 1, watchlist: true },
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialSeed));
      return initialSeed;
    }
    return JSON.parse(saved);
  } catch {
    return [];
  }
}

export function saveViewingHistory(history: ViewingHistoryItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    window.dispatchEvent(new Event('cineverse_history_updated'));
  } catch (e) {
    console.error('Failed to save viewing history', e);
  }
}

export function recordMovieWatched(movieId: string): ViewingHistoryItem[] {
  const history = getViewingHistory();
  const existingIndex = history.findIndex(item => item.movieId === movieId);

  if (existingIndex >= 0) {
    history[existingIndex] = {
      ...history[existingIndex],
      watchedAt: Date.now(),
      viewCount: history[existingIndex].viewCount + 1,
    };
  } else {
    history.unshift({
      movieId,
      watchedAt: Date.now(),
      viewCount: 1,
    });
  }

  saveViewingHistory(history);
  return history;
}

export function toggleMovieLike(movieId: string): { history: ViewingHistoryItem[]; isLiked: boolean } {
  const history = getViewingHistory();
  const existingIndex = history.findIndex(item => item.movieId === movieId);
  let isLiked = false;

  if (existingIndex >= 0) {
    const current = !!history[existingIndex].liked;
    history[existingIndex].liked = !current;
    isLiked = !current;
  } else {
    history.unshift({
      movieId,
      watchedAt: Date.now(),
      viewCount: 1,
      liked: true,
    });
    isLiked = true;
  }

  saveViewingHistory(history);
  return { history, isLiked };
}

export function toggleWatchlist(movieId: string): { history: ViewingHistoryItem[]; inWatchlist: boolean } {
  const history = getViewingHistory();
  const existingIndex = history.findIndex(item => item.movieId === movieId);
  let inWatchlist = false;

  if (existingIndex >= 0) {
    const current = !!history[existingIndex].watchlist;
    history[existingIndex].watchlist = !current;
    inWatchlist = !current;
  } else {
    history.unshift({
      movieId,
      watchedAt: Date.now(),
      viewCount: 0,
      watchlist: true,
    });
    inWatchlist = true;
  }

  saveViewingHistory(history);
  return { history, inWatchlist };
}

export function rateMovie(movieId: string, userScore: number): ViewingHistoryItem[] {
  const history = getViewingHistory();
  const existingIndex = history.findIndex(item => item.movieId === movieId);

  if (existingIndex >= 0) {
    history[existingIndex].userScore = userScore;
    if (userScore >= 4) history[existingIndex].liked = true;
  } else {
    history.unshift({
      movieId,
      watchedAt: Date.now(),
      viewCount: 1,
      userScore,
      liked: userScore >= 4,
    });
  }

  saveViewingHistory(history);
  return history;
}

export function applyPresetProfile(profile: TasteProfile, allMovies: Movie[]): ViewingHistoryItem[] {
  // Find movies matching the preset taste genres
  const matching = allMovies.filter(m => 
    m.genres.some(g => profile.favoriteGenres.includes(g))
  ).slice(0, 3);

  const newHistory: ViewingHistoryItem[] = matching.map((m, idx) => ({
    movieId: m.id,
    watchedAt: Date.now() - idx * 86400000,
    viewCount: 1,
    liked: true,
    userScore: 5
  }));

  saveViewingHistory(newHistory);
  return newHistory;
}

export function clearHistory(): void {
  saveViewingHistory([]);
}

/**
 * Calculates user's genre weight vector and tag frequency based on interactions.
 */
export function calculateUserAffinity(
  history: ViewingHistoryItem[],
  movies: Movie[]
): {
  genreScores: Record<Genre, number>;
  favoriteDirectors: Set<string>;
  totalWeight: number;
} {
  const genreScores: Partial<Record<Genre, number>> = {};
  const favoriteDirectors = new Set<string>();
  let totalWeight = 0;

  const movieMap = new Map(movies.map(m => [m.id, m]));

  for (const item of history) {
    const movie = movieMap.get(item.movieId);
    if (!movie) continue;

    // Interaction weight:
    // Base watch = 2 points
    // Re-watch = +1 each
    // Liked = +4 points
    // Watchlist = +2 points
    // User rating (1-5) = userScore points
    let weight = 1 + (item.viewCount * 1.5);
    if (item.liked) weight += 4;
    if (item.watchlist) weight += 2;
    if (item.userScore) weight += item.userScore;

    totalWeight += weight;

    if (item.liked || (item.userScore && item.userScore >= 4)) {
      favoriteDirectors.add(movie.director);
    }

    for (const genre of movie.genres) {
      genreScores[genre] = (genreScores[genre] || 0) + weight;
    }
  }

  return {
    genreScores: genreScores as Record<Genre, number>,
    favoriteDirectors,
    totalWeight,
  };
}

/**
 * Recommendation Engine: Ranks all movies based on multi-factor similarity
 */
export function getPersonalizedRecommendations(
  history: ViewingHistoryItem[],
  movies: Movie[]
): RecommendationResult[] {
  const { genreScores, favoriteDirectors, totalWeight } = calculateUserAffinity(history, movies);

  const watchedIds = new Set(history.filter(h => h.viewCount > 0).map(h => h.movieId));
  const movieMap = new Map(movies.map(m => [m.id, m]));

  const results: RecommendationResult[] = [];

  // If no history yet, return top rated movies
  if (totalWeight === 0) {
    return movies.map(m => ({
      movie: m,
      matchPercentage: Math.min(99, Math.round(m.rating * 10)),
      reasons: ['Trending Blockbuster', `Critically Acclaimed (${m.rating}★)`],
      matchedGenres: m.genres
    }));
  }

  // Find max genre score for normalization
  const maxGenreScore = Math.max(...Object.values(genreScores), 1);

  for (const movie of movies) {
    let rawScore = 0;
    const reasons: string[] = [];
    const matchedGenres: Genre[] = [];

    // Genre overlap score
    for (const genre of movie.genres) {
      if (genreScores[genre]) {
        rawScore += (genreScores[genre] / maxGenreScore) * 45;
        matchedGenres.push(genre);
      }
    }

    if (matchedGenres.length > 0) {
      reasons.push(`High affinity for ${matchedGenres.slice(0, 2).join(' & ')}`);
    }

    // Director affinity
    if (favoriteDirectors.has(movie.director)) {
      rawScore += 25;
      reasons.push(`Directed by ${movie.director} (from your favorites)`);
    }

    // Quality baseline
    rawScore += (movie.rating / 10) * 20;

    // Upcoming trailer boost
    if (movie.status === 'upcoming') {
      rawScore += 5;
      reasons.push('Anticipated upcoming premiere');
    }

    // Penalize slightly if already watched multiple times so new discoveries bubble up,
    // but keep liked movies discoverable
    const userHistory = history.find(h => h.movieId === movie.id);
    if (userHistory) {
      if (userHistory.liked) {
        reasons.push('In your favorites');
      } else if (userHistory.viewCount > 1) {
        rawScore *= 0.85;
      }
    } else {
      reasons.push('Fresh trailer discovery');
    }

    // Clamp score between 55% and 99%
    const matchPercentage = Math.min(99, Math.max(58, Math.round(rawScore)));

    results.push({
      movie,
      matchPercentage,
      reasons: reasons.slice(0, 2),
      matchedGenres
    });
  }

  // Sort descending by match percentage
  results.sort((a, b) => b.matchPercentage - a.matchPercentage);

  return results;
}

/**
 * Generates "Because you watched [Movie]" clusters
 */
export function getBecauseYouWatchedCluster(
  history: ViewingHistoryItem[],
  movies: Movie[]
): { sourceMovie: Movie; recommendations: Movie[] } | null {
  const watchedItems = history.filter(h => h.viewCount > 0 || h.liked);
  if (watchedItems.length === 0) return null;

  // Pick the most recently watched or highest rated movie
  const sorted = [...watchedItems].sort((a, b) => (b.liked ? 1 : 0) - (a.liked ? 1 : 0) || b.watchedAt - a.watchedAt);
  const source = movies.find(m => m.id === sorted[0].movieId);
  if (!source) return null;

  // Find other movies sharing genres or director, excluding the source itself
  const recommendations = movies
    .filter(m => m.id !== source.id)
    .map(m => {
      let overlap = 0;
      for (const g of m.genres) {
        if (source.genres.includes(g)) overlap += 2;
      }
      if (m.director === source.director) overlap += 4;
      return { movie: m, overlap };
    })
    .filter(item => item.overlap > 0)
    .sort((a, b) => b.overlap - a.overlap)
    .slice(0, 5)
    .map(item => item.movie);

  return { sourceMovie: source, recommendations };
}
