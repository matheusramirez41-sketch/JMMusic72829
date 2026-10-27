import React from 'react';
import { Track } from '../types/music';
import { X, Play, Trash2, ListMusic, Sparkles } from 'lucide-react';

interface QueueDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentTrack: Track;
  queue: Track[];
  onPlayQueueTrack: (index: number) => void;
  onRemoveFromQueue: (index: number) => void;
  onClearQueue: () => void;
  smartRecommendations?: Array<{ title: string; artist: string; coverUrl?: string; source?: string }>;
  onPlayRecommended?: (rec: { title: string; artist: string }) => void;
}

export const QueueDrawer: React.FC<QueueDrawerProps> = ({
  isOpen,
  onClose,
  currentTrack,
  queue,
  onPlayQueueTrack,
  onRemoveFromQueue,
  onClearQueue,
  smartRecommendations = [],
  onPlayRecommended
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-80 sm:w-96 bg-slate-900/95 backdrop-blur-xl border-l border-slate-800 z-50 p-6 flex flex-col shadow-2xl">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <ListMusic className="w-4 h-4 text-indigo-400" />
          <h2 className="text-base font-bold text-white">Cola de Reproducción</h2>
        </div>
        <div className="flex items-center gap-2">
          {queue.length > 0 && (
            <button
              onClick={onClearQueue}
              className="text-xs text-slate-400 hover:text-rose-400 transition-colors"
            >
              Vaciar
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4 space-y-6">
        {/* Currently Playing */}
        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Sonando Ahora
          </span>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-indigo-600/15 border border-indigo-500/30">
            <img
              src={currentTrack.coverUrl}
              alt={currentTrack.title}
              className="w-11 h-11 rounded-lg object-cover flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-bold text-white truncate">{currentTrack.title}</h4>
              <p className="text-xs text-slate-400 truncate">{currentTrack.artist}</p>
            </div>
            <span className="text-xs text-indigo-400 animate-pulse font-mono">EN VIVO</span>
          </div>
        </div>

        {/* Up Next List */}
        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            A Continuación ({queue.length})
          </span>

          {queue.length > 0 && (
            <div className="space-y-2 mb-6">
              {queue.map((track, idx) => (
                <div
                  key={`${track.id}-${idx}`}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all group"
                >
                  <div
                    onClick={() => onPlayQueueTrack(idx)}
                    className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                  >
                    <span className="text-xs font-mono text-slate-500 w-4 text-center">
                      {idx + 1}
                    </span>
                    <img
                      src={track.coverUrl}
                      alt={track.title}
                      className="w-9 h-9 rounded-md object-cover flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate group-hover:text-indigo-400 transition-colors">
                        {track.title}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">{track.artist}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => onRemoveFromQueue(idx)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Smart Automatic Flow Recommendations (based on what you are listening to!) */}
          <div>
            <div className="flex items-center gap-1.5 mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-xs font-bold text-indigo-300">
                Flujo Continuo Recomendado
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mb-3 leading-tight">
              Música afinada según <strong className="text-white">{currentTrack.artist}</strong>. La música continuará con estas canciones sin cambiar de género:
            </p>

            {smartRecommendations.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800/60">
                Sintonizando canciones similares en tiempo real...
              </div>
            ) : (
              <div className="space-y-2">
                {smartRecommendations.slice(0, 6).map((rec, idx) => (
                  <div
                    key={`rec-${idx}-${rec.title}`}
                    onClick={() => onPlayRecommended?.(rec)}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 border border-indigo-500/20 hover:border-indigo-400/50 hover:bg-indigo-950/20 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-500/30 flex items-center justify-center shrink-0">
                        <Play className="w-3.5 h-3.5 text-indigo-400 group-hover:text-white transition-colors" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-white truncate group-hover:text-indigo-300 transition-colors">
                          {rec.title}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">{rec.artist}</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 shrink-0 ml-2">
                      Siguiente
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
