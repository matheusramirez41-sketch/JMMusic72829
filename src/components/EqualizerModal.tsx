import React, { useState, useEffect } from 'react';
import {
  Sliders,
  X,
  Sparkles,
  Volume2,
  Power,
  Zap,
  Waves,
  Activity,
  Maximize2,
  Check,
  RotateCcw
} from 'lucide-react';
import { EQPreset, EQ10Bands } from '../types/music';
import {
  audioEngine,
  TARGET_FREQUENCIES_HZ,
  DEFAULT_10_BANDS
} from './AudioEngine';

interface EqualizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPreset: EQPreset;
  onSelectPreset: (preset: EQPreset) => void;
}

interface PresetDef {
  id: EQPreset;
  label: string;
  desc: string;
  icon: string;
  bands: EQ10Bands;
}

const PRESETS_10_BANDS: PresetDef[] = [
  {
    id: 'flat',
    label: 'Studio Flat',
    desc: 'Audio neutral fiel al master original (0 dB).',
    icon: '⚖️',
    bands: { b31: 0, b62: 0, b125: 0, b250: 0, b500: 0, b1k: 0, b2k: 0, b4k: 0, b8k: 0, b16k: 0 }
  },
  {
    id: 'bass',
    label: 'Bajos Extremos (Sub-Bass)',
    desc: 'Impacto demoledor en 31 Hz y 62 Hz (+12 dB).',
    icon: '🔊',
    bands: { b31: 12, b62: 10, b125: 6, b250: 2, b500: 0, b1k: -1, b2k: 0, b4k: 1, b8k: 2, b16k: 3 }
  },
  {
    id: 'vocal',
    label: 'Claridad Vocal (Vocals)',
    desc: 'Resalta voces principales entre 1 kHz y 4 kHz.',
    icon: '🎙️',
    bands: { b31: -3, b62: -2, b125: 0, b250: 2, b500: 5, b1k: 8, b2k: 7, b4k: 5, b8k: 2, b16k: 1 }
  },
  {
    id: 'electronic',
    label: 'Electronic & EDM',
    desc: 'Pegada en subgraves y brillo cristalino en 16 kHz.',
    icon: '⚡',
    bands: { b31: 9, b62: 8, b125: 4, b250: 0, b500: -2, b1k: 1, b2k: 3, b4k: 6, b8k: 8, b16k: 9 }
  },
  {
    id: 'rock',
    label: 'Rock & Metal',
    desc: 'Guitarras enérgicas con pegada en bombo y caja.',
    icon: '🎸',
    bands: { b31: 6, b62: 5, b125: 2, b250: -1, b500: -2, b1k: 2, b2k: 5, b4k: 7, b8k: 6, b16k: 5 }
  },
  {
    id: 'hiphop',
    label: 'Hip-Hop & Trap',
    desc: 'Sub-bass 808 dominante con platillos nítidos.',
    icon: '🎧',
    bands: { b31: 11, b62: 9, b125: 5, b250: 1, b500: -2, b1k: 0, b2k: 2, b4k: 4, b8k: 7, b16k: 8 }
  },
  {
    id: 'acoustic',
    label: 'Acústico & Jazz',
    desc: 'Calidez analógica natural en instrumentos de cuerda.',
    icon: '🎻',
    bands: { b31: 2, b62: 3, b125: 4, b250: 3, b500: 2, b1k: 2, b2k: 3, b4k: 4, b8k: 5, b16k: 4 }
  },
  {
    id: 'spatial',
    label: 'Audio Espacial 3D',
    desc: 'Escenario inmersivo tridimensional envolvente.',
    icon: '🌌',
    bands: { b31: 5, b62: 4, b125: 2, b250: 0, b500: 2, b1k: 4, b2k: 6, b4k: 7, b8k: 8, b16k: 9 }
  }
];

const BAND_KEYS: (keyof EQ10Bands)[] = [
  'b31',
  'b62',
  'b125',
  'b250',
  'b500',
  'b1k',
  'b2k',
  'b4k',
  'b8k',
  'b16k'
];

const BAND_LABELS = [
  '31 Hz',
  '62 Hz',
  '125 Hz',
  '250 Hz',
  '500 Hz',
  '1 kHz',
  '2 kHz',
  '4 kHz',
  '8 kHz',
  '16 kHz'
];

