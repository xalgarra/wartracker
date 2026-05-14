import { db } from './db.js'
import { state, invalidateMinis, ensureMinisFull } from './state.js'
import { STATUSES, STATUS_ORDER, UNIT_TYPES } from './constants.js'
import { mostrarError } from './toast.js'
import { getPlaceholderHue, getInitials } from './placeholder.js'

let _viewMode = 'list'

export function toggleViewMode(btn) {
  _viewMode = _viewMode === 'list' ? 'gallery' : 'list'
  btn.classList.toggle('active', _viewMode === 'gallery')
  btn.title = _viewMode === 'list' ? 'Vista galería' : 'Vista lista'
  renderLista()
}

const STATUS_LABEL = Object.fromEntries(STATUSES.map(s => [s.value, s.label]))

export function calcularPtsPorJuego(mini, juegosUnicos, factions, unitMap) {
  return juegosUnicos.map(slug => {
    const fac = (mini.factions || []).find(f => factions.find(x => x.name === f && x.game_slug === slug))
    return fac ? (unitMap[`${mini.name}|${fac}|${slug}`] ?? null) : null
  })
}

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
  const thumbHTML = m.photo_url
    ? `<img class="card-thumb" src="${m.photo_url}" alt="" loading="lazy">`
    : `<div class="card-thumb card-thumb--ph" style="--ph-hue:${getPlaceholderHue((m.factions||[])[0], m.name)}"><span class="card-thumb-init">${getInitials(m.name)}</span></div>`
  const progress  = m.paint_progress || 0
  const showBar   = progress > 0 || m.status === 'pintada'
  const barWidth  = m.status === 'pintada' ? 100 : progress
  const progressHtml = showBar
    ? `<div class="card-progress"><div class="card-progress-fill card-progress-fill--${m.status}" style="width:${barWidth}%"></div></div>`
    : ''
  return `
    <div class="card" data-mini-id="${m.id}">
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
            <span class="badge badge-status ${m.status}" data-action="status-quick" data-mini-id="${m.id}" data-status="${m.status}">${STATUS_LABEL[m.status] || m.status}</span>
          </div>
          <div class="card-footer-right">
            ${gamePtsList.map(p => `<span class="card-pts-line">${p}</span>`).join('')}
            <span class="card-qty">${m.qty} ud.${modelsStr}</span>
          </div>
        </div>
        ${progressHtml}
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

  if (_viewMode === 'gallery') {
    lista.innerHTML = `<div class="gallery-grid">${minis.map(m => {
      const progress = m.paint_progress || 0
      const barHtml  = progress > 0 && m.status !== 'pintada'
        ? `<div class="gallery-card-progress"><div class="gallery-card-progress-fill" style="width:${progress}%"></div></div>`
        : ''
      return `
        <div class="gallery-card" data-mini-id="${m.id}">
          ${m.photo_url
            ? `<img class="gallery-card-img" src="${m.photo_url}" alt="" loading="lazy">`
            : `<div class="gallery-card-img gallery-card-img--ph" style="--ph-hue:${getPlaceholderHue((m.factions||[])[0], m.name)}"><span class="gallery-card-init">${getInitials(m.name)}</span></div>`}
          <div class="gallery-card-info">
            <span class="gallery-card-name">${m.name}</span>
            <span class="badge badge-status ${m.status}">${STATUS_LABEL[m.status] || m.status}</span>
          </div>
          ${barHtml}
        </div>`
    }).join('')}</div>`
  } else {
    lista.innerHTML = minis.map(renderCard).join('')
  }
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
  document.querySelectorAll('.sort-btn:not(.sort-paint-btn)').forEach(b => {
    const active = b.dataset.sort === state.ordenar
    b.classList.toggle('active', active)
    b.textContent = active ? `${b.dataset.label} ${state.sortDir === 'asc' ? '↑' : '↓'}` : b.dataset.label
  })
  renderLista()
}

export async function cargarMinis() {
  const minis = await ensureMinisFull()
  if (!Array.isArray(minis)) { mostrarError('Error al cargar la colección'); return }

  const filtroGame    = document.getElementById('filtro-game').value
  const filtroFaction = document.getElementById('filtro-faction').value
  const filtroStatus  = document.getElementById('filtro-status').value

  let filtered = minis
  if (filtroFaction) {
    filtered = filtered.filter(m => (m.factions || []).includes(filtroFaction))
  } else if (filtroGame) {
    const faccionesDelJuego = new Set(
      state.factions.filter(f => f.game_slug === filtroGame).map(f => f.name)
    )
    filtered = filtered.filter(m => (m.factions || []).some(f => faccionesDelJuego.has(f)))
  }
  if (filtroStatus) filtered = filtered.filter(m => m.status === filtroStatus)

  state.minisActuales = filtered

  const tipos = [...new Set(state.minisActuales.map(m => getTypeForMini(m)).filter(Boolean))].sort()
  const sel = document.getElementById('filtro-type')
  const prevVal = sel.value
  sel.innerHTML = '<option value="">Todos los tipos</option>' +
    UNIT_TYPES.filter(t => tipos.includes(t.value)).map(t => `<option value="${t.value}">${t.label}</option>`).join('')
  if (tipos.includes(prevVal)) sel.value = prevVal
  else { sel.value = ''; state.filtroType = '' }

  renderLista()
}

export async function actualizarFiltroFacciones() {
  const gameSlug = document.getElementById('filtro-game').value
  const minis = await ensureMinisFull()

  let todas = minis.flatMap(m => m.factions || [])
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

export async function cambiarStatusRapido(miniId, nuevoStatus) {
  const { error } = await db.from('minis').update({ status: nuevoStatus }).eq('id', miniId)
  if (error) { mostrarError('Error al actualizar estado'); return }
  invalidateMinis()
  const mini = state.minisActuales.find(m => m.id === miniId)
  if (mini) { mini.status = nuevoStatus; renderLista() }
}
