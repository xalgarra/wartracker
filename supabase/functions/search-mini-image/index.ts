import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const { query, braveKey } = await req.json()
    if (!query || !braveKey) {
      return new Response(JSON.stringify({ url: null }), { headers: { ...CORS, 'Content-Type': 'application/json' } })
    }

    const q = encodeURIComponent(query)
    const resp = await fetch(
      `https://api.search.brave.com/res/v1/images/search?q=${q}&count=1&safesearch=strict`,
      { headers: { 'Accept': 'application/json', 'X-Subscription-Token': braveKey } }
    )

    if (!resp.ok) {
      const errBody = await resp.text()
      console.error('Brave error', resp.status, errBody)
      return new Response(JSON.stringify({ url: null }), { headers: { ...CORS, 'Content-Type': 'application/json' } })
    }

    const data = await resp.json()
    console.log('Brave results count:', data.results?.length, 'first:', JSON.stringify(data.results?.[0]))
    const url = data.results?.[0]?.properties?.url || data.results?.[0]?.thumbnail?.src || null

    return new Response(JSON.stringify({ url }), {
      headers: { ...CORS, 'Content-Type': 'application/json' }
    })
  } catch (e) {
    return new Response(JSON.stringify({ url: null }), { status: 500, headers: CORS })
  }
})
