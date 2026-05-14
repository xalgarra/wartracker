import { db } from './db.js'
import { state } from './state.js'
import { compressImage } from './utils.js'

let _settingsCache = null

// Llamar tras crear una mini sin foto — fire & forget, no bloquea la UI
export async function fetchAndSaveMiniPhoto(miniId, unitName, game) {
  const settings = await getSettings()
  if (!settings) return

  try {
    const query = `${unitName} ${game} warhammer`
    const { data, error } = await db.functions.invoke('search-mini-image', {
      body: { query, braveKey: settings.key },
    })
    if (error || !data?.url) return

    const imageUrl = data.url

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
    window.dispatchEvent(new CustomEvent('wt:photo-saved', { detail: { miniId } }))
  } catch (_) { /* quota o red — placeholder se mantiene */ }
}

async function getSettings() {
  if (_settingsCache) return _settingsCache
  const { data } = await db.from('user_settings').select('brave_api_key').maybeSingle()
  if (data?.brave_api_key) _settingsCache = { key: data.brave_api_key }
  return _settingsCache || null
}

export function invalidateSettingsCache() {
  _settingsCache = null
}
