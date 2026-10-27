import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Track } from '../types/music';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Heart,
  Repeat,
  Shuffle,
  Headphones,
  Cast,
  Volume2,
  Sliders,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles,
  Radio,
  Check,
  Bell,
  Smartphone,
  ExternalLink
} from 'lucide-react';

interface AndroidMediaNotificationProps {
  currentTrack: Track;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onTogglePlayPause: () => void;
  onNextTrack: () => void;
  onPrevTrack: () => void;
  onSeek: (time: number) => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  isShuffle: boolean;
  onToggleShuffle: () => void;
  isRepeat: boolean;
  onToggleRepeat: () => void;
  isOpen: boolean;
  onClose: () => void;
  isDocked?: boolean;
  onToggleDock?: () => void;
}

export const AndroidMediaNotification: React.FC<AndroidMediaNotificationProps> = ({
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  onTogglePlayPause,
  onNextTrack,
  onPrevTrack,
  onSeek,
  isFavorite,
  onToggleFavorite,
  isShuffle,
  onToggleShuffle,
  isRepeat,
  onToggleRepeat,
  isOpen,
  onClose,
  isDocked = false,
  onToggleDock
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [outputDevice, setOutputDevice] = useState<'headphones' | 'speaker' | 'cast' | 'dac'>('headphones');
  const [showDevicePicker, setShowDevicePicker] = useState(false);
  const [waveOffset, setWaveOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragTime, setDragTime] = useState(0);
  const seekbarRef = useRef<HTMLDivElement>(null);

  // Animate the squiggly waveform when playing
  useEffect(() => {
    if (!isPlaying) return;
    let animId: number;
    let lastTime = performance.now();

    const animate = (now: number) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;
      // Advance wave phase smoothly
      setWaveOffset(prev => (prev + delta * 24) % 100);
      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying]);

  // Format mm:ss
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const effectiveTime = isDragging ? dragTime : currentTime;
  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (effectiveTime / duration) * 100)) : 0;

  // Generate SVG path for the squiggly waveform (Android 13/14 trademark feature)
  // When isPlaying is true, the played part is a smooth sinusoid wave. When paused, it's straight!
  const squigglyWavePath = useMemo(() => {
    const width = 300; // base coordinate width
    const playedWidth = (progressPercent / 100) * width;
    const waveHeight = isPlaying ? 3.5 : 0; // Wave amplitude (flattens when paused)
    const wavelength = 18; // Frequency

    if (playedWidth <= 2) {
      return `M 0,10 L ${width},10`;
    }

    let d = `M 0,10`;
    const step = 2;

    for (let x = 0; x <= playedWidth; x += step) {
      if (isPlaying) {
        // Sinusoidal wave with traveling phase offset
        const y = 10 + Math.sin(((x + waveOffset) / wavelength) * Math.PI * 2) * waveHeight;
        d += ` L ${x.toFixed(1)},${y.toFixed(2)}`;
      } else {
        d += ` L ${x.toFixed(1)},10`;
      }
    }

    // Connect to end
    return d;
  }, [progressPercent, isPlaying, waveOffset]);

  // Handle Scrubbing / Seeking
  const handleSeekStart = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!seekbarRef.current || duration <= 0) return;
    setIsDragging(true);
    updateSeekTime(e);
  };

  const updateSeekTime = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!seekbarRef.current || duration <= 0) return;
    const rect = seekbarRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clickX = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = clickX / rect.width;
    const targetTime = percent * duration;
    setDragTime(targetTime);
  };

  const handleSeekEnd = () => {
    if (isDragging) {
      onSeek(dragTime);
      setIsDragging(false);
    }
  };

  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!seekbarRef.current || duration <= 0) return;
      const rect = seekbarRef.current.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clickX = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const percent = clickX / rect.width;
      setDragTime(percent * duration);
    };

    const handleUp = () => {
      onSeek(dragTime);
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleUp);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, [isDragging, dragTime, duration, onSeek]);

  if (!isOpen) return null;

  return (
    <div
      className={`transition-all duration-300 z-50 ${
        isDocked
          ? 'fixed bottom-24 right-4 sm:right-6 w-full max-w-[420px]'
          : 'fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-4'
      }`}
    >
      {/* Backdrop click to close when not docked */}
      {!isDocked && <div className="absolute inset-0" onClick={onClose} />}

      {/* Android 13/14 Material You Style Card in Aura Sound Theme */}
      <div
        className={`relative w-full max-w-[430px] rounded-[32px] overflow-hidden transition-all duration-300 shadow-2xl border border-slate-700/60 text-white ${
          isDocked ? 'bg-slate-900/95 backdrop-blur-2xl' : 'bg-slate-900/95 backdrop-blur-2xl'
        }`}
        style={{
          boxShadow: `0 25px 60px -15px ${currentTrack.accentColor || '#6366f1'}33, 0 0 0 1px rgba(255, 255, 255, 0.08)`
        }}
      >
        {/* Dynamic ambient color glow behind the notification card */}
        <div
          className="absolute inset-0 pointer-events-none opacity-25 blur-3xl transition-all duration-1000 -z-10"
          style={{
            background: `radial-gradient(circle at 85% 20%, ${currentTrack.accentColor || '#6366f1'} 0%, transparent 70%), radial-gradient(circle at 15% 85%, #3b82f6 0%, transparent 60%)`
          }}
        />

        {/* Top Header: App Branding + Android Media Output Switcher */}
        <div className="px-5 pt-4 pb-2 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center">
              <Headphones className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-200 tracking-wide">Aura Sound</span>
              <span className="text-[10px] text-slate-400">•</span>
              <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {isPlaying ? 'Reproduciendo' : 'En pausa'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Output Device Switcher Pill (The signature Android 13/14 Chip) */}
            <div className="relative">
              <button
                onClick={() => setShowDevicePicker(!showDevicePicker)}
                className="px-2.5 py-1 rounded-full bg-slate-800/90 hover:bg-slate-700/80 border border-slate-700/60 text-[11px] font-medium text-slate-200 flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                title="Cambiar salida de audio"
              >
                {outputDevice === 'headphones' && <Headphones className="w-3 h-3 text-indigo-400" />}
                {outputDevice === 'speaker' && <Volume2 className="w-3 h-3 text-cyan-400" />}
                {outputDevice === 'cast' && <Cast className="w-3 h-3 text-pink-400" />}
                {outputDevice === 'dac' && <Sparkles className="w-3 h-3 text-amber-400" />}
                <span className="max-w-[100px] truncate">
                  {outputDevice === 'headphones' && 'Aura Hi-Res'}
                  {outputDevice === 'speaker' && 'Altavoces'}
                  {outputDevice === 'cast' && 'Chromecast'}
                  {outputDevice === 'dac' && 'DAC 24-bit'}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {/* Device Selector Dropdown */}
              {showDevicePicker && (
                <div className="absolute right-0 top-8 w-56 bg-slate-800/95 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-xl p-1.5 z-50 text-xs animate-in fade-in zoom-in-95">
                  <div className="px-2.5 py-1.5 font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                    Salida de reproducción
                  </div>
                  {[
                    { id: 'headphones', name: 'Aura Hi-Res (Auriculares)', icon: Headphones, sub: 'Audio 3D espacial activo' },
                    { id: 'speaker', name: 'Altavoz del dispositivo', icon: Volume2, sub: 'Stereo estándar' },
                    { id: 'cast', name: 'Google Cast / Audio Room', icon: Cast, sub: 'Transmisión sin pérdidas' },
                    { id: 'dac', name: 'DAC Externo USB / LDAC', icon: Sparkles, sub: 'FLAC 96kHz / 24-bit' }
                  ].map(dev => {
                    const Icon = dev.icon;
                    const isSelected = outputDevice === dev.id;
                    return (
                      <button
                        key={dev.id}
                        onClick={() => {
                          setOutputDevice(dev.id as any);
                          setShowDevicePicker(false);
                        }}
                        className={`w-full text-left px-2.5 py-2 rounded-xl flex items-center justify-between transition-all ${
                          isSelected ? 'bg-indigo-600/30 text-indigo-300 font-semibold' : 'hover:bg-slate-700/60 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-indigo-400' : 'text-slate-400'}`} />
                          <div>
                            <div className="text-xs leading-none">{dev.name}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{dev.sub}</div>
                          </div>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Toggle Dock / Floating Mode */}
            {onToggleDock && (
              <button
                onClick={onToggleDock}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title={isDocked ? 'Expandir vista central' : 'Fijar como widget flotante'}
              >
                <Smartphone className="w-4 h-4" />
              </button>
            )}

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Cerrar notificación"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="p-5 space-y-4">
          {/* Track Info & Artwork Section */}
          <div className="flex items-center gap-4">
            {/* Album Artwork with smooth rounded corners and glow */}
            <div className="relative group shrink-0">
              <img
                src={currentTrack.coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80'}
                alt={currentTrack.title}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover shadow-xl border border-white/10 transition-transform group-hover:scale-105 duration-300"
              />
              {isPlaying && (
                <div
                  className="absolute inset-0 rounded-2xl border-2 animate-pulse pointer-events-none"
                  style={{
                    borderColor: currentTrack.accentColor || '#6366f1',
                    boxShadow: `0 0 16px ${currentTrack.accentColor || '#6366f1'}66`
                  }}
                />
              )}
              {/* High-Res Master Audio Tag */}
              <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-md bg-slate-900/90 border border-slate-700 text-[9px] font-bold tracking-wider text-indigo-300">
                HI-FI
              </div>
            </div>

            {/* Title, Artist and Full Song Badge */}
            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Completa 100%
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {currentTrack.genre || 'Master Audio'}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight truncate leading-tight">
                {currentTrack.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 font-medium truncate mt-0.5">
                {currentTrack.artist}
              </p>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                {currentTrack.album || 'Aura Sound Master'}
              </p>
            </div>

            {/* Favorite / Heart Button on the right of metadata */}
            <button
              onClick={onToggleFavorite}
              className={`p-2.5 rounded-full transition-all active:scale-90 ${
                isFavorite
                  ? 'text-pink-500 bg-pink-500/10'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title={isFavorite ? 'En favoritos' : 'Añadir a favoritos'}
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* THE FAMOUS ANDROID 13/14 SQUIGGLY WAVEFORM SEEKBAR */}
          <div className="space-y-1.5 pt-1">
            <div
              ref={seekbarRef}
              onMouseDown={handleSeekStart}
              onTouchStart={handleSeekStart}
              className="relative h-8 flex items-center cursor-pointer group select-none"
            >
              <svg
                viewBox="0 0 300 20"
                className="w-full h-8 overflow-visible"
                preserveAspectRatio="none"
              >
                {/* Background Unplayed Track Line (faint line) */}
                <line
                  x1="0"
                  y1="10"
                  x2="300"
                  y2="10"
                  stroke="#334155"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />

                {/* The Squiggly Waveform Path for the Played Portion (Android 13/14 style) */}
                <path
                  d={squigglyWavePath}
                  fill="none"
                  stroke={currentTrack.accentColor || '#6366f1'}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Wave scrub thumb/knob */}
                <circle
                  cx={(progressPercent / 100) * 300}
                  cy="10"
                  r={isDragging ? 6.5 : 5}
                  fill="#ffffff"
                  stroke={currentTrack.accentColor || '#6366f1'}
                  strokeWidth="2.5"
                  className="transition-all filter drop-shadow group-hover:scale-125"
                />
              </svg>
            </div>

            {/* Time Stamp Indicators */}
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-0.5">
              <span>{formatTime(effectiveTime)}</span>
              <span className="flex items-center gap-1">
                <span className="text-[10px] text-slate-400 font-sans">Duración:</span>
                <span>{formatTime(duration)}</span>
              </span>
            </div>
          </div>

          {/* Media Playback Controls Row (Android Material You layout) */}
          <div className="flex items-center justify-between pt-1 px-1">
            {/* Shuffle Toggle */}
            <button
              onClick={onToggleShuffle}
              className={`p-2.5 rounded-full transition-all active:scale-90 ${
                isShuffle
                  ? 'text-indigo-400 bg-indigo-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title={isShuffle ? 'Aleatorio activado' : 'Aleatorio desactivado'}
            >
              <Shuffle className="w-4 h-4" />
            </button>

            {/* Previous Track */}
            <button
              onClick={onPrevTrack}
              className="p-3 rounded-full text-slate-200 hover:text-white hover:bg-slate-800 transition-all active:scale-90"
              title="Canción anterior"
            >
              <SkipBack className="w-5 h-5 fill-current" />
            </button>

            {/* Prominent Play / Pause Button (The signature Material You circular/pill button) */}
            <button
              onClick={onTogglePlayPause}
              className="w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl transition-all duration-200 hover:scale-105 active:scale-95"
              style={{
                backgroundColor: currentTrack.accentColor || '#6366f1',
                boxShadow: `0 8px 24px -4px ${currentTrack.accentColor || '#6366f1'}88`
              }}
              title={isPlaying ? 'Pausar' : 'Reproducir'}
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 fill-current" />
              ) : (
                <Play className="w-6 h-6 fill-current translate-x-0.5" />
              )}
            </button>

            {/* Next Track */}
            <button
              onClick={onNextTrack}
              className="p-3 rounded-full text-slate-200 hover:text-white hover:bg-slate-800 transition-all active:scale-90"
              title="Siguiente canción"
            >
              <SkipForward className="w-5 h-5 fill-current" />
            </button>

            {/* Repeat / Loop Toggle */}
            <button
              onClick={onToggleRepeat}
              className={`p-2.5 rounded-full transition-all active:scale-90 ${
                isRepeat
                  ? 'text-indigo-400 bg-indigo-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title={isRepeat ? 'Repetir canción activado' : 'Repetición desactivada'}
            >
              <Repeat className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Footer Sub-Banner: Lockscreen & System Notification Sync Indicator */}
        <div className="bg-slate-950/70 border-t border-white/5 px-5 py-2.5 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5 text-indigo-400" />
            <span>Sincronizado con barra y pantalla de bloqueo</span>
          </div>
          <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
            Aura Material You
          </span>
        </div>
      </div>
    </div>
  );
};
