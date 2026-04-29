import { db } from './db.js'
import { state } from './state.js'
import { actualizarFiltroFacciones } from './minis.js'
import { cargarWishlist } from './wishlist.js'
import { mostrarError } from './toast.js'
import { cargarHome } from './home.js'
import { escapeHtml, compressImage, storagePathFrom } from './utils.js'

// ── Gallery state ─────────────────────────────────────────────────────────────
let _galleryPhotos     = []
let _pendingGallery    = []
let _deletedGalleryIds = new Set()
let _galleryEventsBound = false

// ── Cover photo state (module-local, not global) ───────────────────────────────
let _pendingPhotoFile   = null
let _pendingPhotoRemove = false

const GALLERY_LABELS = ['Sin montar', 'Montada', 'En proceso', 'Terminada']

function _resetGallery() {
  _galleryPhotos     = []
  _pendingGallery    = []
  _deletedGalleryIds = new Set()
}

function _renderGalleryList() {
  const list = document.getElementById('mini-gallery-list')
  if (!list) return

  const existingHtml = _galleryPhotos
    .filter(p => !_deletedGalleryIds.has(p.id))
    .map(p => `
      <div class="gallery-item">
        <img class="gallery-item-thumb" src="${p.url}" alt="" loading="lazy">
        <select class="gallery-item-label" data-photo-id="${p.id}">
          ${GALLERY_LABELS.map(l => `<option${l === p.label ? ' selected' : ''}>${l}</option>`).join('')}
        </select>
        <button class="gallery-item-remove" data-action="delete-gallery-photo" data-photo-id="${p.id}">✕</button>
      </div>`).join('')

  const pendingHtml = _pendingGallery.map((p, i) => `
    <div class="gallery-item gallery-item--pending">
      <img class="gallery-item-thumb" src="${p.tempUrl}" alt="">
      <select class="gallery-item-label" data-pending-idx="${i}">
        ${GALLERY_LABELS.map(l => `<option${l === p.label ? ' selected' : ''}>${l}</option>`).join('')}
      </select>
      <button class="gallery-item-remove" data-action="delete-pending-photo" data-pending-idx="${i}">✕</button>
    </div>`).join('')

  list.innerHTML = existingHtml + pendingHtml
}

function _ensureGalleryEvents() {
  if (_galleryEventsBound) return
  _galleryEventsBound = true

  document.getElementById('mini-gallery-list')?.addEventListener('click', e => {
    const delExisting = e.target.closest('[data-action="delete-gallery-photo"]')
    if (delExisting) {
      _deletedGalleryIds.add(delExisting.dataset.photoId)
      _renderGalleryList()
      return
    }
    const delPending = e.target.closest('[data-action="delete-pending-photo"]')
    if (delPending) {
      const idx = Number(delPending.dataset.pendingIdx)
      URL.revokeObjectURL(_pendingGallery[idx]?.tempUrl)
      _pendingGallery.splice(idx, 1)
      _renderGalleryList()
    }
  })

  document.getElementById('mini-gallery-list')?.addEventListener('change', e => {
    const sel = e.target.closest('.gallery-item-label[data-pending-idx]')
    if (sel) _pendingGallery[Number(sel.dataset.pendingIdx)].label = sel.value
  })
}

export async function onGalleryPhotoSelected(input) {
  const files = [...(input.files || [])]
  input.value = ''
  for (const file of files) {
    const compressed = await compressImage(file)
    _pendingGallery.push({ file: compressed, label: 'Sin montar', tempUrl: URL.createObjectURL(compressed) })
  }
  _renderGalleryList()
}

export async function onPhotoSelected(input) {
  const file = input.files[0]
  if (!file) return
  const compressed = await compressImage(file)
  _pendingPhotoFile = compressed
  _pendingPhotoRemove = false
  const preview = document.getElementById('photo-preview')
  preview.src = URL.createObjectURL(compressed)
  preview.style.display = 'block'
  document.getElementById('btn-remove-photo').style.display = 'inline-block'
  document.getElementById('photo-btn-text').textContent = 'Cambiar foto'
}

export function removePhoto() {
  _pendingPhotoFile = null
  _pendingPhotoRemove = true
  document.getElementById('photo-preview').style.display = 'none'
  document.getElementById('photo-preview').src = ''
  document.getElementById('photo-input').value = ''
  document.getElementById('btn-remove-photo').style.display = 'none'
  document.getElementById('photo-btn-text').textContent = 'Añadir foto'
}

