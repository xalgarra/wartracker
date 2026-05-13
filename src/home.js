import { db } from './db.js'
import { state } from './state.js'
import { STATUSES, STATUS_ORDER } from './constants.js'
import { mostrarError, mostrarExito } from './toast.js'
import { escapeHtml } from './utils.js'
import { cambiarTab } from './init.js'
import { cargarSessions, renderSessionsBlock } from './sessions.js'

const STATUS_LABEL = Object.fromEntries(STATUSES.map(s => [s.value, s.label]))
const HERO_PRIORITY = ['pintando', 'imprimada', 'montada', 'comprada']
const IN_PROGRESS_STATUSES = ['pintando', 'imprimada', 'montada']

const PROGRESS_COLOR = {
  comprada:  '#c8c6c0',
  montada:   'oklch(0.7 0.13 60)',
  imprimada: 'oklch(0.65 0.12 240)',
  pintando:  'oklch(0.6 0.15 305)',
  pintada:   'oklch(0.55 0.15 145)',
}

// Las caches viven en state.js (state.minisFull, state.proyectosActivos).
// Mantenemos estos getters para los consumidores externos (project-modal, etc).
export const getMinis     = () => state.minisFull || []
export const getProyectos = () => state.proyectosActivos || []
export function syncProyecto(proj) {
  if (!state.proyectosActivos) state.proyectosActivos = []
  const idx = state.proyectosActivos.findIndex(p => p.id === proj.id)
  if (idx >= 0) state.proyectosActivos[idx] = proj
  else state.proyectosActivos.unshift(proj)
}

// ---------------------------------------------------------------------------
// Helpers de colección
// ---------------------------------------------------------------------------

export function pickHero(minis) {
  for (const status of HERO_PRIORITY) {
    const m = minis.find(x => x.status === status)
    if (m) return m
  }
  return null
}

function ptsFor(mini) {
  for (const faction of (mini.factions || [])) {
    const fc = state.factions.find(f => f.name === faction)
    if (!fc) continue
    const pts = state.unitMap[`${mini.name}|${faction}|${fc.game_slug}`]
    if (pts) return { pts, gameSlug: fc.game_slug }
  }
  return { pts: 0, gameSlug: null }
}

function ptsPerGame(mini) {
  const seen = new Set()
  const results = []
  for (const faction of (mini.factions || [])) {
    const fc = state.factions.find(f => f.name === faction)
    if (!fc || seen.has(fc.game_slug)) continue
    const pts = state.unitMap[`${mini.name}|${faction}|${fc.game_slug}`]
    if (pts) { results.push({ pts, gameSlug: fc.game_slug }); seen.add(fc.game_slug) }
  }
  return results
}

export function modelsFor(mini) {
  return (mini.models != null ? mini.models : 1) * mini.qty
}

// ---------------------------------------------------------------------------
// Carga principal
// ---------------------------------------------------------------------------

