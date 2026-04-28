import { db } from './db.js'
import { state } from './state.js'
import { STATUSES, STATUS_ORDER } from './constants.js'
import { mostrarError } from './toast.js'
import { cambiarTab } from './init.js'

const STATUS_LABEL = Object.fromEntries(STATUSES.map(s => [s.value, s.label]))
const HERO_PRIORITY = ['pintando', 'imprimada', 'montada', 'comprada']
const IN_PROGRESS_STATUSES = ['pintando', 'imprimada', 'montada']

// Caché de módulo para búsquedas en event handlers
let _minis = []
let _proyectos = []

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
    if (pts) {
      results.push({ pts, gameSlug: fc.game_slug })
      seen.add(fc.game_slug)
    }
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

  if (!minis || !minis.length) {
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

  // Proyectos activos con sus unidades y pinturas
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

  const pctGlobal = totalModels ? Math.round(paintedModels / totalModels * 100) : 0
  const pendientes = totalModels - paintedModels
  const pctPendiente = totalModels ? Math.round(pendientes / totalModels * 100) : 0
  const inQueue = minis
    .filter(m => IN_PROGRESS_STATUSES.includes(m.status))
    .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 3)
  const ultimas = minis.slice(0, 3)

  container.innerHTML = `
    ${renderProjects(_proyectos, minis)}
    ${renderSummary({ totalModels, paintedModels, pctGlobal, totalPts })}
    ${renderByGame(byGame)}
    ${renderQueue(inQueue)}
    ${renderBacklog({ pendientes, pctPendiente, byStatusEntries, byStatusModels, totalModels })}
    ${renderLast(ultimas)}
  `

  bindHomeEvents(container)
}

// ---------------------------------------------------------------------------
// Render: sección de proyectos (reemplaza el hero)
// ---------------------------------------------------------------------------

