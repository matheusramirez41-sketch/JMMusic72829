import React, { useState } from 'react';
import { Track, EQPreset } from '../types/music';
import { getImmediateOfficialCover } from '../services/artworkService';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Repeat,
  Shuffle,
  Heart,
  Mic2,
  Sliders,
  Maximize2,
  ListMusic,
  CloudRain,
  Radio,
  Bell,
  BookmarkPlus,
  Zap,
  Moon,
  Disc3,
  Video,
  Clock,
  Share2
} from 'lucide-react';

interface PlayerBarProps {
  onOpenShareModal?: () => void;
  currentTrack: Track;
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
  isShuffle: boolean;
  onToggleShuffle: () => void;
  isRepeat: boolean;
  onToggleRepeat: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onOpenLyrics: () => void;
  isLyricsOpen?: boolean;
  onOpenEqualizer: () => void;
  onOpenAmbience?: () => void;
  onOpenAndroidNotification?: () => void;
  onToggleQueue: () => void;
  onToggleExpanded: () => void;
  isExpanded: boolean;
  eqPreset: EQPreset;
  onPlayFullYouTube?: (track: Track) => void;
  isFullSongSearching?: boolean;
  onOpenSaveModal?: (track: Track) => void;
  isNightcore?: boolean;
  onToggleNightcore?: () => void;
  isSlowedReverb?: boolean;
  onToggleSlowedReverb?: () => void;
  is8DAudio?: boolean;
  onToggle8DAudio?: () => void;
  isKaraoke?: boolean;
  onToggleKaraoke?: () => void;
  showVideo?: boolean;
  onToggleVideo?: () => void;
  playbackSpeed?: number;
  onCycleSpeed?: () => void;
  onOpenSleepTimer?: () => void;
}

