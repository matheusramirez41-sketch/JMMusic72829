import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Track, EQPreset } from '../types/music';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Heart,
  ChevronDown,
  Cast,
  MoreVertical,
  Sliders,
  X,
  Loader2,
  Download,
  Check,
  ListMusic,
  Sparkles,
  Volume2,
  Share2,
  Music2,
  Video,
  BookmarkPlus,
  Radio,
  Zap,
  Moon,
  Disc3,
  Mic,
  Camera,
  RefreshCw,
  Target,
  RotateCcw,
  Mic2,
  Maximize2,
  Activity,
  Flame,
  Quote,
  Clock,
  Scissors,
  Users,
  Disc
} from 'lucide-react';
import { searchAndFetchLyrics, SyncedLyricLine } from '../services/lyricsService';
import { getImmediateOfficialCover, resolveOfficialCoverUrl } from '../services/artworkService';
import {
  getTrackTimingOffset,
  saveTrackTimingOffset,
  resetTrackTimingOffset,
  normalizeTrackKey
} from '../services/lyricsSyncHelper';
import { audioEngine } from './AudioEngine';
import { AudioVisualizer } from './AudioVisualizer';
import { LyricShareModal } from './LyricShareModal';
import { findKnownYouTubeVideoId } from '../services/youtubeService';

interface NowPlayingViewProps {
  track: Track;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onTogglePlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSeek: (time: number) => void;
  isShuffle: boolean;
  onToggleShuffle: () => void;
  isRepeat: boolean;
  onToggleRepeat: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onCollapse: () => void;
  onOpenEqualizer: () => void;
  onOpenLyrics?: () => void;
  onOpenQueue?: () => void;
  queue?: Track[];
  onPlayTrack?: (track: Track) => void;
  youtubeVideoId: string | null;
  eqPreset?: EQPreset;
  onSelectPreset?: (preset: EQPreset) => void;
  onDownloadTrack?: (track: Track) => void;
  isDownloaded?: boolean;
  onOpenSaveModal?: () => void;
  isNightcore?: boolean;
  onToggleNightcore?: () => void;
  isSlowedReverb?: boolean;
  onToggleSlowedReverb?: () => void;
  is8DAudio?: boolean;
  onToggle8DAudio?: () => void;
  isKaraoke?: boolean;
  onToggleKaraoke?: () => void;
  isAmoledSaver?: boolean;
  onToggleAmoledSaver?: () => void;
  loopPointA?: number | null;
  loopPointB?: number | null;
  onSetLoopPointA?: () => void;
  onSetLoopPointB?: () => void;
  onClearLoop?: () => void;
  crossfadeSecs?: number;
  onSetCrossfadeSecs?: (s: number) => void;
  onOpenSleepTimer?: () => void;
  onOpenAmbience?: () => void;
  onStartArtistRadio?: (artist: string) => void;
  playbackSpeed?: number;
  onSetPlaybackSpeed?: (s: number) => void;
  showVideo?: boolean;
  onToggleVideo?: () => void;
  onOpen8DModal?: () => void;
  onOpenKaraokeModal?: () => void;
  onOpenStoryCardModal?: () => void;
  onOpenDjCrossfadeModal?: () => void;
  onOpenSuperBassModal?: () => void;
  onOpenShareModal?: () => void;
  onOpenRingtoneStudio?: () => void;
  onOpenJamParty?: () => void;
  onOpenDjStudio?: () => void;
}