export function resetPhotoModal(photoUrl) {
  _pendingPhotoFile = null
  _pendingPhotoRemove = false
  const preview = document.getElementById('photo-preview')
  document.getElementById('photo-input').value = ''
  if (photoUrl) {
    preview.src = photoUrl
    preview.style.display = 'block'
    document.getElementById('btn-remove-photo').style.display = 'inline-block'
    document.getElementById('photo-btn-text').textContent = 'Cambiar foto'
  } else {
    preview.style.display = 'none'
    preview.src = ''
    document.getElementById('btn-remove-photo').style.display = 'none'
    document.getElementById('photo-btn-text').textContent = 'Añadir foto'
  }
}

export function actualizarFacciones() {
  const gameSlug = document.getElementById('game').value
  const filtradas = state.factions.filter(f => f.game_slug === gameSlug)
  document.getElementById('faction').innerHTML = filtradas.map(f =>
    `<option value="${f.name}">${f.name}</option>`
  ).join('')
  actualizarUnidades()
}

export function actualizarUnidades() {
  const faction = document.getElementById('faction').value
  const game = document.getElementById('game').value

  const units = state.units
    .filter(u => u.faction === faction && u.game_slug === game)
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))

  document.getElementById('unit-select').innerHTML =
    '<option value="">— Selecciona unidad —</option>' +
    units.map(u => `<option value="${u.name}">${u.name}</option>`).join('') +
    '<option value="__custom__">Otro (personalizado)...</option>'

  onUnitChange()
}

export function onUnitChange() {
  const val = document.getElementById('unit-select').value
  const customInput = document.getElementById('name-custom')
  customInput.style.display = val === '__custom__' ? 'block' : 'none'
  if (val === '__custom__') customInput.focus()
  actualizarFaccionesExtra(val)
}

export function actualizarFaccionesExtra(unitName, faccionesYaMarcadas = []) {
  const container = document.getElementById('extra-factions-container')
  const primaryFaction = document.getElementById('faction').value

  if (!unitName || unitName === '' || unitName === '__custom__') {
    container.style.display = 'none'
    return
  }

  const matches = state.units.filter(u => u.name === unitName && u.faction !== primaryFaction)

  if (!matches.length) {
    container.style.display = 'none'
    return
  }

  const gameName = slug => state.games.find(g => g.slug === slug)?.name || slug

  container.style.display = 'block'
  container.innerHTML = `
    <div class="extra-factions">
      <div class="extra-factions-label">Esta unidad también está disponible en:</div>
      ${matches.map(u => `
        <label class="extra-faction-check">
          <input type="checkbox" value="${u.faction}" data-game="${u.game_slug}"
            ${faccionesYaMarcadas.includes(u.faction) ? 'checked' : ''}>
          ${u.faction} · ${gameName(u.game_slug)}
        </label>
      `).join('')}
    </div>
  `
}

export async function abrirModal(abrirModalPintura) {
  if (state.tabActual === 'pinturas') { abrirModalPintura(); return }
  state.miniEnEdicion = null
  document.getElementById('modal-title').textContent = 'Añadir miniatura'
  document.getElementById('btn-eliminar').style.display = 'none'
  document.getElementById('mini-gallery-section').style.display = 'none'
  document.getElementById('mini-paints-used').style.display = 'none'

  const lastGame = localStorage.getItem('wt_lastGame')
  const lastFaction = localStorage.getItem('wt_lastFaction')
  if (lastGame && state.games.find(g => g.slug === lastGame)) {
    document.getElementById('game').value = lastGame
    const filtradas = state.factions.filter(f => f.game_slug === lastGame)
    document.getElementById('faction').innerHTML = filtradas.map(f =>
      `<option value="${f.name}">${f.name}</option>`
    ).join('')
    if (lastFaction && filtradas.find(f => f.name === lastFaction)) {
      document.getElementById('faction').value = lastFaction
    }
    actualizarUnidades()
  }

  document.getElementById('status').value = 'comprada'
  resetPhotoModal(null)
  document.getElementById('modal-bg').classList.add('open')
}

