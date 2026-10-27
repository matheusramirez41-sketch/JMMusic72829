import React, { useState, useEffect } from 'react';
import {
  X,
  Volume2,
  VolumeX,
  Zap,
  Activity,
  Sliders,
  Sparkles,
  ShieldAlert,
  Flame,
  Radio
} from 'lucide-react';
import { audioEngine } from './AudioEngine';

interface SuperBassBoosterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SuperBassBoosterModal: React.FC<SuperBassBoosterModalProps> = ({
  isOpen,
  onClose
}) => {
  const [boostLevel, setBoostLevel] = useState(130); // 100% to 200%
  const [subBassDb, setSubBassDb] = useState(8); // 0 to 15 dB
  const [punchBassDb, setPunchBassDb] = useState(6);
  const [isSuperBassActive, setIsSuperBassActive] = useState(true);
  const [vuLevel, setVuLevel] = useState(65);

  useEffect(() => {
    if (!isOpen) return;

    // Simulate VU level activity
    const interval = setInterval(() => {
      const base = (boostLevel / 200) * 80;
      setVuLevel(Math.min(98, Math.floor(base + Math.random() * 18)));
    }, 120);

    return () => clearInterval(interval);
  }, [isOpen, boostLevel]);

  const handleApply = (newBoost: number, newSub: number, newPunch: number) => {
    setBoostLevel(newBoost);
    setSubBassDb(newSub);
    setPunchBassDb(newPunch);

    // Apply to AudioEngine
    audioEngine.setVolumeBoost(newBoost / 100);
    audioEngine.setBassBoost(true, newSub);
    audioEngine.set10Bands({
      b31: Math.min(12, newSub),
      b62: Math.min(12, newSub - 1),
      b125: Math.min(10, newPunch),
      b250: 2,
      b500: 0,
      b1k: 0,
      b2k: 1,
      b4k: 2,
      b8k: 4,
      b16k: 5
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 text-white overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-60 h-60 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-amber-600 flex items-center justify-center shadow-lg shadow-red-500/25">
              <Flame className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold bg-gradient-to-r from-white via-red-200 to-amber-200 bg-clip-text text-transparent">
                  Super Bass Booster 200%
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                  MAX
                </span>
              </div>
              <p className="text-xs text-slate-400">Amplificación extrema y sub-graves profundos</p>
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

        {/* Dynamic VU Meter */}
        <div className="mt-5 p-4 bg-slate-950 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-red-400" />
              Nivel de Potencia Acústica (VU)
            </span>
            <span className="text-xs font-mono font-bold text-amber-400">
              {vuLevel}%
            </span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden p-0.5 flex">
            <div
              className={`h-full rounded-full transition-all duration-100 ${
                vuLevel > 85
                  ? 'bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500'
                  : 'bg-gradient-to-r from-emerald-500 to-amber-500'
              }`}
              style={{ width: `${vuLevel}%` }}
            />
          </div>
        </div>

        {/* Volume Boost Slider (100% to 200%) */}
        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-red-400" />
              Potencia de Volumen Extra
            </label>
            <span className="text-sm font-black text-red-400 font-mono">
              {boostLevel}%
            </span>
          </div>
          <input
            type="range"
            min="100"
            max="200"
            step="5"
            value={boostLevel}
            onChange={(e) => handleApply(Number(e.target.value), subBassDb, punchBassDb)}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-500"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>100% (Estándar)</span>
            <span>150% (Potente)</span>
            <span className="text-red-400 font-bold">200% (Extremo)</span>
          </div>
        </div>

        {/* Sub-Bass Exciter (30Hz-80Hz) */}
        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              Sub-Woofer Bass (30Hz - 80Hz)
            </label>
            <span className="text-xs font-mono font-bold text-amber-400">
              +{subBassDb} dB
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="15"
            step="1"
            value={subBassDb}
            onChange={(e) => handleApply(boostLevel, Number(e.target.value), punchBassDb)}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
        </div>

        {/* Quick Presets */}
        <div className="mt-5">
          <span className="text-xs font-semibold text-slate-400 block mb-2">
            Perfiles Rápidos de Impacto
          </span>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Club Rave', boost: 160, sub: 12, punch: 8 },
              { label: 'Bass Boom', boost: 180, sub: 14, punch: 10 },
              { label: 'Audiófilo', boost: 110, sub: 5, punch: 4 }
            ].map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleApply(p.boost, p.sub, p.punch)}
                className="py-2.5 px-2 bg-slate-800/80 hover:bg-slate-700/80 rounded-xl text-xs font-bold text-slate-200 transition-all text-center hover:scale-[1.02] active:scale-[0.98]"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Anti-Clipping Soft Limiter Notice */}
        <div className="mt-5 p-3 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-2.5 text-xs text-red-200/90">
          <Sparkles className="w-4 h-4 text-red-400 shrink-0" />
          <span>
            Limitador de estudio dinámico activo para evitar distorsiones y saturación a volúmenes altos.
          </span>
        </div>
      </div>
    </div>
  );
};
