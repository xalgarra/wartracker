import { state } from './state.js'
import { nearestPaints } from './color-distance.js'
import { escapeHtml } from './utils.js'
import { abrirEdicionPintura } from './paint-modal.js'

let _bound      = false
let _refHex     = '#888888'
let _refLabel   = ''     // texto descriptivo (e.g., "Sustituto de Mephiston Red")
let _excludeId  = null   // pintura a excluir (típico: la que estamos sustituyendo)

const HEX_RE = /^#[0-9a-f]{6}$/i

// ---------------------------------------------------------------------------
// Apertura / cierre
// ---------------------------------------------------------------------------

export function abrirColorSearch(initialHex = null, opts = {}) {
  _refHex    = initialHex && HEX_RE.test(initialHex) ? initialHex : '#888888'
  _refLabel  = opts.label || ''
  _excludeId = opts.excludeId || null

  document.getElementById('color-search-picker').value = _refHex
  document.getElementById('color-search-hex').value    = _refHex
  document.getElementById('color-search-swatch').style.background = _refHex
  document.getElementById('color-search-instock').checked = opts.onlyInStock !== false  // default true

  const ctx = document.getElementById('color-search-context')
  ctx.innerHTML = _refLabel
    ? `<span class="color-search-context-label">${escapeHtml(_refLabel)}</span>`
    : ''
  ctx.style.display = _refLabel ? 'block' : 'none'

  document.getElementById('color-search-panel').style.display = 'block'
  bindEvents()
  render()

  // Scroll para que se vea el panel
  document.getElementById('color-search-panel').scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export function cerrarColorSearch() {
  document.getElementById('color-search-panel').style.display = 'none'
  _excludeId = null
  _refLabel  = ''
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

function render() {
  const onlyInStock = document.getElementById('color-search-instock').checked
  const results = nearestPaints(_refHex, state.pinturas || [], {
    limit: 10,
    onlyInStock,
    excludeId: _excludeId,
  })

  const list = document.getElementById('color-search-results')
  if (!results.length) {
    list.innerHTML = '<div class="color-search-empty">Sin resultados — comprueba que tus pinturas tengan color asignado</div>'
    return
  }

  list.innerHTML = results.map(({ paint, distance, similarity }) => {
    const stockBadge = paint.in_stock
      ? ''
      : '<span class="badge badge-sin-stock">Sin stock</span>'
    const qtyBadge = (paint.quantity || 1) > 1
      ? `<span class="badge-qty">×${paint.quantity}</span>`
      : ''
    const matchLevel = distance < 5  ? 'great'
                     : distance < 12 ? 'good'
                     : distance < 25 ? 'ok' : 'far'
    return `
      <div class="color-search-row color-search-row--${matchLevel}" data-action="open-paint" data-paint-id="${paint.id}">
        <div class="color-search-row-swatches">
          <div class="color-search-swatch-target" style="background:${_refHex}"></div>
          <div class="color-search-swatch-arrow">→</div>
          <div class="paint-swatch" style="background:${paint.color_hex}"></div>
        </div>
        <div class="color-search-row-info">
          <span class="color-search-row-name">${escapeHtml(paint.name)}</span>
          <span class="color-search-row-brand">${escapeHtml(paint.brand)} · ${escapeHtml(paint.type)}</span>
        </div>
        <div class="color-search-row-meta">
          <span class="color-search-similarity color-search-similarity--${matchLevel}">${similarity}%</span>
          <span class="color-search-delta">ΔE ${distance.toFixed(1)}</span>
          ${qtyBadge}
          ${stockBadge}
        </div>
      </div>
    `
  }).join('')
}

// ---------------------------------------------------------------------------
// Eventos (una sola vez)
// ---------------------------------------------------------------------------

function bindEvents() {
  if (_bound) return
  _bound = true

  const picker  = document.getElementById('color-search-picker')
  const hexIn   = document.getElementById('color-search-hex')
  const swatch  = document.getElementById('color-search-swatch')
  const instock = document.getElementById('color-search-instock')

  picker.addEventListener('input', e => {
    _refHex = e.target.value
    hexIn.value = _refHex
    swatch.style.background = _refHex
    render()
  })

  hexIn.addEventListener('input', e => {
    let v = e.target.value.trim()
    if (!v.startsWith('#')) v = '#' + v
    if (HEX_RE.test(v)) {
      _refHex = v.toLowerCase()
      picker.value = _refHex
      swatch.style.background = _refHex
      render()
    }
  })

  instock.addEventListener('change', render)

  document.getElementById('btn-color-search-close')?.addEventListener('click', cerrarColorSearch)

  document.getElementById('color-search-results')?.addEventListener('click', e => {
    const row = e.target.closest('[data-action="open-paint"]')
    if (!row) return
    abrirEdicionPintura(Number(row.dataset.paintId))
  })
}
