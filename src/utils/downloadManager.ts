import { DownloadTask, Movie, MovieDownloadOption, OfflineSavedMovie } from '../types';
import { soundFx } from './soundEffects';

const DOWNLOAD_STORAGE_KEY = 'cineverse_download_tasks';
const OFFLINE_MOVIES_KEY = 'cineverse_offline_movies';

// In-memory active intervals for running downloads
const activeDownloadIntervals: Record<string, number> = {};

export function getDownloadTasks(): DownloadTask[] {
  try {
    const raw = localStorage.getItem(DOWNLOAD_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveDownloadTasks(tasks: DownloadTask[]) {
  try {
    localStorage.setItem(DOWNLOAD_STORAGE_KEY, JSON.stringify(tasks));
    window.dispatchEvent(new CustomEvent('cineverse_download_updated'));
  } catch (e) {
    console.error('Failed to save download tasks', e);
  }
}

export function getOfflineSavedMovies(): OfflineSavedMovie[] {
  try {
    const raw = localStorage.getItem(OFFLINE_MOVIES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveOfflineMovies(movies: OfflineSavedMovie[]) {
  try {
    localStorage.setItem(OFFLINE_MOVIES_KEY, JSON.stringify(movies));
    window.dispatchEvent(new CustomEvent('cineverse_offline_updated'));
  } catch (e) {
    console.error('Failed to save offline movies', e);
  }
}

export const getStoredDownloadTasks = getDownloadTasks;
export const getStoredOfflineMovies = getOfflineSavedMovies;

export function subscribeToDownloads(
  callback: (tasks: DownloadTask[], offline: OfflineSavedMovie[]) => void
): () => void {
  const handler = () => {
    callback(getDownloadTasks(), getOfflineSavedMovies());
  };
  window.addEventListener('cineverse_download_updated', handler);
  window.addEventListener('cineverse_offline_updated', handler);
  return () => {
    window.removeEventListener('cineverse_download_updated', handler);
    window.removeEventListener('cineverse_offline_updated', handler);
  };
}

/**
 * Triggers native physical download of a video/file directly to the user's local drive
 */
export async function triggerLocalDriveFileDownload(
  filename: string,
  urlOrBlob: string | Blob,
  fileType: string = 'video/mp4'
): Promise<{ success: boolean; driveName: string }> {
  // 1. Try modern File System Access API for custom local drive directory selection
  const canShowSavePicker = typeof window !== 'undefined' && 'showSaveFilePicker' in window;

  if (canShowSavePicker) {
    try {
      // @ts-expect-error - File System Access API
      const fileHandle = await window.showSaveFilePicker({
        suggestedName: filename,
        types: [
          {
            description: 'Movie Video File',
            accept: {
              [fileType]: ['.mp4', '.mkv', '.webm'],
            },
          },
        ],
      });

      const writable = await fileHandle.createWritable();
      if (typeof urlOrBlob === 'string') {
        const response = await fetch(urlOrBlob, { mode: 'cors' }).catch(() => null);
        if (response && response.ok) {
          const blob = await response.blob();
          await writable.write(blob);
        } else {
          // Write metadata content if media is restricted
          const fallbackData = new Blob([`CineVerse 3D Local Drive Movie Package: ${filename}\nSource: ${urlOrBlob}`], { type: 'text/plain' });
          await writable.write(fallbackData);
        }
      } else {
        await writable.write(urlOrBlob);
      }
      await writable.close();
      return { success: true, driveName: 'Selected Local Drive Directory' };
    } catch (err: unknown) {
      // User cancelled picker or browser denied; fallback to standard anchor download
      if ((err as Error)?.name === 'AbortError') {
        return { success: false, driveName: 'Cancelled' };
      }
    }
  }

  // 2. Standard Universal Browser Local Drive Download
  try {
    const link = document.createElement('a');
    if (typeof urlOrBlob === 'string') {
      link.href = urlOrBlob;
    } else {
      link.href = URL.createObjectURL(urlOrBlob);
    }
    link.download = filename;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      if (typeof urlOrBlob !== 'string') {
        URL.revokeObjectURL(link.href);
      }
    }, 2000);
    return { success: true, driveName: 'Local Drive (Downloads Folder)' };
  } catch (error) {
    console.error('Download trigger error:', error);
    return { success: false, driveName: 'Local Drive' };
  }
}

/**
 * Downloads a companion .NFO movie collector file & Subtitles bundle directly into local drive
 */
export function downloadCompanionMetadataBundle(movie: Movie, option: MovieDownloadOption) {
  const nfoContent = `=====================================================
CINEVERSE 3D - LOCAL DRIVE CINEMA ARCHIVE
=====================================================
Title: ${movie.title} (${movie.releaseYear})
Tagline: "${movie.tagline}"
Status: ${movie.status.toUpperCase()}
Maturity: ${movie.maturityRating}
Duration: ${movie.duration}
IMDb Score: ${movie.rating}/10 (${movie.reviewCount} reviews)
Director: ${movie.director}
Cast: ${movie.cast.join(', ')}
Genres: ${movie.genres.join(', ')}
Keywords: ${movie.tags.join(', ')}

--- LOCAL DRIVE FILE SPECIFICATIONS ---
Quality: ${option.quality}
Resolution: ${option.resolution}
Format: ${option.format.toUpperCase()}
Audio: ${option.audioTrack}
HDR: ${option.hasHDR ? 'Yes (HDR10 / Dolby Vision)' : 'Standard SDR'}
Archive Size: ${option.sizeMb} MB
Download Date: ${new Date().toLocaleString()}

--- SYNOPSIS ---
${movie.synopsis}
=====================================================
Downloaded via CineVerse 3D Engine for Local Drive Playback
`;

  const blob = new Blob([nfoContent], { type: 'text/plain;charset=utf-8' });
  const filename = `${movie.title.replace(/[^a-zA-Z0-9]/g, '_')}_${movie.releaseYear}_Metadata.nfo`;
  triggerLocalDriveFileDownload(filename, blob, 'text/plain');
}

/**
 * Start a tracked download to the user's Local Drive Device
 */
export function startLocalDriveDownload(
  movie: Movie,
  option: MovieDownloadOption,
  customDriveName: string = 'Local Drive (Device Storage)',
  bundleNfo: boolean = true
): DownloadTask {
  soundFx.playDownloadStart();

  const taskId = `dl_${movie.id}_${Date.now()}`;
  const totalMb = option.sizeMb;

  const newTask: DownloadTask = {
    id: taskId,
    movieId: movie.id,
    movieTitle: movie.title,
    posterUrl: movie.posterUrl,
    quality: option.quality,
    format: option.format,
    resolution: option.resolution,
    sizeMb: totalMb,
    downloadedMb: 0,
    progress: 0,
    speedMbps: +(18 + Math.random() * 22).toFixed(1), // Realistic 18-40 MB/s speed
    etaSeconds: Math.ceil(totalMb / 25),
    status: 'downloading',
    startedAt: Date.now(),
    savedToDriveName: customDriveName,
  };

  const tasks = getDownloadTasks();
  // If this movie has another active download with the same quality, remove or cancel old one
  const filtered = tasks.filter(t => !(t.movieId === movie.id && t.quality === option.quality && t.status === 'downloading'));
  filtered.unshift(newTask);
  saveDownloadTasks(filtered);

  // If user requested metadata bundle, trigger download
  if (bundleNfo) {
    setTimeout(() => {
      downloadCompanionMetadataBundle(movie, option);
    }, 500);
  }

  // Trigger simulated progression followed by real physical local drive file delivery
  simulateDownloadProgress(taskId, movie, option);

  return newTask;
}

function simulateDownloadProgress(taskId: string, movie: Movie, option: MovieDownloadOption) {
  if (activeDownloadIntervals[taskId]) {
    clearInterval(activeDownloadIntervals[taskId]);
  }

  const interval = window.setInterval(() => {
    const all = getDownloadTasks();
    const taskIndex = all.findIndex(t => t.id === taskId);
    if (taskIndex === -1) {
      clearInterval(interval);
      return;
    }

    const currentTask = all[taskIndex];
    if (currentTask.status === 'paused') {
      return;
    }
    if (currentTask.status === 'cancelled') {
      clearInterval(interval);
      return;
    }

    // Advance download
    const stepMb = +(1.5 + Math.random() * 2.5).toFixed(1);
    const updatedDownloaded = Math.min(currentTask.sizeMb, +(currentTask.downloadedMb + stepMb).toFixed(1));
    const progress = Math.min(100, Math.round((updatedDownloaded / currentTask.sizeMb) * 100));
    const remainingMb = Math.max(0, currentTask.sizeMb - updatedDownloaded);
    const speed = +(20 + Math.random() * 15).toFixed(1);
    const eta = remainingMb > 0 ? Math.ceil(remainingMb / (speed / 8)) : 0;

    if (progress >= 100) {
      clearInterval(interval);
      delete activeDownloadIntervals[taskId];

      currentTask.progress = 100;
      currentTask.downloadedMb = currentTask.sizeMb;
      currentTask.speedMbps = 0;
      currentTask.etaSeconds = 0;
      currentTask.status = 'completed';
      currentTask.completedAt = Date.now();

      all[taskIndex] = currentTask;
      saveDownloadTasks(all);

      // Trigger the actual physical file download to the local drive device!
      const sanitizedTitle = movie.title.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `${sanitizedTitle}_${movie.releaseYear}_${option.resolution}.${option.format}`;
      triggerLocalDriveFileDownload(filename, option.fileUrl, `video/${option.format}`);

      // Save to Offline Library as well for seamless instant in-browser offline playback
      saveToOfflineLibrary(movie, option, filename);

      soundFx.playDownloadComplete();
    } else {
      currentTask.downloadedMb = updatedDownloaded;
      currentTask.progress = progress;
      currentTask.speedMbps = speed;
      currentTask.etaSeconds = eta;
      all[taskIndex] = currentTask;
      saveDownloadTasks(all);
    }
  }, 350);

  activeDownloadIntervals[taskId] = interval;
}

export function pauseDownloadTask(taskId: string) {
  const all = getDownloadTasks();
  const task = all.find(t => t.id === taskId);
  if (task && task.status === 'downloading') {
    task.status = 'paused';
    saveDownloadTasks(all);
    if (activeDownloadIntervals[taskId]) {
      clearInterval(activeDownloadIntervals[taskId]);
      delete activeDownloadIntervals[taskId];
    }
  }
}

export function resumeDownloadTask(taskId: string, movie: Movie, option: MovieDownloadOption) {
  const all = getDownloadTasks();
  const task = all.find(t => t.id === taskId);
  if (task && task.status === 'paused') {
    task.status = 'downloading';
    saveDownloadTasks(all);
    simulateDownloadProgress(taskId, movie, option);
  }
}

export function cancelDownloadTask(taskId: string) {
  if (activeDownloadIntervals[taskId]) {
    clearInterval(activeDownloadIntervals[taskId]);
    delete activeDownloadIntervals[taskId];
  }
  const all = getDownloadTasks();
  const filtered = all.filter(t => t.id !== taskId);
  saveDownloadTasks(filtered);
}

export function clearCompletedDownloads() {
  const all = getDownloadTasks();
  const remaining = all.filter(t => t.status === 'downloading' || t.status === 'paused');
  saveDownloadTasks(remaining);
}

/**
 * Saves a completed download to the device's local offline library
 */
export function saveToOfflineLibrary(
  movie: Movie,
  option: MovieDownloadOption,
  drivePath: string = 'Local Drive Device'
) {
  const offline = getOfflineSavedMovies();
  const existingIdx = offline.findIndex(m => m.movieId === movie.id);

  const newOfflineItem: OfflineSavedMovie = {
    movieId: movie.id,
    movieTitle: movie.title,
    quality: option.quality,
    format: option.format,
    sizeMb: option.sizeMb,
    savedAt: Date.now(),
    storageType: 'Local Drive Device',
    drivePath,
    playableUrl: option.fileUrl,
  };

  if (existingIdx !== -1) {
    offline[existingIdx] = newOfflineItem;
  } else {
    offline.unshift(newOfflineItem);
  }

  saveOfflineMovies(offline);
}

export function removeOfflineSavedMovie(movieId: string) {
  const offline = getOfflineSavedMovies();
  const filtered = offline.filter(m => m.movieId !== movieId);
  saveOfflineMovies(filtered);
}

export function isMovieSavedLocally(movieId: string): boolean {
  const offline = getOfflineSavedMovies();
  return offline.some(m => m.movieId === movieId);
}

export function calculateLocalDeviceStorageUsedMb(): number {
  const offline = getOfflineSavedMovies();
  return offline.reduce((acc, m) => acc + (m.sizeMb || 0), 0);
}
