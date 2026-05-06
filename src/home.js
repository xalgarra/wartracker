import { db } from './db.js'
import { state } from './state.js'
import { STATUSES, STATUS_ORDER } from './constants.js'
import { mostrarError, mostrarExito } from './toast.js'
import { escapeHtml } from './utils.js'
import { cambiarTab } from './init.js'
import { getRecommendations, getEmptyState } from './recommendations.js'
import { cargarSessions, renderSessionsBlock } from './sessions.js'

const STATUS_LABEL = Object.fromEntries(STATUSES.map(s => [s.value, s.label]))
const HERO_PRIORITY = ['pintando', 'imprimada', 'montada', 'comprada']
const IN_PROGRESS_STATUSES = ['pintando', 'imprimada', 'montada']

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

  const [{ data: proyectos }, { data: historial }] = await Promise.all([
    db.from('projects')
      .select('id, name, photo_url, notes, recipe, recipe_id, status, project_minis(id, mini_id, notes), project_paints(id, paint_id, paints(name, brand, color_hex)), recipes(id, name)')
      .eq('status', 'activo')
      .order('created_at', { ascending: false }),
    db.from('projects')
      .select('id, name, photo_url, completed_at, project_minis(id)')
      .eq('status', 'completado')
      .order('completed_at', { ascending: false })
      .limit(10),
    cargarSessions()
  ])

  state.proyectosActivos = proyectos || []

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
    ${renderProjects(state.proyectosActivos, minis)}
    ${renderRecommendations(minis, state.proyectosActivos)}
    ${renderSummary({ totalModels, paintedModels, pctGlobal, totalPts })}
    ${renderByGame(byGame)}
    ${renderQueue(inQueue)}
    ${renderBacklog({ pendientes, pctPendiente, byStatusEntries, byStatusModels, totalModels })}
    ${renderLast(minis.slice(0, 3))}
    ${renderSchemes(minis)}
    ${renderHistorial(historial || [])}
    ${renderSessionsBlock()}
  `

  bindHomeEvents(container)
}

// ---------------------------------------------------------------------------
// Render: recomendaciones de siguiente paso
// ---------------------------------------------------------------------------

const ACTION_LABELS = {
  assemble:              'montar',
  prime:                 'imprimar',
  paint_accessible_parts: 'zonas accesibles',
  continue:              'continuar',
  finish:                'terminar',
  review_before_gluing:  'revisar montaje',
}

const REC_BTN_LABELS = {
  finish:               'Terminar',
  continue:             '+ progreso',
  assemble:             'Montar',
  review_before_gluing: 'Ver detalle',
}

function renderRecommendations(minis, proyectos) {
  const emptyState = getEmptyState(minis)

  let bodyHtml
  if (emptyState === 'all_painted') {
    bodyHtml = '<div class="rec-empty">Todo está pintado 🎉</div>'
  } else if (emptyState === 'only_wishlist') {
    bodyHtml = '<div class="rec-empty">Tu colección activa está vacía. Mueve algo de wishlist a colección cuando lo tengas.</div>'
  } else if (emptyState === 'empty') {
    bodyHtml = '<div class="rec-empty">Añade alguna mini para empezar a planificar.</div>'
  } else {
    const recs = getRecommendations(minis, proyectos)
    if (!recs.length) return ''
    bodyHtml = recs.map((rec, idx) => {
      const isPrimary    = idx === 0
      const progressHtml = rec.progress != null
        ? `<div class="rec-progress-bar"><div class="rec-progress-fill" style="width:${rec.progress}%"></div></div>`
        : ''
      const btnLabel = REC_BTN_LABELS[rec.action] || rec.action
      return `
        <div class="rec-card${isPrimary ? ' rec-card--primary' : ' rec-card--secondary'}">
          ${!isPrimary ? '<span class="rec-secondary-label">alternativa</span>' : ''}
          <div class="rec-card-header">
            <span class="rec-card-title">${escapeHtml(rec.title)}</span>
            <span class="rec-action-badge rec-action-${rec.action}">${ACTION_LABELS[rec.action] || rec.action}</span>
          </div>
          <div class="rec-card-subtitle">${escapeHtml(rec.subtitle)}</div>
          ${progressHtml}
          <button class="btn-rec-action" data-action="rec-action" data-rec-action="${rec.action}" data-mini-id="${rec.id}">${escapeHtml(btnLabel)}</button>
        </div>
      `
    }).join('')
  }

  return `
    <div class="home-block home-block--recs">
      <div class="home-block-h">
        <span>// siguiente paso</span>
        <span class="rec-block-hint">sin presión diaria</span>
      </div>
      ${bodyHtml}
    </div>
  `
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

  const photoHtml = project.photo_url
    ? `<img class="home-proj-photo" src="${project.photo_url}" alt="">`
    : ''

  return `
    <div class="home-proj-card" data-action="edit-project" data-project-id="${project.id}">
      ${photoHtml}
      <div class="home-proj-card-header">
        <span class="home-proj-name">${escapeHtml(project.name)}</span>
        <span class="home-proj-pct">${avgProgress}%</span>
      </div>
      <div class="home-proj-progress-bar">
        <div class="home-proj-progress-fill" style="width:${avgProgress}%"></div>
      </div>
      ${unitsHtml
        ? `<div class="home-proj-units">${unitsHtml}</div>`
        : '<div class="home-proj-units-empty">Sin minis — toca para editar</div>'}
      ${paintsHtml ? `<div class="home-proj-paints-row">${paintsHtml}</div>` : ''}
      ${project.recipe ? `<div class="home-proj-recipe-hint">// tiene receta de pintado</div>` : ''}
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
// Acciones de recomendaciones
// ---------------------------------------------------------------------------

