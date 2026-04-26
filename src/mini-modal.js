import { db } from './db.js'
import { state } from './state.js'
import { actualizarFiltroFacciones } from './minis.js'
import { cargarWishlist } from './wishlist.js'

export function onPhotoSelected(input) {
  const file = input.files[0]
  if (!file) return
  state.pendingPhotoFile = file
  state.pendingPhotoRemove = false
  const preview = document.getElementById('photo-preview')
  preview.src = URL.createObjectURL(file)
  preview.style.display = 'block'
  document.getElementById('btn-remove-photo').style.display = 'inline-block'
  document.getElementById('photo-btn-text').textContent = 'Cambiar foto'
}

export function removePhoto() {
  state.pendingPhotoFile = null
  state.pendingPhotoRemove = true
  document.getElementById('photo-preview').style.display = 'none'
  document.getElementById('photo-preview').src = ''
  document.getElementById('photo-input').value = ''
  document.getElementById('btn-remove-photo').style.display = 'none'
  document.getElementById('photo-btn-text').textContent = 'Añadir foto'
}

export function resetPhotoModal(photoUrl) {
  state.pendingPhotoFile = null
  state.pendingPhotoRemove = false
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

export async function actualizarUnidades() {
  const faction = document.getElementById('faction').value
  const game = document.getElementById('game').value

  const { data } = await db.from('units').select('name')
    .eq('faction', faction).eq('game_slug', game).order('name')

  document.getElementById('unit-select').innerHTML =
    '<option value="">— Selecciona unidad —</option>' +
    (data || []).map(u => `<option value="${u.name}">${u.name}</option>`).join('') +
    '<option value="__custom__">Otro (personalizado)...</option>'

  onUnitChange()
}

export async function onUnitChange() {
  const val = document.getElementById('unit-select').value
  const customInput = document.getElementById('name-custom')

  customInput.style.display = val === '__custom__' ? 'block' : 'none'
  if (val === '__custom__') customInput.focus()

  await actualizarFaccionesExtra(val)
}

export async function actualizarFaccionesExtra(unitName, faccionesYaMarcadas = []) {
  const container = document.getElementById('extra-factions-container')
  const primaryFaction = document.getElementById('faction').value

  if (!unitName || unitName === '' || unitName === '__custom__') {
    container.style.display = 'none'
    return
  }

  const { data } = await db.from('units').select('name, faction, game_slug')
    .eq('name', unitName)
    .neq('faction', primaryFaction)

  if (!data || !data.length) {
    container.style.display = 'none'
    return
  }

  const gameName = slug => state.games.find(g => g.slug === slug)?.name || slug

  container.style.display = 'block'
  container.innerHTML = `
    <div class="extra-factions">
      <div class="extra-factions-label">Esta unidad también está disponible en:</div>
      ${data.map(u => `
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
    await actualizarUnidades()
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

  const { data: unitsData } = await db.from('units').select('name')
    .eq('faction', mini.factions[0]).eq('game_slug', mini.game).order('name')

  document.getElementById('unit-select').innerHTML =
    '<option value="">— Selecciona unidad —</option>' +
    (unitsData || []).map(u => `<option value="${u.name}">${u.name}</option>`).join('') +
    '<option value="__custom__">Otro (personalizado)...</option>'

  const enCatalogo = (unitsData || []).some(u => u.name === mini.name)
  if (enCatalogo) {
    document.getElementById('unit-select').value = mini.name
    document.getElementById('name-custom').style.display = 'none'
  } else {
    document.getElementById('unit-select').value = '__custom__'
    document.getElementById('name-custom').value = mini.name
    document.getElementById('name-custom').style.display = 'block'
  }

  await actualizarFaccionesExtra(enCatalogo ? mini.name : '__custom__', mini.factions.slice(1))

  document.getElementById('qty').value = mini.qty
  document.getElementById('models').value = mini.models || ''
  document.getElementById('status').value = mini.status
  document.getElementById('notes').value = mini.notes || ''
  resetPhotoModal(mini.photo_url || null)

  document.getElementById('modal-title').textContent = 'Editar miniatura'
  document.getElementById('btn-eliminar').style.display = 'block'
  document.getElementById('modal-bg').classList.add('open')
}

export function cerrarModal() {
  state.miniEnEdicion = null
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
}

export async function guardarMini() {
  const unitVal = document.getElementById('unit-select').value
  const name = unitVal === '__custom__'
    ? document.getElementById('name-custom').value.trim()
    : unitVal
  if (!name) { alert('Selecciona una unidad'); return }

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
    notes: document.getElementById('notes').value
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

  if (error) { alert('Error: ' + error.message); return }

  if (savedId) {
    if (state.pendingPhotoFile) {
      const ext = state.pendingPhotoFile.name.split('.').pop().toLowerCase()
      const path = `${savedId}.${ext}`
      await db.storage.from('mini-photos').upload(path, state.pendingPhotoFile, { upsert: true })
      const { data: { publicUrl } } = db.storage.from('mini-photos').getPublicUrl(path)
      await db.from('minis').update({ photo_url: publicUrl }).eq('id', savedId)
    } else if (state.pendingPhotoRemove && state.miniEnEdicion?.photo_url) {
      const path = state.miniEnEdicion.photo_url.split('/mini-photos/')[1]
      if (path) await db.storage.from('mini-photos').remove([path])
      await db.from('minis').update({ photo_url: null }).eq('id', savedId)
    }
  }

  localStorage.setItem('wt_lastGame', document.getElementById('game').value)
  localStorage.setItem('wt_lastFaction', document.getElementById('faction').value)
  cerrarModal()
  if (state.tabActual === 'wishlist') { await cargarWishlist() } else { await actualizarFiltroFacciones() }
}

export async function eliminarMini() {
  if (!state.miniEnEdicion) return
  if (!confirm(`¿Eliminar "${state.miniEnEdicion.name}"?`)) return

  if (state.miniEnEdicion.photo_url) {
    const path = state.miniEnEdicion.photo_url.split('/mini-photos/')[1]
    if (path) await db.storage.from('mini-photos').remove([path])
  }
  const { error } = await db.from('minis').delete().eq('id', state.miniEnEdicion.id)
  if (error) { alert('Error: ' + error.message); return }

  cerrarModal()
  if (state.tabActual === 'wishlist') { await cargarWishlist() } else { await actualizarFiltroFacciones() }
}
