import React, { useState, useEffect } from 'react';
import {
  X,
  Mic,
  MicOff,
  Music,
  Sliders,
  Sparkles,
  Volume2,
  Gauge,
  ChevronDown,
  VolumeX,
  Radio
} from 'lucide-react';
import { Track } from '../types/music';
import { audioEngine } from './AudioEngine';

interface KaraokeStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTrack: Track | null;
  currentTime: number;
}

export const KaraokeStudioModal: React.FC<KaraokeStudioModalProps> = ({
  isOpen,
  onClose,
  currentTrack,
  currentTime
}) => {
  const [isVocalMuted, setIsVocalMuted] = useState(false);
  const [pitchShift, setPitchShift] = useState(0); // -2 to +2
  const [vocalReductionGain, setVocalReductionGain] = useState(80); // 0 to 100%
  const [micEcho, setMicEcho] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
  }, [isOpen]);

  const handleToggleVocalMute = () => {
    const next = !isVocalMuted;
    setIsVocalMuted(next);
    if (next) {
      // Vocal suppression EQ curves: cut vocal range 1k - 4k and boost sides/sub
      audioEngine.set10Bands({
        b31: 4,
        b62: 4,
        b125: 2,
        b250: -2,
        b500: -8,
        b1k: -12,
        b2k: -12,
        b4k: -8,
        b8k: 3,
        b16k: 4
      });
    } else {
      // Reset to flat/normal
      audioEngine.setPreset('flat');
    }
  };

  if (!isOpen) return null;

  // Find active lyric line based on currentTime
  const lyrics = currentTrack?.lyrics || [];
  const activeLyricIndex = lyrics.findIndex((l, i) => {
    const nextLine = lyrics[i + 1];
    if (!nextLine) return currentTime >= l.time;
    return currentTime >= l.time && currentTime < nextLine.time;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 text-white overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-60 h-60 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-600 to-purple-600 flex items-center justify-center shadow-lg shadow-pink-500/25">
              <Mic className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold bg-gradient-to-r from-white via-pink-200 to-purple-200 bg-clip-text text-transparent">
                  Estudio de Karaoke
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
                  EN VIVO
                </span>
              </div>
              <p className="text-xs text-slate-400">Atenuación vocal y teleprónter para cantar</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-full transition-all"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Vocal Remover Button */}
        <div className="mt-5">
          <button
            onClick={handleToggleVocalMute}
            className={`w-full py-4 px-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-3 transition-all shadow-lg ${
              isVocalMuted
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-pink-500/30 scale-[1.01]'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            {isVocalMuted ? (
              <>
                <VolumeX className="w-5 h-5 animate-pulse text-white" />
                <span>Modo Karaoke Activado (Voz Atenuada)</span>
              </>
            ) : (
              <>
                <Mic className="w-5 h-5 text-pink-400" />
                <span>Activar Modo Karaoke (Atenuar Voz Original)</span>
              </>
            )}
          </button>
          <p className="text-[11px] text-slate-400 text-center mt-2">
            Aísla la pista instrumental atenuando las frecuencias medias de voz humana para que cantes encima.
          </p>
        </div>

        {/* Pitch / Tone shift */}
        <div className="mt-5 p-4 bg-slate-950 border border-slate-800/80 rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-pink-400" />
              Tono de Afinación (Pitch)
            </span>
            <span className="text-xs font-mono font-bold text-pink-400">
              {pitchShift === 0 ? 'Original' : pitchShift > 0 ? `+${pitchShift} Semitonos` : `${pitchShift} Semitonos`}
            </span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {[-2, -1, 0, 1, 2].map((val) => (
              <button
                key={val}
                onClick={() => setPitchShift(val)}
                className={`py-2 rounded-xl text-xs font-semibold transition-all ${
                  pitchShift === val
                    ? 'bg-pink-600 text-white shadow-md shadow-pink-600/30'
                    : 'bg-slate-800/60 text-slate-400 hover:text-white'
                }`}
              >
                {val === 0 ? 'Normal' : val > 0 ? `+${val}` : `${val}`}
              </button>
            ))}
          </div>
        </div>

        {/* Live Teleprompter Lyrics Box */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Music className="w-4 h-4 text-purple-400" />
              Letra en Tiempo Real (Karaoke Prompter)
            </span>
            <span className="text-[10px] text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-full">
              Sincronizado
            </span>
          </div>

          <div className="p-4 bg-slate-950/90 border border-slate-800 rounded-2xl h-44 overflow-y-auto space-y-3 flex flex-col items-center justify-center text-center">
            {lyrics.length > 0 ? (
              lyrics.map((line, idx) => {
                const isActive = idx === activeLyricIndex;
                const isPast = activeLyricIndex > -1 && idx < activeLyricIndex;
                return (
                  <p
                    key={idx}
                    className={`transition-all duration-300 ${
                      isActive
                        ? 'text-lg font-extrabold text-pink-400 scale-105 drop-shadow-[0_0_12px_rgba(236,72,153,0.5)]'
                        : isPast
                        ? 'text-xs text-slate-500 opacity-60'
                        : 'text-xs text-slate-400'
                    }`}
                  >
                    {line.text}
                  </p>
                );
              })
            ) : (
              <div className="text-center py-6">
                <Music className="w-8 h-8 text-slate-600 mx-auto mb-2 animate-bounce" />
                <p className="text-sm font-semibold text-slate-300">
                  {currentTrack?.title || 'Canción actual'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  ¡Canta libremente al ritmo de la música!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
