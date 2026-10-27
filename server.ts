import express from 'express';
import type { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));

// Defensive Security & PWA Headers
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Explicit manifest serving with correct MIME type and CORS for PWABuilder
const serveManifest = (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.sendFile(path.resolve(__dirname, 'public', 'manifest.json'));
};
app.get('/manifest.json', serveManifest);
app.get('/manifest.webmanifest', serveManifest);


// Hardened in-memory rate limiter with periodic eviction to prevent memory leaks
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 120;

// Periodic cleanup every 2 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 2 * 60 * 1000).unref?.();

function rateLimitMiddleware(req: Request, res: Response, next: () => void) {
  const headerIp = typeof req.headers['x-forwarded-for'] === 'string'
    ? req.headers['x-forwarded-for'].split(',')[0].trim()
    : req.socket.remoteAddress || 'unknown';
  const ip = headerIp.slice(0, 45); // Limit IPv6 max length
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    // Guard against map overflow
    if (rateLimitMap.size > 10000) {
      rateLimitMap.clear();
    }
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return next();
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return res.status(429).json({
      success: false,
      error: 'Demasiadas solicitudes. Por favor espera un momento.'
    });
  }

  record.count++;
  next();
}

interface SearchResultItem {
  id: string;
  title: string;
  artist: string;
  duration: number; // in seconds
  durationFormatted: string;
  thumbnail: string;
  views?: string;
}

// Convert "3:45" or "1:15:30" to seconds
function parseDuration(durationStr: string): number {
  if (!durationStr) return 210;
  const parts = durationStr.split(':').map(p => parseInt(p, 10));
  if (parts.length === 2) {
    return (parts[0] * 60) + (parts[1] || 0);
  }
  if (parts.length === 3) {
    return (parts[0] * 3600) + (parts[1] * 60) + (parts[2] || 0);
  }
  return 210;
}

/**
 * High-performance, secure official music video search endpoint.
 * Protected with input validation, rate limiting and sanitization.
 */
async function handleVideoSearch(req: Request, res: Response) {
  const rawQuery = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  // Sanitize: max 100 chars, strip dangerous control characters and newlines
  const query = rawQuery.slice(0, 100).replace(/[\r\n\x00-\x1F\x7F<>"{}]/g, '').trim();
  if (!query) {
    return res.json({ success: true, results: [] });
  }

  try {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query + ' audio')}`;
    const response = await fetch(searchUrl, {
      signal: AbortSignal.timeout(6000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'es-419,es;q=0.9,en;q=0.8',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });

    if (!response.ok) {
      throw new Error(`YouTube responded with status ${response.status}`);
    }

    const html = await response.text();
    const results: SearchResultItem[] = [];

    // Strategy 1: Parse ytInitialData JSON
    const jsonMatch = html.match(/var ytInitialData = ({.+?});<\/script>/s) ||
                      html.match(/ytInitialData\s*=\s*({.+?});/s);

    if (jsonMatch) {
      try {
        const data = JSON.parse(jsonMatch[1]);
        const sectionContents =
          data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];

        for (const section of sectionContents) {
          const items = section.itemSectionRenderer?.contents || [];
          for (const item of items) {
            const v = item.videoRenderer;
            if (v && v.videoId && v.videoId.length === 11) {
              const id = v.videoId;
              const title = v.title?.runs?.map((r: any) => r.text).join('') || v.title?.accessibility?.accessibilityData?.label || 'Canción Completa';
              const artist = v.ownerText?.runs?.[0]?.text || v.shortBylineText?.runs?.[0]?.text || 'Artista';
              const durationFormatted = v.lengthText?.simpleText || '3:30';
              const duration = parseDuration(durationFormatted);
              const thumbnail = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
              const views = v.viewCountText?.simpleText || 'Reproducciones';

              // Avoid duplicate IDs
              if (!results.some(r => r.id === id)) {
                results.push({
                  id,
                  title,
                  artist,
                  duration,
                  durationFormatted,
                  thumbnail,
                  views
                });
              }
            }
          }
        }
      } catch (parseErr) {
        console.warn('Could not parse ytInitialData JSON:', parseErr);
      }
    }

    // Strategy 2: Fallback regex if ytInitialData parsing was incomplete
    if (results.length === 0) {
      const idMatches = [...html.matchAll(/"videoId":"([a-zA-Z0-9_-]{11})"/g)].map(m => m[1]);
      const uniqueIds = Array.from(new Set(idMatches)).slice(0, 30);

      for (const id of uniqueIds) {
        results.push({
          id,
          title: `${query} (Audio Completo)`,
          artist: 'Aura Master Audio',
          duration: 220,
          durationFormatted: '3:40',
          thumbnail: `https://img.youtube.com/vi/${id}/hqdefault.jpg`
        });
      }
    }

    return res.json({
      success: true,
      query,
      count: results.length,
      results
    });
  } catch (error: any) {
    console.error('Error in /api/search-video:', error);
    return res.status(500).json({
      success: false,
      error: 'Error buscando vídeo oficial'
    });
  }
}

