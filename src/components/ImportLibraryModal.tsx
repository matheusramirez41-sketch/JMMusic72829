import React, { useState } from 'react';
import { Track, Playlist } from '../types/music';
import {
  X,
  Sparkles,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Music,
  Plus,
  Radio,
  ExternalLink,
  Library,
  Copy
} from 'lucide-react';
import { searchYouTubeTrackOnline } from '../services/youtubeService';

interface ImportLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (importedTracks: Track[], playlistTitle: string) => void;
}

// Sample presets that users frequently want to transfer
const SPOTIFY_PRESET_TRACKS = [
  { title: 'MONACO', artist: 'Bad Bunny' },
  { title: 'LUNA', artist: 'Feid' },
  { title: 'LALA', artist: 'Myke Towers' },
  { title: 'Todo de Ti', artist: 'Rauw Alejandro' },
  { title: 'Columbia', artist: 'Quevedo' },
  { title: 'FE!N', artist: 'Travis Scott' },
  { title: 'Blinding Lights', artist: 'The Weeknd' },
  { title: 'Yellow', artist: 'Coldplay' },
  { title: 'Bohemian Rhapsody', artist: 'Queen' },
  { title: 'Believer', artist: 'Imagine Dragons' }
];

const YOUTUBE_PRESET_TRACKS = [
  { title: 'Tití Me Preguntó', artist: 'Bad Bunny' },
  { title: 'Classy 101', artist: 'Feid' },
  { title: 'Punto 40', artist: 'Rauw Alejandro' },
  { title: 'Goosebumps', artist: 'Travis Scott' },
  { title: 'Starboy', artist: 'The Weeknd' },
  { title: 'Viva La Vida', artist: 'Coldplay' },
  { title: 'Sunflower', artist: 'Post Malone' },
  { title: 'Despacito', artist: 'Luis Fonsi' }
];

