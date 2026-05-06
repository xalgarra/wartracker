import { db } from './db.js'
import { state } from './state.js'
import { mostrarError } from './toast.js'
import { escapeHtml } from './utils.js'

let _recipes = []
let _bound = false
let _filterBound = false
let _filterPaintId = null

export const getRecipes = () => _recipes

export async function cargarRecetas() {
  const container = document.getElementById('recetas-content')
  if (!container) return
  container.innerHTML = '<div class="empty">Cargando…</div>'
  bindFilterEvents()

  const { data, error } = await db
    .from('recipes')
    .select(`
      id, name, pdf_url,
      recipe_photos(id, url, position),
      recipe_paints(id, paint_id, paints(id, name, color_hex)),
      recipe_steps(id, position, technique, instruction),
      projects(id, name)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    mostrarError('Error cargando recetas')
    container.innerHTML = '<div class="empty">Error cargando recetas</div>'
    return
  }

  _recipes = data || []
  renderRecetas()

  if (!_bound) {
    _bound = true
    container.addEventListener('click', async e => {
      const card = e.target.closest('[data-recipe-id]')
      if (!card) return
      const { abrirModalReceta } = await import('./recipe-modal.js')
      abrirModalReceta(card.dataset.recipeId)
    })
  }
}

function renderRecetas() {
  const container = document.getElementById('recetas-content')
  if (!container) return

  let visible = _recipes
  if (_filterPaintId != null) {
    visible = _recipes.filter(r =>
      (r.recipe_paints || []).some(rp => Number(rp.paint_id) === Number(_filterPaintId))
    )
  }

  if (!_recipes.length) {
    container.innerHTML = '<div class="empty">Sin recetas — pulsa + para crear la primera</div>'
    return
  }
  if (!visible.length) {
    container.innerHTML = '<div class="empty">Ninguna receta usa esta pintura</div>'
    return
  }
  container.innerHTML = `<div class="recipes-grid">${visible.map(renderRecipeCard).join('')}</div>`
}

// ---------------------------------------------------------------------------
// Filtro por pintura (P4)
// ---------------------------------------------------------------------------

function bindFilterEvents() {
  if (_filterBound) return
  _filterBound = true

  const input    = document.getElementById('recipes-paint-filter')
  const results  = document.getElementById('recipes-paint-filter-results')
  const activeEl = document.getElementById('recipes-active-filter')
  if (!input || !results || !activeEl) return

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase()
    if (!q) { results.innerHTML = ''; results.style.display = 'none'; return }
    const matches = (state.pinturas || [])
      .filter(p => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q))
      .slice(0, 6)
    results.innerHTML = matches.length
      ? matches.map(p => `
          <div class="recipes-filter-result" data-paint-id="${p.id}" data-paint-name="${escapeHtml(p.name)}" data-paint-hex="${p.color_hex || ''}">
            <div class="paint-swatch ${p.color_hex ? '' : 'paint-swatch-none'}"
                 style="${p.color_hex ? `background:${p.color_hex}` : ''}"></div>
            <span>${escapeHtml(p.name)}</span>
            <span class="recipes-filter-result-brand">${escapeHtml(p.brand)}</span>
          </div>`).join('')
      : '<div class="recipes-filter-empty">Sin resultados</div>'
    results.style.display = 'block'
  })

  results.addEventListener('click', e => {
    const row = e.target.closest('[data-paint-id]')
    if (!row) return
    aplicarFiltroPaint(Number(row.dataset.paintId), row.dataset.paintName, row.dataset.paintHex)
    input.value = ''
    results.innerHTML = ''
    results.style.display = 'none'
  })

  activeEl.addEventListener('click', e => {
    if (!e.target.closest('[data-action="clear-filter"]')) return
    limpiarFiltro()
  })

  document.addEventListener('click', e => {
    if (!e.target.closest('.recipes-filter-search')) {
      results.style.display = 'none'
    }
  })
}

function aplicarFiltroPaint(paintId, paintName, paintHex) {
  _filterPaintId = paintId
  const activeEl = document.getElementById('recipes-active-filter')
  activeEl.innerHTML = `
    <span class="recipes-active-filter-label">Filtro:</span>
    <div class="recipes-active-filter-chip">
      ${paintHex ? `<span class="paint-swatch" style="background:${paintHex}"></span>` : '<span class="paint-swatch paint-swatch-none"></span>'}
      <span>${escapeHtml(paintName)}</span>
      <button data-action="clear-filter" title="Quitar filtro">✕</button>
    </div>
  `
  activeEl.style.display = 'flex'
  renderRecetas()
}

function limpiarFiltro() {
  _filterPaintId = null
  document.getElementById('recipes-active-filter').style.display = 'none'
  document.getElementById('recipes-active-filter').innerHTML = ''
  renderRecetas()
}

function renderRecipeCard(recipe) {
  const photos = (recipe.recipe_photos || []).sort((a, b) => a.position - b.position)
  const thumb = photos[0]
  const paints = recipe.recipe_paints || []
  const steps = recipe.recipe_steps || []
  const projects = recipe.projects || []

  const thumbHtml = thumb
    ? `<img class="recipe-card-thumb" src="${thumb.url}" alt="" loading="lazy">`
    : `<div class="recipe-card-thumb recipe-card-thumb--empty"><span>▸</span></div>`

  const paintsHtml = paints.slice(0, 10).map(rp =>
    `<div class="paint-swatch ${rp.paints?.color_hex ? '' : 'paint-swatch-none'}"
          style="${rp.paints?.color_hex ? `background:${rp.paints.color_hex}` : ''}"
          title="${escapeHtml(rp.paints?.name || '')}"></div>`
  ).join('')

  return `
    <div class="recipe-card" data-recipe-id="${recipe.id}">
      ${thumbHtml}
      <div class="recipe-card-body">
        <div class="recipe-card-name">${escapeHtml(recipe.name)}</div>
        <div class="recipe-card-meta">${steps.length} paso${steps.length !== 1 ? 's' : ''}</div>
        ${paintsHtml ? `<div class="recipe-card-paints">${paintsHtml}</div>` : ''}
        ${projects.length ? `<div class="recipe-card-used">// ${projects.length} proyecto${projects.length !== 1 ? 's' : ''}</div>` : ''}
      </div>
    </div>
  `
}