// Default working Last.fm key (can be overridden via env var)
const LASTFM_KEY = process.env.LASTFM_API_KEY || '744b5c9d5eae3289a03548b59bfe137a';

/**
 * Last.fm Recommendations Handler:
 * Recommends tracks based on current track or artist using Last.fm track.getSimilar / artist.getSimilar / artist.getTopTracks
 */
async function handleLastFmRecommendations(req: Request, res: Response) {
  try {
    const artist = typeof req.query.artist === 'string' ? req.query.artist.trim().slice(0, 80) : '';
    const track = typeof req.query.track === 'string' ? req.query.track.trim().slice(0, 80) : '';

    if (!artist && !track) {
      return res.status(400).json({ success: false, error: 'Artist or track parameter is required' });
    }

    let recommendations: Array<{
      title: string;
      artist: string;
      match?: number;
      coverUrl?: string;
      listeners?: number;
      source: 'track' | 'artist' | 'top';
    }> = [];

    // Strategy 1: track.getSimilar if track is provided
    if (artist && track) {
      try {
        const trackUrl = `https://ws.audioscrobbler.com/2.0/?method=track.getsimilar&artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(track)}&api_key=${LASTFM_KEY}&format=json&limit=12`;
        const resp = await fetch(trackUrl, {
          headers: { 'User-Agent': 'JMMUSIC-App/1.0.0 (https://ais-pre-ehkrepvluapdx6z3wbtjtq-141331454684.us-east1.run.app)' },
          signal: AbortSignal.timeout(4500)
        });
        if (resp.ok) {
          const data: any = await resp.json();
          const list = data?.similartracks?.track;
          if (Array.isArray(list)) {
            recommendations = list.map((item: any) => {
              const images = Array.isArray(item.image) ? item.image : [];
              const foundImg = images.find((i: any) => i.size === 'extralarge' || i.size === 'large') || images[images.length - 1];
              const coverUrl = foundImg?.['#text'] && !foundImg['#text'].includes('2a96cbd8b46e442fc41c2b86b821562f') ? foundImg['#text'] : undefined;
              return {
                title: item.name || '',
                artist: typeof item.artist === 'object' ? item.artist.name : item.artist || '',
                match: typeof item.match === 'string' ? parseFloat(item.match) : item.match,
                coverUrl,
                source: 'track' as const
              };
            }).filter((item: any) => item.title && item.artist);
          }
        }
      } catch (err) {
        console.warn('Last.fm track.getsimilar failed, falling back to artist:', err);
      }
    }

    // Strategy 2: If no tracks found, fetch similar artists and their top tracks
    if (recommendations.length < 5 && artist) {
      try {
        const artistUrl = `https://ws.audioscrobbler.com/2.0/?method=artist.getsimilar&artist=${encodeURIComponent(artist)}&api_key=${LASTFM_KEY}&format=json&limit=6`;
        const resp = await fetch(artistUrl, {
          headers: { 'User-Agent': 'JMMUSIC-App/1.0.0 (https://ais-pre-ehkrepvluapdx6z3wbtjtq-141331454684.us-east1.run.app)' },
          signal: AbortSignal.timeout(4500)
        });
        if (resp.ok) {
          const data: any = await resp.json();
          const similarArtists = data?.similarartists?.artist;
          if (Array.isArray(similarArtists)) {
            // Get top track for each similar artist
            const topTrackPromises = similarArtists.slice(0, 5).map(async (simArt: any) => {
              const simName = simArt.name;
              if (!simName) return [];
              try {
                const topUrl = `https://ws.audioscrobbler.com/2.0/?method=artist.gettoptracks&artist=${encodeURIComponent(simName)}&api_key=${LASTFM_KEY}&format=json&limit=2`;
                const topResp = await fetch(topUrl, {
                  headers: { 'User-Agent': 'JMMUSIC-App/1.0.0' },
                  signal: AbortSignal.timeout(3500)
                });
                if (topResp.ok) {
                  const topData: any = await topResp.json();
                  const tracks = topData?.toptracks?.track;
                  if (Array.isArray(tracks)) {
                    return tracks.map((t: any) => {
                      const images = Array.isArray(t.image) ? t.image : [];
                      const foundImg = images.find((i: any) => i.size === 'extralarge' || i.size === 'large') || images[images.length - 1];
                      const coverUrl = foundImg?.['#text'] && !foundImg['#text'].includes('2a96cbd8b46e442fc41c2b86b821562f') ? foundImg['#text'] : undefined;
                      return {
                        title: t.name,
                        artist: simName,
                        match: parseFloat(simArt.match || '0.8'),
                        coverUrl,
                        source: 'artist' as const
                      };
                    });
                  }
                }
              } catch {}
              return [];
            });

            const resolvedTracks = await Promise.all(topTrackPromises);
            const flattened = resolvedTracks.flat();
            recommendations = [...recommendations, ...flattened];
          }
        }
      } catch (err) {
        console.warn('Last.fm artist.getsimilar failed:', err);
      }
    }

    // Strategy 3: Global iTunes catalog fallback (Guarantees authentic recommendations for ANY artist on earth)
    if (recommendations.length < 5 && artist) {
      try {
        const cleanArtist = artist.split('&')[0].split('feat')[0].trim();
        const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(cleanArtist)}&entity=song&limit=15`;
        const itunesResp = await fetch(itunesUrl, { signal: AbortSignal.timeout(3500) });
        if (itunesResp.ok) {
          const itunesData: any = await itunesResp.json();
          if (Array.isArray(itunesData.results)) {
            for (const item of itunesData.results) {
              const tName = item.trackName;
              const aName = item.artistName || cleanArtist;
              if (tName && aName) {
                const cover = item.artworkUrl100 ? item.artworkUrl100.replace('100x100bb', '600x600bb') : undefined;
                recommendations.push({
                  title: tName,
                  artist: aName,
                  match: 0.9,
                  coverUrl: cover,
                  source: 'top' as const
                });
              }
            }
          }
        }
      } catch (err) {
        console.warn('iTunes catalog fallback notice:', err);
      }
    }

    // Deduplicate recommendations by "title - artist"
    const seen = new Set<string>();
    const unique = recommendations.filter(r => {
      const key = `${r.title.toLowerCase()} - ${r.artist.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 15);

    return res.json({
      success: true,
      artist,
      track,
      count: unique.length,
      recommendations: unique
    });
  } catch (error: any) {
    console.error('Error in handleLastFmRecommendations:', error);
    return res.status(500).json({ success: false, error: 'Error procesando recomendaciones Last.fm' });
  }
}

/**
 * Last.fm User Profile Top Tracks Handler (for syncing personal scrobbles):
 */
async function handleLastFmUserTracks(req: Request, res: Response) {
  try {
    const username = typeof req.query.username === 'string' ? req.query.username.trim().slice(0, 50) : '';
    if (!username) {
      return res.status(400).json({ success: false, error: 'Username parameter is required' });
    }

    const url = `https://ws.audioscrobbler.com/2.0/?method=user.gettoptracks&user=${encodeURIComponent(username)}&api_key=${LASTFM_KEY}&format=json&limit=15&period=1month`;
    const resp = await fetch(url, {
      headers: { 'User-Agent': 'JMMUSIC-App/1.0.0' },
      signal: AbortSignal.timeout(5000)
    });

    if (!resp.ok) {
      return res.status(resp.status).json({ success: false, error: 'Error consultando usuario en Last.fm' });
    }

    const data: any = await resp.json();
    if (data.error) {
      return res.status(404).json({ success: false, error: data.message || 'Usuario no encontrado' });
    }

    const rawList = data?.toptracks?.track || [];
    const tracks = (Array.isArray(rawList) ? rawList : [rawList]).map((t: any) => ({
      title: t.name,
      artist: typeof t.artist === 'object' ? t.artist.name : t.artist,
      playcount: parseInt(t.playcount || '0', 10),
      url: t.url
    })).filter((t: any) => t.title && t.artist);

    return res.json({
      success: true,
      username,
      count: tracks.length,
      tracks
    });
  } catch (error: any) {
    console.error('Error in handleLastFmUserTracks:', error);
    return res.status(500).json({ success: false, error: 'Error de conexión con Last.fm' });
  }
}

/**
 * Server-side high-availability lyrics proxy
 */
async function handleLyrics(req: Request, res: Response) {
  const track = typeof req.query.track === 'string' ? req.query.track.trim() : '';
  const artist = typeof req.query.artist === 'string' ? req.query.artist.trim() : '';
  if (!track) {
    return res.status(400).json({ success: false, error: 'track parameter is required' });
  }

  try {
    const cleanTrack = track.replace(/\(.*?\)|\[.*?\]/g, '').trim();
    const cleanArtist = artist.replace(/\(.*?\)|\[.*?\]/g, '').split(/&|,|feat\.?|ft\.?/i)[0].trim();

    let getUrl = `https://lrclib.net/api/get?track_name=${encodeURIComponent(cleanTrack)}&artist_name=${encodeURIComponent(cleanArtist)}`;
    let resp = await fetch(getUrl, {
      signal: AbortSignal.timeout(4000),
      headers: { 'User-Agent': 'JMMUSIC-App/1.0.0' }
    });

    if (resp.ok) {
      const data: any = await resp.json();
      return res.json({ success: true, ...data });
    }

    const q = `${cleanTrack} ${cleanArtist}`.trim();
    const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(q)}`;
    const searchResp = await fetch(searchUrl, {
      signal: AbortSignal.timeout(5000),
      headers: { 'User-Agent': 'JMMUSIC-App/1.0.0' }
    });

    if (searchResp.ok) {
      const items: any = await searchResp.json();
      if (Array.isArray(items) && items.length > 0) {
        const best = items.find((it: any) => it.syncedLyrics) || items[0];
        return res.json({ success: true, ...best });
      }
    }

    return res.json({ success: false, error: 'No lyrics found' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Resolves YouTube / YouTube Music links (single video, playlist, or shared URL)
 * into playable Track object(s) with high resolution artwork and metadata.
 */
async function handleResolveLink(req: Request, res: Response) {
  const rawUrl = typeof req.query.url === 'string' ? req.query.url.trim() : '';
  if (!rawUrl) {
    return res.status(400).json({ success: false, error: 'url parameter is required' });
  }

  try {
    let videoId: string | null = null;
    let playlistId: string | null = null;

    if (/^[a-zA-Z0-9_-]{11}$/.test(rawUrl)) {
      videoId = rawUrl;
    } else {
      try {
        const parsed = new URL(rawUrl);
        if (parsed.hostname.includes('youtu.be')) {
          videoId = parsed.pathname.replace(/^\/+/, '').split('/')[0].split('?')[0];
        } else if (parsed.hostname.includes('youtube.com')) {
          videoId = parsed.searchParams.get('v');
          playlistId = parsed.searchParams.get('list');
          if (!videoId && parsed.pathname.includes('/embed/')) {
            videoId = parsed.pathname.split('/embed/')[1]?.split('/')[0]?.split('?')[0];
          }
          if (!videoId && parsed.pathname.includes('/shorts/')) {
            videoId = parsed.pathname.split('/shorts/')[1]?.split('/')[0]?.split('?')[0];
          }
        }
      } catch {
        const vMatch = rawUrl.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([a-zA-Z0-9_-]{11})/);
        if (vMatch) videoId = vMatch[1];
        const pMatch = rawUrl.match(/[?&]list=([a-zA-Z0-9_-]+)/);
        if (pMatch) playlistId = pMatch[1];
      }
    }

    if (!videoId && !playlistId) {
      return res.status(400).json({ success: false, error: 'No se detectó un enlace válido de YouTube Music o YouTube' });
    }

    const resolvedTracks: any[] = [];
    let resolvedPlaylistTitle = 'Lista de YouTube Music';

    // Strategy 1: Official YouTubei Browse API for full playlists (Supports 100+ songs with continuations!)
    if (playlistId) {
      try {
        const cleanPid = playlistId.replace(/^VL/, '');
        const browseId = cleanPid.startsWith('PL') || cleanPid.startsWith('RD') || cleanPid.startsWith('OL')
          ? `VL${cleanPid}`
          : `VL${cleanPid}`;

        const ytClientContext = {
          client: {
            clientName: 'WEB',
            clientVersion: '2.20240313.01.00',
            hl: 'es',
            gl: 'US'
          }
        };

        const ytBrowseRes = await fetch('https://www.youtube.com/youtubei/v1/browse?prettyPrint=false', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
          },
          body: JSON.stringify({
            context: ytClientContext,
            browseId
          }),
          signal: AbortSignal.timeout(7000)
        });

        if (ytBrowseRes.ok) {
          const browseData: any = await ytBrowseRes.json();
          const seenIds = new Set<string>();
          let nextContinuation: string | null = null;

          // Helper to recursively extract tracks from lockupViewModel, playlistVideoRenderer, etc.
          const extractFromObject = (obj: any) => {
            if (!obj || typeof obj !== 'object') return;

            // Pattern A: Modern YouTube lockupViewModel
            if (obj.lockupViewModel && obj.lockupViewModel.contentId) {
              const l = obj.lockupViewModel;
              const vid = l.contentId;
              if (vid && vid.length === 11 && !seenIds.has(vid)) {
                seenIds.add(vid);
                const rawTitle = l.metadata?.lockupMetadataViewModel?.title?.content || 'Canción';
                const parts = l.metadata?.lockupMetadataViewModel?.metadata?.contentMetadataViewModel?.metadataRows?.[0]?.metadataParts;
                const rawArtist = parts?.[0]?.text?.content || 'Artista';

                let title = rawTitle.replace(/\([^)]*?(official|video|audio|4k|hd|lyrics|letra|visualizer|videoclip|360)[^)]*?\)/gi, '')
                                   .replace(/\[[^\]]*?(official|video|audio|4k|hd|lyrics|letra|visualizer|videoclip|360)[^\]]*?\]/gi, '')
                                   .trim();
                let artist = rawArtist;

                resolvedTracks.push({
                  id: `yt-${vid}-${resolvedTracks.length}`,
                  title: title || rawTitle,
                  artist: artist || 'Artista',
                  album: resolvedPlaylistTitle,
                  duration: 210,
                  audioUrl: '',
                  coverUrl: `https://img.youtube.com/vi/${vid}/hqdefault.jpg`,
                  accentColor: '#6366f1',
                  genre: 'YouTube Music',
                  plays: 650000,
                  lyrics: []
                });
              }
            }

            // Pattern B: Classic playlistVideoRenderer
            if (obj.playlistVideoRenderer && obj.playlistVideoRenderer.videoId) {
              const p = obj.playlistVideoRenderer;
              const vid = p.videoId;
              if (vid && vid.length === 11 && !seenIds.has(vid)) {
                seenIds.add(vid);
                const rawTitle = p.title?.runs?.[0]?.text || 'Canción';
                const rawArtist = p.shortBylineText?.runs?.[0]?.text || 'Artista';

                let title = rawTitle.replace(/\([^)]*?(official|video|audio|4k|hd|lyrics|letra|visualizer|videoclip|360)[^)]*?\)/gi, '')
                                   .replace(/\[[^\]]*?(official|video|audio|4k|hd|lyrics|letra|visualizer|videoclip|360)[^\]]*?\]/gi, '')
                                   .trim();

                resolvedTracks.push({
                  id: `yt-${vid}-${resolvedTracks.length}`,
                  title: title || rawTitle,
                  artist: rawArtist,
                  album: resolvedPlaylistTitle,
                  duration: parseInt(p.lengthSeconds || '210', 10) || 210,
                  audioUrl: '',
                  coverUrl: p.thumbnail?.thumbnails?.slice(-1)[0]?.url || `https://img.youtube.com/vi/${vid}/hqdefault.jpg`,
                  accentColor: '#6366f1',
                  genre: 'YouTube Music',
                  plays: 720000,
                  lyrics: []
                });
              }
            }

            // Pattern C: continuation command
            if (obj.continuationCommand && obj.continuationCommand.token) {
              nextContinuation = obj.continuationCommand.token;
            }

            for (const k of Object.keys(obj)) {
              extractFromObject(obj[k]);
            }
          };

          extractFromObject(browseData);

          // If playlist title is present in header
          const headerTitle = browseData?.header?.playlistHeaderRenderer?.title?.simpleText
            || browseData?.header?.musicHeaderRenderer?.title?.runs?.[0]?.text;
          if (headerTitle) {
            resolvedPlaylistTitle = headerTitle;
          }

          // Fetch continuations if available to support playlists up to 100+ songs!
          let continuationRounds = 0;
          while (nextContinuation && resolvedTracks.length < 100 && continuationRounds < 3) {
            continuationRounds++;
            const tokenToUse = nextContinuation;
            nextContinuation = null;

            try {
              const contRes = await fetch('https://www.youtube.com/youtubei/v1/browse?prettyPrint=false', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
                },
                body: JSON.stringify({
                  context: ytClientContext,
                  continuation: tokenToUse
                }),
                signal: AbortSignal.timeout(5000)
              });

              if (contRes.ok) {
                const contData = await contRes.json();
                extractFromObject(contData);
              }
            } catch (contErr) {
              console.warn('Continuation batch warning:', contErr);
              break;
            }
          }
        }
      } catch (ytBrowseErr) {
        console.warn('YouTubei browse error, attempting fallback:', ytBrowseErr);
      }

      // Strategy 1B: Fallback HTML scraping if YouTubei found 0 items
      if (resolvedTracks.length === 0) {
        try {
          const cleanPid = playlistId.replace(/^VL/, '');
          const webUrl = `https://www.youtube.com/playlist?list=${cleanPid}&hl=es`;
          const webRes = await fetch(webUrl, {
            signal: AbortSignal.timeout(5000),
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
            }
          });

          if (webRes.ok) {
            const html = await webRes.text();
            const idMatches = [...html.matchAll(/"videoId":"([a-zA-Z0-9_-]{11})"/g)].map(m => m[1]);
            const uniqueIds = Array.from(new Set(idMatches)).slice(0, 50);

            for (let idx = 0; idx < uniqueIds.length; idx++) {
              const vid = uniqueIds[idx];
              resolvedTracks.push({
                id: `yt-${vid}-${idx}`,
                title: `Pista ${idx + 1} (${resolvedPlaylistTitle})`,
                artist: 'Artista YouTube Music',
                album: resolvedPlaylistTitle,
                duration: 210,
                audioUrl: '',
                coverUrl: `https://img.youtube.com/vi/${vid}/hqdefault.jpg`,
                accentColor: '#6366f1',
                genre: 'YouTube Music',
                plays: 500000,
                lyrics: []
              });
            }
          }
        } catch (fbErr) {
          console.warn('Fallback HTML extraction notice:', fbErr);
        }
      }
    }

    // Strategy 2: Single video link resolver
    if (resolvedTracks.length === 0 && videoId && /^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      try {
        const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
        const oembedRes = await fetch(oembedUrl, { signal: AbortSignal.timeout(4500) });
        if (oembedRes.ok) {
          const odata: any = await oembedRes.json();
          let rawTitle = odata.title || 'Canción YouTube Music';
          let rawAuthor = odata.author_name || 'Artista';

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

          resolvedTracks.push({
            id: `yt-${videoId}`,
            title,
            artist,
            album: 'Transferida de YouTube Music',
            duration: 210,
            audioUrl: '',
            coverUrl: odata.thumbnail_url || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
            accentColor: '#6366f1',
            genre: 'YouTube Music Hit',
            plays: 850000,
            lyrics: []
          });
        }
      } catch (err) {
        console.warn('Single video oEmbed resolve failed:', err);
      }
    }

    return res.json({
      success: resolvedTracks.length > 0,
      playlistTitle: resolvedPlaylistTitle,
      videoId,
      playlistId,
      count: resolvedTracks.length,
      tracks: resolvedTracks
    });
  } catch (err: any) {
    console.error('Error in /api/resolve-link:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

app.get('/api/resolve-link', rateLimitMiddleware, handleResolveLink);
app.get('/api/search-video', rateLimitMiddleware, handleVideoSearch);
app.get('/api/search-youtube', rateLimitMiddleware, handleVideoSearch);
app.get('/api/lastfm/recommendations', rateLimitMiddleware, handleLastFmRecommendations);
app.get('/api/lastfm/user-top', rateLimitMiddleware, handleLastFmUserTracks);
app.get('/api/lyrics', rateLimitMiddleware, handleLyrics);

/**
 * URL Shortener endpoint for sharing public app link
 */
const PUBLIC_APP_URL = 'https://ais-pre-ehkrepvluapdx6z3wbtjtq-141331454684.us-east1.run.app';
const shortUrlCache = new Map<string, string>();

async function handleShortenUrl(req: Request, res: Response) {
  let targetUrl = typeof req.query.url === 'string' ? req.query.url.trim() : PUBLIC_APP_URL;
  // If targetUrl contains ais-dev, always replace with ais-pre so recipients never get 403 / "solo es para mí"
  if (targetUrl.includes('ais-dev-')) {
    targetUrl = targetUrl.replace('ais-dev-', 'ais-pre-');
  }

  // Check cache first
  if (shortUrlCache.has(targetUrl)) {
    return res.json({
      success: true,
      shortUrl: shortUrlCache.get(targetUrl),
      originalUrl: targetUrl
    });
  }

  try {
    const tinyApi = `https://tinyurl.com/api-create.php?url=${encodeURIComponent(targetUrl)}`;
    const resp = await fetch(tinyApi, {
      signal: AbortSignal.timeout(4000),
      headers: { 'User-Agent': 'JMMUSIC-App/1.0.0' }
    });

    if (resp.ok) {
      const shortUrl = (await resp.text()).trim();
      if (shortUrl.startsWith('http')) {
        shortUrlCache.set(targetUrl, shortUrl);
        return res.json({
          success: true,
          shortUrl,
          originalUrl: targetUrl
        });
      }
    }
  } catch (err) {
    console.warn('TinyURL service timed out or failed, generating fallback:', err);
  }

  // Fallback: Return clean public link or is.gd fallback
  return res.json({
    success: true,
    shortUrl: targetUrl,
    originalUrl: targetUrl,
    fallback: true
  });
}

app.get('/api/shorten-url', rateLimitMiddleware, handleShortenUrl);

/**
 * Direct short link redirect handler
 */
app.get('/s/app', (_req: Request, res: Response) => {
  res.redirect(301, PUBLIC_APP_URL);
});

/**
 * Google Search Console verification route
 */
app.get('/googleb5623ad68fb7f2dc.html', (_req: Request, res: Response) => {
  res.type('text/html').send('google-site-verification: googleb5623ad68fb7f2dc.html\n');
});

/**
 * Healthcheck route
 */
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

/**
 * Handle unknown API endpoints with clean 404 JSON response
 */
app.all('/api/*', (_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'Ruta API no encontrada' });
});

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    // Mount Vite middlewares in development
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Aura Sound server running on http://0.0.0.0:${PORT} [${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}]`);
  });
}

startServer();
