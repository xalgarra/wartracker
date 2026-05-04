import { db } from './db.js'
import { mostrarError } from './toast.js'
import { mostrarExito } from './toast.js'
import { escapeHtml, compressImage } from './utils.js'
import { CITADEL_CATALOG } from '../js/paint-colors.js'
import { RECIPE_IMPORT_DATA } from './recipe-import-data.js'

let _recipes = []
let _bound = false
let _importBound = false
let _importFiles = new Map()

export const getRecipes = () => _recipes

export async function cargarRecetas() {
  const container = document.getElementById('recetas-content')
  if (!container) return
  bindRecipeImport()
  container.innerHTML = '<div class="empty">Cargando…</div>'

  let { data, error } = await db
    .from('recipes')
    .select(`
      id, name, pdf_url,
      recipe_photos(id, url, position),
      recipe_paints(id, paint_id, paints(id, name, color_hex)),
      recipe_steps(id, position, technique, instruction),
      projects(id, name)
    `)
    .order('created_at', { ascending: false })

  if (error && error.message?.includes('recipe_steps')) {
    ;({ data, error } = await db
      .from('recipes')
      .select(`
        id, name,
        recipe_photos(id, url, position),
        recipe_paints(id, paint_id, paints(id, name, color_hex)),
        projects(id, name)
      `)
      .order('created_at', { ascending: false }))
    data = (data || []).map(r => ({ ...r, recipe_steps: [] }))
  }

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

function normalizeName(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’]/g, '')
}

function byFileName(files) {
  return new Map(files.map(file => [file.name, file]))
}

function setImportStatus(text) {
  const el = document.getElementById('recipe-import-status')
  if (el) el.textContent = text
}

function bindRecipeImport() {
  if (_importBound) return
  _importBound = true

  document.getElementById('recipe-import-files')?.addEventListener('change', e => {
    const files = [...(e.target.files || [])]
    _importFiles = byFileName(files)
    const expected = new Set(RECIPE_IMPORT_DATA.flatMap(r => r.photos))
    const matched = files.filter(file => expected.has(file.name)).length
    const btn = document.getElementById('btn-import-recipes')
    if (btn) btn.disabled = matched === 0
    const suffix = matched ? '' : ' Revisa que hayas seleccionado la carpeta/archivos de recetas.'
    setImportStatus(`${files.length} archivo${files.length !== 1 ? 's' : ''} seleccionado${files.length !== 1 ? 's' : ''}. ${matched} coinciden con recetas preparadas.${suffix}`)
  })

  document.getElementById('btn-import-recipes')?.addEventListener('click', importarRecetasPreparadas)
}

function isMissingRelation(error, relation) {
  const text = `${error?.code || ''} ${error?.message || ''} ${error?.details || ''}`.toLowerCase()
  return text.includes('42p01') || text.includes(relation.toLowerCase())
}

function importErrorMessage(error) {
  if (isMissingRelation(error, 'recipe_steps')) {
    return 'Falta la tabla recipe_steps. Ejecuta sql/27_recipe_steps.sql y vuelve a importar para guardar los pasos.'
  }
  if (String(error?.message || '').toLowerCase().includes('bucket')) {
    return 'Falta el bucket recipe-photos o sus permisos de Storage.'
  }
  return error?.message || 'Error desconocido'
}

async function ensurePaints(names) {
  const uniqueNames = [...new Set(names.filter(Boolean))]
  if (!uniqueNames.length) return new Map()

  const { data, error } = await db.from('paints').select('*').order('brand').order('name')
  if (error) throw error

  const paints = data || []
  const byName = new Map(paints
    .filter(p => p.brand === 'Citadel')
    .map(p => [normalizeName(p.name), p]))

  for (const name of uniqueNames) {
    const key = normalizeName(name)
    if (byName.has(key)) continue

    const catalog = CITADEL_CATALOG.find(p => normalizeName(p.name) === key)
    if (!catalog) continue

    const payload = {
      brand: 'Citadel',
      name: catalog.name,
      type: catalog.type,
      color_hex: catalog.hex || null,
      in_stock: false,
      quantity: 0,
    }
    const { data: inserted, error: insertError } = await db.from('paints').insert(payload).select('*').single()
    if (insertError) throw insertError
    byName.set(key, inserted)
  }

  return byName
}

