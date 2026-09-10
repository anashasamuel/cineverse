import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  HardDrive,
  Download,
  CheckCircle2,
  FolderDown,
  Sparkles,
  FileText,
  Subtitles,
  Volume2,
  Check,
  Pause,
  Play,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { Movie, MovieDownloadOption, DownloadTask } from '../types';
import {
  startLocalDriveDownload,
  pauseDownloadTask,
  resumeDownloadTask,
  cancelDownloadTask,
  triggerLocalDriveFileDownload
} from '../utils/downloadManager';
import { soundFx } from '../utils/soundEffects';

interface DownloadModalProps {
  movie: Movie | null;
  onClose: () => void;
  activeTasks?: DownloadTask[];
  onOpenCinemaPlayer?: (movie: Movie) => void;
  onOpenDriveManager?: () => void;
  isOpen?: boolean;
}

export function DownloadModal({
  movie,
  onClose,
  activeTasks = [],
  onOpenCinemaPlayer,
  onOpenDriveManager,
}: DownloadModalProps) {
  const [selectedQualityIndex, setSelectedQualityIndex] = useState(0); // 0 = 4K, 1 = 1080p, 2 = 720p
  const [selectedFormat, setSelectedFormat] = useState<'mp4' | 'mkv'>('mp4');
  const [includeNfo, setIncludeNfo] = useState(true);
  const [includeSubtitles, setIncludeSubtitles] = useState(true);
  const [saveToCustomFolder, setSaveToCustomFolder] = useState(false);
  const [customFolderName, setCustomFolderName] = useState('Local Drive (Device Downloads)');

  if (!movie) return null;

  const currentOption: MovieDownloadOption = movie.downloadOptions[selectedQualityIndex] || movie.downloadOptions[0];

  // Find if there is an existing download task for this movie
  const existingTask = activeTasks.find(
    t => t.movieId === movie.id && t.quality === currentOption.quality
  );

  const handleStartDownload = async () => {
    soundFx.playWhoosh();
    startLocalDriveDownload(
      movie,
      {
        ...currentOption,
        format: selectedFormat,
      },
      customFolderName,
      includeNfo
    );
  };

  const handleChooseLocalFolder = async () => {
    if (typeof window !== 'undefined' && 'showDirectoryPicker' in window) {
      try {
        // @ts-expect-error - File System Access API
        const dirHandle = await window.showDirectoryPicker();
        if (dirHandle?.name) {
          setCustomFolderName(`Local Drive (${dirHandle.name})`);
          setSaveToCustomFolder(true);
          soundFx.playChime();
        }
      } catch (err: unknown) {
        if ((err as Error)?.name !== 'AbortError') {
          console.warn('Folder selection bypassed', err);
        }
      }
    } else {
      setCustomFolderName('Local Drive (D:\\Movies\\Cinema)');
      setSaveToCustomFolder(true);
      soundFx.playChime();
    }
  };

  const handleDirectSaveImmediately = () => {
    soundFx.playCinematicHit();
    const filename = `${movie.title.replace(/[^a-zA-Z0-9]/g, '_')}_${movie.releaseYear}_${currentOption.resolution}.${selectedFormat}`;
    triggerLocalDriveFileDownload(filename, currentOption.fileUrl, `video/${selectedFormat}`);
  };

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

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          className="relative z-10 w-full max-w-2xl rounded-2xl bg-[#090d16] border border-slate-800 shadow-2xl overflow-hidden my-auto"
        >
          {/* Header Glow */}
          <div
            className="absolute top-0 inset-x-0 h-28 blur-3xl opacity-20 pointer-events-none"
            style={{ backgroundColor: movie.accentColor }}
          />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-slate-900/80 text-slate-300 border border-slate-700 hover:bg-amber-500 hover:text-slate-950 transition-colors shadow-md"
            aria-label="Close download modal"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Header Banner */}
          <div className="relative p-6 border-b border-slate-800/80 bg-slate-950/40">
            <div className="flex items-start gap-4">
              <img
                src={movie.posterUrl}
                alt={movie.title}
                className="h-20 w-14 rounded-lg object-cover border border-slate-700 shadow-md flex-shrink-0"
              />
              <div className="flex-1 min-w-0 pr-8">
                <div className="flex items-center gap-2 mb-1">
                  <span className="flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[11px] font-bold text-amber-300 border border-amber-500/30">
                    <HardDrive className="h-3 w-3" />
                    Local Drive Exporter
                  </span>
                  <span className="text-xs text-slate-400">
                    {movie.duration} • {movie.releaseYear}
                  </span>
                </div>
                <h3 className="font-cinzel text-xl sm:text-2xl font-extrabold text-white truncate">
                  {movie.title}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                  Save full feature film to your PC, Mac, phone, or external local drive for zero-buffering offline playback.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Active Download Progress (If currently in progress) */}
            {existingTask && (
              <div className="rounded-xl bg-slate-900/90 border border-amber-500/30 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-amber-400 animate-pulse" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      {existingTask.status === 'completed'
                        ? 'Downloaded to Local Drive'
                        : existingTask.status === 'paused'
                        ? 'Download Paused'
                        : 'Writing to Local Drive Device'}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-400">
                    {existingTask.progress}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${existingTask.progress}%` }}
                    transition={{ ease: 'easeOut', duration: 0.3 }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>
                    {existingTask.downloadedMb} MB / {existingTask.sizeMb} MB
                  </span>
                  {existingTask.status === 'downloading' && (
                    <span className="font-mono text-emerald-400 font-semibold">
                      ⚡ {existingTask.speedMbps} MB/s • ETA {existingTask.etaSeconds}s
                    </span>
                  )}
                  {existingTask.status === 'completed' && (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Saved in: {existingTask.savedToDriveName}
                    </span>
                  )}
                </div>

                {/* Task Controls */}
                <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800/80">
                  {existingTask.status === 'downloading' && (
                    <button
                      onClick={() => pauseDownloadTask(existingTask.id)}
                      className="flex items-center gap-1 rounded-lg bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300 hover:bg-slate-700"
                    >
                      <Pause className="h-3 w-3" /> Pause
                    </button>
                  )}
                  {existingTask.status === 'paused' && (
                    <button
                      onClick={() => resumeDownloadTask(existingTask.id, movie, currentOption)}
                      className="flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-1 text-xs font-bold text-slate-950 hover:bg-amber-400"
                    >
                      <Play className="h-3 w-3" /> Resume
                    </button>
                  )}
                  {existingTask.status === 'completed' && onOpenCinemaPlayer && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenCinemaPlayer(movie);
                      }}
                      className="flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-1 text-xs font-bold text-slate-950 hover:bg-amber-400"
                    >
                      <Play className="h-3 w-3" /> Play Offline Now
                    </button>
                  )}
                  <button
                    onClick={() => cancelDownloadTask(existingTask.id)}
                    className="flex items-center gap-1 rounded-lg bg-slate-800/60 px-2.5 py-1 text-xs text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}

            {/* Quality Tier Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                1. Select Video Resolution & Quality
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {movie.downloadOptions.map((opt, idx) => {
                  const isSelected = selectedQualityIndex === idx;
                  return (
                    <button
                      key={opt.quality}
                      onClick={() => {
                        soundFx.playWhoosh();
                        setSelectedQualityIndex(idx);
                      }}
                      className={`relative flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500 shadow-md shadow-amber-500/10'
                          : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {isSelected && (
                        <span className="absolute top-2.5 right-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-slate-950">
                          <Check className="h-3 w-3 stroke-[3]" />
                        </span>
                      )}
                      <span className="text-xs font-extrabold text-white">
                        {opt.quality}
                      </span>
                      <span className="text-[11px] text-amber-400 font-mono mt-0.5">
                        {opt.resolution}
                      </span>
                      <span className="text-[11px] text-slate-400 mt-2">
                        {opt.sizeMb > 1000 ? `${(opt.sizeMb / 1024).toFixed(2)} GB` : `${opt.sizeMb} MB`}
                      </span>
                      {opt.hasHDR && (
                        <span className="mt-1 inline-block rounded bg-rose-500/20 px-1 py-0.5 text-[9px] font-bold text-rose-300 border border-rose-500/30">
                          HDR10 / Atmos
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Container Format & Audio Specs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  2. File Format
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedFormat('mp4')}
                    className={`flex-1 rounded-xl py-2 px-3 text-xs font-semibold border transition-all ${
                      selectedFormat === 'mp4'
                        ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    MP4 (Universal)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedFormat('mkv')}
                    className={`flex-1 rounded-xl py-2 px-3 text-xs font-semibold border transition-all ${
                      selectedFormat === 'mkv'
                        ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    MKV (Multi-Track)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Audio Track
                </label>
                <div className="rounded-xl bg-slate-900/80 border border-slate-800 py-2 px-3 text-xs text-slate-300 flex items-center gap-2">
                  <Volume2 className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />
                  <span className="truncate">{currentOption.audioTrack}</span>
                </div>
              </div>
            </div>

            {/* Target Drive Destination */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <HardDrive className="h-3.5 w-3.5 text-amber-400" />
                  3. Local Drive Destination Device
                </label>
                <button
                  onClick={handleChooseLocalFolder}
                  className="text-xs text-amber-400 hover:underline flex items-center gap-1"
                >
                  <FolderDown className="h-3 w-3" />
                  Select Target Drive / Folder
                </button>
              </div>
              <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-3 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex-shrink-0">
                    <HardDrive className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">
                      {customFolderName}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Target local disk drive folder
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleChooseLocalFolder}
                  className="rounded-lg bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-xs text-slate-300 transition-colors"
                >
                  Browse...
                </button>
              </div>
            </div>

            {/* Companion Bundle Options */}
            <div className="rounded-xl bg-slate-950/60 border border-slate-800/80 p-3 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Bonus Collector Package
              </span>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={includeNfo}
                    onChange={e => setIncludeNfo(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-0 h-4 w-4"
                  />
                  <FileText className="h-3.5 w-3.5 text-slate-400" />
                  <span>Include .NFO Companion & Cast Metadata</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={includeSubtitles}
                    onChange={e => setIncludeSubtitles(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-0 h-4 w-4"
                  />
                  <Subtitles className="h-3.5 w-3.5 text-slate-400" />
                  <span>Include Subtitles & Audio Captions</span>
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                onClick={handleStartDownload}
                className="w-full sm:flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold py-3 px-5 text-sm shadow-lg shadow-amber-500/25 transition-all active:scale-[0.98]"
              >
                <Download className="h-4 w-4 stroke-[2.5]" />
                <span>
                  Start Download to Local Drive ({currentOption.sizeMb > 1000 ? `${(currentOption.sizeMb / 1024).toFixed(2)} GB` : `${currentOption.sizeMb} MB`})
                </span>
              </button>

              <button
                onClick={handleDirectSaveImmediately}
                title="Instant one-click browser file download"
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 py-3 px-4 text-xs font-semibold transition-all"
              >
                <FolderDown className="h-4 w-4 text-amber-400" />
                <span>Quick Save File</span>
              </button>
            </div>

            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 text-center">
              <AlertCircle className="h-3 w-3" />
              <span>
                Files are downloaded directly to your local hardware drive device for offline watching with VLC, Windows Media Player, or CineVerse Player.
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
