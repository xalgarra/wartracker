import { db } from './db.js'
import { state } from './state.js'
import { STATUSES } from './constants.js'
import { mostrarError, mostrarExito } from './toast.js'
import { cargarMinis } from './minis.js'
import { escapeHtml } from './utils.js'

const STATUS_OPTS = STATUSES
  .map(s => `<option value="${s.value}">${s.label}</option>`)
  .join('')

export function abrirArmyImporter() {
  const gameSelect = document.getElementById('army-game')
  gameSelect.innerHTML =
    '<option value="">Selecciona juego…</option>' +
    state.games.map(g => `<option value="${g.slug}">${escapeHtml(g.name)}</option>`).join('')

  document.getElementById('army-faction').innerHTML = '<option value="">Selecciona facción…</option>'
  document.getElementById('army-faction').disabled = true
  document.getElementById('army-unit-list').innerHTML = ''
  _setGuardarBtn(0)

  document.getElementById('modal-army-bg').classList.add('open')
}

export function cerrarArmyImporter() {
  document.getElementById('modal-army-bg').classList.remove('open')
}

export function onArmyGameChange() {
  const slug = document.getElementById('army-game').value
  const factionSelect = document.getElementById('army-faction')

  if (!slug) {
    factionSelect.innerHTML = '<option value="">Selecciona facción…</option>'
    factionSelect.disabled = true
    document.getElementById('army-unit-list').innerHTML = ''
    _setGuardarBtn(0)
    return
  }

  const factions = state.factions
    .filter(f => f.game_slug === slug)
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))

  factionSelect.innerHTML =
    '<option value="">Selecciona facción…</option>' +
    factions.map(f => `<option value="${escapeHtml(f.name)}">${escapeHtml(f.name)}</option>`).join('')
  factionSelect.disabled = false

  document.getElementById('army-unit-list').innerHTML = ''
  _setGuardarBtn(0)
}

export async function onArmyFactionChange() {
  const slug        = document.getElementById('army-game').value
  const factionName = document.getElementById('army-faction').value
  const listEl      = document.getElementById('army-unit-list')

  if (!factionName) {
    listEl.innerHTML = ''
    _setGuardarBtn(0)
    return
  }

  listEl.innerHTML = '<div class="army-loading">Cargando…</div>'

  const units = _getUnitsForFaction(factionName, slug)

  const { data: owned } = await db.from('minis')
    .select('name')
    .contains('factions', [factionName])

  const ownedNames = new Set((owned || []).map(m => m.name.toLowerCase()))

  _renderUnitList(listEl, units, ownedNames)
}

export async function guardarEjercito() {
  const factionName = document.getElementById('army-faction').value
  const rows        = [...document.querySelectorAll('.army-unit-row:not(.army-unit-row--owned)')]
  const toInsert    = []

  for (const row of rows) {
    const cb = row.querySelector('.army-unit-cb')
    if (!cb?.checked) continue
    const qty    = Math.max(1, parseInt(row.querySelector('.army-unit-qty')?.value || '1', 10))
    const status = row.querySelector('.army-unit-status')?.value || 'comprada'
    toInsert.push({ name: cb.dataset.name, factions: [factionName], status, qty, in_stock: true })
  }

  if (!toInsert.length) return

  const btn = document.getElementById('btn-army-guardar')
  btn.disabled = true

  const { error } = await db.from('minis').insert(toInsert)
  if (error) {
    mostrarError('Error al guardar: ' + error.message)
    btn.disabled = false
    return
  }

  mostrarExito(`${toInsert.length} unidad${toInsert.length !== 1 ? 'es' : ''} añadida${toInsert.length !== 1 ? 's' : ''}`)
  cerrarArmyImporter()
  await cargarMinis()
}

// ─── Helpers internos ────────────────────────────────────────────────────────

function _getUnitsForFaction(factionName, gameSlug) {
  const units = []
  for (const [key, points] of Object.entries(state.unitMap)) {
    const sep2 = key.lastIndexOf('|')
    const sep1 = key.lastIndexOf('|', sep2 - 1)
    const name    = key.slice(0, sep1)
    const faction = key.slice(sep1 + 1, sep2)
    const game    = key.slice(sep2 + 1)
    if (faction !== factionName || game !== gameSlug) continue
    const type = state.typeMap?.[key] || null
    units.push({ name, points, type })
  }
  return units.sort((a, b) => a.name.localeCompare(b.name, 'es'))
}

function _renderUnitList(container, units, ownedNames) {
  if (!units.length) {
    container.innerHTML = '<div class="army-empty">No hay unidades en el catálogo para esta facción.</div>'
    _setGuardarBtn(0)
    return
  }

  const available = units.filter(u => !ownedNames.has(u.name.toLowerCase()))
  const owned     = units.filter(u =>  ownedNames.has(u.name.toLowerCase()))

  const selectAllHtml = available.length ? `
    <div class="army-select-all-row">
      <label class="army-select-all-label">
        <input type="checkbox" id="army-select-all">
        <span>Seleccionar todo</span>
      </label>
      <span class="army-units-counter">${available.length} disponible${available.length !== 1 ? 's' : ''}</span>
    </div>` : ''

  const availableHtml = available.map(u => `
    <label class="army-unit-row">
      <input type="checkbox" class="army-unit-cb" data-name="${escapeHtml(u.name)}">
      <span class="army-unit-name">${escapeHtml(u.name)}</span>
      ${u.type ? `<span class="army-unit-type">${escapeHtml(u.type)}</span>` : ''}
      <span class="army-unit-controls">
        <input type="number" class="army-unit-qty" value="1" min="1" max="99">
        <select class="army-unit-status">${STATUS_OPTS}</select>
      </span>
    </label>`).join('')

  const ownedHtml = owned.length ? `
    <div class="army-owned-header">En colección (${owned.length})</div>
    ${owned.map(u => `
      <div class="army-unit-row army-unit-row--owned">
        <span class="army-unit-owned-mark">✓</span>
        <span class="army-unit-name">${escapeHtml(u.name)}</span>
        ${u.type ? `<span class="army-unit-type">${escapeHtml(u.type)}</span>` : ''}
      </div>`).join('')}` : ''

  container.innerHTML = selectAllHtml + availableHtml + ownedHtml

  // Select-all toggle
  const selectAll = document.getElementById('army-select-all')
  if (selectAll) {
    selectAll.addEventListener('change', () => {
      document.querySelectorAll('.army-unit-cb').forEach(cb => { cb.checked = selectAll.checked })
      _updateGuardarBtn()
    })
  }

  container.addEventListener('change', e => {
    if (!e.target.classList.contains('army-unit-cb')) return
    _syncSelectAll()
    _updateGuardarBtn()
  })

  _updateGuardarBtn()
}

function _syncSelectAll() {
  const cbs      = [...document.querySelectorAll('.army-unit-cb')]
  const all      = cbs.every(cb => cb.checked)
  const none     = cbs.every(cb => !cb.checked)
  const selectAll = document.getElementById('army-select-all')
  if (!selectAll) return
  selectAll.checked       = all
  selectAll.indeterminate = !all && !none
}

function _updateGuardarBtn() {
  const n = document.querySelectorAll('.army-unit-cb:checked').length
  _setGuardarBtn(n)
}

function _setGuardarBtn(n) {
  const btn = document.getElementById('btn-army-guardar')
  if (!btn) return
  btn.disabled  = n === 0
  btn.textContent = n > 0
    ? `Añadir ${n} unidad${n !== 1 ? 'es' : ''}`
    : 'Añadir'
}
