import { db } from './db.js'
import { state } from './state.js'
import { escapeHtml } from './utils.js'

let _miniId = null
let _tab = 'inventory'
let _query = ''
let _recipePick = null
let _recipes = []        // cache local — se carga al abrir el tab de recetas
let _recipesLoaded = false
let _bound = false

export function abrirPaintLink(miniId) {
  _miniId = miniId
  _tab = 'inventory'
  _query = ''
  _recipePick = null
  renderSheet()
  document.getElementById('pl-backdrop')?.classList.add('open')
  bindIfNeeded()
  setTimeout(() => document.getElementById('pl-search')?.focus(), 80)
}

function cerrarPaintLink() {
  document.getElementById('pl-backdrop')?.classList.remove('open')
}

// ─── Render ──────────────────────────────────────────────────────────────────

function renderSheet() {
  const content = document.getElementById('pl-content')
  if (!content) return

  if (_recipePick) {
    content.innerHTML = renderRecipePreview()
    return
  }

  content.innerHTML = `
    <div class="pl-header">
      <div class="pl-title">Vincular pinturas</div>
      <button class="pl-close" data-pl-action="close">✕</button>
    </div>
    <div class="pl-tabs">
      <button class="pl-tab${_tab === 'inventory' ? ' active' : ''}" data-pl-action="tab" data-tab="inventory">Inventario</button>
      <button class="pl-tab${_tab === 'recipe' ? ' active' : ''}" data-pl-action="tab" data-tab="recipe">Desde receta</button>
    </div>
    ${_tab === 'inventory' ? renderInventoryTab() : renderRecipeTab()}
  `
}

function renderInventoryTab() {
  const existingIds = new Set((state.miniPaints[_miniId] || []).map(p => p.id))
  const q = _query.toLowerCase()
  const results = q
    ? (state.pinturas || [])
        .filter(p => !existingIds.has(p.id) &&
          (p.name.toLowerCase().includes(q) || (p.brand || '').toLowerCase().includes(q)))
        .slice(0, 12)
    : []

  const resultsHtml = !q
    ? '<div class="pl-empty pl-empty--hint">Escribe para buscar en tu inventario</div>'
    : results.length
      ? results.map(p => `
          <div class="pl-paint-row" data-pl-action="pick-paint" data-paint-id="${p.id}">
            <span class="pl-swatch${p.color_hex ? '' : ' pl-swatch--none'}"
              ${p.color_hex ? `style="background:${p.color_hex}"` : ''}></span>
            <span class="pl-paint-name">${escapeHtml(p.name)}</span>
            <span class="pl-paint-meta">${escapeHtml(p.brand || '')}${p.type ? ' · ' + escapeHtml(p.type) : ''}</span>
            <button class="pl-pick-btn" data-pl-action="pick-paint" data-paint-id="${p.id}">＋</button>
          </div>`).join('')
      : '<div class="pl-empty">Sin resultados</div>'

  return `
    <div class="pl-search-wrap">
      <input id="pl-search" class="pl-search" type="search"
        placeholder="Buscar pintura…" value="${escapeHtml(_query)}" autocomplete="off">
    </div>
    <div class="pl-results">${resultsHtml}</div>
  `
}

function renderRecipeTab() {
  if (!_recipesLoaded) {
    return '<div class="pl-empty">Cargando recetas…</div>'
  }
  if (!_recipes.length) {
    return '<div class="pl-empty">No tienes recetas guardadas</div>'
  }

  return `
    <div class="pl-recipe-list">
      ${_recipes.map(r => {
        const paints = r.recipe_paints || []
        const swatches = paints.slice(0, 8).map(rp =>
          `<span class="pl-swatch${rp.paints?.color_hex ? '' : ' pl-swatch--none'}"
            ${rp.paints?.color_hex ? `style="background:${rp.paints.color_hex}"` : ''}
            title="${escapeHtml(rp.paints?.name || '')}"></span>`
        ).join('')
        return `
          <div class="pl-recipe-row" data-pl-action="pick-recipe" data-recipe-id="${r.id}">
            <div class="pl-recipe-info">
              <span class="pl-recipe-name">${escapeHtml(r.name)}</span>
              <span class="pl-recipe-meta">${paints.length} pintura${paints.length !== 1 ? 's' : ''}</span>
            </div>
            <div class="pl-recipe-swatches">${swatches}</div>
          </div>`
      }).join('')}
    </div>
  `
}

