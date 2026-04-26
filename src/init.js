import { db } from './db.js'
import { state } from './state.js'
import { actualizarFacciones } from './mini-modal.js'
import { actualizarFiltroFacciones } from './minis.js'
import { cargarStats } from './stats.js'
import { cargarWishlist } from './wishlist.js'
import { cargarPinturas } from './paints.js'

export async function inicializar() {
  const [{ data: gamesData }, { data: factionsData }, { data: unitsData }] = await Promise.all([
    db.from('games').select('*').order('name'),
    db.from('factions').select('*').order('name'),
    db.from('units').select('name, faction, game_slug, points, type')
  ])
  state.games = gamesData || []
  state.factions = factionsData || []
  state.units = unitsData || []
  state.unitMap = {}
  state.typeMap = {}
  for (const u of state.units) {
    const key = `${u.name}|${u.faction}|${u.game_slug}`
    state.unitMap[key] = u.points
    if (u.type) state.typeMap[key] = u.type
  }

  document.getElementById('game').innerHTML = state.games.map(g =>
    `<option value="${g.slug}">${g.name}</option>`
  ).join('')

  document.getElementById('filtro-game').innerHTML =
    '<option value="">Todos los juegos</option>' +
    state.games.map(g => `<option value="${g.slug}">${g.name}</option>`).join('')

  actualizarFacciones()
  await actualizarFiltroFacciones()
}

export function cambiarTab(tab) {
  state.tabActual = tab
  document.getElementById('vista-coleccion').style.display = tab === 'coleccion' ? 'block' : 'none'
  document.getElementById('vista-stats').style.display    = tab === 'stats'      ? 'block' : 'none'
  document.getElementById('vista-wishlist').style.display = tab === 'wishlist'   ? 'block' : 'none'
  document.getElementById('vista-pinturas').style.display = tab === 'pinturas'   ? 'block' : 'none'
  document.getElementById('tab-coleccion').classList.toggle('active', tab === 'coleccion')
  document.getElementById('tab-stats').classList.toggle('active', tab === 'stats')
  document.getElementById('tab-wishlist').classList.toggle('active', tab === 'wishlist')
  document.getElementById('tab-pinturas').classList.toggle('active', tab === 'pinturas')
  if (tab === 'stats') cargarStats()
  if (tab === 'wishlist') cargarWishlist()
  if (tab === 'pinturas') cargarPinturas()
}
