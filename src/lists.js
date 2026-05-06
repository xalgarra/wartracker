import { db } from './db.js'
import { state, ensureMinisFull } from './state.js'
import { mostrarError, mostrarExito } from './toast.js'

// Anti-doble-click: set de mini IDs en proceso de añadir
const _adding = new Set()

// ---------------------------------------------------------------------------
// Pure functions (exported for tests)
// ---------------------------------------------------------------------------

export function getPtsForGame(mini, gameSlug, unitMap, factions) {
  for (const faction of (mini.factions || [])) {
    const fc = factions.find(f => f.name === faction && f.game_slug === gameSlug)
    if (!fc) continue
    const pts = unitMap[`${mini.name}|${faction}|${gameSlug}`]
    if (pts) return pts
  }
  return 0
}

export function calcularPtsLista(entries, minis, gameSlug, unitMap, factions) {
  let total = 0
  for (const entry of entries) {
    const mini = minis.find(m => m.id === entry.mini_id)
    if (!mini) continue
    total += getPtsForGame(mini, gameSlug, unitMap, factions) * entry.qty
  }
  return total
}

export function calcularPtsPintadosLista(entries, minis, gameSlug, unitMap, factions) {
  let total = 0
  for (const entry of entries) {
    const mini = minis.find(m => m.id === entry.mini_id)
    if (!mini || mini.status !== 'pintada') continue
    total += getPtsForGame(mini, gameSlug, unitMap, factions) * entry.qty
  }
  return total
}

export function pctPintado(total, pintados) {
  if (!total) return 0
  return Math.round((pintados / total) * 100)
}

// ---------------------------------------------------------------------------
// Load & render
// ---------------------------------------------------------------------------

export async function cargarLists() {
  const { data, error } = await db.from('army_lists').select('*').order('created_at', { ascending: false })
  if (error) { mostrarError('Error cargando listas'); return }
  state.listsActuales = data || []

  if (state.listaEnDetalle) {
    const still = state.listsActuales.find(l => l.id === state.listaEnDetalle.id)
    if (still) {
      state.listaEnDetalle = still
      await renderDetalle(still)
    } else {
      state.listaEnDetalle = null
      renderOverview()
    }
  } else {
    renderOverview()
  }
}

// ---------------------------------------------------------------------------
// Overview
// ---------------------------------------------------------------------------

function renderOverview() {
  const el = document.getElementById('listas-content')
  if (!el) return

  const cards = state.listsActuales.length
    ? state.listsActuales.map(renderListCard).join('')
    : '<div class="empty">No hay listas — crea una abajo</div>'

  el.innerHTML = `
    <div class="lists-overview">
      <div class="lists-grid">${cards}</div>
      <div class="lists-new-form">
        <h3>Nueva lista</h3>
        <div class="lists-form-row">
          <input id="list-name" type="text" placeholder="Nombre de la lista" maxlength="60" />
          <select id="list-game">
            <option value="">— Juego —</option>
            ${state.games.map(g => `<option value="${g.slug}">${g.name}</option>`).join('')}
          </select>
          <input id="list-target" type="number" min="0" step="50" placeholder="Pts objetivo (opcional)" />
          <button data-action="crear-lista" class="btn-primary">Crear vacía</button>
          <button data-action="abrir-importer" class="btn-secondary">Importar de texto…</button>
        </div>
        <div class="lists-builder-hints">
          <span>Editores recomendados:</span>
          <a href="https://battlescribe.net" target="_blank" rel="noopener">BattleScribe</a>
          <a href="https://newrecruit.eu" target="_blank" rel="noopener">NewRecruit</a>
          <a href="https://www.gw-listbuilder.com" target="_blank" rel="noopener">GW List Builder</a>
        </div>
      </div>
    </div>
  `
}

function renderListCard(lista) {
  return `
    <div class="list-card" data-action="abrir-lista" data-list-id="${lista.id}">
      <div class="list-card-name">${lista.name}</div>
      <div class="list-card-meta">
        ${lista.game.toUpperCase()}${lista.faction ? ` · ${lista.faction}` : ''}
        ${lista.target_points ? ` · ${lista.target_points.toLocaleString()} pts objetivo` : ''}
      </div>
      <button class="list-card-delete" data-action="eliminar-lista" data-list-id="${lista.id}" title="Eliminar lista">✕</button>
    </div>
  `
}

