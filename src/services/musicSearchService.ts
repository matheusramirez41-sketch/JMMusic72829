import { Track } from '../types/music';
import { TRACKS } from '../data/mockTracks';
import { findKnownYouTubeVideoId } from './youtubeService';

export interface SearchResult {
  trackId: number;
  trackName: string;
  artistName: string;
  collectionName: string;
  previewUrl: string;
  artworkUrl100: string;
  trackTimeMillis: number;
  primaryGenreName: string;
}

export interface AlbumItem {
  id: string;
  name: string;
  artist: string;
  coverUrl: string;
  releaseYear?: string;
  trackCount?: number;
}

export interface SearchWithAlbumsResult {
  tracks: Track[];
  albums: AlbumItem[];
}

/**
 * Searches real music catalog worldwide, returning both tracks and artist albums.
 */
export async function searchGlobalMusicWithAlbums(
  query: string,
  filterType: 'all' | 'songs' | 'artists' | 'albums' = 'all'
): Promise<SearchWithAlbumsResult> {
  const cleanQ = query.trim().toLowerCase();
  if (!cleanQ) return { tracks: [], albums: [] };

  // If query is a YouTube / YouTube Music URL, resolve it directly
  const isDirectUrl = query.includes('http://') || query.includes('https://') || query.includes('youtu.be') || query.includes('youtube.com');
  if (isDirectUrl) {
    try {
      const res = await fetch(`/api/resolve-link?url=${encodeURIComponent(query.trim())}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.tracks) && data.tracks.length > 0) {
          return {
            tracks: data.tracks,
            albums: []
          };
        }
      }
    } catch (err) {
      console.warn('Direct URL resolution notice:', err);
    }
  }

  // 1. Search local curated tracks
  const catalogMatches = TRACKS.filter(t => {
    const titleMatch = t.title.toLowerCase().includes(cleanQ);
    const artistMatch = t.artist.toLowerCase().includes(cleanQ);
    const albumMatch = t.album.toLowerCase().includes(cleanQ);
    const genreMatch = t.genre.toLowerCase().includes(cleanQ);

    if (filterType === 'songs') return titleMatch;
    if (filterType === 'artists') return artistMatch;
    if (filterType === 'albums') return albumMatch;
    return titleMatch || artistMatch || albumMatch || genreMatch;
  });

  // Extract local albums matching the query
  const localAlbumsMap = new Map<string, AlbumItem>();
  TRACKS.forEach(t => {
    if (
      t.artist.toLowerCase().includes(cleanQ) ||
      t.album.toLowerCase().includes(cleanQ) ||
      cleanQ.includes(t.artist.toLowerCase())
    ) {
      const key = `${t.album.toLowerCase()}-${t.artist.toLowerCase()}`;
      if (!localAlbumsMap.has(key)) {
        localAlbumsMap.set(key, {
          id: `local-alb-${key.replace(/\s+/g, '-')}`,
          name: t.album,
          artist: t.artist,
          coverUrl: t.coverUrl,
          releaseYear: '2023',
          trackCount: TRACKS.filter(sub => sub.album === t.album).length
        });
      }
    }
  });

  let entity = 'song';
  if (filterType === 'artists') entity = 'musicArtist';
  if (filterType === 'albums') entity = 'album';

  try {
    // Concurrent fetch: video tracks + iTunes songs + iTunes albums
    const [ytRes, itunesSongsRes, itunesAlbumsRes] = await Promise.allSettled([
      fetch(`/api/search-video?q=${encodeURIComponent(query.trim())}`),
      fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query.trim())}&entity=${entity}&limit=30`),
      fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query.trim())}&entity=album&limit=12`)
    ]);

    const youtubeFullTracks: Track[] = [];
    if (ytRes.status === 'fulfilled' && ytRes.value.ok) {
      try {
        const ytData = await ytRes.value.json();
        if (ytData.success && Array.isArray(ytData.results)) {
          const accents = ['#6366f1', '#06b6d4', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6', '#a855f7'];
          const seenYtVideoIds = new Set<string>();
          ytData.results.forEach((item: any, idx: number) => {
            if (item.id && item.id.length === 11 && !seenYtVideoIds.has(item.id)) {
              seenYtVideoIds.add(item.id);
              youtubeFullTracks.push({
                id: `yt-${item.id}`,
                title: item.title,
                artist: item.artist || 'Artista',
                album: 'Sencillo Oficial',
                duration: item.duration || 210,
                audioUrl: '',
                coverUrl: item.thumbnail || `https://img.youtube.com/vi/${item.id}/hqdefault.jpg`,
                accentColor: accents[idx % accents.length],
                genre: 'Hit Audio',
                plays: Math.floor(Math.random() * 5000000) + 500000,
                lyrics: []
              });
            }
          });
        }
      } catch (err) {
        console.warn('Error parsing YouTube search results:', err);
      }
    }

    let onlineTracks: Track[] = [];
    if (itunesSongsRes.status === 'fulfilled' && itunesSongsRes.value.ok) {
      try {
        const itunesData = await itunesSongsRes.value.json();
        if (itunesData.results && Array.isArray(itunesData.results)) {
          onlineTracks = itunesData.results
            .filter((item: SearchResult) => Boolean(item.previewUrl && item.trackName))
            .map((item: SearchResult, idx: number) => {
              const hiResCover = item.artworkUrl100
                ? item.artworkUrl100.replace('100x100bb', '600x600bb')
                : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80';
              const accents = ['#6366f1', '#06b6d4', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6'];
              const accentColor = accents[idx % accents.length];
              const knownVideoId = findKnownYouTubeVideoId(item.trackName, item.artistName);
              const trackId = knownVideoId ? `yt-${knownVideoId}` : `online-${item.trackId || Date.now() + idx}`;

              return {
                id: trackId,
                title: item.trackName,
                artist: item.artistName || 'Artista Desconocido',
                album: item.collectionName || 'Sencillo',
                duration: Math.round((item.trackTimeMillis || 180000) / 1000),
                audioUrl: item.previewUrl,
                coverUrl: hiResCover,
                accentColor,
                genre: item.primaryGenreName || 'Pop / Rock / Urban',
                plays: Math.floor(Math.random() * 2000000) + 150000,
                lyrics: []
              };
            });
        }
      } catch {}
    }

    // Process Albums from iTunes
    const fetchedAlbums: AlbumItem[] = [];
    if (itunesAlbumsRes.status === 'fulfilled' && itunesAlbumsRes.value.ok) {
      try {
        const albData = await itunesAlbumsRes.value.json();
        if (albData.results && Array.isArray(albData.results)) {
          albData.results.forEach((alb: any) => {
            if (alb.collectionName) {
              const cover = alb.artworkUrl100 ? alb.artworkUrl100.replace('100x100bb', '600x600bb') : '';
              fetchedAlbums.push({
                id: `alb-${alb.collectionId || Date.now()}`,
                name: alb.collectionName,
                artist: alb.artistName || 'Artista',
                coverUrl: cover,
                releaseYear: alb.releaseDate ? new Date(alb.releaseDate).getFullYear().toString() : undefined,
                trackCount: alb.trackCount || 10
              });
            }
          });
        }
      } catch {}
    }

    // Merge and deduplicate albums
    const albumSeen = new Set<string>();
    const allAlbums: AlbumItem[] = [];
    for (const a of [...localAlbumsMap.values(), ...fetchedAlbums]) {
      const aKey = `${a.name.toLowerCase().trim()}-${a.artist.toLowerCase().trim()}`;
      if (!albumSeen.has(aKey)) {
        albumSeen.add(aKey);
        allAlbums.push(a);
      }
    }

    // Merge and deduplicate tracks
    const seen = new Set<string>();
    const combinedTracks: Track[] = [];

    const scoreTrack = (t: Track): number => {
      const title = t.title.toLowerCase().trim();
      const artist = t.artist.toLowerCase().trim();
      if (title === cleanQ) return 1000;
      if (artist === cleanQ) return 900;
      if (title.startsWith(cleanQ)) return 800;
      if (artist.startsWith(cleanQ)) return 700;
      if (title.includes(cleanQ)) return 500;
      if (artist.includes(cleanQ)) return 400;
      return 100;
    };

    const seenIds = new Set<string>();
    for (const t of [...catalogMatches, ...youtubeFullTracks, ...onlineTracks]) {
      const titleArtistKey = `${t.title.toLowerCase().trim()}-${t.artist.toLowerCase().trim()}`;
      if (!seen.has(titleArtistKey) && !seenIds.has(t.id)) {
        seen.add(titleArtistKey);
        seenIds.add(t.id);
        combinedTracks.push(t);
      }
    }

    combinedTracks.sort((a, b) => scoreTrack(b) - scoreTrack(a));

    return {
      tracks: combinedTracks,
      albums: allAlbums
    };
  } catch (error) {
    console.error('Error in searchGlobalMusicWithAlbums:', error);
    return {
      tracks: catalogMatches,
      albums: [...localAlbumsMap.values()]
    };
  }
}