export async function cargarHome() {
  const container = document.getElementById('home-content')
  if (!container) return
  container.innerHTML = '<div class="home-empty">Cargando…</div>'

  const { data: minis, error } = await db
    .from('minis')
    .select('id, name, factions, status, qty, models, photo_url, created_at, paint_progress, hobby_blocker, assembly_risk')
    .neq('status', 'wishlist')
    .order('created_at', { ascending: false })

  if (error) { container.innerHTML = '<div class="home-empty">Error al cargar datos</div>'; return }

  if (!minis?.length) {
    container.innerHTML = `
      <div class="home-empty">
        <p>Aún no hay minis en tu colección.</p>
        <button class="btn-primary" id="home-empty-add">Añadir tu primera mini</button>
      </div>
    `
    document.getElementById('home-empty-add')?.addEventListener('click', () => {
      document.getElementById('btn-fab')?.click()
    })
    return
  }

  state.minisFull = minis

  if (!state.pinturas.length) {
    const { data } = await db.from('paints').select('*').order('brand').order('name')
    if (data) state.pinturas = data
  }

  await cargarSessions()

  state.proyectosActivos = []

  // Agregaciones para el dashboard
  let totalModels = 0, paintedModels = 0, totalPts = 0
  const byStatusEntries = {}, byStatusModels = {}, byGame = {}

  for (const m of minis) {
    const mod = modelsFor(m)
    const { pts } = ptsFor(m)
    totalModels += mod
    totalPts += pts * m.qty
    byStatusEntries[m.status] = (byStatusEntries[m.status] || 0) + 1
    byStatusModels[m.status] = (byStatusModels[m.status] || 0) + mod
    if (m.status === 'pintada') paintedModels += mod
    for (const { pts: gp, gameSlug: slug } of ptsPerGame(m)) {
      if (!byGame[slug]) byGame[slug] = { totalPts: 0, paintedPts: 0 }
      byGame[slug].totalPts += gp * m.qty
      if (m.status === 'pintada') byGame[slug].paintedPts += gp * m.qty
    }
  }

  const pctGlobal    = totalModels ? Math.round(paintedModels / totalModels * 100) : 0
  const pendientes   = totalModels - paintedModels
  const pctPendiente = totalModels ? Math.round(pendientes / totalModels * 100) : 0

  // Minis en proceso para el hero y carrusel
  const inProgress = minis
    .filter(m => IN_PROGRESS_STATUSES.includes(m.status))
    .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || new Date(b.created_at) - new Date(a.created_at))
  const hero  = pickHero(minis)
  const queue = inProgress.filter(m => m.id !== hero?.id).slice(0, 6)

  const pinturasSinStock = (state.pinturas || []).filter(p => !p.in_stock).length
  const minisSinImprimar = minis.filter(m => m.status === 'montada').length

  container.innerHTML = `
    ${renderHero(hero, minis)}
    ${renderCarousel(queue)}
    ${renderPlanSemana(minisSinImprimar, pinturasSinStock)}
    ${renderSummary({ totalModels, paintedModels, pctGlobal, totalPts })}
    ${renderByGame(byGame)}
    ${renderBacklog({ pendientes, pctPendiente, byStatusEntries, byStatusModels, totalModels })}
    ${renderSchemes(minis)}
    ${renderSessionsBlock()}
  `

  bindHomeEvents(container)
}

// ---------------------------------------------------------------------------
// Render: hero card (mini más avanzada en proceso)
// ---------------------------------------------------------------------------

function renderHero(hero, allMinis) {
  if (!hero) {
    const sinColeccion = !allMinis.length
    return `
      <div class="home-pick home-pick--empty">
        <div class="home-pick-eyebrow">
          <span class="home-pick-dot"></span>
          colección
        </div>
        <div class="home-pick-name">${sinColeccion ? 'Sin minis aún' : 'Nada en proceso'}</div>
        <div class="home-pick-meta">${sinColeccion ? 'Añade tu primera mini con el botón +' : 'Selecciona una mini de tu colección para empezar'}</div>
        <button class="home-pick-cta" data-action="goto-coleccion">
          ${sinColeccion ? 'Añadir mini →' : 'Ver colección →'}
        </button>
      </div>
    `
  }

  const faction = (hero.factions || [])[0] || ''
  const { pts } = ptsFor(hero)
  const statusLbl = STATUS_LABEL[hero.status] || hero.status

  return `
    <div class="home-pick" data-action="open-mini" data-mini-id="${hero.id}">
      ${hero.photo_url ? `<img class="home-pick-photo" src="${escapeHtml(hero.photo_url)}" alt="">` : ''}
      <div class="home-pick-eyebrow">
        <span class="home-pick-dot"></span>
        sigue donde lo dejaste
      </div>
      <div class="home-pick-name">${escapeHtml(hero.name)}</div>
      <div class="home-pick-meta">${escapeHtml(faction)}${pts ? ' · ' + pts + ' pts' : ''} · ${escapeHtml(statusLbl)}</div>
      <button class="home-pick-cta" data-action="open-mini" data-mini-id="${hero.id}">
        Continuar pintando →
      </button>
    </div>
  `
}

// ---------------------------------------------------------------------------
// Render: carrusel "también en curso"
// ---------------------------------------------------------------------------