async function importarRecetasPreparadas() {
  if (!_importFiles.size) {
    setImportStatus('Selecciona primero las fotos de la carpeta recetas.')
    return
  }

  const btn = document.getElementById('btn-import-recipes')
  if (btn) btn.disabled = true
  setImportStatus('Preparando importación...')

  try {
    const existingNames = new Set(_recipes.map(r => normalizeName(r.name)))
    const toImport = RECIPE_IMPORT_DATA
      .filter(recipe => !existingNames.has(normalizeName(recipe.name)))
      .filter(recipe => recipe.photos.some(photo => _importFiles.has(photo)))

    if (!toImport.length) {
      setImportStatus('No hay recetas nuevas con fotos coincidentes.')
      return
    }

    const allPaintNames = toImport.flatMap(recipe => recipe.paints || [])
    const paintByName = await ensurePaints(allPaintNames)

    let imported = 0
    let skippedPaints = 0
    let skippedSteps = 0
    for (const recipe of toImport) {
      setImportStatus(`Importando ${recipe.name}...`)
      const notes = [
        recipe.status === 'revisar' ? 'Estado: revisar.' : '',
        recipe.notes || '',
      ].filter(Boolean).join('\n')

      const { data: insertedRecipe, error: recipeError } = await db
        .from('recipes')
        .insert({ name: recipe.name, notes: notes || null })
        .select('id')
        .single()
      if (recipeError) throw recipeError

      for (let i = 0; i < recipe.photos.length; i++) {
        const file = _importFiles.get(recipe.photos[i])
        if (!file) continue
        const compressed = await compressImage(file)
        const safeName = recipe.photos[i].replace(/[^a-z0-9.]+/gi, '_')
        const path = `${insertedRecipe.id}/import_${i}_${safeName}.jpg`
        const { error: uploadError } = await db.storage.from('recipe-photos').upload(path, compressed, { upsert: true })
        if (uploadError) throw uploadError
        const { data: { publicUrl } } = db.storage.from('recipe-photos').getPublicUrl(path)
        const { error: photoError } = await db.from('recipe_photos').insert({
          recipe_id: insertedRecipe.id,
          url: publicUrl,
          position: i,
        })
        if (photoError) throw photoError
      }

      const stepRows = (recipe.steps || []).map((step, idx) => ({
        recipe_id: insertedRecipe.id,
        position: idx,
        technique: step.technique || null,
        instruction: step.instruction,
      })).filter(step => step.instruction)
      if (stepRows.length) {
        const { error: stepError } = await db.from('recipe_steps').insert(stepRows)
        if (stepError) {
          if (!isMissingRelation(stepError, 'recipe_steps')) throw stepError
          skippedSteps += stepRows.length
        }
      }

      const paintIds = [...new Set((recipe.paints || []).map(name => {
        const paint = paintByName.get(normalizeName(name))
        if (!paint) skippedPaints++
        return paint?.id
      }).filter(Boolean))]
      if (paintIds.length) {
        const { error: paintError } = await db.from('recipe_paints').insert(
          paintIds.map(paintId => ({ recipe_id: insertedRecipe.id, paint_id: paintId }))
        )
        if (paintError) throw paintError
      }

      imported++
    }

    mostrarExito(`${imported} receta${imported !== 1 ? 's' : ''} importada${imported !== 1 ? 's' : ''}`)
    const paintsMessage = skippedPaints
      ? `${skippedPaints} pintura${skippedPaints !== 1 ? 's' : ''} sin asociar por falta de catalogo.`
      : 'Todas las pinturas reconocidas quedaron asociadas.'
    const stepsMessage = skippedSteps
      ? ` ${skippedSteps} paso${skippedSteps !== 1 ? 's' : ''} no se guardaron porque falta sql/27_recipe_steps.sql.`
      : ''
    setImportStatus(`${imported} receta${imported !== 1 ? 's' : ''} importada${imported !== 1 ? 's' : ''}. ${paintsMessage}${stepsMessage}`)
    await cargarRecetas()
  } catch (error) {
    const message = importErrorMessage(error)
    mostrarError('Error importando recetas: ' + message)
    setImportStatus(`Importacion detenida: ${message}`)
  } finally {
    if (btn) btn.disabled = false
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
