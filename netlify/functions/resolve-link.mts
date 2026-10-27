export default async (req: Request, _context?: any) => {
  const urlObj = new URL(req.url);
  const rawUrl = urlObj.searchParams.get('url')?.trim() || '';

  if (!rawUrl) {
    return new Response(JSON.stringify({ success: false, error: 'url parameter is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
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

    const resolvedTracks: any[] = [];
    let resolvedPlaylistTitle = 'Lista de YouTube Music';

    if (playlistId) {
      try {
        const cleanPid = playlistId.replace(/^VL/, '');
        const browseId = `VL${cleanPid}`;

        const ytRes = await fetch('https://www.youtube.com/youtubei/v1/browse?prettyPrint=false', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
          },
          body: JSON.stringify({
            context: { client: { clientName: 'WEB', clientVersion: '2.20240313.01.00', hl: 'es', gl: 'US' } },
            browseId
          })
        });

        if (ytRes.ok) {
          const browseData: any = await ytRes.json();
          const seenIds = new Set<string>();

          const extract = (obj: any) => {
            if (!obj || typeof obj !== 'object') return;
            if (obj.lockupViewModel && obj.lockupViewModel.contentId) {
              const l = obj.lockupViewModel;
              const vid = l.contentId;
              if (vid && vid.length === 11 && !seenIds.has(vid)) {
                seenIds.add(vid);
                const title = l.metadata?.lockupMetadataViewModel?.title?.content || 'Canción';
                const parts = l.metadata?.lockupMetadataViewModel?.metadata?.contentMetadataViewModel?.metadataRows?.[0]?.metadataParts;
                const artist = parts?.[0]?.text?.content || 'Artista';

                resolvedTracks.push({
                  id: `yt-${vid}-${resolvedTracks.length}`,
                  title,
                  artist,
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
            if (obj.playlistVideoRenderer && obj.playlistVideoRenderer.videoId) {
              const p = obj.playlistVideoRenderer;
              const vid = p.videoId;
              if (vid && vid.length === 11 && !seenIds.has(vid)) {
                seenIds.add(vid);
                const title = p.title?.runs?.[0]?.text || 'Canción';
                const artist = p.shortBylineText?.runs?.[0]?.text || 'Artista';
                resolvedTracks.push({
                  id: `yt-${vid}-${resolvedTracks.length}`,
                  title,
                  artist,
                  album: resolvedPlaylistTitle,
                  duration: parseInt(p.lengthSeconds || '210', 10) || 210,
                  audioUrl: '',
                  coverUrl: `https://img.youtube.com/vi/${vid}/hqdefault.jpg`,
                  accentColor: '#6366f1',
                  genre: 'YouTube Music',
                  plays: 720000,
                  lyrics: []
                });
              }
            }
            for (const k of Object.keys(obj)) extract(obj[k]);
          };

          extract(browseData);
        }
      } catch (err) {
        console.warn('Netlify function playlist error:', err);
      }
    }

    if (resolvedTracks.length === 0 && videoId && /^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      try {
        const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
        const oRes = await fetch(oembedUrl);
        if (oRes.ok) {
          const oData: any = await oRes.json();
          let rawTitle = oData.title || 'Canción YouTube Music';
          let rawAuthor = oData.author_name || 'Artista';

          let title = rawTitle;
          let artist = rawAuthor;
          if (rawTitle.includes(' - ')) {
            const parts = rawTitle.split(' - ');
            artist = parts[0].trim();
            title = parts.slice(1).join(' - ').trim();
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
            coverUrl: oData.thumbnail_url || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
            accentColor: '#6366f1',
            genre: 'YouTube Music Hit',
            plays: 850000,
            lyrics: []
          });
        }
      } catch (err) {
        console.warn('Netlify function oembed error:', err);
      }
    }

    return new Response(JSON.stringify({
      success: resolvedTracks.length > 0,
      playlistTitle: resolvedPlaylistTitle,
      count: resolvedTracks.length,
      tracks: resolvedTracks
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
};
