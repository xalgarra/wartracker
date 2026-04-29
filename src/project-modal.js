import { db } from './db.js'
import { state } from './state.js'
import { mostrarError } from './toast.js'
import { escapeHtml, compressImage, storagePathFrom } from './utils.js'
import { cargarHome, getMinis, getProyectos, syncProyecto } from './home.js'

let _modalProjectId = null
let _pendingPhotoFile = null
let _pendingPhotoRemove = false

// ---------------------------------------------------------------------------
// Apertura / cierre
// ---------------------------------------------------------------------------

export async function abrirModalProyecto(projectId) {
  _modalProjectId = projectId || null
  const project = projectId ? getProyectos().find(p => p.id === projectId) : null

  document.getElementById('modal-project-title').textContent = project ? 'Editar proyecto' : 'Nuevo proyecto'
  document.getElementById('proj-edit-name').value = project?.name || ''
  document.getElementById('proj-recipe').value = project?.recipe || ''
  document.getElementById('btn-eliminar-project').style.display = project ? 'block' : 'none'
  document.getElementById('btn-completar-project').style.display = project ? 'block' : 'none'
  document.getElementById('proj-modal-unit-search').value = ''
  document.getElementById('proj-modal-unit-results').innerHTML = ''
  document.getElementById('proj-modal-paint-search').value = ''
  document.getElementById('proj-modal-paint-results').innerHTML = ''
  resetPhotoUI(project?.photo_url || null)

  renderModalUnits(project)
  renderModalPaints(project)

  if (!document.getElementById('modal-project-bg').dataset.bound) {
    bindModalEvents()
    document.getElementById('modal-project-bg').dataset.bound = '1'
  }

  document.getElementById('modal-project-bg').classList.add('open')
}

export async function cerrarModalProyecto() {
  document.getElementById('modal-project-bg').classList.remove('open')
  _modalProjectId = null
  await cargarHome()
}

// ---------------------------------------------------------------------------
// Guardar / completar / eliminar
// ---------------------------------------------------------------------------

export async function guardarProyecto() {
  const name = document.getElementById('proj-edit-name').value.trim()
  if (!name) { mostrarError('El proyecto necesita un nombre'); return }
  if (!_modalProjectId) { await cerrarModalProyecto(); return }

  const payload = { name, recipe: document.getElementById('proj-recipe').value || null }

  if (_pendingPhotoFile) {
    const path = `${_modalProjectId}.jpg`
    const { error: uploadError } = await db.storage.from('project-photos').upload(path, _pendingPhotoFile, { upsert: true })
    if (uploadError) { mostrarError('Error subiendo foto: ' + uploadError.message); return }
    const { data: { publicUrl } } = db.storage.from('project-photos').getPublicUrl(path)
    payload.photo_url = publicUrl
  } else if (_pendingPhotoRemove) {
    const project = getProyectos().find(p => p.id === _modalProjectId)
    if (project?.photo_url) {
      const path = storagePathFrom(project.photo_url, 'project-photos')
      if (path) await db.storage.from('project-photos').remove([path])
    }
    payload.photo_url = null
  }

  const { error } = await db.from('projects').update(payload).eq('id', _modalProjectId)
  if (error) { mostrarError('Error guardando proyecto'); return }
  await cerrarModalProyecto()
}

export async function completarProyecto() {
  if (!_modalProjectId) return
  if (!confirm('¿Completar proyecto? Todas sus minis se marcarán como pintadas.')) return
  const project = getProyectos().find(p => p.id === _modalProjectId)
  const miniIds = (project?.project_minis || []).map(pm => Number(pm.mini_id))
  await Promise.all([
    miniIds.length ? db.from('minis').update({ status: 'pintada' }).in('id', miniIds) : Promise.resolve(),
    db.from('projects').update({ status: 'completado', completed_at: new Date().toISOString() }).eq('id', _modalProjectId)
  ])
  await cerrarModalProyecto()
}

export async function eliminarProyecto() {
  if (!_modalProjectId) return
  const project = getProyectos().find(p => p.id === _modalProjectId)
  if (!confirm(`¿Eliminar "${project?.name || 'este proyecto'}"?`)) return
  if (project?.photo_url) {
    const path = storagePathFrom(project.photo_url, 'project-photos')
    if (path) await db.storage.from('project-photos').remove([path])
  }
  await db.from('projects').delete().eq('id', _modalProjectId)
  await cerrarModalProyecto()
}

