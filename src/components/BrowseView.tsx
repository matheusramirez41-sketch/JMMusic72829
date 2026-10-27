import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Track, Playlist } from '../types/music';
import {
  Play,
  Pause,
  Heart,
  Plus,
  Loader2,
  Download,
  Check,
  HardDrive,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Flame,
  Radio,
  Grid,
  List,
  Sliders,
  Zap,
  Volume2,
  Ban,
  UserCheck,
  RefreshCw,
  Moon,
  Dumbbell,
  Disc3,
  CheckCircle2,
  Shuffle,
  Music,
  User,
  ArrowRight,
  X,
  BookmarkPlus
} from 'lucide-react';
import { SearchBar, SearchFilterType } from './SearchBar';
import { searchGlobalMusicWithAlbums, fetchAlbumTracks, AlbumItem } from '../services/musicSearchService';
import { saveTrackOffline, getOfflineTrackIds } from '../services/offlineMusicService';
import { TOP_FEATURED_ARTISTS, FeaturedArtistProfile } from '../data/mockTracks';
import { audioEngine } from './AudioEngine';
import { fetchLastFmRecommendations } from '../services/lastFmService';
import { getImmediateOfficialCover } from '../services/artworkService';

interface BrowseViewProps {
  tracks: Track[];
  currentTrack: Track;
  isPlaying: boolean;
  onPlayTrack: (track: Track) => void;
  favorites: string[];
  onToggleFavorite: (trackId: string) => void;
  onAddToQueue: (track: Track) => void;
  playlists: Playlist[];
  onSelectPlaylist: (id: string) => void;
  playbackSpeed: number;
  onChangeSpeed: (spd: number) => void;
  onSeekRelative: (offset: number) => void;
  onOpenSleepTimer: () => void;
  onOpenDrivingMode: () => void;
  onPlayFullYouTube?: (track: Track) => void;
  listeningHistory?: Track[];
  onOpenEqualizer?: () => void;
  onOpenSaveModal?: (track: Track) => void;
}

const BLOCKED_ARTISTS_KEY = 'jmmusic_blocked_artists';
const FAVORITE_ARTISTS_KEY = 'jmmusic_favorite_artists';

