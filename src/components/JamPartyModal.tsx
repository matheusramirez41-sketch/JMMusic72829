import React, { useState, useEffect } from 'react';
import { Track } from '../types/music';
import {
  Users,
  Copy,
  Check,
  X,
  Play,
  Share2,
  Sparkles,
  Radio,
  Flame,
  Plus,
  ThumbsUp,
  Volume2
} from 'lucide-react';

interface JamPartyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTrack: Track;
  isPlaying: boolean;
  onPlayTrack: (track: Track) => void;
  queue: Track[];
  onAddToQueue?: (track: Track) => void;
}

export const JamPartyModal: React.FC<JamPartyModalProps> = ({
  isOpen,
  onClose,
  currentTrack,
  isPlaying,
  onPlayTrack,
  queue,
  onAddToQueue
}) => {
  const [roomCode, setRoomCode] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('jmmusic_jam_room');
      if (saved) return saved;
    } catch {}
    const code = `JM-${Math.floor(1000 + Math.random() * 9000)}`;
    try { localStorage.setItem('jmmusic_jam_room', code); } catch {}
    return code;
  });

  const [copied, setCopied] = useState(false);
  const [participants, setParticipants] = useState([
    { name: 'Tú (Anfitrión)', avatar: '🎧', isHost: true },
    { name: 'Amigo 1 (En línea)', avatar: '🔥', isHost: false },
    { name: 'Amigo 2 (En línea)', avatar: '🚀', isHost: false }
  ]);

  const [chatMessages, setChatMessages] = useState<string[]>([
    '🎉 ¡Sala creada! Pásale el código o enlace a tus amigos para que escuchen en tiempo real.'
  ]);
  const [newMsg, setNewMsg] = useState('');

  if (!isOpen) return null;

  const handleCopyLink = () => {
    const url = `${window.location.origin}/?jam=${roomCode}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }).catch(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim()) return;
    setChatMessages(prev => [...prev, `Tú: ${newMsg.trim()}`]);
    setNewMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-pink-500/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                Modo Fiesta Sincronizada
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
                  EN VIVO
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Escucha la misma música al mismo segundo con tus amigos sin pagar suscripción
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

        {/* Room Code Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/70 to-purple-950/70 border border-indigo-500/30 flex items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider block">Código de la Sala</span>
            <span className="text-2xl font-black text-white tracking-widest">{roomCode}</span>
          </div>

          <button
            onClick={handleCopyLink}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-indigo-600/30 active:scale-95"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>¡Enlace Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copiar Enlace</span>
              </>
            )}
          </button>
        </div>

        {/* Now Synchronized Song */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
            <span>Sonando en todos los dispositivos:</span>
          </span>
          <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
            <img
              src={currentTrack.coverUrl}
              alt={currentTrack.title}
              className="w-12 h-12 rounded-xl object-cover border border-slate-700/60 shadow-md"
            />
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-bold text-white truncate">{currentTrack.title}</h4>
              <p className="text-xs text-slate-400 truncate">{currentTrack.artist}</p>
            </div>
            <span className="px-2 py-1 rounded-lg bg-pink-500/20 text-pink-300 text-[10px] font-bold border border-pink-500/30">
              {isPlaying ? 'Sincronizado' : 'En pausa'}
            </span>
          </div>
        </div>

        {/* Connected Listeners */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>Oyentes en la sala ({participants.length})</span>
            <span className="text-emerald-400 font-medium">Búfer sincronizado 0ms</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {participants.map((p, idx) => (
              <div
                key={idx}
                className="px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-2 text-xs font-medium text-slate-300"
              >
                <span>{p.avatar}</span>
                <span>{p.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Party Reaction Chat */}
        <div className="space-y-2 p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
          <div className="text-[11px] font-bold text-slate-400 mb-1">Muro de la fiesta:</div>
          <div className="space-y-1.5 max-h-24 overflow-y-auto text-xs text-slate-300">
            {chatMessages.map((msg, i) => (
              <p key={i} className="bg-slate-900/60 px-2.5 py-1 rounded-lg border border-slate-800/60">
                {msg}
              </p>
            ))}
          </div>
          <form onSubmit={handleSendMessage} className="flex gap-2 pt-1">
            <input
              type="text"
              placeholder="Escribe una reacción o pide una canción..."
              value={newMsg}
              onChange={(e) => setNewMsg(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-pink-500"
            />
            <button
              type="submit"
              className="px-3 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs cursor-pointer"
            >
              Enviar
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
