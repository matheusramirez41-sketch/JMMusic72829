/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { TRACKS, PLAYLISTS } from './data/mockTracks';
import { Track, Playlist, EQPreset } from './types/music';
import { audioEngine } from './components/AudioEngine';
import { BottomNavBar, AppView } from './components/BottomNavBar';
import { Sidebar } from './components/Sidebar';
import { BrowseView } from './components/BrowseView';
import { LibraryView } from './components/LibraryView';
import { NowPlayingView } from './components/NowPlayingView';
import { OfflineView } from './components/OfflineView';
import { PlayerBar } from './components/PlayerBar';
import { BottomLyricsDrawer } from './components/BottomLyricsDrawer';
import { OfflineIndicator } from './components/OfflineIndicator';
import { getOfflineTrackIds, saveTrackOffline } from './services/offlineMusicService';
import { EqualizerModal } from './components/EqualizerModal';
import { QueueDrawer } from './components/QueueDrawer';
import { YouTubePlayerController } from './components/YouTubePlayerController';
import { SleepTimerModal } from './components/SleepTimerModal';
import { ImportLibraryModal } from './components/ImportLibraryModal';
import { DrivingModeModal } from './components/DrivingModeModal';
import { AmbientSoundscapesModal } from './components/AmbientSoundscapesModal';
import { PomodoroModal } from './components/PomodoroModal';
import { AndroidMediaNotification } from './components/AndroidMediaNotification';
import { UserProfileModal, UserProfileData, DEFAULT_USER_PROFILE } from './components/UserProfileModal';
import { SaveTrackModal } from './components/SaveTrackModal';
import { AndroidAPKModal } from './components/AndroidAPKModal';
import { ShareAppModal } from './components/ShareAppModal';
import { SpatialAudio8DModal } from './components/SpatialAudio8DModal';
import { KaraokeStudioModal } from './components/KaraokeStudioModal';
import { StoryCardModal } from './components/StoryCardModal';
import { DjCrossfadeModal } from './components/DjCrossfadeModal';
import { SuperBassBoosterModal } from './components/SuperBassBoosterModal';
import { RingtoneStudioModal } from './components/RingtoneStudioModal';
import { JamPartyModal } from './components/JamPartyModal';
import { DjStudioModal } from './components/DjStudioModal';
import { findKnownYouTubeVideoId, searchYouTubeTrackOnline } from './services/youtubeService';
import { getImmediateOfficialCover, resolveOfficialCoverUrl } from './services/artworkService';
import { fetchSmartNextRecommendations, RecommendedTrackInfo } from './services/smartRecommendationEngine';
import {
  Upload,
  Radio,
  Sliders,
  Sparkles,
  Info,
  X,
  Volume2,
  AlertCircle,
  Clock,
  Moon,
  Car,
  Check,
  Headphones,
  Bell,
  Library,
  HardDrive,
  Link2,
  Smartphone,
  CloudRain,
  Share2,
  Compass,
  Mic,
  Camera,
  Disc,
  Flame,
  Zap
} from 'lucide-react';

