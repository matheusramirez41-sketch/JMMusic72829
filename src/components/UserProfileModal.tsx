import React, { useState, useRef } from 'react';
import {
  X,
  Camera,
  Check,
  Sparkles,
  Headphones,
  ShieldCheck,
  Music2,
  Heart,
  Flame,
  Award,
  Sliders,
  DownloadCloud
} from 'lucide-react';

export interface UserProfileData {
  name: string;
  avatarUrl: string;
  tagline: string;
  favoriteGenre: string;
  audioQuality: string;
}

export const DEFAULT_AVATARS = [
  {
    id: 'anime-headphones',
    name: 'Audiófilo Anime Sony Hi-Res (Personalizado)',
    url: '/avatar.jpg'
  },
  {
    id: 'desierto-sonora',
    name: 'Desierto de Sonora y Pitayas',
    url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'sonora-cielo',
    name: 'Cielo Dorado del Noroeste',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'sound-artist',
    name: 'Estudio Musical',
    url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'cyber-audiophile',
    name: 'Audiófilo Hi-Fi',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80'
  }
];

export const DEFAULT_USER_PROFILE: UserProfileData = {
  name: 'JM Master',
  avatarUrl: '/avatar.jpg',
  tagline: 'Desde Hermosillo, Sonora • Disfrutando música en máxima fidelidad con sonido envolvente.',
  favoriteGenre: 'Urbano / Regional Hi-Fi / Pop / Electrónica',
  audioQuality: 'Master FLAC 24-bit DSP'
};

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfileData;
  onSaveProfile: (profile: UserProfileData) => void;
  favoriteTracksCount: number;
  offlineTracksCount: number;
  playlistsCount: number;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
  favoriteTracksCount,
  offlineTracksCount,
  playlistsCount
}) => {
  const [name, setName] = useState(profile.name);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);
  const [tagline, setTagline] = useState(profile.tagline);
  const [favoriteGenre, setFavoriteGenre] = useState(profile.favoriteGenre);
  const [isSaved, setIsSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleCustomPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Por favor selecciona una imagen menor a 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAvatarUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    onSaveProfile({
      name: name.trim() || 'JM Master',
      avatarUrl,
      tagline: tagline.trim() || DEFAULT_USER_PROFILE.tagline,
      favoriteGenre: favoriteGenre.trim() || DEFAULT_USER_PROFILE.favoriteGenre,
      audioQuality: profile.audioQuality
    });
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 flex flex-col max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Profile Card Header */}
        <div className="flex flex-col items-center text-center space-y-4 pt-2">
          {/* Main Avatar with Glowing Ring */}
          <div className="relative group">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl p-1 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 shadow-2xl shadow-indigo-500/30">
              <img
                src={avatarUrl}
                alt={name}
                className="w-full h-full object-cover rounded-[22px] bg-slate-950"
              />
            </div>

            {/* Change Photo Overlay Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-2 -right-2 p-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/40 border-2 border-slate-900 transition-all cursor-pointer active:scale-95"
              title="Subir foto propia desde tu dispositivo"
            >
              <Camera className="w-4 h-4" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleCustomPhoto}
              accept="image/*"
              className="hidden"
            />
          </div>

          <div>
            <div className="flex items-center justify-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">{name}</h2>
              <span className="p-1 rounded-full bg-indigo-500/20 text-indigo-400" title="Perfil Verificado Hi-Fi">
                <ShieldCheck className="w-4 h-4" />
              </span>
            </div>
            <p className="text-xs text-indigo-300/80 font-medium mt-0.5 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <span>Miembro Fundador JMMUSIC • Hi-Fi Audio</span>
            </p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 my-6">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3 text-center">
            <div className="flex items-center justify-center text-rose-400 mb-1">
              <Heart className="w-4 h-4" />
            </div>
            <span className="text-base sm:text-lg font-black text-white">{favoriteTracksCount}</span>
            <p className="text-[10px] text-slate-400">Favoritas</p>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3 text-center">
            <div className="flex items-center justify-center text-emerald-400 mb-1">
              <DownloadCloud className="w-4 h-4" />
            </div>
            <span className="text-base sm:text-lg font-black text-white">{offlineTracksCount}</span>
            <p className="text-[10px] text-slate-400">Descargadas</p>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3 text-center">
            <div className="flex items-center justify-center text-indigo-400 mb-1">
              <Music2 className="w-4 h-4" />
            </div>
            <span className="text-base sm:text-lg font-black text-white">{playlistsCount}</span>
            <p className="text-[10px] text-slate-400">Playlists</p>
          </div>
        </div>

        {/* Avatar Preset Gallery */}
        <div className="space-y-2 mb-6">
          <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
            <span>Elegir Foto de Perfil Representativa</span>
            <span className="text-[11px] text-indigo-400 font-normal">Toca para seleccionar</span>
          </label>
          <div className="grid grid-cols-5 gap-2.5">
            {DEFAULT_AVATARS.map((av) => {
              const isSelected = avatarUrl === av.url;
              return (
                <button
                  key={av.id}
                  onClick={() => setAvatarUrl(av.url)}
                  className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all cursor-pointer group ${
                    isSelected
                      ? 'border-indigo-400 ring-4 ring-indigo-500/20 scale-105 shadow-lg'
                      : 'border-slate-800 hover:border-slate-600 opacity-80 hover:opacity-100'
                  }`}
                  title={av.name}
                >
                  <img src={av.url} alt={av.name} className="w-full h-full object-cover" />
                  {isSelected && (
                    <div className="absolute inset-0 bg-indigo-600/40 flex items-center justify-center text-white">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Edit Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Tu Nombre o Alias
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              placeholder="Ej. JM Master"
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Frase o Estado Musical
            </label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              maxLength={100}
              placeholder="Ej. Sintiéndome en el estudio con audio puro..."
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Género / Estilo Favorito
            </label>
            <input
              type="text"
              value={favoriteGenre}
              onChange={(e) => setFavoriteGenre(e.target.value)}
              maxLength={50}
              placeholder="Ej. Reggaeton / Trap / Pop / Electrónica"
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer active:scale-95"
          >
            {isSaved ? (
              <>
                <Check className="w-4 h-4" />
                <span>¡Guardado con Éxito!</span>
              </>
            ) : (
              <span>Guardar Perfil</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
