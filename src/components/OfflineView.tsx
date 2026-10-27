import React, { useState, useEffect } from 'react';
import { Track } from '../types/music';
import {
  WifiOff,
  Play,
  Pause,
  Trash2,
  Radio,
  Upload,
  HardDrive,
  Sparkles,
  CheckCircle2,
  DownloadCloud
} from 'lucide-react';
import { getAllOfflineTracks, removeTrackOffline, downloadAudioFileToDevice } from '../services/offlineMusicService';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface OfflineViewProps {
  currentTrack: Track;
  isPlaying: boolean;
  onPlayTrack: (track: Track) => void;
  onPlayLoFiSynth: () => void;
  isSynthMode: boolean;
  onUploadMp3: () => void;
  defaultTracks: Track[];
}

export const OfflineView: React.FC<OfflineViewProps> = ({
  currentTrack,
  isPlaying,
  onPlayTrack,
  onPlayLoFiSynth,
  isSynthMode,
  onUploadMp3,
  defaultTracks,
}) => {
  const isOnline = useOnlineStatus();
  const [offlineTracks, setOfflineTracks] = useState<Track[]>([]);

  const loadOfflineTracks = () => {
    const saved = getAllOfflineTracks();
    // Default CORS tracks are also always precached by service worker
    const combined = [...saved];
    for (const def of defaultTracks) {
      if (!combined.some(t => t.id === def.id)) {
        combined.push(def);
      }
    }
    setOfflineTracks(combined);
  };

  useEffect(() => {
    loadOfflineTracks();
  }, [defaultTracks]);

  const handleRemove = async (trackId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await removeTrackOffline(trackId);
    loadOfflineTracks();
  };

  return (
    <div className="space-y-6 pb-20 select-none">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Modo Sin Conexión Activado</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Música Guardada en tu Dispositivo
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Estas pistas están almacenadas en la memoria local y en la memoria caché del Service Worker. Puedes escucharlas en modo avión, en el metro o sin gastar datos móviles.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Live Lo-Fi Offline Synth */}
            <button
              onClick={onPlayLoFiSynth}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold border flex items-center gap-2 transition-all cursor-pointer ${
                isSynthMode
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/30'
                  : 'bg-indigo-600/30 text-indigo-300 border-indigo-500/40 hover:bg-indigo-600/40'
              }`}
            >
              <Radio className="w-4 h-4" />
              <span>{isSynthMode ? 'Sintetizador Activo' : 'Lo-Fi Infinito Sin Internet'}</span>
            </button>

            {/* Custom MP3 picker */}
            <button
              onClick={onUploadMp3}
              className="px-4 py-2.5 rounded-2xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4 text-indigo-400" />
              <span>Subir Archivo MP3</span>
            </button>
          </div>
        </div>

        {!isOnline && (
          <div className="mt-4 p-3 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
            <WifiOff className="w-4 h-4 flex-shrink-0" />
            <span>Estás sin conexión a internet. Aura Music sigue reproduciendo tus canciones guardadas sin pausas.</span>
          </div>
        )}
      </div>

      {/* Offline tracks list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2 text-slate-300 text-sm font-bold">
            <HardDrive className="w-4 h-4 text-indigo-400" />
            <span>Canciones Disponibles Offline ({offlineTracks.length})</span>
          </div>
          <span className="text-xs text-slate-500">
            Caché Web & Almacenamiento Seguro
          </span>
        </div>

        {offlineTracks.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-slate-800/80 p-8 space-y-3">
            <DownloadCloud className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">No hay pistas guardadas aún</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Haz clic en el icono de descarga en cualquier canción para guardarla y escucharla sin conexión.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {offlineTracks.map((track, idx) => {
              const isCurrent = currentTrack.id === track.id;
              const isThisPlaying = isCurrent && isPlaying;

              return (
                <div
                  key={`${track.id}-${idx}`}
                  onClick={() => onPlayTrack(track)}
                  className={`group p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isCurrent
                      ? 'bg-indigo-950/60 border-indigo-500/50 shadow-lg'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-slate-950">
                      <img
                        src={track.coverUrl}
                        alt={track.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div
                        className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
                          isThisPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        {isThisPlaying ? (
                          <Pause className="w-5 h-5 text-white fill-current" />
                        ) : (
                          <Play className="w-5 h-5 text-white fill-current ml-0.5" />
                        )}
                      </div>
                    </div>

                    <div className="min-w-0">
                      <h4 className={`text-xs font-bold truncate ${isCurrent ? 'text-indigo-300' : 'text-white'}`}>
                        {track.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 truncate">
                        {track.artist}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1 text-[10px] text-emerald-400 font-mono">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Disponible 100% Offline</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Direct file download to phone/device */}
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        await downloadAudioFileToDevice(track);
                      }}
                      className="p-2 text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                      title="Descargar archivo de audio (.m4a) a tu dispositivo"
                    >
                      <DownloadCloud className="w-4 h-4" />
                    </button>

                    {/* Remove button */}
                    <button
                      onClick={(e) => handleRemove(track.id, e)}
                      className="p-2 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Eliminar de almacenamiento offline"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
