import { db } from './db.js'
import { state } from './state.js'
import { mostrarError } from './toast.js'
import { escapeHtml, compressImage, storagePathFrom } from './utils.js'
import { cargarRecetas, getRecipes } from './recipes.js'

let _recipeId      = null
let _photos        = []         // { id, url, position } — from DB
let _pendingPhotos = []         // { file, tempUrl } — not yet uploaded
let _deletedPhotoIds = new Set()
let _recipePaints  = []         // { id, paint_id, paints: {...} } — from DB
let _pendingPaints = []         // { paint: {...} } — not yet saved
let _removedPaintIds = new Set()
let _steps         = []         // { id, position, technique, instruction } — from DB
let _pdfUrl        = null       // existing pdf_url from DB
let _pdfFile       = null       // pending File to upload
let _pdfRemoved    = false      // user clicked remove on existing PDF

const STEP_TECHNIQUES = [
  'base',
  'pincel seco',
  'shade',
  'contrast',
  'lavado',
  'luz',
  'detalle',
  'glaze',
  'technical',
]

function _reset() {
  _recipeId       = null
  _photos         = []
  _pendingPhotos  = []
  _deletedPhotoIds = new Set()
  _recipePaints   = []
  _pendingPaints  = []
  _removedPaintIds = new Set()
  _steps          = []
  _pdfUrl         = null
  _pdfFile        = null
  _pdfRemoved     = false
}

// ---------------------------------------------------------------------------
// Apertura / cierre
// ---------------------------------------------------------------------------

export async function abrirModalReceta(recipeId) {
  _reset()
  _recipeId = recipeId || null
  const recipe = _recipeId ? getRecipes().find(r => r.id === _recipeId) : null

  document.getElementById('modal-recipe-title').textContent = recipe ? 'Editar receta' : 'Nueva receta'
  document.getElementById('recipe-name').value = recipe?.name || ''
  document.getElementById('btn-eliminar-recipe').style.display = recipe ? 'block' : 'none'
  document.getElementById('recipe-paint-search').value = ''
  document.getElementById('recipe-paint-results').innerHTML = ''

  if (recipe) {
    _photos = (recipe.recipe_photos || []).sort((a, b) => a.position - b.position)
    _recipePaints = recipe.recipe_paints || []
    _steps = (recipe.recipe_steps || []).sort((a, b) => a.position - b.position)
    _pdfUrl = recipe.pdf_url || null
  }
  _renderPhotos()
  _renderPdf()
  _renderPaints()
  _renderSteps()

  const usedIn = document.getElementById('recipe-used-in')
  const projects = recipe?.projects || []
  if (projects.length) {
    document.getElementById('recipe-used-in-list').innerHTML = projects.map(p =>
      `<div class="recipe-used-in-item">${escapeHtml(p.name)}</div>`
    ).join('')
    usedIn.style.display = 'block'
  } else {
    usedIn.style.display = 'none'
  }

  if (!document.getElementById('modal-recipe-bg').dataset.bound) {
    _bindModalEvents()
    document.getElementById('modal-recipe-bg').dataset.bound = '1'
  }

  document.getElementById('modal-recipe-bg').classList.add('open')
}

function _renderSteps() {
  const list = document.getElementById('recipe-steps-list')
  if (!list) return

  if (!_steps.length) {
    list.innerHTML = '<div class="proj-modal-empty">Sin pasos añadidos</div>'
    return
  }

  list.innerHTML = _steps.map((step, idx) => `
    <div class="recipe-step-row" data-step-idx="${idx}">
      <span class="recipe-step-num">${idx + 1}</span>
      <select class="recipe-step-technique">
        <option value="">Técnica</option>
        ${STEP_TECHNIQUES.map(t => `<option value="${t}"${step.technique === t ? ' selected' : ''}>${t}</option>`).join('')}
      </select>
      <input class="recipe-step-instruction" type="text" maxlength="180"
             placeholder="Instrucción" value="${escapeHtml(step.instruction || '')}">
      <button class="proj-modal-remove" data-action="del-recipe-step" data-step-idx="${idx}">✕</button>
    </div>
  `).join('')
}