function renderCarousel(minis) {
  if (!minis.length) return ''
  return `
    <div class="home-section-h">
      <span class="home-section-title">También en curso · ${minis.length}</span>
      <span class="home-section-link" data-action="goto-coleccion">Ver todas</span>
    </div>
    <div class="home-carousel">
      ${minis.map(m => {
        const color = PROGRESS_COLOR[m.status] || '#c8c6c0'
        const pct   = m.paint_progress || 0
        return `
          <div class="home-mini-card" data-action="open-mini" data-mini-id="${m.id}">
            <div class="home-mini-thumb ${m.photo_url ? '' : 'home-mini-thumb--empty'}">
              ${m.photo_url ? `<img src="${escapeHtml(m.photo_url)}" alt="">` : ''}
              <span class="home-mini-status-pill" style="color:${color}">${escapeHtml(STATUS_LABEL[m.status] || '')}</span>
            </div>
            <div class="home-mini-name">${escapeHtml(m.name)}</div>
            <div class="home-mini-meta">${escapeHtml((m.factions || [])[0] || '')}</div>
            <div class="home-mini-bar"><div class="home-mini-bar-fill" style="width:${pct}%;background:${color}"></div></div>
          </div>
        `
      }).join('')}
    </div>
  `
}

// ---------------------------------------------------------------------------
// Render: plan de la semana
// ---------------------------------------------------------------------------

function renderPlanSemana(minisSinImprimar, pinturasSinStock) {
  return `
    <div class="home-section-h">
      <span class="home-section-title">Plan de la semana</span>
    </div>
    <div class="home-plan">
      <button class="home-plan-row" data-action="log-session">
        <div class="home-plan-icon ok">▶</div>
        <div class="home-plan-body">
          <div class="home-plan-title">Iniciar sesión de hobby</div>
          <div class="home-plan-desc">Cronómetro y registro de la sesión</div>
        </div>
        <span class="home-plan-chev">›</span>
      </button>
      <button class="home-plan-row" data-action="goto-coleccion">
        <div class="home-plan-icon ${minisSinImprimar > 0 ? 'warn' : 'ok'}">!</div>
        <div class="home-plan-body">
          <div class="home-plan-title">${minisSinImprimar} mini${minisSinImprimar !== 1 ? 's' : ''} sin imprimar</div>
          <div class="home-plan-desc">Estado montada, listas para imprimar</div>
        </div>
        <span class="home-plan-chev">›</span>
      </button>
      <button class="home-plan-row" data-action="goto-pinturas">
        <div class="home-plan-icon ${pinturasSinStock > 0 ? 'info' : 'ok'}">★</div>
        <div class="home-plan-body">
          <div class="home-plan-title">Te quedan ${pinturasSinStock} potes sin stock</div>
          <div class="home-plan-desc">Revisa el rack antes de pintar</div>
        </div>
        <span class="home-plan-chev">›</span>
      </button>
    </div>
  `
}

// ---------------------------------------------------------------------------
// Render: dashboard
// ---------------------------------------------------------------------------

function renderSummary({ totalModels, paintedModels, pctGlobal, totalPts }) {
  return `
    <div class="home-summary">
      <div class="home-summary-cell">
        <div class="home-summary-v">${totalModels}</div>
        <div class="home-summary-l">modelos</div>
      </div>
      <div class="home-summary-cell">
        <div class="home-summary-v">${paintedModels}</div>
        <div class="home-summary-l">pintados</div>
      </div>
      <div class="home-summary-cell">
        <div class="home-summary-v home-summary-v--green">${pctGlobal}%</div>
        <div class="home-summary-l">completado</div>
      </div>
      <div class="home-summary-cell">
        <div class="home-summary-v">${totalPts >= 1000 ? (totalPts / 1000).toFixed(1) + 'k' : totalPts}</div>
        <div class="home-summary-l">pts</div>
      </div>
    </div>
  `
}

function renderByGame(byGame) {
  const slugs = Object.keys(byGame)
  if (!slugs.length) return ''
  const gameOrder = state.games.map(g => g.slug)
  slugs.sort((a, b) => gameOrder.indexOf(a) - gameOrder.indexOf(b))
  return `
    <div class="home-block">
      <div class="home-block-h"><span>// por juego</span></div>
      ${slugs.map(slug => {
        const g    = byGame[slug]
        const name = state.games.find(x => x.slug === slug)?.name || slug
        const pct  = g.totalPts ? Math.round(g.paintedPts / g.totalPts * 100) : 0
        return `
          <div class="home-game-row">
            <div class="home-game-line">
              <span class="home-game-name home-game-${slug}">${escapeHtml(name)}</span>
              <span class="home-game-pct">${pct}%</span>
            </div>
            <div class="home-game-bar">
              <div class="home-game-bar-fill home-game-${slug}" style="width:${pct}%"></div>
            </div>
            <div class="home-game-pts">${g.paintedPts.toLocaleString()} / ${g.totalPts.toLocaleString()} pts</div>
          </div>
        `
      }).join('')}
    </div>
  `
}


