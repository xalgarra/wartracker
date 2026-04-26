import { db } from './db.js'
import { state } from './state.js'
import { STATUS_ORDER } from './constants.js'

export function getTypeForMini(m) {
  for (const faction of (m.factions || [])) {
    const fc = state.factions.find(f => f.name === faction)
    if (!fc) continue
    const t = state.typeMap[`${m.name}|${faction}|${fc.game_slug}`]
    if (t) return t
  }
  return null
}

export function renderCard(m) {
  const opciones = (m.name || '').split('/').map(o => o.trim()).filter(Boolean)
  const nombreHTML = opciones.length > 1
    ? `<div class="card-name">${opciones[0]}</div>` +
      opciones.slice(1).map(o => `<div class="card-name-alt">${o}</div>`).join('')
    : `<div class="card-name">${m.name}</div>`
  const faccionesText = (m.factions || []).join(' · ') || '-'
  const juegosUnicos = [...new Set(
    (m.factions || []).map(f => state.factions.find(fc => fc.name === f)?.game_slug).filter(Boolean)
  )]
  const gameAcronym = { aos: 'AoS', '40k': '40K' }
  const gameBadges = juegosUnicos
    .map(slug => `<span class="badge badge-game-${slug}">${gameAcronym[slug] || slug}</span>`)
    .join(' ')
  const gamePtsList = juegosUnicos.map(slug => {
    const fac = (m.factions || []).find(f => state.factions.find(x => x.name === f && x.game_slug === slug))
    const pts = fac ? state.unitMap[`${m.name}|${fac}|${slug}`] : null
    return pts ? `${(pts * m.qty).toLocaleString()} ${gameAcronym[slug] || slug}` : null
  }).filter(Boolean)
  const modelsStr = m.models ? ` · ${m.models * m.qty} mod.` : ''
  const unitType = getTypeForMini(m)
  const typeBadge = unitType ? `<span class="badge badge-type">${unitType}</span>` : ''
  const thumbHTML = m.photo_url ? `<img class="card-thumb" src="${m.photo_url}" alt="">` : ''
  return `
    <div class="card" onclick="abrirEdicion(${m.id})">
      ${thumbHTML}
      <div class="card-body">
        <div class="card-header">
          <div>${nombreHTML}</div>
        </div>
        <div class="card-factions">${faccionesText}</div>
        <div class="card-footer">
          <div class="card-footer-left">
            ${gameBadges}
            ${typeBadge}
            <span class="badge badge-status ${m.status}">${m.status}</span>
          </div>
          <div class="card-footer-right">
            ${gamePtsList.map(p => `<span class="card-pts-line">${p}</span>`).join('')}
            <span class="card-qty">${m.qty} ud.${modelsStr}</span>
          </div>
        </div>
      </div>
    </div>
  `
}

export function renderLista() {
  const busqueda = state.filtroNombre.trim().toLowerCase()
  let minis = busqueda
    ? state.minisActuales.filter(m => (m.name || '').toLowerCase().includes(busqueda))
    : state.minisActuales
  if (state.filtroType) minis = minis.filter(m => getTypeForMini(m) === state.filtroType)

  const dir = state.sortDir === 'asc' ? 1 : -1
  if (state.ordenar === 'nombre') {
    minis = [...minis].sort((a, b) => dir * (a.name || '').localeCompare(b.name || '', 'es'))
  } else if (state.ordenar === 'estado') {
    minis = [...minis].sort((a, b) => dir * ((STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9)))
  } else if (state.ordenar === 'juego') {
    minis = [...minis].sort((a, b) => {
      const ga = state.factions.find(f => (a.factions || []).includes(f.name))?.game_slug || ''
      const gb = state.factions.find(f => (b.factions || []).includes(f.name))?.game_slug || ''
      return dir * ga.localeCompare(gb)
    })
  } else if (state.sortDir === 'asc') {
    minis = [...minis].reverse()
  }

  const lista = document.getElementById('lista')
  if (!minis.length) {
    lista.innerHTML = `<div class="empty">${state.minisActuales.length ? 'Sin resultados para esa búsqueda' : 'No hay minis con estos filtros'}</div>`
    return
  }
  lista.innerHTML = minis.map(renderCard).join('')
}

export function onBusqueda(val) {
  state.filtroNombre = val
  renderLista()
}

export function onFiltroType() {
  state.filtroType = document.getElementById('filtro-type').value
  renderLista()
}

export function onOrdenar(btn) {
  const key = btn.dataset.sort
  if (key === state.ordenar) {
    state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc'
  } else {
    state.ordenar = key
    state.sortDir = key === 'reciente' ? 'desc' : 'asc'
  }
  document.querySelectorAll('.sort-btn').forEach(b => {
    const active = b.dataset.sort === state.ordenar
    b.classList.toggle('active', active)
    b.textContent = active ? `${b.dataset.label} ${state.sortDir === 'asc' ? '↑' : '↓'}` : b.dataset.label
  })
  renderLista()
}

export async function cargarMinis() {
  const filtroGame = document.getElementById('filtro-game').value
  const filtroFaction = document.getElementById('filtro-faction').value
  const filtroStatus = document.getElementById('filtro-status').value

  let query = db.from('minis').select('*').order('created_at', { ascending: false })
    .neq('status', 'wishlist')

  if (filtroFaction) {
    query = query.contains('factions', [filtroFaction])
  } else if (filtroGame) {
    const faccionesDelJuego = state.factions.filter(f => f.game_slug === filtroGame).map(f => f.name)
    query = query.overlaps('factions', faccionesDelJuego)
  }

  if (filtroStatus) query = query.eq('status', filtroStatus)

  const { data, error } = await query
  if (error) { console.error(error); return }

  state.minisActuales = data || []
  renderLista()
}

export async function actualizarFiltroFacciones() {
  const gameSlug = document.getElementById('filtro-game').value

  const { data } = await db.from('minis').select('factions').neq('status', 'wishlist')

  let todas = (data || []).flatMap(m => m.factions || [])

  if (gameSlug) {
    const faccionesDelJuego = new Set(state.factions.filter(f => f.game_slug === gameSlug).map(f => f.name))
    todas = todas.filter(f => faccionesDelJuego.has(f))
  }

  const unicas = [...new Set(todas)].sort()

  document.getElementById('filtro-faction').innerHTML =
    '<option value="">Todas las facciones</option>' +
    unicas.map(f => `<option value="${f}">${f}</option>`).join('')

  cargarMinis()
}
