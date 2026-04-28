import { db } from './db.js'
import { state } from './state.js'
import { STATUSES, STATUS_ORDER } from './constants.js'
import { mostrarError } from './toast.js'
import { cambiarTab } from './init.js'

const STATUS_LABEL = Object.fromEntries(STATUSES.map(s => [s.value, s.label]))
const HERO_PRIORITY = ['pintando', 'imprimada', 'montada', 'comprada']
const IN_PROGRESS_STATUSES = ['pintando', 'imprimada', 'montada']

let _minis = []
let _proyectos = []
let _modalProjectId = null

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

  const { data: proyectos } = await db
    .from('projects')
    .select('id, name, notes, status, project_minis(id, mini_id, notes), project_paints(id, paint_id, paints(name, brand, color_hex))')
    .eq('status', 'activo')
    .order('created_at', { ascending: false })

  _proyectos = proyectos || []

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
// Render: proyectos (tarjetas de resumen)
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

  const unitsHtml = projMinis.map(pm => {
    const mini = allMinis.find(m => m.id === pm.mini_id)
    if (!mini) return ''
    const p = mini.paint_progress || 0
    return `<span class="proj-unit-chip"><span class="proj-unit-chip-name">${escapeHtml(mini.name)}</span><span class="proj-unit-chip-pct">${p}%</span></span>`
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
      ${unitsHtml ? `<div class="home-proj-units">${unitsHtml}</div>` : '<div class="home-proj-units-empty">Sin unidades — pulsa Editar</div>'}
      ${paintsHtml ? `<div class="home-proj-paints-row">${paintsHtml}</div>` : ''}
    </div>
  `
}

// ---------------------------------------------------------------------------
// Modal de proyecto
// ---------------------------------------------------------------------------

export async function abrirModalProyecto(projectId) {
  _modalProjectId = projectId || null
  const project = projectId ? _proyectos.find(p => p.id === projectId) : null

  document.getElementById('modal-project-title').textContent = project ? 'Editar proyecto' : 'Nuevo proyecto'
  document.getElementById('proj-edit-name').value = project?.name || ''
  document.getElementById('btn-eliminar-project').style.display = project ? 'block' : 'none'
  document.getElementById('btn-completar-project').style.display = project ? 'block' : 'none'
  document.getElementById('proj-modal-unit-search').value = ''
  document.getElementById('proj-modal-unit-results').innerHTML = ''
  document.getElementById('proj-modal-paint-search').value = ''
  document.getElementById('proj-modal-paint-results').innerHTML = ''

  renderModalUnits(project)
  renderModalPaints(project)

  if (!document.getElementById('modal-project-bg').dataset.bound) {
    bindModalProjectEvents()
    document.getElementById('modal-project-bg').dataset.bound = '1'
  }

  document.getElementById('modal-project-bg').classList.add('open')
}

export async function cerrarModalProyecto() {
  document.getElementById('modal-project-bg').classList.remove('open')
  _modalProjectId = null
  await cargarHome()
}

export async function guardarProyecto() {
  const name = document.getElementById('proj-edit-name').value.trim()
  if (!name) { mostrarError('El proyecto necesita un nombre'); return }
  if (_modalProjectId) {
    const { error } = await db.from('projects').update({ name }).eq('id', _modalProjectId)
    if (error) { mostrarError('Error guardando proyecto'); return }
  }
  await cerrarModalProyecto()
}

export async function completarProyecto() {
  if (!_modalProjectId) return
  if (!confirm('¿Completar proyecto? Todas sus unidades se marcarán como pintadas.')) return
  const project = _proyectos.find(p => p.id === _modalProjectId)
  const miniIds = (project?.project_minis || []).map(pm => pm.mini_id)
  await Promise.all([
    miniIds.length ? db.from('minis').update({ status: 'pintada' }).in('id', miniIds) : Promise.resolve(),
    db.from('projects').update({ status: 'completado' }).eq('id', _modalProjectId)
  ])
  await cerrarModalProyecto()
}

export async function eliminarProyecto() {
  if (!_modalProjectId) return
  const project = _proyectos.find(p => p.id === _modalProjectId)
  if (!confirm(`¿Eliminar "${project?.name || 'este proyecto'}"?`)) return
  await db.from('projects').delete().eq('id', _modalProjectId)
  await cerrarModalProyecto()
}

function renderModalUnits(project) {
  const projMinis = project?.project_minis || []
  const container = document.getElementById('proj-modal-units')
  if (!container) return
  container.innerHTML = projMinis.length
    ? projMinis.map(pm => {
        const mini = _minis.find(m => m.id === Number(pm.mini_id))
        if (!mini) return ''
        const p = mini.paint_progress || 0
        return `
          <div class="proj-modal-unit-row">
            <span class="proj-modal-row-name">${escapeHtml(mini.name)}</span>
            <label class="proj-modal-pct-wrap">
              <span class="proj-modal-pct-label">Pintado</span>
              <input type="number" class="proj-modal-pct" min="0" max="100" value="${p}"
                     data-action="modal-update-progress" data-mini-id="${mini.id}">
              <span class="proj-modal-pct-label">%</span>
            </label>
            <button class="proj-modal-remove" data-action="modal-remove-mini" data-pm-id="${pm.id}">✕</button>
          </div>
        `
      }).join('')
    : '<div class="proj-modal-empty">Sin minis añadidas</div>'
}

function renderModalPaints(project) {
  const projPaints = project?.project_paints || []
  const container = document.getElementById('proj-modal-paints')
  if (!container) return
  container.innerHTML = projPaints.length
    ? projPaints.map(pp => `
        <div class="proj-modal-row">
          <div class="paint-swatch ${pp.paints?.color_hex ? '' : 'paint-swatch-none'}"
               style="${pp.paints?.color_hex ? `background:${pp.paints.color_hex}` : ''}"></div>
          <span class="proj-modal-row-name">${escapeHtml(pp.paints?.name || '')}</span>
          <span class="proj-modal-row-brand">${escapeHtml(pp.paints?.brand || '')}</span>
          <button class="proj-modal-remove" data-action="modal-remove-paint" data-pp-id="${pp.id}">✕</button>
        </div>
      `).join('')
    : '<div class="proj-modal-empty">Sin pinturas añadidas</div>'
}

async function recargarModal() {
  if (!_modalProjectId) return
  const { data } = await db
    .from('projects')
    .select('id, name, notes, status, project_minis(id, mini_id, notes), project_paints(id, paint_id, paints(name, brand, color_hex))')
    .eq('id', _modalProjectId)
    .single()
  if (!data) return
  const idx = _proyectos.findIndex(p => p.id === _modalProjectId)
  if (idx >= 0) _proyectos[idx] = data
  else _proyectos.unshift(data)
  renderModalUnits(data)
  renderModalPaints(data)
}

function onModalUnitSearch(query) {
  const q = query.trim().toLowerCase()
  const results = document.getElementById('proj-modal-unit-results')
  if (!q) { if (results) results.innerHTML = ''; return }
  const allProjectMiniIds = new Set(
    _proyectos.flatMap(p => (p.project_minis || []).map(pm => Number(pm.mini_id)))
  )
  const matches = _minis.filter(m =>
    !allProjectMiniIds.has(m.id) &&
    m.status !== 'pintada' &&
    m.name.toLowerCase().includes(q)
  ).slice(0, 6)
  results.innerHTML = matches.length
    ? matches.map(m => `
        <div class="home-proj-search-result" data-action="modal-add-mini" data-mini-id="${m.id}">
          <span>${escapeHtml(m.name)}</span>
          <span class="home-proj-result-meta">${escapeHtml((m.factions || [])[0] || '')}</span>
        </div>
      `).join('')
    : '<div class="home-proj-result-empty">Sin resultados</div>'
}

function onModalPaintSearch(query) {
  const q = query.trim().toLowerCase()
  const results = document.getElementById('proj-modal-paint-results')
  if (!q) { if (results) results.innerHTML = ''; return }
  const project = _proyectos.find(p => p.id === _modalProjectId)
  const addedIds = new Set((project?.project_paints || []).map(pp => pp.paint_id))
  const matches = state.pinturas
    .filter(p => !addedIds.has(p.id) && (p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)))
    .slice(0, 6)
  results.innerHTML = matches.length
    ? matches.map(p => `
        <div class="home-proj-search-result" data-action="modal-add-paint" data-paint-id="${p.id}">
          <div class="paint-swatch ${p.color_hex ? '' : 'paint-swatch-none'}"
               style="${p.color_hex ? `background:${p.color_hex}` : ''}"></div>
          <span>${escapeHtml(p.name)}</span>
          <span class="home-proj-result-meta">${escapeHtml(p.brand)}</span>
        </div>
      `).join('')
    : '<div class="home-proj-result-empty">Sin resultados</div>'
}

function bindModalProjectEvents() {
  const modal = document.querySelector('#modal-project-bg .modal')

  document.getElementById('proj-modal-unit-search').addEventListener('input', e => {
    onModalUnitSearch(e.target.value)
  })
  document.getElementById('proj-modal-paint-search').addEventListener('input', e => {
    onModalPaintSearch(e.target.value)
  })

  modal.addEventListener('click', async e => {
    const actionEl = e.target.closest('[data-action]')
    if (!actionEl) return
    const action = actionEl.dataset.action

    if (action === 'modal-add-mini') {
      const { error } = await db.from('project_minis').insert({ project_id: _modalProjectId, mini_id: Number(actionEl.dataset.miniId) })
      if (error) { mostrarError('Error añadiendo unidad'); return }
      document.getElementById('proj-modal-unit-search').value = ''
      document.getElementById('proj-modal-unit-results').innerHTML = ''
      await recargarModal()
    } else if (action === 'modal-add-paint') {
      const { error } = await db.from('project_paints').insert({ project_id: _modalProjectId, paint_id: Number(actionEl.dataset.paintId) })
      if (error) { mostrarError('Error añadiendo pintura'); return }
      document.getElementById('proj-modal-paint-search').value = ''
      document.getElementById('proj-modal-paint-results').innerHTML = ''
      await recargarModal()
    } else if (action === 'modal-remove-mini') {
      await db.from('project_minis').delete().eq('id', actionEl.dataset.pmId)
      await recargarModal()
    } else if (action === 'modal-remove-paint') {
      await db.from('project_paints').delete().eq('id', actionEl.dataset.ppId)
      await recargarModal()
    }
  })

  modal.addEventListener('change', async e => {
    if (e.target.dataset.action === 'modal-update-progress') {
      const val = Math.min(100, Math.max(0, Number(e.target.value) || 0))
      e.target.value = val
      await db.from('minis').update({ paint_progress: val }).eq('id', Number(e.target.dataset.miniId))
      const mini = _minis.find(m => m.id === Number(e.target.dataset.miniId))
      if (mini) mini.paint_progress = val
    }
  })
}

// ---------------------------------------------------------------------------
// Handlers de la sección de proyectos en home
// ---------------------------------------------------------------------------

async function handleCreateProject() {
  const input = document.getElementById('proj-new-name')
  const name = input?.value.trim()
  if (!name) return
  const { data, error } = await db.from('projects').insert({ name }).select().single()
  if (error) { mostrarError('Error creando proyecto: ' + error.message); return }
  if (input) input.value = ''
  _proyectos.unshift({ ...data, project_minis: [], project_paints: [] })
  await abrirModalProyecto(data.id)
}

// ---------------------------------------------------------------------------
// Render: resto del dashboard
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
// Event binding (home-content)
// ---------------------------------------------------------------------------

function bindHomeEvents(container) {
  if (container.dataset.bound === '1') return
  container.dataset.bound = '1'

  container.addEventListener('click', async e => {
    const actionEl = e.target.closest('[data-action]')
    if (!actionEl) return
    const action = actionEl.dataset.action

    if (action === 'create-project') {
      await handleCreateProject()
    } else if (action === 'edit-project') {
      await abrirModalProyecto(actionEl.dataset.projectId)
    } else if (action === 'open-mini') {
      const id = Number(actionEl.dataset.miniId)
      if (id) {
        const { abrirEdicion } = await import('./mini-modal.js')
        abrirEdicion(id)
      }
    } else if (action === 'goto-coleccion') {
      cambiarTab('coleccion')
    }
  })
}

// ---------------------------------------------------------------------------
// Util
// ---------------------------------------------------------------------------

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]))
}
