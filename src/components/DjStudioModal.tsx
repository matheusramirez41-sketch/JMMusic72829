import React, { useState, useRef, useEffect } from 'react';
import { Track } from '../types/music';
import {
  Disc,
  X,
  Volume2,
  Sliders,
  RotateCcw,
  Sparkles,
  Flame,
  Zap,
  Repeat,
  Music2
} from 'lucide-react';
import { audioEngine } from './AudioEngine';

interface DjStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track;
  isPlaying: boolean;
  playbackSpeed: number;
  onSetPlaybackSpeed: (speed: number) => void;
  isNightcore: boolean;
  onToggleNightcore: () => void;
  isSlowedReverb: boolean;
  onToggleSlowedReverb: () => void;
}

export const DjStudioModal: React.FC<DjStudioModalProps> = ({
  isOpen,
  onClose,
  track,
  isPlaying,
  playbackSpeed,
  onSetPlaybackSpeed,
  isNightcore,
  onToggleNightcore,
  isSlowedReverb,
  onToggleSlowedReverb
}) => {
  const [pitchSemitones, setPitchSemitones] = useState<number>(0);
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [isScratching, setIsScratching] = useState<boolean>(false);
  const lastTouchXRef = useRef<number>(0);

  // Animate spinning vinyl when playing
  useEffect(() => {
    if (!isOpen || !isPlaying || isScratching) return;
    const interval = setInterval(() => {
      setRotationAngle(prev => (prev + (playbackSpeed * 3)) % 360);
    }, 30);
    return () => clearInterval(interval);
  }, [isOpen, isPlaying, isScratching, playbackSpeed]);

  if (!isOpen) return null;

  // Scratch interaction
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsScratching(true);
    lastTouchXRef.current = e.clientX;
    try { if ('vibrate' in navigator) navigator.vibrate(20); } catch {}
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isScratching) return;
    const delta = e.clientX - lastTouchXRef.current;
    lastTouchXRef.current = e.clientX;
    setRotationAngle(prev => (prev + delta * 2) % 360);
    try { if ('vibrate' in navigator) navigator.vibrate(10); } catch {}
  };

  const handlePointerUp = () => {
    setIsScratching(false);
  };

  const handleApplyPreset = (type: 'normal' | 'slowed' | 'nightcore' | 'vaporwave' | 'chipmunk') => {
    if (type === 'normal') {
      onSetPlaybackSpeed(1.0);
      setPitchSemitones(0);
      if (isNightcore) onToggleNightcore();
      if (isSlowedReverb) onToggleSlowedReverb();
    } else if (type === 'slowed') {
      onSetPlaybackSpeed(0.85);
      setPitchSemitones(-2);
      if (!isSlowedReverb) onToggleSlowedReverb();
    } else if (type === 'nightcore') {
      onSetPlaybackSpeed(1.25);
      setPitchSemitones(3);
      if (!isNightcore) onToggleNightcore();
    } else if (type === 'vaporwave') {
      onSetPlaybackSpeed(0.75);
      setPitchSemitones(-4);
      if (!isSlowedReverb) onToggleSlowedReverb();
    } else if (type === 'chipmunk') {
      onSetPlaybackSpeed(1.4);
      setPitchSemitones(6);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <Disc className="w-5 h-5 animate-spin" style={{ animationDuration: '4s' }} />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                Estudio DJ & Efectos en Vivo
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  SCRATCH & PITCH
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Ajusta velocidad, tono y haz scratch interactivo sobre cualquier canción
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

        {/* Interactive Scratch Turntable */}
        <div className="flex flex-col items-center justify-center py-4 bg-slate-950/80 rounded-2xl border border-slate-800 relative overflow-hidden">
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className={`w-44 h-44 rounded-full bg-gradient-to-tr from-slate-950 via-slate-900 to-slate-800 border-4 border-slate-700 shadow-2xl relative flex items-center justify-center cursor-grab active:cursor-grabbing transition-transform ${
              isScratching ? 'scale-105 border-cyan-400' : ''
            }`}
            style={{
              transform: `rotate(${rotationAngle}deg)`,
              touchAction: 'none'
            }}
          >
            {/* Vinyl Grooves */}
            <div className="absolute inset-2 rounded-full border border-slate-700/50 pointer-events-none" />
            <div className="absolute inset-5 rounded-full border border-slate-800 pointer-events-none" />
            <div className="absolute inset-8 rounded-full border border-slate-700/60 pointer-events-none" />

            {/* Center Album Art Sticker */}
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-cyan-400 shadow-md relative pointer-events-none">
              <img
                src={track.coverUrl}
                alt={track.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-3.5 h-3.5 rounded-full bg-slate-950 border border-slate-400" />
              </div>
            </div>
          </div>

          <span className="text-[11px] font-bold text-slate-400 mt-3">
            {isScratching ? '¡Haciendo Scratch!' : 'Arrastra el vinilo con el dedo para scratchear'}
          </span>
        </div>

        {/* Quick Style Presets */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-300">Presets de Producción Instantáneos:</span>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            <button
              onClick={() => handleApplyPreset('normal')}
              className="py-2 px-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 cursor-pointer text-center"
            >
              Original
            </button>
            <button
              onClick={() => handleApplyPreset('slowed')}
              className="py-2 px-1 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 text-xs font-bold border border-purple-500/40 cursor-pointer text-center"
            >
              Slowed
            </button>
            <button
              onClick={() => handleApplyPreset('nightcore')}
              className="py-2 px-1 rounded-xl bg-pink-600/20 hover:bg-pink-600/30 text-pink-300 text-xs font-bold border border-pink-500/40 cursor-pointer text-center"
            >
              Nightcore
            </button>
            <button
              onClick={() => handleApplyPreset('vaporwave')}
              className="py-2 px-1 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 text-xs font-bold border border-cyan-500/40 cursor-pointer text-center"
            >
              Vaporwave
            </button>
            <button
              onClick={() => handleApplyPreset('chipmunk')}
              className="py-2 px-1 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 text-xs font-bold border border-amber-500/40 cursor-pointer text-center"
            >
              Speed Up
            </button>
          </div>
        </div>

        {/* Sliders: Playback Speed & Pitch */}
        <div className="space-y-4 p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-300">Velocidad de Reproducción:</span>
              <span className="text-cyan-400 font-extrabold">{playbackSpeed.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min={0.5}
              max={2.0}
              step={0.05}
              value={playbackSpeed}
              onChange={(e) => onSetPlaybackSpeed(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-300">Tono Musical (Pitch Shift):</span>
              <span className="text-indigo-400 font-extrabold">
                {pitchSemitones > 0 ? `+${pitchSemitones}` : pitchSemitones} semitonos
              </span>
            </div>
            <input
              type="range"
              min={-6}
              max={6}
              step={1}
              value={pitchSemitones}
              onChange={(e) => setPitchSemitones(Number(e.target.value))}
              className="w-full accent-indigo-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
