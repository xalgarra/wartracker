import { db } from './db.js'
import { state } from './state.js'
import { actualizarFacciones } from './mini-modal.js'
import { actualizarFiltroFacciones, cargarMinis } from './minis.js'
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

const TABS = [
  { id: 'home',      load: cargarHome },
  { id: 'coleccion', load: cargarMinis },
  { id: 'stats',     load: cargarStats },
  { id: 'wishlist',  load: cargarWishlist },
  { id: 'pinturas',  load: cargarPinturas },
  { id: 'listas',    load: () => cargarLists().then(() => {
      const el = document.getElementById('listas-content')
      if (el) bindListsEvents(el)
    })
  },
  { id: 'recetas',   load: cargarRecetas },
  { id: 'pareja',    load: cargarPartner },
]

export function cambiarTab(tab) {
  state.tabActual = tab
  for (const t of TABS) {
    document.getElementById(`vista-${t.id}`).style.display = t.id === tab ? 'block' : 'none'
    document.getElementById(`tab-${t.id}`).classList.toggle('active', t.id === tab)
  }
  const active = TABS.find(t => t.id === tab)
  if (active?.load) active.load()
}
