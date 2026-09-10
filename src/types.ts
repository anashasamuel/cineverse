export type Genre = 
  | 'Action' 
  | 'Adventure' 
  | 'Horror' 
  | 'Comedy' 
  | 'Sci-Fi' 
  | 'Drama' 
  | 'Thriller' 
  | 'Animation'
  | 'Fantasy'
  | 'Crime';

export type MovieStatus = 'upcoming' | 'released' | 'classic';

export interface Movie {
  id: string;
  title: string;
  tagline: string;
  synopsis: string;
  genres: Genre[];
  releaseYear: number;
  releaseDateText: string;
  status: MovieStatus;
  rating: number; // 0-10
  reviewCount: string;
  duration: string;
  director: string;
  cast: string[];
  backdropUrl: string;
  posterUrl: string;
  youtubeTrailerId: string;
  accentColor: string; // Hex color for 3D glow & accents
  tags: string[];
  maturityRating: 'PG' | 'PG-13' | 'R' | 'G';
  featured?: boolean;
  trailerDuration: string;
  fullMovieAvailable: boolean;
  fullMovieVideoUrl?: string; // Direct streamable MP4 or HLS
  fullMovieEmbedUrl?: string; // Full feature stream
  downloadOptions: MovieDownloadOption[];
}

export interface MovieDownloadOption {
  quality: '4K Ultra HD' | '1080p Full HD' | '720p HD';
  resolution: string;
  format: 'mp4' | 'mkv' | 'webm';
  sizeMb: number;
  audioTrack: string;
  hasHDR: boolean;
  fileUrl: string;
}

export interface DownloadTask {
  id: string;
  movieId: string;
  movieTitle: string;
  posterUrl: string;
  quality: string;
  format: string;
  resolution: string;
  sizeMb: number;
  downloadedMb: number;
  progress: number; // 0 - 100
  speedMbps: number;
  etaSeconds: number;
  status: 'downloading' | 'completed' | 'paused' | 'cancelled';
  startedAt: number;
  completedAt?: number;
  savedToDriveName: string;
  localBlobUrl?: string;
}

export interface OfflineSavedMovie {
  movieId: string;
  movieTitle: string;
  quality: string;
  format: string;
  sizeMb: number;
  savedAt: number;
  storageType: 'Local Drive Device' | 'IndexedDB Cache';
  drivePath?: string;
  playableUrl: string;
}

export interface ViewingHistoryItem {
  movieId: string;
  watchedAt: number;
  viewCount: number;
  liked?: boolean;
  watchlist?: boolean;
  userScore?: number; // 1-5
}

export interface RecommendationResult {
  movie: Movie;
  matchPercentage: number;
  reasons: string[];
  matchedGenres: Genre[];
}

export interface TasteProfile {
  name: string;
  description: string;
  favoriteGenres: Genre[];
  icon: string;
}