export default function App() {
  // Navigation & View state
  const [activeView, setActiveView] = useState<AppView>('browse');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);

  // Music Player State with custom added tracks persistence
  const [tracks, setTracks] = useState<Track[]>(() => {
    try {
      const savedCustom = localStorage.getItem('jmmusic_custom_tracks');
      if (savedCustom) {
        const parsed = JSON.parse(savedCustom);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const combined = [...parsed];
          for (const t of TRACKS) {
            if (!combined.some(c => c.id === t.id)) {
              combined.push(t);
            }
          }
          return combined;
        }
      }
    } catch {}
    return TRACKS;
  });
  const [currentTrack, setCurrentTrack] = useState<Track>(TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(TRACKS[0].duration);
  const [volume, setVolume] = useState<number>(0.9);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [isRepeat, setIsRepeat] = useState<boolean>(false);
  const [favorites, setFavorites] = useState<string[]>(['yt-QxPeRC82Uo0', 'yt-QpKkNIT84GY']);
  const [queue, setQueue] = useState<Track[]>([]);
  const [smartUpcomingTracks, setSmartUpcomingTracks] = useState<RecommendedTrackInfo[]>([]);
  const [eqPreset, setEqPreset] = useState<EQPreset>('flat');

  // Playback History Navigation Stack (guarantees going back to the exact previous song)
  const [historyStack, setHistoryStack] = useState<Track[]>([]);
  const isNavigatingHistoryRef = useRef<boolean>(false);
  const currentTrackRef = useRef<Track>(currentTrack);
  useEffect(() => {
    currentTrackRef.current = currentTrack;
  }, [currentTrack]);

  const [offlineSavedIds, setOfflineSavedIds] = useState<string[]>(() => getOfflineTrackIds());

  // Lo-Fi Synth mode state
  const [isSynthMode, setIsSynthMode] = useState<boolean>(false);

  // 25 Features Studio State
  const [isNightcore, setIsNightcore] = useState<boolean>(false);
  const [isSlowedReverb, setIsSlowedReverb] = useState<boolean>(false);
  const [is8DAudio, setIs8DAudio] = useState<boolean>(false);
  const [isKaraoke, setIsKaraoke] = useState<boolean>(false);
  const [isAmoledSaver, setIsAmoledSaver] = useState<boolean>(false);
  const [crossfadeSecs, setCrossfadeSecs] = useState<number>(0);
  const [loopPointA, setLoopPointA] = useState<number | null>(null);
  const [loopPointB, setLoopPointB] = useState<number | null>(null);
  const [visualizerStyle, setVisualizerStyle] = useState<'bars' | 'wave' | 'circle'>('bars');
  const [isVideoView, setIsVideoView] = useState<boolean>(true);
  const [lyricsOffsetMs, setLyricsOffsetMs] = useState<number>(80);

  // Cloud audio streaming state with immediate ready video ID
  const [youtubeVideoId, setYoutubeVideoId] = useState<string | null>(() => {
    if (TRACKS[0]?.id?.startsWith('yt-')) {
      return TRACKS[0].id.replace('yt-', '').trim();
    }
    return 'QxPeRC82Uo0';
  });
  const [youtubeSeekTime, setYoutubeSeekTime] = useState<number | null>(null);
  const [isFullSongSearching, setIsFullSongSearching] = useState<boolean>(false);
  const [isSleepTimerOpen, setIsSleepTimerOpen] = useState<boolean>(false);
  const [isDrivingModeOpen, setIsDrivingModeOpen] = useState<boolean>(false);
  const [isAmbienceOpen, setIsAmbienceOpen] = useState<boolean>(false);
  const [isPomodoroOpen, setIsPomodoroOpen] = useState<boolean>(false);
  const [activeSleepTimerMinutes, setActiveSleepTimerMinutes] = useState<number | null>(null);

  // Modals & Drawers
  const [isPlayerExpanded, setIsPlayerExpanded] = useState<boolean>(false);
  const [isBottomLyricsOpen, setIsBottomLyricsOpen] = useState<boolean>(false);
  const [isEqualizerOpen, setIsEqualizerOpen] = useState<boolean>(false);
  const [isQueueOpen, setIsQueueOpen] = useState<boolean>(false);
  const [isAndroidNotificationOpen, setIsAndroidNotificationOpen] = useState<boolean>(false);
  const [isAndroidNotificationDocked, setIsAndroidNotificationDocked] = useState<boolean>(false);
  const [isNewPlaylistModalOpen, setIsNewPlaylistModalOpen] = useState<boolean>(false);
  const [newPlaylistTitle, setNewPlaylistTitle] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [isUserProfileOpen, setIsUserProfileOpen] = useState<boolean>(false);
  const [isAndroidAPKModalOpen, setIsAndroidAPKModalOpen] = useState<boolean>(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState<boolean>(false);
  const [trackToSave, setTrackToSave] = useState<Track | null>(null);

  // 5 Ideas & Public Share State
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [is8DModalOpen, setIs8DModalOpen] = useState<boolean>(false);
  const [isKaraokeModalOpen, setIsKaraokeModalOpen] = useState<boolean>(false);
  const [isStoryCardModalOpen, setIsStoryCardModalOpen] = useState<boolean>(false);
  const [isDjCrossfadeModalOpen, setIsDjCrossfadeModalOpen] = useState<boolean>(false);
  const [isSuperBassModalOpen, setIsSuperBassModalOpen] = useState<boolean>(false);
  const [isRingtoneModalOpen, setIsRingtoneModalOpen] = useState<boolean>(false);
  const [isJamPartyModalOpen, setIsJamPartyModalOpen] = useState<boolean>(false);
  const [isDjStudioModalOpen, setIsDjStudioModalOpen] = useState<boolean>(false);

  const handleOpenSaveModal = (track: Track) => {
    setTrackToSave(track);
    setIsSaveModalOpen(true);
  };
  const [userProfile, setUserProfile] = useState<UserProfileData>(() => {
    try {
      const saved = localStorage.getItem('jmmusic_user_profile');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_USER_PROFILE;
  });

  const handleSaveProfile = (newProfile: UserProfileData) => {
    setUserProfile(newProfile);
    try {
      localStorage.setItem('jmmusic_user_profile', JSON.stringify(newProfile));
    } catch {}
  };
  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    try {
      const saved = localStorage.getItem('jmmusic_playlists');
      if (saved) return JSON.parse(saved);
    } catch {}
    return PLAYLISTS;
  });

  const handleAddToPlaylist = (playlistId: string, trackId: string, trackObj?: Track) => {
    if (trackObj) {
      setTracks(prev => {
        if (prev.some(t => t.id === trackObj.id)) return prev;
        const updated = [trackObj, ...prev];
        try {
          localStorage.setItem('jmmusic_custom_tracks', JSON.stringify(updated.filter(t => !TRACKS.some(dt => dt.id === t.id))));
        } catch {}
        return updated;
      });
    }

    setPlaylists(prev => prev.map(p => {
      if (p.id === playlistId) {
        const exists = p.trackIds.includes(trackId);
        return {
          ...p,
          trackIds: exists ? p.trackIds : [...p.trackIds, trackId]
        };
      }
      return p;
    }));
  };

  const handleCreatePlaylistWithTrack = (title: string, track: Track) => {
    setTracks(prev => {
      if (prev.some(t => t.id === track.id)) return prev;
      const updated = [track, ...prev];
      try {
        localStorage.setItem('jmmusic_custom_tracks', JSON.stringify(updated.filter(t => !TRACKS.some(dt => dt.id === t.id))));
      } catch {}
      return updated;
    });

    const newPl: Playlist = {
      id: `pl-${Date.now()}`,
      title: title.trim(),
      description: 'Playlist personalizada guardada en Biblioteca Normal.',
      coverUrl: track.coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
      trackIds: [track.id]
    };
    setPlaylists(prev => [newPl, ...prev]);
  };

  useEffect(() => {
    try {
      localStorage.setItem('jmmusic_playlists', JSON.stringify(playlists));
    } catch {}
  }, [playlists]);

  const [audioErrorNotice, setAudioErrorNotice] = useState<string | null>(null);

  const handleImportComplete = (importedTracks: Track[], playlistTitle: string) => {
    setTracks(prev => {
      const existingIds = new Set(prev.map(t => t.id));
      const newOnly = importedTracks.filter(t => !existingIds.has(t.id));
      return [...newOnly, ...prev];
    });

    const newPl: Playlist = {
      id: `pl-imported-${Date.now()}`,
      title: playlistTitle,
      description: `Biblioteca transferida con ${importedTracks.length} canciones sincronizadas en JMMUSIC.`,
      coverUrl: importedTracks[0]?.coverUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80',
      trackIds: importedTracks.map(t => t.id)
    };

    setPlaylists(prev => [newPl, ...prev]);
    setSelectedPlaylistId(newPl.id);
    setActiveView('library');
  };
  const [listeningHistory, setListeningHistory] = useState<Track[]>(() => {
    try {
      const saved = localStorage.getItem('aura_listening_history');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const sleepTimerRef = useRef<any>(null);
  const playRequestIdRef = useRef<number>(0);

  // Web Audio Context initialization
  const initAudio = () => {
    if (audioRef.current) {
      audioEngine.init(audioRef.current);
      audioEngine.resume();
    }
  };

  // MediaSession API Integration (For OS Lock-Screen, Android Notification, Bluetooth, and Car media controls)
  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist,
        album: currentTrack.album || 'Aura Sound Master Hi-Fi',
        artwork: [
          { src: currentTrack.coverUrl, sizes: '96x96', type: 'image/jpeg' },
          { src: currentTrack.coverUrl, sizes: '128x128', type: 'image/jpeg' },
          { src: currentTrack.coverUrl, sizes: '192x192', type: 'image/jpeg' },
          { src: currentTrack.coverUrl, sizes: '256x256', type: 'image/jpeg' },
          { src: currentTrack.coverUrl, sizes: '512x512', type: 'image/jpeg' }
        ]
      });

      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

      navigator.mediaSession.setActionHandler('play', () => togglePlayPause());
      navigator.mediaSession.setActionHandler('pause', () => togglePlayPause());
      navigator.mediaSession.setActionHandler('previoustrack', () => handlePrevious());
      navigator.mediaSession.setActionHandler('nexttrack', () => handleNext());
      navigator.mediaSession.setActionHandler('seekbackward', () => handleSeekRelative(-10));
      navigator.mediaSession.setActionHandler('seekforward', () => handleSeekRelative(10));
      try {
        navigator.mediaSession.setActionHandler('seekto', (details) => {
          if (details.seekTime !== undefined && details.seekTime !== null) {
            handleSeek(details.seekTime);
          }
        });
      } catch {}
    }
  }, [currentTrack, isPlaying]);

  // Sync position state with MediaSession for the Android 13/14 lockscreen squiggly wave
  useEffect(() => {
    if ('mediaSession' in navigator && 'setPositionState' in navigator.mediaSession && duration > 0) {
      try {
        navigator.mediaSession.setPositionState({
          duration: duration,
          playbackRate: playbackSpeed,
          position: Math.min(currentTime, duration)
        });
      } catch {}
    }
  }, [currentTime, duration, playbackSpeed]);

  // Sleep Timer countdown handler
  const handleSetSleepTimer = (minutes: number | null) => {
    if (sleepTimerRef.current) {
      clearTimeout(sleepTimerRef.current);
      sleepTimerRef.current = null;
    }

    setActiveSleepTimerMinutes(minutes);

    if (minutes !== null && minutes > 0) {
      sleepTimerRef.current = setTimeout(async () => {
        if (audioRef.current) {
          await audioEngine.fadeOutAndPause(audioRef.current, 4);
          setIsPlaying(false);
        }
        setActiveSleepTimerMinutes(null);
      }, minutes * 60 * 1000);
    }
  };

  // Audio tag events
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  // Smooth lightweight time ticker for HTML audio without 60fps lag or stutter (40ms = 25fps instant response)
  useEffect(() => {
    if (!isPlaying || youtubeVideoId) return;
    const interval = setInterval(() => {
      if (audioRef.current) {
        setCurrentTime(audioRef.current.currentTime);
      }
    }, 40);
    return () => clearInterval(interval);
  }, [isPlaying, youtubeVideoId]);

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || currentTrack.duration);
      audioRef.current.playbackRate = playbackSpeed;
      setAudioErrorNotice(null);
    }
  };

  const handleAudioError = () => {
    console.warn('Audio stream error notice: trying secondary playback stream');
    if (youtubeVideoId) return;
    // Attempt fallback to YouTube or procedural
    const knownMapId = findKnownYouTubeVideoId(currentTrack.title, currentTrack.artist);
    if (knownMapId) {
      setYoutubeVideoId(knownMapId);
      setIsPlaying(true);
    } else {
      audioEngine.playProceduralSong(currentTrack.title, currentTrack.genre || 'Pop', 100);
      setIsPlaying(true);
      setAudioErrorNotice('Sonando con Sintetizador Hi-Fi (Respaldo activo)');
    }
  };

  const handleYouTubeError = useCallback(async () => {
    console.warn('YouTube stream notice: searching alternative official video or fallback stream');
    try {
      const altQuery = `${currentTrack.title} ${currentTrack.artist} audio`;
      const res = await fetch(`/api/search-video?q=${encodeURIComponent(altQuery)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.results)) {
          const alt = data.results.find((r: any) => r.id && r.id !== youtubeVideoId);
          if (alt?.id) {
            setYoutubeVideoId(alt.id);
            setIsPlaying(true);
            setAudioErrorNotice(null);
            return;
          }
        }
      }
    } catch {}

    setYoutubeVideoId(null);
    if (audioRef.current && currentTrack.audioUrl) {
      audioRef.current.src = currentTrack.audioUrl;
      audioRef.current.load();
      audioRef.current.playbackRate = playbackSpeed;
      audioRef.current.play().then(() => {
        setIsPlaying(true);
        setAudioErrorNotice(null);
      }).catch(() => {
        audioEngine.playProceduralSong(currentTrack.title, currentTrack.genre || 'Pop', 100);
        setIsPlaying(true);
        setAudioErrorNotice('Sonando con Sintetizador Hi-Fi (Respaldo activo)');
      });
    } else {
      audioEngine.playProceduralSong(currentTrack.title, currentTrack.genre || 'Pop', 100);
      setIsPlaying(true);
      setAudioErrorNotice('Sonando con Sintetizador Hi-Fi (Respaldo activo)');
    }
  }, [currentTrack, playbackSpeed, youtubeVideoId]);

  const handleSongEnded = () => {
    if (isRepeat) {
      if (audioRef.current && audioRef.current.src) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      } else {
        setCurrentTime(0);
      }
    } else {
      handleNext();
    }
  };

  // Play / Pause toggle with seamless auto-start
  const togglePlayPause = () => {
    initAudio();

    // If procedural synth is active
    if (audioEngine.isProceduralActive()) {
      if (isPlaying) {
        audioEngine.stopProceduralSong();
        setIsPlaying(false);
      } else {
        audioEngine.playProceduralSong(currentTrack.title, currentTrack.genre || 'Pop', 100);
        setIsPlaying(true);
      }
      return;
    }

    // If currently playing via YouTube, toggle playback directly
    if (youtubeVideoId) {
      setIsPlaying(prev => !prev);
      setAudioErrorNotice(null);
      return;
    }

    // If no active audio source yet, trigger full track playback
    if (!isPlaying) {
      playTrack(currentTrack);
      return;
    }

    if (!audioRef.current) return;

    if (isPlaying) {
      try {
        audioRef.current.pause();
      } catch {}
      setIsPlaying(false);
    } else {
      if (!audioRef.current.src && currentTrack.audioUrl) {
        audioRef.current.src = currentTrack.audioUrl;
      }
      try {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            setIsPlaying(true);
            setAudioErrorNotice(null);
          }).catch((err) => {
            console.warn('Audio resume failed on HTML element, fallback to procedural synth:', err);
            audioEngine.playProceduralSong(currentTrack.title, currentTrack.genre || 'Pop', 100);
            setIsPlaying(true);
            setAudioErrorNotice('Sonando con Sintetizador Hi-Fi (Respaldo activo)');
          });
        } else {
          setIsPlaying(true);
        }
      } catch {
        audioEngine.playProceduralSong(currentTrack.title, currentTrack.genre || 'Pop', 100);
        setIsPlaying(true);
      }
    }
  };

  // Play specific track with seamless transition & bulletproof sound guarantee
  const playTrack = useCallback(async (track: Track) => {
    const reqId = ++playRequestIdRef.current;
    initAudio();

    if (isSynthMode) {
      audioEngine.stopLofiSynth();
      setIsSynthMode(false);
    }
    audioEngine.stopProceduralSong();

    // Immediately stop previous HTML audio to avoid overlapping sound
    if (audioRef.current) {
      try {
        audioRef.current.pause();
      } catch {}
    }

    // Keep history stack updated for exact backward navigation
    if (!isNavigatingHistoryRef.current && currentTrackRef.current && currentTrackRef.current.id !== track.id) {
      setHistoryStack(prev => [...prev.slice(-30), currentTrackRef.current]);
    }

    const immediateCover = getImmediateOfficialCover(track.title, track.artist, track.coverUrl, track.id);
    const enrichedTrack = { ...track, coverUrl: immediateCover };
    setCurrentTrack(enrichedTrack);
    setCurrentTime(0);
    setAudioErrorNotice(null);

    // Open the expanded player screen with photo immediately on play click
    setIsPlayerExpanded(true);

    // Resolve 100% official high-res artwork dynamically in background
    resolveOfficialCoverUrl(track.title, track.artist).then(official => {
      if (official && reqId === playRequestIdRef.current) {
        setCurrentTrack(prev => ({ ...prev, coverUrl: official }));
      }
    });

    // Save to listening history for personalized recommendations
    setListeningHistory(prev => {
      const updated = [enrichedTrack, ...prev.filter(t => t.id !== track.id)].slice(0, 50);
      try {
        localStorage.setItem('aura_listening_history', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // Auto-fetch continuous high-affinity recommendations matching this song's vibe & artist
    fetchSmartNextRecommendations(enrichedTrack).then(recs => {
      if (reqId === playRequestIdRef.current && recs.length > 0) {
        setSmartUpcomingTracks(recs);
      }
    }).catch(() => {});

    // Check if track has an explicit YouTube ID (id: yt-...) or matches our curated hit registry
    let explicitYtId: string | null = null;
    if (track.id && track.id.startsWith('yt-')) {
      const candidate = track.id.replace('yt-', '').trim();
      if (/^[a-zA-Z0-9_-]{11}$/.test(candidate)) {
        explicitYtId = candidate;
      }
    }
    const knownYtId = explicitYtId || findKnownYouTubeVideoId(track.title, track.artist);

    // If it's a local user-uploaded or offline cached file (blob / data URI)
    const isLocalBlob = track.audioUrl && (track.audioUrl.startsWith('blob:') || track.audioUrl.startsWith('data:'));

    if (isLocalBlob && audioRef.current && track.audioUrl) {
      setYoutubeVideoId(null);
      try {
        audioRef.current.src = track.audioUrl;
        audioRef.current.load();
        audioRef.current.playbackRate = playbackSpeed;
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            if (reqId === playRequestIdRef.current) {
              setIsPlaying(true);
              setAudioErrorNotice(null);
            }
          }).catch(async (err) => {
            if (err && err.name === 'AbortError') return;
            console.warn('Local audio stream error:', err);
            fallbackToYouTubeOrSynth(track, reqId);
          });
          return;
        }
      } catch (e) {
        console.warn('Direct audio error:', e);
      }
    }

    // Official High-Definition Track Audio (Zero truncation, full length song)
    if (knownYtId) {
      if (audioRef.current) {
        try {
          audioRef.current.pause();
        } catch {}
      }
      setYoutubeVideoId(knownYtId);
      setIsPlaying(true);
      setYoutubeSeekTime(0);
      setIsFullSongSearching(false);
      setAudioErrorNotice(null);
      return;
    }

    // Dynamic search online or synth fallback
    fallbackToYouTubeOrSynth(track, reqId);
  }, [isSynthMode, playbackSpeed]);

  const fallbackToYouTubeOrSynth = async (track: Track, reqId: number) => {
    let explicitId: string | null = null;
    if (track.id && track.id.startsWith('yt-')) {
      const candidate = track.id.replace('yt-', '').trim();
      if (/^[a-zA-Z0-9_-]{11}$/.test(candidate)) {
        explicitId = candidate;
      }
    }
    const knownMapId = findKnownYouTubeVideoId(track.title, track.artist);
    const matchedId = explicitId || knownMapId;

    if (matchedId) {
      if (audioRef.current) {
        try { audioRef.current.pause(); } catch {}
      }
      setYoutubeVideoId(matchedId);
      setIsPlaying(true);
      setIsFullSongSearching(false);
      setAudioErrorNotice(null);
      return;
    }

    // Dynamic search online
    setIsFullSongSearching(true);
    try {
      const dynamicVideoId = await searchYouTubeTrackOnline(track.title, track.artist);
      if (reqId !== playRequestIdRef.current) return;
      if (dynamicVideoId) {
        if (audioRef.current) {
          try { audioRef.current.pause(); } catch {}
        }
        setYoutubeVideoId(dynamicVideoId);
        setIsPlaying(true);
        setIsFullSongSearching(false);
        setAudioErrorNotice(null);
        return;
      }
    } catch {}

    if (reqId !== playRequestIdRef.current) return;
    setIsFullSongSearching(false);

    // Guaranteed Sound Generator: Web Audio Hi-Fi Procedural Synthesizer
    setYoutubeVideoId(null);
    audioEngine.playProceduralSong(track.title, track.genre || 'Pop', 100);
    setIsPlaying(true);
    setAudioErrorNotice('Sonando con Sintetizador Hi-Fi (Respaldo activo)');
  };

  // --- 25 Features Studio Handlers ---
  const handleToggleNightcore = () => {
    const next = !isNightcore;
    setIsNightcore(next);
    setIsSlowedReverb(false);
    const speed = next ? 1.25 : 1.0;
    setPlaybackSpeed(speed);
    if (audioRef.current) audioRef.current.playbackRate = speed;
  };

  const handleToggleSlowedReverb = () => {
    const next = !isSlowedReverb;
    setIsSlowedReverb(next);
    setIsNightcore(false);
    const speed = next ? 0.85 : 1.0;
    setPlaybackSpeed(speed);
    if (audioRef.current) audioRef.current.playbackRate = speed;
  };

  const handleToggle8DAudio = () => {
    const next = !is8DAudio;
    setIs8DAudio(next);
    audioEngine.set8DAudio(next);
  };

  const handleToggleKaraoke = () => {
    const next = !isKaraoke;
    setIsKaraoke(next);
    audioEngine.setKaraoke(next);
  };

  const handleToggleAmoledSaver = () => {
    setIsAmoledSaver(prev => !prev);
  };

  const handleStartArtistRadio = (artist: string) => {
    const radioTracks = tracks.filter(
      t => t.artist.toLowerCase().includes(artist.toLowerCase()) || (currentTrack.genre && t.genre === currentTrack.genre)
    );
    if (radioTracks.length > 0) {
      setQueue([...radioTracks]);
      playTrack(radioTracks[0]);
    }
  };

  const handleUpdateTrackMetadata = (trackId: string, updated: Partial<Track>) => {
    setTracks(prev => prev.map(t => t.id === trackId ? { ...t, ...updated } : t));
    if (currentTrack.id === trackId) {
      setCurrentTrack(prev => ({ ...prev, ...updated }));
    }
  };

  const handleCleanPlaylistDuplicates = (playlistId: string) => {
    setPlaylists(prev => prev.map(pl => {
      if (pl.id !== playlistId) return pl;
      const seen = new Set<string>();
      const deduped: string[] = [];
      pl.trackIds.forEach(id => {
        if (!seen.has(id)) {
          seen.add(id);
          deduped.push(id);
        }
      });
      return { ...pl, trackIds: deduped };
    }));
  };

  const handleSelectPlaylistFromBrowse = useCallback((id: string) => {
    setSelectedPlaylistId(id);
    setActiveView('library');
  }, []);

  const handleOpenSleepTimer = useCallback(() => {
    setIsSleepTimerOpen(true);
  }, []);

  const handleOpenDrivingMode = useCallback(() => {
    setIsDrivingModeOpen(true);
  }, []);

  // Play full song directly without modal or prompts
  const handleOpenYouTubeForTrack = useCallback(async (track: Track) => {
    const knownId = findKnownYouTubeVideoId(track.title, track.artist);
    if (knownId) {
      handlePlayYouTube(knownId, track.title, track.artist);
      return;
    }
    setIsFullSongSearching(true);
    try {
      const dynamicVideoId = await searchYouTubeTrackOnline(track.title, track.artist);
      if (dynamicVideoId) {
        handlePlayYouTube(dynamicVideoId, track.title, track.artist);
        setIsFullSongSearching(false);
        return;
      }
    } catch {}
    setIsFullSongSearching(false);
    playTrack(track);
  }, [playTrack]);

  // Play from YouTube directly and instantly
  const handlePlayYouTube = async (videoId: string, title: string, artist: string) => {
    initAudio();
    if (audioRef.current) {
      try {
        audioRef.current.pause();
      } catch {}
    }
    if (isSynthMode) {
      audioEngine.stopLofiSynth();
      setIsSynthMode(false);
    }

    setYoutubeVideoId(videoId);
    setIsPlaying(true);

    const detectedGenre = detectMusicalGenre(title, artist);
    const ytTrack: Track = {
      id: `yt-${videoId}`,
      title,
      artist,
      album: 'JMMUSIC Audio Oficial',
      duration: 3600,
      audioUrl: '',
      coverUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      accentColor: '#6366f1',
      genre: detectedGenre,
      plays: 999000,
      lyrics: []
    };

    setCurrentTrack(ytTrack);
    setTracks(prev => [ytTrack, ...prev.filter(t => t.id !== ytTrack.id)]);
    setListeningHistory(prev => {
      const updated = [ytTrack, ...prev.filter(t => t.id !== ytTrack.id)].slice(0, 50);
      try {
        localStorage.setItem('aura_listening_history', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // Auto-fetch recommendations for continuous playback from YouTube track
    fetchSmartNextRecommendations(ytTrack).then(recs => {
      if (recs.length > 0) {
        setSmartUpcomingTracks(recs);
      }
    }).catch(() => {});
  };

  // Toggle Lo-Fi Generator Synth
  const toggleSynthMode = () => {
    initAudio();
    if (isSynthMode) {
      audioEngine.stopLofiSynth();
      setIsSynthMode(false);
    } else {
      if (audioRef.current && isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
      setYoutubeVideoId(null);
      audioEngine.startLofiSynth();
      setIsSynthMode(true);
    }
  };

  // Universal Musical Genre & Vibe Detector (Covers ANY song, Spanish/English/Global)
  const detectMusicalGenre = (title: string = '', artist: string = '', rawGenre: string = ''): string => {
    const combined = `${title} ${artist} ${rawGenre}`.toLowerCase();

    // 1. Acoustic / Choral / Worship / Spiritual
    if (/hakuna|hillsong|elevation|bethel|marcos witt|jesús adrián|jesus adrian|miel san marcos|athenas|alfareros|acústico|acustico|coral|worship|alabanza|adoracion|adoración|cristiana|catolica|católica|espiritual|gospel|iglesia|coro|misa/.test(combined)) {
      return 'Acústico / Coral';
    }

    // 2. Reggaeton / Latin Urban / Trap Latino / Dembow / Perreo
    if (/bad bunny|feid|karol g|rauw alejandro|anuel|mora|quevedo|myke towers|ozuna|j balvin|maluma|daddy yankee|nicky jam|don omar|wisin|yandel|ryan castro|blessd|young miko|chencho|reggaeton|perreo|dembow|trap latino|urbano|bellakeo/.test(combined)) {
      return 'Reggaeton / Urbano';
    }

    // 3. Regional Mexicano / Corridos Tumbados / Banda
    if (/peso pluma|natanael cano|fuerza regida|junior h|grupo frontera|carin leon|christian nodal|banda ms|calibre 50|los dos carnales|corridos|tumbados|banda|norteño|regional/.test(combined)) {
      return 'Regional Mexicano';
    }

    // 4. Rock / Metal / Indie / Alternative
    if (/linkin park|nirvana|queen|metallica|guns n' roses|ac\/dc|arctic monkeys|the strokes|imagine dragons|coldplay|foo fighters|green day|radiohead|muse|red hot chili|system of a down|slipknot|rock|metal|grunge|indie|alternative|punk/.test(combined)) {
      return 'Rock / Alternativo';
    }

    // 5. Hip-Hop / Rap
    if (/eminem|drake|kendrick|travis scott|2pac|tupac|snoop dogg|kanye|post malone|50 cent|jay-z|lil wayne|j\. cole|future|metro boomin|hip-hop|hip hop|rap|trap|boom bap/.test(combined)) {
      return 'Hip-Hop / Rap';
    }

    // 6. Electronic / EDM / Dance / House / Synthwave
    if (/avicii|david guetta|calvin harris|daft punk|martin garrix|tiësto|marshmello|alan walker|skrillex|deadmau5|swedish house|edm|dance|house|techno|electro|synthwave|dj/.test(combined)) {
      return 'Electrónica / Dance';
    }

    // 7. Pop / Global Mainstream
    if (/dua lipa|taylor swift|the weeknd|ariana grande|billie eilish|bruno mars|ed sheeran|olivia rodrigo|harry styles|shawn mendes|katy perry|justin bieber|selena gomez|lady gaga|miley cyrus|sia|shakira|rosalia|rosalía|camila cabello|pop/.test(combined)) {
      return 'Pop / Global';
    }

    // 8. R&B / Lo-Fi / Chill / Classical
    if (/frank ocean|sza|daniel caesar|giveon|alicia keys|john legend|the neighbourhood|lana del rey|r&b|soul|lofi|lo-fi|chillhop|ambient|piano|relax|beethoven|mozart|chopin/.test(combined)) {
      return 'R&B / Lo-Fi';
    }

    if (rawGenre && rawGenre !== 'Cloud Stream') return rawGenre;
    return 'Pop / Global';
  };

  // Universal Musical Continuity Algorithm:
  // Dynamically pairs tracks for ANY artist, genre, or mood without jarring clashes
  const findCombinedTrack = useCallback((sourceTrack: Track, tracksPool: Track[], history: Track[]): { track: Track; isCompatible: boolean } => {
    if (!tracksPool || tracksPool.length === 0) return { track: sourceTrack, isCompatible: true };
    const candidates = tracksPool.filter(t => t.id !== sourceTrack.id);
    if (candidates.length === 0) return { track: sourceTrack, isCompatible: true };

    const sourceGenre = detectMusicalGenre(sourceTrack.title, sourceTrack.artist, sourceTrack.genre);
    const sourceArtist = (sourceTrack.artist || '').toLowerCase().trim();
    const recentIds = new Set(history.slice(-8).map(t => t.id));

    const isAcousticWorship = sourceGenre === 'Acústico / Coral';
    const isLatinUrban = sourceGenre === 'Reggaeton / Urbano';
    const isRegionalMex = sourceGenre === 'Regional Mexicano';
    const isRockIndie = sourceGenre === 'Rock / Alternativo';
    const isElectronic = sourceGenre === 'Electrónica / Dance';
    const isHipHop = sourceGenre === 'Hip-Hop / Rap';
    const isPop = sourceGenre === 'Pop / Global';
    const isChillLoFi = sourceGenre === 'R&B / Lo-Fi';

    const scored = candidates.map(candidate => {
      let score = 0;
      const cGenre = detectMusicalGenre(candidate.title, candidate.artist, candidate.genre);
      const cArtist = (candidate.artist || '').toLowerCase().trim();

      const isCandAcousticWorship = cGenre === 'Acústico / Coral';
      const isCandLatinUrban = cGenre === 'Reggaeton / Urbano';
      const isCandRegionalMex = cGenre === 'Regional Mexicano';
      const isCandRockIndie = cGenre === 'Rock / Alternativo';
      const isCandElectronic = cGenre === 'Electrónica / Dance';
      const isCandHipHop = cGenre === 'Hip-Hop / Rap';
      const isCandPop = cGenre === 'Pop / Global';
      const isCandChillLoFi = cGenre === 'R&B / Lo-Fi';

      // 1. Strict Universal Genre Barrier: NEVER jump across jarring polar opposite genres
      if (isAcousticWorship && (isCandLatinUrban || isCandHipHop || isCandRockIndie)) {
        score -= 3000;
      }
      if (isLatinUrban && (isCandAcousticWorship || isCandRockIndie)) {
        score -= 3000;
      }
      if (isRockIndie && (isCandLatinUrban || isCandAcousticWorship)) {
        score -= 3000;
      }
      if (isRegionalMex && (isCandElectronic || isCandRockIndie || isCandAcousticWorship)) {
        score -= 3000;
      }

      // 2. Same Artist Bonus (highest affinity)
      if (cArtist && sourceArtist && (cArtist === sourceArtist || cArtist.includes(sourceArtist) || sourceArtist.includes(cArtist))) {
        score += 350;
      }

      // 3. Exact Genre Match
      if (cGenre === sourceGenre) {
        score += 200;
      }

      // 4. Compatible Genre Clusters
      if (isAcousticWorship && (isCandAcousticWorship || isCandChillLoFi)) score += 160;
      if (isLatinUrban && (isCandLatinUrban || isCandRegionalMex)) score += 140;
      if (isRockIndie && isCandRockIndie) score += 160;
      if (isElectronic && (isCandElectronic || isCandPop)) score += 140;
      if (isHipHop && (isCandHipHop || isCandChillLoFi || isCandLatinUrban)) score += 120;
      if (isPop && (isCandPop || isCandElectronic)) score += 110;
      if (isChillLoFi && (isCandChillLoFi || isCandAcousticWorship)) score += 140;

      // Penalize tracks heard in the last 8 plays for variety
      if (recentIds.has(candidate.id)) {
        score -= 80;
      }

      // Subtle organic randomization
      score += Math.random() * 15;

      return { track: candidate, score };
    });

    scored.sort((a, b) => b.score - a.score);
    const best = scored[0];
    return {
      track: best?.track || candidates[0],
      isCompatible: (best?.score ?? -1) > 0
    };
  }, []);

  // Next Track: Smart Vibe & Artist Continuity (NEVER jumps to unrelated genres)
  const handleNext = () => {
    // Record current song in history stack
    setHistoryStack(prev => [...prev.slice(-30), currentTrack]);

    // 1. If user explicitly added tracks to queue, play the first queued song
    if (queue.length > 0) {
      const nextTrack = queue[0];
      setQueue(queue.slice(1));
      playTrack(nextTrack);
      return;
    }

    // 2. If we have high-affinity upcoming recommended tracks for this exact artist/genre:
    if (smartUpcomingTracks.length > 0) {
      const nextRec = smartUpcomingTracks[0];
      setSmartUpcomingTracks(prev => prev.slice(1));

      // Check if candidate exists in local tracks first
      const localMatch = tracks.find(
        t => t.title.toLowerCase() === nextRec.title.toLowerCase() ||
             (t.artist.toLowerCase() === nextRec.artist.toLowerCase() && t.title.toLowerCase().includes(nextRec.title.toLowerCase()))
      );

      if (localMatch) {
        playTrack(localMatch);
        return;
      }

      // Search and play the recommended track online
      searchYouTubeTrackOnline(nextRec.title, nextRec.artist).then(foundId => {
        if (foundId && foundId !== youtubeVideoId) {
          handlePlayYouTube(foundId, nextRec.title, nextRec.artist);
        } else {
          searchYouTubeTrackOnline(`${nextRec.artist} audio`).then(altId => {
            if (altId && altId !== youtubeVideoId) {
              handlePlayYouTube(altId, nextRec.title, nextRec.artist);
            }
          });
        }
      });
      return;
    }

    // 3. Fallback: Search compatible song in local library with strict genre barrier
    const otherTracks = tracks.filter(t => t.id !== currentTrack.id);
    const { track: combined, isCompatible } = findCombinedTrack(currentTrack, otherTracks, historyStack);

    if (isCompatible) {
      playTrack(combined);
    } else {
      // NEVER fall back to unrelated songs! Fetch another song by the SAME artist
      const cleanArtist = currentTrack.artist.split('&')[0].split('feat')[0].trim();
      const autoSearchQuery = `${cleanArtist} mejores canciones audio`;
      searchYouTubeTrackOnline(autoSearchQuery).then(foundId => {
        if (foundId && foundId !== youtubeVideoId) {
          handlePlayYouTube(foundId, `Más de ${cleanArtist}`, cleanArtist);
        }
      });
    }
  };

  // Previous Track: Exact history navigation (returns to what was playing before!)
  const handlePrevious = () => {
    // If more than 3 seconds in, restart the song
    if (currentTime > 3) {
      handleSeek(0);
      return;
    }

    if (historyStack.length > 0) {
      // Pop the exact last track that was playing
      const previousTrack = historyStack[historyStack.length - 1];
      setHistoryStack(prev => prev.slice(0, prev.length - 1));
      isNavigatingHistoryRef.current = true;
      playTrack(previousTrack);
      setTimeout(() => {
        isNavigatingHistoryRef.current = false;
      }, 400);
    } else {
      // Fallback if no history yet
      const currentIndex = tracks.findIndex(t => t.id === currentTrack.id);
      const prevIndex = (currentIndex - 1 + tracks.length) % tracks.length;
      playTrack(tracks[prevIndex]);
    }
  };

  // Relative Seek (+10s / -10s)
  const handleSeekRelative = useCallback((seconds: number) => {
    setCurrentTime(curr => {
      const nextTime = Math.max(0, curr + seconds);
      if (youtubeVideoId) {
        setYoutubeSeekTime(nextTime);
      } else if (audioRef.current) {
        audioRef.current.currentTime = nextTime;
      }
      return nextTime;
    });
  }, [youtubeVideoId]);

  // Seek
  const handleSeek = useCallback((time: number) => {
    setCurrentTime(time);
    if (youtubeVideoId) {
      setYoutubeSeekTime(time);
    } else if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  }, [youtubeVideoId]);

  // A-B Looper check
  useEffect(() => {
    if (loopPointA !== null && loopPointB !== null && loopPointB > loopPointA) {
      if (currentTime >= loopPointB) {
        handleSeek(loopPointA);
      }
    }
  }, [currentTime, loopPointA, loopPointB, handleSeek]);

  // Seamless Crossfade check
  const lastCrossfadedTrackRef = useRef<string | null>(null);
  useEffect(() => {
    if (
      crossfadeSecs > 0 &&
      duration > 20 &&
      currentTime >= duration - crossfadeSecs &&
      isPlaying &&
      lastCrossfadedTrackRef.current !== currentTrack.id
    ) {
      lastCrossfadedTrackRef.current = currentTrack.id;
      handleNext();
    }
  }, [currentTime, duration, crossfadeSecs, isPlaying, currentTrack.id, handleNext]);

  // Volume
  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (audioRef.current) {
      audioRef.current.volume = newVol;
    }
  };

  // Playback Speed
  const handleSpeedChange = useCallback((speed: number) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  }, []);

  // Favorites
  const toggleFavorite = useCallback((trackId: string) => {
    setFavorites(prev =>
      prev.includes(trackId) ? prev.filter(id => id !== trackId) : [...prev, trackId]
    );
  }, []);

  // Add to queue
  const handleAddToQueue = useCallback((track: Track) => {
    setQueue(prev => [...prev, track]);
  }, []);

  // Equalizer Preset selection
  const handleSelectPreset = (preset: EQPreset) => {
    setEqPreset(preset);
    audioEngine.setPreset(preset);
  };

  // Upload custom user audio file (MP3 / WAV)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileUrl = URL.createObjectURL(file);
    const customTrack: Track = {
      id: `custom-${Date.now()}`,
      title: file.name.replace(/\.[^/.]+$/, ''),
      artist: 'Mi Música Local Completa',
      album: 'Archivos Personales',
      duration: 240,
      audioUrl: fileUrl,
      coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
      accentColor: '#8b5cf6',
      genre: 'Local Audio',
      plays: 1,
      lyrics: [
        { time: 0, text: `Reproduciendo archivo completo: ${file.name}` },
        { time: 10, text: 'Audio procesado con Ecualizador de Estudio en vivo.' }
      ]
    };

    setTracks([customTrack, ...tracks]);
    playTrack(customTrack);
  };

  // Create playlist
  const handleCreatePlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistTitle.trim()) return;

    const newPl: Playlist = {
      id: `pl-${Date.now()}`,
      title: newPlaylistTitle.trim(),
      description: 'Playlist personalizada creada por el usuario.',
      coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
      trackIds: [currentTrack.id]
    };

    setPlaylists([newPl, ...playlists]);
    setNewPlaylistTitle('');
    setIsNewPlaylistModalOpen(false);
    setSelectedPlaylistId(newPl.id);
    setActiveView('library');
  };

  // Spacebar and media keyboard hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlayPause();
      } else if (e.code === 'ArrowRight' && e.shiftKey) {
        handleSeekRelative(10);
      } else if (e.code === 'ArrowLeft' && e.shiftKey) {
        handleSeekRelative(-10);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, currentTrack, duration]);

  return (
    <div className={`min-h-screen text-slate-100 flex flex-col font-sans select-none overflow-hidden relative ${isAmoledSaver ? 'bg-black' : 'bg-slate-950'}`}>
      {/* Hidden File Input for Custom MP3 upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="audio/*,.mp3,.wav,.ogg,.m4a"
        className="hidden"
      />

      {/* Native HTML5 Audio Element without CORS constraint for universal audio playback */}
      <audio
        ref={audioRef}
        src={currentTrack.audioUrl || undefined}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onError={handleAudioError}
        onEnded={handleSongEnded}
        preload="auto"
      />

      {/* Real YouTube IFrame API Player Controller with live time sync and toggle view */}
      {youtubeVideoId && (
        <YouTubePlayerController
          videoId={youtubeVideoId}
          isPlaying={isPlaying}
          volume={volume}
          showVideo={isVideoView}
          isExpanded={isPlayerExpanded || activeView === 'now-playing'}
          onToggleVideo={() => setIsVideoView(prev => !prev)}
          onTimeUpdate={(curr, dur) => {
            setCurrentTime(curr);
            if (dur > 0) setDuration(dur);
          }}
          onEnded={handleSongEnded}
          onStateChange={(playing) => setIsPlaying(playing)}
          seekTime={youtubeSeekTime}
          onSeekHandled={() => setYoutubeSeekTime(null)}
          onErrorFallback={handleYouTubeError}
        />
      )}

      {/* Dynamic Ambient Fluid Mesh Reactive to Track Color */}
      {!isAmoledSaver && (
        <div
          className="fixed inset-0 pointer-events-none transition-all duration-1000 opacity-20 blur-[120px] scale-125"
          style={{
            background: `radial-gradient(circle at 75% 25%, ${currentTrack.accentColor} 0%, transparent 60%), radial-gradient(circle at 25% 75%, #4f46e5 0%, transparent 60%)`
          }}
        />
      )}

      {/* Top Banner & Quick Controls */}
      <header className="bg-slate-900/90 border-b border-slate-800/80 px-4 py-2.5 flex items-center justify-between text-xs backdrop-blur-md z-30">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isPlaying || isSynthMode || youtubeVideoId ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => setActiveView('browse')}>
              <Headphones className="w-4 h-4 text-indigo-400" />
              <span className="font-black text-white tracking-wider text-sm bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">JMMUSIC</span>
            </div>
          </div>

          {/* Quick Header Switcher: Biblioteca Normal & Sin Internet */}
          <div className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveView('library')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeView === 'library'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
              title="Tu Biblioteca Normal: playlists, favoritos y canciones"
            >
              <Library className="w-3.5 h-3.5 text-indigo-400" />
              <span>Biblioteca Normal</span>
            </button>

            <button
              onClick={() => setActiveView('offline')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeView === 'offline'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
              title="Biblioteca Sin Internet: canciones guardadas para escuchar offline"
            >
              <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sin Internet</span>
              {offlineSavedIds.length > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded-full text-[10px] font-black border border-emerald-500/40">
                  {offlineSavedIds.length}
                </span>
              )}
            </button>

          </div>

          {/* AMOLED True Black Saver Direct Toggle */}
          <button
            onClick={handleToggleAmoledSaver}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all cursor-pointer ${
              isAmoledSaver
                ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-600/30'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Ahorro de batería AMOLED (Negro puro #000000)"
          >
            <Moon className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">Modo AMOLED</span>
            <span className="sm:hidden">AMOLED</span>
          </button>

          {/* Ambientes Sonoros Shortcut */}
          <button
            onClick={() => setIsAmbienceOpen(true)}
            className="px-2.5 py-1.5 rounded-xl text-xs font-bold border border-slate-800 bg-slate-900 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40 flex items-center gap-1.5 transition-all cursor-pointer"
            title="Mezclador de ambientes sonoros (Lluvia, Olas, Fuego)"
          >
            <CloudRain className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Ambiente 3D</span>
          </button>


          {/* Offline connectivity indicator */}
          <OfflineIndicator
            onOpenOfflineTracks={() => setActiveView('offline')}
            onPlayLoFiSynth={toggleSynthMode}
          />

          {/* Sleep Timer Indicator (if active) */}
          {activeSleepTimerMinutes !== null && (
            <button
              onClick={() => setIsSleepTimerOpen(true)}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center gap-1.5 cursor-pointer"
            >
              <Moon className="w-3.5 h-3.5" />
              <span>{activeSleepTimerMinutes} min</span>
            </button>
          )}

          {/* Upload own song */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="hidden sm:flex px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 items-center gap-1.5 transition-all cursor-pointer"
            title="Carga cualquier canción MP3 completa desde tu dispositivo para escuchar sin internet"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-400" />
            <span>Subir MP3</span>
          </button>
        </div>

        {/* Right Side: Representative Profile Picture & User Info */}
        <button
          onClick={() => setIsUserProfileOpen(true)}
          className="flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 hover:border-indigo-500/60 transition-all cursor-pointer group shadow-sm active:scale-95 flex-shrink-0 ml-2"
          title="Ver y cambiar foto de perfil de JMMUSIC"
        >
          <div className="relative">
            <div className="w-8 h-8 rounded-full p-0.5 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 shadow-md">
              <img
                src={userProfile.avatarUrl}
                alt={userProfile.name}
                className="w-full h-full rounded-full object-cover bg-slate-950"
              />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900 animate-pulse" />
          </div>
          <div className="hidden md:flex flex-col text-left">
            <span className="text-[11px] font-bold text-white group-hover:text-indigo-300 transition-colors leading-tight">
              {userProfile.name}
            </span>
            <span className="text-[9px] text-indigo-400 font-semibold leading-tight">
              Perfil VIP Hi-Fi
            </span>
          </div>
        </button>
      </header>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        {/* Desktop Sidebar Navigation */}
        <div className="hidden lg:block h-full shrink-0">
          <Sidebar
            activeView={activeView}
            onSelectView={(v) => {
              setActiveView(v);
              setSelectedPlaylistId(null);
            }}
            playlists={playlists}
            selectedPlaylistId={selectedPlaylistId}
            onSelectPlaylist={setSelectedPlaylistId}
            onOpenAmbience={() => setIsAmbienceOpen(true)}
            onOpenPomodoro={() => setIsPomodoroOpen(true)}
            onOpenDriving={() => setIsDrivingModeOpen(true)}
            onCreatePlaylist={() => setIsNewPlaylistModalOpen(true)}
          />
        </div>

        {/* Center / View Area */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-10 py-6 scrollbar-thin scrollbar-thumb-slate-800">
          {activeView === 'browse' && (
            <BrowseView
              tracks={tracks}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              onPlayTrack={playTrack}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
              onAddToQueue={handleAddToQueue}
              playlists={playlists}
              onSelectPlaylist={handleSelectPlaylistFromBrowse}
              playbackSpeed={playbackSpeed}
              onChangeSpeed={handleSpeedChange}
              onSeekRelative={handleSeekRelative}
              onOpenSleepTimer={handleOpenSleepTimer}
              onOpenDrivingMode={handleOpenDrivingMode}
              onPlayFullYouTube={handleOpenYouTubeForTrack}
              listeningHistory={listeningHistory}
              onOpenEqualizer={() => setIsEqualizerOpen(true)}
              onOpenSaveModal={handleOpenSaveModal}
            />
          )}

          {activeView === 'library' && (
            <LibraryView
              tracks={tracks}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              onPlayTrack={playTrack}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
              playlists={playlists}
              selectedPlaylistId={selectedPlaylistId}
              onSelectPlaylist={setSelectedPlaylistId}
              onCreatePlaylist={() => setIsNewPlaylistModalOpen(true)}
              onOpenImportModal={() => setIsImportModalOpen(true)}
              userProfile={userProfile}
              onOpenProfile={() => setIsUserProfileOpen(true)}
              onOpenOfflineView={() => setActiveView('offline')}
              onOpenSaveModal={handleOpenSaveModal}
              onStartArtistRadio={handleStartArtistRadio}
              onUpdateTrackMetadata={handleUpdateTrackMetadata}
              onDownloadTrack={(t) => {
                saveTrackOffline(t);
                setOfflineSavedIds(getOfflineTrackIds());
              }}
              onCleanDuplicates={handleCleanPlaylistDuplicates}
            />
          )}

          {activeView === 'favorites' && (
            <LibraryView
              tracks={tracks}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              onPlayTrack={playTrack}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
              playlists={playlists}
              selectedPlaylistId={null}
              onSelectPlaylist={() => {}}
              onCreatePlaylist={() => setIsNewPlaylistModalOpen(true)}
              isOnlyFavorites={true}
              userProfile={userProfile}
              onOpenProfile={() => setIsUserProfileOpen(true)}
              onOpenOfflineView={() => setActiveView('offline')}
              onOpenSaveModal={handleOpenSaveModal}
            />
          )}

          {activeView === 'offline' && (
            <OfflineView
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              onPlayTrack={playTrack}
              onPlayLoFiSynth={toggleSynthMode}
              isSynthMode={isSynthMode}
              onUploadMp3={() => fileInputRef.current?.click()}
              defaultTracks={tracks}
            />
          )}
        </main>
      </div>

      {/* Synchronized Lyrics Drawer Docked at the Bottom (Without leaving library) */}
      <BottomLyricsDrawer
        isOpen={isBottomLyricsOpen}
        onClose={() => setIsBottomLyricsOpen(false)}
        track={currentTrack}
        currentTime={currentTime}
        onSeek={handleSeek}
      />

      {/* Persistent Bottom Audio Player */}
      <PlayerBar
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onPlayPause={togglePlayPause}
        onNext={handleNext}
        onPrevious={handlePrevious}
        currentTime={currentTime}
        duration={duration}
        onSeek={handleSeek}
        volume={volume}
        onVolumeChange={handleVolumeChange}
        isShuffle={isShuffle}
        onToggleShuffle={() => setIsShuffle(!isShuffle)}
        isRepeat={isRepeat}
        onToggleRepeat={() => setIsRepeat(!isRepeat)}
        isFavorite={favorites.includes(currentTrack.id)}
        onToggleFavorite={() => toggleFavorite(currentTrack.id)}
        onOpenLyrics={() => setIsBottomLyricsOpen(prev => !prev)}
        isLyricsOpen={isBottomLyricsOpen}
        onOpenEqualizer={() => setIsEqualizerOpen(true)}
        onOpenAmbience={() => setIsAmbienceOpen(true)}
        onToggleQueue={() => setIsQueueOpen(!isQueueOpen)}
        onToggleExpanded={() => setIsPlayerExpanded(true)}
        isExpanded={isPlayerExpanded}
        eqPreset={eqPreset}
        onPlayFullYouTube={handleOpenYouTubeForTrack}
        isFullSongSearching={isFullSongSearching}
        onOpenAndroidNotification={() => setIsAndroidNotificationOpen(true)}
        onOpenSaveModal={handleOpenSaveModal}
        isNightcore={isNightcore}
        onToggleNightcore={handleToggleNightcore}
        isSlowedReverb={isSlowedReverb}
        onToggleSlowedReverb={handleToggleSlowedReverb}
        is8DAudio={is8DAudio}
        onToggle8DAudio={handleToggle8DAudio}
        isKaraoke={isKaraoke}
        onToggleKaraoke={handleToggleKaraoke}
        showVideo={isVideoView}
        onToggleVideo={() => setIsVideoView(prev => !prev)}
        playbackSpeed={playbackSpeed}
        onCycleSpeed={() => {
          const speeds = [1.0, 1.25, 1.5, 0.85];
          const next = speeds[(speeds.indexOf(playbackSpeed) + 1) % speeds.length];
          handleSpeedChange(next);
        }}
        onOpenSleepTimer={() => setIsSleepTimerOpen(true)}
        onOpenShareModal={() => setIsShareModalOpen(true)}
      />

      {/* Bottom Navigation Bar */}
      <BottomNavBar
        activeView={activeView}
        onSelectView={(v) => {
          if (v === 'now-playing') {
            setIsPlayerExpanded(true);
          } else {
            setActiveView(v);
            setIsPlayerExpanded(false);
          }
        }}
        favoritesCount={favorites.length}
        offlineCount={offlineSavedIds.length}
      />

      {/* Full-Screen YouTube Music Style Player Overlay (Matches screenshots) */}
      {(isPlayerExpanded || activeView === 'now-playing') && (
        <NowPlayingView
          track={currentTrack}
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          onTogglePlayPause={togglePlayPause}
          onNext={handleNext}
          onPrevious={handlePrevious}
          onSeek={handleSeek}
          isShuffle={isShuffle}
          onToggleShuffle={() => setIsShuffle(!isShuffle)}
          isRepeat={isRepeat}
          onToggleRepeat={() => setIsRepeat(!isRepeat)}
          isFavorite={favorites.includes(currentTrack.id)}
          onToggleFavorite={() => toggleFavorite(currentTrack.id)}
          onCollapse={() => {
            setIsPlayerExpanded(false);
            if (activeView === 'now-playing') setActiveView('browse');
          }}
          onOpenEqualizer={() => setIsEqualizerOpen(true)}
          onOpenLyrics={() => {
            setIsPlayerExpanded(false);
            setIsBottomLyricsOpen(true);
          }}
          onOpenQueue={() => setIsQueueOpen(true)}
          queue={queue}
          onPlayTrack={playTrack}
          youtubeVideoId={youtubeVideoId}
          eqPreset={eqPreset}
          onSelectPreset={handleSelectPreset}
          onDownloadTrack={(t) => {
            saveTrackOffline(t);
            setOfflineSavedIds(getOfflineTrackIds());
          }}
          isDownloaded={offlineSavedIds.includes(currentTrack.id)}
          onOpenSaveModal={() => handleOpenSaveModal(currentTrack)}
          isNightcore={isNightcore}
          onToggleNightcore={handleToggleNightcore}
          isSlowedReverb={isSlowedReverb}
          onToggleSlowedReverb={handleToggleSlowedReverb}
          is8DAudio={is8DAudio}
          onToggle8DAudio={handleToggle8DAudio}
          isKaraoke={isKaraoke}
          onToggleKaraoke={handleToggleKaraoke}
          isAmoledSaver={isAmoledSaver}
          onToggleAmoledSaver={handleToggleAmoledSaver}
          loopPointA={loopPointA}
          loopPointB={loopPointB}
          onSetLoopPointA={() => setLoopPointA(currentTime)}
          onSetLoopPointB={() => setLoopPointB(currentTime)}
          onClearLoop={() => {
            setLoopPointA(null);
            setLoopPointB(null);
          }}
          crossfadeSecs={crossfadeSecs}
          onSetCrossfadeSecs={setCrossfadeSecs}
          onOpenSleepTimer={() => setIsSleepTimerOpen(true)}
          onOpenAmbience={() => setIsAmbienceOpen(true)}
          onStartArtistRadio={handleStartArtistRadio}
          playbackSpeed={playbackSpeed}
          onSetPlaybackSpeed={handleSpeedChange}
          showVideo={isVideoView}
          onToggleVideo={() => setIsVideoView(prev => !prev)}
          onOpen8DModal={() => setIs8DModalOpen(true)}
          onOpenKaraokeModal={() => setIsKaraokeModalOpen(true)}
          onOpenStoryCardModal={() => setIsStoryCardModalOpen(true)}
          onOpenDjCrossfadeModal={() => setIsDjCrossfadeModalOpen(true)}
          onOpenSuperBassModal={() => setIsSuperBassModalOpen(true)}
          onOpenShareModal={() => setIsShareModalOpen(true)}
          onOpenRingtoneStudio={() => setIsRingtoneModalOpen(true)}
          onOpenJamParty={() => setIsJamPartyModalOpen(true)}
          onOpenDjStudio={() => setIsDjStudioModalOpen(true)}
        />
      )}

      {/* Slide-out Queue Drawer */}
      <QueueDrawer
        isOpen={isQueueOpen}
        onClose={() => setIsQueueOpen(false)}
        currentTrack={currentTrack}
        queue={queue}
        onPlayQueueTrack={(index) => {
          const selected = queue[index];
          const newQueue = queue.filter((_, i) => i !== index);
          setQueue(newQueue);
          playTrack(selected);
        }}
        onRemoveFromQueue={(index) => {
          setQueue(queue.filter((_, i) => i !== index));
        }}
        onClearQueue={() => setQueue([])}
        smartRecommendations={smartUpcomingTracks}
        onPlayRecommended={(rec) => {
          searchYouTubeTrackOnline(rec.title, rec.artist).then(vid => {
            if (vid) {
              handlePlayYouTube(vid, rec.title, rec.artist);
            } else {
              searchYouTubeTrackOnline(`${rec.artist} ${rec.title}`).then(altVid => {
                if (altVid) handlePlayYouTube(altVid, rec.title, rec.artist);
              });
            }
          });
        }}
      />

      {/* Equalizer DSP Modal */}
      <EqualizerModal
        isOpen={isEqualizerOpen}
        onClose={() => setIsEqualizerOpen(false)}
        currentPreset={eqPreset}
        onSelectPreset={handleSelectPreset}
      />

      {/* Ambient Soundscapes */}
      <AmbientSoundscapesModal
        isOpen={isAmbienceOpen}
        onClose={() => setIsAmbienceOpen(false)}
      />

      {/* Pomodoro Flow Modal (Idea #153) */}
      <PomodoroModal
        isOpen={isPomodoroOpen}
        onClose={() => setIsPomodoroOpen(false)}
      />

      {/* Sleep Timer Modal */}
      <SleepTimerModal
        isOpen={isSleepTimerOpen}
        onClose={() => setIsSleepTimerOpen(false)}
        activeTimerMinutes={activeSleepTimerMinutes}
        onSetTimer={handleSetSleepTimer}
      />

      {/* Driving Mode Modal */}
      <DrivingModeModal
        isOpen={isDrivingModeOpen}
        onClose={() => setIsDrivingModeOpen(false)}
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onPlayPause={togglePlayPause}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onToggleFavorite={() => toggleFavorite(currentTrack.id)}
        isFavorite={favorites.includes(currentTrack.id)}
      />

      {/* Create Playlist Modal */}
      {isNewPlaylistModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <form
            onSubmit={handleCreatePlaylist}
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-base text-white">Crear Nueva Playlist</h3>
              <button
                type="button"
                onClick={() => setIsNewPlaylistModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Nombre de la lista</label>
              <input
                type="text"
                value={newPlaylistTitle}
                onChange={(e) => setNewPlaylistTitle(e.target.value)}
                placeholder="Ej. Sesión Nocturna, Gym Flow..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsNewPlaylistModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer"
              >
                Crear Playlist
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Spotify & YouTube Music Transfer Modal */}
      <ImportLibraryModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportComplete={handleImportComplete}
      />

      {/* Android 13/14 Material You Style Media Notification (Squiggly Waveform & Full Controls) */}
      <AndroidMediaNotification
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        onTogglePlayPause={togglePlayPause}
        onNextTrack={handleNext}
        onPrevTrack={handlePrevious}
        onSeek={handleSeek}
        isFavorite={favorites.includes(currentTrack.id)}
        onToggleFavorite={() => toggleFavorite(currentTrack.id)}
        isShuffle={isShuffle}
        onToggleShuffle={() => setIsShuffle(!isShuffle)}
        isRepeat={isRepeat}
        onToggleRepeat={() => setIsRepeat(!isRepeat)}
        isOpen={isAndroidNotificationOpen}
        onClose={() => setIsAndroidNotificationOpen(false)}
        isDocked={isAndroidNotificationDocked}
        onToggleDock={() => setIsAndroidNotificationDocked(!isAndroidNotificationDocked)}
      />

      {/* User Profile & Avatar Modal */}
      <UserProfileModal
        isOpen={isUserProfileOpen}
        onClose={() => setIsUserProfileOpen(false)}
        profile={userProfile}
        onSaveProfile={handleSaveProfile}
        favoriteTracksCount={favorites.length}
        offlineTracksCount={getOfflineTrackIds().length}
        playlistsCount={playlists.length}
      />

      {/* Save Track Modal: Explicitly presents Biblioteca Normal vs Biblioteca Sin Wi-Fi */}
      {isSaveModalOpen && (
        <SaveTrackModal
          isOpen={isSaveModalOpen}
          onClose={() => {
            setIsSaveModalOpen(false);
            setTrackToSave(null);
          }}
          track={trackToSave || currentTrack}
          isFavorite={favorites.includes((trackToSave || currentTrack).id)}
          onToggleFavorite={() => toggleFavorite((trackToSave || currentTrack).id)}
          isDownloaded={offlineSavedIds.includes((trackToSave || currentTrack).id)}
          onDownloadOffline={async () => {
            const target = trackToSave || currentTrack;
            await saveTrackOffline(target);
            setOfflineSavedIds(getOfflineTrackIds());
          }}
          isDownloading={false}
          playlists={playlists}
          onAddToPlaylist={(playlistId, track) => handleAddToPlaylist(playlistId, track.id, track)}
          onCreatePlaylist={handleCreatePlaylistWithTrack}
        />
      )}

      {/* Android APK, WebView Diagnostics & Direct WebAPK Installation Modal */}
      <AndroidAPKModal
        isOpen={isAndroidAPKModalOpen}
        onClose={() => setIsAndroidAPKModalOpen(false)}
      />

      {/* 1. Share App Modal with Short URL & Public Permission Helper */}
      <ShareAppModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        currentSongTitle={currentTrack?.title}
        currentArtist={currentTrack?.artist}
      />

      {/* 2. Idea 1: Spatial Audio 8D 360 Modal */}
      <SpatialAudio8DModal
        isOpen={is8DModalOpen}
        onClose={() => setIs8DModalOpen(false)}
        currentSongTitle={currentTrack?.title}
        currentArtist={currentTrack?.artist}
      />

      {/* 3. Idea 2: Karaoke Studio & Vocal Remover Modal */}
      <KaraokeStudioModal
        isOpen={isKaraokeModalOpen}
        onClose={() => setIsKaraokeModalOpen(false)}
        currentTrack={currentTrack}
        currentTime={currentTime}
      />

      {/* 4. Idea 3: Story Card Generator for Social Media */}
      <StoryCardModal
        isOpen={isStoryCardModalOpen}
        onClose={() => setIsStoryCardModalOpen(false)}
        currentTrack={currentTrack}
      />

      {/* 5. Idea 4: DJ Crossfade & Mixer Modal */}
      <DjCrossfadeModal
        isOpen={isDjCrossfadeModalOpen}
        onClose={() => setIsDjCrossfadeModalOpen(false)}
        crossfadeDuration={crossfadeSecs}
        onSetCrossfade={(sec) => setCrossfadeSecs(sec)}
        onTriggerCrossfadeNext={() => handleNext()}
        hasNextTrack={queue.length > 0 || tracks.length > 1}
      />

      {/* 6. Idea 5: Super Bass Booster 200% Modal */}
      <SuperBassBoosterModal
        isOpen={isSuperBassModalOpen}
        onClose={() => setIsSuperBassModalOpen(false)}
      />

      {/* 7. Killer Idea: Ringtone & Audio Snip Studio Modal */}
      <RingtoneStudioModal
        isOpen={isRingtoneModalOpen}
        onClose={() => setIsRingtoneModalOpen(false)}
        track={currentTrack}
        currentTime={currentTime}
        duration={duration}
        onSeek={handleSeek}
        isPlaying={isPlaying}
        onTogglePlayPause={togglePlayPause}
      />

      {/* 8. Killer Idea: Synchronized Jam Party Room */}
      <JamPartyModal
        isOpen={isJamPartyModalOpen}
        onClose={() => setIsJamPartyModalOpen(false)}
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onPlayTrack={playTrack}
        queue={queue}
        onAddToQueue={(t) => setQueue(prev => [...prev, t])}
      />

      {/* 9. Killer Idea: Live DJ Scratch & Pitch Studio */}
      <DjStudioModal
        isOpen={isDjStudioModalOpen}
        onClose={() => setIsDjStudioModalOpen(false)}
        track={currentTrack}
        isPlaying={isPlaying}
        playbackSpeed={playbackSpeed}
        onSetPlaybackSpeed={handleSpeedChange}
        isNightcore={isNightcore}
        onToggleNightcore={handleToggleNightcore}
        isSlowedReverb={isSlowedReverb}
        onToggleSlowedReverb={handleToggleSlowedReverb}
      />

    </div>
  );
}
