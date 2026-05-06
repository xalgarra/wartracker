import { db } from './db.js'
import { mostrarError } from './toast.js'
import { escapeHtml } from './utils.js'

let _recipes = []
let _bound = false

export const getRecipes = () => _recipes

export async function cargarRecetas() {
  const container = document.getElementById('recetas-content')
  if (!container) return
  container.innerHTML = '<div class="empty">Cargando…</div>'

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

  if (!_recipes.length) {
    container.innerHTML = '<div class="empty">Sin recetas — pulsa + para crear la primera</div>'
  } else {
    container.innerHTML = `<div class="recipes-grid">${_recipes.map(renderRecipeCard).join('')}</div>`
  }

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