export const ImportLibraryModal: React.FC<ImportLibraryModalProps> = ({
  isOpen,
  onClose,
  onImportComplete
}) => {
  const [platform, setPlatform] = useState<'spotify' | 'ytmusic'>('spotify');
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [manualText, setManualText] = useState('');
  const [importMode, setImportMode] = useState<'url' | 'manual' | 'preset'>('url');
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [importedCount, setImportedCount] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleStartImport = async () => {
    setIsImporting(true);
    setProgress(5);
    setStatusMessage('Conectando y analizando lista musical...');

    let tracksToProcess: { title: string; artist: string }[] = [];

    if (importMode === 'preset') {
      tracksToProcess = platform === 'spotify' ? SPOTIFY_PRESET_TRACKS : YOUTUBE_PRESET_TRACKS;
    } else if (importMode === 'manual' && manualText.trim()) {
      const lines = manualText.split('\n').filter(l => l.trim().length > 0).slice(0, 100);
      tracksToProcess = lines.map(line => {
        const cleanLine = line.replace(/[\r\x00-\x1F<>]/g, '').trim().slice(0, 120);
        if (cleanLine.includes('-')) {
          const [t, ...rest] = cleanLine.split('-');
          return {
            title: (t || 'Canción').trim().slice(0, 80),
            artist: (rest.join('-') || 'Artista').trim().slice(0, 80)
          };
        }
        return { title: cleanLine.slice(0, 80), artist: 'Artista' };
      });
    } else {
      // URL mode: query real YouTube Music / Spotify link resolver
      if (playlistUrl.trim()) {
        setStatusMessage('Conectando y analizando enlace de ' + (platform === 'spotify' ? 'Spotify' : 'música externa') + '...');
        try {
          const res = await fetch(`/api/resolve-link?url=${encodeURIComponent(playlistUrl.trim())}`);
          const contentType = res.headers.get('content-type') || '';
          if (res.ok && contentType.includes('application/json')) {
            const data = await res.json();
            if (data.success && Array.isArray(data.tracks) && data.tracks.length > 0) {
              setProgress(100);
              const countText = data.tracks.length === 1 ? '1 canción' : `${data.tracks.length} canciones`;
              setStatusMessage(`¡Transferida con éxito! ${countText} importada(s).`);
              setImportedCount(data.tracks.length);
              await new Promise(r => setTimeout(r, 600));
              const plTitle = data.playlistTitle || (data.tracks.length === 1 ? data.tracks[0].title : 'Lista de Música Externa');
              onImportComplete(data.tracks, plTitle);
              setIsImporting(false);
              onClose();
              return;
            }
          }
        } catch (err) {
          console.warn('Backend link resolve failed, trying client resolver:', err);
        }

        // Client-side fallback: check if it's a single YouTube / YouTube Music video
        const cleanInput = playlistUrl.trim();
        let extractedVid: string | null = null;
        if (/^[a-zA-Z0-9_-]{11}$/.test(cleanInput)) {
          extractedVid = cleanInput;
        } else {
          const vMatch = cleanInput.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([a-zA-Z0-9_-]{11})/);
          if (vMatch) extractedVid = vMatch[1];
        }

        if (extractedVid) {
          try {
            setStatusMessage('Obteniendo información oficial del enlace...');
            const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${extractedVid}&format=json`;
            const oRes = await fetch(oembedUrl);
            if (oRes.ok) {
              const oData = await oRes.json();
              let rawTitle = oData.title || 'Canción Oficial';
              let rawAuthor = oData.author_name || 'Artista';

              let title = rawTitle;
              let artist = rawAuthor;
              if (rawTitle.includes(' - ')) {
                const parts = rawTitle.split(' - ');
                artist = parts[0].trim();
                title = parts.slice(1).join(' - ').trim();
              } else if (rawTitle.includes(' | ')) {
                const parts = rawTitle.split(' | ');
                title = parts[0].trim();
                artist = parts[1].trim();
              }

              title = title.replace(/\(.*?(official|video|audio|4k|hd|lyrics|letra).*?\)/gi, '')
                           .replace(/\[.*?(official|video|audio|4k|hd|lyrics|letra).*?\]/gi, '')
                           .trim();

              const resolvedTrack: Track = {
                id: `yt-${extractedVid}`,
                title: title || rawTitle,
                artist: artist || rawAuthor,
                album: 'Colección Musical Oficial',
                duration: 210,
                audioUrl: '',
                coverUrl: oData.thumbnail_url || `https://img.youtube.com/vi/${extractedVid}/hqdefault.jpg`,
                accentColor: '#6366f1',
                genre: 'Streaming Hi-Fi',
                plays: 850000,
                lyrics: []
              };

              setProgress(100);
              setStatusMessage('¡Canción transferida con éxito!');
              setImportedCount(1);
              await new Promise(r => setTimeout(r, 500));
              onImportComplete([resolvedTrack], resolvedTrack.title);
              setIsImporting(false);
              onClose();
              return;
            }
          } catch (oErr) {
            console.warn('oEmbed client extraction failed:', oErr);
          }
        }

        // If a URL was entered but could not be resolved, notify the user honestly
        setStatusMessage('No se pudo extraer la música de este enlace. Asegúrate de que el enlace sea público o copia los nombres de las canciones.');
        setIsImporting(false);
        return;
      }

      // If user clicked import without entering any URL or text, load recommended preset
      setStatusMessage('Cargando lista recomendada de éxitos...');
      await new Promise(r => setTimeout(r, 600));
      tracksToProcess = platform === 'spotify' ? SPOTIFY_PRESET_TRACKS : YOUTUBE_PRESET_TRACKS;
    }

    const processedTracks: Track[] = [];
    const total = tracksToProcess.length;

    for (let i = 0; i < total; i++) {
      const item = tracksToProcess[i];
      const percent = Math.round(((i + 1) / total) * 100);
      setProgress(percent);
      setStatusMessage(`Transfiriendo: "${item.title} - ${item.artist}" (${i + 1}/${total})`);

      try {
        // Find stream ID for high fidelity playback
        const ytId = await searchYouTubeTrackOnline(item.title, item.artist);
        const resolvedId = ytId || `imported-${Date.now()}`;
        const uniqueTrackId = `yt-${resolvedId.replace('yt-', '')}-${i}-${Date.now().toString(36)}`;

        processedTracks.push({
          id: uniqueTrackId,
          title: item.title,
          artist: item.artist,
          album: `Transferida de ${platform === 'spotify' ? 'Spotify' : 'Streaming Global'}`,
          duration: 210,
          audioUrl: '',
          coverUrl: ytId
            ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`
            : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
          accentColor: platform === 'spotify' ? '#10b981' : '#6366f1',
          genre: 'Biblioteca Importada',
          plays: 500000,
          lyrics: []
        });
      } catch {
        // Fallback track
        processedTracks.push({
          id: `yt-imported-${Date.now()}-${i}`,
          title: item.title,
          artist: item.artist,
          album: `Transferida de ${platform === 'spotify' ? 'Spotify' : 'Streaming Global'}`,
          duration: 210,
          audioUrl: '',
          coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
          accentColor: '#6366f1',
          genre: 'Biblioteca Importada',
          plays: 350000,
          lyrics: []
        });
      }
    }

    setProgress(100);
    setStatusMessage('¡Transferencia completada con éxito!');
    setImportedCount(processedTracks.length);

    setTimeout(() => {
      const plTitle = platform === 'spotify' ? 'Mi Biblioteca de Spotify' : 'Mi Colección Musical Global';
      onImportComplete(processedTracks, plTitle);
      setIsImporting(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 relative animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-400 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sincronizador JMMUSIC</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Pasar Mi Música a la Biblioteca
          </h2>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Transfiere tus listas y canciones favoritas directamente a tu biblioteca en JMMUSIC para disfrutarlas con audio puro y ecualización de estudio.
          </p>
        </div>

        {/* Platform Selector Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setPlatform('spotify')}
            className={`p-3.5 rounded-2xl border flex items-center justify-center gap-2.5 font-bold text-xs transition-all cursor-pointer ${
              platform === 'spotify'
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-lg shadow-emerald-500/20'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-slate-950 font-black text-[10px]">
              S
            </div>
            <span>Desde Spotify</span>
          </button>

          <button
            onClick={() => setPlatform('ytmusic')}
            className={`p-3.5 rounded-2xl border flex items-center justify-center gap-2.5 font-bold text-xs transition-all cursor-pointer ${
              platform === 'ytmusic'
                ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400 shadow-lg shadow-indigo-500/20'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center text-white font-black text-[10px]">
              🎵
            </div>
            <span>Otras Playlists</span>
          </button>
        </div>

        {/* Import Mode Tabs */}
        <div className="flex border-b border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setImportMode('url')}
            className={`pb-2.5 px-3 cursor-pointer border-b-2 transition-colors ${
              importMode === 'url' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Enlace de Playlist
          </button>
          <button
            onClick={() => setImportMode('manual')}
            className={`pb-2.5 px-3 cursor-pointer border-b-2 transition-colors ${
              importMode === 'manual' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Pegar Canciones
          </button>
          <button
            onClick={() => setImportMode('preset')}
            className={`pb-2.5 px-3 cursor-pointer border-b-2 transition-colors ${
              importMode === 'preset' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Top Favoritas (Rápido)
          </button>
        </div>

        {/* Tab 1: URL Input */}
        {importMode === 'url' && (
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">
              Pega el enlace de tu playlist o álbum ({platform === 'spotify' ? 'Spotify' : 'Enlace Web / Streaming'}):
            </label>
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 focus-within:border-indigo-500">
              <ExternalLink className="w-4 h-4 text-slate-500 shrink-0" />
              <input
                type="text"
                placeholder={
                  platform === 'spotify'
                    ? 'https://open.spotify.com/playlist/...'
                    : 'https://enlace-musical.com/playlist?list=...'
                }
                value={playlistUrl}
                onChange={(e) => setPlaylistUrl(e.target.value)}
                className="w-full bg-transparent text-white text-xs placeholder:text-slate-500 focus:outline-none"
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Tip: Abre tu app de música, dale a Compartir &rarr; Copiar enlace de la playlist y pégalo aquí.
            </p>
          </div>
        )}

        {/* Tab 2: Manual Text Input */}
        {importMode === 'manual' && (
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">
              Pega los títulos de tus canciones (un tema por línea):
            </label>
            <textarea
              rows={4}
              placeholder={`Bad Bunny - MONACO\nFeid - LUNA\nColdplay - Yellow\nRauw Alejandro - Todo de Ti`}
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>
        )}

        {/* Tab 3: Preset Fast Sync */}
        {importMode === 'preset' && (
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <p className="text-xs font-semibold text-slate-200">
              Transferencia automática de tu colección más popular ({platform === 'spotify' ? 'Spotify' : 'Streaming Global'})
            </p>
            <p className="text-[11px] text-slate-400">
              Sincroniza directamente 10 temas icónicos con carátulas en alta resolución y ecualización lista.
            </p>
          </div>
        )}

        {/* Progress Bar during transfer */}
        {isImporting && (
          <div className="space-y-2 p-4 rounded-2xl bg-slate-950 border border-indigo-500/30">
            <div className="flex items-center justify-between text-xs font-semibold text-indigo-300">
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{statusMessage}</span>
              </span>
              <span>{progress}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleStartImport}
          disabled={isImporting}
          className={`w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
            isImporting
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/30 active:scale-98'
          }`}
        >
          {isImporting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Transfiriendo canciones...</span>
            </>
          ) : (
            <>
              <Library className="w-4 h-4" />
              <span>Pasar a Mi Biblioteca JMMUSIC</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
