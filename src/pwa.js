import { registerSW } from 'virtual:pwa-register'

// ---------------------------------------------------------------------------
// Banner offline persistente
// ---------------------------------------------------------------------------

function ensureOfflineBanner() {
  let banner = document.getElementById('offline-banner')
  if (banner) return banner
  banner = document.createElement('div')
  banner.id = 'offline-banner'
  banner.className = 'offline-banner'
  banner.innerHTML = `
    <span class="offline-banner-dot"></span>
    <span class="offline-banner-text">Sin conexión · puede que veas datos del último uso</span>
  `
  document.body.appendChild(banner)
  return banner
}

function setOnline(isOnline) {
  ensureOfflineBanner()
  document.body.classList.toggle('is-offline', !isOnline)
}

// ---------------------------------------------------------------------------
// Update prompt
// ---------------------------------------------------------------------------

function showUpdatePrompt(onAccept) {
  if (document.getElementById('pwa-update-prompt')) return
  const card = document.createElement('div')
  card.id = 'pwa-update-prompt'
  card.className = 'pwa-update-prompt'
  card.innerHTML = `
    <div class="pwa-update-prompt-info">
      <strong>Nueva versión disponible</strong>
      <span>Recarga para actualizar.</span>
    </div>
    <div class="pwa-update-prompt-actions">
      <button class="btn-cancel" data-pwa-dismiss>Después</button>
      <button class="btn-primary" data-pwa-reload>Recargar</button>
    </div>
  `
  document.body.appendChild(card)
  card.addEventListener('click', e => {
    if (e.target.closest('[data-pwa-reload]')) onAccept()
    else if (e.target.closest('[data-pwa-dismiss]')) card.remove()
  })
}

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

export function initPWA() {
  window.addEventListener('online',  () => setOnline(true))
  window.addEventListener('offline', () => setOnline(false))
  setOnline(navigator.onLine)

  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() { showUpdatePrompt(() => updateSW(true)) },
    onOfflineReady() { /* silencioso: la UI de online/offline se encarga */ },
    onRegisterError(err) { console.warn('SW register error:', err) },
  })
}
