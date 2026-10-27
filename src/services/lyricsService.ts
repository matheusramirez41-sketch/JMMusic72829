import { PRELOADED_SYNCED_LRC } from './curatedLyrics';

const lyricsMemoryCache = new Map<string, { syncedLyrics: SyncedLyricLine[] | null; plainLyrics: string | null; trackTitle: string; artist: string }>();

// Load any cached lyrics from localStorage into memory on startup
try {
  const stored = localStorage.getItem('jmmusic_lyrics_cache');
  if (stored) {
    const parsed = JSON.parse(stored);
    Object.keys(parsed).forEach(k => lyricsMemoryCache.set(k, parsed[k]));
  }
} catch {}

function saveLyricsToCache(key: string, data: { syncedLyrics: SyncedLyricLine[] | null; plainLyrics: string | null; trackTitle: string; artist: string }) {
  lyricsMemoryCache.set(key, data);
  try {
    const obj: Record<string, any> = {};
    let count = 0;
    // Keep up to 60 most recent tracks in localStorage
    lyricsMemoryCache.forEach((v, k) => {
      if (count < 60) {
        obj[k] = v;
        count++;
      }
    });
    localStorage.setItem('jmmusic_lyrics_cache', JSON.stringify(obj));
  } catch {}
}

export interface SyncedLyricLine {
  time: number; // in seconds
  text: string;
}

/**
 * Parses LRC format strings:
 * [00:12.34] Lyric line text
 */
export function parseLrc(lrcText: string): SyncedLyricLine[] {
  if (!lrcText) return [];
  const lines = lrcText.split(/\r?\n/);
  const result: SyncedLyricLine[] = [];
  const timeRegex = /\[(\d{2}):(\d{2})\.?(\d{2,3})?\]/g;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Find all timestamps in the line (handles multi-timestamp lines like [00:12.34][00:15.20] Hello)
    const matches = Array.from(trimmed.matchAll(timeRegex));
    if (matches.length > 0) {
      const pureText = trimmed.replace(timeRegex, '').trim();
      if (!pureText) continue;

      for (const m of matches) {
        const minutes = parseInt(m[1], 10);
        const seconds = parseInt(m[2], 10);
        const ms = m[3] ? parseInt(m[3].padEnd(3, '0').slice(0, 3), 10) : 0;
        const totalSeconds = minutes * 60 + seconds + ms / 1000;

        result.push({
          time: Number(totalSeconds.toFixed(2)),
          text: pureText
        });
      }
    }
  }

  return result.sort((a, b) => a.time - b.time);
}

/**
 * Cleans YouTube/Music metadata noise to maximize hit rate on lyric databases
 */
function normalizeLyricKey(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanSearchQuery(title: string, artist?: string): { cleanTitle: string; cleanArtist: string; primaryArtist: string } {
  let cleanArtist = (artist || '')
    .replace(/\(.*?\)|\[.*?\]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  let cleanTitle = title
    .replace(/\([^)]*?(official|video|audio|remaster|letra|lyrics|4k|hd|en\s+vivo|live|visualizer|videoclip|360|clip)[^)]*?\)/gi, '')
    .replace(/\[[^\]]*?(official|video|audio|remaster|letra|lyrics|4k|hd|en\s+vivo|live|visualizer|videoclip|360|clip)[^\]]*?\]/gi, '')
    .replace(/\b(official\s+video|video\s+oficial|audio\s+oficial|letra|lyrics|visualizer|videoclip|360°?\s*visualizer)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  // If title has "Artist - Song", extract Song
  if (cleanTitle.includes(' - ')) {
    const parts = cleanTitle.split(' - ');
    if (parts.length >= 2) {
      if (!cleanArtist || cleanArtist === 'YouTube' || cleanArtist === 'Music' || cleanArtist.toLowerCase().includes(parts[0].trim().toLowerCase())) {
        cleanArtist = parts[0].trim();
        cleanTitle = parts.slice(1).join(' - ').trim();
      } else {
        cleanTitle = parts[parts.length - 1].trim();
      }
    }
  }

  // If title has "Song | Artist" or "Artist | Song", extract Song
  if (cleanTitle.includes(' | ')) {
    const parts = cleanTitle.split(' | ');
    if (cleanArtist && parts[1].toLowerCase().includes(cleanArtist.toLowerCase())) {
      cleanTitle = parts[0].trim();
    } else if (cleanArtist && parts[0].toLowerCase().includes(cleanArtist.toLowerCase())) {
      cleanTitle = parts[1].trim();
    } else {
      cleanTitle = parts[0].trim();
    }
  }

  // Remove trailing featuring tags from title
  cleanTitle = cleanTitle.replace(/\s+(feat\.?|ft\.?)\s+.*$/i, '').trim();

  // Primary artist: first artist before &, x, comma, ft.
  const primaryArtist = cleanArtist.split(/&|,|\bx\b|feat\.?|ft\.?/i)[0].trim();

  return { cleanTitle, cleanArtist, primaryArtist };
}

/**
 * Fetches real synchronized lyrics from LRCLIB API with instant memory & local cache
 */
