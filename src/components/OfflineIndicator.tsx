import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff, ShieldCheck, Radio } from 'lucide-react';

interface OfflineIndicatorProps {
  onOpenOfflineTracks: () => void;
  onPlayLoFiSynth: () => void;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  onOpenOfflineTracks,
  onPlayLoFiSynth,
}) => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-2xl bg-amber-500/90 text-slate-950 px-4 py-2 text-xs font-bold shadow-2xl backdrop-blur-md border border-amber-300 animate-bounce">
      <div className="flex items-center gap-1.5">
        <WifiOff className="w-4 h-4 text-slate-950" />
        <span>Sin Conexión a Internet</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenOfflineTracks}
          className="bg-slate-950 text-amber-300 px-2.5 py-1 rounded-xl text-[11px] font-semibold hover:bg-slate-900 transition-colors cursor-pointer flex items-center gap-1"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Ver Canciones Guardadas</span>
        </button>
        <button
          onClick={onPlayLoFiSynth}
          className="bg-indigo-950 text-indigo-200 px-2.5 py-1 rounded-xl text-[11px] font-semibold hover:bg-indigo-900 transition-colors cursor-pointer flex items-center gap-1"
        >
          <Radio className="w-3.5 h-3.5" />
          <span>Música Sintetizada</span>
        </button>
      </div>
    </div>
  );
};