export const EqualizerModal: React.FC<EqualizerModalProps> = ({
  isOpen,
  onClose,
  currentPreset,
  onSelectPreset
}) => {
  const [isEqActive, setIsEqActive] = useState(() => audioEngine.isEqActive());
  const [bands, setBands] = useState<EQ10Bands>(() => audioEngine.get10Bands());

  // Independent DSP Effects
  const [bassBoost, setBassBoost] = useState(() => audioEngine.isBassBoostActive());
  const [bassBoostGain, setBassBoostGain] = useState(8);

  const [virtualizer, setVirtualizer] = useState(() => audioEngine.isVirtualizerActive());
  const [virtualizerStrength, setVirtualizerStrength] = useState(60);

  const [loudness, setLoudness] = useState(() => audioEngine.isLoudnessEnhancerActive());
  const [hapticBass, setHapticBass] = useState(() => audioEngine.isHapticBassActive());

  // Real-time animated FFT visualizer bars (10 bands)
  const [fftData, setFftData] = useState<number[]>(Array(10).fill(40));

  useEffect(() => {
    if (!isOpen) return;
    let animId: number;
    const update = () => {
      setFftData(audioEngine.get10BandFrequencyData());
      animId = requestAnimationFrame(update);
    };
    animId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animId);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBandChange = (key: keyof EQ10Bands, val: number) => {
    const updated = { ...bands, [key]: val };
    setBands(updated);
    audioEngine.set10Bands(updated);
    onSelectPreset('custom');
  };

  const handleToggleEq = () => {
    const next = !isEqActive;
    setIsEqActive(next);
    audioEngine.toggleEq(next);
  };

  const handleResetFlat = () => {
    setBands({ ...DEFAULT_10_BANDS });
    audioEngine.set10Bands({ ...DEFAULT_10_BANDS });
    onSelectPreset('flat');
  };

  const handlePresetSelect = (p: PresetDef) => {
    onSelectPreset(p.id);
    setBands({ ...p.bands });
    audioEngine.set10Bands({ ...p.bands });
  };

  const handleToggleBassBoost = () => {
    const next = !bassBoost;
    setBassBoost(next);
    audioEngine.setBassBoost(next, bassBoostGain);
  };

  const handleToggleVirtualizer = () => {
    const next = !virtualizer;
    setVirtualizer(next);
    audioEngine.setVirtualizer(next, virtualizerStrength);
  };

  const handleToggleLoudness = () => {
    const next = !loudness;
    setLoudness(next);
    audioEngine.setLoudnessEnhancer(next);
  };

  const handleToggleHaptic = () => {
    const next = !hapticBass;
    setHapticBass(next);
    audioEngine.setHapticBass(next);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl my-auto bg-slate-900/95 border border-slate-700/80 rounded-[32px] shadow-2xl p-5 sm:p-8 space-y-6 text-white backdrop-blur-2xl">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-indigo-500/15 blur-3xl rounded-full pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shadow-lg">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg sm:text-xl text-white tracking-tight">
                  Ecualizador Paramétrico de 10 Bandas
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  DSP Hi-Fi
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Control de frecuencias maestras con rango dinámico de &plusmn;15 dB y motor DSP independiente
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Master On/Off Switch */}
            <button
              onClick={handleToggleEq}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                isEqActive
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{isEqActive ? 'EQ Activo' : 'EQ Bypass'}</span>
            </button>

            {/* Reset to Flat */}
            <button
              onClick={handleResetFlat}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 transition-colors"
              title="Restablecer todas las bandas a 0 dB"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Real-time Spectrum Visualizer Graph */}
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
            <span className="flex items-center gap-2 font-medium">
              <Activity className="w-4 h-4 text-indigo-400" />
              Respuesta en Frecuencia FFT en Vivo
            </span>
            <span className="font-mono text-[11px] text-slate-400">
              Escala: -15 dB a +15 dB
            </span>
          </div>

          <div className="h-20 sm:h-28 flex items-end justify-between gap-1.5 sm:gap-3 px-2 pt-2 pb-1 bg-slate-900/50 rounded-xl border border-white/5">
            {fftData.map((val, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end">
                <div
                  className="w-full rounded-t-md transition-all duration-75 relative group"
                  style={{
                    height: `${Math.max(12, val)}%`,
                    background: isEqActive
                      ? 'linear-gradient(to top, #4f46e5, #06b6d4)'
                      : '#475569',
                    opacity: isEqActive ? 0.9 : 0.4
                  }}
                />
                <span className="text-[9px] font-mono text-slate-400 mt-1 truncate">
                  {BAND_LABELS[idx]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* THE 10 SLIDERS - Responsive Grid */}
        <div className="bg-slate-950/60 border border-slate-800/60 rounded-3xl p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 pb-1 border-b border-white/5">
            <span className="font-semibold text-slate-300">10 Bandas Paramétricas (&plusmn;15 dB)</span>
            <span className="text-[11px] text-slate-400 font-mono">0 dB = Nivel de estudio</span>
          </div>

          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 sm:gap-3 py-2">
            {BAND_KEYS.map((key, idx) => {
              const val = bands[key];
              return (
                <div
                  key={key}
                  className="flex flex-col items-center gap-2 bg-slate-900/40 p-2.5 rounded-2xl border border-white/5 hover:border-indigo-500/30 transition-colors"
                >
                  {/* Gain Readout */}
                  <span
                    className={`font-mono text-[11px] font-bold ${
                      val > 0
                        ? 'text-indigo-400'
                        : val < 0
                        ? 'text-pink-400'
                        : 'text-slate-400'
                    }`}
                  >
                    {val > 0 ? `+${val}` : val}
                    <span className="text-[9px] font-normal text-slate-400">dB</span>
                  </span>

                  {/* Vertical Slider Track Container */}
                  <div className="h-36 sm:h-44 flex items-center justify-center my-1">
                    <input
                      type="range"
                      min={-15}
                      max={15}
                      step={1}
                      value={val}
                      disabled={!isEqActive}
                      onChange={(e) => handleBandChange(key, parseInt(e.target.value, 10))}
                      className="h-32 sm:h-40 w-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-all disabled:opacity-40"
                      style={{
                        writingMode: 'vertical-lr',
                        direction: 'rtl'
                      }}
                    />
                  </div>

                  {/* Band Frequency Label */}
                  <div className="text-center">
                    <div className="text-xs font-bold text-white tracking-tight">
                      {BAND_LABELS[idx]}
                    </div>
                    <div className="text-[9px] text-slate-400 uppercase tracking-wider">
                      {idx <= 1 ? 'Sub' : idx <= 3 ? 'Grave' : idx <= 6 ? 'Medio' : 'Agudo'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* INDEPENDENT DSP MODULE SWITCHES (BassBoost, Virtualizer, Loudness, Haptic) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. BassBoost */}
          <div
            onClick={handleToggleBassBoost}
            className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
              bassBoost
                ? 'bg-indigo-600/20 border-indigo-500/50 shadow-md'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className={`w-4 h-4 ${bassBoost ? 'text-indigo-400' : 'text-slate-400'}`} />
                <span className="font-semibold text-xs text-white">BassBoost</span>
              </div>
              <span className={`w-2 h-2 rounded-full ${bassBoost ? 'bg-indigo-400 animate-pulse' : 'bg-slate-600'}`} />
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5 leading-snug">
              Refuerzo dinámico de graves y sub-frecuencias profundas.
            </p>
          </div>

          {/* 2. Virtualizer 3D */}
          <div
            onClick={handleToggleVirtualizer}
            className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
              virtualizer
                ? 'bg-cyan-600/20 border-cyan-500/50 shadow-md'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Waves className={`w-4 h-4 ${virtualizer ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span className="font-semibold text-xs text-white">Audio 3D Espacial</span>
              </div>
              <span className={`w-2 h-2 rounded-full ${virtualizer ? 'bg-cyan-400 animate-pulse' : 'bg-slate-600'}`} />
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5 leading-snug">
              Ampliación acústica envolvente del campo binaural.
            </p>
          </div>

          {/* 3. Loudness Enhancer */}
          <div
            onClick={handleToggleLoudness}
            className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
              loudness
                ? 'bg-amber-600/20 border-amber-500/50 shadow-md'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className={`w-4 h-4 ${loudness ? 'text-amber-400' : 'text-slate-400'}`} />
                <span className="font-semibold text-xs text-white">Loudness Enhancer</span>
              </div>
              <span className={`w-2 h-2 rounded-full ${loudness ? 'bg-amber-400 animate-pulse' : 'bg-slate-600'}`} />
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5 leading-snug">
              Nivelador y ganancia transparente sin distorsión.
            </p>
          </div>

          {/* 4. Haptic Bass Motor */}
          <div
            onClick={handleToggleHaptic}
            className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
              hapticBass
                ? 'bg-pink-600/20 border-pink-500/50 shadow-md'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className={`w-4 h-4 ${hapticBass ? 'text-pink-400' : 'text-slate-400'}`} />
                <span className="font-semibold text-xs text-white">Motor Háptico</span>
              </div>
              <span className={`w-2 h-2 rounded-full ${hapticBass ? 'bg-pink-400 animate-pulse' : 'bg-slate-600'}`} />
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5 leading-snug">
              Vibración física sincronizada con los golpes de graves.
            </p>
          </div>
        </div>

        {/* PRESET SELECTOR BUTTONS */}
        <div className="space-y-2 pt-1">
          <div className="text-xs font-semibold text-slate-300">Ajustes Preestablecidos Profesionales</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {PRESETS_10_BANDS.map(p => {
              const isSelected = currentPreset === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => handlePresetSelect(p)}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? 'bg-indigo-600/25 border-indigo-500/60 shadow-md text-white'
                      : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/60 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-base">{p.icon}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                  </div>
                  <div className="font-semibold text-xs mt-1.5 truncate">{p.label}</div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">{p.desc}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
