import React, { useState } from 'react';
import { X, Moon, Clock, Play, Check } from 'lucide-react';

interface SleepTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTimerMinutes: number | null;
  onSetTimer: (minutes: number | null) => void;
}

export const SleepTimerModal: React.FC<SleepTimerModalProps> = ({
  isOpen,
  onClose,
  activeTimerMinutes,
  onSetTimer
}) => {
  const [customInput, setCustomInput] = useState('');

  if (!isOpen) return null;

  const presets = [5, 15, 30, 45, 60, 90];

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(customInput, 10);
    if (!isNaN(val) && val > 0) {
      onSetTimer(val);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Moon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Temporizador de Apagado</h3>
              <p className="text-[11px] text-slate-400">Pausa suave con fade-out al terminar</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {activeTimerMinutes !== null && (
          <div className="p-3 rounded-xl bg-indigo-950/50 border border-indigo-500/30 flex items-center justify-between text-xs">
            <span className="text-indigo-300 font-medium">Temporizador activo: {activeTimerMinutes} min</span>
            <button
              onClick={() => onSetTimer(null)}
              className="text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2">
          {presets.map((mins) => (
            <button
              key={mins}
              onClick={() => {
                onSetTimer(mins);
                onClose();
              }}
              className={`p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                activeTimerMinutes === mins
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              {mins} min
            </button>
          ))}
        </div>

        <form onSubmit={handleCustomSubmit} className="pt-2 flex gap-2">
          <input
            type="number"
            min="1"
            max="300"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder="Minutos personalizados..."
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl cursor-pointer"
          >
            Fijar
          </button>
        </form>
      </div>
    </div>
  );
};
