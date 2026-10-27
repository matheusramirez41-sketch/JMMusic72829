// Lyrics Synchronization & Offset Management Helper
// Handles track-specific offsets, video intros, default calibrations, and cross-component sync

export interface TrackSyncInfo {
  title: string;
  artist: string;
  videoId?: string | null;
}

// Built-in verified offsets for popular YouTube music videos vs official studio album lyrics
// A negative offset (-) RETRASA la letra (delays lyrics because the video has an intro skit/acting)
// A positive offset (+) ADELANTA la letra (accelerates lyrics if the video started early)
export const KNOWN_VIDEO_OFFSETS: Record<string, number> = {
  // Moscow Mule: Official Music Video (p38WgakuYDo) has ~5.8s intro before beat
  'p38WgakuYDo': -5.8,
  // Tití Me Preguntó: Official Music Video (QpKkNIT84GY) has ~12.5s barber shop dialogue
  'QpKkNIT84GY': -12.5,
  // Me Porto Bonito: Official Music Video (xn21hH7kyx8) has ~6.5s car wash intro
  'xn21hH7kyx8': -6.5,
  // DÁKITI: Official Music Video (TmKh7lAwnBI) has ~7.5s intro scene
  'TmKh7lAwnBI': -7.5,
  // MONACO: QxPeRC82Uo0 visualizer/audio (calibrated to 0.0s with new curated LRC)
  'QxPeRC82Uo0': 0.0,
  // Forofos: MRL3Ifsl3kE (calibrated to 0.0s with new curated LRC)
  'MRL3Ifsl3kE': 0.0,
  // Huracán: P2Kf8RsxuiA (calibrated to 0.0s)
  'P2Kf8RsxuiA': 0.0,
  // Ojitos Lindos: 10EX-_h4pYc
  '10EX-_h4pYc': 0.0,
};

// Known default offsets by song title + artist
export const KNOWN_TRACK_DEFAULT_OFFSETS: Record<string, number> = {
  'moscow mule:::bad bunny': -5.8,
  'titi me pregunto:::bad bunny': -12.5,
  'me porto bonito:::bad bunny': -6.5,
  'me porto bonito:::bad bunny & chencho corleone': -6.5,
  'dakiti:::bad bunny': -7.5,
  'dakiti:::bad bunny x jhay cortez': -7.5,
};

/**
 * Normalizes title + artist for key matching
 */
export function normalizeTrackKey(title: string, artist?: string): string {
  const cleanTitle = (title || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const cleanArtist = (artist || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return `${cleanTitle}:::${cleanArtist}`;
}

/**
 * Extracts clean 11-char YouTube ID from track.id or parameter
 */
export function extractCleanVideoId(trackId?: string, explicitVideoId?: string | null): string | null {
  if (explicitVideoId && /^[a-zA-Z0-9_-]{11}$/.test(explicitVideoId)) {
    return explicitVideoId;
  }
  if (!trackId) return null;
  if (trackId.startsWith('yt-')) {
    const raw = trackId.replace('yt-', '').split('-')[0].split('_')[0];
    if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) return raw;
  }
  return null;
}

// One-time automatic reset of experimental test offsets to ensure factory calibrated sync
if (typeof window !== 'undefined') {
  try {
    if (localStorage.getItem('jmmusic_sync_calibrated_v3') !== 'true') {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('jmmusic_offset_')) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
      localStorage.setItem('jmmusic_sync_calibrated_v3', 'true');
    }
  } catch {}
}

/**
 * Gets the effective timing offset for a track (in seconds)
 * Precedence:
 * 1. User manual calibration in localStorage by trackId
 * 2. User manual calibration in localStorage by videoId
 * 3. User manual calibration in localStorage by normalized(title:::artist)
 * 4. Built-in video default offset (e.g. music video intro compensation)
 * 5. Built-in track default offset
 * 6. 0.0s default
 */
export function getTrackTimingOffset(
  trackId: string,
  title: string,
  artist: string,
  explicitVideoId?: string | null
): number {
  const videoId = extractCleanVideoId(trackId, explicitVideoId);
  const normKey = normalizeTrackKey(title, artist);

  try {
    // 1. Stored by exact trackId
    const storedById = localStorage.getItem(`jmmusic_offset_${trackId}`);
    if (storedById !== null) {
      const val = parseFloat(storedById);
      if (!isNaN(val)) return val;
    }

    // 2. Stored by videoId
    if (videoId) {
      const storedByVid = localStorage.getItem(`jmmusic_offset_vid_${videoId}`);
      if (storedByVid !== null) {
        const val = parseFloat(storedByVid);
        if (!isNaN(val)) return val;
      }
    }

    // 3. Stored by normalized title & artist
    const storedByTitle = localStorage.getItem(`jmmusic_offset_title_${normKey}`);
    if (storedByTitle !== null) {
      const val = parseFloat(storedByTitle);
      if (!isNaN(val)) return val;
    }
  } catch {}

  // 4. Built-in video offset (music video intro compensations)
  if (videoId && typeof KNOWN_VIDEO_OFFSETS[videoId] === 'number') {
    return KNOWN_VIDEO_OFFSETS[videoId];
  }

  // 5. Built-in track offset
  if (typeof KNOWN_TRACK_DEFAULT_OFFSETS[normKey] === 'number') {
    return KNOWN_TRACK_DEFAULT_OFFSETS[normKey];
  }

  return 0.0;
}

/**
 * Saves a timing offset for a track across all keys and notifies all open components
 */
export function saveTrackTimingOffset(
  trackId: string,
  title: string,
  artist: string,
  offset: number,
  explicitVideoId?: string | null
): void {
  const rounded = Number(offset.toFixed(2));
  const videoId = extractCleanVideoId(trackId, explicitVideoId);
  const normKey = normalizeTrackKey(title, artist);

  try {
    localStorage.setItem(`jmmusic_offset_${trackId}`, rounded.toString());
    if (videoId) {
      localStorage.setItem(`jmmusic_offset_vid_${videoId}`, rounded.toString());
    }
    localStorage.setItem(`jmmusic_offset_title_${normKey}`, rounded.toString());
  } catch {}

  // Dispatch global event for instant reactive update in NowPlayingView and BottomLyricsDrawer
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('jmmusic_offset_updated', {
        detail: { trackId, videoId, normKey, offset: rounded }
      })
    );
  }
}

/**
 * Resets the timing offset for a track back to factory default
 */
export function resetTrackTimingOffset(
  trackId: string,
  title: string,
  artist: string,
  explicitVideoId?: string | null
): void {
  const videoId = extractCleanVideoId(trackId, explicitVideoId);
  const normKey = normalizeTrackKey(title, artist);

  try {
    localStorage.removeItem(`jmmusic_offset_${trackId}`);
    if (videoId) {
      localStorage.removeItem(`jmmusic_offset_vid_${videoId}`);
    }
    localStorage.removeItem(`jmmusic_offset_title_${normKey}`);
  } catch {}

  // Determine standard default
  let fallback = 0.0;
  if (videoId && typeof KNOWN_VIDEO_OFFSETS[videoId] === 'number') {
    fallback = KNOWN_VIDEO_OFFSETS[videoId];
  } else if (typeof KNOWN_TRACK_DEFAULT_OFFSETS[normKey] === 'number') {
    fallback = KNOWN_TRACK_DEFAULT_OFFSETS[normKey];
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('jmmusic_offset_updated', {
        detail: { trackId, videoId, normKey, offset: fallback }
      })
    );
  }
}
