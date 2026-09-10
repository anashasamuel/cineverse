import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  HardDrive,
  Download,
  Film,
  Play,
  Pause,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  WifiOff,
  FolderOpen,
  ArrowDownCircle,
  ExternalLink
} from 'lucide-react';
import { DownloadTask, OfflineSavedMovie, Movie } from '../types';
import {
  pauseDownloadTask,
  resumeDownloadTask,
  cancelDownloadTask,
  clearCompletedDownloads,
  removeOfflineSavedMovie,
  calculateLocalDeviceStorageUsedMb,
} from '../utils/downloadManager';
import { soundFx } from '../utils/soundEffects';

interface LocalDriveManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: DownloadTask[];
  offlineMovies: OfflineSavedMovie[];
  allMovies: Movie[];
  onPlayMovie: (movie: Movie) => void;
  onOpenDownloadModal: (movie: Movie) => void;
}

export function LocalDriveManagerModal({
  isOpen,
  onClose,
  tasks,
  offlineMovies,
  allMovies,
  onPlayMovie,
  onOpenDownloadModal,
}: LocalDriveManagerModalProps) {
  const [activeTab, setActiveTab] = useState<'downloads' | 'offline'>('downloads');

  if (!isOpen) return null;

  const usedMb = calculateLocalDeviceStorageUsedMb();
  const usedGbFormatted = (usedMb / 1024).toFixed(2);
  const activeDownloads = tasks.filter(t => t.status === 'downloading' || t.status === 'paused');
  const completedDownloads = tasks.filter(t => t.status === 'completed');

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-6 overflow-y-auto">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          className="relative z-10 w-full max-w-3xl rounded-2xl bg-[#090d16] border border-slate-800 shadow-2xl overflow-hidden my-auto"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-800 bg-slate-950/70">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <HardDrive className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-cinzel text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2">
                  <span>Local Drive & Device Manager</span>
                  <span className="rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold">
                    Offline Ready
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Manage full movies downloaded to your local drive device storage.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Close manager"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Storage Bar Overview */}
          <div className="p-5 sm:p-6 bg-slate-900/40 border-b border-slate-800/80">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <FolderOpen className="h-3.5 w-3.5 text-amber-400" />
                Device Drive Usage
              </span>
              <span className="text-slate-400 font-mono">
                <strong className="text-amber-400 font-bold">{usedGbFormatted} GB</strong> saved on local device
              </span>
            </div>

            {/* Storage Meter */}
            <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden flex">
              <div
                className="bg-amber-500 h-full rounded-full"
                style={{ width: `${Math.min(100, Math.max(8, (usedMb / 10240) * 100))}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5">
              <span>{offlineMovies.length} offline titles available</span>
              <span>Unlimited local drive capacity</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-800 bg-slate-950/40 px-6">
            <button
              onClick={() => setActiveTab('downloads')}
              className={`py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'downloads'
                  ? 'border-amber-500 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowDownCircle className="h-4 w-4" />
              <span>Downloads Queue ({tasks.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('offline')}
              className={`py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'offline'
                  ? 'border-amber-500 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <WifiOff className="h-4 w-4" />
              <span>Offline Device Library ({offlineMovies.length})</span>
            </button>
          </div>

          {/* Tab Contents */}
          <div className="p-6 max-h-[55vh] overflow-y-auto space-y-4">
            
            {/* DOWNLOADS QUEUE TAB */}
            {activeTab === 'downloads' && (
              <div className="space-y-4">
                {tasks.length > 0 && (
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Active & Recent Transfers
                    </span>
                    {completedDownloads.length > 0 && (
                      <button
                        onClick={clearCompletedDownloads}
                        className="text-xs text-slate-400 hover:text-amber-400 transition-colors"
                      >
                        Clear Completed
                      </button>
                    )}
                  </div>
                )}

                {tasks.length > 0 ? (
                  tasks.map(task => {
                    const movie = allMovies.find(m => m.id === task.movieId);
                    return (
                      <div
                        key={task.id}
                        className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={task.posterUrl}
                              alt={task.movieTitle}
                              className="h-12 w-9 rounded object-cover border border-slate-700 flex-shrink-0"
                            />
                            <div className="min-w-0">
                              <h4 className="text-sm font-bold text-white truncate">
                                {task.movieTitle}
                              </h4>
                              <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                                <span className="rounded bg-amber-500/20 text-amber-300 px-1.5 py-0.2 text-[10px] font-bold">
                                  {task.quality}
                                </span>
                                <span>{task.format.toUpperCase()}</span>
                                <span>•</span>
                                <span>{task.savedToDriveName}</span>
                              </div>
                            </div>
                          </div>

                          {/* Quick action buttons */}
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {task.status === 'downloading' && (
                              <button
                                onClick={() => pauseDownloadTask(task.id)}
                                title="Pause download"
                                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                              >
                                <Pause className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {task.status === 'paused' && movie && (
                              <button
                                onClick={() => resumeDownloadTask(task.id, movie, movie.downloadOptions[0])}
                                title="Resume download"
                                className="p-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold hover:bg-amber-400"
                              >
                                <Play className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {task.status === 'completed' && movie && (
                              <button
                                onClick={() => {
                                  onClose();
                                  onPlayMovie(movie);
                                }}
                                className="flex items-center gap-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1 text-xs transition-colors"
                              >
                                <Play className="h-3 w-3" />
                                <span>Play Full Movie</span>
                              </button>
                            )}
                            <button
                              onClick={() => cancelDownloadTask(task.id)}
                              title="Cancel / remove"
                              className="p-1.5 rounded-lg bg-slate-800/60 text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full ${
                              task.status === 'completed'
                                ? 'bg-emerald-500'
                                : 'bg-gradient-to-r from-amber-500 to-amber-300'
                            }`}
                            initial={{ width: 0 }}
                            animate={{ width: `${task.progress}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span>
                            {task.downloadedMb} / {task.sizeMb} MB ({task.progress}%)
                          </span>
                          {task.status === 'downloading' && (
                            <span className="font-mono text-emerald-400 font-semibold">
                              ⚡ {task.speedMbps} MB/s • ETA {task.etaSeconds}s
                            </span>
                          )}
                          {task.status === 'completed' && (
                            <span className="text-emerald-400 font-medium flex items-center gap-1">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Complete
                            </span>
                          )}
                          {task.status === 'paused' && (
                            <span className="text-amber-400">Paused</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 rounded-xl bg-slate-950/40 border border-slate-800/80 p-6">
                    <Download className="h-10 w-10 text-slate-600 stroke-1 mx-auto mb-2" />
                    <h4 className="text-sm font-bold text-white font-cinzel">
                      No Active Downloads
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      Choose any movie from the gallery and click "Download to Drive" to save it for offline watching.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* OFFLINE LIBRARY TAB */}
            {activeTab === 'offline' && (
              <div className="space-y-3">
                {offlineMovies.length > 0 ? (
                  offlineMovies.map(off => {
                    const movie = allMovies.find(m => m.id === off.movieId);
                    return (
                      <div
                        key={off.movieId}
                        className="flex items-center justify-between p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-amber-500/30 transition-all gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {movie?.posterUrl && (
                            <img
                              src={movie.posterUrl}
                              alt={off.movieTitle}
                              className="h-12 w-9 rounded object-cover border border-slate-700 flex-shrink-0"
                            />
                          )}
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-white truncate">
                              {off.movieTitle}
                            </h4>
                            <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                              <span className="text-amber-400 font-medium">
                                {off.quality}
                              </span>
                              <span>•</span>
                              <span>{off.sizeMb} MB</span>
                              <span>•</span>
                              <span className="text-slate-500">
                                {new Date(off.savedAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {movie && (
                            <button
                              onClick={() => {
                                soundFx.playCinematicHit();
                                onClose();
                                onPlayMovie(movie);
                              }}
                              className="flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 text-xs transition-colors"
                            >
                              <Play className="h-3 w-3 fill-current" />
                              <span>Play</span>
                            </button>
                          )}
                          <button
                            onClick={() => {
                              soundFx.playWhoosh();
                              removeOfflineSavedMovie(off.movieId);
                            }}
                            title="Delete from local device"
                            className="p-1.5 rounded-lg bg-slate-800/80 text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 rounded-xl bg-slate-950/40 border border-slate-800/80 p-6">
                    <WifiOff className="h-10 w-10 text-slate-600 stroke-1 mx-auto mb-2" />
                    <h4 className="text-sm font-bold text-white font-cinzel">
                      No Movies Saved Offline Yet
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      Download full feature films in 4K or 1080p to keep them directly on your local device drive.
                    </p>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Footer Note */}
          <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              High Speed Direct Local Device I/O Storage
            </span>
            <button
              onClick={onClose}
              className="rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1 text-slate-300 text-xs transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
