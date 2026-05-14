import { db } from './db.js'
import { state } from './state.js'
import { escapeHtml } from './utils.js'
import { mostrarError, mostrarExito } from './toast.js'
import { cargarHome } from './home.js'
import { cargarWishlist } from './wishlist.js'

// Estado del sheet
let qaState = { step: 'pick', selected: null, qty: 1, status: 'comprada', query: '', wishlist: false }

export function abrirQuickAdd() {
  qaState = { step: 'pick', selected: null, qty: 1, status: 'comprada', query: '', wishlist: false }
  renderSheet()
  const backdrop = document.getElementById('qa-backdrop')
  backdrop?.classList.add('open')
  bindIfNeeded()
}

function cerrarQuickAdd() {
  document.getElementById('qa-backdrop')?.classList.remove('open')
}

// ─── Bind (una sola vez) ────────────────────────────────────────

function bindIfNeeded() {
  const backdrop = document.getElementById('qa-backdrop')
  if (!backdrop || backdrop.dataset.bound === '1') return
  backdrop.dataset.bound = '1'

  // Cerrar al tocar el backdrop (fuera del sheet)
  backdrop.addEventListener('click', e => {
    if (e.target === backdrop) cerrarQuickAdd()
  })

  // Delegación de eventos en el contenido del sheet
  document.getElementById('qa-content')?.addEventListener('click', async e => {
    const action = e.target.closest('[data-qa-action]')?.dataset?.qaAction
    if (!action) return

    if (action === 'cerrar') {
      cerrarQuickAdd()

    } else if (action === 'ir-mini-search') {
      qaState.wishlist = e.target.closest('[data-qa-action]').dataset.wishlist === 'true'
      qaState.step = 'mini-search'
      renderSheet()
      setTimeout(() => document.getElementById('qa-search-input')?.focus(), 50)

    } else if (action === 'ir-pick') {
      qaState.step = 'pick'
      renderSheet()

    } else if (action === 'abrir-pintura') {
      cerrarQuickAdd()
      const { abrirModalPintura } = await import('./paint-modal.js')
      abrirModalPintura()

    } else if (action === 'abrir-sesion') {
      cerrarQuickAdd()
      const { abrirModalSession } = await import('./session-modal.js')
      abrirModalSession()

    } else if (action === 'seleccionar-unidad') {
      const idx = Number(e.target.closest('[data-qa-action]').dataset.idx)
      const results = filtrarUnidades(qaState.query)
      if (results[idx]) {
        qaState.selected = results[idx]
        qaState.step = 'mini-confirm'
        renderSheet()
      }

    } else if (action === 'decrement-qty') {
      qaState.qty = Math.max(1, qaState.qty - 1)
      const el = document.getElementById('qa-qty-val')
      if (el) el.textContent = qaState.qty

    } else if (action === 'increment-qty') {
      qaState.qty = Math.min(99, qaState.qty + 1)
      const el = document.getElementById('qa-qty-val')
      if (el) el.textContent = qaState.qty

    } else if (action === 'set-status') {
      qaState.status = e.target.closest('[data-qa-action]').dataset.status
      document.querySelectorAll('.qa-status-chip').forEach(c => {
        c.classList.toggle('active', c.dataset.status === qaState.status)
      })

    } else if (action === 'qa-toggle-wishlist') {
      qaState.wishlist = !qaState.wishlist
      renderSheet()

    } else if (action === 'guardar') {
      await guardarMiniRapido()

    } else if (action === 'guardar-y-editar') {
      await guardarMiniRapido({ abrirDetalle: true })
    }
  })

  // Input de búsqueda con debounce
  document.getElementById('qa-content')?.addEventListener('input', e => {
    if (e.target.id !== 'qa-search-input') return
    qaState.query = e.target.value
    renderResultList()
  })
}

// ─── Render por pasos ───────────────────────────────────────────

