import React, { useState } from 'react';
import {
  X,
  Disc,
  Sliders,
  Sparkles,
  Zap,
  ArrowRightLeft,
  Volume2,
  Check,
  Flame
} from 'lucide-react';
import { audioEngine } from './AudioEngine';

interface DjCrossfadeModalProps {
  isOpen: boolean;
  onClose: () => void;
  crossfadeDuration: number;
  onSetCrossfade: (seconds: number) => void;
  onTriggerCrossfadeNext: () => void;
  hasNextTrack: boolean;
}

export const DjCrossfadeModal: React.FC<DjCrossfadeModalProps> = ({
  isOpen,
  onClose,
  crossfadeDuration,
  onSetCrossfade,
  onTriggerCrossfadeNext,
  hasNextTrack
}) => {
  const [bassDropEnabled, setBassDropEnabled] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  if (!isOpen) return null;

  const handleInstantTransition = () => {
    if (!hasNextTrack || isTransitioning) return;
    setIsTransitioning(true);
    if (bassDropEnabled) {
      audioEngine.setBassBoost(true, 10);
    }
    onTriggerCrossfadeNext();
    setTimeout(() => {
      setIsTransitioning(false);
    }, crossfadeDuration * 1000 || 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 text-white overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <Disc className="w-5 h-5 text-white animate-spin" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold bg-gradient-to-r from-white via-emerald-200 to-teal-200 bg-clip-text text-transparent">
                  Mezclador DJ Studio
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  SMART
                </span>
              </div>
              <p className="text-xs text-slate-400">Transiciones automáticas sin pausas ni silencios</p>
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

        {/* Crossfade Selector */}
        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <ArrowRightLeft className="w-4 h-4 text-emerald-400" />
              Tiempo de Transición (Crossfade)
            </label>
            <span className="text-xs font-mono font-bold text-emerald-400">
              {crossfadeDuration === 0 ? 'Sin Crossfade (Corte)' : `${crossfadeDuration} Segundos`}
            </span>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {[0, 3, 5, 8, 12].map((sec) => (
              <button
                key={sec}
                onClick={() => onSetCrossfade(sec)}
                className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                  crossfadeDuration === sec
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                    : 'bg-slate-800/70 text-slate-400 hover:text-white'
                }`}
              >
                {sec === 0 ? '0s' : `${sec}s`}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-slate-400">
            {crossfadeDuration === 0
              ? 'Las canciones cambian al terminar con corte directo.'
              : `La canción actual se desvanece suavemente mientras la siguiente entra durante ${crossfadeDuration} segundos, simulando a un DJ en vivo.`}
          </p>
        </div>

        {/* Bass Drop Boost Toggle */}
        <div className="mt-5 p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Flame className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Efecto Bass Drop al Mezclar</p>
              <p className="text-[10px] text-slate-400">Potencia los graves al entrar la nueva canción</p>
            </div>
          </div>
          <button
            onClick={() => setBassDropEnabled(!bassDropEnabled)}
            className={`w-12 h-6 rounded-full transition-all relative p-0.5 ${
              bassDropEnabled ? 'bg-emerald-500' : 'bg-slate-800'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-all transform ${
                bassDropEnabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* On-the-fly DJ Transition Button */}
        <div className="mt-5">
          <button
            onClick={handleInstantTransition}
            disabled={!hasNextTrack || isTransitioning}
            className={`w-full py-4 px-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all shadow-lg ${
              !hasNextTrack
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : isTransitioning
                ? 'bg-emerald-700 text-white animate-pulse'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/30 hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            <Zap className="w-4 h-4" />
            {isTransitioning
              ? 'Mezclando en vivo...'
              : hasNextTrack
              ? 'Transición DJ a la Siguiente Canción Ahora'
              : 'Agrega canciones a la cola para mezclar'}
          </button>
        </div>
      </div>
    </div>
  );
};
