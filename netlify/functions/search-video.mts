export default async (req: Request, _context?: any) => {
  const urlObj = new URL(req.url);
  const query = urlObj.searchParams.get('q')?.trim() || '';

  if (!query) {
    return new Response(JSON.stringify({ success: false, error: 'Query parameter q is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  try {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query + ' audio')}&sp=EgIQAQ%253D%253D`;
    const resp = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'es-419,es;q=0.9,en;q=0.8'
      }
    });

    const results: any[] = [];
    if (resp.ok) {
      const html = await resp.text();
      const idMatches = [...html.matchAll(/"videoId":"([a-zA-Z0-9_-]{11})"/g)].map(m => m[1]);
      const uniqueIds = Array.from(new Set(idMatches)).slice(0, 20);

      for (const id of uniqueIds) {
        results.push({
          id,
          title: `${query}`,
          artist: 'Artista Oficial',
          duration: 210,
          thumbnail: `https://img.youtube.com/vi/${id}/hqdefault.jpg`
        });
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
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
