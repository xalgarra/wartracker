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
    .select('brave_api_key')
    .maybeSingle()

  body.innerHTML = `
    <div class="settings-section">
      <div class="settings-section-title">Fotos automáticas</div>
      <p class="settings-section-desc">
        Al añadir una mini sin foto, la app busca automáticamente una imagen via
        <a class="settings-link" href="https://api.search.brave.com" target="_blank" rel="noopener">
          Brave Search API
        </a>
        (gratuita, 2000 búsquedas/mes sin tarjeta).
      </p>
      <div class="settings-field">
        <label class="settings-label" for="settings-brave-key">API Key</label>
        <input id="settings-brave-key" class="settings-input" type="password"
          placeholder="BSA…" value="${escapeHtml(data?.brave_api_key || '')}"
          autocomplete="off">
      </div>
    </div>
  `

  document.getElementById('settings-save')?.addEventListener('click', guardarSettings, { once: true })
}

async function guardarSettings() {
  const key = document.getElementById('settings-brave-key')?.value.trim() || null

  const btn = document.getElementById('settings-save')
  if (btn) btn.disabled = true

  const { data: { user } } = await db.auth.getUser()
  const { error } = await db.from('user_settings').upsert(
    { user_id: user.id, brave_api_key: key },
    { onConflict: 'user_id' }
  )

  if (btn) btn.disabled = false
  if (error) { mostrarError('Error guardando ajustes'); return }

  invalidateSettingsCache()
  mostrarExito('Ajustes guardados ✓')
  cerrarSettings()
}