// ---------------------------------------------------------------------------
// Detail
// ---------------------------------------------------------------------------

async function renderDetalle(lista) {
  const el = document.getElementById('listas-content')
  if (!el) return

  const { data: entries, error } = await db
    .from('army_list_units')
    .select('*')
    .eq('list_id', lista.id)
    .order('created_at', { ascending: true })

  if (error) { mostrarError('Error cargando unidades'); return }

  const minis = await ensureMinisFull()
  const total = calcularPtsLista(entries, minis, lista.game, state.unitMap, state.factions)
  const pintados = calcularPtsPintadosLista(entries, minis, lista.game, state.unitMap, state.factions)
  const pct = pctPintado(total, pintados)

  const targetBar = lista.target_points
    ? `<div class="list-detail-progress-bar"><div style="width:${Math.min(100, Math.round(total / lista.target_points * 100))}%"></div></div>
       <div class="list-detail-target">${total.toLocaleString()} / ${lista.target_points.toLocaleString()} pts</div>`
    : `<div class="list-detail-pts">${total.toLocaleString()} pts</div>`

  // Minis disponibles: misma facción/juego, no en lista aún
  const inListIds = new Set(entries.map(e => e.mini_id))
  const available = minis.filter(m => {
    if (inListIds.has(m.id)) return false
    const matchGame = (m.factions || []).some(f => {
      const fc = state.factions.find(x => x.name === f)
      return fc && fc.game_slug === lista.game
    })
    return matchGame
  })

  el.innerHTML = `
    <div class="list-detail">
      <div class="list-detail-header">
        <button data-action="volver-overview" class="btn-back">← Listas</button>
        <div>
          <div class="list-detail-name">${lista.name}</div>
          <div class="list-detail-meta">${lista.game.toUpperCase()}${lista.faction ? ` · ${lista.faction}` : ''}</div>
        </div>
      </div>
      <div class="list-detail-stats">
        ${targetBar}
        <div class="list-detail-painted">${pintados.toLocaleString()} pts pintados · ${pct}%</div>
      </div>
      <div class="list-units">
        ${entries.length
          ? entries.map(e => renderEntryRow(e, lista.game)).join('')
          : '<div class="empty">Lista vacía — añade minis abajo</div>'}
      </div>
      <div class="list-add-panel">
        <div class="list-add-header">Añadir mini</div>
        <input id="list-add-search" type="text" placeholder="Buscar por nombre…" />
        <div class="list-add-scroll">
          ${renderAvailableMinis(available, lista.game)}
        </div>
      </div>
    </div>
  `

  // Bind búsqueda inline (solo una vez por render)
  const searchInput = el.querySelector('#list-add-search')
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.toLowerCase()
      const filtered = available.filter(m => m.name.toLowerCase().includes(q))
      el.querySelector('.list-add-scroll').innerHTML = renderAvailableMinis(filtered, lista.game)
    })
  }
}

function renderEntryRow(entry, gameSlug) {
  const mini = (state.minisFull || []).find(m => m.id === entry.mini_id)
  if (!mini) return ''
  const pts = getPtsForGame(mini, gameSlug, state.unitMap, state.factions)
  const painted = mini.status === 'pintada' ? '🎨' : ''
  return `
    <div class="list-unit-row" data-entry-id="${entry.id}">
      <span class="list-unit-name">${mini.name} ${painted}</span>
      <span class="list-unit-pts">${pts ? pts.toLocaleString() + ' pts' : '—'}</span>
      <button data-action="quitar-entry" data-entry-id="${entry.id}" class="list-unit-remove" title="Quitar">✕</button>
    </div>
  `
}

