import React, { useEffect } from 'react';
import { X, Play, Pause, SkipBack, SkipForward, Car, Volume2, Mic2 } from 'lucide-react';
import { Track } from '../types/music';

interface DrivingModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTrack: Track;
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onToggleFavorite: () => void;
  isFavorite: boolean;
}

export const DrivingModeModal: React.FC<DrivingModeModalProps> = ({
  isOpen,
  onClose,
  currentTrack,
  isPlaying,
  onPlayPause,
  onNext,
  onPrevious
}) => {
  useEffect(() => {
    // Request Wake Lock if available so screen stays on while driving
    let wakeLock: any = null;
    if (isOpen && 'wakeLock' in navigator) {
      (navigator as any).wakeLock?.request('screen').then((lock: any) => {
        wakeLock = lock;
      }).catch(() => {});
    }

    return () => {
      if (wakeLock) wakeLock.release().catch(() => {});
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col justify-between p-6 sm:p-12 select-none">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <Car className="w-8 h-8 text-amber-400" />
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-wider">Modo Conducción</h2>
            <p className="text-xs text-slate-400">Botones gigantes táctiles y pantalla fija activa</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-3 bg-slate-900 border border-slate-700 rounded-2xl text-slate-200 hover:text-white cursor-pointer"
        >
          <X className="w-8 h-8" />
        </button>
      </div>

      {/* Center Huge Track Display */}
      <div className="flex flex-col items-center justify-center text-center my-auto py-8">
        <img
          src={currentTrack.coverUrl}
          alt={currentTrack.title}
          className="w-48 h-48 sm:w-64 sm:h-64 rounded-3xl object-cover shadow-2xl border-2 border-white/10 mb-6"
        />
        <h1 className="text-3xl sm:text-5xl font-black text-white truncate max-w-xl">
          {currentTrack.title}
        </h1>
        <p className="text-xl sm:text-2xl text-slate-300 font-medium mt-2">
          {currentTrack.artist}
        </p>
      </div>

      {/* Massive Bottom Controls */}
      <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto w-full pt-4">
        <button
          onClick={onPrevious}
          className="h-24 sm:h-28 rounded-3xl bg-slate-900 border border-slate-800 active:scale-95 text-white flex items-center justify-center cursor-pointer hover:bg-slate-800 transition-all shadow-xl"
        >
          <SkipBack className="w-12 h-12 fill-current" />
        </button>

        <button
          onClick={onPlayPause}
          className="h-24 sm:h-28 rounded-3xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 flex items-center justify-center cursor-pointer transition-all shadow-xl shadow-amber-500/20"
        >
          {isPlaying ? (
            <Pause className="w-14 h-14 fill-current" />
          ) : (
            <Play className="w-14 h-14 fill-current ml-1" />
          )}
        </button>

        <button
          onClick={onNext}
          className="h-24 sm:h-28 rounded-3xl bg-slate-900 border border-slate-800 active:scale-95 text-white flex items-center justify-center cursor-pointer hover:bg-slate-800 transition-all shadow-xl"
        >
          <SkipForward className="w-12 h-12 fill-current" />
        </button>
      </div>
    </div>
  );
};
