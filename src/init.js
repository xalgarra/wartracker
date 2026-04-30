import { db } from './db.js'
import { state } from './state.js'
import { actualizarFacciones } from './mini-modal.js'
import { actualizarFiltroFacciones } from './minis.js'
import { cargarStats } from './stats.js'
import { cargarWishlist } from './wishlist.js'
import { cargarPinturas } from './paints.js'
import { cargarHome } from './home.js'
import { cargarLists, bindListsEvents } from './lists.js'
import { cargarRecetas } from './recipes.js'
import { cargarPartner } from './partner.js'

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
  await cargarHome()
}

export function cambiarTab(tab) {
  state.tabActual = tab
  document.getElementById('vista-home').style.display      = tab === 'home'      ? 'block' : 'none'
  document.getElementById('vista-coleccion').style.display = tab === 'coleccion' ? 'block' : 'none'
  document.getElementById('vista-stats').style.display     = tab === 'stats'     ? 'block' : 'none'
  document.getElementById('vista-wishlist').style.display  = tab === 'wishlist'  ? 'block' : 'none'
  document.getElementById('vista-pinturas').style.display  = tab === 'pinturas'  ? 'block' : 'none'
  document.getElementById('vista-listas').style.display    = tab === 'listas'    ? 'block' : 'none'
  document.getElementById('vista-recetas').style.display   = tab === 'recetas'   ? 'block' : 'none'
  document.getElementById('vista-pareja').style.display    = tab === 'pareja'    ? 'block' : 'none'
  document.getElementById('tab-home').classList.toggle('active', tab === 'home')
  document.getElementById('tab-coleccion').classList.toggle('active', tab === 'coleccion')
  document.getElementById('tab-stats').classList.toggle('active', tab === 'stats')
  document.getElementById('tab-wishlist').classList.toggle('active', tab === 'wishlist')
  document.getElementById('tab-pinturas').classList.toggle('active', tab === 'pinturas')
  document.getElementById('tab-listas').classList.toggle('active', tab === 'listas')
  document.getElementById('tab-recetas').classList.toggle('active', tab === 'recetas')
  document.getElementById('tab-pareja').classList.toggle('active', tab === 'pareja')
  if (tab === 'home') cargarHome()
  if (tab === 'stats') cargarStats()
  if (tab === 'wishlist') cargarWishlist()
  if (tab === 'pinturas') cargarPinturas()
  if (tab === 'recetas') cargarRecetas()
  if (tab === 'pareja')  cargarPartner()
  if (tab === 'listas') {
    cargarLists().then(() => {
      const el = document.getElementById('listas-content')
      if (el) bindListsEvents(el)
    })
  }
}