function refreshRecsSection() {
  const container  = document.getElementById('home-content')
  if (!container) return
  const recsBlock = container.querySelector('.home-block--recs')
  if (!recsBlock) return
  const temp = document.createElement('div')
  temp.innerHTML = renderRecommendations(state.minisFull || [], state.proyectosActivos || []).trim()
  const newBlock = temp.firstElementChild
  if (newBlock) recsBlock.replaceWith(newBlock)
  else recsBlock.remove()
}

async function handleRecAction(recAction, miniId, btn) {
  btn.disabled = true
  try {
    if (recAction === 'review_before_gluing') {
      const { abrirEdicion } = await import('./mini-modal.js')
      abrirEdicion(miniId)
      btn.disabled = false
      return
    }

    const minisFull = state.minisFull || []
    if (recAction === 'finish') {
      const { error } = await db.from('minis').update({ status: 'pintada', paint_progress: 100 }).eq('id', miniId)
      if (error) throw error
      const m = minisFull.find(x => x.id === miniId)
      if (m) { m.status = 'pintada'; m.paint_progress = 100 }
      mostrarExito('Mini marcada como pintada ✓')

    } else if (recAction === 'continue') {
      const m     = minisFull.find(x => x.id === miniId)
      const next  = Math.min((m?.paint_progress || 0) + 10, 100)
      const patch = next >= 100 ? { paint_progress: 100, status: 'pintada' } : { paint_progress: next }
      const { error } = await db.from('minis').update(patch).eq('id', miniId)
      if (error) throw error
      if (m) Object.assign(m, patch)
      mostrarExito(next >= 100 ? 'Mini completada ✓' : `Progreso: ${next}%`)

    } else if (recAction === 'assemble') {
      const { error } = await db.from('minis').update({ status: 'montada' }).eq('id', miniId)
      if (error) throw error
      const m = minisFull.find(x => x.id === miniId)
      if (m) m.status = 'montada'
      mostrarExito('Estado actualizado a montada')
    }

    refreshRecsSection()
  } catch {
    mostrarError('Error al actualizar')
    btn.disabled = false
  }
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

    if (action === 'rec-action') {
      await handleRecAction(actionEl.dataset.recAction, Number(actionEl.dataset.miniId), actionEl)
    } else if (action === 'create-project') {
      await handleCreateProject()
    } else if (action === 'edit-project') {
      const { abrirModalProyecto } = await import('./project-modal.js')
      await abrirModalProyecto(projectId)
    } else if (action === 'open-mini') {
      if (miniId) {
        const id = Number(miniId)
        if (!state.minisActuales.some(m => m.id === id)) {
          const cached = (state.minisFull || []).find(m => m.id === id)
          if (cached) state.minisActuales = [...state.minisActuales, cached]
        }
        const { abrirEdicion } = await import('./mini-modal.js')
        abrirEdicion(id)
      }
    } else if (action === 'goto-coleccion') {
      cambiarTab('coleccion')
    } else if (action === 'log-session') {
      const { abrirModalSession } = await import('./session-modal.js')
      abrirModalSession()
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
  if (!state.proyectosActivos) state.proyectosActivos = []
  state.proyectosActivos.unshift({ ...data, project_minis: [], project_paints: [] })
  const { abrirModalProyecto } = await import('./project-modal.js')
  await abrirModalProyecto(data.id)
}