function renderBacklog({ pendientes, pctPendiente, byStatusEntries, byStatusModels, totalModels }) {
  const segs = STATUSES
    .filter(s => byStatusModels[s.value])
    .map(s => `<div class="progress-seg ${s.value}" style="width:${(byStatusModels[s.value] / totalModels * 100).toFixed(1)}%"></div>`)
    .join('')
  const legend = STATUSES
    .filter(s => byStatusEntries[s.value])
    .map(s => `<span class="home-stack-leg-i"><span class="legend-dot ${s.value}"></span>${s.label.toLowerCase()} ${byStatusEntries[s.value]}</span>`)
    .join('')
  return `
    <div class="home-block">
      <div class="home-block-h"><span>// pendiente</span></div>
      <div class="home-backlog-top">
        <span class="home-backlog-num">${pendientes}</span>
        <span class="home-backlog-l">modelos · ${pctPendiente}%</span>
      </div>
      <div class="progress-bar home-stack">${segs}</div>
      <div class="home-stack-leg">${legend}</div>
    </div>
  `
}

function renderLast(items) {
  if (!items.length) return ''
  return `
    <div class="home-block">
      <div class="home-block-h"><span>// últimas añadidas</span></div>
      <div class="home-last">
        ${items.map(m => `
          <div class="home-last-row" data-action="open-mini" data-mini-id="${m.id}">
            <span class="home-last-name">${escapeHtml(m.name)}</span>
            <span class="home-last-meta">${escapeHtml((m.factions || [])[0] || '-')}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `
}

function renderSchemes(minis) {
  const schemes = minis
    .filter(m => m.status === 'pintada' && m.photo_url)
    .slice(0, 12)
  if (!schemes.length) return ''
  return `
    <div class="home-block home-block--schemes">
      <div class="home-block-h">
        <span>// schemes que funcionaron</span>
        <span class="home-block-hint">${schemes.length}${schemes.length === 12 ? '+' : ''} acabad${schemes.length === 1 ? 'o' : 'os'}</span>
      </div>
      <div class="schemes-grid">
        ${schemes.map(m => `
          <div class="scheme-tile" data-action="open-mini" data-mini-id="${m.id}">
            <img class="scheme-tile-img" src="${m.photo_url}" alt="" loading="lazy">
            <div class="scheme-tile-overlay">
              <span class="scheme-tile-name">${escapeHtml(m.name)}</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `
}

function renderHistorial(proyectos) {
  if (!proyectos.length) return ''
  return `
    <div class="home-block">
      <div class="home-block-h"><span>// proyectos completados</span></div>
      <div class="home-historial">
        ${proyectos.map(p => {
          const miniCount = (p.project_minis || []).length
          const date = p.completed_at
            ? new Date(p.completed_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
            : ''
          return `
            <div class="home-historial-row">
              ${p.photo_url
                ? `<img class="home-historial-thumb" src="${p.photo_url}" alt="">`
                : `<div class="home-historial-thumb home-historial-thumb--empty"></div>`}
              <div class="home-historial-info">
                <span class="home-historial-name">${escapeHtml(p.name)}</span>
                <span class="home-historial-meta">${miniCount} mini${miniCount !== 1 ? 's' : ''}${date ? ' · ' + date : ''}</span>
              </div>
              <span class="home-historial-badge">✓</span>
            </div>
          `
        }).join('')}
      </div>
    </div>
  `
}

// ---------------------------------------------------------------------------
// Event binding (home-content, delegación)
// ---------------------------------------------------------------------------

function bindHomeEvents(container) {
  if (container.dataset.bound === '1') return
  container.dataset.bound = '1'

  container.addEventListener('click', async e => {
    const actionEl = e.target.closest('[data-action]')
    if (!actionEl) return
    const { action, miniId } = actionEl.dataset

    if (action === 'open-mini') {
      if (miniId) {
        const { abrirDetalleMini } = await import('./mini-detail.js')
        abrirDetalleMini(Number(miniId))
      }
    } else if (action === 'goto-coleccion') {
      cambiarTab('coleccion')
    } else if (action === 'goto-pinturas') {
      cambiarTab('pinturas')
    } else if (action === 'log-session') {
      const { abrirModalSession } = await import('./session-modal.js')
      abrirModalSession()
    }
  })
}