// ---------------------------------------------------------------------------
// Foto de proyecto
// ---------------------------------------------------------------------------

export async function onProjPhotoSelected(input) {
  const file = input.files[0]
  if (!file) return
  const compressed = await compressImage(file)
  _pendingPhotoFile = compressed
  _pendingPhotoRemove = false
  const preview = document.getElementById('proj-photo-preview')
  preview.src = URL.createObjectURL(compressed)
  preview.style.display = 'block'
  document.getElementById('btn-remove-proj-photo').style.display = 'inline-block'
  document.getElementById('proj-photo-btn-text').textContent = 'Cambiar foto'
}

export function removeProjPhoto() {
  _pendingPhotoFile = null
  _pendingPhotoRemove = true
  const preview = document.getElementById('proj-photo-preview')
  preview.style.display = 'none'
  preview.src = ''
  document.getElementById('proj-photo-input').value = ''
  document.getElementById('btn-remove-proj-photo').style.display = 'none'
  document.getElementById('proj-photo-btn-text').textContent = 'Añadir foto'
}

function resetPhotoUI(photoUrl) {
  _pendingPhotoFile = null
  _pendingPhotoRemove = false
  const preview = document.getElementById('proj-photo-preview')
  document.getElementById('proj-photo-input').value = ''
  if (photoUrl) {
    preview.src = photoUrl
    preview.style.display = 'block'
    document.getElementById('btn-remove-proj-photo').style.display = 'inline-block'
    document.getElementById('proj-photo-btn-text').textContent = 'Cambiar foto'
  } else {
    preview.style.display = 'none'
    preview.src = ''
    document.getElementById('btn-remove-proj-photo').style.display = 'none'
    document.getElementById('proj-photo-btn-text').textContent = 'Añadir foto'
  }
}

// ---------------------------------------------------------------------------
// Render del contenido del modal
// ---------------------------------------------------------------------------

function renderModalUnits(project) {
  const projMinis = project?.project_minis || []
  const container = document.getElementById('proj-modal-units')
  if (!container) return
  const minis = getMinis()
  container.innerHTML = projMinis.length
    ? projMinis.map(pm => {
        const mini = minis.find(m => m.id === Number(pm.mini_id))
        if (!mini) return ''
        const p = mini.paint_progress || 0
        return `
          <div class="proj-modal-unit-row">
            <span class="proj-modal-row-name">${escapeHtml(mini.name)}</span>
            <label class="proj-modal-pct-wrap">
              <span class="proj-modal-pct-label">Pintado</span>
              <input type="number" class="proj-modal-pct" min="0" max="100" value="${p}"
                     data-action="modal-update-progress" data-mini-id="${mini.id}">
              <span class="proj-modal-pct-label">%</span>
            </label>
            <button class="proj-modal-remove" data-action="modal-remove-mini" data-pm-id="${pm.id}">✕</button>
          </div>
        `
      }).join('')
    : '<div class="proj-modal-empty">Sin minis añadidas</div>'
}

function renderModalPaints(project) {
  const projPaints = project?.project_paints || []
  const container = document.getElementById('proj-modal-paints')
  if (!container) return
  container.innerHTML = projPaints.length
    ? projPaints.map(pp => `
        <div class="proj-modal-row">
          <div class="paint-swatch ${pp.paints?.color_hex ? '' : 'paint-swatch-none'}"
               style="${pp.paints?.color_hex ? `background:${pp.paints.color_hex}` : ''}"></div>
          <span class="proj-modal-row-name">${escapeHtml(pp.paints?.name || '')}</span>
          <span class="proj-modal-row-brand">${escapeHtml(pp.paints?.brand || '')}</span>
          <button class="proj-modal-remove" data-action="modal-remove-paint" data-pp-id="${pp.id}">✕</button>
        </div>
      `).join('')
    : '<div class="proj-modal-empty">Sin pinturas añadidas</div>'
}

// ---------------------------------------------------------------------------
// Recarga del modal sin recargar el home
// ---------------------------------------------------------------------------

async function recargarModal() {
  if (!_modalProjectId) return
  const { data } = await db
    .from('projects')
    .select('id, name, photo_url, notes, recipe, status, project_minis(id, mini_id, notes), project_paints(id, paint_id, paints(name, brand, color_hex))')
    .eq('id', _modalProjectId)
    .single()
  if (!data) return
  syncProyecto(data)
  renderModalUnits(data)
  renderModalPaints(data)
}

