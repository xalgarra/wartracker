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
import { escapeHtml } from './utils.js'

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
  state.tabActual = 'hoy'
  await cargarHome()
}

// Qué tab del bottom nav resaltar para cada tab ID
const NAV_MAP = {
  hoy:       'hoy',
  coleccion: 'coleccion',
  pinturas:  'pinturas',
  mas:       'mas',
  stats:     'mas',
  wishlist:  'mas',
  listas:    'mas',
  recetas:   'mas',
  pareja:    'mas',
}

const TABS = [
  { id: 'hoy',      load: cargarHome },
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
  { id: 'mas',       load: renderMas },
]

export function cambiarTab(tab) {
  state.tabActual = tab
  for (const t of TABS) {
    const vista = document.getElementById(`vista-${t.id}`)
    const tabBtn = document.getElementById(`tab-${t.id}`)
    if (vista) vista.style.display = t.id === tab ? 'block' : 'none'
    if (tabBtn) tabBtn.classList.toggle('active', t.id === tab)
  }
  // Actualizar bottom nav
  const navTarget = NAV_MAP[tab] || tab
  document.querySelectorAll('.bottom-nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === navTarget)
  })
  const active = TABS.find(t => t.id === tab)
  if (active?.load) active.load()
}

// ── Pantalla Más ────────────────────────────────────────────────
function renderMas() {
  const container = document.getElementById('mas-content')
  if (!container) return
  if (container.dataset.bound === '1') {
    container.style.display = ''
    return
  }
  container.dataset.bound = '1'

  const items = [
    { tab: 'stats',    icon: '📊', name: 'Estadísticas', desc: 'Progreso y resumen de tu colección' },
    { tab: 'wishlist', icon: '🔖', name: 'Wishlist',     desc: 'Minis que quieres conseguir' },
    { tab: 'listas',   icon: '📋', name: 'Listas',       desc: 'Listas de ejército y planificación' },
    { tab: 'recetas',  icon: '🎨', name: 'Recetas',      desc: 'Procesos de pintura guardados' },
    { tab: 'pareja',   icon: '👥', name: 'Pareja',       desc: 'Colección de tu compañero/a' },
  ]

  container.innerHTML = `
    <div class="mas-topbar">Más</div>
    <div class="mas-list">
      ${items.map(it => `
        <button class="mas-item" data-action="goto-tab" data-tab="${it.tab}">
          <span class="mas-item-icon">${it.icon}</span>
          <div class="mas-item-body">
            <div class="mas-item-name">${escapeHtml(it.name)}</div>
            <div class="mas-item-desc">${escapeHtml(it.desc)}</div>
          </div>
          <span class="mas-item-chev">›</span>
        </button>
      `).join('')}
    </div>
  `

  container.addEventListener('click', e => {
    const btn = e.target.closest('[data-action="goto-tab"]')
    if (btn) cambiarTab(btn.dataset.tab)
  })
}
