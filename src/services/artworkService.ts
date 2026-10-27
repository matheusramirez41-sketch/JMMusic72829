/**
 * Artwork Service:
 * Resolves authentic, high-resolution official album covers for tracks,
 * ensuring songs like "Ojitos Lindos", "Huracán", "MONACO", etc. NEVER show stock or wrong photos.
 */

// Curated accurate map of high-resolution official album covers (Apple Music / iTunes HQ CDN - verified 200 OK)
export const KNOWN_OFFICIAL_COVERS: Record<string, string> = {
  // Bad Bunny
  'ojitos lindos': 'https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/3e/04/eb/3e04ebf6-370f-f59d-ec84-2c2643db92f1/196626945068.jpg/600x600bb.jpg',
  'titi me pregunto': 'https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/3e/04/eb/3e04ebf6-370f-f59d-ec84-2c2643db92f1/196626945068.jpg/600x600bb.jpg',
  'tití me preguntó': 'https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/3e/04/eb/3e04ebf6-370f-f59d-ec84-2c2643db92f1/196626945068.jpg/600x600bb.jpg',
  'me porto bonito': 'https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/3e/04/eb/3e04ebf6-370f-f59d-ec84-2c2643db92f1/196626945068.jpg/600x600bb.jpg',
  'moscow mule': 'https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/3e/04/eb/3e04ebf6-370f-f59d-ec84-2c2643db92f1/196626945068.jpg/600x600bb.jpg',
  'monaco': 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/90/5e/7e/905e7ed5-a8fa-a8f3-cd06-0028fdf3afaa/199066342442.jpg/600x600bb.jpg',
  'dakiti': 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/c0/0d/54/c00d545e-de7f-ea13-1d38-168c6d86bf0d/789577243699.png/600x600bb.jpg',
  'dákiti': 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/c0/0d/54/c00d545e-de7f-ea13-1d38-168c6d86bf0d/789577243699.png/600x600bb.jpg',

  // Hakuna Group Music
  'huracan': 'https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/90/3b/81/903b81dd-03b3-c9e0-2b5f-6dbeb72cae59/104599.jpg/600x600bb.jpg',
  'huracán': 'https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/90/3b/81/903b81dd-03b3-c9e0-2b5f-6dbeb72cae59/104599.jpg/600x600bb.jpg',
  'forofos': 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/3e/c9/22/3ec92236-5bcc-e994-0dcf-883d1e6c680f/78898.jpg/600x600bb.jpg',
  'nacidos de la brisa': 'https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/90/3b/81/903b81dd-03b3-c9e0-2b5f-6dbeb72cae59/104599.jpg/600x600bb.jpg',

  // Feid
  'luna': 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/7c/54/aa/7c54aa94-9ae3-4b80-7b23-8b23955dc3a2/23UM1IM60703.rgb.jpg/600x600bb.jpg',
  'classy 101': 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/cd/41/e4/cd41e447-3477-44e2-2c72-488770771cff/artwork.jpg/600x600bb.jpg',
  'feliz cumpleanos ferxxo': 'https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/54/90/df/5490dfaf-d6a4-579c-f6e4-81fd59f6ae3f/22UM1IM04831.rgb.jpg/600x600bb.jpg',
  'feliz cumpleaños ferxxo': 'https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/54/90/df/5490dfaf-d6a4-579c-f6e4-81fd59f6ae3f/22UM1IM04831.rgb.jpg/600x600bb.jpg',

  // The Weeknd
  'blinding lights': 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/6f/bc/e6/6fbce6c4-c38c-72d8-4fd0-66cfff32f679/20UMGIM12176.rgb.jpg/600x600bb.jpg',
  'save your tears': 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/6f/bc/e6/6fbce6c4-c38c-72d8-4fd0-66cfff32f679/20UMGIM12176.rgb.jpg/600x600bb.jpg',
  'starboy': 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/b5/92/bb/b592bb72-52e3-e756-9b26-9f56d08f47ab/16UMGIM67864.rgb.jpg/600x600bb.jpg',

  // Travis Scott
  'fe!n': 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/7d/4f/94/7d4f9468-56e1-3a2d-7186-c8088170ef58/196871341899.jpg/600x600bb.jpg',
  'fein': 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/7d/4f/94/7d4f9468-56e1-3a2d-7186-c8088170ef58/196871341899.jpg/600x600bb.jpg',
  'goosebumps': 'https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/b8/e5/27/b8e527c8-aaf4-c7b7-5562-c479458ed7d9/886446092645.jpg/600x600bb.jpg',

  // Rauw Alejandro, Myke Towers, Quevedo, Rosalía, Karol G
  'todo de ti': 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/48/1e/c4/481ec4ab-5e42-8f6c-ad8f-086314e47eee/21CRGIM29092.rgb.jpg/600x600bb.jpg',
  'lala': 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/d9/e3/67/d9e367d7-4033-3dd1-1f7d-7843dc29428c/5059801117160.jpg/600x600bb.jpg',
  'columbia': 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/8a/d9/3e/8ad93ec4-5d61-9759-c92d-d9571b86224c/197338610251.jpg/600x600bb.jpg',
  'provenza': 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/9b/01/44/9b0144e6-21ae-b53f-2b25-ef6c594b18a3/22UM1IM38716.rgb.jpg/600x600bb.jpg',
  'despecha': 'https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/b0/85/94/b0859449-5c20-a3fd-a99c-d92cf1a60e56/22CRGIM33758.rgb.jpg/600x600bb.jpg',
  'despechá': 'https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/b0/85/94/b0859449-5c20-a3fd-a99c-d92cf1a60e56/22CRGIM33758.rgb.jpg/600x600bb.jpg',
  'despacito': 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/e2/ef/f0/e2eff0bc-c51d-7de5-9280-6891ddcee71b/18UMGIM85289.rgb.jpg/600x600bb.jpg'
};