export async function abrirEdicion(id) {
  const mini = state.minisActuales.find(m => m.id === id) || state.wishlistActuales.find(m => m.id === id)
  if (!mini) return
  state.miniEnEdicion = mini

  document.getElementById('game').value = mini.game
  const filtradas = state.factions.filter(f => f.game_slug === mini.game)
  document.getElementById('faction').innerHTML = filtradas.map(f =>
    `<option value="${f.name}">${f.name}</option>`
  ).join('')
  document.getElementById('faction').value = mini.factions[0] || ''

  const unitsData = state.units
    .filter(u => u.faction === mini.factions[0] && u.game_slug === mini.game)
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))

  document.getElementById('unit-select').innerHTML =
    '<option value="">— Selecciona unidad —</option>' +
    unitsData.map(u => `<option value="${u.name}">${u.name}</option>`).join('') +
    '<option value="__custom__">Otro (personalizado)...</option>'

  const enCatalogo = unitsData.some(u => u.name === mini.name)
  if (enCatalogo) {
    document.getElementById('unit-select').value = mini.name
    document.getElementById('name-custom').style.display = 'none'
  } else {
    document.getElementById('unit-select').value = '__custom__'
    document.getElementById('name-custom').value = mini.name
    document.getElementById('name-custom').style.display = 'block'
  }

  actualizarFaccionesExtra(enCatalogo ? mini.name : '__custom__', mini.factions.slice(1))

  document.getElementById('qty').value = mini.qty
  document.getElementById('models').value = mini.models || ''
  document.getElementById('status').value = mini.status
  document.getElementById('notes').value = mini.notes || ''
  document.getElementById('hobby-blocker').value = mini.hobby_blocker || ''
  document.getElementById('assembly-risk').value = mini.assembly_risk || ''
  resetPhotoModal(mini.photo_url || null)

  document.getElementById('modal-title').textContent = 'Editar miniatura'
  document.getElementById('btn-eliminar').style.display = 'block'

  // Galería + pinturas usadas — queries paralelas
  _resetGallery()
  const [{ data: galleryData }, { data: projData }] = await Promise.all([
    db.from('mini_photos').select('id, url, label, position').eq('mini_id', id).order('position').order('created_at'),
    db.from('project_minis').select('projects(id, name, status, project_paints(paints(id, name, brand, color_hex)))').eq('mini_id', id)
  ])
  _galleryPhotos = galleryData || []
  _renderGalleryList()
  _ensureGalleryEvents()
  document.getElementById('mini-gallery-section').style.display = 'block'

  const activeProjs = (projData || [])
    .map(pm => pm.projects).filter(p => p && (p.status === 'activo' || p.status === 'completado'))
  const paintSection = document.getElementById('mini-paints-used')
  if (activeProjs.length) {
    const bodyHtml = activeProjs.map(p => {
      const paints = (p.project_paints || []).filter(pp => pp.paints)
      if (!paints.length) return ''
      return `<div class="mini-paints-project">
        <div class="mini-paints-proj-name">${escapeHtml(p.name)}</div>
        <div class="mini-paints-chips">
          ${paints.map(pp => `
            <div class="mini-paint-chip" title="${escapeHtml(pp.paints.name)}">
              <div class="paint-swatch ${pp.paints.color_hex ? '' : 'paint-swatch-none'}"
                   style="${pp.paints.color_hex ? `background:${pp.paints.color_hex}` : ''}"></div>
              <span class="mini-paint-chip-name">${escapeHtml(pp.paints.name)}</span>
            </div>`).join('')}
        </div>
      </div>`
    }).filter(Boolean).join('')
    paintSection.innerHTML = `<div class="mini-paints-label">// pinturas usadas</div>${bodyHtml || '<div class="mini-paints-empty">Sin pinturas en los proyectos</div>'}`
    paintSection.style.display = 'block'
  } else {
    paintSection.style.display = 'none'
  }

  document.getElementById('modal-bg').classList.add('open')
}

export function cerrarModal() {
  state.miniEnEdicion = null
  _resetGallery()
  document.getElementById('modal-bg').classList.remove('open')
  document.getElementById('modal-title').textContent = 'Añadir miniatura'
  document.getElementById('btn-eliminar').style.display = 'none'
  document.getElementById('unit-select').selectedIndex = 0
  document.getElementById('name-custom').value = ''
  document.getElementById('name-custom').style.display = 'none'
  document.getElementById('extra-factions-container').style.display = 'none'
  document.getElementById('notes').value = ''
  document.getElementById('qty').value = 1
  document.getElementById('models').value = ''
  document.getElementById('hobby-blocker').value = ''
  document.getElementById('assembly-risk').value = ''
}

