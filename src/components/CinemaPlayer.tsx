import React, { useState, useRef, useEffect, ChangeEvent } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Download,
  RotateCcw,
  RotateCw,
  Settings,
  Subtitles,
  Sun,
  Moon,
  Sparkles,
  HardDrive,
  Tv
} from 'lucide-react';
import { Movie, MovieDownloadOption } from '../types';
import { soundFx } from '../utils/soundEffects';

interface CinemaPlayerProps {
  movie: Movie;
  onOpenDownloadModal: (movie: Movie) => void;
  isSavedOffline?: boolean;
}

export function CinemaPlayer({
  movie,
  onOpenDownloadModal,
  isSavedOffline = false,
}: CinemaPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(0.9);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [selectedQuality, setSelectedQuality] = useState<'4K' | '1080p' | '720p'>('4K');
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(false);
  const [theaterMode, setTheaterMode] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  const hideControlsTimerRef = useRef<number | null>(null);

  // Auto-hide controls after 3 seconds of inactivity when playing
  const handleMouseMove = () => {
    setShowControls(true);
    if (hideControlsTimerRef.current) {
      window.clearTimeout(hideControlsTimerRef.current);
    }
    if (isPlaying) {
      hideControlsTimerRef.current = window.setTimeout(() => {
        setShowControls(false);
        setShowSettingsMenu(false);
      }, 3000);
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (video.buffered.length > 0) {
        setBuffered((video.buffered.end(video.buffered.length - 1) / video.duration) * 100);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration || 4320); // Fallback feature duration
      video.volume = volume;
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);
    };
  }, [volume]);

  // Keyboard shortcuts (Space = Play/Pause, M = Mute, F = Fullscreen)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'KeyM') {
        toggleMute();
      } else if (e.code === 'KeyF') {
        toggleFullscreen();
      } else if (e.code === 'ArrowRight') {
        seekRelative(10);
      } else if (e.code === 'ArrowLeft') {
        seekRelative(-10);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isMuted]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      soundFx.playCinematicHit();
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleVolumeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const handleSeek = (e: ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const seekRelative = (sec: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(videoRef.current.duration, videoRef.current.currentTime + sec));
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const changeSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    setShowSettingsMenu(false);
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds <= 0) return '00:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
      return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className={`relative w-full aspect-video bg-black overflow-hidden select-none group ${
        theaterMode ? 'ring-4 ring-amber-500/50' : ''
      }`}
    >
      {/* HTML5 Video */}
      <video
        ref={videoRef}
        src={movie.fullMovieVideoUrl}
        poster={movie.backdropUrl}
        onClick={togglePlay}
        playsInline
        className="w-full h-full object-contain cursor-pointer"
      />

      {/* Subtitles Overlay (Simulated Cinematic Captions) */}
      {subtitlesEnabled && isPlaying && (
        <div className="absolute bottom-20 inset-x-0 flex justify-center pointer-events-none px-4">
          <span className="bg-black/85 text-yellow-300 font-medium px-4 py-1.5 rounded-lg text-sm sm:text-base tracking-wide border border-yellow-500/30 shadow-2xl backdrop-blur-md">
            [{movie.title} - English Dolby Audio Subtitles]
          </span>
        </div>
      )}

      {/* Big Center Play/Pause Splash Icon on Click */}
      {!isPlaying && (
        <div
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/90 text-slate-950 shadow-2xl shadow-amber-500/50 hover:scale-110 transition-transform">
            <Play className="h-9 w-9 fill-current ml-1" />
          </div>
        </div>
      )}

      {/* Top Bar Badges & Quick Download to Local Drive */}
      <div
        className={`absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1 text-xs font-bold backdrop-blur-md">
            <Tv className="h-3.5 w-3.5" />
            4K Full Feature Cinema
          </span>
          {isSavedOffline && (
            <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2.5 py-0.5 text-[11px] font-bold backdrop-blur-md">
              <HardDrive className="h-3 w-3" />
              Saved on Local Drive
            </span>
          )}
        </div>

        {/* Prominent Quick Download button on the player */}
        <button
          onClick={e => {
            e.stopPropagation();
            soundFx.playWhoosh();
            onOpenDownloadModal(movie);
          }}
          className="flex items-center gap-1.5 rounded-xl bg-amber-500/95 hover:bg-amber-400 text-slate-950 font-bold px-3.5 py-1.5 text-xs shadow-lg shadow-amber-500/30 transition-all backdrop-blur-md"
        >
          <Download className="h-3.5 w-3.5 stroke-[2.5]" />
          <span>Download to Local Drive</span>
        </button>
      </div>

      {/* Bottom Control Bar */}
      <div
        className={`absolute bottom-0 inset-x-0 p-3 sm:p-4 bg-gradient-to-t from-black/95 via-black/70 to-transparent transition-opacity duration-300 space-y-2 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Timeline Scrubber */}
        <div className="relative flex items-center group/scrubber">
          {/* Buffered track */}
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-slate-700 rounded-full pointer-events-none"
            style={{ width: `${buffered}%` }}
          />
          {/* Slider input */}
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-slate-800/80 rounded-lg appearance-none cursor-pointer accent-amber-500 focus:outline-none"
          />
        </div>

        {/* Buttons Row */}
        <div className="flex items-center justify-between text-slate-200 text-xs">
          {/* Left: Play/Pause, Skip, Time */}
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="text-white hover:text-amber-400 transition-colors p-1"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current" />}
            </button>

            <button
              onClick={() => seekRelative(-10)}
              title="Seek backward 10s"
              className="text-slate-400 hover:text-white transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
            </button>

            <button
              onClick={() => seekRelative(10)}
              title="Seek forward 10s"
              className="text-slate-400 hover:text-white transition-colors"
            >
              <RotateCw className="h-4 w-4" />
            </button>

            {/* Volume Control */}
            <div className="flex items-center gap-2 group/volume">
              <button
                onClick={toggleMute}
                className="text-slate-300 hover:text-white"
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-4 w-4 text-rose-400" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500 hidden sm:block"
              />
            </div>

            {/* Time Stamp */}
            <div className="font-mono text-xs text-slate-400">
              <span className="text-white">{formatTime(currentTime)}</span>
              <span className="mx-1">/</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right: Quality, Subtitles, Theater, Fullscreen */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Resolution Selector */}
            <button
              onClick={() => {
                const next = selectedQuality === '4K' ? '1080p' : selectedQuality === '1080p' ? '720p' : '4K';
                setSelectedQuality(next);
                soundFx.playChime();
              }}
              className="rounded bg-slate-800/80 hover:bg-slate-700 px-2 py-0.5 text-[11px] font-bold text-amber-300 border border-slate-700"
              title="Change streaming resolution"
            >
              {selectedQuality} UHD
            </button>

            {/* Subtitles Toggle */}
            <button
              onClick={() => setSubtitlesEnabled(!subtitlesEnabled)}
              title="Toggle subtitles / closed captions"
              className={`p-1 transition-colors ${
                subtitlesEnabled ? 'text-amber-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Subtitles className="h-4 w-4" />
            </button>

            {/* Playback Speed dropdown trigger */}
            <div className="relative">
              <button
                onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                title="Playback speed & settings"
                className="p-1 text-slate-400 hover:text-white transition-colors"
              >
                <Settings className="h-4 w-4" />
              </button>

              {showSettingsMenu && (
                <div className="absolute right-0 bottom-8 z-30 w-36 rounded-xl bg-slate-900 border border-slate-800 shadow-xl p-2 space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 py-1">
                    Speed
                  </div>
                  {[0.75, 1, 1.25, 1.5, 2].map(speed => (
                    <button
                      key={speed}
                      onClick={() => changeSpeed(speed)}
                      className={`w-full text-left px-2 py-1 rounded text-xs transition-colors ${
                        playbackSpeed === speed
                          ? 'bg-amber-500/20 text-amber-400 font-bold'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {speed === 1 ? 'Normal (1x)' : `${speed}x`}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Theater Mode Toggle */}
            <button
              onClick={() => setTheaterMode(!theaterMode)}
              title="Toggle Cinema Theater Lighting"
              className={`p-1 transition-colors hidden sm:block ${
                theaterMode ? 'text-amber-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              {theaterMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-1 text-slate-400 hover:text-white transition-colors"
              aria-label={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
