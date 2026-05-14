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
    const apiUrl = `https://www.googleapis.com/customsearch/v1?key=${settings.key}&cx=${settings.cx}&searchType=image&q=${q}&num=1&safe=active&imgType=photo`
    const resp = await fetch(apiUrl)
    if (!resp.ok) return
    const data = await resp.json()
    const imageUrl = data.items?.[0]?.link
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
    state.minisFull = null  // invalidar caché
  } catch (_) { /* quota o red — placeholder se mantiene */ }
}

async function getSettings() {
  if (_settingsCache) return _settingsCache
  const { data } = await db.from('user_settings').select('google_cse_key, google_cse_cx').maybeSingle()
  if (data?.google_cse_key && data?.google_cse_cx) {
    _settingsCache = { key: data.google_cse_key, cx: data.google_cse_cx }
  }
  return _settingsCache || null
}

export function invalidateSettingsCache() {
  _settingsCache = null
}