/**
 * Fetches all tracks that belong to a specific album.
 * Used when a user clicks on an album card in search results.
 */
export async function fetchAlbumTracks(
  albumName: string,
  artistName: string,
  albumId?: string
): Promise<Track[]> {
  const cleanAlbum = albumName.trim().toLowerCase();
  const cleanArtist = artistName.trim().toLowerCase();

  // 1. First find in local TRACKS
  const localTracks = TRACKS.filter(t => {
    const albMatch = t.album.toLowerCase().includes(cleanAlbum) || cleanAlbum.includes(t.album.toLowerCase());
    const artMatch = t.artist.toLowerCase().includes(cleanArtist) || cleanArtist.includes(t.artist.toLowerCase());
    return albMatch || (artMatch && t.album.toLowerCase() === cleanAlbum);
  });

  const collectionNumericId = albumId?.replace('alb-', '');
  let fetchedTracks: Track[] = [];

  try {
    // If we have an iTunes collection ID, use lookup
    if (collectionNumericId && !isNaN(Number(collectionNumericId))) {
      const res = await fetch(`https://itunes.apple.com/lookup?id=${collectionNumericId}&entity=song&limit=50`);
      if (res.ok) {
        const data = await res.json();
        if (data.results && Array.isArray(data.results)) {
          const songs = data.results.filter((item: any) => item.wrapperType === 'track');
          fetchedTracks = songs.map((item: any, idx: number) => {
            const hiResCover = item.artworkUrl100
              ? item.artworkUrl100.replace('100x100bb', '600x600bb')
              : 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80';
            const accents = ['#6366f1', '#06b6d4', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6'];
            const knownId = findKnownYouTubeVideoId(item.trackName, item.artistName);

            return {
              id: knownId ? `yt-${knownId}` : `alb-trk-${item.trackId || Date.now() + idx}`,
              title: item.trackName,
              artist: item.artistName || artistName,
              album: item.collectionName || albumName,
              duration: Math.round((item.trackTimeMillis || 190000) / 1000),
              audioUrl: item.previewUrl || '',
              coverUrl: hiResCover,
              accentColor: accents[idx % accents.length],
              genre: item.primaryGenreName || 'Álbum Track',
              plays: Math.floor(Math.random() * 1500000) + 200000,
              lyrics: [
                { time: 0, text: `Reproduciendo canción: ${item.trackName}` },
                { time: 4, text: `Álbum: ${item.collectionName || albumName}` },
                { time: 10, text: 'Audio masterizado en JMMUSIC Hi-Fi' }
              ]
            };
          });
        }
      }
    }

    // If lookup returned nothing or no numeric ID, fallback to searching artist + album name
    if (fetchedTracks.length === 0) {
      const searchRes = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(artistName + ' ' + albumName)}&entity=song&limit=25`
      );
      if (searchRes.ok) {
        const data = await searchRes.json();
        if (data.results && Array.isArray(data.results)) {
          fetchedTracks = data.results
            .filter((item: any) => item.trackName && item.collectionName?.toLowerCase().includes(cleanAlbum.slice(0, 5)))
            .map((item: any, idx: number) => {
              const hiResCover = item.artworkUrl100
                ? item.artworkUrl100.replace('100x100bb', '600x600bb')
                : 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80';
              const accents = ['#6366f1', '#06b6d4', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6'];
              const knownId = findKnownYouTubeVideoId(item.trackName, item.artistName);

              return {
                id: knownId ? `yt-${knownId}` : `alb-trk-${item.trackId || Date.now() + idx}`,
                title: item.trackName,
                artist: item.artistName || artistName,
                album: item.collectionName || albumName,
                duration: Math.round((item.trackTimeMillis || 190000) / 1000),
                audioUrl: item.previewUrl || '',
                coverUrl: hiResCover,
                accentColor: accents[idx % accents.length],
                genre: item.primaryGenreName || 'Álbum Track',
                plays: Math.floor(Math.random() * 1500000) + 200000,
                lyrics: [
                  { time: 0, text: `Reproduciendo canción: ${item.trackName}` },
                  { time: 4, text: `Álbum: ${item.collectionName || albumName}` },
                  { time: 10, text: 'Audio masterizado en JMMUSIC Hi-Fi' }
                ]
              };
            });
        }
      }
    }
  } catch (err) {
    console.warn('Error fetching album tracks:', err);
  }

  // Combine local and fetched, deduplicating by title
  const seen = new Set<string>();
  const allTracks: Track[] = [];

  for (const t of [...localTracks, ...fetchedTracks]) {
    const key = t.title.toLowerCase().trim();
    if (!seen.has(key)) {
      seen.add(key);
      allTracks.push(t);
    }
  }

  return allTracks;
}

/**
 * Backward-compatible helper that returns Track[]
 */
export async function searchGlobalMusic(
  query: string,
  filterType: 'all' | 'songs' | 'artists' | 'albums' = 'all'
): Promise<Track[]> {
  const result = await searchGlobalMusicWithAlbums(query, filterType);
  return result.tracks;
}