function renderRecipePreview() {
  const r = _recipePick
  const existingIds = new Set((state.miniPaints[_miniId] || []).map(p => p.id))
  const paints = (r.recipe_paints || []).filter(rp => rp.paints)
  const freshCount = paints.filter(rp => !existingIds.has(rp.paints.id)).length

  const chipsHtml = paints.map(rp => {
    const already = existingIds.has(rp.paints.id)
    return `
      <div class="pl-preview-chip${already ? ' pl-preview-chip--done' : ''}">
        <span class="pl-swatch${rp.paints.color_hex ? '' : ' pl-swatch--none'}"
          ${rp.paints.color_hex ? `style="background:${rp.paints.color_hex}"` : ''}></span>
        <span class="pl-preview-chip-name">${escapeHtml(rp.paints.name)}</span>
        ${already ? '<span class="pl-preview-check">✓</span>' : ''}
      </div>`
  }).join('')

  return `
    <div class="pl-header">
      <button class="pl-back" data-pl-action="back-to-recipes">‹ Recetas</button>
      <button class="pl-close" data-pl-action="close">✕</button>
    </div>
    <div class="pl-preview-title">${escapeHtml(r.name)}</div>
    <div class="pl-preview-chips">
      ${chipsHtml || '<div class="pl-empty">Receta sin pinturas</div>'}
    </div>
    <button class="pl-apply-btn" data-pl-action="apply-recipe" data-recipe-id="${r.id}"
      ${!freshCount ? 'disabled' : ''}>
      ${freshCount
        ? `Añadir ${freshCount} pintura${freshCount !== 1 ? 's' : ''}`
        : 'Pinturas ya añadidas'}
    </button>
  `
}

// ─── Events ──────────────────────────────────────────────────────────────────

function bindIfNeeded() {
  const backdrop = document.getElementById('pl-backdrop')
  if (!backdrop || _bound) return
  _bound = true

  backdrop.addEventListener('click', e => {
    if (e.target === backdrop) cerrarPaintLink()
  })

  const content = document.getElementById('pl-content')

  content.addEventListener('input', e => {
    if (e.target.id !== 'pl-search') return
    _query = e.target.value
    renderSheet()
    const input = document.getElementById('pl-search')
    if (input) { input.focus(); const len = input.value.length; input.setSelectionRange(len, len) }
  })

  content.addEventListener('click', async e => {
    const el = e.target.closest('[data-pl-action]')
    if (!el) return
    const action = el.dataset.plAction

    if (action === 'close') {
      cerrarPaintLink()

    } else if (action === 'tab') {
      _tab = el.dataset.tab
      _query = ''
      _recipePick = null
      if (_tab === 'recipe' && !_recipesLoaded) {
        renderSheet()
        await loadRecipes()
      } else {
        renderSheet()
        if (_tab === 'inventory') setTimeout(() => document.getElementById('pl-search')?.focus(), 50)
      }

    } else if (action === 'pick-paint') {
      const paintId = el.dataset.paintId
      const { addMiniPaints } = await import('./mini-paints.js')
      await addMiniPaints(_miniId, [paintId])
      renderSheet()
      const input = document.getElementById('pl-search')
      if (input) { input.focus(); input.select() }

    } else if (action === 'pick-recipe') {
      _recipePick = _recipes.find(r => r.id === el.dataset.recipeId) || null
      renderSheet()

    } else if (action === 'back-to-recipes') {
      _recipePick = null
      renderSheet()

    } else if (action === 'apply-recipe') {
      const { applyRecipeToMini } = await import('./mini-paints.js')
      await applyRecipeToMini(_miniId, el.dataset.recipeId)
      cerrarPaintLink()
    }
  })
}

async function loadRecipes() {
  const { data } = await db
    .from('recipes')
    .select('id, name, recipe_paints(paint_id, paints(id, name, color_hex))')
    .order('created_at', { ascending: false })
  _recipes = data || []
  _recipesLoaded = true
  renderSheet()
}