export const PlayerBar: React.FC<PlayerBarProps> = ({
  onOpenShareModal,
  currentTrack,
  isPlaying,
  onPlayPause,
  onNext,
  onPrevious,
  currentTime,
  duration,
  onSeek,
  volume,
  onVolumeChange,
  isShuffle,
  onToggleShuffle,
  isRepeat,
  onToggleRepeat,
  isFavorite,
  onToggleFavorite,
  onOpenLyrics,
  isLyricsOpen,
  onOpenEqualizer,
  onOpenAmbience,
  onOpenAndroidNotification,
  onToggleQueue,
  onToggleExpanded,
  isExpanded,
  eqPreset,
  onPlayFullYouTube,
  isFullSongSearching,
  onOpenSaveModal,
  isNightcore = false,
  onToggleNightcore,
  isSlowedReverb = false,
  onToggleSlowedReverb,
  is8DAudio = false,
  onToggle8DAudio,
  isKaraoke = false,
  onToggleKaraoke,
  showVideo = false,
  onToggleVideo,
  playbackSpeed = 1.0,
  onCycleSpeed,
  onOpenSleepTimer
}) => {
  const [prevVolume, setPrevVolume] = useState(volume);

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    onSeek((val / 100) * duration);
  };

  const toggleMute = () => {
    if (volume > 0) {
      setPrevVolume(volume);
      onVolumeChange(0);
    } else {
      onVolumeChange(prevVolume || 0.8);
    }
  };

  return (
    <footer className="h-16 sm:h-18 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/80 px-3 sm:px-6 flex items-center justify-between z-40 select-none relative">
      {/* Top micro progress line on hover/mobile */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-slate-800/40">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-100"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Left: Track Info */}
      <div className="flex items-center gap-3.5 w-1/4 min-w-[200px]">
        <div
          onClick={onToggleExpanded}
          className="relative w-13 h-13 rounded-xl overflow-hidden cursor-pointer group flex-shrink-0 shadow-md border border-white/10"
        >
          <img
            src={getImmediateOfficialCover(currentTrack.title, currentTrack.artist, currentTrack.coverUrl, currentTrack.id)}
            alt={currentTrack.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
            <Maximize2 className="w-4 h-4" />
          </div>
          {isPlaying && (
            <div className="absolute bottom-1 right-1 bg-black/75 backdrop-blur-xs px-1 py-0.5 rounded flex items-end gap-0.5 pointer-events-none shadow-sm">
              <span className="w-0.5 h-2 bg-indigo-400 animate-pulse" />
              <span className="w-0.5 h-3 bg-purple-400 animate-pulse delay-75" />
              <span className="w-0.5 h-1.5 bg-cyan-400 animate-pulse delay-150" />
            </div>
          )}
        </div>

        <div className="min-w-0 pr-2">
          <div className="flex items-center gap-1.5">
            <span
              onClick={onToggleExpanded}
              className="font-medium text-sm text-white truncate hover:underline cursor-pointer"
            >
              {currentTrack.title}
            </span>
          </div>
          <div className="text-xs text-slate-400 truncate hover:text-slate-200 cursor-pointer">
            {currentTrack.artist}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {onOpenSaveModal && (
            <button
              onClick={() => onOpenSaveModal(currentTrack)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-white/5 transition-colors cursor-pointer"
              title="Guardar en biblioteca normal o sin wifi"
            >
              <BookmarkPlus className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onToggleFavorite}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isFavorite ? 'text-rose-400' : 'text-slate-400 hover:text-white'
            }`}
            title={isFavorite ? 'Eliminar de favoritos' : 'Añadir a favoritos'}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Center: Controls & Scrubber */}
      <div className="flex flex-col items-center gap-1.5 w-2/4 max-w-xl">
        {/* Quick DSP / Studio Effects */}
        <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-bold">
          {onToggleNightcore && (
            <button
              onClick={onToggleNightcore}
              className={`px-2 py-0.5 rounded-full border transition-all cursor-pointer flex items-center gap-1 ${
                isNightcore
                  ? 'bg-amber-500/25 border-amber-400 text-amber-300 shadow-sm'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
              }`}
              title="Nightcore (+25% tempo y tono)"
            >
              <Zap className="w-3 h-3 text-amber-400" />
              <span>NC</span>
            </button>
          )}

          {onToggleSlowedReverb && (
            <button
              onClick={onToggleSlowedReverb}
              className={`px-2 py-0.5 rounded-full border transition-all cursor-pointer flex items-center gap-1 ${
                isSlowedReverb
                  ? 'bg-purple-500/25 border-purple-400 text-purple-300 shadow-sm'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
              }`}
              title="Slowed + Reverb (Espacial)"
            >
              <Moon className="w-3 h-3 text-purple-400" />
              <span>Slow</span>
            </button>
          )}

          {onToggle8DAudio && (
            <button
              onClick={onToggle8DAudio}
              className={`px-2 py-0.5 rounded-full border transition-all cursor-pointer flex items-center gap-1 ${
                is8DAudio
                  ? 'bg-cyan-500/25 border-cyan-400 text-cyan-300 shadow-sm'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
              }`}
              title="Audio Espacial 8D Binaural"
            >
              <Disc3 className="w-3 h-3 text-cyan-400" />
              <span>8D</span>
            </button>
          )}

          {onToggleKaraoke && (
            <button
              onClick={onToggleKaraoke}
              className={`px-2 py-0.5 rounded-full border transition-all cursor-pointer flex items-center gap-1 ${
                isKaraoke
                  ? 'bg-rose-500/25 border-rose-400 text-rose-300 shadow-sm'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
              }`}
              title="Modo Karaoke (Atenuador vocal)"
            >
              <span>Karaoke</span>
            </button>
          )}

          {onToggleVideo && (
            <button
              onClick={onToggleVideo}
              className={`px-2 py-0.5 rounded-full border transition-all cursor-pointer flex items-center gap-1 ${
                showVideo
                  ? 'bg-red-500/25 border-red-400 text-red-300 shadow-sm'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
              }`}
              title="Video Oficial en Pantalla Flotante"
            >
              <Video className="w-3 h-3 text-red-400" />
              <span>Video</span>
            </button>
          )}

          {onCycleSpeed && (
            <button
              onClick={onCycleSpeed}
              className="px-2 py-0.5 rounded-full border border-slate-800 bg-slate-900/60 text-slate-300 hover:text-white text-[10px] font-bold cursor-pointer"
              title="Velocidad de reproducción"
            >
              {playbackSpeed}x
            </button>
          )}
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={onToggleShuffle}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isShuffle ? 'text-indigo-400' : 'text-slate-400 hover:text-white'
            }`}
            title="Aleatorio"
          >
            <Shuffle className="w-4 h-4" />
          </button>

          <button
            onClick={onPrevious}
            className="text-slate-300 hover:text-white transition-colors cursor-pointer p-1"
            title="Anterior"
          >
            <SkipBack className="w-5 h-5 fill-current" />
          </button>

          <button
            onClick={onPlayPause}
            className="w-10 h-10 rounded-full bg-white hover:bg-slate-200 text-slate-950 flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer"
            title={isPlaying ? 'Pausar' : 'Reproducir'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          <button
            onClick={onNext}
            className="text-slate-300 hover:text-white transition-colors cursor-pointer p-1"
            title="Siguiente"
          >
            <SkipForward className="w-5 h-5 fill-current" />
          </button>

          <button
            onClick={onToggleRepeat}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isRepeat ? 'text-indigo-400' : 'text-slate-400 hover:text-white'
            }`}
            title="Repetir"
          >
            <Repeat className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Bar & Timestamps */}
        <div className="w-full flex items-center gap-2.5 text-xs text-slate-400 font-mono">
          <span className="w-9 text-right">{formatTime(currentTime)}</span>
          <div className="relative flex-1 flex items-center">
            <input
              type="range"
              min={0}
              max={100}
              step={0.1}
              value={progressPercent}
              onChange={handleSeekChange}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:h-2 transition-all"
            />
          </div>
          <span className="w-9">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Right: Audio Features, Equalizer, Volume */}
      <div className="flex items-center justify-end gap-3 w-1/4 min-w-[200px]">
        {/* Equalizer Quick Tag */}
        <button
          onClick={onOpenEqualizer}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
            eqPreset !== 'flat'
              ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
          title="Ecualizador DSP"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span className="capitalize">{eqPreset}</span>
        </button>

        {/* Ambience 3D Soundscapes Button */}
        {onOpenAmbience && (
          <button
            onClick={onOpenAmbience}
            className="text-slate-400 hover:text-cyan-400 p-1.5 rounded-lg transition-colors cursor-pointer"
            title="Ambientes Sonoros 3D (Lluvia / Vinilo / Fuego)"
          >
            <CloudRain className="w-4 h-4" />
          </button>
        )}

        {/* Lyrics (Abajo) */}
        <button
          onClick={onOpenLyrics}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            isLyricsOpen
              ? 'text-indigo-400 bg-indigo-500/20 ring-1 ring-indigo-500/40'
              : 'text-slate-400 hover:text-white'
          }`}
          title={isLyricsOpen ? 'Ocultar letras de abajo' : 'Ver letras abajo'}
        >
          <Mic2 className="w-4 h-4" />
        </button>

        {/* Queue */}
        <button
          onClick={onToggleQueue}
          className="text-slate-400 hover:text-white p-1.5 rounded-lg transition-colors cursor-pointer"
          title="Cola de reproducción"
        >
          <ListMusic className="w-4 h-4" />
        </button>

        {/* Share App Short Link */}
        {onOpenShareModal && (
          <button
            onClick={onOpenShareModal}
            className="text-slate-400 hover:text-purple-400 p-1.5 rounded-lg transition-colors cursor-pointer"
            title="Compartir enlace público y corto"
          >
            <Share2 className="w-4 h-4" />
          </button>
        )}

        {/* Android 13/14 Media Notification Widget */}
        {onOpenAndroidNotification && (
          <button
            onClick={onOpenAndroidNotification}
            className="text-slate-400 hover:text-indigo-400 p-1.5 rounded-lg transition-colors cursor-pointer relative"
            title="Ver Notificación Android Material You (Onda animada y controles)"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
          </button>
        )}

        {/* Volume Slider */}
        <div className="flex items-center gap-2 pl-2">
          <button
            onClick={toggleMute}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            {volume === 0 ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="w-18 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
        </div>
      </div>
    </footer>
  );
};
