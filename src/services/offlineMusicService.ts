import { Track } from '../types/music';

const CACHE_NAME = 'aura-offline-audio-v1';

/**
 * Searches online for an authentic playable audio stream if track.audioUrl is empty
 */
async function resolvePlayableAudioUrl(title: string, artist: string): Promise<string | null> {
  try {
    const q = `${title} ${artist}`.trim();
    const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=song&limit=1`, {
      signal: AbortSignal.timeout(4000)
    });
    if (res.ok) {
      const data = await res.json();
      if (data.results && data.results.length > 0 && data.results[0].previewUrl) {
        return data.results[0].previewUrl;
      }
    }
  } catch {}
  return null;
}

/**
 * Saves a track's audio and cover to the offline browser Cache Storage
 */
export async function saveTrackOffline(track: Track): Promise<boolean> {
  try {
    const trackToSave = { ...track };

    // If audioUrl is missing, attempt to resolve authentic playable stream
    if (!trackToSave.audioUrl || !trackToSave.audioUrl.startsWith('http')) {
      const resolved = await resolvePlayableAudioUrl(trackToSave.title, trackToSave.artist);
      if (resolved) {
        trackToSave.audioUrl = resolved;
      }
    }

    // 1. Always save track metadata and ID to localStorage
    const savedTracks = getOfflineTrackIds();
    if (!savedTracks.includes(trackToSave.id)) {
      localStorage.setItem('aura_offline_tracks', JSON.stringify([...savedTracks, trackToSave.id]));
    }
    localStorage.setItem(`aura_track_meta_${trackToSave.id}`, JSON.stringify(trackToSave));

    // 2. Cache audio & cover in browser CacheStorage if available
    if ('caches' in window) {
      try {
        const cache = await caches.open(CACHE_NAME);

        // Cache the audio file if available
        if (trackToSave.audioUrl && trackToSave.audioUrl.startsWith('http')) {
          const audioRes = await fetch(trackToSave.audioUrl, { mode: 'cors' }).catch(() => null);
          if (audioRes && audioRes.ok) {
            await cache.put(trackToSave.audioUrl, audioRes);
          }
        }

        // Cache the cover
        if (trackToSave.coverUrl && trackToSave.coverUrl.startsWith('http')) {
          const coverRes = await fetch(trackToSave.coverUrl, { mode: 'cors' }).catch(() => null);
          if (coverRes && coverRes.ok) {
            await cache.put(trackToSave.coverUrl, coverRes);
          }
        }
      } catch (cacheErr) {
        console.warn('CacheStorage offline cache notice:', cacheErr);
      }
    }

    return true;
  } catch (err) {
    console.error('Error saving track offline:', err);
    return false;
  }
}

/**
 * Downloads the actual audio file (.mp3 / .m4a) directly to user's device downloads folder
 */
export async function downloadAudioFileToDevice(track: Track): Promise<boolean> {
  try {
    let audioUrl = track.audioUrl;
    if (!audioUrl || !audioUrl.startsWith('http')) {
      const resolved = await resolvePlayableAudioUrl(track.title, track.artist);
      if (resolved) {
        audioUrl = resolved;
      }
    }

    if (!audioUrl || !audioUrl.startsWith('http')) {
      return false;
    }

    const response = await fetch(audioUrl);
    if (!response.ok) return false;

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    const sanitizedName = `${track.artist} - ${track.title}`.replace(/[\\/:*?"<>|]/g, '_');
    a.download = `${sanitizedName}.m4a`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    return true;
  } catch (err) {
    console.error('Error downloading audio file to device:', err);
    return false;
  }
}

/**
 * Checks if a track is available offline
 */
export function isTrackCachedOffline(trackId: string): boolean {
  const savedTracks = getOfflineTrackIds();
  return savedTracks.includes(trackId);
}

/**
 * Gets list of offline track IDs
 */
export function getOfflineTrackIds(): string[] {
  try {
    const raw = localStorage.getItem('aura_offline_tracks');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Retrieves all offline saved tracks
 */
export function getAllOfflineTracks(): Track[] {
  const ids = getOfflineTrackIds();
  const tracks: Track[] = [];
  for (const id of ids) {
    try {
      const raw = localStorage.getItem(`aura_track_meta_${id}`);
      if (raw) {
        tracks.push(JSON.parse(raw));
      }
    } catch {}
  }
  return tracks;
}

/**
 * Removes track from offline cache
 */
export async function removeTrackOffline(trackId: string): Promise<void> {
  const ids = getOfflineTrackIds().filter(id => id !== trackId);
  localStorage.setItem('aura_offline_tracks', JSON.stringify(ids));
  const rawMeta = localStorage.getItem(`aura_track_meta_${trackId}`);
  if (rawMeta) {
    try {
      const track: Track = JSON.parse(rawMeta);
      if ('caches' in window) {
        const cache = await caches.open(CACHE_NAME);
        if (track.audioUrl) await cache.delete(track.audioUrl);
      }
    } catch {}
  }
  localStorage.removeItem(`aura_track_meta_${trackId}`);
}