// ---------------------------------------------------------------------------
// Búsquedas dentro del modal
// ---------------------------------------------------------------------------

function onModalUnitSearch(query) {
  const q = query.trim().toLowerCase()
  const results = document.getElementById('proj-modal-unit-results')
  if (!q) { if (results) results.innerHTML = ''; return }

  const allProjectMiniIds = new Set(
    getProyectos().flatMap(p => (p.project_minis || []).map(pm => Number(pm.mini_id)))
  )
  const matches = getMinis().filter(m =>
    !allProjectMiniIds.has(m.id) &&
    m.status !== 'pintada' &&
    m.name.toLowerCase().includes(q)
  ).slice(0, 6)

  results.innerHTML = matches.length
    ? matches.map(m => `
        <div class="home-proj-search-result" data-action="modal-add-mini" data-mini-id="${m.id}">
          <span>${escapeHtml(m.name)}</span>
          <span class="home-proj-result-meta">${escapeHtml((m.factions || [])[0] || '')}</span>
        </div>
      `).join('')
    : '<div class="home-proj-result-empty">Sin resultados</div>'
}

function onModalPaintSearch(query) {
  const q = query.trim().toLowerCase()
  const results = document.getElementById('proj-modal-paint-results')
  if (!q) { if (results) results.innerHTML = ''; return }

  const project = getProyectos().find(p => p.id === _modalProjectId)
  const addedIds = new Set((project?.project_paints || []).map(pp => Number(pp.paint_id)))
  const matches = state.pinturas
    .filter(p => !addedIds.has(p.id) && (p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)))
    .slice(0, 6)

  results.innerHTML = matches.length
    ? matches.map(p => `
        <div class="home-proj-search-result" data-action="modal-add-paint" data-paint-id="${p.id}">
          <div class="paint-swatch ${p.color_hex ? '' : 'paint-swatch-none'}"
               style="${p.color_hex ? `background:${p.color_hex}` : ''}"></div>
          <span>${escapeHtml(p.name)}</span>
          <span class="home-proj-result-meta">${escapeHtml(p.brand)}</span>
        </div>
      `).join('')
    : '<div class="home-proj-result-empty">Sin resultados</div>'
}

// ---------------------------------------------------------------------------
// Eventos internos del modal (se registran una sola vez)
// ---------------------------------------------------------------------------

function bindModalEvents() {
  const modal = document.querySelector('#modal-project-bg .modal')

  document.getElementById('proj-modal-unit-search').addEventListener('input', e => {
    onModalUnitSearch(e.target.value)
  })
  document.getElementById('proj-modal-paint-search').addEventListener('input', e => {
    onModalPaintSearch(e.target.value)
  })

  modal.addEventListener('click', async e => {
    const actionEl = e.target.closest('[data-action]')
    if (!actionEl) return
    const { action, miniId, paintId, pmId, ppId } = actionEl.dataset

    if (action === 'modal-add-mini') {
      const { error } = await db.from('project_minis').insert({ project_id: _modalProjectId, mini_id: Number(miniId) })
      if (error) { mostrarError('Error añadiendo mini'); return }
      document.getElementById('proj-modal-unit-search').value = ''
      document.getElementById('proj-modal-unit-results').innerHTML = ''
      await recargarModal()
    } else if (action === 'modal-add-paint') {
      const { error } = await db.from('project_paints').insert({ project_id: _modalProjectId, paint_id: Number(paintId) })
      if (error) { mostrarError('Error añadiendo pintura'); return }
      document.getElementById('proj-modal-paint-search').value = ''
      document.getElementById('proj-modal-paint-results').innerHTML = ''
      await recargarModal()
    } else if (action === 'modal-remove-mini') {
      await db.from('project_minis').delete().eq('id', pmId)
      await recargarModal()
    } else if (action === 'modal-remove-paint') {
      await db.from('project_paints').delete().eq('id', ppId)
      await recargarModal()
    }
  })

  modal.addEventListener('change', async e => {
    if (e.target.dataset.action !== 'modal-update-progress') return
    const val = Math.min(100, Math.max(0, Number(e.target.value) || 0))
    e.target.value = val
    await db.from('minis').update({ paint_progress: val }).eq('id', Number(e.target.dataset.miniId))
    const mini = getMinis().find(m => m.id === Number(e.target.dataset.miniId))
    if (mini) mini.paint_progress = val
  })
}
