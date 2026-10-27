export default async (req: Request, _context?: any) => {
  const urlObj = new URL(req.url);
  const track = urlObj.searchParams.get('track')?.trim() || '';
  const artist = urlObj.searchParams.get('artist')?.trim() || '';

  if (!track) {
    return new Response(JSON.stringify({ success: false, error: 'track parameter is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  try {
    const cleanTrack = track.replace(/\(.*?\)|\[.*?\]/g, '').trim();
    const cleanArtist = artist.replace(/\(.*?\)|\[.*?\]/g, '').split(/&|,|feat\.?|ft\.?/i)[0].trim();

    const getUrl = `https://lrclib.net/api/get?track_name=${encodeURIComponent(cleanTrack)}&artist_name=${encodeURIComponent(cleanArtist)}`;
    const resp = await fetch(getUrl, {
      headers: { 'User-Agent': 'JMMUSIC-App/1.0.0' }
    });

    if (resp.ok) {
      const data = await resp.json();
      return new Response(JSON.stringify({ success: true, ...data }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const q = `${cleanTrack} ${cleanArtist}`.trim();
    const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(q)}`;
    const searchResp = await fetch(searchUrl, {
      headers: { 'User-Agent': 'JMMUSIC-App/1.0.0' }
    });

    if (searchResp.ok) {
      const items: any = await searchResp.json();
      if (Array.isArray(items) && items.length > 0) {
        const best = items.find((it: any) => it.syncedLyrics) || items[0];
        return new Response(JSON.stringify({ success: true, ...best }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    return new Response(JSON.stringify({ success: false, error: 'No lyrics found' }), {
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