function _syncStepsFromDom() {
  const rows = [...document.querySelectorAll('#recipe-steps-list .recipe-step-row')]
  _steps = rows.map((row, idx) => ({
    id: _steps[Number(row.dataset.stepIdx)]?.id || null,
    position: idx,
    technique: row.querySelector('.recipe-step-technique')?.value || '',
    instruction: row.querySelector('.recipe-step-instruction')?.value.trim() || '',
  })).filter(step => step.technique || step.instruction)
}

export function cerrarModalReceta() {
  document.getElementById('modal-recipe-bg').classList.remove('open')
  _reset()
  cargarRecetas()
}

// ---------------------------------------------------------------------------
// Render interno
// ---------------------------------------------------------------------------

function _renderPhotos() {
  const list = document.getElementById('recipe-photo-list')
  if (!list) return

  const existHtml = _photos
    .filter(p => !_deletedPhotoIds.has(p.id))
    .map(p => `
      <div class="recipe-photo-item">
        <img class="recipe-photo-thumb" src="${p.url}" alt="" loading="lazy" data-action="view-photo" data-url="${p.url}">
        <button class="gallery-item-remove" data-action="del-recipe-photo" data-photo-id="${p.id}">✕</button>
      </div>`).join('')

  const pendHtml = _pendingPhotos.map((p, i) => `
    <div class="recipe-photo-item recipe-photo-item--pending">
      <img class="recipe-photo-thumb" src="${p.tempUrl}" alt="" data-action="view-photo" data-url="${p.tempUrl}">
      <button class="gallery-item-remove" data-action="del-pending-photo" data-idx="${i}">✕</button>
    </div>`).join('')

  list.innerHTML = existHtml + pendHtml
}

function _renderPdf() {
  const display = document.getElementById('recipe-pdf-display')
  const label   = document.getElementById('recipe-pdf-upload-label')
  if (!display) return

  if (_pdfFile) {
    display.innerHTML = `<div class="recipe-pdf-row">
      <span class="recipe-pdf-name">${escapeHtml(_pdfFile.name)}</span>
      <button class="proj-modal-remove" data-action="del-pdf">✕</button>
    </div>`
    if (label) label.style.display = 'none'
  } else if (_pdfUrl && !_pdfRemoved) {
    display.innerHTML = `<div class="recipe-pdf-row">
      <a class="recipe-pdf-link" href="${_pdfUrl}" target="_blank" rel="noopener">Ver PDF</a>
      <button class="proj-modal-remove" data-action="del-pdf">✕</button>
    </div>`
    if (label) label.style.display = 'none'
  } else {
    display.innerHTML = ''
    if (label) label.style.display = ''
  }
}

function openLightbox(url) {
  const lb  = document.getElementById('photo-lightbox')
  const img = document.getElementById('photo-lightbox-img')
  if (!lb || !img) return
  img.src = url
  lb.classList.add('open')
}

function _renderPaints() {
  const list = document.getElementById('recipe-paints-list')
  if (!list) return

  const existing = _recipePaints.filter(rp => !_removedPaintIds.has(rp.id))
  const all = [
    ...existing.map(rp => ({ id: rp.id, paint: rp.paints, isExisting: true })),
    ..._pendingPaints.map((pp, i) => ({ id: null, paint: pp.paint, isExisting: false, idx: i }))
  ]

  if (!all.length) {
    list.innerHTML = '<div class="proj-modal-empty">Sin pinturas añadidas</div>'
    return
  }

  list.innerHTML = all.map(item => `
    <div class="proj-modal-row">
      <div class="paint-swatch ${item.paint?.color_hex ? '' : 'paint-swatch-none'}"
           style="${item.paint?.color_hex ? `background:${item.paint.color_hex}` : ''}"></div>
      <span class="proj-modal-row-name">${escapeHtml(item.paint?.name || '')}</span>
      <span class="proj-modal-row-brand">${escapeHtml(item.paint?.brand || '')}</span>
      <button class="proj-modal-remove"
              data-action="${item.isExisting ? 'del-recipe-paint' : 'del-pending-paint'}"
              ${item.isExisting ? `data-rp-id="${item.id}"` : `data-idx="${item.idx}"`}>✕</button>
    </div>`).join('')
}

