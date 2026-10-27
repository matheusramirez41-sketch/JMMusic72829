import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Compass,
  Headphones,
  RotateCw,
  Sparkles,
  Volume2,
  Sliders,
  Check,
  Disc3,
  Layers
} from 'lucide-react';
import { audioEngine } from './AudioEngine';

interface SpatialAudio8DModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSongTitle?: string;
  currentArtist?: string;
}

export const SpatialAudio8DModal: React.FC<SpatialAudio8DModalProps> = ({
  isOpen,
  onClose,
  currentSongTitle,
  currentArtist
}) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [orbitSpeed, setOrbitSpeed] = useState<'slow' | 'medium' | 'fast'>('medium');
  const [reverbRoom, setReverbRoom] = useState<'studio' | 'concert' | 'cathedral'>('concert');
  const [angle, setAngle] = useState(0); // 0 to 360 degrees
  const animFrameRef = useRef<number | null>(null);

  // Speed values in ms per full rotation
  const speedDurations = {
    slow: 14000,
    medium: 8000,
    fast: 4000
  };

  useEffect(() => {
    if (!isOpen || !isEnabled) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      audioEngine.setStereoBalance(0);
      return;
    }

    const duration = speedDurations[orbitSpeed];
    let startTime = performance.now();

    const loop = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const currentAngle = ((elapsed % duration) / duration) * 360;
      setAngle(currentAngle);

      // Stereo pan calculation: Math.sin(radians) goes between -1 (full left) and +1 (full right)
      const rad = (currentAngle * Math.PI) / 180;
      const pan = Math.sin(rad);
      audioEngine.setStereoBalance(pan);

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      audioEngine.setStereoBalance(0);
    };
  }, [isOpen, isEnabled, orbitSpeed]);

  const handleToggle = () => {
    const nextState = !isEnabled;
    setIsEnabled(nextState);
    if (nextState) {
      audioEngine.setVirtualizer(true, 85);
    } else {
      audioEngine.setVirtualizer(false, 0);
      audioEngine.setStereoBalance(0);
    }
  };

  if (!isOpen) return null;

  // Radar position of orbit orb
  const rad = (angle * Math.PI) / 180;
  const radius = 68; // px from center
  const orbX = Math.sin(rad) * radius;
  const orbY = -Math.cos(rad) * radius;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 text-white overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold bg-gradient-to-r from-white via-cyan-200 to-blue-200 bg-clip-text text-transparent">
                  Audio 8D Espacial 360°
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  PRO
                </span>
              </div>
              <p className="text-xs text-slate-400">Sonido orbital tridimensional inmersivo</p>
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

        {/* Headphone Advisory */}
        <div className="mt-4 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl flex items-center gap-3">
          <Headphones className="w-5 h-5 text-cyan-400 shrink-0" />
          <p className="text-xs text-cyan-200/90 leading-tight">
            Para la mejor experiencia 8D, <strong>ponte auriculares o audífonos</strong> y siente la música girando alrededor de tu cabeza.
          </p>
        </div>

        {/* 360 Radar Visualizer */}
        <div className="mt-6 flex flex-col items-center justify-center">
          <div className="relative w-48 h-48 rounded-full border border-cyan-500/30 bg-slate-950 flex items-center justify-center shadow-inner">
            {/* Concentric radar rings */}
            <div className="absolute w-36 h-36 rounded-full border border-cyan-500/20" />
            <div className="absolute w-24 h-24 rounded-full border border-cyan-500/10" />

            {/* Crosshairs */}
            <div className="absolute w-full h-[1px] bg-cyan-500/15" />
            <div className="absolute h-full w-[1px] bg-cyan-500/15" />

            {/* Center Listener Avatar */}
            <div className="relative z-10 w-12 h-12 rounded-full bg-slate-900 border border-cyan-400/50 flex items-center justify-center shadow-lg">
              <Headphones className={`w-6 h-6 ${isEnabled ? 'text-cyan-400 animate-pulse' : 'text-slate-500'}`} />
            </div>

            {/* Orbiting Sound Orb */}
            {isEnabled && (
              <div
                className="absolute z-20 w-5 h-5 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 shadow-lg shadow-cyan-400/60 transition-transform duration-75 ease-linear flex items-center justify-center"
                style={{
                  transform: `translate(${orbX}px, ${orbY}px)`
                }}
              >
                <div className="w-2 h-2 rounded-full bg-white animate-ping" />
              </div>
            )}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-slate-400">Canal actual:</span>
            <span className="text-xs font-mono font-semibold text-cyan-400">
              {isEnabled
                ? Math.abs(orbX) < 15
                  ? 'Centro'
                  : orbX > 0
                  ? `Derecha (${Math.round((orbX / radius) * 100)}%)`
                  : `Izquierda (${Math.round((Math.abs(orbX) / radius) * 100)}%)`
                : 'Estéreo Normal'}
            </span>
          </div>
        </div>

        {/* Main 8D Toggle */}
        <div className="mt-6">
          <button
            onClick={handleToggle}
            className={`w-full py-3.5 px-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
              isEnabled
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-cyan-500/30'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            <Compass className="w-4 h-4" />
            {isEnabled ? 'Desactivar Modo 8D' : 'Activar Sonido 8D Espacial'}
          </button>
        </div>

        {/* Orbit Speed controls */}
        {isEnabled && (
          <div className="mt-5 space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <RotateCw className="w-3.5 h-3.5 text-cyan-400" />
              Velocidad de Giro Orbital
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'slow', label: 'Suave (14s)' },
                { id: 'medium', label: 'Dinámico (8s)' },
                { id: 'fast', label: 'Club (4s)' }
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setOrbitSpeed(s.id as any)}
                  className={`py-2 px-3 rounded-xl text-xs font-medium transition-all ${
                    orbitSpeed === s.id
                      ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/30'
                      : 'bg-slate-800/80 text-slate-400 hover:text-white'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Room Reverb Preset */}
        {isEnabled && (
          <div className="mt-4 space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              Acústica de Espacio (Reverb 3D)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'studio', label: 'Estudio' },
                { id: 'concert', label: 'Concierto' },
                { id: 'cathedral', label: 'Catedral' }
              ].map((r) => (
                <button
                  key={r.id}
                  onClick={() => setReverbRoom(r.id as any)}
                  className={`py-2 px-3 rounded-xl text-xs font-medium transition-all ${
                    reverbRoom === r.id
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                      : 'bg-slate-800/80 text-slate-400 hover:text-white'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