function renderSheet() {
  const content = document.getElementById('qa-content')
  if (!content) return

  if (qaState.step === 'pick') {
    content.innerHTML = renderPick()
  } else if (qaState.step === 'mini-search') {
    content.innerHTML = renderMiniSearch()
  } else if (qaState.step === 'mini-confirm') {
    content.innerHTML = renderMiniConfirm()
  }
}

function renderPick() {
  return `
    <div>
      <div class="qa-title">Añadir</div>
      <div class="qa-sub">¿Qué quieres registrar?</div>
    </div>
    <button class="qa-option" data-qa-action="ir-mini-search">
      <div class="qa-option-icon">🛡</div>
      <div class="qa-option-body">
        <div class="qa-option-name">Mini</div>
        <div class="qa-option-desc">Una unidad o caja a tu colección</div>
      </div>
      <span class="qa-option-chev">›</span>
    </button>
    <button class="qa-option" data-qa-action="ir-mini-search" data-wishlist="true">
      <div class="qa-option-icon qa-option-icon--wish">✦</div>
      <div class="qa-option-body">
        <div class="qa-option-name">Mini en wishlist</div>
        <div class="qa-option-desc">Algo que quieres pero todavía no tienes</div>
      </div>
      <span class="qa-option-chev">›</span>
    </button>
    <button class="qa-option" data-qa-action="abrir-pintura">
      <div class="qa-option-icon">🎨</div>
      <div class="qa-option-body">
        <div class="qa-option-name">Pintura</div>
        <div class="qa-option-desc">Un pote nuevo al rack</div>
      </div>
      <span class="qa-option-chev">›</span>
    </button>
    <button class="qa-option" data-qa-action="abrir-sesion">
      <div class="qa-option-icon">⏱</div>
      <div class="qa-option-body">
        <div class="qa-option-name">Sesión de hobby</div>
        <div class="qa-option-desc">Registra cuánto y qué pintaste</div>
      </div>
      <span class="qa-option-chev">›</span>
    </button>
  `
}

function renderMiniSearch() {
  const results = filtrarUnidades(qaState.query)
  return `
    <div>
      <div class="qa-title">${qaState.wishlist ? 'Añadir a wishlist' : 'Añadir mini'}</div>
      <div class="qa-sub">Paso 1 · Busca la unidad</div>
    </div>
    <div class="qa-search-box">
      <span class="qa-search-icon">🔍</span>
      <input id="qa-search-input" class="qa-search-input"
             placeholder="Intercessors, Redemptor…"
             value="${escapeHtml(qaState.query)}" autocomplete="off">
    </div>
    <div class="qa-result-list" id="qa-result-list">
      ${renderResultsHtml(results)}
    </div>
    <button class="qa-link-btn" data-qa-action="cerrar">Cancelar</button>
  `
}

function renderResultList() {
  const list = document.getElementById('qa-result-list')
  if (!list) return
  const results = filtrarUnidades(qaState.query)
  list.innerHTML = renderResultsHtml(results)
}

function renderResultsHtml(results) {
  if (!results.length) {
    return `<div class="qa-empty">${qaState.query ? 'Sin resultados' : 'Escribe para buscar…'}</div>`
  }
  return results.slice(0, 12).map((u, idx) => `
    <div class="qa-result" data-qa-action="seleccionar-unidad" data-idx="${idx}">
      <div class="qa-result-body">
        <div class="qa-result-name">${escapeHtml(u.name)}</div>
        <div class="qa-result-meta">${escapeHtml(u.faction)} · ${escapeHtml(u.game_slug?.toUpperCase() || '')}</div>
      </div>
      <span class="qa-result-pts">${u.points ? u.points + ' pt' : '—'}</span>
    </div>
  `).join('')
}

