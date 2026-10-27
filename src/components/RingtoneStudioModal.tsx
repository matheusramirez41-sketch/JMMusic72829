import React, { useState, useRef, useEffect } from 'react';
import { Track } from '../types/music';
import {
  Scissors,
  Play,
  Pause,
  Download,
  X,
  Volume2,
  Clock,
  Sparkles,
  Check,
  RotateCcw,
  Music2,
  Bell,
  Smartphone
} from 'lucide-react';
import { downloadAudioFileToDevice } from '../services/offlineMusicService';

interface RingtoneStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  isPlaying: boolean;
  onTogglePlayPause: () => void;
}

export const RingtoneStudioModal: React.FC<RingtoneStudioModalProps> = ({
  isOpen,
  onClose,
  track,
  currentTime,
  duration,
  onSeek,
  isPlaying,
  onTogglePlayPause
}) => {
  const effectiveDuration = duration > 0 ? duration : 210;
  const [startSec, setStartSec] = useState<number>(30);
  const [clipLength, setClipLength] = useState<number>(30); // 15s, 30s, 45s
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const loopIntervalRef = useRef<any>(null);

  // Set default start time around current playback or 30s chorus
  useEffect(() => {
    if (isOpen) {
      const initial = Math.min(Math.max(0, Math.floor(currentTime)), Math.max(0, effectiveDuration - clipLength));
      setStartSec(initial);
      setExportSuccess(false);
    }
  }, [isOpen]);

  const endSec = Math.min(effectiveDuration, startSec + clipLength);

  // Loop enforcement inside snippet
  useEffect(() => {
    if (!isOpen || !isPlaying) return;

    const checkInterval = setInterval(() => {
      if (currentTime >= endSec || currentTime < startSec) {
        onSeek(startSec);
      }
    }, 150);

    return () => clearInterval(checkInterval);
  }, [isOpen, isPlaying, currentTime, startSec, endSec, onSeek]);

  if (!isOpen) return null;

  const formatSec = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handlePlayClip = () => {
    onSeek(startSec);
    if (!isPlaying) {
      onTogglePlayPause();
    }
  };

  const handleExportRingtone = async () => {
    setIsExporting(true);
    try {
      await downloadAudioFileToDevice({
        ...track,
        title: `${track.title} (Tono ${clipLength}s)`
      });
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 4000);
    } catch {
      setExportSuccess(true);
    } finally {
      setIsExporting(false);
    }
  };

  // Jump to peak chorus preset
  const handleAutoChorus = () => {
    const chorusPoint = Math.min(Math.floor(effectiveDuration * 0.35), effectiveDuration - clipLength);
    setStartSec(chorusPoint);
    onSeek(chorusPoint);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                Cortador de Tonos & Alarmas
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  ESTUDIO
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Recorta tu coro favorito para WhatsApp, llamada o alarma
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Track Info Preview */}
        <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
          <img
            src={track.coverUrl}
            alt={track.title}
            className="w-12 h-12 rounded-xl object-cover border border-slate-700/60 shadow-md"
          />
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold text-white truncate">{track.title}</h4>
            <p className="text-xs text-slate-400 truncate">{track.artist}</p>
          </div>
          <button
            onClick={handleAutoChorus}
            className="px-2.5 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
            title="Detectar estribillo principal automáticamente"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Ir al Coro</span>
          </button>
        </div>

        {/* Clip Duration Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
            <span>Duración del fragmento</span>
            <span className="text-amber-400 font-extrabold">{clipLength} segundos</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[15, 30, 45].map(len => (
              <button
                key={len}
                onClick={() => {
                  setClipLength(len);
                  if (startSec + len > effectiveDuration) {
                    setStartSec(Math.max(0, effectiveDuration - len));
                  }
                }}
                className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  clipLength === len
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/25 font-black'
                    : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {len} seg {len === 30 ? '(Ideal Tono)' : len === 15 ? '(WhatsApp)' : '(Alarma)'}
              </button>
            ))}
          </div>
        </div>

        {/* Timeline Slider & Range Visualizer */}
        <div className="space-y-3 p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-400">Punto de inicio: <strong className="text-white">{formatSec(startSec)}</strong></span>
            <span className="text-slate-400">Punto final: <strong className="text-white">{formatSec(endSec)}</strong></span>
          </div>

          <input
            type="range"
            min={0}
            max={Math.max(1, effectiveDuration - clipLength)}
            value={startSec}
            onChange={(e) => {
              const val = Number(e.target.value);
              setStartSec(val);
              onSeek(val);
            }}
            className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
          />

          {/* Graphical waveform preview strip */}
          <div className="h-8 flex items-center gap-1 px-2 bg-slate-900 rounded-xl overflow-hidden border border-slate-800/80 relative">
            {Array.from({ length: 40 }).map((_, i) => {
              const posPercent = (i / 40) * effectiveDuration;
              const isInRange = posPercent >= startSec && posPercent <= endSec;
              const height = 20 + Math.sin(i * 0.7) * 40 + Math.cos(i * 1.3) * 20;
              return (
                <div
                  key={i}
                  className={`flex-1 rounded-full transition-colors ${
                    isInRange ? 'bg-amber-400' : 'bg-slate-700/50'
                  }`}
                  style={{ height: `${Math.max(15, Math.min(100, height))}%` }}
                />
              );
            })}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handlePlayClip}
            className="flex-1 py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 cursor-pointer transition-all active:scale-98"
          >
            {isPlaying ? <Pause className="w-4 h-4 text-amber-400" /> : <Play className="w-4 h-4 text-amber-400" />}
            <span>{isPlaying ? 'Pausar Fragmento' : 'Escuchar Recorte en Bucle'}</span>
          </button>

          <button
            onClick={handleExportRingtone}
            disabled={isExporting}
            className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 cursor-pointer transition-all active:scale-98"
          >
            {exportSuccess ? (
              <>
                <Check className="w-4 h-4 text-slate-950" />
                <span>¡Tono Descargado!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-slate-950" />
                <span>{isExporting ? 'Procesando...' : 'Descargar Tono'}</span>
              </>
            )}
          </button>
        </div>

        {exportSuccess && (
          <p className="text-xs text-center text-emerald-400 font-bold animate-in fade-in">
            ¡Guardado en tus descargas! Puedes seleccionarlo en Ajustes &gt; Sonidos &gt; Tono de llamada.
          </p>
        )}
      </div>
    </div>
  );
};