function renderProjects(proyectos, allMinis) {
  const cards = proyectos.map(p => renderProjectCard(p, allMinis)).join('')
  return `
    <div class="home-hero home-proj-section">
      <div class="home-hero-eyebrow">
        <span class="home-hero-pulse"></span>
        Proyectos activos
      </div>
      ${proyectos.length
        ? cards
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
  const projMinis = project.project_minis || []
  const projPaints = project.project_paints || []

  const progressValues = projMinis.map(pm => {
    const mini = allMinis.find(m => m.id === pm.mini_id)
    return mini?.paint_progress || 0
  })
  const avgProgress = progressValues.length
    ? Math.round(progressValues.reduce((a, b) => a + b, 0) / progressValues.length)
    : 0

  const addedMiniIds = new Set(projMinis.map(pm => pm.mini_id))
  const addedPaintIds = new Set(projPaints.map(pp => pp.paint_id))

  const minisHtml = projMinis.length
    ? projMinis.map(pm => {
        const mini = allMinis.find(m => m.id === pm.mini_id)
        if (!mini) return ''
        const p = mini.paint_progress || 0
        return `
          <div class="home-proj-mini-row">
            <span class="home-proj-mini-name">${escapeHtml(mini.name)}</span>
            <div class="home-proj-mini-bar">
              <div class="home-proj-mini-fill" style="width:${p}%"></div>
            </div>
            <input class="home-proj-mini-pct" type="number" min="0" max="100" value="${p}"
                   data-action="update-proj-mini-progress"
                   data-mini-id="${mini.id}" data-project-id="${project.id}">
            <span class="home-proj-mini-pct-label">%</span>
            <button class="home-proj-mini-remove" data-action="remove-proj-mini"
                    data-pm-id="${pm.id}" title="Quitar">✕</button>
          </div>
        `
      }).join('')
    : '<div class="home-proj-mini-empty">Añade unidades al proyecto</div>'

  const paintsHtml = projPaints.map(pp => `
    <div class="home-proj-paint-chip">
      <div class="home-proj-paint-dot ${pp.paints?.color_hex ? '' : 'home-proj-paint-dot-none'}"
           style="${pp.paints?.color_hex ? `background:${pp.paints.color_hex}` : ''}"
           title="${escapeHtml(pp.paints?.name || '')}"></div>
      <button class="home-proj-paint-remove" data-action="remove-proj-paint"
              data-pp-id="${pp.id}" title="Quitar ${escapeHtml(pp.paints?.name || '')}">✕</button>
    </div>
  `).join('')

  return `
    <div class="home-proj-card" data-project-id="${project.id}">
      <div class="home-proj-card-header">
        <span class="home-proj-name">${escapeHtml(project.name)}</span>
        <div class="home-proj-card-actions">
          <span class="home-proj-pct">${avgProgress}%</span>
          <button class="home-proj-delete-btn" data-action="delete-project"
                  data-project-id="${project.id}" title="Eliminar proyecto">✕</button>
        </div>
      </div>
      <div class="home-proj-progress-bar">
        <div class="home-proj-progress-fill" style="width:${avgProgress}%"></div>
      </div>

      <div class="home-proj-minis">${minisHtml}</div>

      <div class="home-proj-paints-row">
        ${paintsHtml}
      </div>

      <div class="home-proj-search-wrap">
        <input type="text" class="home-proj-search-input home-proj-mini-search"
               placeholder="+ añadir unidad…" autocomplete="off"
               data-project-id="${project.id}"
               data-added-minis="${[...addedMiniIds].join(',')}">
        <div class="home-proj-search-results" id="mini-results-${project.id}"></div>
      </div>
      <div class="home-proj-search-wrap">
        <input type="text" class="home-proj-search-input home-proj-paint-search"
               placeholder="+ añadir pintura…" autocomplete="off"
               data-project-id="${project.id}"
               data-added-paints="${[...addedPaintIds].join(',')}">
        <div class="home-proj-search-results" id="paint-results-${project.id}"></div>
      </div>

      ${project.notes ? `<div class="home-proj-notes">${escapeHtml(project.notes)}</div>` : ''}

      <button class="home-proj-complete-btn" data-action="complete-project"
              data-project-id="${project.id}">
        Marcar como completado ✓
      </button>
    </div>
  `
}

// ---------------------------------------------------------------------------
// Render: resto del dashboard (sin cambios de lógica)
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
        const g = byGame[slug]
        const name = state.games.find(x => x.slug === slug)?.name || slug
        const pct = g.totalPts ? Math.round(g.paintedPts / g.totalPts * 100) : 0
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
// Búsquedas en tarjetas de proyecto
// ---------------------------------------------------------------------------

function onProjMiniSearch(query, projectId) {
  const results = document.getElementById(`mini-results-${projectId}`)
  if (!results) return
  const q = query.trim().toLowerCase()
  if (!q) { results.innerHTML = ''; return }

  const input = document.querySelector(`.home-proj-mini-search[data-project-id="${projectId}"]`)
  const added = new Set((input?.dataset.addedMinis || '').split(',').map(Number).filter(Boolean))

  const matches = _minis
    .filter(m => !added.has(m.id) && m.name.toLowerCase().includes(q))
    .slice(0, 6)

  results.innerHTML = matches.length
    ? matches.map(m => `
        <div class="home-proj-search-result" data-action="add-mini-to-proj"
             data-mini-id="${m.id}" data-project-id="${projectId}">
          <span>${escapeHtml(m.name)}</span>
          <span class="home-proj-result-meta">${escapeHtml((m.factions || [])[0] || '')}</span>
        </div>
      `).join('')
    : '<div class="home-proj-result-empty">Sin resultados</div>'
}

function onProjPaintSearch(query, projectId) {
  const results = document.getElementById(`paint-results-${projectId}`)
  if (!results) return
  const q = query.trim().toLowerCase()
  if (!q) { results.innerHTML = ''; return }

  const input = document.querySelector(`.home-proj-paint-search[data-project-id="${projectId}"]`)
  const added = new Set((input?.dataset.addedPaints || '').split(',').map(Number).filter(Boolean))

  const matches = state.pinturas
    .filter(p => !added.has(p.id) && (p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)))
    .slice(0, 6)

  results.innerHTML = matches.length
    ? matches.map(p => `
        <div class="home-proj-search-result" data-action="add-paint-to-proj"
             data-paint-id="${p.id}" data-project-id="${projectId}">
          ${p.color_hex
            ? `<div class="home-proj-paint-dot" style="background:${p.color_hex}"></div>`
            : `<div class="home-proj-paint-dot home-proj-paint-dot-none"></div>`
          }
          <span>${escapeHtml(p.name)}</span>
          <span class="home-proj-result-meta">${escapeHtml(p.brand)}</span>
        </div>
      `).join('')
    : '<div class="home-proj-result-empty">Sin resultados</div>'
}

// ---------------------------------------------------------------------------
// Handlers CRUD proyectos
// ---------------------------------------------------------------------------

async function handleCreateProject() {
  const input = document.getElementById('proj-new-name')
  const name = input?.value.trim()
  if (!name) return
  const { error } = await db.from('projects').insert({ name })
  if (error) { mostrarError('Error creando proyecto'); return }
  if (input) input.value = ''
  await cargarHome()
}

async function handleCompleteProject(projectId) {
  if (!confirm('¿Completar proyecto? Todas sus unidades se marcarán como pintadas.')) return
  const project = _proyectos.find(p => p.id === projectId)
  if (!project) return
  const miniIds = (project.project_minis || []).map(pm => pm.mini_id)
  await Promise.all([
    miniIds.length ? db.from('minis').update({ status: 'pintada' }).in('id', miniIds) : Promise.resolve(),
    db.from('projects').update({ status: 'completado' }).eq('id', projectId)
  ])
  await cargarHome()
}

async function handleDeleteProject(projectId) {
  if (!confirm('¿Eliminar este proyecto? Las unidades no se modifican.')) return
  await db.from('projects').delete().eq('id', projectId)
  await cargarHome()
}

async function handleAddMiniToProj(miniId, projectId) {
  const { error } = await db.from('project_minis').insert({ project_id: projectId, mini_id: Number(miniId) })
  if (error) { mostrarError('Error añadiendo unidad'); return }
  const input = document.querySelector(`.home-proj-mini-search[data-project-id="${projectId}"]`)
  if (input) input.value = ''
  const results = document.getElementById(`mini-results-${projectId}`)
  if (results) results.innerHTML = ''
  await cargarHome()
}

async function handleAddPaintToProj(paintId, projectId) {
  const { error } = await db.from('project_paints').insert({ project_id: projectId, paint_id: Number(paintId) })
  if (error) { mostrarError('Error añadiendo pintura'); return }
  const input = document.querySelector(`.home-proj-paint-search[data-project-id="${projectId}"]`)
  if (input) input.value = ''
  const results = document.getElementById(`paint-results-${projectId}`)
  if (results) results.innerHTML = ''
  await cargarHome()
}

async function handleRemoveProjMini(pmId) {
  await db.from('project_minis').delete().eq('id', pmId)
  await cargarHome()
}

async function handleRemoveProjPaint(ppId) {
  await db.from('project_paints').delete().eq('id', ppId)
  await cargarHome()
}

function updateProjectProgressInDom(projectId) {
  const card = document.querySelector(`.home-proj-card[data-project-id="${projectId}"]`)
  if (!card) return
  const inputs = [...card.querySelectorAll('[data-action="update-proj-mini-progress"]')]
  const values = inputs.map(i => Number(i.value) || 0)
  const avg = values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0
  const pctEl = card.querySelector('.home-proj-pct')
  if (pctEl) pctEl.textContent = avg + '%'
  const fillEl = card.querySelector('.home-proj-progress-fill')
  if (fillEl) fillEl.style.width = avg + '%'
}

// ---------------------------------------------------------------------------
// Event binding
// ---------------------------------------------------------------------------

function bindHomeEvents(container) {
  if (container.dataset.bound === '1') return
  container.dataset.bound = '1'

  container.addEventListener('click', async e => {
    // Cerrar resultados al clicar fuera
    if (!e.target.closest('.home-proj-search-wrap')) {
      container.querySelectorAll('.home-proj-search-results').forEach(r => { r.innerHTML = '' })
    }

    const actionEl = e.target.closest('[data-action]')
    if (!actionEl) return
    const action = actionEl.dataset.action
    const projectId = actionEl.dataset.projectId

    if (action === 'create-project') {
      await handleCreateProject()
    } else if (action === 'complete-project') {
      await handleCompleteProject(projectId)
    } else if (action === 'delete-project') {
      await handleDeleteProject(projectId)
    } else if (action === 'add-mini-to-proj') {
      await handleAddMiniToProj(actionEl.dataset.miniId, projectId)
    } else if (action === 'add-paint-to-proj') {
      await handleAddPaintToProj(actionEl.dataset.paintId, projectId)
    } else if (action === 'remove-proj-mini') {
      await handleRemoveProjMini(actionEl.dataset.pmId)
    } else if (action === 'remove-proj-paint') {
      await handleRemoveProjPaint(actionEl.dataset.ppId)
    } else if (action === 'open-mini' || action === 'continue') {
      const id = Number(actionEl.dataset.miniId)
      if (id) {
        const { abrirEdicion } = await import('./mini-modal.js')
        abrirEdicion(id)
      }
    } else if (action === 'goto-coleccion') {
      cambiarTab('coleccion')
    }
  })

  container.addEventListener('input', e => {
    if (e.target.classList.contains('home-proj-mini-search')) {
      onProjMiniSearch(e.target.value, e.target.dataset.projectId)
    } else if (e.target.classList.contains('home-proj-paint-search')) {
      onProjPaintSearch(e.target.value, e.target.dataset.projectId)
    }
  })

  container.addEventListener('change', e => {
    if (e.target.dataset.action === 'update-proj-mini-progress') {
      const val = Math.min(100, Math.max(0, Number(e.target.value) || 0))
      e.target.value = val
      const row = e.target.closest('.home-proj-mini-row')
      const fill = row?.querySelector('.home-proj-mini-fill')
      if (fill) fill.style.width = val + '%'
      updateProjectProgressInDom(e.target.dataset.projectId)
      db.from('minis').update({ paint_progress: val }).eq('id', Number(e.target.dataset.miniId))
    }
  })
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]))
}