function renderMiniConfirm() {
  const u = qaState.selected
  if (!u) return ''
  const w = qaState.wishlist
  const statuses = ['comprada', 'montada', 'imprimada', 'pintando', 'pintada']
  const statusLabels = { comprada: 'Comprada', montada: 'Montada', imprimada: 'Imprimada', pintando: 'Pintando', pintada: 'Pintada' }
  return `
    <div>
      <div class="qa-title">${escapeHtml(u.name)}</div>
      <div class="qa-sub">Paso 2 · Confirma y guarda</div>
    </div>
    <button class="qa-wishlist-toggle${w ? ' on' : ''}" data-qa-action="qa-toggle-wishlist" aria-pressed="${w}">
      <span class="qa-wishlist-toggle-glyph">✦</span>
      <span class="qa-wishlist-toggle-body">
        <span class="qa-wishlist-toggle-title">Para mi wishlist</span>
        <span class="qa-wishlist-toggle-sub">${w ? 'No la tienes aún · sin cajas ni estado' : 'Marca si todavía no la tienes'}</span>
      </span>
      <span class="qa-wishlist-toggle-switch"><span class="qa-wishlist-toggle-knob"></span></span>
    </button>
    <div class="qa-confirm-card">
      <div class="qa-field">
        <span class="qa-field-label">Facción</span>
        <span class="qa-field-value">${escapeHtml(u.faction)}</span>
      </div>
      ${!w ? `
      <div class="qa-field">
        <span class="qa-field-label">Cajas</span>
        <div class="qa-stepper">
          <button class="qa-stepper-btn" data-qa-action="decrement-qty">−</button>
          <span id="qa-qty-val" class="qa-stepper-val">${qaState.qty}</span>
          <button class="qa-stepper-btn" data-qa-action="increment-qty">+</button>
        </div>
      </div>` : ''}
      <div class="qa-field">
        <span class="qa-field-label">Puntos</span>
        <span class="qa-field-value">${u.points ? u.points + ' pt' : '—'}</span>
      </div>
    </div>
    ${!w ? `
    <div>
      <div class="qa-status-label">Estado inicial</div>
      <div class="qa-status-row">
        ${statuses.map(s => `
          <button class="qa-status-chip${s === qaState.status ? ' active' : ''}"
                  data-qa-action="set-status" data-status="${s}">
            ${statusLabels[s]}
          </button>
        `).join('')}
      </div>
    </div>` : ''}
    <button class="qa-primary-btn" id="qa-btn-guardar" data-qa-action="guardar">
      ${w ? 'Añadir a wishlist' : 'Guardar'}
    </button>
    <button class="qa-link-btn" data-qa-action="guardar-y-editar">Añadir más detalles después</button>
  `
}

// ─── Guardar ────────────────────────────────────────────────────

async function guardarMiniRapido({ abrirDetalle = false } = {}) {
  const btn = document.getElementById('qa-btn-guardar')
  if (btn) btn.disabled = true

  const u = qaState.selected
  if (!u) return

  const fc = state.factions?.find(f => f.name === u.faction)
  if (!fc) { mostrarError('Facción no encontrada'); if (btn) btn.disabled = false; return }

  const w = qaState.wishlist
  const { data, error } = await db.from('minis').insert({
    name:     u.name,
    factions: [u.faction],
    status:   w ? 'wishlist' : qaState.status,
    qty:      w ? 1 : qaState.qty,
  }).select('id').single()

  if (error) {
    mostrarError('Error al guardar: ' + error.message)
    if (btn) btn.disabled = false
    return
  }

  mostrarExito(w ? `${u.name} añadida a wishlist ✓` : `${u.name} añadida ✓`)
  cerrarQuickAdd()

  // Invalidar caché
  state.minisFull = null

  if (abrirDetalle && data?.id) {
    const { abrirDetalleMini } = await import('./mini-detail.js')
    await abrirDetalleMini(data.id)
  } else {
    if (w) {
      if (state.tabActual === 'wishlist') cargarWishlist()
    } else {
      if (state.tabActual === 'hoy') cargarHome()
    }
  }
}

// ─── Filtrado ───────────────────────────────────────────────────

function filtrarUnidades(query) {
  if (!query?.trim()) return []
  const q = query.toLowerCase()
  return (state.units || [])
    .filter(u => u.name.toLowerCase().includes(q))
    .slice(0, 20)
}
