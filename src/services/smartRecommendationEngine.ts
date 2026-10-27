import { Track } from '../types/music';

export interface RecommendedTrackInfo {
  title: string;
  artist: string;
  coverUrl?: string;
  source: string;
}

/**
 * Normalizes string for fuzzy comparison
 */
function clean(str: string): string {
  return (str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

/**
 * Detects broad musical genre cluster to prevent cross-genre dissonance
 */
export function classifyBroadGenre(artist: string, title: string, declaredGenre?: string): string {
  const text = `${artist} ${title} ${declaredGenre || ''}`.toLowerCase();

  if (/worship|alabanza|adoraci|cristian|catolic|coral|acustic|gospel|iglesia|hakuna|trigo 13|laraland|athenas/.test(text)) {
    return 'worship-acoustic';
  }
  if (/trap|reggaeton|perreo|dembo|urbano|bad bunny|feid|rauw|anuel|mora|ozuna|daddy yankee|eladio|jhayco/.test(text)) {
    return 'latin-urban';
  }
  if (/rock|metal|punk|grunge|indie rock|queen|coldplay|beatles|nirvana|metallica|ac\/dc|artic monkeys|the strokes/.test(text)) {
    return 'rock-alternative';
  }
  if (/hip hop|rap|drill|eminem|kendrick|drake|travis scott|tupac|kanye|canserbero/.test(text)) {
    return 'hip-hop';
  }
  if (/k-pop|kpop|bts|blackpink|stray kids|twice|newjeans/.test(text)) {
    return 'k-pop';
  }
  if (/salsa|bachata|merengue|cumbia|romeo|aventura|mar Anthony|hector lavoe/.test(text)) {
    return 'latin-tropical';
  }
  if (/regional|corrido|banda|ranchera|mariachi|peso pluma|christian nodal|natanael|fuerza regida|carin leon/.test(text)) {
    return 'regional-mexicano';
  }
  if (/lofi|lo-fi|chillhop|relaxing|synthwave|electronic|edm|techno|house|daft punk|avicii|tiesto/.test(text)) {
    return 'electronic-lofi';
  }
  if (/classical|clasica|piano|orchestra|beethoven|mozart|bach|chopin|soundtrack|zimmer|morricone/.test(text)) {
    return 'classical-cinematic';
  }
  return 'general-pop';
}

/**
 * Universal Multi-Tier Smart Recommendation Engine:
 * Generates continuous recommendations for ANY song, ANY artist, and ANY genre worldwide.
 */
export async function fetchSmartNextRecommendations(currentTrack: Track): Promise<RecommendedTrackInfo[]> {
  const currentTitleClean = clean(currentTrack.title);
  const currentArtistClean = clean(currentTrack.artist);
  const currentCluster = classifyBroadGenre(currentTrack.artist, currentTrack.title, currentTrack.genre);

  const collected: RecommendedTrackInfo[] = [];
  const seenKeys = new Set<string>();
  seenKeys.add(`${currentTitleClean}-${currentArtistClean}`);

  const addUnique = (title: string, artist: string, coverUrl?: string, source: string = 'smart') => {
    const key = `${clean(title)}-${clean(artist)}`;
    if (!title || !artist) return;
    if (seenKeys.has(key)) return;

    // Check genre compatibility
    const candCluster = classifyBroadGenre(artist, title);
    if (currentCluster !== 'general-pop' && candCluster !== 'general-pop' && currentCluster !== candCluster) {
      // Discard jarring mismatch (e.g. Never jump from Worship to Trap or Classical to Metal)
      return;
    }

    seenKeys.add(key);
    collected.push({
      title: title.trim(),
      artist: artist.trim(),
      coverUrl,
      source
    });
  };

  // Tier 1: Last.fm Acoustic & Collaborative Filtering (Millions of real user transitions worldwide)
  try {
    const url = `/api/lastfm/recommendations?artist=${encodeURIComponent(currentTrack.artist)}&track=${encodeURIComponent(currentTrack.title)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(3500) });
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.recommendations)) {
        for (const item of data.recommendations) {
          addUnique(item.title, item.artist, item.coverUrl, 'lastfm-acoustic');
        }
      }
    }
  } catch (err) {
    console.warn('Last.fm recommendation fetch notice:', err);
  }

  // Tier 2: Apple Music / iTunes Catalog (Authentic top discography by the exact same artist worldwide)
  try {
    const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(currentTrack.artist)}&entity=song&limit=12`;
    const itunesRes = await fetch(itunesUrl, { signal: AbortSignal.timeout(3500) });
    if (itunesRes.ok) {
      const itunesData = await itunesRes.json();
      if (Array.isArray(itunesData.results)) {
        for (const item of itunesData.results) {
          const tName = item.trackName || item.collectionName;
          const aName = item.artistName || currentTrack.artist;
          const artwork = item.artworkUrl100 ? item.artworkUrl100.replace('100x100bb', '600x600bb') : undefined;
          addUnique(tName, aName, artwork, 'artist-discography');
        }
      }
    }
  } catch (err) {
    console.warn('iTunes discography fetch notice:', err);
  }

  // Tier 3: YouTube Music Related Query (Covers viral, remixes, live performances, and unreleased gems)
  if (collected.length < 5) {
    try {
      const cleanArtistQuery = currentTrack.artist.split('&')[0].split('feat')[0].trim();
      const ytUrl = `/api/search-video?q=${encodeURIComponent(`${cleanArtistQuery} top canciones audio`)}`;
      const ytRes = await fetch(ytUrl, { signal: AbortSignal.timeout(3500) });
      if (ytRes.ok) {
        const ytData = await ytRes.json();
        if (ytData.success && Array.isArray(ytData.results)) {
          for (const item of ytData.results) {
            let t = item.title || '';
            t = t.replace(/\([^)]*?(official|video|audio|lyrics|letra)[^)]*?\)/gi, '').trim();
            addUnique(t, cleanArtistQuery, item.thumbnail, 'youtube-catalog');
          }
        }
      }
    } catch {}
  }

  return collected;
}
