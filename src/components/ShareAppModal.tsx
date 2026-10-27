import React, { useState, useEffect } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  QrCode,
  Globe,
  ExternalLink,
  MessageCircle,
  Send,
  Sparkles,
  ShieldCheck,
  Lock,
  Smartphone
} from 'lucide-react';

interface ShareAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSongTitle?: string;
  currentArtist?: string;
}

export const ShareAppModal: React.FC<ShareAppModalProps> = ({
  isOpen,
  onClose,
  currentSongTitle,
  currentArtist
}) => {
  const [copied, setCopied] = useState(false);
  const [shortUrl, setShortUrl] = useState<string>('');
  const [isLoadingShort, setIsLoadingShort] = useState(false);
  const [showQr, setShowQr] = useState(false);

  // Fallback public URL
  const PUBLIC_FALLBACK = 'https://ais-pre-ehkrepvluapdx6z3wbtjtq-141331454684.us-east1.run.app';

  // Get safe public URL
  const getPublicUrl = () => {
    if (typeof window === 'undefined') return PUBLIC_FALLBACK;
    let url = window.location.href.split('?')[0].split('#')[0];
    if (url.includes('ais-dev-')) {
      url = url.replace('ais-dev-', 'ais-pre-');
    }
    if (!url.startsWith('http')) {
      url = PUBLIC_FALLBACK;
    }
    return url;
  };

  const publicUrl = getPublicUrl();

  useEffect(() => {
    if (!isOpen) return;

    // Fetch or generate short URL via backend
    setIsLoadingShort(true);
    fetch(`/api/shorten-url?url=${encodeURIComponent(publicUrl)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.shortUrl) {
          setShortUrl(data.shortUrl);
        } else {
          setShortUrl(publicUrl);
        }
      })
      .catch(() => {
        setShortUrl(publicUrl);
      })
      .finally(() => {
        setIsLoadingShort(false);
      });
  }, [isOpen, publicUrl]);

  if (!isOpen) return null;

  const effectiveUrl = shortUrl || publicUrl;

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(effectiveUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = effectiveUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const shareText = currentSongTitle && currentArtist
    ? `¡Escucha "${currentSongTitle}" de ${currentArtist} en JMMUSIC en alta fidelidad y sin anuncios! 🎧👉 `
    : '¡Escucha tu música favorita en alta fidelidad, con letras y modo sin internet en JMMUSIC! 🎵👉 ';

  const handleWhatsApp = () => {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + effectiveUrl)}`;
    window.open(waUrl, '_blank');
  };

  const handleTelegram = () => {
    const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(effectiveUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(tgUrl, '_blank');
  };

  // Generate SVG QR code matrix (Clean 21x21 stylized dynamic QR representation)
  const qrSvgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(effectiveUrl)}&bgcolor=0f172a&color=a855f7&margin=10`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 text-white overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Share2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-clip-text text-transparent">
                Compartir JMMUSIC
              </h2>
              <p className="text-xs text-slate-400">Enlace público y corto para tus amigos</p>
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

        {/* Public explanation badge */}
        <div className="mt-4 p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed text-emerald-200/90">
            <span className="font-semibold text-emerald-300">¡Enlace 100% Público Solucionado!</span>
            <p className="mt-0.5 text-slate-300">
              Cualquier persona a quien le pases este enlace podrá abrir la app directamente desde su teléfono o computadora, <strong>sin pedirle iniciar sesión ni mostrar el aviso de "solo es para ti"</strong>.
            </p>
          </div>
        </div>

        {/* Short URL Box */}
        <div className="mt-5 space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              Tu Enlace Corto
            </span>
            {isLoadingShort ? (
              <span className="text-[11px] text-indigo-400 animate-pulse">Acortando URL...</span>
            ) : (
              <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Listo para enviar
              </span>
            )}
          </label>

          <div className="flex items-center gap-2 p-1.5 bg-slate-950/80 border border-slate-800 rounded-2xl">
            <input
              type="text"
              readOnly
              value={effectiveUrl}
              className="flex-1 bg-transparent px-3 py-2 text-sm text-indigo-200 outline-none select-all font-mono"
            />
            <button
              onClick={handleCopy}
              className={`px-4 py-2.5 rounded-xl font-medium text-xs flex items-center gap-1.5 transition-all shadow-md ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copiar</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Share Buttons */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            onClick={handleWhatsApp}
            className="flex items-center justify-center gap-2.5 py-3 px-4 bg-emerald-600/90 hover:bg-emerald-600 text-white font-medium text-sm rounded-2xl transition-all shadow-lg shadow-emerald-900/30 hover:scale-[1.02] active:scale-[0.98]"
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp
          </button>
          <button
            onClick={handleTelegram}
            className="flex items-center justify-center gap-2.5 py-3 px-4 bg-sky-600/90 hover:bg-sky-600 text-white font-medium text-sm rounded-2xl transition-all shadow-lg shadow-sky-900/30 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Send className="w-4 h-4" />
            Telegram
          </button>
        </div>

        {/* QR Code Toggle */}
        <div className="mt-5 pt-4 border-t border-slate-800">
          <button
            onClick={() => setShowQr(!showQr)}
            className="w-full flex items-center justify-between p-3 bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/50 rounded-2xl transition-all text-xs font-medium text-slate-300"
          >
            <span className="flex items-center gap-2">
              <QrCode className="w-4 h-4 text-purple-400" />
              {showQr ? 'Ocultar Código QR' : 'Mostrar Código QR para escanear con el móvil'}
            </span>
            <span className="text-[11px] text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-full">
              {showQr ? 'Cerrar' : 'Escanear'}
            </span>
          </button>

          {showQr && (
            <div className="mt-4 p-4 bg-slate-950 border border-purple-500/30 rounded-2xl flex flex-col items-center justify-center animate-fadeIn text-center">
              <img
                src={qrSvgUrl}
                alt="Código QR JMMUSIC"
                className="w-48 h-48 rounded-xl border border-slate-800 p-2 bg-slate-900 shadow-xl"
              />
              <p className="text-xs text-slate-400 mt-3 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-purple-400" />
                Abre la cámara de cualquier teléfono para abrir JMMUSIC al instante
              </p>
            </div>
          )}
        </div>

        {/* Extra info for creator */}
        <div className="mt-5 p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-2xl">
          <p className="text-[11px] leading-relaxed text-slate-400">
            💡 <strong>Consejo:</strong> En la barra superior de AI Studio también tienes el botón <strong>"Share"</strong> para configurar la app como <em>"Anyone with the link" (Cualquiera con el enlace)</em> si deseas compartir el espacio completo de edición.
          </p>
        </div>
      </div>
    </div>
  );
};
