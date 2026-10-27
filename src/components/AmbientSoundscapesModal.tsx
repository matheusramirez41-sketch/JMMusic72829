import React, { useState, useEffect, useRef } from 'react';
import { X, CloudRain, Disc, Flame, Waves, Volume2, Sparkles, Power } from 'lucide-react';

interface AmbientSoundscapesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AmbientSoundscapesModal: React.FC<AmbientSoundscapesModalProps> = ({ isOpen, onClose }) => {
  const [activeSound, setActiveSound] = useState<'rain' | 'vinyl' | 'fire' | 'brown' | null>(null);
  const [volume, setVolume] = useState<number>(0.25);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const noiseNodeRef = useRef<AudioNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  useEffect(() => {
    if (!activeSound) {
      if (gainNodeRef.current && audioCtxRef.current) {
        gainNodeRef.current.gain.linearRampToValueAtTime(0.0001, audioCtxRef.current.currentTime + 0.3);
      }
      return;
    }

    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtxClass();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }

      const ctx = audioCtxRef.current;
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);

      // Generate brown / rain / vinyl noise textures
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        if (activeSound === 'brown') {
          // Brown noise integration
          lastOut = (lastOut + 0.02 * white) / 1.02;
          output[i] = lastOut * 3.5;
        } else if (activeSound === 'rain') {
          // Filtered rain drops
          lastOut = (lastOut + 0.05 * white) / 1.05;
          output[i] = lastOut * 2.0;
        } else if (activeSound === 'vinyl') {
          // Vinyl crackle simulation
          const isPop = Math.random() < 0.0008 ? (Math.random() * 2 - 1) * 0.9 : 0;
          output[i] = white * 0.08 + isPop;
        } else {
          // Fire crackle
          const isCrackle = Math.random() < 0.0015 ? (Math.random() * 2 - 1) * 0.8 : 0;
          lastOut = (lastOut + 0.04 * white) / 1.04;
          output[i] = lastOut * 1.5 + isCrackle;
        }
      }

      if (noiseNodeRef.current) {
        try { (noiseNodeRef.current as any).stop?.(); } catch {}
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const filter = ctx.createBiquadFilter();
      if (activeSound === 'rain') {
        filter.type = 'lowpass';
        filter.frequency.value = 1200;
      } else if (activeSound === 'brown') {
        filter.type = 'lowpass';
        filter.frequency.value = 450;
      } else if (activeSound === 'vinyl') {
        filter.type = 'bandpass';
        filter.frequency.value = 3500;
      } else {
        filter.type = 'lowpass';
        filter.frequency.value = 900;
      }

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(volume, ctx.currentTime);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      whiteNoise.start();

      noiseNodeRef.current = whiteNoise;
      gainNodeRef.current = gain;
    } catch {
      // Ignored
    }

    return () => {
      if (noiseNodeRef.current) {
        try { (noiseNodeRef.current as any).stop?.(); } catch {}
      }
    };
  }, [activeSound]);

  // Handle volume changes in real-time
  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.setValueAtTime(newVol, audioCtxRef.current.currentTime);
    }
  };

  if (!isOpen) return null;

  const SOUNDS = [
    { id: 'rain', label: 'Lluvia Relajante', desc: 'Gotas suaves contra el cristal', icon: CloudRain, color: 'text-cyan-400' },
    { id: 'vinyl', label: 'Crujido de Vinilo', desc: 'Textura nostálgica analógica', icon: Disc, color: 'text-amber-400' },
    { id: 'fire', label: 'Fuego de Chimenea', desc: 'Crepitar cálido de leña', icon: Flame, color: 'text-rose-400' },
    { id: 'brown', label: 'Ruido Marrón Zen', desc: 'Frecuencia profunda anti-estrés', icon: Waves, color: 'text-indigo-400' },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="flex items-start justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <CloudRain className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-1.5">
                <span>Ambientes Sonoros 3D</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  Audio Inmersivo
                </span>
              </h2>
              <p className="text-xs text-slate-400">Superpón lluvia, vinilo o fuego a cualquier canción</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sound Selection Grid */}
        <div className="grid grid-cols-2 gap-3">
          {SOUNDS.map((s) => {
            const isSelected = activeSound === s.id;
            const Icon = s.icon;

            return (
              <button
                key={s.id}
                onClick={() => setActiveSound(isSelected ? null : s.id)}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between h-28 ${
                  isSelected
                    ? 'bg-cyan-950/40 border-cyan-500 text-white shadow-lg shadow-cyan-500/10'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Icon className={`w-6 h-6 ${s.color}`} />
                  {isSelected && (
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">{s.label}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">{s.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Ambient Volume Slider */}
        {activeSound && (
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-cyan-400" />
                Volumen del Ambiente
              </span>
              <span className="font-mono text-cyan-400 font-bold">{Math.round(volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="0.8"
              step="0.01"
              value={volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          {activeSound ? (
            <button
              onClick={() => setActiveSound(null)}
              className="text-xs text-rose-400 hover:underline cursor-pointer"
            >
              Apagar Ambiente
            </button>
          ) : (
            <span className="text-[11px] text-slate-500">Selecciona una capa para activarla</span>
          )}

          <button
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl cursor-pointer"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
};