export async function searchAndFetchLyrics(
  trackName: string,
  artistName?: string
): Promise<{ syncedLyrics: SyncedLyricLine[] | null; plainLyrics: string | null; trackTitle: string; artist: string } | null> {
  const { cleanTitle, cleanArtist, primaryArtist } = cleanSearchQuery(trackName, artistName);
  const key1 = `${cleanTitle.toLowerCase()}:::${cleanArtist.toLowerCase()}`;
  const key2 = `${cleanTitle.toLowerCase()}:::${primaryArtist.toLowerCase()}`;
  const normKey1 = `${normalizeLyricKey(cleanTitle)}:::${normalizeLyricKey(cleanArtist)}`;
  const normKey2 = `${normalizeLyricKey(cleanTitle)}:::${normalizeLyricKey(primaryArtist)}`;

  // 1. Instant fast-path from pre-loaded authentic LRC catalog (always highest priority)
  for (const k of [normKey1, normKey2, key1, key2]) {
    if (PRELOADED_SYNCED_LRC[k]) {
      const item = PRELOADED_SYNCED_LRC[k];
      const parsed = parseLrc(item.lrc);
      const payload = {
        syncedLyrics: parsed,
        plainLyrics: parsed.map(l => l.text).join('\n'),
        trackTitle: item.title,
        artist: item.artist
      };
      saveLyricsToCache(key1, payload);
      saveLyricsToCache(normKey1, payload);
      return payload;
    }
  }

  // 2. Check in-memory cache
  for (const k of [key1, key2, normKey1, normKey2]) {
    if (lyricsMemoryCache.has(k)) {
      return lyricsMemoryCache.get(k)!;
    }
  }

  try {
    // 3. Exact match query with full artist name
    let getUrl = `https://lrclib.net/api/get?track_name=${encodeURIComponent(cleanTitle)}&artist_name=${encodeURIComponent(cleanArtist)}`;
    let res = await fetch(getUrl, { signal: AbortSignal.timeout(3500) });

    // If full artist didn't match and primary artist is different, try primary artist (e.g. Bad Bunny instead of Bad Bunny & Chencho Corleone)
    if (!res.ok && primaryArtist && primaryArtist !== cleanArtist) {
      getUrl = `https://lrclib.net/api/get?track_name=${encodeURIComponent(cleanTitle)}&artist_name=${encodeURIComponent(primaryArtist)}`;
      res = await fetch(getUrl, { signal: AbortSignal.timeout(3500) });
    }

    if (res.ok) {
      const data = await res.json();
      if (data.syncedLyrics) {
        const parsed = parseLrc(data.syncedLyrics);
        if (parsed.length > 0) {
          const payload = {
            syncedLyrics: parsed,
            plainLyrics: data.plainLyrics || null,
            trackTitle: data.trackName || cleanTitle,
            artist: data.artistName || cleanArtist
          };
          saveLyricsToCache(key1, payload);
          saveLyricsToCache(normKey1, payload);
          return payload;
        }
      } else if (data.plainLyrics) {
        const payload = {
          syncedLyrics: null,
          plainLyrics: data.plainLyrics,
          trackTitle: data.trackName || cleanTitle,
          artist: data.artistName || cleanArtist
        };
        saveLyricsToCache(key1, payload);
        saveLyricsToCache(normKey1, payload);
        return payload;
      }
    }

    // 4. Broad search query (fall back to search endpoint)
    const query = `${cleanTitle} ${primaryArtist || cleanArtist}`.trim();
    const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(query)}`;
    const searchRes = await fetch(searchUrl, { signal: AbortSignal.timeout(4500) });

    if (searchRes.ok) {
      const items = await searchRes.json();
      if (Array.isArray(items) && items.length > 0) {
        // Find best candidate with real syncedLyrics
        const bestWithSync = items.find((item: any) => Boolean(item.syncedLyrics));
        if (bestWithSync && bestWithSync.syncedLyrics) {
          const parsed = parseLrc(bestWithSync.syncedLyrics);
          if (parsed.length > 0) {
            const payload = {
              syncedLyrics: parsed,
              plainLyrics: bestWithSync.plainLyrics || null,
              trackTitle: bestWithSync.trackName || bestWithSync.name || cleanTitle,
              artist: bestWithSync.artistName || cleanArtist
            };
            saveLyricsToCache(key1, payload);
            saveLyricsToCache(normKey1, payload);
            return payload;
          }
        }

        const firstWithPlain = items.find((item: any) => Boolean(item.plainLyrics));
        if (firstWithPlain && firstWithPlain.plainLyrics) {
          const payload = {
            syncedLyrics: null,
            plainLyrics: firstWithPlain.plainLyrics,
            trackTitle: firstWithPlain.trackName || cleanTitle,
            artist: firstWithPlain.artistName || cleanArtist
          };
          saveLyricsToCache(key1, payload);
          saveLyricsToCache(normKey1, payload);
          return payload;
        }
      }
    }
  } catch (error) {
    console.warn('LRCLIB network lookup notice:', error);
  }

  // 5. Proxy fallback via backend /api/lyrics
  try {
    const proxyUrl = `/api/lyrics?track=${encodeURIComponent(cleanTitle)}&artist=${encodeURIComponent(primaryArtist || cleanArtist)}`;
    const proxyRes = await fetch(proxyUrl, { signal: AbortSignal.timeout(4000) });
    if (proxyRes.ok) {
      const pData: any = await proxyRes.json();
      if (pData.success && pData.syncedLyrics) {
        const parsed = parseLrc(pData.syncedLyrics);
        if (parsed.length > 0) {
          const payload = {
            syncedLyrics: parsed,
            plainLyrics: pData.plainLyrics || null,
            trackTitle: pData.trackName || cleanTitle,
            artist: pData.artistName || cleanArtist
          };
          saveLyricsToCache(key1, payload);
          saveLyricsToCache(normKey1, payload);
          return payload;
        }
      }
    }
  } catch {}

  return null;
}