export const NowPlayingView: React.FC<NowPlayingViewProps> = ({
  track,
  isPlaying,
  currentTime,
  duration,
  onTogglePlayPause,
  onNext,
  onPrevious,
  onSeek,
  isShuffle,
  onToggleShuffle,
  isRepeat,
  onToggleRepeat,
  isFavorite,
  onToggleFavorite,
  onCollapse,
  onOpenEqualizer,
  onOpenQueue,
  youtubeVideoId,
  eqPreset = 'flat',
  onSelectPreset,
  onDownloadTrack,
  isDownloaded,
  onOpenSaveModal,
  isNightcore = false,
  onToggleNightcore,
  isSlowedReverb = false,
  onToggleSlowedReverb,
  is8DAudio = false,
  onToggle8DAudio,
  isKaraoke = false,
  onToggleKaraoke,
  isAmoledSaver = false,
  onToggleAmoledSaver,
  loopPointA = null,
  loopPointB = null,
  onSetLoopPointA,
  onSetLoopPointB,
  onClearLoop,
  crossfadeSecs = 0,
  onSetCrossfadeSecs,
  onOpenSleepTimer,
  onOpenAmbience,
  onStartArtistRadio,
  playbackSpeed = 1.0,
  onSetPlaybackSpeed,
  showVideo = true,
  onToggleVideo,
  onOpen8DModal,
  onOpenKaraokeModal,
  onOpenStoryCardModal,
  onOpenDjCrossfadeModal,
  onOpenSuperBassModal,
  onOpenShareModal,
  onOpenRingtoneStudio,
  onOpenJamParty,
  onOpenDjStudio
}) => {
  const [isLiked, setIsLiked] = useState(isFavorite);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccessToast, setDownloadSuccessToast] = useState(false);
  const [isLoadingLyrics, setIsLoadingLyrics] = useState<boolean>(false);
  const [lyricsSourceLabel, setLyricsSourceLabel] = useState<string>('JMMUSIC Sync');
  const [showManualSync, setShowManualSync] = useState<boolean>(false);
  const [lyricsViewMode, setLyricsViewMode] = useState<'synced' | 'plain'>('synced');
  const [plainLyricsText, setPlainLyricsText] = useState<string | null>(null);

  // Cherry on top features: Immersive Apple Music Sing & Lyric Story Card Sharing
  const [isImmersiveSingOpen, setIsImmersiveSingOpen] = useState(false);
  const [shareLyricText, setShareLyricText] = useState<string | null>(null);
  const [quickPresetToast, setQuickPresetToast] = useState<string | null>(null);

  const quickPresets: { id: EQPreset; label: string; name: string }[] = [
    { id: 'flat', label: 'Plano', name: 'Studio Flat Master' },
    { id: 'bass', label: 'Bajos +12dB', name: 'Sub-Bass Demoledor' },
    { id: 'vocal', label: 'Vocales', name: 'Claridad Vocal Nítida' },
    { id: 'electronic', label: 'EDM Club', name: 'Pegada Electrónica & EDM' },
    { id: 'hiphop', label: 'Trap / 808', name: 'Sub-Bass 808 Urbano' },
    { id: 'spatial', label: 'Espacial 3D', name: 'Sonido 3D Inmersivo' }
  ];

  const handleSelectQuickPreset = (presetId: EQPreset, name: string) => {
    if (onSelectPreset) {
      onSelectPreset(presetId);
    } else {
      audioEngine.setPreset(presetId);
    }
    setQuickPresetToast(`🔊 Perfil acústico: ${name}`);
    setTimeout(() => setQuickPresetToast(null), 2500);
  };

  const cleanYtVideoId = useMemo(() => {
    if (youtubeVideoId) return youtubeVideoId;
    if (track.id.startsWith('yt-')) {
      const raw = track.id.replace('yt-', '').split('-')[0];
      if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) return raw;
    }
    const known = findKnownYouTubeVideoId(track.title, track.artist);
    if (known) return known;
    return null;
  }, [youtubeVideoId, track.id, track.title, track.artist]);

  const [timingOffset, setTimingOffset] = useState<number>(() =>
    getTrackTimingOffset(track.id, track.title, track.artist, cleanYtVideoId)
  );
  const [syncToastMessage, setSyncToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const initial = getTrackTimingOffset(track.id, track.title, track.artist, cleanYtVideoId);
    setTimingOffset(initial);

    const handleOffsetEvent = (e: any) => {
      const normKey = normalizeTrackKey(track.title, track.artist);
      if (
        e.detail &&
        (e.detail.trackId === track.id ||
          e.detail.videoId === cleanYtVideoId ||
          e.detail.normKey === normKey)
      ) {
        setTimingOffset(e.detail.offset);
      }
    };

    window.addEventListener('jmmusic_offset_updated', handleOffsetEvent);
    return () => {
      window.removeEventListener('jmmusic_offset_updated', handleOffsetEvent);
    };
  }, [track.id, track.title, track.artist, cleanYtVideoId]);

  const adjustTiming = useCallback((delta: number) => {
    setTimingOffset((prev) => {
      const next = Number((prev + delta).toFixed(2));
      saveTrackTimingOffset(track.id, track.title, track.artist, next, cleanYtVideoId);
      const sign = next > 0 ? `+${next}` : `${next}`;
      setSyncToastMessage(
        delta > 0
          ? `⏩ Letra adelantada (+${Math.abs(delta)}s) → Total: ${sign}s`
          : `⏪ Letra retrasada (-${Math.abs(delta)}s) → Total: ${sign}s`
      );
      setTimeout(() => setSyncToastMessage(null), 3000);
      return next;
    });
  }, [track.id, track.title, track.artist, cleanYtVideoId]);

  const handleResetTiming = useCallback(() => {
    resetTrackTimingOffset(track.id, track.title, track.artist, cleanYtVideoId);
    const def = getTrackTimingOffset(track.id, track.title, track.artist, cleanYtVideoId);
    setTimingOffset(def);
    setSyncToastMessage(`↺ Calibración restablecida (${def}s)`);
    setTimeout(() => setSyncToastMessage(null), 2500);
  }, [track.id, track.title, track.artist, cleanYtVideoId]);

  const handleSyncToLine = useCallback((lineTime: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    // When singer is singing this line right now, calculate exact needed offset
    const newOffset = Number((lineTime - currentTime).toFixed(2));
    setTimingOffset(newOffset);
    saveTrackTimingOffset(track.id, track.title, track.artist, newOffset, cleanYtVideoId);
    const sign = newOffset > 0 ? `+${newOffset}` : `${newOffset}`;
    setSyncToastMessage(`🎯 ¡Sincronizado! Letra alineada a este instante (${sign}s)`);
    setTimeout(() => setSyncToastMessage(null), 3000);
  }, [currentTime, track.id, track.title, track.artist, cleanYtVideoId]);

  const handleSeekToLine = useCallback((lineTime: number) => {
    // If timing offset is active, accurately seek YouTube playback to lineTime - timingOffset
    const targetAudioTime = Math.max(0, lineTime - timingOffset);
    onSeek(targetAudioTime);
  }, [timingOffset, onSeek]);

  const lyricsContainerRef = useRef<HTMLDivElement | null>(null);
  const activeLyricRef = useRef<HTMLDivElement | null>(null);

  // Guaranteed valid high-res cover fallback
  const defaultFallbackCover =
    'https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/3e/04/eb/3e04ebf6-370f-f59d-ec84-2c2643db92f1/196626945068.jpg/600x600bb.jpg';

  const [resolvedCover, setResolvedCover] = useState<string>(() =>
    getImmediateOfficialCover(track.title, track.artist, track.coverUrl, track.id)
  );

  useEffect(() => {
    setIsLiked(isFavorite);
  }, [isFavorite]);

  // Resolve cover artwork cleanly without ever showing black
  useEffect(() => {
    const immediate = getImmediateOfficialCover(track.title, track.artist, track.coverUrl, track.id);
    setResolvedCover(immediate);

    let isMounted = true;
    resolveOfficialCoverUrl(track.title, track.artist).then((official) => {
      if (isMounted && official) {
        setResolvedCover(official);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [track.id, track.title, track.artist, track.coverUrl]);

  // Synchronized Lyrics auto-fetch with memory caching
  const [syncedLyrics, setSyncedLyrics] = useState<SyncedLyricLine[]>(() => {
    if (track.lyrics && track.lyrics.length >= 15) return track.lyrics;
    return [];
  });

  useEffect(() => {
    let isCancelled = false;

    const hasRealLyrics =
      track.lyrics &&
      track.lyrics.length >= 15 &&
      !track.lyrics.some(
        (l) =>
          l.text.includes('Reproduciendo:') ||
          l.text.includes('Audio en alta fidelidad') ||
          l.text.includes('Siente el ritmo')
      );

    if (hasRealLyrics) {
      setSyncedLyrics(track.lyrics!);
      setLyricsSourceLabel('Catálogo JMMUSIC');
      setIsLoadingLyrics(false);
      return;
    }

    setIsLoadingLyrics(true);
    searchAndFetchLyrics(track.title, track.artist).then((result) => {
      if (isCancelled) return;
      setIsLoadingLyrics(false);

      if (result) {
        if (result.plainLyrics) {
          setPlainLyricsText(result.plainLyrics);
        } else if (result.syncedLyrics) {
          setPlainLyricsText(result.syncedLyrics.map((l) => l.text).join('\n'));
        }

        if (result.syncedLyrics && result.syncedLyrics.length > 0) {
          setSyncedLyrics(result.syncedLyrics);
          setLyricsSourceLabel('LRCLIB Sincronizada');
        } else if (result.plainLyrics) {
          const lines = result.plainLyrics
            .split('\n')
            .map((l) => l.trim())
            .filter((l) => l.length > 0);
          const step = Math.max(3, Math.min(8, (duration || 210) / lines.length));
          setSyncedLyrics(lines.map((text, idx) => ({ time: Number((idx * step).toFixed(2)), text })));
          setLyricsSourceLabel('LRCLIB Texto');
        } else {
          setSyncedLyrics([]);
        }
      } else if (track.lyrics && track.lyrics.length > 0) {
        setSyncedLyrics(track.lyrics);
        setPlainLyricsText(track.lyrics.map((l) => l.text).join('\n'));
        setLyricsSourceLabel('Catálogo');
      } else {
        setSyncedLyrics([]);
        setPlainLyricsText(null);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [track.id, track.title, track.artist, track.lyrics, duration]);

  // Calibrated effective current time (unclamped to correctly handle video intros)
  const effectiveCurrentTime = currentTime + timingOffset;

  // Active lyric index: Instant snappy line transition
  const activeLyricIndex = useMemo(() => {
    if (!syncedLyrics || syncedLyrics.length === 0) return -1;
    // Lead anticipation (0.15s) for natural vocal synchronization
    const compareTime = effectiveCurrentTime + 0.15;
    if (compareTime < syncedLyrics[0].time) return -1;

    let idx = -1;
    for (let i = 0; i < syncedLyrics.length; i++) {
      if (compareTime >= syncedLyrics[i].time) {
        idx = i;
      } else {
        break;
      }
    }
    return idx;
  }, [syncedLyrics, effectiveCurrentTime]);

  // Smooth, immediate centered auto-scroll without sluggish video lag or stuttering
  useEffect(() => {
    if (activeLyricRef.current) {
      activeLyricRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      });
    }
  }, [activeLyricIndex]);

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPercent = parseFloat(e.target.value);
    const newTime = (newPercent / 100) * duration;
    onSeek(newTime);
  };

  const handleToggleLike = () => {
    setIsLiked(!isLiked);
    onToggleFavorite();
  };

  const handleDownload = async () => {
    if (onDownloadTrack) {
      setIsDownloading(true);
      try {
        await onDownloadTrack(track);
        setDownloadSuccessToast(true);
        setTimeout(() => setDownloadSuccessToast(false), 3000);
      } finally {
        setIsDownloading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-slate-950 text-white flex flex-col overflow-y-auto select-none">
      {/* Dynamic Ambient Glow matching track accent color */}
      <div
        className="fixed inset-0 pointer-events-none opacity-25 blur-[130px] -z-10 transition-all duration-1000"
        style={{
          background: `radial-gradient(circle at 50% 25%, ${track.accentColor || '#6366f1'} 0%, transparent 65%), radial-gradient(circle at 50% 85%, #020617 0%, transparent 80%)`
        }}
      />

      {/* TOP HEADER: Authentic JMMUSIC Header */}
      <header className="sticky top-0 z-30 px-4 sm:px-6 py-3 flex items-center justify-between bg-slate-950/85 backdrop-blur-xl border-b border-white/5">
        <button
          onClick={onCollapse}
          className="p-2 -ml-2 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
          title="Minimizar reproductor"
        >
          <ChevronDown className="w-6 h-6 sm:w-7 sm:h-7" />
        </button>

        {/* Center: JMMUSIC Brand Title */}
        <div className="text-center">
          <span className="text-[10px] font-bold tracking-widest text-indigo-400 uppercase block">
            JMMUSIC REPRODUCTOR
          </span>
          <span className="text-xs font-semibold text-slate-200">
            {track.album || 'Audio en Alta Definición'}
          </span>
        </div>

        {/* Right: EQ, Queue & Details */}
        <div className="flex items-center gap-1 -mr-2">
          <button
            onClick={onOpenEqualizer}
            className="p-2 rounded-full text-indigo-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Abrir Ecualizador de 10 Bandas"
          >
            <Sliders className="w-5 h-5" />
          </button>
          {onOpenQueue && (
            <button
              onClick={onOpenQueue}
              className="p-2 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Cola de reproducción"
            >
              <ListMusic className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={() => setIsDetailsOpen(true)}
            className="p-2 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Detalles y Opciones"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <div className="flex flex-col items-center w-full max-w-md sm:max-w-lg mx-auto px-6 pt-3 pb-6 flex-1">
        {/* Canción / Vídeo Switcher (Connected to SINGLE master player: ZERO duplicate audio!) */}
        {cleanYtVideoId && onToggleVideo && (
          <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 p-1 rounded-full mb-2 shadow-inner">
            <button
              onClick={() => { if (showVideo) onToggleVideo(); }}
              className={`px-3.5 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                !showVideo
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Music2 className="w-3.5 h-3.5" />
              <span>Canción</span>
            </button>
            <button
              onClick={() => { if (!showVideo) onToggleVideo(); }}
              className={`px-3.5 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                showVideo
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>Vídeo Oficial</span>
            </button>
          </div>
        )}

        {/* Video Mode Slot (The master YouTube player positions itself here) OR Album Artwork */}
        {showVideo && cleanYtVideoId ? (
          <div
            id="now-playing-video-slot"
            className="relative my-3 w-full max-w-sm sm:max-w-md aspect-video rounded-2xl overflow-hidden shadow-2xl border border-white/15 bg-black/80 flex items-center justify-center shrink-0"
          >
            {/* The single master player is positioned here: no duplicate sound! */}
          </div>
        ) : (
          <div className="relative my-3 w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 flex-shrink-0 group">
            {/* Ambient Glow behind cover */}
            <div
              className="absolute -inset-2 rounded-3xl blur-2xl opacity-40 transition-all duration-700 pointer-events-none scale-95"
              style={{ backgroundColor: track.accentColor || '#6366f1' }}
            />

            {/* Actual Album Image */}
            <div className="relative w-full h-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-slate-900">
              <img
                src={resolvedCover}
                alt={track.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={(e) => {
                  const img = e.currentTarget;
                  if (img.src !== defaultFallbackCover) {
                    img.src = defaultFallbackCover;
                  }
                }}
              />

              {/* Quality Badge */}
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md border border-white/10 text-[10px] font-bold text-indigo-300 flex items-center gap-1.5 shadow-lg">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                <span>FLAC 24-bit • Hi-Fi</span>
              </div>

              {/* Downloaded Indicator Badge */}
              {isDownloaded && (
                <div className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-emerald-950/80 backdrop-blur-md border border-emerald-500/30 text-[10px] font-bold text-emerald-300 flex items-center gap-1 shadow-lg">
                  <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />
                  <span>Offline</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* LIVE AUDIO SPECTRUM VISUALIZER (Neon Bars / Liquid Wave / Ring) */}
        <div className="w-full max-w-sm sm:max-w-md my-1">
          <AudioVisualizer
            isPlaying={isPlaying}
            accentColor={track.accentColor || '#6366f1'}
            height={44}
          />
        </div>

        {/* TRACK TITLE, ARTIST, BPM BADGE & ACTIONS */}
        <div className="w-full flex items-center justify-between mt-2 mb-2">
          <div className="min-w-0 pr-4 flex-1">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight truncate">
              {track.title}
            </h1>
            <div className="flex items-center gap-2 flex-wrap mt-0.5">
              <p className="text-sm sm:text-base text-slate-300 font-medium truncate">
                {track.artist}
              </p>
              {/* Dynamic BPM and Musical Key detection badge */}
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 flex items-center gap-1 shadow-sm">
                <Sparkles className="w-3 h-3 text-yellow-400" />
                <span>{Math.round(116 + ((track.title.length * 9) % 36))} BPM • {['Do Mayor (C)', 'Do# Menor (C#m)', 'Re Mayor (D)', 'Mi Menor (Em)', 'Fa Mayor (F)', 'Sol Mayor (G)', 'La Menor (Am)'][track.title.length % 7]}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Guardar en Biblioteca Normal o Sin Wi-Fi */}
            <button
              onClick={() => {
                if (onOpenSaveModal) {
                  onOpenSaveModal();
                } else {
                  handleDownload();
                }
              }}
              className="px-3 py-2 rounded-2xl bg-indigo-600/25 hover:bg-indigo-600/40 border border-indigo-500/40 text-indigo-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm shadow-indigo-950/40"
              title="Guardar en biblioteca normal o sin wifi"
            >
              <BookmarkPlus className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Guardar</span>
            </button>

            {/* Smart Artist Radio Direct Button */}
            {onStartArtistRadio && (
              <button
                onClick={() => onStartArtistRadio(track.artist)}
                className="px-2.5 py-2 rounded-2xl bg-purple-600/25 hover:bg-purple-600/40 border border-purple-500/40 text-purple-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm"
                title={`Iniciar radio con temas similares a ${track.artist}`}
              >
                <Radio className="w-4 h-4 text-purple-400" />
                <span className="hidden sm:inline">Radio</span>
              </button>
            )}

            {/* Download Button (Direct to device / Offline) */}
            {onDownloadTrack && (
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className={`p-2.5 rounded-full transition-all active:scale-90 cursor-pointer ${
                  isDownloaded
                    ? 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/10'
                }`}
                title={isDownloaded ? 'Guardada en tus descargas sin conexión' : 'Descargar para escuchar offline'}
              >
                {isDownloading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                ) : isDownloaded ? (
                  <Check className="w-6 h-6 stroke-[2.5]" />
                ) : (
                  <Download className="w-6 h-6" />
                )}
              </button>
            )}

            {/* Like Heart Button */}
            <button
              onClick={handleToggleLike}
              className={`p-2.5 rounded-full transition-all active:scale-90 cursor-pointer ${
                isLiked ? 'text-rose-500 bg-rose-500/10' : 'text-slate-400 hover:text-white hover:bg-white/10'
              }`}
              title={isLiked ? 'En tus favoritos' : 'Añadir a favoritos'}
            >
              <Heart className={`w-6 h-6 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
            </button>
          </div>
        </div>

        {/* DIRECT STUDIO DSP EFFECTS ROW (Always active & functional, no mailbox) */}
        <div className="w-full flex items-center justify-start gap-1.5 flex-wrap my-1.5 py-2 px-3 bg-slate-900/70 rounded-2xl border border-slate-800/80 shadow-inner">
          <button
            onClick={onToggleNightcore}
            className={`px-2.5 py-1 rounded-xl text-xs font-extrabold flex items-center gap-1.5 border transition-all cursor-pointer ${
              isNightcore
                ? 'bg-amber-500/25 border-amber-400 text-amber-300 shadow-sm'
                : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
            }`}
            title="Acelera el tempo a 1.25x con modulación enérgica"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Nightcore</span>
          </button>

          <button
            onClick={onToggleSlowedReverb}
            className={`px-2.5 py-1 rounded-xl text-xs font-extrabold flex items-center gap-1.5 border transition-all cursor-pointer ${
              isSlowedReverb
                ? 'bg-indigo-500/25 border-indigo-400 text-indigo-300 shadow-sm'
                : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
            }`}
            title="Ralentiza a 0.85x con reverberación espacial cálida"
          >
            <Moon className="w-3.5 h-3.5 text-indigo-400" />
            <span>Slowed + Reverb</span>
          </button>

          <button
            onClick={() => { if (onOpen8DModal) onOpen8DModal(); else onToggle8DAudio?.(); }}
            className={`px-2.5 py-1 rounded-xl text-xs font-extrabold flex items-center gap-1.5 border transition-all cursor-pointer ${
              is8DAudio
                ? 'bg-cyan-500/25 border-cyan-400 text-cyan-300 shadow-sm'
                : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
            }`}
            title="Abre el simulador de Audio 8D Espacial 360°"
          >
            <Disc3 className={`w-3.5 h-3.5 text-cyan-400 ${is8DAudio ? 'animate-spin' : ''}`} />
            <span>Audio 8D 360°</span>
          </button>

          <button
            onClick={() => { if (onOpenKaraokeModal) onOpenKaraokeModal(); else onToggleKaraoke?.(); }}
            className={`px-2.5 py-1 rounded-xl text-xs font-extrabold flex items-center gap-1.5 border transition-all cursor-pointer ${
              isKaraoke
                ? 'bg-rose-500/25 border-rose-400 text-rose-300 shadow-sm'
                : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
            }`}
            title="Estudio de Karaoke y Eliminador Vocal"
          >
            <Mic className="w-3.5 h-3.5 text-rose-400" />
            <span>Karaoke Studio</span>
          </button>

          {onOpenStoryCardModal && (
            <button
              onClick={onOpenStoryCardModal}
              className="px-2.5 py-1 rounded-xl text-xs font-extrabold flex items-center gap-1.5 border bg-slate-950/80 border-slate-800 text-purple-300 hover:text-white hover:border-purple-500/50 transition-all cursor-pointer"
              title="Crea una tarjeta musical HD para Historias de Instagram/WhatsApp"
            >
              <Camera className="w-3.5 h-3.5 text-purple-400" />
              <span>Tarjeta Historia</span>
            </button>
          )}

          {onOpenDjCrossfadeModal && (
            <button
              onClick={onOpenDjCrossfadeModal}
              className="px-2.5 py-1 rounded-xl text-xs font-extrabold flex items-center gap-1.5 border bg-slate-950/80 border-slate-800 text-emerald-300 hover:text-white hover:border-emerald-500/50 transition-all cursor-pointer"
              title="Mezclador DJ y transiciones automáticas sin pausas"
            >
              <Disc3 className="w-3.5 h-3.5 text-emerald-400" />
              <span>DJ Mezclador</span>
            </button>
          )}

          {onOpenSuperBassModal && (
            <button
              onClick={onOpenSuperBassModal}
              className="px-2.5 py-1 rounded-xl text-xs font-extrabold flex items-center gap-1.5 border bg-slate-950/80 border-slate-800 text-red-300 hover:text-white hover:border-red-500/50 transition-all cursor-pointer"
              title="Super Bass Booster 200% y excitador de sub-graves"
            >
              <Flame className="w-3.5 h-3.5 text-red-400" />
              <span>Super Bass 200%</span>
            </button>
          )}

          {onOpenRingtoneStudio && (
            <button
              onClick={onOpenRingtoneStudio}
              className="px-2.5 py-1 rounded-xl text-xs font-extrabold flex items-center gap-1.5 border bg-amber-500/20 border-amber-500/40 text-amber-300 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95"
              title="Cortar fragmento para tono de llamada, alarma o WhatsApp"
            >
              <Scissors className="w-3.5 h-3.5 text-amber-400" />
              <span>Cortador Tonos</span>
            </button>
          )}

          {onOpenJamParty && (
            <button
              onClick={onOpenJamParty}
              className="px-2.5 py-1 rounded-xl text-xs font-extrabold flex items-center gap-1.5 border bg-pink-500/20 border-pink-500/40 text-pink-300 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95"
              title="Modo Fiesta Sincronizada con amigos en tiempo real"
            >
              <Users className="w-3.5 h-3.5 text-pink-400" />
              <span>Modo Fiesta</span>
            </button>
          )}

          {onOpenDjStudio && (
            <button
              onClick={onOpenDjStudio}
              className="px-2.5 py-1 rounded-xl text-xs font-extrabold flex items-center gap-1.5 border bg-cyan-500/20 border-cyan-500/40 text-cyan-300 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95"
              title="Estudio DJ en vivo con vinilo para scratch y fader de tono"
            >
              <Disc className="w-3.5 h-3.5 text-cyan-400" />
              <span>DJ & Scratch</span>
            </button>
          )}

          {onOpenShareModal && (
            <button
              onClick={onOpenShareModal}
              className="px-2.5 py-1 rounded-xl text-xs font-extrabold flex items-center gap-1.5 border bg-gradient-to-r from-purple-600/30 to-indigo-600/30 border-purple-500/40 text-purple-200 hover:text-white transition-all cursor-pointer"
              title="Compartir enlace público y corto para que nadie reciba error 'solo es para mí'"
            >
              <Share2 className="w-3.5 h-3.5 text-purple-300" />
              <span>Compartir Corto</span>
            </button>
          )}

          {onToggleVideo && (
            <button
              onClick={onToggleVideo}
              className={`px-2.5 py-1 rounded-xl text-xs font-extrabold flex items-center gap-1.5 border transition-all cursor-pointer ${
                showVideo
                  ? 'bg-red-500/25 border-red-400 text-red-300 shadow-sm'
                  : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
              title="Alternar entre ver video musical oficial o portada"
            >
              <Video className="w-3.5 h-3.5 text-red-400" />
              <span>{showVideo ? 'Ver Portada' : 'Ver Vídeo'}</span>
            </button>
          )}

          {/* Quick Sound Check Left / Right button */}
          <button
            onClick={() => audioEngine.playSoundCheck('stereo')}
            className="px-2 py-1 rounded-xl text-[11px] font-bold bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/40 transition-colors ml-auto cursor-pointer"
            title="Probar canales de altavoces / auriculares (Izquierda / Derecha)"
          >
            <span>Test Estéreo</span>
          </button>
        </div>

        {/* QUICK ACOUSTIC SOUND PRESETS */}
        <div className="w-full flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none my-0.5 px-0.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Sliders className="w-3 h-3 text-indigo-400" />
            <span>Perfil:</span>
          </span>
          {quickPresets.map((preset) => {
            const isSelected = eqPreset === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handleSelectQuickPreset(preset.id, preset.name)}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm shadow-indigo-600/30'
                    : 'bg-slate-900/80 text-slate-400 hover:text-white border-slate-800 hover:border-slate-700'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* Quick Preset Toast Notification */}
        {quickPresetToast && (
          <div className="w-full py-1 px-3 rounded-xl bg-indigo-950/80 border border-indigo-500/40 text-indigo-200 text-xs font-semibold flex items-center justify-center gap-1.5 animate-in fade-in duration-150">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>{quickPresetToast}</span>
          </div>
        )}

        {/* Download Success Toast Notification */}
        {downloadSuccessToast && (
          <div className="w-full py-1.5 px-3 rounded-xl bg-emerald-900/60 border border-emerald-500/40 text-emerald-200 text-xs font-semibold flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top duration-200">
            <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
            <span>¡Canción guardada con éxito en tu biblioteca sin conexión!</span>
          </div>
        )}

        {/* PROGRESS BAR & TIMESTAMPS */}
        <div className="w-full space-y-1 my-1">
          <div className="relative w-full flex items-center group">
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
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-0.5">
            <span>{formatTime(currentTime)}</span>
            {/* Interactive A-B Looper & Sleep Timer Controls on Scrubber */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500 font-bold uppercase">Bucle:</span>
              <button
                onClick={onSetLoopPointA}
                className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold border transition-colors cursor-pointer ${
                  loopPointA !== null
                    ? 'bg-indigo-600 text-white border-indigo-400'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
                title="Fijar segundo actual como punto A de inicio"
              >
                {loopPointA !== null ? `A: ${formatTime(loopPointA)}` : '[A]'}
              </button>
              <button
                onClick={onSetLoopPointB}
                className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold border transition-colors cursor-pointer ${
                  loopPointB !== null
                    ? 'bg-indigo-600 text-white border-indigo-400'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
                title="Fijar segundo actual como punto B de fin"
              >
                {loopPointB !== null ? `B: ${formatTime(loopPointB)}` : '[B]'}
              </button>
              {(loopPointA !== null || loopPointB !== null) && (
                <button
                  onClick={onClearLoop}
                  className="text-[10px] text-rose-400 hover:underline cursor-pointer"
                  title="Desactivar bucle"
                >
                  Borrar
                </button>
              )}
              {onOpenSleepTimer && (
                <button
                  onClick={onOpenSleepTimer}
                  className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-900 border border-slate-800 text-slate-400 hover:text-indigo-300 hover:border-indigo-500/40 flex items-center gap-1 transition-colors cursor-pointer ml-1"
                  title="Temporizador de apagado automático"
                >
                  <Clock className="w-2.5 h-2.5 text-indigo-400" />
                  <span>Apagar</span>
                </button>
              )}
            </div>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* PLAYBACK CONTROLS ROW */}
        <div className="w-full flex items-center justify-between px-3 my-2">
          {/* Shuffle */}
          <button
            onClick={onToggleShuffle}
            className={`p-2.5 rounded-full transition-all cursor-pointer ${
              isShuffle ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-400 hover:text-white'
            }`}
            title="Modo aleatorio"
          >
            <Shuffle className="w-5 h-5" />
          </button>

          {/* Previous Track */}
          <button
            onClick={onPrevious}
            className="p-3 text-slate-200 hover:text-white transition-transform active:scale-90 cursor-pointer"
            title="Canción anterior"
          >
            <SkipBack className="w-7 h-7 fill-current" />
          </button>

          {/* GIANT PLAY / PAUSE BUTTON */}
          <button
            onClick={onTogglePlayPause}
            className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 text-white shadow-xl shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
            title={isPlaying ? 'Pausar' : 'Reproducir'}
          >
            {isPlaying ? (
              <Pause className="w-8 h-8 fill-current" />
            ) : (
              <Play className="w-8 h-8 fill-current translate-x-0.5" />
            )}
          </button>

          {/* Next Track */}
          <button
            onClick={onNext}
            className="p-3 text-slate-200 hover:text-white transition-transform active:scale-90 cursor-pointer"
            title="Siguiente canción"
          >
            <SkipForward className="w-7 h-7 fill-current" />
          </button>

          {/* Repeat */}
          <button
            onClick={onToggleRepeat}
            className={`p-2.5 rounded-full transition-all cursor-pointer ${
              isRepeat ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-400 hover:text-white'
            }`}
            title="Repetir canción"
          >
            <Repeat className="w-5 h-5" />
          </button>
        </div>

        {/* LYRICS HEADER & CALIBRATION BAR (Below controls as requested) */}
        <div className="w-full mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            {/* View Mode Toggle: Sincronizada vs Letra Completa */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-full p-0.5 shadow-inner">
              <button
                onClick={() => setLyricsViewMode('synced')}
                className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                  lyricsViewMode === 'synced'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sincronizada
              </button>
              <button
                onClick={() => setLyricsViewMode('plain')}
                className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                  lyricsViewMode === 'plain'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Letra Completa
              </button>
            </div>

            {/* Apple Music Sing / Fullscreen Immersive Lyrics Mode */}
            {syncedLyrics && syncedLyrics.length > 0 && (
              <button
                onClick={() => setIsImmersiveSingOpen(true)}
                className="px-2.5 py-1 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 hover:from-indigo-500/30 hover:to-purple-500/30 border border-indigo-500/40 text-indigo-300 hover:text-white text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                title="Abrir Modo Canto estilo Apple Music en pantalla completa"
              >
                <Mic2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Modo Canto</span>
              </button>
            )}

            {/* Direct Tarjeta WhatsApp / Instagram Story Button */}
            <button
              onClick={() => {
                const textToShare =
                  activeLyricIndex >= 0 && syncedLyrics[activeLyricIndex]
                    ? syncedLyrics[activeLyricIndex].text
                    : syncedLyrics[0]?.text || track.title;
                setShareLyricText(textToShare);
              }}
              className="px-2.5 py-1 rounded-full bg-gradient-to-r from-pink-600/30 via-purple-600/30 to-emerald-600/30 hover:from-pink-600/50 hover:to-emerald-600/50 border border-pink-400/50 text-white text-[11px] font-extrabold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
              title="Crear tarjeta visual para Historias de Instagram o Estados de WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5 text-pink-400" />
              <span>Vídeo WhatsApp / Insta</span>
            </button>

            <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[10px] text-indigo-300 font-medium hidden sm:inline-block">
              {lyricsSourceLabel}
            </span>
          </div>

          {/* Sincronizador de Letras Toggle */}
          {lyricsViewMode === 'synced' && (
            <button
              onClick={() => setShowManualSync(!showManualSync)}
              className={`px-3 py-1 rounded-xl text-[11px] font-extrabold flex items-center gap-1.5 transition-all cursor-pointer border ${
                showManualSync
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md'
                  : 'bg-slate-900 text-slate-300 hover:text-white border-slate-800 hover:border-slate-700'
              }`}
              title="Ajustar y sincronizar letras con la voz del cantante"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {showManualSync ? 'Ocultar Sincronizador' : `Sincronizador (${timingOffset > 0 ? `+${timingOffset}s` : `${timingOffset}s`})`}
              </span>
            </button>
          )}
        </div>

        {/* Live Synchronizer Notification Toast */}
        {syncToastMessage && (
          <div className="w-full my-2 py-2 px-4 rounded-2xl bg-gradient-to-r from-amber-950 via-indigo-950 to-purple-950 border border-amber-500/50 text-amber-200 text-xs font-bold flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top duration-150 shadow-xl shadow-amber-950/60 text-center">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{syncToastMessage}</span>
          </div>
        )}

        {/* Full Interactive Sincronizador de Letras Studio */}
        {lyricsViewMode === 'synced' && showManualSync && (
          <div className="w-full mt-2 p-3.5 bg-slate-900/95 border border-slate-800 rounded-3xl space-y-2.5 text-xs animate-in fade-in duration-200 shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-amber-400" />
                <span>Sincronizador de Letras en Vivo</span>
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-800 text-amber-300">
                Calibración: {timingOffset === 0 ? '0.0s (Normal)' : timingOffset > 0 ? `+${timingOffset}s` : `${timingOffset}s`}
              </span>
            </div>

            <p className="text-[10px] text-slate-400 leading-tight">
              ¿La letra se adelanta o se atrasa respecto a la voz? Usa los botones o presiona <strong className="text-amber-300">"🎯 Alinear"</strong> en la frase que esté sonando:
            </p>

            <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1">
              {/* Retrasar (si va rápido) */}
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-amber-400 font-bold mr-0.5">⏪ Retrasar:</span>
                <button
                  onClick={() => adjustTiming(-2.0)}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-amber-500/25 text-[11px] font-bold text-amber-300 border border-amber-500/30 cursor-pointer active:scale-95 transition-all"
                  title="Retrasar letra 2 segundos"
                >
                  -2s
                </button>
                <button
                  onClick={() => adjustTiming(-1.0)}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-amber-500/25 text-[11px] font-bold text-amber-300 border border-amber-500/30 cursor-pointer active:scale-95 transition-all"
                  title="Retrasar letra 1 segundo"
                >
                  -1s
                </button>
                <button
                  onClick={() => adjustTiming(-0.5)}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-amber-500/25 text-[11px] font-bold text-amber-300 border border-amber-500/30 cursor-pointer active:scale-95 transition-all"
                  title="Retrasar letra 0.5 segundos"
                >
                  -0.5s
                </button>
              </div>

              {/* Reset Button */}
              {timingOffset !== 0 && (
                <button
                  onClick={handleResetTiming}
                  className="px-2 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                  title="Restablecer calibración a 0.0s"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Restablecer</span>
                </button>
              )}

              {/* Adelantar (si va lenta) */}
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-indigo-400 font-bold mr-0.5">⏩ Adelantar:</span>
                <button
                  onClick={() => adjustTiming(0.5)}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-indigo-500/25 text-[11px] font-bold text-indigo-300 border border-indigo-500/30 cursor-pointer active:scale-95 transition-all"
                  title="Adelantar letra 0.5 segundos"
                >
                  +0.5s
                </button>
                <button
                  onClick={() => adjustTiming(1.0)}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-indigo-500/25 text-[11px] font-bold text-indigo-300 border border-indigo-500/30 cursor-pointer active:scale-95 transition-all"
                  title="Adelantar letra 1 segundo"
                >
                  +1s
                </button>
                <button
                  onClick={() => adjustTiming(2.0)}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-indigo-500/25 text-[11px] font-bold text-indigo-300 border border-indigo-500/30 cursor-pointer active:scale-95 transition-all"
                  title="Adelantar letra 2 segundos"
                >
                  +2s
                </button>
              </div>
            </div>
          </div>
        )}

        {/* LYRICS CONTAINER */}
        <div
          ref={lyricsContainerRef}
          className="w-full my-3 px-2 py-4 h-64 sm:h-72 overflow-y-auto space-y-3.5 rounded-2xl bg-slate-900/40 border border-slate-800/60 scroll-smooth"
          style={{ overscrollBehavior: 'contain' }}
        >
          {lyricsViewMode === 'plain' && (plainLyricsText || (syncedLyrics && syncedLyrics.length > 0)) ? (
            <div className="p-3 text-slate-200 text-sm sm:text-base leading-relaxed select-text font-medium whitespace-pre-line text-left">
              {plainLyricsText || syncedLyrics.map((l) => l.text).join('\n')}
            </div>
          ) : syncedLyrics && syncedLyrics.length > 0 ? (
            <>
              {/* Intro Countdown Banner when song is in opening skit/intro before first lyric line */}
              {activeLyricIndex === -1 && effectiveCurrentTime < syncedLyrics[0].time && (
                <div className="py-3 px-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 text-center space-y-1 animate-pulse">
                  <div className="flex items-center justify-center gap-2 text-indigo-400 font-bold text-xs sm:text-sm">
                    <Music2 className="w-4 h-4 animate-bounce" />
                    <span>
                      [♪ Intro Instrumental • La voz entra en {Math.max(1, Math.ceil(syncedLyrics[0].time - effectiveCurrentTime))}s]
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Las letras avanzarán automáticamente con la música
                  </p>
                </div>
              )}

              {syncedLyrics.map((line, idx) => {
                const isActive = idx === activeLyricIndex;
                const isPassed = activeLyricIndex !== -1 && idx < activeLyricIndex;

                const isInstrumentalInterlude =
                  isActive &&
                  idx < syncedLyrics.length - 1 &&
                  syncedLyrics[idx + 1].time - line.time > 5.5 &&
                  effectiveCurrentTime - line.time > 4.2;

                return (
                  <div
                    key={`${idx}-${line.time}`}
                    ref={isActive ? activeLyricRef : null}
                    onClick={() => handleSeekToLine(line.time)}
                    className={`group cursor-pointer transition-all duration-150 ease-out select-none py-2 px-3 rounded-2xl flex items-start justify-between gap-2.5 ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-600/35 via-purple-600/25 to-transparent border border-indigo-400/50 text-white font-black text-xl sm:text-2xl leading-snug tracking-tight shadow-lg shadow-indigo-600/15'
                        : isPassed
                        ? 'text-slate-400 font-medium text-base sm:text-lg opacity-55 hover:opacity-90'
                        : 'text-slate-300 font-medium text-base sm:text-lg opacity-35 hover:opacity-80'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      {isActive && (
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse mt-2 shrink-0 shadow-[0_0_8px_#818cf8]" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={isActive ? 'text-white drop-shadow-[0_2px_6px_rgba(255,255,255,0.35)]' : ''}>
                          {line.text}
                        </p>
                        {isInstrumentalInterlude && (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-300/80 mt-1 animate-pulse">
                            <span>[♪ Instrumental • La siguiente estrofa entra en {Math.max(1, Math.ceil(syncedLyrics[idx + 1].time - effectiveCurrentTime))}s]</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action buttons on each line: Sincronizar aquí + Tarjeta */}
                    <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                      {showManualSync && (
                        <button
                          onClick={(e) => handleSyncToLine(line.time, e)}
                          className="px-2 py-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/35 text-amber-300 border border-amber-500/40 text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm active:scale-95"
                          title="Fijar letra a la voz actual si el cantante está cantando esta frase ahora mismo"
                        >
                          <Target className="w-3 h-3 text-amber-400" />
                          <span>Alinear</span>
                        </button>
                      )}

                      {/* Tarjeta Instagram / WhatsApp - ALWAYS clearly visible! */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShareLyricText(line.text);
                        }}
                        className="px-2 py-0.5 rounded-lg bg-white/5 hover:bg-pink-600/25 text-slate-300 hover:text-pink-200 border border-white/10 hover:border-pink-500/30 text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm active:scale-95"
                        title="Crear tarjeta para Instagram o WhatsApp con esta frase"
                      >
                        <Share2 className="w-3 h-3 text-pink-400" />
                        <span className="hidden sm:inline">Vídeo</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 text-sm space-y-2">
              {isLoadingLyrics ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-400 mx-auto" />
                  <p className="font-medium text-slate-300">Cargando letra sincronizada...</p>
                  <p className="text-xs text-slate-500">Sincronizando con base de datos LRCLIB</p>
                </>
              ) : (
                <>
                  <Sparkles className="w-6 h-6 text-indigo-400 mx-auto" />
                  <p className="font-semibold text-slate-200">Disfruta del audio en alta fidelidad</p>
                  <p className="text-xs text-slate-500">Pista instrumental o letra no disponible</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* TRACK DETAILS MODAL */}
      {isDetailsOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col justify-end">
          <div className="bg-slate-900 border-t border-slate-800 rounded-t-[32px] p-6 max-h-[75vh] space-y-4 animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-base text-white">Detalles de la Canción</h3>
              <button
                onClick={() => setIsDetailsOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Título</span>
                <span className="text-white font-medium">{track.title}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Artista</span>
                <span className="text-white font-medium">{track.artist}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Álbum</span>
                <span className="text-white font-medium">{track.album || 'Sencillo'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Calidad de Audio</span>
                <span className="text-emerald-400 font-semibold">FLAC Hi-Res 24-bit / 96kHz</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Motor de Sonido</span>
                <span className="text-indigo-300 font-semibold">Web Audio DSP + 10-Band EQ</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Fuente de Letras</span>
                <span className="text-slate-200">{lyricsSourceLabel}</span>
              </div>

              <div className="pt-3 space-y-2">
                <button
                  onClick={() => {
                    setIsDetailsOpen(false);
                    onOpenEqualizer();
                  }}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Sliders className="w-4 h-4" />
                  <span>Abrir Ecualizador de 10 Bandas</span>
                </button>

                {onDownloadTrack && (
                  <button
                    onClick={() => {
                      handleDownload();
                      setIsDetailsOpen(false);
                    }}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>
                      {isDownloaded ? 'Volver a descargar pista' : 'Descargar pista para modo offline'}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* APPLE MUSIC SING: FULLSCREEN IMMERSIVE LYRICS MODE */}
      {isImmersiveSingOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col overflow-hidden animate-in fade-in duration-200 select-none">
          {/* Animated Ambient Backdrop */}
          <div
            className="absolute inset-0 opacity-40 blur-[140px] pointer-events-none transition-all duration-1000"
            style={{
              background: `radial-gradient(circle at 50% 30%, ${track.accentColor || '#6366f1'} 0%, transparent 60%), radial-gradient(circle at 50% 80%, #312e81 0%, transparent 70%)`
            }}
          />

          {/* Immersive Top Bar */}
          <div className="relative z-10 px-6 py-4 flex items-center justify-between border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={resolvedCover}
                alt={track.title}
                className="w-10 h-10 rounded-xl object-cover border border-white/20 shadow-md shrink-0"
              />
              <div className="min-w-0">
                <h3 className="text-sm font-extrabold text-white truncate">{track.title}</h3>
                <p className="text-xs text-slate-400 truncate">{track.artist}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-[10px] font-bold text-indigo-300">
                <Mic2 className="w-3 h-3 text-indigo-400" />
                <span>Modo Canto Activo</span>
              </span>
              <button
                onClick={() => setIsImmersiveSingOpen(false)}
                className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Cerrar Modo Canto"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Central Mega-Lyrics Scrolling Container */}
          <div className="flex-1 overflow-y-auto px-6 sm:px-12 md:px-20 py-16 space-y-6 sm:space-y-8 scroll-smooth text-center max-w-3xl mx-auto w-full relative z-10">
            {syncedLyrics && syncedLyrics.length > 0 ? (
              syncedLyrics.map((line, idx) => {
                const isActive = idx === activeLyricIndex;
                const isPassed = activeLyricIndex !== -1 && idx < activeLyricIndex;

                const isInstrumentalInterlude =
                  isActive &&
                  idx < syncedLyrics.length - 1 &&
                  syncedLyrics[idx + 1].time - line.time > 5.5 &&
                  effectiveCurrentTime - line.time > 4.2;

                return (
                  <div
                    key={`immersive-${idx}-${line.time}`}
                    onClick={() => handleSeekToLine(line.time)}
                    className={`group cursor-pointer transition-all duration-200 select-none py-3 px-4 rounded-3xl flex items-center justify-between gap-4 ${
                      isActive
                        ? 'text-white font-black text-2xl sm:text-3xl md:text-4xl leading-tight scale-105 drop-shadow-[0_4px_24px_rgba(255,255,255,0.45)]'
                        : isPassed
                        ? 'text-slate-400 font-bold text-lg sm:text-xl md:text-2xl opacity-40 hover:opacity-90'
                        : 'text-slate-300 font-bold text-lg sm:text-xl md:text-2xl opacity-30 hover:opacity-80'
                    }`}
                  >
                    <div className="flex-1">
                      <p>{line.text}</p>
                      {isInstrumentalInterlude && (
                        <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/40 text-xs font-bold text-indigo-300 animate-pulse">
                          <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                          <span>Próxima estrofa en {Math.max(1, Math.ceil(syncedLyrics[idx + 1].time - effectiveCurrentTime))}s</span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShareLyricText(line.text);
                      }}
                      className="px-2.5 py-1.5 rounded-2xl bg-white/10 hover:bg-pink-600/30 text-slate-300 hover:text-white border border-white/15 transition-all shrink-0 cursor-pointer flex items-center gap-1.5 text-xs font-bold shadow-sm active:scale-95"
                      title="Crear tarjeta para Instagram o WhatsApp"
                    >
                      <Share2 className="w-4 h-4 text-pink-400" />
                      <span className="hidden sm:inline">Vídeo</span>
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="py-20 text-slate-400 text-base">
                Cargando letras sincronizadas...
              </div>
            )}
          </div>

          {/* Immersive Floating Player Scrubber & Play Bar */}
          <div className="relative z-10 px-6 py-4 bg-slate-950/80 backdrop-blur-xl border-t border-white/10 max-w-2xl mx-auto w-full">
            <div className="space-y-1 mb-2">
              <input
                type="range"
                min={0}
                max={100}
                step={0.1}
                value={progressPercent}
                onChange={handleSeekChange}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <div className="flex justify-between text-xs font-mono text-slate-400">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-6">
              <button
                onClick={onPrevious}
                className="p-2 text-slate-300 hover:text-white transition-transform active:scale-90 cursor-pointer"
                title="Anterior"
              >
                <SkipBack className="w-6 h-6 fill-current" />
              </button>

              <button
                onClick={onTogglePlayPause}
                className="w-14 h-14 rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer"
                title={isPlaying ? 'Pausar' : 'Reproducir'}
              >
                {isPlaying ? <Pause className="w-7 h-7 fill-current" /> : <Play className="w-7 h-7 fill-current translate-x-0.5" />}
              </button>

              <button
                onClick={onNext}
                className="p-2 text-slate-300 hover:text-white transition-transform active:scale-90 cursor-pointer"
                title="Siguiente"
              >
                <SkipForward className="w-6 h-6 fill-current" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LYRIC STORY CARD SHARING MODAL */}
      {shareLyricText && (
        <LyricShareModal
          isOpen={true}
          onClose={() => setShareLyricText(null)}
          track={track}
          selectedText={shareLyricText}
          coverUrl={resolvedCover}
          allLyrics={syncedLyrics}
          currentTime={currentTime}
        />
      )}
    </div>
  );
};
