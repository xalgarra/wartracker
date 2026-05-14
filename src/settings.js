import { db } from './db.js'
import { escapeHtml } from './utils.js'
import { mostrarError, mostrarExito } from './toast.js'
import { invalidateSettingsCache } from './photo-search.js'

export function abrirSettings() {
  renderSettings()
  document.getElementById('modal-settings-bg')?.classList.add('open')
}

export function cerrarSettings() {
  document.getElementById('modal-settings-bg')?.classList.remove('open')
}

async function renderSettings() {
  const body = document.getElementById('settings-body')
  if (!body) return
  body.innerHTML = '<div class="settings-loading">Cargando…</div>'

  const { data } = await db.from('user_settings')
    .select('google_cse_key, google_cse_cx')
    .maybeSingle()

  body.innerHTML = `
    <div class="settings-section">
      <div class="settings-section-title">Fotos automáticas</div>
      <p class="settings-section-desc">
        Al añadir una mini sin foto, la app busca automáticamente una imagen.
        Requiere una
        <a class="settings-link" href="https://programmablesearchengine.google.com/" target="_blank" rel="noopener">
          Google Programmable Search Engine
        </a>
        (gratuita, 100 búsquedas/día).
      </p>
      <div class="settings-field">
        <label class="settings-label" for="settings-cse-key">API Key</label>
        <input id="settings-cse-key" class="settings-input" type="password"
          placeholder="AIzaSy…" value="${escapeHtml(data?.google_cse_key || '')}"
          autocomplete="off">
      </div>
      <div class="settings-field">
        <label class="settings-label" for="settings-cse-cx">Search Engine ID (cx)</label>
        <input id="settings-cse-cx" class="settings-input" type="text"
          placeholder="012345678901234567890:xxxxxxx"
          value="${escapeHtml(data?.google_cse_cx || '')}"
          autocomplete="off">
      </div>
    </div>
  `

  // Bind save button (fuera del innerHTML para evitar re-binding)
  document.getElementById('settings-save')?.addEventListener('click', guardarSettings, { once: true })
}

async function guardarSettings() {
  const key = document.getElementById('settings-cse-key')?.value.trim() || null
  const cx  = document.getElementById('settings-cse-cx')?.value.trim()  || null

  const btn = document.getElementById('settings-save')
  if (btn) btn.disabled = true

  const { data: { user } } = await db.auth.getUser()
  const { error } = await db.from('user_settings').upsert(
    { user_id: user.id, google_cse_key: key, google_cse_cx: cx },
    { onConflict: 'user_id' }
  )

  if (btn) btn.disabled = false
  if (error) { mostrarError('Error guardando ajustes'); return }

  invalidateSettingsCache()
  mostrarExito('Ajustes guardados ✓')
  cerrarSettings()
}
