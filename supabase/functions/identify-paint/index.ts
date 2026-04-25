import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const { image, mediaType = 'image/jpeg' } = await req.json()
    if (!image) return new Response(JSON.stringify({ error: 'No image' }), { status: 400, headers: CORS })

    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) return new Response(JSON.stringify({ error: 'API key not configured' }), { status: 500, headers: CORS })

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [
            { inline_data: { mime_type: mediaType, data: image } },
            { text: 'This is a Citadel miniature paint pot. Read the paint name exactly as printed on the label. Reply with ONLY the paint name, nothing else. If you cannot read it clearly, reply with "?".' }
          ]}]
        })
      }
    )

    const data = await res.json()
    const name = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '?'

    return new Response(JSON.stringify({ name }), {
      headers: { ...CORS, 'Content-Type': 'application/json' }
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: CORS })
  }
})