export async function guardarMini() {
  const btn = document.getElementById('btn-guardar-mini')
  if (btn) btn.disabled = true
  try {
    const unitVal = document.getElementById('unit-select').value
    const name = unitVal === '__custom__'
      ? document.getElementById('name-custom').value.trim()
      : unitVal
    if (!name) { mostrarError('Selecciona una unidad'); return }

    const primaryFaction = document.getElementById('faction').value
    const game = document.getElementById('game').value
    const extrasChecked = [...document.querySelectorAll('#extra-factions-container input[type="checkbox"]:checked')]
    const minisFactions = [primaryFaction, ...extrasChecked.map(cb => cb.value)]

    const modelsVal = parseInt(document.getElementById('models').value) || null
    const payload = {
      name,
      factions: minisFactions,
      game,
      qty: parseInt(document.getElementById('qty').value) || 1,
      models: modelsVal,
      status: document.getElementById('status').value,
      notes: document.getElementById('notes').value,
      hobby_blocker: document.getElementById('hobby-blocker').value || null,
      assembly_risk: document.getElementById('assembly-risk').value || null,
    }

    let error
    let savedId = state.miniEnEdicion?.id

    if (state.miniEnEdicion) {
      ;({ error } = await db.from('minis').update(payload).eq('id', state.miniEnEdicion.id))
    } else {
      const { data: inserted, error: err } = await db.from('minis').insert(payload).select('id').single()
      error = err
      if (inserted) savedId = inserted.id
    }

    if (error) { mostrarError('Error: ' + error.message); return }

    if (savedId) {
      if (_pendingPhotoFile) {
        const path = `${savedId}.jpg`
        await db.storage.from('mini-photos').upload(path, _pendingPhotoFile, { upsert: true })
        const { data: { publicUrl } } = db.storage.from('mini-photos').getPublicUrl(path)
        await db.from('minis').update({ photo_url: publicUrl }).eq('id', savedId)
      } else if (_pendingPhotoRemove && state.miniEnEdicion?.photo_url) {
        const path = storagePathFrom(state.miniEnEdicion.photo_url, 'mini-photos')
        if (path) await db.storage.from('mini-photos').remove([path])
        await db.from('minis').update({ photo_url: null }).eq('id', savedId)
      }

      if (state.miniEnEdicion) {
        for (const photoId of _deletedGalleryIds) {
          const photo = _galleryPhotos.find(p => p.id === photoId)
          if (photo?.url) {
            const storagePath = storagePathFrom(photo.url, 'mini-photos')
            if (storagePath) await db.storage.from('mini-photos').remove([storagePath])
          }
          await db.from('mini_photos').delete().eq('id', photoId)
        }
        for (const photo of _galleryPhotos.filter(p => !_deletedGalleryIds.has(p.id))) {
          const el = document.querySelector(`.gallery-item-label[data-photo-id="${photo.id}"]`)
          if (el && el.value !== photo.label) {
            await db.from('mini_photos').update({ label: el.value }).eq('id', photo.id)
          }
        }
        const basePos = _galleryPhotos.filter(p => !_deletedGalleryIds.has(p.id)).length
        for (let i = 0; i < _pendingGallery.length; i++) {
          const pg   = _pendingGallery[i]
          const path = `${savedId}/g_${Date.now()}_${i}.jpg`
          const { error: upErr } = await db.storage.from('mini-photos').upload(path, pg.file)
          if (upErr) { mostrarError(`Error subiendo foto ${i + 1}`); continue }
          const { data: { publicUrl } } = db.storage.from('mini-photos').getPublicUrl(path)
          await db.from('mini_photos').insert({ mini_id: savedId, url: publicUrl, label: pg.label, position: basePos + i })
        }
      }
    }

    localStorage.setItem('wt_lastGame', document.getElementById('game').value)
    localStorage.setItem('wt_lastFaction', document.getElementById('faction').value)
    cerrarModal()
    if (state.tabActual === 'wishlist') { await cargarWishlist() } else { await actualizarFiltroFacciones() }
    if (state.tabActual === 'home') cargarHome()
  } finally {
    if (btn) btn.disabled = false
  }
}

export async function eliminarMini() {
  if (!state.miniEnEdicion) return
  if (!confirm(`¿Eliminar "${state.miniEnEdicion.name}"?`)) return

  if (state.miniEnEdicion.photo_url) {
    const path = storagePathFrom(state.miniEnEdicion.photo_url, 'mini-photos')
    if (path) await db.storage.from('mini-photos').remove([path])
  }
  const { data: galleryToDelete } = await db.from('mini_photos').select('url').eq('mini_id', state.miniEnEdicion.id)
  for (const p of galleryToDelete || []) {
    const storagePath = storagePathFrom(p.url, 'mini-photos')
    if (storagePath) await db.storage.from('mini-photos').remove([storagePath])
  }
  const { error } = await db.from('minis').delete().eq('id', state.miniEnEdicion.id)
  if (error) { mostrarError('Error: ' + error.message); return }

  cerrarModal()
  if (state.tabActual === 'wishlist') { await cargarWishlist() } else { await actualizarFiltroFacciones() }
  if (state.tabActual === 'home') cargarHome()
}
