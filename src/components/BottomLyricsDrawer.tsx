import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Track } from '../types/music';
import { Mic2, Music, Search, ChevronDown, X, Sparkles, Loader2, Quote, Share2 } from 'lucide-react';
import { searchAndFetchLyrics, SyncedLyricLine } from '../services/lyricsService';
import {
  getTrackTimingOffset,
  saveTrackTimingOffset,
  resetTrackTimingOffset,
  normalizeTrackKey
} from '../services/lyricsSyncHelper';
import { LyricShareModal } from './LyricShareModal';

interface BottomLyricsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track;
  currentTime: number;
  onSeek: (time: number) => void;
}

export const BottomLyricsDrawer: React.FC<BottomLyricsDrawerProps> = ({
  isOpen,
  onClose,
  track,
  currentTime,
  onSeek
}) => {
  const activeLineRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [syncedLines, setSyncedLines] = useState<SyncedLyricLine[]>(track.lyrics || []);
  const [plainLyrics, setPlainLyrics] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [lyricsSource, setLyricsSource] = useState<string>('Catálogo JMMUSIC');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [drawerToast, setDrawerToast] = useState<string | null>(null);
  const [shareLyricText, setShareLyricText] = useState<string | null>(null);

  const [timingOffset, setTimingOffset] = useState<number>(() =>
    getTrackTimingOffset(track.id, track.title, track.artist)
  );

  useEffect(() => {
    setTimingOffset(getTrackTimingOffset(track.id, track.title, track.artist));

    const handleOffsetEvent = (e: any) => {
      const normKey = normalizeTrackKey(track.title, track.artist);
      if (e.detail && (e.detail.trackId === track.id || e.detail.normKey === normKey)) {
        setTimingOffset(e.detail.offset);
      }
    };

    window.addEventListener('jmmusic_offset_updated', handleOffsetEvent);
    return () => {
      window.removeEventListener('jmmusic_offset_updated', handleOffsetEvent);
    };
  }, [track.id, track.title, track.artist]);

  const adjustTiming = useCallback((delta: number) => {
    setTimingOffset((prev) => {
      const next = Number((prev + delta).toFixed(2));
      saveTrackTimingOffset(track.id, track.title, track.artist, next);
      const sign = next > 0 ? `+${next}` : `${next}`;
      setDrawerToast(delta > 0 ? `⏩ +${delta}s (${sign}s)` : `⏪ ${delta}s (${sign}s)`);
      setTimeout(() => setDrawerToast(null), 2500);
      return next;
    });
  }, [track.id, track.title, track.artist]);

  const handleResetTiming = useCallback(() => {
    resetTrackTimingOffset(track.id, track.title, track.artist);
    const def = getTrackTimingOffset(track.id, track.title, track.artist);
    setTimingOffset(def);
    setDrawerToast(`↺ Calibración restablecida (${def}s)`);
    setTimeout(() => setDrawerToast(null), 2500);
  }, [track.id, track.title, track.artist]);

  const handleSyncToLine = useCallback((lineTime: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newOffset = Number((lineTime - currentTime).toFixed(2));
    setTimingOffset(newOffset);
    saveTrackTimingOffset(track.id, track.title, track.artist, newOffset);
    const sign = newOffset > 0 ? `+${newOffset}` : `${newOffset}`;
    setDrawerToast(`🎯 ¡Sincronizado! Letra alineada a este instante (${sign}s)`);
    setTimeout(() => setDrawerToast(null), 3000);
  }, [currentTime, track.id, track.title, track.artist]);

  const handleSeekToLine = useCallback((lineTime: number) => {
    const targetAudioTime = Math.max(0, lineTime - timingOffset);
    onSeek(targetAudioTime);
  }, [timingOffset, onSeek]);

  // Auto-fetch synced lyrics from LRCLIB when track changes
  useEffect(() => {
    let isCancelled = false;

    const fetchLyrics = async () => {
      if (track.lyrics && track.lyrics.length >= 15) {
        setSyncedLines(track.lyrics);
      } else {
        setSyncedLines([]);
      }
      setLyricsSource('Catálogo JMMUSIC');

      setIsLoading(true);
      const res = await searchAndFetchLyrics(track.title, track.artist);

      if (!isCancelled && res) {
        if (res.syncedLyrics && res.syncedLyrics.length > 0) {
          setSyncedLines(res.syncedLyrics);
          setPlainLyrics(null);
          setLyricsSource(`LRCLIB Sincronizada · ${res.trackTitle} (${res.artist})`);
        } else if (res.plainLyrics) {
          setPlainLyrics(res.plainLyrics);
          setLyricsSource(`LRCLIB Texto · ${res.trackTitle}`);
        }
      }
      if (!isCancelled) {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchLyrics();
    }

    return () => {
      isCancelled = true;
    };
  }, [track.id, track.title, track.artist, isOpen]);

  const handleSearchFamousLyrics = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    const res = await searchAndFetchLyrics(searchQuery.trim());
    setIsLoading(false);

    if (res && res.syncedLyrics && res.syncedLyrics.length > 0) {
      setSyncedLines(res.syncedLyrics);
      setPlainLyrics(null);
      setLyricsSource(`LRCLIB Sincronizada · ${res.trackTitle} (${res.artist})`);
      setIsSearchOpen(false);
    } else if (res && res.plainLyrics) {
      setPlainLyrics(res.plainLyrics);
      setLyricsSource(`LRCLIB Texto · ${res.trackTitle} (${res.artist})`);
      setIsSearchOpen(false);
    } else {
      setLyricsSource('No se encontraron letras');
    }
  };

  // Precise lyric timing sync: Calibrated effective current time
  const effectiveCurrentTime = currentTime + timingOffset;

  // Active lyric index: Instant snappy line transition
  const activeIndex = useMemo(() => {
    if (!syncedLines || syncedLines.length === 0) return -1;
    // Snappy vocal lead anticipation (0.15s)
    const compareTime = effectiveCurrentTime + 0.15;
    if (compareTime < syncedLines[0].time) return -1;

    let idx = -1;
    for (let i = 0; i < syncedLines.length; i++) {
      if (compareTime >= syncedLines[i].time) {
        idx = i;
      } else {
        break;
      }
    }
    return idx;
  }, [syncedLines, effectiveCurrentTime]);

  // Center active lyric line instantly and smoothly without jitter or lag
  useEffect(() => {
    if (activeLineRef.current && isOpen) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      });
    }
  }, [activeIndex, isOpen]);

  if (!isOpen) return null;

  const isIntro = activeIndex === -1 && syncedLines.length > 0 && effectiveCurrentTime < syncedLines[0].time;

  return (
    <aside
      className="fixed bottom-16 sm:bottom-18 left-0 right-0 z-35 max-h-[52vh] h-[48vh] bg-slate-950/95 backdrop-blur-2xl border-t border-slate-800 shadow-[0_-10px_35px_rgba(0,0,0,0.6)] flex flex-col transition-all duration-300 animate-in slide-in-from-bottom-6"
      aria-label="Panel inferior de letras de música"
    >
      {/* Top Grab Bar & Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 border-b border-white/10 bg-slate-900/60 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
            <Mic2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white truncate max-w-[200px] sm:max-w-xs">
                {track.title}
              </span>
              <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                Letras Abajo
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate max-w-sm">
              {track.artist} • {lyricsSource}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Direct Tarjeta WhatsApp / Instagram Story Button */}
          <button
            onClick={() => {
              const textToShare =
                activeIndex >= 0 && syncedLines[activeIndex]
                  ? syncedLines[activeIndex].text
                  : syncedLines[0]?.text || track.title;
              setShareLyricText(textToShare);
            }}
            className="px-2.5 py-1 rounded-full bg-gradient-to-r from-pink-600/30 to-purple-600/30 hover:from-pink-600/50 hover:to-purple-600/50 border border-pink-400/40 text-white text-[11px] font-extrabold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
            title="Crear tarjeta visual para Historias de Instagram o WhatsApp"
          >
            <Share2 className="w-3.5 h-3.5 text-pink-400" />
            <span className="hidden sm:inline">Vídeo WhatsApp / Insta</span>
          </button>

          {/* Search Toggle */}
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Buscar otra letra"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Close/Minimize Button */}
          <button
            onClick={onClose}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
            title="Ocultar letras"
          >
            <ChevronDown className="w-4 h-4" />
            <span className="hidden sm:inline">Ocultar</span>
          </button>
        </div>
      </div>

      {/* Floating feedback notification toast */}
      {drawerToast && (
        <div className="w-full py-1 px-3 bg-indigo-900/80 border-b border-indigo-500/30 text-indigo-100 text-xs font-semibold flex items-center justify-center gap-2 animate-in fade-in duration-200">
          <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
          <span>{drawerToast}</span>
        </div>
      )}

      {/* Optional Search Bar inside Drawer */}
      {isSearchOpen && (
        <form
          onSubmit={handleSearchFamousLyrics}
          className="p-2 sm:px-6 bg-slate-900/90 border-b border-white/10 flex items-center gap-2 shrink-0 animate-in fade-in"
        >
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar letras por nombre o artista en LRCLIB..."
            autoFocus
            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Buscar'}
          </button>
          <button
            type="button"
            onClick={() => setIsSearchOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </form>
      )}

      {/* Synced Karaoke Lines Scroll Container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-4 sm:px-8 py-10 space-y-3.5 scroll-smooth scrollbar-thin scrollbar-thumb-white/10 relative"
      >
        {isLoading && (
          <div className="flex items-center justify-center py-6 gap-2 text-indigo-400 text-xs">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Sincronizando letras de LRCLIB...</span>
          </div>
        )}

        {/* Intro Countdown */}
        {isIntro && (
          <div className="py-4 px-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-center space-y-1 animate-pulse">
            <div className="flex items-center justify-center gap-2 text-indigo-400 font-bold text-xs sm:text-sm">
              <Music className="w-4 h-4 animate-bounce" />
              <span>[Intro Instrumental • La voz empieza en {Math.max(1, Math.ceil(syncedLines[0].time - currentTime))}s]</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Las letras avanzarán automáticamente con la música
            </p>
          </div>
        )}

        {/* Plain Text Fallback */}
        {plainLyrics && !syncedLines.length && (
          <div className="py-4 whitespace-pre-line text-slate-200 text-base leading-relaxed font-medium">
            {plainLyrics}
          </div>
        )}

        {/* Synced Lyric Lines */}
        {syncedLines.map((line, index) => {
          const isActive = index === activeIndex;
          const isPassed = activeIndex !== -1 && index < activeIndex;

          const formatLineTime = (s: number) => {
            const m = Math.floor(s / 60);
            const sec = Math.floor(s % 60);
            return `${m}:${sec.toString().padStart(2, '0')}`;
          };

          return (
            <div
              key={`${index}-${line.time}`}
              ref={isActive ? activeLineRef : null}
              onClick={() => handleSeekToLine(line.time)}
              className={`cursor-pointer transition-all duration-150 ease-out select-none py-2.5 px-4 rounded-2xl group flex items-center justify-between gap-3 ${
                isActive
                  ? 'text-white text-xl sm:text-2xl font-black tracking-tight leading-snug bg-gradient-to-r from-indigo-600/40 via-purple-600/30 to-indigo-950/40 border border-indigo-400/50 shadow-lg shadow-indigo-600/20 scale-[1.01]'
                  : isPassed
                  ? 'text-slate-400 text-sm sm:text-base font-semibold opacity-60 hover:opacity-100 hover:text-slate-200'
                  : 'text-slate-300 text-sm sm:text-base font-semibold opacity-35 hover:opacity-80 hover:text-white'
              }`}
            >
              <div className="flex items-baseline justify-between gap-4 flex-1 min-w-0">
                <span className={isActive ? 'text-white drop-shadow-[0_2px_8px_rgba(255,255,255,0.4)]' : ''}>
                  {line.text}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] font-mono text-indigo-300/60 opacity-0 group-hover:opacity-100 transition-opacity">
                    {formatLineTime(line.time)}
                  </span>
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
            </div>
          );
        })}

        {syncedLines.length === 0 && !isLoading && !plainLyrics && (
          <div className="text-center py-10 text-slate-500 text-xs">
            No se encontraron letras sincronizadas para esta canción.
          </div>
        )}
      </div>

      {/* Bottom Mini Hint */}
      <div className="px-4 py-1.5 border-t border-white/5 bg-slate-950/90 text-center text-[10px] text-slate-500 flex items-center justify-center gap-1.5 shrink-0">
        <Sparkles className="w-3 h-3 text-indigo-400" />
        <span>Toca cualquier estrofa para sincronizar el audio a ese momento exacto</span>
      </div>

      {/* LYRIC STORY CARD SHARING MODAL */}
      {shareLyricText && (
        <LyricShareModal
          isOpen={true}
          onClose={() => setShareLyricText(null)}
          track={track}
          selectedText={shareLyricText}
          coverUrl={track.coverUrl}
          allLyrics={syncedLines}
          currentTime={currentTime}
        />
      )}
    </aside>
  );
};