function _onPaintSearch(query) {
  const q = query.trim().toLowerCase()
  const results = document.getElementById('recipe-paint-results')
  if (!q) { results.innerHTML = ''; return }

  const existingIds = new Set(_recipePaints.filter(rp => !_removedPaintIds.has(rp.id)).map(rp => rp.paint_id))
  const pendingIds  = new Set(_pendingPaints.map(pp => pp.paint.id))

  const matches = (state.pinturas || [])
    .filter(p => !existingIds.has(p.id) && !pendingIds.has(p.id))
    .filter(p => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q))
    .slice(0, 6)

  results.innerHTML = matches.length
    ? matches.map(p => `
        <div class="home-proj-search-result" data-action="add-recipe-paint" data-paint-id="${p.id}">
          <div class="paint-swatch ${p.color_hex ? '' : 'paint-swatch-none'}"
               style="${p.color_hex ? `background:${p.color_hex}` : ''}"></div>
          <span>${escapeHtml(p.name)}</span>
          <span class="home-proj-result-meta">${escapeHtml(p.brand)}</span>
        </div>`).join('')
    : '<div class="home-proj-result-empty">Sin resultados</div>'
}

// ---------------------------------------------------------------------------
// Event binding (una sola vez)
// ---------------------------------------------------------------------------

function _bindModalEvents() {
  const modal = document.querySelector('#modal-recipe-bg .modal')

  document.getElementById('photo-lightbox')?.addEventListener('click', () => {
    document.getElementById('photo-lightbox').classList.remove('open')
  })
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') document.getElementById('photo-lightbox')?.classList.remove('open')
  })
  document.getElementById('recipe-pdf-input')?.addEventListener('change', e => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    _pdfFile = file
    _pdfRemoved = false
    _renderPdf()
  })

  document.getElementById('recipe-paint-search')?.addEventListener('input', e => _onPaintSearch(e.target.value))
  document.getElementById('btn-add-recipe-step')?.addEventListener('click', () => {
    _syncStepsFromDom()
    _steps.push({ id: null, position: _steps.length, technique: '', instruction: '' })
    _renderSteps()
  })

  modal.addEventListener('click', e => {
    const el = e.target.closest('[data-action]')
    if (!el) return
    const { action } = el.dataset

    if (action === 'del-recipe-photo') {
      _deletedPhotoIds.add(el.dataset.photoId)
      _renderPhotos()
    } else if (action === 'del-pending-photo') {
      const idx = Number(el.dataset.idx)
      URL.revokeObjectURL(_pendingPhotos[idx]?.tempUrl)
      _pendingPhotos.splice(idx, 1)
      _renderPhotos()
    } else if (action === 'add-recipe-paint') {
      const paintId = Number(el.dataset.paintId)
      const paint = (state.pinturas || []).find(p => p.id === paintId)
      if (!paint) return
      const alreadyIn = _recipePaints.some(rp => rp.paint_id === paintId && !_removedPaintIds.has(rp.id))
                     || _pendingPaints.some(pp => pp.paint.id === paintId)
      if (alreadyIn) return
      _pendingPaints.push({ paint })
      _renderPaints()
      document.getElementById('recipe-paint-search').value = ''
      document.getElementById('recipe-paint-results').innerHTML = ''
    } else if (action === 'del-recipe-paint') {
      _removedPaintIds.add(el.dataset.rpId)
      _renderPaints()
    } else if (action === 'del-pending-paint') {
      _pendingPaints.splice(Number(el.dataset.idx), 1)
      _renderPaints()
    } else if (action === 'del-recipe-step') {
      _syncStepsFromDom()
      _steps.splice(Number(el.dataset.stepIdx), 1)
      _renderSteps()
    } else if (action === 'view-photo') {
      openLightbox(el.dataset.url)
    } else if (action === 'del-pdf') {
      _pdfFile = null
      _pdfRemoved = true
      _renderPdf()
    }
  })
}

// ---------------------------------------------------------------------------
// Upload de fotos
// ---------------------------------------------------------------------------

export async function onRecipePhotoSelected(input) {
  const files = [...(input.files || [])]
  input.value = ''
  for (const file of files) {
    const compressed = await compressImage(file)
    _pendingPhotos.push({ file: compressed, tempUrl: URL.createObjectURL(compressed) })
  }
  _renderPhotos()
}

// ---------------------------------------------------------------------------
// Guardar / eliminar
// ---------------------------------------------------------------------------

