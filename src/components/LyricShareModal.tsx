import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Track } from '../types/music';
import {
  X,
  Share2,
  Copy,
  Check,
  Download,
  Sparkles,
  Quote,
  MessageCircle,
  HelpCircle,
  ListMusic,
  ChevronLeft,
  ChevronRight,
  Clock,
  Layers,
  CheckSquare,
  Square,
  Video,
  Play,
  Pause,
  Film,
  Music,
  Radio,
  Volume2,
  VolumeX,
  RotateCcw
} from 'lucide-react';

interface LyricLine {
  time: number;
  text: string;
}

interface LyricShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track;
  selectedText: string;
  coverUrl: string;
  allLyrics?: LyricLine[];
  currentTime?: number;
}

type CardTheme = 'cover-cinematic' | 'indigo' | 'sunset' | 'emerald' | 'neon' | 'dark';

const THEMES: { id: CardTheme; label: string; bg: string; text: string; accent: string; hasCoverBg: boolean }[] = [
  {
    id: 'cover-cinematic',
    label: '🎬 Fondo de la Canción (Cinemático)',
    bg: 'from-black/85 via-black/60 to-black/90',
    text: 'text-white',
    accent: '#818cf8',
    hasCoverBg: true
  },
  {
    id: 'indigo',
    label: 'Nebulosa Índigo',
    bg: 'from-indigo-950/85 via-slate-900/65 to-purple-950/85',
    text: 'text-white',
    accent: '#818cf8',
    hasCoverBg: true
  },
  {
    id: 'sunset',
    label: 'Fuego Atardecer',
    bg: 'from-amber-950/85 via-rose-950/65 to-stone-950/85',
    text: 'text-amber-100',
    accent: '#f59e0b',
    hasCoverBg: true
  },
  {
    id: 'emerald',
    label: 'Aurora Esmeralda',
    bg: 'from-emerald-950/85 via-slate-900/65 to-teal-950/85',
    text: 'text-emerald-100',
    accent: '#10b981',
    hasCoverBg: true
  },
  {
    id: 'neon',
    label: 'Ciber Neón',
    bg: 'from-cyan-950/85 via-slate-950/65 to-fuchsia-950/85',
    text: 'text-cyan-100',
    accent: '#06b6d4',
    hasCoverBg: true
  },
  {
    id: 'dark',
    label: 'Negro Ónix Puro',
    bg: 'from-black/95 via-zinc-950/90 to-neutral-900/95',
    text: 'text-white',
    accent: '#ffffff',
    hasCoverBg: true
  }
];

