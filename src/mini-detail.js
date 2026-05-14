import { db } from './db.js'
import { state, loadMiniPaints } from './state.js'
import { STATUSES } from './constants.js'
import { escapeHtml } from './utils.js'
import { cambiarStatusRapido } from './minis.js'
import { mostrarError } from './toast.js'
import { getPlaceholderHue, getInitials } from './placeholder.js'

const STATUS_LABEL = Object.fromEntries(STATUSES.map(s => [s.value, s.label]))
const STATUS_ORDER_ARR = STATUSES.map(s => s.value)

let currentMini = null

export async function abrirDetalleMini(id) {
  const vista = document.getElementById('vista-mini-detail')
  if (!vista) return

  state._detalleTabOrigen = state.tabActual

  let mini = (state.minisFull || []).find(m => m.id === id)
    || (state.minisActuales || []).find(m => m.id === id)

  if (!mini) {
    const { data, error } = await db
      .from('minis')
      .select('id, name, factions, status, qty, models, photo_url, notes, paint_progress')
      .eq('id', id)
      .single()
    if (error || !data) { mostrarError('Mini no encontrada'); return }
    mini = data
  }

  currentMini = { ...mini }
  renderDetalle()
  bindDetalleIfNeeded()
  loadMiniPaints(id).then(() => renderPaintsSection(id)).catch(() => {
    const el = document.getElementById('md-paints-content')
    if (el) el.innerHTML = '<span class="md-paints-empty">No se pudieron cargar las pinturas</span>'
  })
}

export function cerrarDetalleMini() {
  const vista = document.getElementById('vista-mini-detail')
  if (vista) vista.style.display = 'none'
  currentMini = null
}

// ─── Render ────────────────────────────────────────────────────

function renderDetalle() {
  const vista = document.getElementById('vista-mini-detail')
  if (!vista || !currentMini) return

  const mini = currentMini
  const faction = (mini.factions || [])[0] || ''
  const gameSlug = getGameSlug(mini, faction)
  const gameName = state.games?.find(g => g.slug === gameSlug)?.name || gameSlug || ''
  const pts = getPts(mini)
  const models = (mini.models != null ? mini.models : 1) * mini.qty

  const currentIdx = STATUS_ORDER_ARR.indexOf(mini.status)
  const progressPct = currentIdx <= 0 ? 0 : (currentIdx / (STATUS_ORDER_ARR.length - 1)) * 100

  const stepsHtml = STATUS_ORDER_ARR.map((s, i) => {
    const cls = i < currentIdx ? 'done' : i === currentIdx ? 'current' : ''
    return `
      <div class="md-step ${cls}">
        <button class="md-step-circle" data-action="cambiar-status" data-status="${s}">
          ${i < currentIdx ? '✓' : i + 1}
        </button>
        <div class="md-step-label">${STATUS_LABEL[s]}</div>
      </div>
    `
  }).join('')

  const prevStatus = currentIdx > 0 ? STATUS_ORDER_ARR[currentIdx - 1] : null
  const nextStatus = currentIdx < STATUS_ORDER_ARR.length - 1 ? STATUS_ORDER_ARR[currentIdx + 1] : null

  vista.innerHTML = `
    <div class="md-head">
      <button class="md-back" data-action="cerrar-detalle">‹</button>
      <button class="md-back" data-action="editar-mini" data-mini-id="${mini.id}">⋯</button>
    </div>

    <div class="md-hero${mini.photo_url ? '' : ' md-hero--placeholder'}"
         ${!mini.photo_url ? `style="--ph-hue:${getPlaceholderHue(faction, mini.name)}"` : ''}>
      ${mini.photo_url
        ? `<img class="md-hero-img" src="${escapeHtml(mini.photo_url)}" alt="">`
        : `<span class="md-hero-initials">${getInitials(mini.name)}</span>`}
      <div class="md-hero-overlay"></div>
      <div class="md-hero-text">
        <div class="md-hero-name">${escapeHtml(mini.name)}</div>
        <div class="md-hero-fac">${escapeHtml(faction)}${gameName ? ' · ' + escapeHtml(gameName) : ''}</div>
      </div>
    </div>

    <div class="md-status-card">
      <div class="md-status-label">Estado</div>
      <div class="md-step-rail">
        <div class="md-rail-line"></div>
        <div class="md-rail-fill" style="width:calc(${progressPct}%)"></div>
        ${stepsHtml}
      </div>
      <div class="md-step-actions">
        ${prevStatus
          ? `<button class="md-action-back" data-action="cambiar-status" data-status="${prevStatus}">← ${STATUS_LABEL[prevStatus]}</button>`
          : '<span></span>'}
        ${nextStatus
          ? `<button class="md-action-next" data-action="cambiar-status" data-status="${nextStatus}">${STATUS_LABEL[nextStatus]} →</button>`
          : '<span></span>'}
      </div>
    </div>

    <div class="md-stats">
      <div class="md-stat"><div class="md-stat-v">${mini.qty}</div><div class="md-stat-l">cajas</div></div>
      <div class="md-stat"><div class="md-stat-v">${models}</div><div class="md-stat-l">modelos</div></div>
      <div class="md-stat"><div class="md-stat-v">${pts || '—'}</div><div class="md-stat-l">pts</div></div>
    </div>

    <div class="md-section" id="md-paints-section">
      <div class="md-section-header-row">
        <div class="md-section-h">Pinturas en uso</div>
        <button class="md-link-action" data-action="save-recipe" style="display:none">↗ Guardar como receta</button>
      </div>
      <div id="md-paints-content">
        <span class="md-paints-loading">Cargando…</span>
      </div>
    </div>

    ${mini.notes ? `
    <div class="md-section">
      <div class="md-section-h">Notas</div>
      <div class="md-notes">${escapeHtml(mini.notes)}</div>
    </div>
    ` : ''}
  `

  vista.style.display = 'block'
}

