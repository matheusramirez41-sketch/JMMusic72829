import React, { useState, useEffect, useRef } from 'react';
import { X, Timer, Play, Pause, RotateCcw, Coffee, Sparkles } from 'lucide-react';

interface PomodoroModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PomodoroModal: React.FC<PomodoroModalProps> = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60); // 25 mins
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [completedSessions, setCompletedSessions] = useState<number>(0);

  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsRunning(false);
            if (mode === 'focus') {
              setCompletedSessions((c) => c + 1);
              setMode('break');
              return 5 * 60; // 5 min break
            } else {
              setMode('focus');
              return 25 * 60; // 25 min focus
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, mode]);

  if (!isOpen) return null;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(mode === 'focus' ? 25 * 60 : 5 * 60);
  };

  const switchMode = (newMode: 'focus' | 'break') => {
    setMode(newMode);
    setIsRunning(false);
    setTimeLeft(newMode === 'focus' ? 25 * 60 : 5 * 60);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-center space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Timer className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-white text-base">Pomodoro Flow</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center justify-center gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => switchMode('focus')}
            className={`px-4 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              mode === 'focus' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Enfoque (25m)
          </button>
          <button
            onClick={() => switchMode('break')}
            className={`px-4 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              mode === 'break' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Descanso (5m)
          </button>
        </div>

        {/* Big Countdown Clock */}
        <div className="py-4">
          <div className="font-mono text-5xl sm:text-6xl font-black text-white tracking-tight">
            {formatTime(timeLeft)}
          </div>
          <p className="text-xs text-slate-400 mt-2">
            {mode === 'focus' ? '🎧 Música y concentración máxima' : '☕ Respira hondo y toma agua'}
          </p>
          <div className="text-[11px] font-mono text-indigo-400 mt-1">
            Sesiones completadas hoy: {completedSessions}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-center gap-4 pt-2">
          <button
            onClick={resetTimer}
            className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl cursor-pointer transition-colors"
            title="Reiniciar"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={() => setIsRunning(!isRunning)}
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl flex items-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer transition-all active:scale-95"
          >
            {isRunning ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            <span>{isRunning ? 'Pausar' : 'Iniciar Flow'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
