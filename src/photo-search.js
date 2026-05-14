import { db } from './db.js'
import { state } from './state.js'
import { compressImage } from './utils.js'

let _settingsCache = null

// Llamar tras crear una mini sin foto — fire & forget, no bloquea la UI
export async function fetchAndSaveMiniPhoto(miniId, unitName, faction) {
  const settings = await getSettings()
  if (!settings) return

  try {
    const q = encodeURIComponent(`${unitName} ${faction} warhammer miniature painted`)
    const resp = await fetch(
      `https://api.search.brave.com/res/v1/images/search?q=${q}&count=1&safesearch=moderate`,
      { headers: { 'Accept': 'application/json', 'X-Subscription-Token': settings.key } }
    )
    if (!resp.ok) return
    const data = await resp.json()
    const imageUrl = data.results?.[0]?.thumbnail?.src || data.results?.[0]?.url
    if (!imageUrl) return

    // Intentar descargar, comprimir y subir a nuestro storage
    // Si hay CORS, usar la URL directamente como fallback
    let finalUrl = imageUrl
    try {
      const imgResp = await fetch(imageUrl)
      if (imgResp.ok) {
        const blob = await imgResp.blob()
        const file = new File([blob], 'auto.jpg', { type: 'image/jpeg' })
        const compressed = await compressImage(file)
        const path = `${miniId}.jpg`
        const { error: upErr } = await db.storage.from('mini-photos').upload(path, compressed, { upsert: true })
        if (!upErr) {
          finalUrl = db.storage.from('mini-photos').getPublicUrl(path).data.publicUrl
        }
      }
    } catch (_) { /* CORS o red — usar URL externa directamente */ }

    await db.from('minis').update({ photo_url: finalUrl }).eq('id', miniId)
    state.minisFull = null
  } catch (_) { /* quota o red — placeholder se mantiene */ }
}

async function getSettings() {
  if (_settingsCache) return _settingsCache
  const { data } = await db.from('user_settings').select('brave_api_key').maybeSingle()
  if (data?.brave_api_key) {
    _settingsCache = { key: data.brave_api_key }
  }
  return _settingsCache || null
}

export function invalidateSettingsCache() {
  _settingsCache = null
}
