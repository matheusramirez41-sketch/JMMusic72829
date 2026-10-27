import React from 'react';
import {
  Compass,
  Radio,
  Library,
  Heart,
  Plus,
  Sparkles,
  HelpCircle,
  Headphones,
  Flame,
  ListMusic,
  CloudRain,
  Timer,
  Car,
  HardDrive
} from 'lucide-react';
import { Playlist } from '../types/music';

interface SidebarProps {
  activeView: 'browse' | 'library' | 'favorites' | 'now-playing' | 'offline';
  onSelectView: (view: 'browse' | 'library' | 'favorites' | 'now-playing' | 'offline') => void;
  playlists: Playlist[];
  selectedPlaylistId: string | null;
  onSelectPlaylist: (id: string | null) => void;
  onOpenAmbience?: () => void;
  onOpenPomodoro?: () => void;
  onOpenDriving?: () => void;
  onCreatePlaylist: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onSelectView,
  playlists,
  selectedPlaylistId,
  onSelectPlaylist,
  onOpenAmbience,
  onOpenPomodoro,
  onOpenDriving,
  onCreatePlaylist
}) => {
  return (
    <aside className="w-64 border-r border-slate-800/80 bg-slate-950/70 backdrop-blur-md flex flex-col justify-between p-4 h-full select-none">
      <div className="space-y-6">
        {/* Brand */}
        <div className="flex items-center justify-between px-2 pt-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-rose-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Headphones className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
                JMMUSIC
              </span>
              <span className="text-[10px] text-indigo-400 font-semibold tracking-wider ml-1 uppercase">
                HI-FI
              </span>
            </div>
          </div>
        </div>

        {/* Main Navigation */}
        <div className="space-y-1">
          <button
            onClick={() => {
              onSelectPlaylist(null);
              onSelectView('browse');
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
              activeView === 'browse' && selectedPlaylistId === null
                ? 'bg-indigo-600/20 text-white border border-indigo-500/30 font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Compass className="w-4 h-4 text-indigo-400" />
            <span>Explorar Flujos</span>
          </button>

          <button
            onClick={() => {
              onSelectPlaylist(null);
              onSelectView('library');
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
              activeView === 'library' && selectedPlaylistId === null
                ? 'bg-indigo-600/20 text-white border border-indigo-500/30 font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Library className="w-4 h-4 text-violet-400" />
            <span>Biblioteca Normal</span>
          </button>

          <button
            onClick={() => {
              onSelectPlaylist(null);
              onSelectView('offline');
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
              activeView === 'offline'
                ? 'bg-emerald-600/20 text-white border border-emerald-500/30 font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <HardDrive className="w-4 h-4 text-emerald-400" />
            <span>Música Sin Internet</span>
          </button>

          <button
            onClick={() => {
              onSelectPlaylist(null);
              onSelectView('favorites');
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
              activeView === 'favorites'
                ? 'bg-indigo-600/20 text-white border border-indigo-500/30 font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Heart className="w-4 h-4 text-rose-400" />
            <span>Canciones Favoritas</span>
          </button>
        </div>

        {/* Herramientas de Escucha y Enfoque */}
        <div className="pt-2 space-y-1">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3 block mb-1">
            Herramientas Exclusivas Aura
          </span>

          {onOpenAmbience && (
            <button
              onClick={onOpenAmbience}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors cursor-pointer"
            >
              <CloudRain className="w-3.5 h-3.5 text-cyan-400" />
              <span>Ambientes 3D (Lluvia/Fuego)</span>
            </button>
          )}

          {onOpenPomodoro && (
            <button
              onClick={onOpenPomodoro}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition-colors cursor-pointer"
            >
              <Timer className="w-3.5 h-3.5 text-indigo-400" />
              <span>Pomodoro Focus Flow</span>
            </button>
          )}

          {onOpenDriving && (
            <button
              onClick={onOpenDriving}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-amber-300 hover:bg-amber-500/10 transition-colors cursor-pointer"
            >
              <Car className="w-3.5 h-3.5 text-amber-400" />
              <span>Modo Conducción Coche</span>
            </button>
          )}
        </div>

        {/* Playlists Section */}
        <div className="pt-2">
          <div className="flex items-center justify-between px-3 mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Playlists Curadas
            </span>
            <button
              onClick={onCreatePlaylist}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              title="Crear nueva lista"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1">
            {playlists.map((pl) => {
              const isSelected = selectedPlaylistId === pl.id;
              return (
                <button
                  key={pl.id}
                  onClick={() => onSelectPlaylist(pl.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors text-left truncate cursor-pointer ${
                    isSelected
                      ? 'bg-white/10 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <ListMusic className="w-3.5 h-3.5 flex-shrink-0 text-slate-500" />
                  <span className="truncate">{pl.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Audio Engine Quality Badge */}
      <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
        <div className="flex items-center justify-between text-white font-medium">
          <span>Audio Puro sin Pérdida</span>
          <span className="text-emerald-400 text-[10px]">HI-RES</span>
        </div>
        <p className="text-[10px] text-slate-500">
          Sin algoritmos invasivos ni anuncios.
        </p>
      </div>
    </aside>
  );
};
