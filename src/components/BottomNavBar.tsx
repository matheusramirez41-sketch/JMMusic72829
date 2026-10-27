import React from 'react';
import {
  Search,
  Library,
  ArrowDownCircle,
  HardDrive
} from 'lucide-react';

export type AppView = 'browse' | 'library' | 'favorites' | 'now-playing' | 'offline';

interface BottomNavBarProps {
  activeView: AppView;
  onSelectView: (view: AppView) => void;
  favoritesCount?: number;
  offlineCount: number;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeView,
  onSelectView,
  offlineCount
}) => {
  // Only the 3 requested buttons: Buscar, Biblioteca, Descargas
  const navItems = [
    {
      id: 'browse' as AppView,
      label: 'Buscar',
      icon: Search,
      description: 'Buscador y catálogo de canciones'
    },
    {
      id: 'library' as AppView,
      label: 'Biblioteca Normal',
      icon: Library,
      description: 'Biblioteca normal, playlists y canciones'
    },
    {
      id: 'offline' as AppView,
      label: 'Sin Internet',
      icon: HardDrive,
      badge: offlineCount,
      description: 'Música guardada para escuchar sin conexión'
    }
  ];

  return (
    <nav className="bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/80 px-4 py-2 z-30 select-none shadow-2xl">
      <div className="max-w-md mx-auto flex items-center justify-around gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all cursor-pointer relative ${
                isActive
                  ? 'text-indigo-400 font-bold bg-indigo-500/10 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 text-indigo-400' : ''}`} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-2 bg-emerald-500 text-slate-950 text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center shadow-md">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-1 tracking-tight truncate max-w-full">
                {item.label}
              </span>
              {isActive && (
                <span className="w-1.5 h-1 rounded-full bg-indigo-400 mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
