import React, { useState } from 'react';
import { Radio, Sparkles, User, RefreshCw, Music2, ExternalLink, X, Check, ArrowRight } from 'lucide-react';
import { Track } from '../types/music';
import { fetchLastFmUserTop } from '../services/lastFmService';

interface LastFmModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTrack: Track;
  listeningHistory: Track[];
  onPlayTrack: (track: Track) => void;
  onSearchQuery: (query: string) => void;
}

const LASTFM_USERNAME_KEY = 'jmmusic_lastfm_username';

export const LastFmModal: React.FC<LastFmModalProps> = ({
  isOpen,
  onClose,
  currentTrack,
  listeningHistory,
  onPlayTrack,
  onSearchQuery
}) => {
  const [username, setUsername] = useState(() => {
    try {
      return localStorage.getItem(LASTFM_USERNAME_KEY) || '';
    } catch {
      return '';
    }
  });

  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [userTracks, setUserTracks] = useState<Array<{ title: string; artist: string; playcount: number; url?: string }>>([]);
  const [hasSearchedUser, setHasSearchedUser] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSaveUsername = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = username.trim();
    if (!clean) return;

    try {
      localStorage.setItem(LASTFM_USERNAME_KEY, clean);
    } catch {}

    setIsLoadingUser(true);
    setUserError(null);
    setHasSearchedUser(true);

    try {
      const result = await fetchLastFmUserTop(clean);
      setUserTracks(result);
      if (result.length === 0) {
        setUserError('No se encontraron canciones recientes o el usuario no tiene scrobbles públicos.');
      }
    } catch {
      setUserError('Error al contactar con la API de Last.fm');
    } finally {
      setIsLoadingUser(false);
    }
  };

  const handleSelectTrack = (trackName: string, artistName: string) => {
    onClose();
    onSearchQuery(`${trackName} ${artistName}`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 to-red-500 flex items-center justify-center text-white shadow-lg shadow-rose-600/30">
              <Radio className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <span>Motor Last.fm Hi-Fi</span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Activo
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Recomendaciones inteligentes sincronizadas con tu historial musical
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

        {/* Info Box */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/40 via-slate-900 to-slate-950 border border-rose-500/30 space-y-2">
          <div className="flex items-center gap-2 text-rose-400 text-xs font-bold">
            <Sparkles className="w-4 h-4" />
            <span>¿Cómo funciona el motor Last.fm en JMMUSIC?</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Cada canción que reproduces analiza en tiempo real la gigantesca base de datos de <strong>Last.fm</strong> (scrobbles mundiales, canciones similares y artistas recomendados). El carrusel de <span className="text-rose-400 font-semibold">Recomendaciones Last.fm</span> en el explorador se actualiza automáticamente con tus temas favoritos.
          </p>
          <div className="text-[11px] text-slate-400 pt-1 flex items-center gap-2">
            <span>Escuchando ahora:</span>
            <span className="font-semibold text-white truncate max-w-[240px]">
              {currentTrack.title} &bull; {currentTrack.artist}
            </span>
          </div>
        </div>

        {/* User Account Sync Form */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-rose-400" />
              <span>Conectar tu cuenta o usuario de Last.fm (Opcional)</span>
            </span>
            <span className="text-[10px] text-slate-400">Para importar tus gustos</span>
          </label>
          <form onSubmit={handleSaveUsername} className="flex gap-2">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Tu usuario en Last.fm (ej. rj)"
              className="flex-1 bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors"
            />
            <button
              type="submit"
              disabled={isLoadingUser || !username.trim()}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-rose-600/30 disabled:opacity-50"
            >
              {isLoadingUser ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              <span>Sincronizar</span>
            </button>
          </form>

          {userError && (
            <p className="text-xs text-rose-400">{userError}</p>
          )}

          {/* User top tracks list */}
          {userTracks.length > 0 && (
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-bold text-white flex items-center justify-between">
                <span>Tus Canciones Más Escuchadas en Last.fm ({userTracks.length})</span>
                <span className="text-[10px] text-slate-400">Toca para escuchar</span>
              </h4>
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {userTracks.map((t, i) => (
                  <div
                    key={`${t.title}-${i}`}
                    onClick={() => handleSelectTrack(t.title, t.artist)}
                    className="p-2.5 rounded-xl bg-slate-950/60 hover:bg-rose-950/30 border border-slate-800/80 hover:border-rose-500/40 flex items-center justify-between cursor-pointer transition-colors group"
                  >
                    <div className="min-w-0 flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold text-xs shrink-0">
                        {i + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate group-hover:text-rose-300 transition-colors">
                          {t.title}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {t.artist}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-mono text-slate-400">
                        {t.playcount} scrobbles
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-rose-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Listening History Summary */}
        <div className="pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Historial activo en esta sesión</span>
            <span className="font-semibold text-white">{listeningHistory.length} canciones</span>
          </div>
          <p className="text-[11px] text-slate-500">
            JMMUSIC alimenta los algoritmos de recomendación de Last.fm con tus artistas reproducidos para mantener tu feed fresco con música que combina contigo.
          </p>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-2">
          <a
            href="https://www.last.fm"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
          >
            <span>Sitio Oficial de Last.fm</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
