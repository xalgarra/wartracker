import { db } from './db.js'
import { state } from './state.js'
import { STATUSES, STATUS_ORDER } from './constants.js'
import { mostrarError } from './toast.js'
import { escapeHtml } from './utils.js'
import { cambiarTab } from './init.js'

const STATUS_LABEL = Object.fromEntries(STATUSES.map(s => [s.value, s.label]))
const HERO_PRIORITY = ['pintando', 'imprimada', 'montada', 'comprada']
const IN_PROGRESS_STATUSES = ['pintando', 'imprimada', 'montada']

// Caché de módulo — accesible desde project-modal.js vía getters
let _minis = []
let _proyectos = []

export const getMinis     = () => _minis
export const getProyectos = () => _proyectos
export function syncProyecto(proj) {
  const idx = _proyectos.findIndex(p => p.id === proj.id)
  if (idx >= 0) _proyectos[idx] = proj
  else _proyectos.unshift(proj)
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
    .select('id, name, factions, status, qty, models, photo_url, created_at, paint_progress')
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

  _minis = minis

  if (!state.pinturas.length) {
    const { data } = await db.from('paints').select('*').order('brand').order('name')
    if (data) state.pinturas = data
  }

  const { data: proyectos } = await db
    .from('projects')
    .select('id, name, notes, status, project_minis(id, mini_id, notes), project_paints(id, paint_id, paints(name, brand, color_hex))')
    .eq('status', 'activo')
    .order('created_at', { ascending: false })

  _proyectos = proyectos || []

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
  const inQueue = minis
    .filter(m => IN_PROGRESS_STATUSES.includes(m.status))
    .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 3)

  container.innerHTML = `
    ${renderProjects(_proyectos, minis)}
    ${renderSummary({ totalModels, paintedModels, pctGlobal, totalPts })}
    ${renderByGame(byGame)}
    ${renderQueue(inQueue)}
    ${renderBacklog({ pendientes, pctPendiente, byStatusEntries, byStatusModels, totalModels })}
    ${renderLast(minis.slice(0, 3))}
  `

  bindHomeEvents(container)
}

// ---------------------------------------------------------------------------
// Render: proyectos (tarjetas de resumen — solo lectura)
// ---------------------------------------------------------------------------

function renderProjects(proyectos, allMinis) {
  return `
    <div class="home-hero home-proj-section">
      <div class="home-hero-eyebrow">
        <span class="home-hero-pulse"></span>
        Proyectos activos
      </div>
      ${proyectos.length
        ? proyectos.map(p => renderProjectCard(p, allMinis)).join('')
        : '<div class="home-proj-empty-msg">Sin proyectos activos — crea uno abajo</div>'
      }
      <div class="home-proj-new-row">
        <input type="text" id="proj-new-name" class="home-proj-new-input"
               placeholder="Nuevo proyecto…" maxlength="80" autocomplete="off">
        <button data-action="create-project" class="home-proj-create-btn">Crear</button>
      </div>
    </div>
  `
}

function renderProjectCard(project, allMinis) {
  const projMinis  = project.project_minis || []
  const projPaints = project.project_paints || []

  const progressValues = projMinis.map(pm => {
    const mini = allMinis.find(m => m.id === Number(pm.mini_id))
    return mini?.paint_progress || 0
  })
  const avgProgress = progressValues.length
    ? Math.round(progressValues.reduce((a, b) => a + b, 0) / progressValues.length)
    : 0

  const unitsHtml = projMinis.map(pm => {
    const mini = allMinis.find(m => m.id === Number(pm.mini_id))
    if (!mini) return ''
    return `<span class="proj-unit-chip">
      <span class="proj-unit-chip-name">${escapeHtml(mini.name)}</span>
      <span class="proj-unit-chip-pct">${mini.paint_progress || 0}%</span>
    </span>`
  }).join('')

  const paintsHtml = projPaints.map(pp => `
    <div class="paint-swatch ${pp.paints?.color_hex ? '' : 'paint-swatch-none'}"
         style="${pp.paints?.color_hex ? `background:${pp.paints.color_hex}` : ''}"
         title="${escapeHtml(pp.paints?.name || '')}"></div>
  `).join('')

  return `
    <div class="home-proj-card" data-project-id="${project.id}">
      <div class="home-proj-card-header">
        <span class="home-proj-name">${escapeHtml(project.name)}</span>
        <div class="home-proj-card-actions">
          <span class="home-proj-pct">${avgProgress}%</span>
          <button class="home-proj-edit-btn" data-action="edit-project" data-project-id="${project.id}">Editar</button>
        </div>
      </div>
      <div class="home-proj-progress-bar">
        <div class="home-proj-progress-fill" style="width:${avgProgress}%"></div>
      </div>
      ${unitsHtml
        ? `<div class="home-proj-units">${unitsHtml}</div>`
        : '<div class="home-proj-units-empty">Sin minis — pulsa Editar</div>'}
      ${paintsHtml ? `<div class="home-proj-paints-row">${paintsHtml}</div>` : ''}
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

function renderQueue(items) {
  return `
    <div class="home-block">
      <div class="home-block-h">
        <span>// en proceso · ${items.length}</span>
        <span class="home-block-link" data-action="goto-coleccion">ver todas →</span>
      </div>
      ${items.length ? `
        <div class="home-queue">
          ${items.map(m => `
            <div class="home-queue-row" data-action="open-mini" data-mini-id="${m.id}">
              ${m.photo_url
                ? `<img class="home-queue-thumb" src="${m.photo_url}" alt="">`
                : `<div class="home-queue-thumb home-queue-thumb--placeholder"></div>`
              }
              <div class="home-queue-mid">
                <div class="home-queue-name">${escapeHtml(m.name)}</div>
                <div class="home-queue-meta">${escapeHtml((m.factions || [])[0] || '-')} · ${modelsFor(m)} mod</div>
              </div>
              <span class="badge badge-status ${m.status}">${STATUS_LABEL[m.status]}</span>
            </div>
          `).join('')}
        </div>
      ` : `<div class="home-empty-inline">// nada en proceso</div>`}
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

// ---------------------------------------------------------------------------
// Event binding (home-content, delegación)
// ---------------------------------------------------------------------------

function bindHomeEvents(container) {
  if (container.dataset.bound === '1') return
  container.dataset.bound = '1'

  container.addEventListener('click', async e => {
    const actionEl = e.target.closest('[data-action]')
    if (!actionEl) return
    const { action, projectId, miniId } = actionEl.dataset

    if (action === 'create-project') {
      await handleCreateProject()
    } else if (action === 'edit-project') {
      const { abrirModalProyecto } = await import('./project-modal.js')
      await abrirModalProyecto(projectId)
    } else if (action === 'open-mini') {
      if (miniId) {
        const { abrirEdicion } = await import('./mini-modal.js')
        abrirEdicion(Number(miniId))
      }
    } else if (action === 'goto-coleccion') {
      cambiarTab('coleccion')
    }
  })
}

async function handleCreateProject() {
  const input = document.getElementById('proj-new-name')
  const name = input?.value.trim()
  if (!name) return
  const { data, error } = await db.from('projects').insert({ name }).select().single()
  if (error) { mostrarError('Error creando proyecto: ' + error.message); return }
  if (input) input.value = ''
  _proyectos.unshift({ ...data, project_minis: [], project_paints: [] })
  const { abrirModalProyecto } = await import('./project-modal.js')
  await abrirModalProyecto(data.id)
}
