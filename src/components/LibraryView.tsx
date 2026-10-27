import React, { useState, useMemo } from 'react';
import { Track, Playlist } from '../types/music';
import {
  Play,
  Pause,
  Heart,
  Plus,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  DownloadCloud,
  ShieldCheck,
  Camera,
  HardDrive,
  Search,
  Music,
  BookmarkPlus,
  Volume2,
  Radio,
  Edit3,
  Trash2,
  CheckCircle2,
  Shuffle,
  Download
} from 'lucide-react';
import { UserProfileData } from './UserProfileModal';
import { audioEngine } from './AudioEngine';

interface LibraryViewProps {
  tracks: Track[];
  currentTrack: Track;
  isPlaying: boolean;
  onPlayTrack: (track: Track) => void;
  favorites: string[];
  onToggleFavorite: (trackId: string) => void;
  playlists: Playlist[];
  selectedPlaylistId: string | null;
  onSelectPlaylist: (id: string | null) => void;
  onDeletePlaylist?: (id: string) => void;
  onCreatePlaylist: () => void;
  isOnlyFavorites?: boolean;
  onOpenImportModal?: () => void;
  userProfile?: UserProfileData;
  onOpenProfile?: () => void;
  onOpenOfflineView?: () => void;
  onOpenSaveModal?: (track: Track) => void;
  onStartArtistRadio?: (artist: string) => void;
  onUpdateTrackMetadata?: (trackId: string, updated: Partial<Track>) => void;
  onDownloadTrack?: (track: Track) => void;
  onCleanDuplicates?: (playlistId: string) => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  tracks,
  currentTrack,
  isPlaying,
  onPlayTrack,
  favorites,
  onToggleFavorite,
  playlists,
  selectedPlaylistId,
  onSelectPlaylist,
  onCreatePlaylist,
  isOnlyFavorites = false,
  onOpenImportModal,
  userProfile,
  onOpenProfile,
  onOpenOfflineView,
  onOpenSaveModal,
  onStartArtistRadio,
  onUpdateTrackMetadata,
  onDownloadTrack,
  onCleanDuplicates
}) => {
  const [activeTab, setActiveTab] = useState<'tracks' | 'playlists' | 'favorites'>('tracks');
  const [searchQuery, setSearchQuery] = useState('');
  const [testAudioNotice, setTestAudioNotice] = useState<string | null>(null);
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editArtist, setEditArtist] = useState('');
  const [editAlbum, setEditAlbum] = useState('');
  const [editGenre, setEditGenre] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const filteredTracks = useMemo(() => {
    if (!searchQuery.trim()) return tracks;
    const q = searchQuery.toLowerCase();
    return tracks.filter(
      (t) => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q) || (t.album && t.album.toLowerCase().includes(q))
    );
  }, [tracks, searchQuery]);

  const handleTestSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    audioEngine.playProceduralSong(currentTrack.title, currentTrack.genre || 'Pop', 100);
    setTestAudioNotice('🔊 Sintetizador Web Audio activo en altavoces');
    setTimeout(() => setTestAudioNotice(null), 3500);
  };

  // If viewing only favorites directly (isOnlyFavorites prop)
  if (isOnlyFavorites) {
    const favoriteTracks = tracks.filter((t) => favorites.includes(t.id));

    return (
      <div className="space-y-6 pb-12">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <Heart className="w-7 h-7 fill-rose-500/30" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">Tus Canciones Favoritas</h1>
              <p className="text-xs text-slate-400 mt-1">
                {favoriteTracks.length} pistas guardadas para acceso inmediato
              </p>
            </div>
          </div>

          {!isOnlyFavorites && (
            <button
              onClick={() => setActiveTab('tracks')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-bold px-3 py-1.5 rounded-xl bg-indigo-500/10 cursor-pointer"
            >
              Ver Todas las Canciones
            </button>
          )}
        </div>

        {favoriteTracks.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/30 rounded-3xl border border-slate-800/80 p-8 space-y-3">
            <Heart className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-sm font-semibold text-white">Aún no tienes canciones favoritas</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Pulsa el icono de corazón en cualquier canción del catálogo para guardarla aquí en tu biblioteca.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {favoriteTracks.map((track, idx) => {
              const isCurrent = currentTrack.id === track.id;
              const isCurrentPlaying = isCurrent && isPlaying;

              return (
                <div
                  key={`${track.id}-${idx}`}
                  onClick={() => onPlayTrack(track)}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-indigo-600/15 border-indigo-500/50 shadow-lg'
                      : 'bg-slate-900/50 border-slate-800/60 hover:bg-slate-900 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <img
                      src={track.coverUrl}
                      alt={track.title}
                      className="w-12 h-12 rounded-xl object-cover flex-shrink-0 shadow-md"
                    />
                    <div className="min-w-0">
                      <h4 className={`text-sm font-bold truncate ${isCurrent ? 'text-indigo-400' : 'text-white'}`}>
                        {track.title}
                      </h4>
                      <p className="text-xs text-slate-400 truncate">{track.artist}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(track.id);
                      }}
                      className="p-1.5 text-rose-400 hover:text-slate-400 transition-colors cursor-pointer"
                    >
                      <Heart className="w-4 h-4 fill-rose-400" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlayTrack(track);
                      }}
                      className="p-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition-colors cursor-pointer shadow-md"
                    >
                      {isCurrentPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // If a specific playlist is selected
  if (selectedPlaylistId) {
    const activePl = playlists.find((p) => p.id === selectedPlaylistId);
    if (!activePl) return null;

    const plTracks = tracks.filter((t) => activePl.trackIds.includes(t.id));

    return (
      <div className="space-y-6 pb-12">
        <button
          onClick={() => onSelectPlaylist(null)}
          className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a todas las listas</span>
        </button>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pb-6 border-b border-slate-800">
          <img
            src={activePl.coverUrl}
            alt={activePl.title}
            className="w-36 h-36 rounded-2xl object-cover shadow-2xl border border-white/10"
          />
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
              Colección JMMUSIC
            </span>
            <h1 className="text-3xl font-black text-white">{activePl.title}</h1>
            <p className="text-sm text-slate-400 max-w-xl">{activePl.description}</p>
            <div className="pt-2 flex items-center gap-2.5 flex-wrap">
              {plTracks.length > 0 && (
                <button
                  onClick={() => onPlayTrack(plTracks[0])}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-indigo-600/25"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Reproducir Todo</span>
                </button>
              )}
              {plTracks.length > 1 && (
                <button
                  onClick={() => {
                    const shuffled = [...plTracks].sort(() => Math.random() - 0.5);
                    onPlayTrack(shuffled[0]);
                    showToast('¡Modo Smart Shuffle iniciado!');
                  }}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer border border-slate-700"
                  title="Reproducción aleatoria inteligente"
                >
                  <Shuffle className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Smart Shuffle</span>
                </button>
              )}
              {onCleanDuplicates && (
                <button
                  onClick={() => {
                    onCleanDuplicates(activePl.id);
                    showToast('Lista optimizada: Duplicados eliminados');
                  }}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer border border-slate-700"
                  title="Escanear y eliminar canciones duplicadas de la lista"
                >
                  <Trash2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Limpiar Duplicados</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {plTracks.map((track, idx) => {
            const isCurrent = currentTrack.id === track.id;
            const isCurrentPlaying = isCurrent && isPlaying;

            return (
              <div
                key={`${track.id}-${idx}`}
                onClick={() => onPlayTrack(track)}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-indigo-600/15 border-indigo-500/50'
                    : 'bg-slate-900/50 border-slate-800/60 hover:bg-slate-900 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-mono text-slate-500 w-5 text-center">
                    {(idx + 1).toString().padStart(2, '0')}
                  </span>
                  <img
                    src={track.coverUrl}
                    alt={track.title}
                    className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <h4 className={`text-sm font-semibold truncate ${isCurrent ? 'text-indigo-400' : 'text-white'}`}>
                      {track.title}
                    </h4>
                    <p className="text-xs text-slate-400 truncate">{track.artist}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {onStartArtistRadio && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onStartArtistRadio(track.artist);
                      }}
                      className="p-2 rounded-xl text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 transition-colors"
                      title="Radio de este artista"
                    >
                      <Radio className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingTrack(track);
                      setEditTitle(track.title);
                      setEditArtist(track.artist);
                      setEditAlbum(track.album || '');
                      setEditGenre(track.genre || '');
                    }}
                    className="p-2 rounded-xl text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                    title="Editar etiquetas ID3"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlayTrack(track);
                    }}
                    className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer shadow-md"
                    title={isCurrentPlaying ? 'Pausar' : 'Reproducir'}
                  >
                    {isCurrentPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // All Playlists Overview
  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Tu Biblioteca JMMUSIC</h1>
          <p className="text-xs text-slate-400 mt-1">Playlists, álbumes y colecciones importadas</p>
        </div>

        <div className="flex items-center gap-3">
          {onOpenImportModal && (
            <button
              onClick={onOpenImportModal}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-600/20 active:scale-95"
            >
              <DownloadCloud className="w-4 h-4" />
              <span>Pasar Música de Spotify / YT</span>
            </button>
          )}

          <button
            onClick={onCreatePlaylist}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Playlist</span>
          </button>
        </div>
      </div>

      {/* USER PROFILE REPRESENTATIVE CARD */}
      {userProfile && (
        <div className="relative rounded-3xl overflow-hidden border border-indigo-500/30 p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 shadow-2xl">
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-5 relative z-10">
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <div className="relative group cursor-pointer" onClick={onOpenProfile}>
                <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl p-0.5 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 shadow-xl shadow-indigo-500/25 group-hover:scale-105 transition-transform">
                  <img
                    src={userProfile.avatarUrl}
                    alt={userProfile.name}
                    className="w-full h-full object-cover rounded-[14px] bg-slate-950"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 p-1.5 rounded-xl bg-indigo-600 text-white shadow-md border-2 border-slate-900">
                  <Camera className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-black text-white">{userProfile.name}</h2>
                  <span className="p-1 rounded-full bg-indigo-500/20 text-indigo-400" title="Perfil Verificado">
                    <ShieldCheck className="w-4 h-4" />
                  </span>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    VIP HI-FI
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-medium">
                  {userProfile.tagline}
                </p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1 text-[11px] text-slate-400">
                  <span className="px-2.5 py-0.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-300 font-semibold">
                    {userProfile.favoriteGenre}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                    FLAC 24-bit 96kHz Lossless
                  </span>
                </div>
              </div>
            </div>

            {onOpenProfile && (
              <button
                onClick={onOpenProfile}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md active:scale-95 shrink-0"
              >
                <Camera className="w-3.5 h-3.5 text-indigo-400" />
                <span>Editar Foto y Perfil</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* SPOTIFY & YT MUSIC IMPORT BANNER */}
      {onOpenImportModal && (
        <div
          onClick={onOpenImportModal}
          className="relative rounded-3xl overflow-hidden border border-emerald-500/30 p-6 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-indigo-950/40 shadow-xl cursor-pointer group hover:border-emerald-500/60 transition-all"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Transferencia de Biblioteca 1-Click</span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white group-hover:text-emerald-300 transition-colors">
                ¿Tienes playlists o listas de tus canciones favoritas?
              </h3>
              <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
                Pega el enlace de tu playlist o lista y pásalas al instante a tu biblioteca de JMMUSIC con carátulas en alta resolución y ecualización de 10 bandas.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs group-hover:scale-105 transition-transform shrink-0 shadow-lg shadow-emerald-500/30">
              <span>Transferir Ahora</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      )}

      {/* Test audio notice banner */}
      {testAudioNotice && (
        <div className="p-3 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 text-xs font-bold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-emerald-400" />
            <span>{testAudioNotice}</span>
          </div>
          <span className="text-[10px] text-slate-400 font-normal">Sonando por altavoces/auriculares</span>
        </div>
      )}

      {/* Selector de Biblioteca: Todas las Canciones, Playlists, Favoritas, Sin Wi-Fi & 25 Novedades */}
      <div className="flex flex-col gap-4 border-b border-slate-800 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('tracks')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'tracks'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white bg-slate-900/60'
              }`}
            >
              <Music className="w-3.5 h-3.5" />
              <span>Todas las Canciones ({tracks.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('playlists')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'playlists'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white bg-slate-900/60'
              }`}
            >
              <span>Playlists ({playlists.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('favorites')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'favorites'
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                  : 'text-slate-400 hover:text-white bg-slate-900/60'
              }`}
            >
              <Heart className="w-3.5 h-3.5 fill-current" />
              <span>Favoritas ({favorites.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {onOpenOfflineView && (
              <button
                onClick={onOpenOfflineView}
                className="px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 shadow-sm"
              >
                <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                <span>Sin Wi-Fi (Offline)</span>
              </button>
            )}

            <button
              onClick={handleTestSound}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
              title="Probar Salida de Sonido"
            >
              <Volume2 className="w-4 h-4 text-indigo-400" />
            </button>
          </div>
        </div>

        {/* Search Bar for Tracks */}
        {activeTab === 'tracks' && (
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por título, artista o álbum en tu biblioteca..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        )}
      </div>

      {/* Content depending on activeTab */}
      {activeTab === 'tracks' ? (
        /* All Tracks List */
        <div className="space-y-2">
          {filteredTracks.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2 bg-slate-900/40 border border-slate-800/60 rounded-3xl p-6">
              <Music className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-white">No se encontraron canciones</p>
              <p className="text-xs text-slate-500">Prueba con otro término de búsqueda</p>
            </div>
          ) : (
            filteredTracks.map((track, idx) => {
              const isCurrent = currentTrack.id === track.id;
              const isCurrentPlaying = isCurrent && isPlaying;
              const isFav = favorites.includes(track.id);

              return (
                <div
                  key={`${track.id}-${idx}`}
                  onClick={() => onPlayTrack(track)}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-indigo-600/15 border-indigo-500/50 shadow-lg'
                      : 'bg-slate-900/50 border-slate-800/60 hover:bg-slate-900 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span className="text-xs font-mono text-slate-500 w-5 text-center shrink-0">
                      {(idx + 1).toString().padStart(2, '0')}
                    </span>
                    <img
                      src={track.coverUrl}
                      alt={track.title}
                      className="w-12 h-12 rounded-xl object-cover flex-shrink-0 shadow-md"
                    />
                    <div className="min-w-0">
                      <h4 className={`text-sm font-bold truncate ${isCurrent ? 'text-indigo-400' : 'text-white'}`}>
                        {track.title}
                      </h4>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-slate-400 truncate">{track.artist}</p>
                        {track.genre && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                            {track.genre}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {onStartArtistRadio && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onStartArtistRadio(track.artist);
                        }}
                        className="p-2 rounded-xl text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 transition-colors"
                        title={`Iniciar Radio de ${track.artist}`}
                      >
                        <Radio className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingTrack(track);
                        setEditTitle(track.title);
                        setEditArtist(track.artist);
                        setEditAlbum(track.album || '');
                        setEditGenre(track.genre || '');
                      }}
                      className="p-2 rounded-xl text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                      title="Editar etiquetas ID3"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {onDownloadTrack && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDownloadTrack(track);
                          showToast(`Descargando "${track.title}"`);
                        }}
                        className="p-2 rounded-xl text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                        title="Descargar para escuchar sin conexión"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    )}

                    {onOpenSaveModal && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenSaveModal(track);
                        }}
                        className="p-2 rounded-xl text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                        title="Guardar en Biblioteca Normal o Sin Wi-Fi"
                      >
                        <BookmarkPlus className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(track.id);
                      }}
                      className={`p-2 rounded-xl transition-colors ${
                        isFav ? 'text-rose-400 hover:text-rose-300' : 'text-slate-500 hover:text-slate-300'
                      }`}
                      title={isFav ? 'Quitar de Favoritas' : 'Añadir a Favoritas'}
                    >
                      <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-400' : ''}`} />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlayTrack(track);
                      }}
                      className="p-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition-colors cursor-pointer shadow-md"
                      title={isCurrentPlaying ? 'Pausar' : 'Reproducir'}
                    >
                      {isCurrentPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : activeTab === 'playlists' ? (
        /* Playlists Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {playlists.map((pl) => (
            <div
              key={pl.id}
              onClick={() => onSelectPlaylist(pl.id)}
              className="group rounded-3xl bg-slate-900/60 border border-slate-800 p-4 hover:border-indigo-500/40 hover:bg-slate-900 transition-all cursor-pointer shadow-lg space-y-3"
            >
              <div className="relative aspect-square rounded-2xl overflow-hidden shadow-md">
                <img
                  src={pl.coverUrl}
                  alt={pl.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-sm text-white group-hover:text-indigo-300 transition-colors">
                  {pl.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">{pl.description}</p>
                <span className="text-[11px] text-slate-500 font-mono mt-2 block">
                  {pl.trackIds.length} canciones
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Favorites List */
        <div className="space-y-2">
          {tracks.filter((t) => favorites.includes(t.id)).length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2 bg-slate-900/40 border border-slate-800/60 rounded-3xl p-6">
              <Heart className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-white">No tienes canciones favoritas todavía</p>
              <p className="text-xs text-slate-500">Toca el icono de corazón en cualquier canción del catálogo</p>
            </div>
          ) : (
            tracks.filter((t) => favorites.includes(t.id)).map((track, idx) => {
              const isCurrent = currentTrack.id === track.id;
              const isCurrentPlaying = isCurrent && isPlaying;

              return (
                <div
                  key={`${track.id}-${idx}`}
                  onClick={() => onPlayTrack(track)}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-indigo-600/15 border-indigo-500/50 shadow-lg'
                      : 'bg-slate-900/50 border-slate-800/60 hover:bg-slate-900 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <img
                      src={track.coverUrl}
                      alt={track.title}
                      className="w-12 h-12 rounded-xl object-cover flex-shrink-0 shadow-md"
                    />
                    <div className="min-w-0">
                      <h4 className={`text-sm font-bold truncate ${isCurrent ? 'text-indigo-400' : 'text-white'}`}>
                        {track.title}
                      </h4>
                      <p className="text-xs text-slate-400 truncate">{track.artist}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(track.id);
                      }}
                      className="p-1.5 text-rose-400 hover:text-slate-400 transition-colors cursor-pointer"
                    >
                      <Heart className="w-4 h-4 fill-rose-400" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlayTrack(track);
                      }}
                      className="p-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition-colors cursor-pointer shadow-md"
                    >
                      {isCurrentPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