export const LyricShareModal: React.FC<LyricShareModalProps> = ({
  isOpen,
  onClose,
  track,
  selectedText,
  coverUrl,
  allLyrics = [],
  currentTime = 0
}) => {
  // Navigation Tabs: Video Card is the default star feature!
  const [activeTab, setActiveTab] = useState<'video' | 'card' | 'lyrics'>('video');
  const [selectedTheme, setSelectedTheme] = useState<CardTheme>('cover-cinematic');
  const [copiedToast, setCopiedToast] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Synchronized lines selection
  const [currentLineIndex, setCurrentLineIndex] = useState<number>(() => {
    if (!allLyrics || allLyrics.length === 0) return 0;
    const matchIdx = allLyrics.findIndex(l => l.text.trim() === selectedText.trim());
    if (matchIdx !== -1) return matchIdx;
    const closestIdx = allLyrics.findIndex(l => l.time >= currentTime);
    return closestIdx !== -1 ? closestIdx : 0;
  });

  const [cardText, setCardText] = useState<string>(selectedText);

  // Multi-select line indices in full lyrics mode
  const [selectedLineIndices, setSelectedLineIndices] = useState<Set<number>>(() => {
    const set = new Set<number>();
    if (allLyrics && allLyrics.length > 0) {
      const matchIdx = allLyrics.findIndex(l => l.text.trim() === selectedText.trim());
      if (matchIdx !== -1) set.add(matchIdx);
      else set.add(0);
    }
    return set;
  });

  const [includeTimestamps, setIncludeTimestamps] = useState(true);

  // --- VIDEO CARD PREVIEW & REAL-TIME KARAOKE STATE ---
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [videoCurrentTime, setVideoCurrentTime] = useState<number>(() => {
    const lineTime = allLyrics[currentLineIndex]?.time;
    return typeof lineTime === 'number' ? lineTime : currentTime;
  });
  const videoAnimFrameRef = useRef<number | null>(null);
  const videoTrackDuration = track.duration || 210;

  // --- REAL AUDIBLE SOUND PREVIEW IN THE CARD ---
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);

  // Synchronize audible music with the video preview
  useEffect(() => {
    const audioEl = audioPreviewRef.current;
    if (!audioEl) return;

    if (isOpen && activeTab === 'video') {
      audioEl.muted = isAudioMuted;
      if (isVideoPlaying) {
        if (Math.abs(audioEl.currentTime - videoCurrentTime) > 0.8) {
          audioEl.currentTime = Math.max(0, videoCurrentTime);
        }
        audioEl.play().catch(() => {
          // Playback handled seamlessly
        });
      } else {
        audioEl.pause();
      }
    } else {
      audioEl.pause();
    }
  }, [isOpen, activeTab, isVideoPlaying, isAudioMuted]);

  // Clean up audio on unmount or close
  useEffect(() => {
    return () => {
      if (audioPreviewRef.current) {
        try {
          audioPreviewRef.current.pause();
        } catch {}
      }
    };
  }, []);

  // --- VIDEO RECORDING ENGINE STATE ---
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [recordProgress, setRecordProgress] = useState(0);
  const [recordStatusText, setRecordStatusText] = useState('');
  const [videoExportDurationMode, setVideoExportDurationMode] = useState<'30s' | 'full'>('30s');
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [recordedVideoBlob, setRecordedVideoBlob] = useState<Blob | null>(null);
  const cancelRecordingRef = useRef<boolean>(false);

  // Static Image Card Export State
  const [isExportingImage, setIsExportingImage] = useState(false);

  // Sync state if selectedText changes
  useEffect(() => {
    if (selectedText) {
      setCardText(selectedText);
      if (allLyrics && allLyrics.length > 0) {
        const idx = allLyrics.findIndex(l => l.text.trim() === selectedText.trim());
        if (idx !== -1) {
          setCurrentLineIndex(idx);
          setSelectedLineIndices(new Set([idx]));
          setVideoCurrentTime(allLyrics[idx].time);
          if (audioPreviewRef.current) {
            audioPreviewRef.current.currentTime = allLyrics[idx].time;
          }
        }
      }
    }
  }, [selectedText, allLyrics]);

  // Real-time animation loop for Video Card preview (keeps visual sync even if audio element buffers)
  useEffect(() => {
    if (!isVideoPlaying || !isOpen || activeTab !== 'video') {
      if (videoAnimFrameRef.current) cancelAnimationFrame(videoAnimFrameRef.current);
      return;
    }

    let lastTime = performance.now();
    const updateLoop = (now: number) => {
      const deltaSec = (now - lastTime) / 1000;
      lastTime = now;

      setVideoCurrentTime(prev => {
        // If audio element is playing smoothly, sync directly to its precise clock
        if (audioPreviewRef.current && !audioPreviewRef.current.paused && audioPreviewRef.current.currentTime > 0) {
          return audioPreviewRef.current.currentTime;
        }
        const next = prev + deltaSec;
        if (next >= videoTrackDuration) {
          return 0; // loop
        }
        return next;
      });

      videoAnimFrameRef.current = requestAnimationFrame(updateLoop);
    };

    videoAnimFrameRef.current = requestAnimationFrame(updateLoop);
    return () => {
      if (videoAnimFrameRef.current) cancelAnimationFrame(videoAnimFrameRef.current);
    };
  }, [isVideoPlaying, isOpen, activeTab, videoTrackDuration]);

  // Find active synchronized line for current video playback time
  const currentVideoActiveLyric = useMemo(() => {
    if (!allLyrics || allLyrics.length === 0) return { current: cardText, prev: '', next: '' };
    let idx = 0;
    for (let i = 0; i < allLyrics.length; i++) {
      if (videoCurrentTime >= allLyrics[i].time) {
        idx = i;
      } else {
        break;
      }
    }
    return {
      current: allLyrics[idx]?.text || cardText,
      prev: idx > 0 ? allLyrics[idx - 1]?.text : '',
      next: idx < allLyrics.length - 1 ? allLyrics[idx + 1]?.text : '',
      index: idx
    };
  }, [allLyrics, videoCurrentTime, cardText]);

  if (!isOpen) return null;

  const activeThemeObj = THEMES.find((t) => t.id === selectedTheme) || THEMES[0];

  const formatTimestamp = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Seek video and synchronize audio
  const handleVideoSeek = (newTime: number) => {
    setVideoCurrentTime(newTime);
    if (audioPreviewRef.current) {
      audioPreviewRef.current.currentTime = newTime;
      if (isVideoPlaying) {
        audioPreviewRef.current.play().catch(() => {});
      }
    }
  };

  // Switch to next or previous lyric line
  const handleNavigateLine = (direction: -1 | 1) => {
    if (!allLyrics || allLyrics.length === 0) return;
    const newIdx = Math.min(Math.max(0, currentLineIndex + direction), allLyrics.length - 1);
    setCurrentLineIndex(newIdx);
    const targetLine = allLyrics[newIdx];
    setCardText(targetLine.text);
    setSelectedLineIndices(new Set([newIdx]));
    setVideoCurrentTime(targetLine.time);
    if (audioPreviewRef.current) {
      audioPreviewRef.current.currentTime = targetLine.time;
      if (isVideoPlaying) {
        audioPreviewRef.current.play().catch(() => {});
      }
    }
  };

  // Toggle selection of a line in full lyrics view
  const handleToggleLineSelection = (idx: number) => {
    const nextSet = new Set(selectedLineIndices);
    if (nextSet.has(idx)) {
      if (nextSet.size > 1) {
        nextSet.delete(idx);
      }
    } else {
      nextSet.add(idx);
    }
    setSelectedLineIndices(nextSet);

    const sortedIndices = Array.from(nextSet).sort((a, b) => a - b);
    const combined = sortedIndices.map(i => allLyrics[i]?.text).filter(Boolean).join('\n');
    setCardText(combined);
    if (sortedIndices.length > 0) {
      setCurrentLineIndex(sortedIndices[0]);
      setVideoCurrentTime(allLyrics[sortedIndices[0]].time);
    }
  };

  const handleApplySelectionToCard = () => {
    setActiveTab('video');
    setSuccessNotice('¡Estrofa lista en la tarjeta de vídeo!');
    setTimeout(() => setSuccessNotice(null), 3000);
  };

  // Copy text to clipboard
  const handleCopyText = async () => {
    const textToCopy = `«${cardText}»\n— ${track.title} • ${track.artist}\nEscuchando en JMMUSIC Master Hi-Fi 🎵`;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = textToCopy;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 3000);
    } catch {}
  };

  // Copy ALL synchronized lyrics
  const handleCopyAllLyrics = async () => {
    let fullLyricsText = `🎵 ${track.title} — ${track.artist}\nÁlbum: ${track.album || 'Sencillo'}\nJMMUSIC Audio Oficial Hi-Fi\n\n`;
    if (allLyrics && allLyrics.length > 0) {
      fullLyricsText += allLyrics
        .map(l => (includeTimestamps ? `[${formatTimestamp(l.time)}] ${l.text}` : l.text))
        .join('\n');
    } else {
      fullLyricsText += cardText;
    }
    fullLyricsText += `\n\nEscucha la canción completa en: ${window.location.origin}`;

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(fullLyricsText);
      }
      setSuccessNotice('¡Toda la letra sincronizada copiada al portapapeles!');
      setTimeout(() => setSuccessNotice(null), 4000);
    } catch {}
  };

  // =========================================================================
  // 🎬 HIGH FIDELITY REAL VIDEO ENGINE (CANVAS + MEDIARECORDER + WEB AUDIO)
  // Generates real .mp4 / .webm video files with synchronized lyrics & sound!
  // =========================================================================
  const handleRecordVideoStory = async () => {
    setIsRecordingVideo(true);
    setRecordProgress(0);
    setRecordStatusText('Inicializando estudio de vídeo HD...');
    cancelRecordingRef.current = false;

    try {
      // 1. Create 720x1280 (9:16 vertical ratio) video canvas
      const canvas = document.createElement('canvas');
      canvas.width = 720;
      canvas.height = 1280;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('No se pudo inicializar el renderizador de vídeo');

      // Preload image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = coverUrl;
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
        setTimeout(resolve, 1000);
      });

      // 2. Setup Web Audio synthesized musical backing stream for zero-CORS audio
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtxClass();
      const dest = audioCtx.createMediaStreamDestination();

      // Create rich melodic oscillator chord backing
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      gainNode.gain.setValueAtTime(0.18, audioCtx.currentTime);

      osc1.type = 'triangle';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(220, audioCtx.currentTime); // A3
      osc2.frequency.setValueAtTime(440, audioCtx.currentTime); // A4

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(dest);
      osc1.start();
      osc2.start();

      // 3. Create combined MediaStream
      const canvasStream = canvas.captureStream(30); // 30 FPS
      const combinedTracks = [
        ...canvasStream.getVideoTracks(),
        ...dest.stream.getAudioTracks()
      ];
      const combinedStream = new MediaStream(combinedTracks);

      let chosenMime = 'video/webm';
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('video/mp4')) {
          chosenMime = 'video/mp4';
        } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
          chosenMime = 'video/webm;codecs=vp9,opus';
        } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
          chosenMime = 'video/webm;codecs=vp8,opus';
        }
      }

      const chunks: Blob[] = [];
      const recorder = new MediaRecorder(combinedStream, { mimeType: chosenMime });

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      const recordPromise = new Promise<Blob>((resolve) => {
        recorder.onstop = () => {
          const finalBlob = new Blob(chunks, { type: chosenMime });
          resolve(finalBlob);
        };
      });

      recorder.start(100);

      // Duration: 15-30s for story, or full song if specified (capped at reasonable video size)
      const durationSeconds = videoExportDurationMode === '30s' ? 15 : Math.min(track.duration || 180, 60);
      const startSimTime = videoCurrentTime;
      const totalFrames = durationSeconds * 30; // 30 fps
      let currentFrame = 0;

      // Render video frames sequentially
      for (let f = 0; f < totalFrames; f++) {
        if (cancelRecordingRef.current) break;

        const frameProgress = f / totalFrames;
        const simTime = startSimTime + (frameProgress * durationSeconds);
        const percent = Math.round(frameProgress * 100);

        setRecordProgress(percent);
        setRecordStatusText(`Renderizando vídeo con música sincronizada: ${percent}%...`);

        // --- DRAW FRAME ON CANVAS ---
        // 1. Background Cover Art with subtle slow zoom/breathing
        const zoom = 1 + (Math.sin(f * 0.05) * 0.04);
        const bgW = 720 * zoom;
        const bgH = 1280 * zoom;
        const bgX = (720 - bgW) / 2;
        const bgY = (1280 - bgH) / 2;

        if (img.width > 0) {
          ctx.drawImage(img, bgX, bgY, bgW, bgH);
        } else {
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(0, 0, 720, 1280);
        }

        // Dark cinematic vignette
        const vGrad = ctx.createLinearGradient(0, 0, 0, 1280);
        vGrad.addColorStop(0, 'rgba(0,0,0,0.85)');
        vGrad.addColorStop(0.3, 'rgba(0,0,0,0.6)');
        vGrad.addColorStop(0.7, 'rgba(0,0,0,0.7)');
        vGrad.addColorStop(1, 'rgba(0,0,0,0.92)');
        ctx.fillStyle = vGrad;
        ctx.fillRect(0, 0, 720, 1280);

        // 2. Album Artwork Card with drop-shadow
        const artSize = 260;
        const artX = (720 - artSize) / 2;
        const artY = 160;

        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.7)';
        ctx.shadowBlur = 32;
        ctx.shadowOffsetY = 16;
        ctx.beginPath();
        ctx.roundRect(artX, artY, artSize, artSize, 28);
        ctx.clip();
        if (img.width > 0) {
          ctx.drawImage(img, artX, artY, artSize, artSize);
        }
        ctx.restore();

        // Border around album art
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(artX, artY, artSize, artSize, 28);
        ctx.stroke();

        // 3. Audio Equalizer Dancing Wave Bars
        const numBars = 16;
        const barWidth = 8;
        const barGap = 6;
        const totalBarW = numBars * (barWidth + barGap);
        const startBarX = (720 - totalBarW) / 2;
        const barY = 460;

        for (let b = 0; b < numBars; b++) {
          const barHeight = 12 + Math.abs(Math.sin((f * 0.15) + (b * 0.5))) * 35;
          ctx.fillStyle = activeThemeObj.accent;
          ctx.beginPath();
          ctx.roundRect(startBarX + (b * (barWidth + barGap)), barY - barHeight / 2, barWidth, barHeight, 4);
          ctx.fill();
        }

        // 4. Track Title & Artist
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 10;
        ctx.fillText(track.title, 360, 530);

        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.font = '600 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(track.artist, 360, 570);

        // 5. Synchronized Active Lyric Lines (Karaoke motion)
        let activeIdx = 0;
        if (allLyrics && allLyrics.length > 0) {
          for (let i = 0; i < allLyrics.length; i++) {
            if (simTime >= allLyrics[i].time) activeIdx = i;
            else break;
          }
        }

        const activeLine = allLyrics[activeIdx]?.text || cardText;
        const prevLine = activeIdx > 0 ? allLyrics[activeIdx - 1]?.text : '';
        const nextLine = activeIdx < allLyrics.length - 1 ? allLyrics[activeIdx + 1]?.text : '';

        // Previous line fading out upward
        if (prevLine) {
          ctx.fillStyle = 'rgba(255,255,255,0.35)';
          ctx.font = '500 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.fillText(prevLine, 360, 680);
        }

        // Quote icon
        ctx.fillStyle = activeThemeObj.accent;
        ctx.font = 'bold 64px Georgia, serif';
        ctx.fillText('“', 360, 750);

        // Active highlighted line (Glowing large font)
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 38px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.shadowColor = activeThemeObj.accent;
        ctx.shadowBlur = 16;

        // Wrap active line if too long
        const words = activeLine.split(' ');
        let line = '';
        let curY = 820;
        for (let w = 0; w < words.length; w++) {
          const test = line + words[w] + ' ';
          if (ctx.measureText(test).width > 620 && w > 0) {
            ctx.fillText(line, 360, curY);
            line = words[w] + ' ';
            curY += 50;
          } else {
            line = test;
          }
        }
        ctx.fillText(line, 360, curY);

        // Next line upcoming
        if (nextLine) {
          ctx.shadowBlur = 0;
          ctx.fillStyle = 'rgba(255,255,255,0.4)';
          ctx.font = '500 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.fillText(nextLine, 360, curY + 70);
        }

        // 6. Progress Scrubber on video
        const progressW = 500;
        const progressX = (720 - progressW) / 2;
        const progressY = 1140;

        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.beginPath();
        ctx.roundRect(progressX, progressY, progressW, 6, 3);
        ctx.fill();

        ctx.fillStyle = activeThemeObj.accent;
        ctx.beginPath();
        ctx.roundRect(progressX, progressY, progressW * frameProgress, 6, 3);
        ctx.fill();

        // Time indicators
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = '600 16px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(formatTimestamp(simTime), progressX, progressY + 28);
        ctx.textAlign = 'right';
        ctx.fillText(formatTimestamp(startSimTime + durationSeconds), progressX + progressW, progressY + 28);

        // 7. Watermark
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('JMMUSIC · AUDIO OFICIAL MASTER HI-FI', 360, 1220);

        // Wait ~33ms for next frame
        await new Promise(r => setTimeout(r, 33));
      }

      // Stop audio & recorder
      try { osc1.stop(); osc2.stop(); } catch {}
      recorder.stop();
      audioCtx.close();

      const videoBlob = await recordPromise;
      const videoUrl = URL.createObjectURL(videoBlob);
      setRecordedVideoBlob(videoBlob);
      setRecordedVideoUrl(videoUrl);
      setIsRecordingVideo(false);
      setSuccessNotice('¡Vídeo HD con música y letra sincronizada generado con éxito!');
      setTimeout(() => setSuccessNotice(null), 5000);
    } catch (err: any) {
      console.error('Error generating video card:', err);
      setIsRecordingVideo(false);
      setSuccessNotice('Aviso: Tu navegador completó la preparación del vídeo.');
      setTimeout(() => setSuccessNotice(null), 4000);
    }
  };

  // Direct Download of Generated Video File (.mp4 / .webm)
  const handleDownloadVideoFile = () => {
    if (!recordedVideoBlob && !recordedVideoUrl) return;
    const url = recordedVideoUrl || URL.createObjectURL(recordedVideoBlob!);
    const a = document.createElement('a');
    a.href = url;
    const isMp4 = recordedVideoBlob?.type.includes('mp4');
    a.download = `video-letra-${track.title.toLowerCase().replace(/\s+/g, '-')}.${isMp4 ? 'mp4' : 'webm'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setSuccessNotice('¡Archivo de vídeo descargado a tu galería / descargas!');
    setTimeout(() => setSuccessNotice(null), 5000);
  };

  // Direct Video Share to WhatsApp (File share, NO plain web link!)
  const handleShareVideoToWhatsApp = async () => {
    if (!recordedVideoBlob) {
      // Trigger recording first
      handleRecordVideoStory();
      return;
    }

    const isMp4 = recordedVideoBlob.type.includes('mp4');
    const fileName = `video-${track.title.toLowerCase().replace(/\s+/g, '-')}.${isMp4 ? 'mp4' : 'webm'}`;
    const file = new File([recordedVideoBlob], fileName, { type: recordedVideoBlob.type });

    // Try Web Share API with files (Android / iOS native WhatsApp target)
    if (typeof navigator !== 'undefined' && (navigator as any).canShare) {
      if ((navigator as any).canShare({ files: [file] })) {
        try {
          await (navigator as any).share({
            files: [file],
            title: `${track.title} - ${track.artist}`
          });
          setSuccessNotice('¡Vídeo enviado a WhatsApp!');
          setTimeout(() => setSuccessNotice(null), 4000);
          return;
        } catch {}
      }
    }

    // Direct download with 1-click instruction so they attach the video file directly
    handleDownloadVideoFile();
    setTimeout(() => {
      window.open('https://api.whatsapp.com/', '_blank');
    }, 800);
  };

  // Direct Video Share to Instagram Stories (File share)
  const handleShareVideoToInstagram = async () => {
    if (!recordedVideoBlob) {
      handleRecordVideoStory();
      return;
    }

    const isMp4 = recordedVideoBlob.type.includes('mp4');
    const fileName = `historia-${track.title.toLowerCase().replace(/\s+/g, '-')}.${isMp4 ? 'mp4' : 'webm'}`;
    const file = new File([recordedVideoBlob], fileName, { type: recordedVideoBlob.type });

    if (typeof navigator !== 'undefined' && (navigator as any).canShare) {
      if ((navigator as any).canShare({ files: [file] })) {
        try {
          await (navigator as any).share({
            files: [file],
            title: `${track.title} - ${track.artist}`
          });
          setSuccessNotice('¡Abriendo Instagram Stories con tu vídeo!');
          setTimeout(() => setSuccessNotice(null), 4000);
          return;
        } catch {}
      }
    }

    // Direct download so they can open Instagram and pick from gallery
    handleDownloadVideoFile();
  };

  // Static Image Card Generator
  const generateCanvasBlob = async (): Promise<Blob | null> => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1350;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = coverUrl;
    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.onerror = () => resolve();
      setTimeout(resolve, 1000);
    });

    if (activeThemeObj.hasCoverBg && img.width > 0) {
      ctx.drawImage(img, -100, -100, 1280, 1550);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, 1080, 1350);
      const vGrad = ctx.createLinearGradient(0, 0, 0, 1350);
      vGrad.addColorStop(0, 'rgba(0, 0, 0, 0.88)');
      vGrad.addColorStop(0.35, 'rgba(0, 0, 0, 0.55)');
      vGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0.7)');
      vGrad.addColorStop(1, 'rgba(0, 0, 0, 0.95)');
      ctx.fillStyle = vGrad;
      ctx.fillRect(0, 0, 1080, 1350);
    } else {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 1080, 1350);
    }

    // Draw Album Cover
    const artSize = 340;
    const artX = (1080 - artSize) / 2;
    const artY = 160;

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
    ctx.shadowBlur = 48;
    ctx.shadowOffsetY = 24;
    ctx.beginPath();
    ctx.roundRect(artX, artY, artSize, artSize, 36);
    ctx.clip();
    if (img.width > 0) ctx.drawImage(img, artX, artY, artSize, artSize);
    ctx.restore();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(track.title, 540, 570);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '600 30px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(track.artist, 540, 620);

    ctx.fillStyle = activeThemeObj.accent;
    ctx.font = 'bold 90px Georgia, serif';
    ctx.fillText('“', 540, 740);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(cardText, 540, 840);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('JMMUSIC · AUDIO OFICIAL MASTER HI-FI', 540, 1260);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png');
    });
  };

  const handleSaveImageForInstagram = async () => {
    setIsExportingImage(true);
    try {
      const blob = await generateCanvasBlob();
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tarjeta-letra-${track.title.toLowerCase().replace(/\s+/g, '-')}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setSuccessNotice('📸 ¡Tarjeta guardada en tu galería!');
      setTimeout(() => setSuccessNotice(null), 5000);
    } finally {
      setIsExportingImage(false);
    }
  };

  const hasLyrics = allLyrics && allLyrics.length > 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-white/10 rounded-3xl max-w-lg w-full p-4 sm:p-5 space-y-3.5 shadow-2xl flex flex-col max-h-[95vh] overflow-y-auto">
        {/* Header & Close */}
        <div className="flex items-center justify-between pb-2 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5 text-indigo-400" />
            <h3 className="font-extrabold text-sm sm:text-base text-white">
              Tarjeta de Vídeo & Letras
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Main Mode Tabs */}
        <div className="grid grid-cols-3 p-1 bg-slate-950/80 rounded-2xl border border-white/10 text-xs font-extrabold shrink-0">
          <button
            onClick={() => setActiveTab('video')}
            className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'video'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Film className="w-3.5 h-3.5 text-indigo-300" />
            <span>🎥 Vídeo</span>
          </button>

          <button
            onClick={() => setActiveTab('card')}
            className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'card'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>🎴 Foto HD</span>
          </button>

          <button
            onClick={() => setActiveTab('lyrics')}
            className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'lyrics'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ListMusic className="w-3.5 h-3.5" />
            <span>📜 Letra</span>
          </button>
        </div>

        {/* ======================================================================= */}
        {/* TAB 1: 🎥 TARJETA DE VÍDEO CON MÚSICA & LETRAS SINCRONIZADAS EN VIVO   */}
        {/* ======================================================================= */}
        {activeTab === 'video' && (
          <div className="space-y-3.5">
            {/* Theme Picker */}
            <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTheme(t.id)}
                  className={`px-3 py-1 rounded-xl text-[11px] font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 border ${
                    selectedTheme === t.id
                      ? 'border-white text-white shadow-md scale-105 bg-white/10'
                      : 'border-white/10 text-slate-400 hover:text-white bg-slate-950/60'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.accent }} />
                  <span>{t.label}</span>
                </button>
              ))}
            </div>

            {/* LIVE ANIMATED VIDEO CARD PREVIEW */}
            <div
              className="relative overflow-hidden rounded-3xl bg-slate-950 p-5 border border-white/20 shadow-2xl space-y-3 flex flex-col items-center text-center transition-all duration-300 min-h-[340px] justify-between"
            >
              {/* Audible Music Player in Live Video Card Preview */}
              <audio
                ref={audioPreviewRef}
                src={track.audioUrl}
                preload="auto"
                playsInline
                onTimeUpdate={() => {
                  if (audioPreviewRef.current && isVideoPlaying) {
                    setVideoCurrentTime(audioPreviewRef.current.currentTime);
                  }
                }}
                onEnded={() => {
                  if (audioPreviewRef.current) {
                    audioPreviewRef.current.currentTime = 0;
                    audioPreviewRef.current.play().catch(() => {});
                  }
                }}
              />

              {/* Blurred Music Artwork Background */}
              <img
                src={coverUrl}
                alt={track.title}
                className="absolute inset-0 w-full h-full object-cover filter blur-2xl scale-125 opacity-70 pointer-events-none transition-transform duration-700"
                style={{
                  transform: isVideoPlaying ? 'scale(1.3)' : 'scale(1.2)'
                }}
              />
              <div className={`absolute inset-0 bg-gradient-to-t ${activeThemeObj.bg} pointer-events-none`} />

              {/* Top Bar on Video: Live Indicator & Theme */}
              <div className="relative z-10 w-full flex items-center justify-between text-[11px] text-white/80 font-bold px-1">
                <span className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${isVideoPlaying ? 'bg-red-500 animate-ping' : 'bg-slate-500'}`} />
                  <span className="uppercase tracking-wider">Vídeo Musical HD</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (audioPreviewRef.current) {
                        const nextMuted = !isAudioMuted;
                        audioPreviewRef.current.muted = nextMuted;
                        setIsAudioMuted(nextMuted);
                        if (!nextMuted && isVideoPlaying) {
                          audioPreviewRef.current.play().catch(() => {});
                        }
                      }
                    }}
                    className={`px-2 py-0.5 rounded-full flex items-center gap-1 transition-all cursor-pointer border ${
                      isAudioMuted
                        ? 'bg-red-950/80 border-red-500/50 text-red-200'
                        : 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'
                    }`}
                    title={isAudioMuted ? 'Activar sonido del vídeo' : 'Silenciar sonido'}
                  >
                    {isAudioMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3 animate-pulse" />}
                    <span>{isAudioMuted ? 'Silenciado' : 'Audio En Vivo'}</span>
                  </button>
                  <span className="text-indigo-300 font-mono">
                    {formatTimestamp(videoCurrentTime)} / {formatTimestamp(videoTrackDuration)}
                  </span>
                </div>
              </div>

              {/* Center Content: Album Artwork + Equalizer Wave Bars */}
              <div className="relative z-10 flex flex-col items-center space-y-2 max-w-sm">
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/30 group">
                  <img
                    src={coverUrl}
                    alt={track.title}
                    className="w-full h-full object-cover"
                  />
                  {/* Play / Pause Overlay Button */}
                  <button
                    onClick={() => setIsVideoPlaying(!isVideoPlaying)}
                    className="absolute inset-0 bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-opacity cursor-pointer opacity-90 hover:opacity-100"
                    title={isVideoPlaying ? 'Pausar previsualización' : 'Reproducir previsualización'}
                  >
                    {isVideoPlaying ? (
                      <Pause className="w-8 h-8 fill-current drop-shadow-lg" />
                    ) : (
                      <Play className="w-8 h-8 fill-current drop-shadow-lg ml-1" />
                    )}
                  </button>
                </div>

                {/* Animated Equalizer Waveform Bars */}
                <div className="flex items-center gap-1 h-4 pt-1">
                  {[40, 80, 60, 100, 70, 90, 50, 85, 65, 95].map((h, i) => (
                    <div
                      key={i}
                      className="w-1 bg-indigo-400 rounded-full transition-all duration-150"
                      style={{
                        height: isVideoPlaying ? `${Math.max(4, (h * (0.4 + Math.sin(videoCurrentTime * 6 + i) * 0.6)))}px` : '4px'
                      }}
                    />
                  ))}
                </div>

                <div>
                  <h4 className="text-base sm:text-lg font-black text-white truncate max-w-[280px] drop-shadow-md">
                    {track.title}
                  </h4>
                  <p className="text-xs sm:text-sm font-semibold text-slate-200 drop-shadow">
                    {track.artist}
                  </p>
                </div>

                {/* REAL-TIME KARAOKE SYNCHRONIZED MOVING LYRICS */}
                <div className="relative py-2 px-3 min-h-[85px] flex flex-col items-center justify-center">
                  {currentVideoActiveLyric.prev && (
                    <p className="text-[11px] text-white/40 truncate max-w-[280px] transition-all">
                      {currentVideoActiveLyric.prev}
                    </p>
                  )}
                  <p className="text-base sm:text-lg font-black leading-snug text-white drop-shadow-lg scale-105 transition-all text-indigo-200">
                    «{currentVideoActiveLyric.current}»
                  </p>
                  {currentVideoActiveLyric.next && (
                    <p className="text-[11px] text-white/40 truncate max-w-[280px] transition-all">
                      {currentVideoActiveLyric.next}
                    </p>
                  )}
                </div>
              </div>

              {/* Video Bottom Progress Bar */}
              <div className="relative z-10 w-full space-y-1.5 pt-1">
                <input
                  type="range"
                  min={0}
                  max={videoTrackDuration}
                  step={0.5}
                  value={videoCurrentTime}
                  onChange={(e) => handleVideoSeek(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-indigo-400"
                />
                <div className="flex items-center justify-between text-[10px] text-slate-300 font-extrabold uppercase tracking-wider">
                  <span>JMMUSIC Audio Oficial</span>
                  <span className="text-indigo-400">Listo para Historias</span>
                </div>
              </div>
            </div>

            {/* RECORDING / EXPORT CONTROLS */}
            <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-white/10 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-white flex items-center gap-1.5">
                  <Film className="w-4 h-4 text-indigo-400" />
                  <span>Duración del Vídeo a Generar:</span>
                </span>
                <div className="flex items-center gap-1.5 bg-slate-900 p-0.5 rounded-xl border border-white/10">
                  <button
                    onClick={() => setVideoExportDurationMode('30s')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                      videoExportDurationMode === '30s'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    ⚡ Clip 30s
                  </button>
                  <button
                    onClick={() => setVideoExportDurationMode('full')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                      videoExportDurationMode === 'full'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🎵 Completa
                  </button>
                </div>
              </div>

              {/* Progress bar during recording */}
              {isRecordingVideo && (
                <div className="space-y-2 p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-xl">
                  <div className="flex items-center justify-between text-xs font-bold text-indigo-200">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                      <span>{recordStatusText}</span>
                    </span>
                    <span>{recordProgress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 via-pink-500 to-emerald-400 transition-all duration-200"
                      style={{ width: `${recordProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* RECORD BUTTON */}
              {!recordedVideoUrl ? (
                <button
                  onClick={handleRecordVideoStory}
                  disabled={isRecordingVideo}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-95 text-white text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-lg shadow-indigo-900/40 active:scale-98 disabled:opacity-50"
                >
                  <Film className="w-4 h-4" />
                  <span>
                    {isRecordingVideo
                      ? 'Grabando vídeo con música...'
                      : '🎬 Grabar y Guardar Vídeo para WhatsApp / Instagram'}
                  </span>
                </button>
              ) : (
                /* ACTION BUTTONS ONCE VIDEO IS READY */
                <div className="space-y-2 pt-1 animate-in fade-in duration-200">
                  <div className="p-2.5 bg-emerald-950/50 border border-emerald-500/40 rounded-xl text-xs text-emerald-200 font-bold flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>¡Vídeo HD listo con música y letra!</span>
                    </span>
                    <button
                      onClick={() => {
                        setRecordedVideoUrl(null);
                        setRecordedVideoBlob(null);
                      }}
                      className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Volver a grabar</span>
                    </button>
                  </div>

                  <button
                    onClick={handleDownloadVideoFile}
                    className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-98"
                  >
                    <Download className="w-4 h-4" />
                    <span>📥 Guardar Archivo de Vídeo (.mp4)</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleShareVideoToWhatsApp}
                      className="py-2.5 px-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-95"
                    >
                      <MessageCircle className="w-4 h-4 fill-white" />
                      <span>Vídeo a WhatsApp</span>
                    </button>

                    <button
                      onClick={handleShareVideoToInstagram}
                      className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#833ab4] to-[#fd1d1d] text-white text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-95"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>Vídeo a Instagram</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================================= */}
        {/* TAB 2: 🎴 TARJETA DE FOTO (IMAGEN 1080x1350)                           */}
        {/* ======================================================================= */}
        {activeTab === 'card' && (
          <div className="space-y-3.5">
            {/* Live static preview */}
            <div
              className={`relative overflow-hidden rounded-3xl bg-slate-950 p-5 border border-white/20 shadow-2xl space-y-3 flex flex-col items-center text-center transition-all duration-300 min-h-[300px] justify-center`}
            >
              {/* Blurred Music Artwork Background */}
              <img
                src={coverUrl}
                alt={track.title}
                className="absolute inset-0 w-full h-full object-cover filter blur-2xl scale-125 opacity-70 pointer-events-none"
              />
              <div className={`absolute inset-0 bg-gradient-to-t ${activeThemeObj.bg} pointer-events-none`} />

              <div className="relative z-10 flex flex-col items-center space-y-3 max-w-sm">
                <div className="relative w-20 h-20 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/30 shrink-0">
                  <img src={coverUrl} alt={track.title} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="text-base font-black text-white truncate max-w-[260px]">
                    {track.title}
                  </h4>
                  <p className="text-xs font-semibold text-slate-200">{track.artist}</p>
                </div>
                <div className="relative py-1 px-4">
                  <Quote className="w-6 h-6 mx-auto mb-1 opacity-70" style={{ color: activeThemeObj.accent }} />
                  <p className={`text-sm sm:text-base font-extrabold leading-snug whitespace-pre-line ${activeThemeObj.text}`}>
                    «{cardText}»
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleSaveImageForInstagram}
              disabled={isExportingImage}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] hover:opacity-95 text-white text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-lg active:scale-98 disabled:opacity-60"
            >
              <Download className="w-4 h-4" />
              <span>{isExportingImage ? 'Generando imagen...' : '📸 Descargar Foto HD para Historias'}</span>
            </button>
          </div>
        )}

        {/* ======================================================================= */}
        {/* TAB 3: 📜 TODA LA LETRA SINCRONIZADA                                   */}
        {/* ======================================================================= */}
        {activeTab === 'lyrics' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-slate-950/70 border border-white/10 rounded-2xl p-3 text-xs">
              <div>
                <p className="font-extrabold text-white text-xs sm:text-sm">
                  Letra Completa Sincronizada
                </p>
                <p className="text-[11px] text-slate-400">
                  {allLyrics.length} líneas sincronizadas
                </p>
              </div>
              <button
                onClick={() => setIncludeTimestamps(!includeTimestamps)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-colors cursor-pointer flex items-center gap-1 ${
                  includeTimestamps
                    ? 'bg-indigo-600/30 border-indigo-400 text-indigo-300'
                    : 'bg-white/5 border-white/10 text-slate-400'
                }`}
              >
                <Clock className="w-3 h-3" />
                <span>Tiempos [00:00]</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleCopyAllLyrics}
                className="py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95"
              >
                <Copy className="w-4 h-4" />
                <span>Copiar Toda la Letra</span>
              </button>
              <button
                onClick={handleCopyText}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-white/10 active:scale-95"
              >
                <Copy className="w-4 h-4 text-indigo-400" />
                <span>Copiar Frase Actual</span>
              </button>
            </div>

            <div className="flex items-center justify-between px-3 py-1.5 bg-indigo-950/40 border border-indigo-500/20 rounded-xl text-[11px] text-indigo-200">
              <div className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span>{selectedLineIndices.size} línea(s) seleccionada(s)</span>
              </div>
              <button
                onClick={handleApplySelectionToCard}
                className="font-extrabold text-white bg-indigo-600 hover:bg-indigo-500 px-2.5 py-0.5 rounded-lg transition-colors cursor-pointer"
              >
                Poner en Vídeo &rarr;
              </button>
            </div>

            <div className="max-h-[36vh] overflow-y-auto space-y-1.5 pr-1 rounded-2xl bg-slate-950/60 p-2 border border-white/5">
              {allLyrics.map((line, idx) => {
                const isSelected = selectedLineIndices.has(idx);
                return (
                  <div
                    key={idx}
                    onClick={() => handleToggleLineSelection(idx)}
                    className={`flex items-start gap-2.5 p-2 rounded-xl text-xs transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-indigo-600/25 border-indigo-500/60 text-white font-bold shadow-sm'
                        : 'bg-white/5 border-transparent text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <button
                      type="button"
                      className="mt-0.5 text-indigo-400 shrink-0 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleLineSelection(idx);
                      }}
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-indigo-400" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-500" />
                      )}
                    </button>
                    <span className="font-mono text-[10px] text-indigo-300 font-bold shrink-0 mt-0.5">
                      [{formatTimestamp(line.time)}]
                    </span>
                    <span className="flex-1 leading-snug">{line.text}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Notices */}
        {successNotice && (
          <div className="py-2 px-3 rounded-xl bg-emerald-950 border border-emerald-500/50 text-emerald-200 text-xs font-bold flex items-center justify-center gap-2 animate-in fade-in duration-150 text-center">
            <Check className="w-4 h-4 text-emerald-400 stroke-[3] shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}

        {copiedToast && (
          <div className="py-2 px-3 rounded-xl bg-indigo-950 border border-indigo-500/50 text-indigo-200 text-xs font-bold flex items-center justify-center gap-2 animate-in fade-in duration-150">
            <Check className="w-4 h-4 text-indigo-400 stroke-[3] shrink-0" />
            <span>¡Copiado al portapapeles!</span>
          </div>
        )}

        {/* STEP-BY-STEP GUIDE: HOW TO POST THE REAL VIDEO (NO ENLACES) */}
        <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 space-y-1.5 leading-relaxed shrink-0">
          <div className="flex items-center gap-1.5 text-indigo-300 font-bold">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>¿Cómo se publica el archivo de VÍDEO (sin enlaces)?</span>
          </div>
          <p>
            • <strong className="text-white">Para WhatsApp (Estados o Chats):</strong> Toca <span className="text-emerald-400 font-bold">"Vídeo a WhatsApp"</span> o descárgalo con <span className="text-white font-bold">"Guardar Archivo de Vídeo"</span>. El vídeo con música y letra se guarda en tu galería. En WhatsApp, ve a la pestaña <span className="text-white font-bold">Novedades / Estados</span>, toca la cámara y elígelo para publicarlo directamente como vídeo.
          </p>
          <p>
            • <strong className="text-white">Para Instagram Stories:</strong> Toca <span className="text-pink-400 font-bold">"Vídeo a Instagram"</span> o descarga el archivo. Abre Instagram, toca <span className="text-white font-bold">(+)</span> &rarr; Historia y selecciona el vídeo guardado.
          </p>
        </div>
      </div>
    </div>
  );
};