function bindDetalleIfNeeded() {
  const vista = document.getElementById('vista-mini-detail')
  if (!vista || vista.dataset.bound === '1') return
  vista.dataset.bound = '1'

  vista.addEventListener('click', async e => {
    const el = e.target.closest('[data-action]')
    if (!el) return
    const { action } = el.dataset

    if (action === 'cerrar-detalle') {
      cerrarDetalleMini()

    } else if (action === 'editar-mini') {
      const { abrirEdicion } = await import('./mini-modal.js')
      abrirEdicion(currentMini.id)

    } else if (action === 'cambiar-status') {
      const nuevoStatus = el.dataset.status
      if (!nuevoStatus || !currentMini || nuevoStatus === currentMini.status) return
      await cambiarStatusRapido(currentMini.id, nuevoStatus)
      currentMini = { ...currentMini, status: nuevoStatus }
      updateCache(currentMini.id, { status: nuevoStatus })
      renderDetalle()
      renderPaintsSection(currentMini.id)

    } else if (action === 'open-paint-link') {
      if (!currentMini) return
      const { abrirPaintLink } = await import('./paint-link-modal.js')
      abrirPaintLink(currentMini.id)

    } else if (action === 'remove-mini-paint') {
      if (!currentMini) return
      const { removeMiniPaint } = await import('./mini-paints.js')
      removeMiniPaint(currentMini.id, el.dataset.paintId)
    }
  })
}

// ─── Pinturas asociadas ─────────────────────────────────────────

function renderPaintsSection(miniId) {
  const container = document.getElementById('md-paints-content')
  if (!container) return

  const saveBtn = document.querySelector('#md-paints-section .md-link-action')
  const paints = state.miniPaints[miniId] || []

  if (!paints.length) {
    if (saveBtn) saveBtn.style.display = 'none'
    container.innerHTML = `
      <button class="md-paints-empty-card" data-action="open-paint-link">
        <span class="md-paints-empty-plus">＋</span>
        <span class="md-paints-empty-text">
          <span class="md-paints-empty-title">Añadir pinturas que estás usando</span>
          <span class="md-paints-empty-sub">Desde tu inventario o aplicando una receta</span>
        </span>
      </button>`
    return
  }

  if (saveBtn) saveBtn.style.display = ''

  const chipsHtml = paints.map(p => `
    <div class="md-paint-chip">
      <span class="md-paint-chip-dot" ${p.color_hex ? `style="background:${p.color_hex}"` : ''}></span>
      <span class="md-paint-chip-name">${escapeHtml(p.name)}</span>
      <button class="md-paint-chip-x" data-action="remove-mini-paint" data-paint-id="${p.id}" title="Quitar">×</button>
    </div>`).join('')

  container.innerHTML = `
    <div class="md-paint-chip-row">
      ${chipsHtml}
      <button class="md-paint-chip md-paint-chip--add" data-action="open-paint-link">＋ Añadir</button>
    </div>`
}

export function rerenderMiniDetail(miniId) {
  if (!currentMini || currentMini.id !== miniId) return
  renderPaintsSection(miniId)
}

// ─── Helpers ────────────────────────────────────────────────────

function getPts(mini) {
  for (const faction of (mini.factions || [])) {
    const fc = state.factions?.find(f => f.name === faction)
    if (!fc) continue
    const pts = state.unitMap?.[`${mini.name}|${faction}|${fc.game_slug}`]
    if (pts) return pts * mini.qty
  }
  return 0
}

function getGameSlug(mini, faction) {
  const fc = state.factions?.find(f => f.name === faction)
  return fc?.game_slug || ''
}

function updateCache(id, patch) {
  const idx1 = (state.minisFull || []).findIndex(m => m.id === id)
  if (idx1 >= 0) Object.assign(state.minisFull[idx1], patch)
  const idx2 = (state.minisActuales || []).findIndex(m => m.id === id)
  if (idx2 >= 0) Object.assign(state.minisActuales[idx2], patch)
}