export const BrowseView: React.FC<BrowseViewProps> = ({
  tracks,
  currentTrack,
  isPlaying,
  onPlayTrack,
  favorites,
  onToggleFavorite,
  onAddToQueue,
  playlists,
  onSelectPlaylist,
  playbackSpeed,
  onChangeSpeed,
  onSeekRelative,
  onOpenSleepTimer,
  onOpenDrivingMode,
  listeningHistory = [],
  onOpenEqualizer,
  onOpenSaveModal
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState<SearchFilterType>('all');
  const [isSearchingApi, setIsSearchingApi] = useState(false);
  const [apiSearchResults, setApiSearchResults] = useState<Track[]>([]);
  const [apiAlbumResults, setApiAlbumResults] = useState<AlbumItem[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<AlbumItem | null>(null);
  const [albumTracks, setAlbumTracks] = useState<Track[]>([]);
  const [isLoadingAlbumTracks, setIsLoadingAlbumTracks] = useState(false);
  const [offlineSavedIds, setOfflineSavedIds] = useState<string[]>([]);
  const [savedSuccessId, setSavedSuccessId] = useState<string | null>(null);

  // Vibe & Flow Filter Mode
  const [activeVibe, setActiveVibe] = useState<'all' | 'perreo' | 'trap_gym' | 'noche' | 'rock' | 'chill'>('all');

  // Selected Favorite Artists (Custom taste profile)
  const [selectedArtists, setSelectedArtists] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(FAVORITE_ARTISTS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  // Blocked Artists (Blacklist)
  const [blockedArtists, setBlockedArtists] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(BLOCKED_ARTISTS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });
  const [isBlockedModalOpen, setIsBlockedModalOpen] = useState(false);

  // Quick Bass Boost state (0 = Off, 1 = +6dB Punch, 2 = +12dB Sub-Mega)
  const [bassBoostLevel, setBassBoostLevel] = useState<number>(0);

  // DJ FX Mode (normal, slowed, nightcore)
  const [djFxMode, setDjFxMode] = useState<'normal' | 'slowed' | 'nightcore'>('normal');

  const [resultsLayout, setResultsLayout] = useState<'cards' | 'list'>('cards');

  // Last.fm Recommendations State
  const [lastFmTracks, setLastFmTracks] = useState<Track[]>([]);
  const [isLoadingLastFm, setIsLoadingLastFm] = useState<boolean>(false);
  const [lastFmSeed, setLastFmSeed] = useState<{ artist: string; title: string }>({ artist: '', title: '' });

  const matchingScrollRef = useRef<HTMLDivElement>(null);
  const hitsScrollRef = useRef<HTMLDivElement>(null);
  const artistsScrollRef = useRef<HTMLDivElement>(null);
  const albumsScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOfflineSavedIds(getOfflineTrackIds());
  }, []);

  // Fetch real Last.fm recommendations based on current track and listening history
  useEffect(() => {
    let isCancelled = false;
    const seedArtist = currentTrack?.artist || (listeningHistory[0]?.artist) || 'The Weeknd';
    const seedTitle = currentTrack?.title || (listeningHistory[0]?.title) || 'Blinding Lights';

    if (!seedArtist) return;

    const loadLastFm = async () => {
      setIsLoadingLastFm(true);
      try {
        const results = await fetchLastFmRecommendations(seedArtist, seedTitle);
        if (!isCancelled && results.length > 0) {
          setLastFmTracks(results);
          setLastFmSeed({ artist: seedArtist, title: seedTitle });
        }
      } catch (err) {
        console.warn('Failed to fetch Last.fm recommendations:', err);
      } finally {
        if (!isCancelled) setIsLoadingLastFm(false);
      }
    };

    loadLastFm();

    return () => {
      isCancelled = true;
    };
  }, [currentTrack?.id, currentTrack?.artist, currentTrack?.title]);

  const handleRefreshLastFm = async () => {
    const seedArtist = currentTrack?.artist || (listeningHistory[0]?.artist) || 'The Weeknd';
    const seedTitle = currentTrack?.title || (listeningHistory[0]?.title) || '';
    setIsLoadingLastFm(true);
    try {
      const results = await fetchLastFmRecommendations(seedArtist, seedTitle);
      if (results.length > 0) {
        setLastFmTracks(results);
        setLastFmSeed({ artist: seedArtist, title: seedTitle });
      }
    } catch (err) {
      console.warn('Failed to refresh Last.fm recommendations:', err);
    } finally {
      setIsLoadingLastFm(false);
    }
  };

  const handleToggleFavoriteArtist = (artistName: string) => {
    setSelectedArtists(prev => {
      const updated = prev.includes(artistName)
        ? prev.filter(a => a !== artistName)
        : [...prev, artistName];
      try {
        localStorage.setItem(FAVORITE_ARTISTS_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleBlockArtist = (artistName: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setBlockedArtists(prev => {
      if (prev.includes(artistName)) return prev;
      const updated = [...prev, artistName];
      try {
        localStorage.setItem(BLOCKED_ARTISTS_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleUnblockArtist = (artistName: string) => {
    setBlockedArtists(prev => {
      const updated = prev.filter(a => a !== artistName);
      try {
        localStorage.setItem(BLOCKED_ARTISTS_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const cycleBassBoost = () => {
    const nextLevel = (bassBoostLevel + 1) % 3;
    setBassBoostLevel(nextLevel);
    audioEngine.setBassBoost(nextLevel > 0, nextLevel === 1 ? 6 : nextLevel === 2 ? 12 : 0);
  };

  const cycleDjFx = () => {
    if (djFxMode === 'normal') {
      setDjFxMode('slowed');
      onChangeSpeed(0.85);
    } else if (djFxMode === 'slowed') {
      setDjFxMode('nightcore');
      onChangeSpeed(1.25);
    } else {
      setDjFxMode('normal');
      onChangeSpeed(1.0);
    }
  };

  const handleSearch = useCallback(async (query: string, filter: SearchFilterType = 'all') => {
    setSearchQuery(query);
    setSearchFilter(filter);
    setSelectedAlbum(null);
    setAlbumTracks([]);
    if (!query.trim()) {
      setApiSearchResults([]);
      setApiAlbumResults([]);
      setIsSearchingApi(false);
      return;
    }

    setIsSearchingApi(true);
    try {
      const { tracks: foundTracks, albums: foundAlbums } = await searchGlobalMusicWithAlbums(query, filter);
      setApiSearchResults(foundTracks);
      setApiAlbumResults(foundAlbums);
    } catch (err) {
      console.warn('Search error:', err);
      setApiSearchResults([]);
      setApiAlbumResults([]);
    } finally {
      setIsSearchingApi(false);
    }
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setApiSearchResults([]);
    setApiAlbumResults([]);
    setSelectedAlbum(null);
    setAlbumTracks([]);
    setIsSearchingApi(false);
  }, []);

  // When clicking an album: fetch all its tracks!
  const handleSelectAlbum = async (alb: AlbumItem) => {
    if (selectedAlbum?.id === alb.id) {
      setSelectedAlbum(null);
      setAlbumTracks([]);
      return;
    }

    setSelectedAlbum(alb);
    setIsLoadingAlbumTracks(true);

    try {
      const trks = await fetchAlbumTracks(alb.name, alb.artist, alb.id);
      setAlbumTracks(trks);
    } catch (err) {
      console.warn('Error loading album tracks:', err);
      const fallback = apiSearchResults.filter(t => t.album.toLowerCase().includes(alb.name.toLowerCase()));
      setAlbumTracks(fallback);
    } finally {
      setIsLoadingAlbumTracks(false);
    }
  };

  const handlePlayEntireAlbum = (tracksToPlay: Track[]) => {
    if (tracksToPlay.length > 0) {
      onPlayTrack(tracksToPlay[0]);
      tracksToPlay.slice(1).forEach(t => onAddToQueue(t));
    }
  };

  const handlePlayAllArtist = (artistTracks: Track[]) => {
    if (artistTracks.length > 0) {
      onPlayTrack(artistTracks[0]);
      artistTracks.slice(1).forEach(t => onAddToQueue(t));
    }
  };

  const handleShuffleArtist = (artistTracks: Track[]) => {
    if (artistTracks.length > 0) {
      const shuffled = [...artistTracks].sort(() => Math.random() - 0.5);
      onPlayTrack(shuffled[0]);
      shuffled.slice(1).forEach(t => onAddToQueue(t));
    }
  };

  const handleSaveAndDownload = async (track: Track, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!track.audioUrl || !/^(https?:|blob:)/i.test(track.audioUrl)) return;

    await saveTrackOffline(track);
    setOfflineSavedIds(prev => [...prev, track.id]);
    setSavedSuccessId(track.id);
    setTimeout(() => setSavedSuccessId(null), 2500);

    const safeFilename = `${track.artist} - ${track.title}`.replace(/[/\\?%*:|"<>]/g, '_').slice(0, 80);
    const a = document.createElement('a');
    a.href = track.audioUrl;
    a.download = `${safeFilename}.mp3`;
    a.rel = 'noopener noreferrer';
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const scrollContainer = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
    if (ref.current) {
      const scrollAmount = direction === 'left' ? -380 : 380;
      ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Filter out any blocked artists across all lists!
  const allowedTracks = useMemo(() => {
    if (blockedArtists.length === 0) return tracks;
    return tracks.filter(t => !blockedArtists.some(b => t.artist.toLowerCase().includes(b.toLowerCase())));
  }, [tracks, blockedArtists]);

  // Identify if the search query matches an artist
  const matchedArtist = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase().trim();
    const foundInFeatured = TOP_FEATURED_ARTISTS.find(
      a => a.name.toLowerCase().includes(q) || q.includes(a.name.toLowerCase())
    );
    if (foundInFeatured) return foundInFeatured;

    if (apiAlbumResults.length > 0) {
      const albArtist = apiAlbumResults[0].artist;
      if (albArtist.toLowerCase().includes(q) || q.includes(albArtist.toLowerCase())) {
        return {
          name: albArtist,
          tag: 'Artista Oficial',
          avatarUrl: apiAlbumResults[0].coverUrl,
          genre: 'Discografía Completa'
        };
      }
    }

    if (apiSearchResults.length > 0) {
      const trkArtist = apiSearchResults[0].artist;
      if (trkArtist.toLowerCase().includes(q) || q.includes(trkArtist.toLowerCase())) {
        return {
          name: trkArtist,
          tag: 'Artista Verificado',
          avatarUrl: apiSearchResults[0].coverUrl,
          genre: apiSearchResults[0].genre || 'Urbano / Hits'
        };
      }
    }

    return null;
  }, [searchQuery, apiAlbumResults, apiSearchResults]);

  // Vibe filtered tracks
  const vibeTracks = useMemo(() => {
    let list = allowedTracks;

    if (selectedArtists.length > 0) {
      const byArtist = list.filter(t =>
        selectedArtists.some(fav => t.artist.toLowerCase().includes(fav.toLowerCase()))
      );
      if (byArtist.length >= 3) {
        list = byArtist;
      }
    }

    if (activeVibe === 'perreo') {
      return list.filter(t => {
        const g = (t.genre || '').toLowerCase();
        const a = (t.artist || '').toLowerCase();
        return g.includes('reggaeton') || g.includes('urbano') || a.includes('bunny') || a.includes('feid') || a.includes('myke') || a.includes('rauw') || a.includes('quevedo');
      });
    }
    if (activeVibe === 'trap_gym') {
      return list.filter(t => {
        const g = (t.genre || '').toLowerCase();
        const a = (t.artist || '').toLowerCase();
        return g.includes('trap') || g.includes('hip-hop') || a.includes('travis') || a.includes('eladio') || t.title.toLowerCase().includes('monaco') || t.title.toLowerCase().includes('fein');
      });
    }
    if (activeVibe === 'noche') {
      return list.filter(t => {
        const title = t.title.toLowerCase();
        return title.includes('luna') || title.includes('ojitos') || title.includes('blinding') || title.includes('save your') || title.includes('todo de ti');
      });
    }
    if (activeVibe === 'rock') {
      return list.filter(t => {
        const g = (t.genre || '').toLowerCase();
        return g.includes('rock') || g.includes('alternative') || g.includes('pop rock');
      });
    }
    if (activeVibe === 'chill') {
      return list.filter(t => {
        const g = (t.genre || '').toLowerCase();
        return g.includes('lo-fi') || g.includes('chill') || g.includes('acoustic');
      });
    }
    return list;
  }, [allowedTracks, activeVibe, selectedArtists]);

  // Tracks that combine with the currently playing track
  const matchingTracks = useMemo(() => {
    if (!currentTrack) return allowedTracks.slice(0, 8);
    const currGenre = (currentTrack.genre || '').toLowerCase();
    const currArtist = (currentTrack.artist || '').toLowerCase();

    return allowedTracks.filter(t => {
      if (t.id === currentTrack.id) return false;
      const tGenre = (t.genre || '').toLowerCase();
      const tArtist = (t.artist || '').toLowerCase();

      if (tArtist.includes(currArtist) || currArtist.includes(tArtist)) return true;
      if (currGenre.includes('reggaeton') || currGenre.includes('urbano') || currGenre.includes('trap')) {
        return tGenre.includes('reggaeton') || tGenre.includes('urbano') || tGenre.includes('trap') || tGenre.includes('latino');
      }
      if (currGenre.includes('rock') || currGenre.includes('alternative')) {
        return tGenre.includes('rock') || tGenre.includes('alternative');
      }
      if (currGenre.includes('synthwave') || currGenre.includes('pop')) {
        return tGenre.includes('synthwave') || tGenre.includes('r&b') || tGenre.includes('pop');
      }
      return tGenre === currGenre;
    });
  }, [currentTrack, allowedTracks]);

  const finalMatchingList = useMemo(() => {
    // Exclude any blocked artists from Last.fm recommendations
    const cleanLastFm = lastFmTracks.filter(
      t => !blockedArtists.some(b => t.artist.toLowerCase().includes(b.toLowerCase()))
    );

    if (cleanLastFm.length > 0) {
      // Prioritize real Last.fm recommendations based on what's playing
      const filteredMatching = matchingTracks.filter(
        m => !cleanLastFm.some(lf => lf.title.toLowerCase() === m.title.toLowerCase())
      );
      return [...cleanLastFm, ...filteredMatching].slice(0, 16);
    }

    if (matchingTracks.length >= 6) return matchingTracks;
    const additional = allowedTracks.filter(t => t.id !== currentTrack.id && !matchingTracks.some(m => m.id === t.id));
    return [...matchingTracks, ...additional].slice(0, 12);
  }, [lastFmTracks, matchingTracks, allowedTracks, currentTrack, blockedArtists]);

  // Top hit tracks
  const hitTracks = useMemo(() => {
    return [...allowedTracks].sort((a, b) => (b.plays || 0) - (a.plays || 0)).slice(0, 12);
  }, [allowedTracks]);

  const displayedSearchTracks = useMemo(() => {
    if (!searchQuery) return [];
    return apiSearchResults.filter(
      t => !blockedArtists.some(b => t.artist.toLowerCase().includes(b.toLowerCase()))
    );
  }, [apiSearchResults, blockedArtists, searchQuery]);

  return (
    <div className="space-y-8 pb-16">
      {/* Super Search Bar */}
      <SearchBar
        onSearch={handleSearch}
        onClear={handleClearSearch}
        onOpenSleepTimer={onOpenSleepTimer}
        onSeekRelative={onSeekRelative}
        playbackSpeed={playbackSpeed}
        onChangeSpeed={onChangeSpeed}
        isSearching={isSearchingApi}
      />

      {/* TOP PRO SOUND WEAPONS BAR: Bass Boost, DJ FX & 10-Band EQ */}
      <div className="flex items-center justify-between gap-3 flex-wrap bg-slate-900/80 border border-slate-800/80 rounded-2xl p-3 backdrop-blur-md shadow-xl">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Super Bass Boost Button */}
          <button
            onClick={cycleBassBoost}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              bassBoostLevel > 0
                ? 'bg-gradient-to-r from-amber-500 to-rose-600 text-white shadow-lg shadow-rose-600/30 ring-1 ring-white/20'
                : 'bg-slate-800/90 text-slate-300 hover:text-white hover:bg-slate-800 border border-white/5'
            }`}
            title="Aumentador de Sub-Graves 3D"
          >
            <Zap className={`w-3.5 h-3.5 ${bassBoostLevel > 0 ? 'fill-current animate-pulse' : ''}`} />
            <span>
              {bassBoostLevel === 0 ? 'Bass Boost: OFF' : bassBoostLevel === 1 ? 'Bass Boost: +6dB Punch' : 'Bass Boost: +12dB MEGA'}
            </span>
          </button>

          {/* DJ FX Mode Switcher */}
          <button
            onClick={cycleDjFx}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              djFxMode !== 'normal'
                ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-600/30 ring-1 ring-white/20'
                : 'bg-slate-800/90 text-slate-300 hover:text-white hover:bg-slate-800 border border-white/5'
            }`}
            title="Efectos DJ: Slowed + Reverb o Nightcore"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${djFxMode !== 'normal' ? 'animate-spin' : ''}`} />
            <span>
              {djFxMode === 'normal' ? 'Modo DJ: Normal' : djFxMode === 'slowed' ? 'Slowed + Reverb (0.85x)' : 'Nightcore (1.25x)'}
            </span>
          </button>

          {/* 10-Band EQ Launcher */}
          {onOpenEqualizer && (
            <button
              onClick={onOpenEqualizer}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800/90 text-slate-300 hover:text-white hover:bg-slate-800 border border-white/5 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              <span>Ecualizador 10 Bandas</span>
            </button>
          )}
        </div>

        {/* Blocked Artists Manager */}
        <div className="flex items-center gap-2">
          {blockedArtists.length > 0 && (
            <button
              onClick={() => setIsBlockedModalOpen(true)}
              className="px-3 py-1.5 rounded-xl text-xs bg-rose-500/10 border border-rose-500/20 text-rose-300 hover:bg-rose-500/20 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Ban className="w-3.5 h-3.5 text-rose-400" />
              <span>{blockedArtists.length} Artistas Ocultos</span>
            </button>
          )}
        </div>
      </div>

      {/* API Searching Loader */}
      {isSearchingApi && (
        <div className="flex items-center justify-center py-6 gap-2 text-indigo-400 text-xs">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Buscando álbumes y canciones en alta fidelidad...</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🔍 SEARCH RESULTS VIEW: ARTISTA -> ÁLBUMES -> TODAS LAS MÚSICAS           */}
      {/* ========================================================================= */}
      {searchQuery && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* 1. ARTIST HEADER (If searching an artist or artist match detected) */}
          {matchedArtist && (
            <div className="relative rounded-3xl overflow-hidden border border-indigo-500/30 p-6 sm:p-8 bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-950 shadow-2xl">
              <div className="flex flex-col sm:flex-row items-center sm:items-center gap-6 relative z-10">
                <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden shrink-0 border-4 border-indigo-500/40 shadow-2xl ring-4 ring-indigo-500/20">
                  <img
                    src={matchedArtist.avatarUrl}
                    alt={matchedArtist.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="space-y-2 text-center sm:text-left flex-1 min-w-0">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{matchedArtist.tag || 'Artista Oficial'}</span>
                  </div>

                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight truncate">
                    {matchedArtist.name}
                  </h1>

                  <p className="text-xs sm:text-sm text-slate-300">
                    {apiAlbumResults.length > 0
                      ? `${apiAlbumResults.length} álbumes oficiales disponibles • ${displayedSearchTracks.length} canciones`
                      : `${displayedSearchTracks.length} canciones encontradas en JMMUSIC Hi-Fi`}
                  </p>

                  <div className="pt-2 flex items-center justify-center sm:justify-start gap-3 flex-wrap">
                    <button
                      onClick={() => handlePlayAllArtist(displayedSearchTracks)}
                      disabled={displayedSearchTracks.length === 0}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-indigo-600/30 active:scale-95 disabled:opacity-50"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>Reproducir Todo el Artista</span>
                    </button>

                    <button
                      onClick={() => handleShuffleArtist(displayedSearchTracks)}
                      disabled={displayedSearchTracks.length === 0}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer border border-white/10 active:scale-95 disabled:opacity-50"
                    >
                      <Shuffle className="w-4 h-4" />
                      <span>Mezclar Artista</span>
                    </button>

                    <button
                      onClick={() => handleToggleFavoriteArtist(matchedArtist.name)}
                      className={`px-3 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        selectedArtists.includes(matchedArtist.name)
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : 'bg-slate-800/80 text-slate-400 hover:text-white border-slate-700'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${selectedArtists.includes(matchedArtist.name) ? 'fill-rose-500 text-rose-500' : ''}`} />
                      <span>{selectedArtists.includes(matchedArtist.name) ? 'Siguiendo' : 'Seguir'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. ÁLBUMES DEL ARTISTA */}
          {apiAlbumResults.length > 0 && (
            <div className="space-y-4 p-5 sm:p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 shadow-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                    <Disc3 className="w-5 h-5 text-indigo-400" />
                    <span>Álbumes de {matchedArtist ? matchedArtist.name : searchQuery} ({apiAlbumResults.length})</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Toca cualquier álbum para ver y escuchar todas sus canciones completas
                  </p>
                </div>

                {selectedAlbum && (
                  <button
                    onClick={() => {
                      setSelectedAlbum(null);
                      setAlbumTracks([]);
                    }}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-bold px-3 py-1.5 rounded-xl bg-indigo-500/10 cursor-pointer flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Quitar filtro de álbum</span>
                  </button>
                )}
              </div>

              {/* Horizontal Album Cards */}
              <div
                ref={albumsScrollRef}
                className="flex gap-4 sm:gap-5 overflow-x-auto pb-3 pt-1 scrollbar-none snap-x"
              >
                {apiAlbumResults.map((alb) => {
                  const isSelected = selectedAlbum?.id === alb.id;

                  return (
                    <div
                      key={alb.id}
                      onClick={() => handleSelectAlbum(alb)}
                      className={`w-40 sm:w-48 shrink-0 snap-start p-3.5 rounded-2xl border transition-all cursor-pointer group ${
                        isSelected
                          ? 'bg-indigo-600/20 border-indigo-500 shadow-2xl ring-2 ring-indigo-500/50 scale-[1.02]'
                          : 'bg-slate-950/80 border-slate-800/80 hover:border-indigo-500/40 hover:bg-slate-900 hover:scale-[1.01]'
                      }`}
                    >
                      <div className="relative aspect-square rounded-xl overflow-hidden shadow-lg mb-2.5 bg-slate-950 border border-white/5">
                        <img
                          src={alb.coverUrl}
                          alt={alb.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg">
                            <Play className="w-4 h-4 fill-current ml-0.5" />
                          </div>
                        </div>
                        {isSelected && (
                          <div className="absolute top-2 right-2 bg-indigo-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-md">
                            Activo
                          </div>
                        )}
                      </div>

                      <h4 className="font-bold text-xs sm:text-sm text-white truncate group-hover:text-indigo-300 transition-colors">
                        {alb.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{alb.artist}</p>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-1.5">
                        <span>{alb.releaseYear || 'Álbum Oficial'}</span>
                        <span>{alb.trackCount ? `${alb.trackCount} pistas` : 'Álbum'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. SPOTLIGHT DEL ÁLBUM SELECCIONADO (Si el usuario hizo clic en un álbum) */}
          {selectedAlbum && (
            <div className="p-5 sm:p-7 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/40 shadow-2xl space-y-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                <img
                  src={selectedAlbum.coverUrl}
                  alt={selectedAlbum.name}
                  className="w-40 h-40 sm:w-48 sm:h-48 rounded-2xl object-cover shadow-2xl border-2 border-white/10 shrink-0"
                />

                <div className="space-y-2 text-center sm:text-left flex-1 min-w-0">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
                    <Disc3 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Álbum Seleccionado</span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {selectedAlbum.name}
                  </h2>

                  <p className="text-sm font-semibold text-indigo-300">{selectedAlbum.artist}</p>
                  <p className="text-xs text-slate-400">
                    {selectedAlbum.releaseYear ? `Año ${selectedAlbum.releaseYear} • ` : ''}
                    {albumTracks.length > 0 ? `${albumTracks.length} canciones cargadas` : 'Cargando pistas...'}
                  </p>

                  <div className="pt-2 flex items-center justify-center sm:justify-start gap-3 flex-wrap">
                    <button
                      onClick={() => handlePlayEntireAlbum(albumTracks)}
                      disabled={albumTracks.length === 0}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-indigo-600/30 active:scale-95 disabled:opacity-50"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>Reproducir Álbum Completo</span>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedAlbum(null);
                        setAlbumTracks([]);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer border border-slate-700"
                    >
                      Ver Todas las Músicas
                    </button>
                  </div>
                </div>
              </div>

              {/* Lista de canciones del Álbum */}
              {isLoadingAlbumTracks ? (
                <div className="flex items-center justify-center py-8 gap-2 text-indigo-400 text-xs">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Cargando canciones completas del álbum...</span>
                </div>
              ) : albumTracks.length > 0 ? (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 pb-1 border-b border-slate-800">
                    Canciones del Álbum ({albumTracks.length})
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {albumTracks.map((track, idx) => (
                      <BigCardItem
                        key={`${track.id}-${idx}`}
                        track={track}
                        isCurrent={currentTrack.id === track.id}
                        isCurrentPlaying={currentTrack.id === track.id && isPlaying}
                        isFav={favorites.includes(track.id)}
                        onPlay={() => onPlayTrack(track)}
                        onToggleFav={() => onToggleFavorite(track.id)}
                        onQueue={() => onAddToQueue(track)}
                        onSave={(e) => handleSaveAndDownload(track, e)}
                        isOffline={offlineSavedIds.includes(track.id)}
                        isJustSaved={savedSuccessId === track.id}
                        onBlockArtist={() => handleBlockArtist(track.artist)}
                      />
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* 4. SECCIÓN: TODAS LAS MÚSICAS */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  <span>
                    {matchedArtist
                      ? `Todas las Músicas de ${matchedArtist.name}`
                      : `Todas las Canciones de "${searchQuery}"`}
                  </span>
                  <span className="text-xs font-mono text-slate-400 font-normal">
                    ({displayedSearchTracks.length})
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Fotos grandes y audio en calidad de estudio • Toca cualquier carátula para reproducir
                </p>
              </div>

              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl p-1">
                <button
                  onClick={() => setResultsLayout('cards')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    resultsLayout === 'cards' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Carátulas Grandes"
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setResultsLayout('list')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    resultsLayout === 'list' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Lista"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            {displayedSearchTracks.length === 0 && !isSearchingApi ? (
              <div className="py-16 text-center text-slate-400 space-y-3 bg-slate-900/30 border border-slate-800/60 rounded-3xl p-8">
                <p className="text-base font-semibold text-slate-300">
                  No se encontraron canciones para &ldquo;{searchQuery}&rdquo;
                </p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Prueba buscando por nombre de tu artista favorito (Bad Bunny, Feid, Myke Towers, Rauw Alejandro, Quevedo).
                </p>
              </div>
            ) : resultsLayout === 'cards' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                {displayedSearchTracks.map((track, idx) => (
                  <BigCardItem
                    key={`${track.id}-${idx}`}
                    track={track}
                    isCurrent={currentTrack.id === track.id}
                    isCurrentPlaying={currentTrack.id === track.id && isPlaying}
                    isFav={favorites.includes(track.id)}
                    onPlay={() => onPlayTrack(track)}
                    onToggleFav={() => onToggleFavorite(track.id)}
                    onQueue={() => onAddToQueue(track)}
                    onSave={(e) => handleSaveAndDownload(track, e)}
                    isOffline={offlineSavedIds.includes(track.id)}
                    isJustSaved={savedSuccessId === track.id}
                    onBlockArtist={() => handleBlockArtist(track.artist)}
                  />
                ))}
              </div>
            ) : (
              <div className="border border-slate-800/80 rounded-2xl overflow-hidden bg-slate-900/40 divide-y divide-slate-800/40">
                {displayedSearchTracks.map((track, idx) => (
                  <div
                    key={`${track.id}-${idx}`}
                    onClick={() => onPlayTrack(track)}
                    className={`flex items-center justify-between p-3.5 sm:p-4 transition-colors group cursor-pointer ${
                      currentTrack.id === track.id ? 'bg-indigo-600/15 border-l-4 border-indigo-500' : 'hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <img
                        src={getImmediateOfficialCover(track.title, track.artist, track.coverUrl, track.id)}
                        alt={track.title}
                        className="w-12 h-12 rounded-xl object-cover shrink-0 border border-white/10 shadow-md"
                      />
                      <div className="min-w-0">
                        <p className={`font-bold text-sm truncate ${currentTrack.id === track.id ? 'text-indigo-400' : 'text-white'}`}>
                          {track.title}
                        </p>
                        <p className="text-xs text-slate-400 truncate">{track.artist} • {track.album}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(track.id);
                        }}
                        className={`p-2 rounded-lg cursor-pointer ${favorites.includes(track.id) ? 'text-rose-400' : 'text-slate-500 hover:text-white'}`}
                      >
                        <Heart className={`w-4 h-4 ${favorites.includes(track.id) ? 'fill-rose-400' : ''}`} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToQueue(track);
                        }}
                        className="p-2 rounded-lg text-slate-500 hover:text-white cursor-pointer"
                        title="Añadir a la cola"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🏠 INITIAL HOME / EXPLORE VIEW (WHEN SEARCH BAR IS EMPTY)                 */}
      {/* ========================================================================= */}
      {!searchQuery && (
        <>
          {/* 1. ARTISTAS MÁS ESCUCHADOS (Clic para ver álbumes y canciones completas) */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                  <User className="w-5 h-5 text-indigo-400" />
                  <span>Artistas Destacados</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Toca a cualquier artista para abrir sus álbumes y todas sus músicas al instante
                </p>
              </div>

              {selectedArtists.length > 0 && (
                <button
                  onClick={() => {
                    setSelectedArtists([]);
                    localStorage.removeItem(FAVORITE_ARTISTS_KEY);
                  }}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
                >
                  Limpiar filtro ({selectedArtists.length})
                </button>
              )}
            </div>

            {/* Horizontal slider of artist circles */}
            <div
              ref={artistsScrollRef}
              className="flex items-center gap-4 sm:gap-5 overflow-x-auto pb-2 pt-1 scrollbar-none"
            >
              {TOP_FEATURED_ARTISTS.map((art) => {
                const isSelected = selectedArtists.includes(art.name);

                return (
                  <div
                    key={art.name}
                    className="flex flex-col items-center gap-2 shrink-0 group transition-transform duration-200"
                  >
                    <button
                      onClick={() => handleSearch(art.name, 'all')}
                      className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 transition-all shadow-lg cursor-pointer hover:scale-105 active:scale-95 ${
                        isSelected
                          ? 'border-indigo-400 ring-4 ring-indigo-500/40'
                          : 'border-slate-700/80 group-hover:border-indigo-500'
                      }`}
                      title={`Ver álbumes y todas las músicas de ${art.name}`}
                    >
                      <img src={art.avatarUrl} alt={art.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Play className="w-5 h-5 text-white fill-white drop-shadow" />
                      </div>
                    </button>
                    <div className="flex items-center gap-1">
                      <span
                        onClick={() => handleSearch(art.name, 'all')}
                        className="text-xs font-bold max-w-[80px] sm:max-w-[90px] truncate text-center text-slate-300 group-hover:text-white cursor-pointer hover:underline"
                      >
                        {art.name}
                      </span>
                      <button
                        onClick={() => handleToggleFavoriteArtist(art.name)}
                        className="text-slate-500 hover:text-rose-400 p-0.5 cursor-pointer"
                        title="Favorito"
                      >
                        <Heart className={`w-3 h-3 ${isSelected ? 'fill-rose-500 text-rose-500' : ''}`} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 2. VIBES & FLOW SELECTOR (Perreo, Trap & Gym, Noche, Rock, Chill) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'all', label: '🔥 Todo el Flow', icon: Flame },
              { id: 'perreo', label: '⚡ Perreo & Reggaeton', icon: Zap },
              { id: 'trap_gym', label: '🥊 Trap & Gym Hype', icon: Dumbbell },
              { id: 'noche', label: '🌙 Noche & Melancolía', icon: Moon },
              { id: 'rock', label: '🎸 Rock Leyendas', icon: Volume2 },
              { id: 'chill', label: '☕ Chill & Relax', icon: Sparkles }
            ].map((v) => {
              const Icon = v.icon;
              const isActive = activeVibe === v.id;

              return (
                <button
                  key={v.id}
                  onClick={() => setActiveVibe(v.id as any)}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{v.label}</span>
                </button>
              );
            })}
          </div>

          {/* 3. HERO SPOTLIGHT */}
          <div className="relative rounded-3xl overflow-hidden border border-white/10 p-6 sm:p-10 shadow-2xl bg-gradient-to-br from-slate-900 via-indigo-950/30 to-slate-950">
            <div
              className="absolute -right-10 -bottom-10 w-96 h-96 rounded-full blur-3xl opacity-35 pointer-events-none transition-colors duration-1000"
              style={{ backgroundColor: currentTrack.accentColor || '#6366f1' }}
            />

            <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 sm:gap-8">
              {/* Big Cover Image in Hero */}
              <div
                onClick={() => onPlayTrack(currentTrack)}
                className="relative w-48 h-48 sm:w-60 sm:h-60 rounded-3xl overflow-hidden shadow-2xl border-2 border-white/15 shrink-0 group cursor-pointer transition-transform duration-300 hover:scale-[1.03]"
              >
                <img
                  src={currentTrack.coverUrl}
                  alt={currentTrack.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-indigo-600/90 hover:bg-indigo-500 flex items-center justify-center text-white shadow-xl transform group-hover:scale-110 transition-all">
                    {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                  </div>
                </div>
                {isPlaying && (
                  <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-[11px] text-indigo-300 font-semibold border border-indigo-500/30">
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                    Sonando Ahora
                  </div>
                )}
              </div>

              {/* Track Metadata and Quick Play */}
              <div className="flex-1 space-y-3 text-center md:text-left min-w-0">
                <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
                    {currentTrack.genre || 'Hit JMMUSIC'}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Audio Masterizado Hi-Fi
                  </span>
                </div>

                <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight truncate">
                  {currentTrack.title}
                </h1>
                <p className="text-base sm:text-xl font-medium text-slate-300">
                  {currentTrack.artist} <span className="text-slate-500 font-normal">• {currentTrack.album}</span>
                </p>

                <div className="pt-2 flex items-center justify-center md:justify-start gap-3 flex-wrap">
                  <button
                    onClick={() => onPlayTrack(currentTrack)}
                    className="px-6 py-3 rounded-2xl bg-white hover:bg-slate-200 text-slate-950 font-black text-sm flex items-center gap-2.5 shadow-xl transition-all cursor-pointer transform active:scale-95"
                  >
                    {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                    <span>{isPlaying ? 'Pausar Reproducción' : 'Reproducir Ahora'}</span>
                  </button>

                  <button
                    onClick={() => onToggleFavorite(currentTrack.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                      favorites.includes(currentTrack.id)
                        ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${favorites.includes(currentTrack.id) ? 'fill-rose-500' : ''}`} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 4. SECTION: PARA TI (DISCREET & PERSONALIZED) */}
          <section className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  <span>Para ti</span>
                  {isLoadingLastFm && (
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                  )}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {lastFmSeed.artist
                    ? `Basado en "${lastFmSeed.title || currentTrack.title}" de ${lastFmSeed.artist}`
                    : `Inspirado en tus reproducciones`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleRefreshLastFm}
                  disabled={isLoadingLastFm}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                  title="Actualizar selección"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLastFm ? 'animate-spin text-indigo-400' : ''}`} />
                  <span className="hidden sm:inline">Actualizar</span>
                </button>
                <div className="hidden sm:flex items-center gap-1">
                  <button
                    onClick={() => scrollContainer(matchingScrollRef, 'left')}
                    className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Anterior"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => scrollContainer(matchingScrollRef, 'right')}
                    className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Siguiente"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Slider de canciones que combinan con carátulas GRANDES */}
            <div
              ref={matchingScrollRef}
              className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 pt-1 scrollbar-none snap-x"
            >
              {finalMatchingList.map((track, idx) => (
                <div key={`${track.id}-${idx}`} className="w-44 sm:w-56 shrink-0 snap-start">
                  <BigCardItem
                    track={track}
                    isCurrent={currentTrack.id === track.id}
                    isCurrentPlaying={currentTrack.id === track.id && isPlaying}
                    isFav={favorites.includes(track.id)}
                    onPlay={() => onPlayTrack(track)}
                    onToggleFav={() => onToggleFavorite(track.id)}
                    onQueue={() => onAddToQueue(track)}
                    onSave={(e) => handleSaveAndDownload(track, e)}
                    isOffline={offlineSavedIds.includes(track.id)}
                    isJustSaved={savedSuccessId === track.id}
                    onBlockArtist={() => handleBlockArtist(track.artist)}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* 5. SECTION: GRANDES ÉXITOS QUE TE VAN A GUSTAR */}
          <section className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-0.5">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>Tendencias Mundiales</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Grandes Éxitos Que Te Van A Gustar
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Los temas más escuchados del momento
                </p>
              </div>

              <div className="hidden sm:flex items-center gap-2">
                <button
                  onClick={() => scrollContainer(hitsScrollRef, 'left')}
                  className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => scrollContainer(hitsScrollRef, 'right')}
                  className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div
              ref={hitsScrollRef}
              className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 pt-1 scrollbar-none snap-x"
            >
              {hitTracks.map((track, idx) => (
                <div key={`${track.id}-${idx}`} className="w-44 sm:w-56 shrink-0 snap-start">
                  <BigCardItem
                    track={track}
                    isCurrent={currentTrack.id === track.id}
                    isCurrentPlaying={currentTrack.id === track.id && isPlaying}
                    isFav={favorites.includes(track.id)}
                    onPlay={() => onPlayTrack(track)}
                    onToggleFav={() => onToggleFavorite(track.id)}
                    onQueue={() => onAddToQueue(track)}
                    onSave={(e) => handleSaveAndDownload(track, e)}
                    isOffline={offlineSavedIds.includes(track.id)}
                    isJustSaved={savedSuccessId === track.id}
                    onBlockArtist={() => handleBlockArtist(track.artist)}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* 6. SECTION: TODAS LAS CANCIONES CON CARÁTULAS GRANDES */}
          <section className="space-y-6 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
                  <Grid className="w-5 h-5 text-indigo-400" />
                  <span>Catálogo Visual ({vibeTracks.length})</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Carátulas gigantes en alta resolución adaptadas a tu gusto
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
              {vibeTracks.map((track, idx) => (
                <BigCardItem
                  key={`${track.id}-${idx}`}
                  track={track}
                  isCurrent={currentTrack.id === track.id}
                  isCurrentPlaying={currentTrack.id === track.id && isPlaying}
                  isFav={favorites.includes(track.id)}
                  onPlay={() => onPlayTrack(track)}
                  onToggleFav={() => onToggleFavorite(track.id)}
                  onQueue={() => onAddToQueue(track)}
                  onSave={(e) => handleSaveAndDownload(track, e)}
                  isOffline={offlineSavedIds.includes(track.id)}
                  isJustSaved={savedSuccessId === track.id}
                  onBlockArtist={() => handleBlockArtist(track.artist)}
                />
              ))}
            </div>
          </section>

          {/* 7. PLAYLISTS Y MEZCLAS */}
          <section className="space-y-4 pt-4">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Playlists y Mezclas
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {playlists.map((pl) => (
                <div
                  key={pl.id}
                  onClick={() => onSelectPlaylist(pl.id)}
                  className="group rounded-3xl bg-slate-900/60 border border-slate-800/80 p-4 hover:border-indigo-500/40 hover:bg-slate-900 transition-all cursor-pointer shadow-xl flex flex-col gap-3"
                >
                  <div className="w-full aspect-square rounded-2xl overflow-hidden relative shadow-md">
                    <img
                      src={pl.coverUrl}
                      alt={pl.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors" />
                    <div className="absolute bottom-2.5 right-2.5 w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm text-white group-hover:text-indigo-300 transition-colors truncate">
                      {pl.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {pl.description}
                    </p>
                    <span className="inline-block mt-2 text-[11px] font-mono text-slate-500">
                      {pl.trackIds.length} canciones
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {/* MODAL: GESTIONAR ARTISTAS OCULTOS / BLOQUEADOS */}
      {isBlockedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Ban className="w-4 h-4 text-rose-400" />
                <span>Artistas Ocultos ({blockedArtists.length})</span>
              </h3>
              <button
                onClick={() => setIsBlockedModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm cursor-pointer"
              >
                Cerrar
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Las canciones de estos artistas no aparecerán en tu pantalla de inicio, carruseles ni recomendaciones.
            </p>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {blockedArtists.map((artist) => (
                <div
                  key={artist}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-white/5"
                >
                  <span className="text-sm font-semibold text-slate-200">{artist}</span>
                  <button
                    onClick={() => handleUnblockArtist(artist)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-bold px-2 py-1 rounded-lg bg-indigo-500/10 cursor-pointer"
                  >
                    Desbloquear
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => setIsBlockedModalOpen(false)}
              className="w-full py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Listo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Big Photo Track Card Component with High-Fidelity Artwork, Soundwave, and Quick Actions
 */
interface BigCardItemProps {
  track: Track;
  isCurrent: boolean;
  isCurrentPlaying: boolean;
  isFav: boolean;
  onPlay: () => void;
  onToggleFav: () => void;
  onQueue: () => void;
  onSave?: (e: React.MouseEvent) => void;
  isOffline?: boolean;
  isJustSaved?: boolean;
  onBlockArtist?: () => void;
}

const BigCardItem: React.FC<BigCardItemProps> = ({
  track,
  isCurrent,
  isCurrentPlaying,
  isFav,
  onPlay,
  onToggleFav,
  onQueue,
  onSave,
  isOffline,
  isJustSaved,
  onBlockArtist
}) => {
  return (
    <div
      onClick={onPlay}
      className={`group relative rounded-2xl sm:rounded-3xl p-3 sm:p-3.5 transition-all duration-300 cursor-pointer flex flex-col border ${
        isCurrent
          ? 'bg-indigo-600/15 border-indigo-500/50 shadow-xl shadow-indigo-600/15'
          : 'bg-slate-900/60 border-slate-800/80 hover:border-indigo-500/30 hover:bg-slate-900 hover:shadow-2xl hover:shadow-black/60'
      }`}
    >
      {/* BIG COVER PHOTO CONTAINER */}
      <div className="relative w-full aspect-square rounded-xl sm:rounded-2xl overflow-hidden shadow-lg border border-white/10 mb-3 bg-slate-950">
        <img
          src={getImmediateOfficialCover(track.title, track.artist, track.coverUrl, track.id)}
          alt={track.title}
          loading="lazy"
          onError={(e) => {
            const img = e.currentTarget;
            if (track.id && track.id.startsWith('yt-')) {
              const ytId = track.id.replace('yt-', '');
              img.src = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
            } else {
              img.src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80';
            }
          }}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Hover Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Big Floating Play Button */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-white shadow-2xl transition-all duration-300 ${
              isCurrent
                ? 'bg-indigo-600 scale-100 opacity-100 shadow-indigo-600/50'
                : 'bg-indigo-600/90 group-hover:scale-100 opacity-0 group-hover:opacity-100 scale-75'
            }`}
          >
            {isCurrentPlaying ? (
              <Pause className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
            ) : (
              <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current ml-0.5" />
            )}
          </div>
        </div>

        {/* Currently Playing Soundwave Indicator Overlay */}
        {isCurrentPlaying && (
          <div className="absolute top-2.5 right-2.5 flex items-center gap-0.5 px-2 py-1 rounded-full bg-black/75 backdrop-blur-md border border-indigo-500/40 text-[10px] text-indigo-300 font-bold">
            <span className="w-1 h-3 bg-indigo-400 rounded-full animate-bounce" />
            <span className="w-1 h-4 bg-indigo-400 rounded-full animate-bounce [animation-delay:150ms]" />
            <span className="w-1 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:300ms]" />
          </div>
        )}

        {/* Action icons on cover top left */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFav();
            }}
            className={`p-1.5 rounded-full bg-black/60 backdrop-blur-md transition-colors cursor-pointer ${
              isFav ? 'text-rose-400' : 'text-slate-300 hover:text-white'
            }`}
            title="Favorito"
          >
            <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-rose-400' : ''}`} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQueue();
            }}
            className="p-1.5 rounded-full bg-black/60 backdrop-blur-md text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Añadir a la cola"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Offline Saved / Download Indicator on top right */}
        {isOffline && (
          <div className="absolute top-2.5 right-2.5 p-1 rounded-full bg-emerald-500/90 text-slate-950 shadow-md">
            <Check className="w-3 h-3 stroke-[3]" />
          </div>
        )}
      </div>

      {/* TRACK INFORMATION */}
      <div className="space-y-1 min-w-0 flex-1 flex flex-col justify-between">
        <div>
          <h3
            className={`font-bold text-sm sm:text-base leading-snug truncate transition-colors ${
              isCurrent ? 'text-indigo-400' : 'text-white group-hover:text-indigo-300'
            }`}
          >
            {track.title}
          </h3>
          <p className="text-xs text-slate-400 truncate mt-0.5">{track.artist}</p>
        </div>

        <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span className="truncate max-w-[65%]">{track.album || 'Hit'}</span>
          <span>{Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}</span>
        </div>

        {/* Quick action footer */}
        <div className="pt-2 flex items-center justify-between border-t border-white/5 mt-1">
          {onSave && (
            <button
              onClick={onSave}
              className={`text-[11px] flex items-center gap-1 font-semibold transition-colors cursor-pointer ${
                isOffline || isJustSaved
                  ? 'text-emerald-400'
                  : 'text-slate-400 hover:text-indigo-300'
              }`}
              title="Guardar para escuchar sin internet"
            >
              {isJustSaved ? (
                <>
                  <Check className="w-3 h-3" />
                  <span>Guardado</span>
                </>
              ) : isOffline ? (
                <>
                  <HardDrive className="w-3 h-3 text-emerald-400" />
                  <span>Offline</span>
                </>
              ) : (
                <>
                  <Download className="w-3 h-3" />
                  <span>Offline</span>
                </>
              )}
            </button>
          )}

          {onBlockArtist && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onBlockArtist();
              }}
              className="text-[10px] text-slate-500 hover:text-rose-400 transition-colors cursor-pointer opacity-0 group-hover:opacity-100 ml-auto"
              title={`No sugerir más canciones de ${track.artist}`}
            >
              Ocultar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