function renderAvailableMinis(minis, gameSlug) {
  if (!minis.length) return '<div class="empty-small">No hay minis disponibles para este juego</div>'
  return minis.map(m => {
    const pts = getPtsForGame(m, gameSlug, state.unitMap, state.factions)
    return `
      <div class="list-add-item" data-action="add-mini-to-list" data-mini-id="${m.id}">
        <span class="list-add-name">${m.name}</span>
        <span class="list-add-pts">${pts ? pts.toLocaleString() + ' pts' : '—'}</span>
      </div>
    `
  }).join('')
}

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

export function bindListsEvents(container) {
  if (container.dataset.bound === 'lists') return
  container.dataset.bound = 'lists'

  container.addEventListener('click', async e => {
    const action = e.target.closest('[data-action]')?.dataset?.action
    if (!action) return

    if (action === 'crear-lista') return handleCrearLista()
    if (action === 'abrir-importer') {
      const { abrirListImporter } = await import('./list-importer.js')
      return abrirListImporter()
    }
    if (action === 'abrir-lista') {
      const id = e.target.closest('[data-list-id]')?.dataset?.listId
      if (id) return abrirLista(id)
    }
    if (action === 'eliminar-lista') {
      e.stopPropagation()
      const id = e.target.closest('[data-list-id]')?.dataset?.listId
      if (id) return handleEliminarLista(id)
    }
    if (action === 'volver-overview') {
      state.listaEnDetalle = null
      return renderOverview()
    }
    if (action === 'add-mini-to-list') {
      const miniId = e.target.closest('[data-mini-id]')?.dataset?.miniId
      const btn = e.target.closest('[data-action]')
      if (miniId && state.listaEnDetalle) return handleAddMini(miniId, btn)
    }
    if (action === 'quitar-entry') {
      const entryId = e.target.closest('[data-entry-id]')?.dataset?.entryId
      if (entryId && state.listaEnDetalle) return handleQuitarEntry(entryId)
    }
  })
}

async function handleCrearLista() {
  const name = document.getElementById('list-name')?.value.trim()
  const game = document.getElementById('list-game')?.value
  const target = document.getElementById('list-target')?.value

  if (!name) { mostrarError('Escribe un nombre para la lista'); return }
  if (!game) { mostrarError('Selecciona un juego'); return }

  const { data: { user } } = await db.auth.getUser()
  const payload = { name, game, faction: '', target_points: target ? parseInt(target) : null, user_id: user.id }
  const { error } = await db.from('army_lists').insert(payload)
  if (error) { mostrarError('Error creando lista'); return }
  mostrarExito('Lista creada')
  await cargarLists()
}

async function handleEliminarLista(id) {
  const { error } = await db.from('army_lists').delete().eq('id', id)
  if (error) { mostrarError('Error eliminando lista'); return }
  if (state.listaEnDetalle?.id === id) state.listaEnDetalle = null
  mostrarExito('Lista eliminada')
  await cargarLists()
}

async function abrirLista(id) {
  await ensureMinisFull()
  const lista = state.listsActuales.find(l => l.id === id)
  if (!lista) return
  state.listaEnDetalle = lista
  await renderDetalle(lista)

  const container = document.getElementById('listas-content')
  if (container) bindListsEvents(container)
}

async function handleAddMini(miniId, btnEl) {
  if (_adding.has(miniId)) return
  _adding.add(miniId)
  if (btnEl) { btnEl.style.opacity = '0.5'; btnEl.style.pointerEvents = 'none' }

  const { data: { user } } = await db.auth.getUser()
  const { error } = await db.from('army_list_units').insert({
    list_id: state.listaEnDetalle.id,
    mini_id: Number(miniId),
    qty: 1,
    user_id: user.id,
  })

  _adding.delete(miniId)
  if (btnEl) { btnEl.style.opacity = ''; btnEl.style.pointerEvents = '' }

  if (error) { mostrarError('Error añadiendo mini'); return }
  await renderDetalle(state.listaEnDetalle)

  const container = document.getElementById('listas-content')
  if (container) bindListsEvents(container)
}

async function handleQuitarEntry(entryId) {
  const { error } = await db.from('army_list_units').delete().eq('id', entryId)
  if (error) { mostrarError('Error quitando mini'); return }
  await renderDetalle(state.listaEnDetalle)

  const container = document.getElementById('listas-content')
  if (container) bindListsEvents(container)
}