export async function guardarReceta() {
  const name = document.getElementById('recipe-name').value.trim()
  if (!name) { mostrarError('La receta necesita un nombre'); return }

  const btn = document.getElementById('btn-guardar-recipe')
  if (btn) btn.disabled = true
  try {
    let savedId = _recipeId

    if (_recipeId) {
      const { error } = await db.from('recipes').update({ name }).eq('id', _recipeId)
      if (error) { mostrarError('Error guardando receta'); return }
    } else {
      const { data, error } = await db.from('recipes').insert({ name }).select('id').single()
      if (error) { mostrarError('Error guardando receta'); return }
      savedId = data.id
    }

    // PDF: upload new / remove existing
    if (_pdfFile) {
      const pdfPath = `${savedId}/recipe.pdf`
      await db.storage.from('recipe-photos').remove([pdfPath])
      const { error: pdfErr } = await db.storage.from('recipe-photos').upload(pdfPath, _pdfFile, { upsert: true, contentType: 'application/pdf' })
      if (pdfErr) { mostrarError('Error subiendo PDF'); }
      else {
        const { data: { publicUrl } } = db.storage.from('recipe-photos').getPublicUrl(pdfPath)
        await db.from('recipes').update({ pdf_url: publicUrl }).eq('id', savedId)
      }
    } else if (_pdfRemoved && _pdfUrl) {
      const pdfPath = storagePathFrom(_pdfUrl, 'recipe-photos')
      if (pdfPath) await db.storage.from('recipe-photos').remove([pdfPath])
      await db.from('recipes').update({ pdf_url: null }).eq('id', savedId)
    }

    // Delete removed photos from storage + DB
    for (const photoId of _deletedPhotoIds) {
      const photo = _photos.find(p => p.id === photoId)
      if (photo?.url) {
        const path = storagePathFrom(photo.url, 'recipe-photos')
        if (path) await db.storage.from('recipe-photos').remove([path])
      }
      await db.from('recipe_photos').delete().eq('id', photoId)
    }

    // Upload pending photos
    const basePos = _photos.filter(p => !_deletedPhotoIds.has(p.id)).length
    for (let i = 0; i < _pendingPhotos.length; i++) {
      const pp   = _pendingPhotos[i]
      const path = `${savedId}/p_${Date.now()}_${i}.jpg`
      const { error: upErr } = await db.storage.from('recipe-photos').upload(path, pp.file)
      if (upErr) { mostrarError(`Error subiendo foto ${i + 1}`); continue }
      const { data: { publicUrl } } = db.storage.from('recipe-photos').getPublicUrl(path)
      await db.from('recipe_photos').insert({ recipe_id: savedId, url: publicUrl, position: basePos + i })
    }

    // Remove unlinked paints
    for (const rpId of _removedPaintIds) {
      await db.from('recipe_paints').delete().eq('id', rpId)
    }

    // Insert pending paints
    for (const pp of _pendingPaints) {
      await db.from('recipe_paints').insert({ recipe_id: savedId, paint_id: pp.paint.id })
    }

    _syncStepsFromDom()
    const { error: delStepsError } = await db.from('recipe_steps').delete().eq('recipe_id', savedId)
    if (delStepsError) { mostrarError('Error guardando pasos. Ejecuta sql/27_recipe_steps.sql'); return }
    const stepsToInsert = _steps
      .map((step, idx) => ({
        recipe_id: savedId,
        position: idx,
        technique: step.technique || null,
        instruction: step.instruction,
      }))
      .filter(step => step.instruction)
    if (stepsToInsert.length) {
      const { error: stepErr } = await db.from('recipe_steps').insert(stepsToInsert)
      if (stepErr) { mostrarError('Error guardando pasos. Ejecuta sql/27_recipe_steps.sql'); return }
    }

    cerrarModalReceta()
  } finally {
    if (btn) btn.disabled = false
  }
}

export async function eliminarReceta() {
  if (!_recipeId) return
  const recipe = getRecipes().find(r => r.id === _recipeId)
  if (!confirm(`¿Eliminar "${recipe?.name || 'esta receta'}"?`)) return

  for (const photo of _photos) {
    const path = storagePathFrom(photo.url, 'recipe-photos')
    if (path) await db.storage.from('recipe-photos').remove([path])
  }
  await db.from('recipes').delete().eq('id', _recipeId)
  cerrarModalReceta()
}
