import React, { useState, useRef } from 'react';
import {
  X,
  Sparkles,
  Download,
  Share2,
  Disc,
  Heart,
  Palette,
  Check,
  Camera
} from 'lucide-react';
import { Track } from '../types/music';

interface StoryCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTrack: Track | null;
}

export const StoryCardModal: React.FC<StoryCardModalProps> = ({
  isOpen,
  onClose,
  currentTrack
}) => {
  const [theme, setTheme] = useState<'neon' | 'midnight' | 'sunset' | 'emerald'>('neon');
  const [customQuote, setCustomQuote] = useState('Mi soundtrack de hoy 🎧');
  const [isExporting, setIsExporting] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !currentTrack) return null;

  const themes = {
    neon: {
      bg: 'from-purple-900 via-indigo-950 to-slate-950',
      border: 'border-purple-500/40',
      accent: 'text-pink-400',
      badge: 'bg-pink-500/20 text-pink-300 border-pink-500/40'
    },
    midnight: {
      bg: 'from-slate-900 via-slate-950 to-black',
      border: 'border-cyan-500/40',
      accent: 'text-cyan-400',
      badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
    },
    sunset: {
      bg: 'from-orange-950 via-amber-950 to-slate-950',
      border: 'border-amber-500/40',
      accent: 'text-amber-400',
      badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
    },
    emerald: {
      bg: 'from-emerald-950 via-teal-950 to-slate-950',
      border: 'border-emerald-500/40',
      accent: 'text-emerald-400',
      badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
    }
  };

  const currentTheme = themes[theme];

  const handleDownload = async () => {
    setIsExporting(true);
    try {
      // Use Canvas to render a high-res story card
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1350;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Draw background gradient
      const grad = ctx.createLinearGradient(0, 0, 1080, 1350);
      if (theme === 'neon') {
        grad.addColorStop(0, '#3b0764');
        grad.addColorStop(0.5, '#1e1b4b');
        grad.addColorStop(1, '#020617');
      } else if (theme === 'sunset') {
        grad.addColorStop(0, '#451a03');
        grad.addColorStop(0.5, '#292524');
        grad.addColorStop(1, '#0c0a09');
      } else if (theme === 'emerald') {
        grad.addColorStop(0, '#022c22');
        grad.addColorStop(0.5, '#064e3b');
        grad.addColorStop(1, '#020617');
      } else {
        grad.addColorStop(0, '#0f172a');
        grad.addColorStop(1, '#020617');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1080, 1350);

      // Draw Brand Header
      ctx.font = 'bold 36px sans-serif';
      ctx.fillStyle = '#a855f7';
      ctx.fillText('JMMUSIC • VIRTUAL VINYL', 100, 120);

      // Draw Quote
      ctx.font = 'italic 44px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`"${customQuote}"`, 100, 200);

      // Draw Cover Image if loaded
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = currentTrack.coverUrl;
      await new Promise((res) => {
        img.onload = res;
        img.onerror = res;
      });

      // Cover frame with rounded corners
      ctx.save();
      const coverX = 140;
      const coverY = 280;
      const coverSize = 800;
      ctx.beginPath();
      ctx.roundRect(coverX, coverY, coverSize, coverSize, 40);
      ctx.clip();
      ctx.drawImage(img, coverX, coverY, coverSize, coverSize);
      ctx.restore();

      // Title & Artist
      ctx.font = 'bold 64px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(currentTrack.title.slice(0, 28), 100, 1160);

      ctx.font = '42px sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(currentTrack.artist.slice(0, 32), 100, 1225);

      // Watermark link
      ctx.font = 'bold 30px sans-serif';
      ctx.fillStyle = '#c084fc';
      ctx.fillText('Escúchalo en: JMMUSIC Studio App', 100, 1285);

      // Download
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `JMMUSIC-${currentTrack.title.replace(/\s+/g, '_')}.png`;
      a.click();
    } catch (err) {
      console.error('Error generating card:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 text-white overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
                Tarjeta para Historias
              </h2>
              <p className="text-xs text-slate-400">Exporta para Instagram, TikTok y WhatsApp</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-full transition-all"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Preview Card */}
        <div
          ref={cardRef}
          className={`mt-5 p-5 rounded-3xl bg-gradient-to-b ${currentTheme.bg} border ${currentTheme.border} shadow-2xl relative overflow-hidden flex flex-col items-center text-center`}
        >
          {/* Badge */}
          <div className="flex items-center justify-between w-full mb-3">
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${currentTheme.badge}`}>
              JMMUSIC STORY
            </span>
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <Disc className="w-3.5 h-3.5 animate-spin" />
              <span>Alta Fidelidad</span>
            </div>
          </div>

          {/* Custom Quote text */}
          <p className="text-xs font-semibold text-white/90 italic mb-4">
            "{customQuote}"
          </p>

          {/* Album artwork in vinyl frame */}
          <div className="relative w-44 h-44 rounded-2xl overflow-hidden shadow-2xl border border-white/10 group">
            <img
              src={currentTrack.coverUrl}
              alt={currentTrack.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          </div>

          {/* Song info */}
          <div className="mt-4 w-full">
            <h3 className="font-extrabold text-base text-white truncate">
              {currentTrack.title}
            </h3>
            <p className="text-xs text-slate-400 truncate mt-0.5">
              {currentTrack.artist}
            </p>
          </div>

          {/* Animated audio wave bars */}
          <div className="flex items-center gap-1.5 mt-3 h-5">
            {[4, 12, 18, 10, 16, 22, 14, 8, 19, 13, 7].map((h, i) => (
              <span
                key={i}
                className="w-1 bg-gradient-to-t from-pink-500 to-purple-400 rounded-full animate-pulse"
                style={{
                  height: `${h}px`,
                  animationDelay: `${i * 0.1}s`
                }}
              />
            ))}
          </div>
        </div>

        {/* Custom Quote Input */}
        <div className="mt-4 space-y-1.5">
          <label className="text-xs font-semibold text-slate-400">
            Frase personalizada para tu Historia:
          </label>
          <input
            type="text"
            value={customQuote}
            onChange={(e) => setCustomQuote(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-purple-500 transition-all"
            placeholder="Escribe tu frase aquí..."
          />
        </div>

        {/* Themes */}
        <div className="mt-4 space-y-1.5">
          <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-purple-400" />
            Tema de Color
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: 'neon', label: 'Neón', color: 'bg-purple-600' },
              { id: 'midnight', label: 'Midnight', color: 'bg-cyan-600' },
              { id: 'sunset', label: 'Sunset', color: 'bg-amber-600' },
              { id: 'emerald', label: 'Esmeralda', color: 'bg-emerald-600' }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id as any)}
                className={`py-2 px-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                  theme === t.id
                    ? 'bg-slate-800 border border-purple-500 text-white'
                    : 'bg-slate-950/60 text-slate-400 hover:text-white'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${t.color}`} />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Download action */}
        <div className="mt-5">
          <button
            onClick={handleDownload}
            disabled={isExporting}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-600/30 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Download className="w-4 h-4" />
            {isExporting ? 'Generando Imagen HD...' : 'Descargar Tarjeta en Alta Resolución'}
          </button>
        </div>
      </div>
    </div>
  );
};
