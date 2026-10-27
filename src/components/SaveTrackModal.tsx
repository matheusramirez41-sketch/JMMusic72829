import React, { useState } from 'react';
import { Track, Playlist } from '../types/music';
import {
  X,
  Library,
  HardDrive,
  Heart,
  Plus,
  Check,
  Download,
  FolderPlus,
  FileAudio,
  Loader2,
  CheckCircle2,
  Sparkles,
  Bookmark,
  Wifi,
  WifiOff
} from 'lucide-react';
import { downloadAudioFileToDevice } from '../services/offlineMusicService';

interface SaveTrackModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  isDownloaded: boolean;
  onDownloadOffline: () => Promise<void> | void;
  isDownloading: boolean;
  playlists: Playlist[];
  onAddToPlaylist: (playlistId: string, track: Track) => void;
  onCreatePlaylist?: (title: string, track: Track) => void;
}

export const SaveTrackModal: React.FC<SaveTrackModalProps> = ({
  isOpen,
  onClose,
  track,
  isFavorite,
  onToggleFavorite,
  isDownloaded,
  onDownloadOffline,
  isDownloading,
  playlists,
  onAddToPlaylist,
  onCreatePlaylist
}) => {
  const [newPlaylistTitle, setNewPlaylistTitle] = useState('');
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [addedPlaylistIds, setAddedPlaylistIds] = useState<string[]>([]);
  const [isDownloadingFile, setIsDownloadingFile] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<{ msg: string; type: 'normal' | 'offline' } | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string, type: 'normal' | 'offline' = 'normal') => {
    setFeedbackToast({ msg, type });
    setTimeout(() => setFeedbackToast(null), 3500);
  };

  const handlePlaylistClick = (playlistId: string) => {
    onAddToPlaylist(playlistId, track);
    setAddedPlaylistIds(prev => [...prev, playlistId]);
    showToast('¡Guardada en la playlist seleccionada de tu Biblioteca Normal!', 'normal');
  };

  const handleCreateNewPlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistTitle.trim()) return;
    if (onCreatePlaylist) {
      onCreatePlaylist(newPlaylistTitle.trim(), track);
      showToast(`¡Playlist "${newPlaylistTitle.trim()}" creada y guardada en Biblioteca Normal!`, 'normal');
    }
    setNewPlaylistTitle('');
    setIsCreatingPlaylist(false);
  };

  const handleDownloadFile = async () => {
    setIsDownloadingFile(true);
    try {
      const ok = await downloadAudioFileToDevice(track);
      if (ok) {
        showToast('¡Archivo descargado a tu almacenamiento para escuchar sin internet!', 'offline');
      } else {
        showToast('¡Archivo procesado para descarga!', 'offline');
      }
    } catch (err) {
      console.warn('Direct file download error:', err);
    } finally {
      setIsDownloadingFile(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-lg border border-white/10 shrink-0 bg-slate-950">
              <img
                src={track.coverUrl}
                alt={track.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/30 px-2 py-0.5 rounded-full inline-block mb-1">
                ¿Dónde deseas guardar?
              </span>
              <h2 className="text-base sm:text-lg font-black text-white truncate leading-tight">
                {track.title}
              </h2>
              <p className="text-xs text-slate-400 truncate">
                {track.artist}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/5 transition-colors cursor-pointer shrink-0"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback notification toast */}
        {feedbackToast && (
          <div className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center gap-2.5 animate-in fade-in slide-in-from-top-1 ${
            feedbackToast.type === 'offline'
              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200 shadow-lg shadow-emerald-950/40'
              : 'bg-indigo-500/20 border-indigo-500/50 text-indigo-200 shadow-lg shadow-indigo-950/40'
          }`}>
            <CheckCircle2 className={`w-5 h-5 shrink-0 ${feedbackToast.type === 'offline' ? 'text-emerald-400' : 'text-indigo-400'}`} />
            <span>{feedbackToast.msg}</span>
          </div>
        )}

        {/* ========================================================= */}
        {/* OPCIÓN 1: BIBLIOTECA NORMAL (EN LÍNEA / PLAYLISTS / FAVORITOS) */}
        {/* ========================================================= */}
        <div className="rounded-2xl p-4 bg-slate-950/80 border border-indigo-500/30 space-y-3.5 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner shrink-0">
                <Library className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-white">1. Biblioteca Normal</h3>
                  <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Online / Nube
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Canciones favoritas, listas de reproducción y catálogo personal</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {/* Toggle Favoritos / Mis Canciones */}
            <button
              onClick={() => {
                onToggleFavorite();
                showToast(isFavorite ? 'Eliminada de Favoritos' : '¡Guardada en Favoritos de tu Biblioteca Normal!', 'normal');
              }}
              className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                isFavorite
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-sm'
                  : 'bg-slate-900 text-slate-200 hover:text-white border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`} />
                <span>{isFavorite ? 'Guardada en Favoritos' : 'Guardar en Favoritos'}</span>
              </div>
              {isFavorite && <Check className="w-4 h-4 text-rose-400 stroke-[3]" />}
            </button>

            {/* Toggle Crear Playlist */}
            <button
              onClick={() => setIsCreatingPlaylist(!isCreatingPlaylist)}
              className="p-3 rounded-xl bg-slate-900 hover:bg-slate-850 text-indigo-300 border border-indigo-500/30 text-xs font-bold flex items-center justify-between transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-indigo-400" />
                <span>Crear Nueva Playlist</span>
              </div>
              <Plus className="w-4 h-4 text-indigo-400" />
            </button>
          </div>

          {/* Inline Create Playlist Form */}
          {isCreatingPlaylist && (
            <form onSubmit={handleCreateNewPlaylist} className="flex gap-2 pt-1 animate-in fade-in">
              <input
                type="text"
                placeholder="Nombre de la nueva lista..."
                value={newPlaylistTitle}
                onChange={(e) => setNewPlaylistTitle(e.target.value)}
                className="flex-1 bg-slate-900 border border-indigo-500/40 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400"
                autoFocus
              />
              <button
                type="submit"
                disabled={!newPlaylistTitle.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-md"
              >
                Crear y Guardar
              </button>
            </form>
          )}

          {/* User's Existing Playlists list */}
          {playlists.length > 0 && (
            <div className="pt-1 space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Guardar en una playlist existente:
              </span>
              <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
                {playlists.map((pl) => {
                  const alreadyInPl = pl.trackIds?.includes(track.id) || addedPlaylistIds.includes(pl.id);
                  return (
                    <button
                      key={pl.id}
                      onClick={() => handlePlaylistClick(pl.id)}
                      disabled={alreadyInPl}
                      className={`w-full py-2 px-3 rounded-xl text-left text-xs flex items-center justify-between transition-colors ${
                        alreadyInPl
                          ? 'bg-indigo-950/40 text-emerald-400 border border-emerald-500/30 cursor-default'
                          : 'bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800 cursor-pointer'
                      }`}
                    >
                      <span className="truncate">{pl.title}</span>
                      {alreadyInPl ? (
                        <span className="text-[10px] font-extrabold flex items-center gap-1 text-emerald-400">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Guardada</span>
                        </span>
                      ) : (
                        <Plus className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* OPCIÓN 2: BIBLIOTECA SIN WI-FI (OFFLINE / 100% SIN DATOS) */}
        {/* ========================================================= */}
        <div className="rounded-2xl p-4 bg-slate-950/80 border border-emerald-500/40 space-y-3.5 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner shrink-0">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-white">2. Biblioteca Sin Wi-Fi</h3>
                  <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    100% Offline
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Almacenamiento en tu teléfono sin gastar datos ni necesitar señal</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {/* Save Offline to Cache */}
            <button
              onClick={async () => {
                await onDownloadOffline();
                showToast('¡Canción guardada con éxito en tu Biblioteca Sin Wi-Fi!', 'offline');
              }}
              disabled={isDownloading}
              className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                isDownloaded
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-950/40'
              }`}
            >
              <div className="flex items-center gap-2">
                {isDownloading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : isDownloaded ? (
                  <Check className="w-4 h-4 stroke-[3] text-emerald-400" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>{isDownloaded ? 'Guardada Sin Wi-Fi' : 'Guardar Sin Wi-Fi'}</span>
              </div>
              {isDownloaded ? (
                <span className="text-[9px] bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.5 rounded font-black">
                  LISTA
                </span>
              ) : (
                <WifiOff className="w-3.5 h-3.5 opacity-80" />
              )}
            </button>

            {/* Direct File Download to Device */}
            <button
              onClick={handleDownloadFile}
              disabled={isDownloadingFile}
              className="p-3 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-200 hover:text-white border border-slate-800 hover:border-slate-700 text-xs font-bold flex items-center justify-between transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2">
                {isDownloadingFile ? (
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                ) : (
                  <FileAudio className="w-4 h-4 text-emerald-400" />
                )}
                <span>Descargar Archivo MP3</span>
              </div>
              <Download className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Done / Close Button */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-extrabold text-xs transition-all cursor-pointer shadow-lg active:scale-98"
        >
          Listo / Cerrar
        </button>
      </div>
    </div>
  );
};