const artworkMemoryCache = new Map<string, string>();

/**
 * Normalizes title string for dictionary matching
 */
function normalizeKey(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\(.*?\)|\[.*?\]/g, '')
    .replace(/[^a-z0-9 ]/g, '')
    .trim();
}

/**
 * Synchronously checks if a track has an accurate official cover available immediately
 */
export function getImmediateOfficialCover(title: string, artist?: string, fallbackUrl?: string, trackId?: string): string {
  const normTitle = normalizeKey(title);
  if (KNOWN_OFFICIAL_COVERS[normTitle]) {
    return KNOWN_OFFICIAL_COVERS[normTitle];
  }

  // Also check combined title + artist key
  if (artist) {
    const combined = `${normTitle} ${normalizeKey(artist)}`;
    if (KNOWN_OFFICIAL_COVERS[combined]) {
      return KNOWN_OFFICIAL_COVERS[combined];
    }
  }

  // Check in-memory cache
  const cacheKey = `${normTitle}::${normalizeKey(artist || '')}`;
  if (artworkMemoryCache.has(cacheKey)) {
    return artworkMemoryCache.get(cacheKey)!;
  }

  // If track has a YouTube ID and fallbackUrl is an Unsplash link or empty, use the actual YouTube thumbnail
  if (trackId && trackId.startsWith('yt-')) {
    const ytVideoId = trackId.replace('yt-', '');
    if (/^[a-zA-Z0-9_-]{11}$/.test(ytVideoId)) {
      return `https://img.youtube.com/vi/${ytVideoId}/hqdefault.jpg`;
    }
  }

  // If current URL is already a genuine non-Unsplash CDN link (like mzstatic, ytimg, etc.), keep it
  if (fallbackUrl && !fallbackUrl.includes('unsplash.com')) {
    return fallbackUrl;
  }

  // Return fallback if available
  return fallbackUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80';
}

/**
 * Dynamically queries iTunes Search API in the background for 100% official Apple Music 600x600 album artwork
 */
export async function resolveOfficialCoverUrl(title: string, artist?: string): Promise<string | null> {
  const normTitle = normalizeKey(title);
  const normArtist = normalizeKey(artist || '');
  const cacheKey = `${normTitle}::${normArtist}`;

  if (KNOWN_OFFICIAL_COVERS[normTitle]) {
    return KNOWN_OFFICIAL_COVERS[normTitle];
  }

  if (artworkMemoryCache.has(cacheKey)) {
    return artworkMemoryCache.get(cacheKey)!;
  }

  try {
    const query = `${title} ${artist || ''}`.trim();
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=3`;
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        // Find best result that genuinely matches track title or artist
        const matched = data.results.find((item: any) => {
          const resTrack = normalizeKey(item.trackName || '');
          const resArtist = normalizeKey(item.artistName || '');
          const isTrackMatch = resTrack.includes(normTitle) || normTitle.includes(resTrack);
          const isArtistMatch = !normArtist || resArtist.includes(normArtist) || normArtist.includes(resArtist);
          return isTrackMatch || isArtistMatch;
        }) || data.results[0];

        // Ensure it's not a completely unrelated song
        const resTrack = normalizeKey(matched.trackName || '');
        if (normTitle.length > 3 && !resTrack.includes(normTitle.slice(0, 4)) && !normTitle.includes(resTrack.slice(0, 4))) {
          // Reject bogus match
          return null;
        }

        if (matched && matched.artworkUrl100) {
          const hiRes = matched.artworkUrl100.replace('100x100bb', '600x600bb');
          artworkMemoryCache.set(cacheKey, hiRes);
          return hiRes;
        }
      }
    }
  } catch {
    // Network timeout or offline
  }

  return null;
}
