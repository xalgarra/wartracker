import { db } from './db.js'
import { state } from './state.js'
import { STATUSES, STATUS_ORDER } from './constants.js'
import { abrirEdicion } from './mini-modal.js'
import { cambiarStatusRapido } from './minis.js'
import { cambiarTab } from './init.js'

const STATUS_LABEL = Object.fromEntries(STATUSES.map(s => [s.value, s.label]))

const HERO_PRIORITY = ['pintando', 'imprimada', 'montada', 'comprada']
const IN_PROGRESS_STATUSES = ['pintando', 'imprimada', 'montada']

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

export async function cargarHome() {
  const container = document.getElementById('home-content')
  if (!container) return
  container.innerHTML = '<div class="home-empty">Cargando…</div>'

  const { data: minis, error } = await db
    .from('minis')
    .select('id, name, factions, status, qty, models, photo_url, created_at, paint_progress')
    .neq('status', 'wishlist')
    .order('created_at', { ascending: false })

  if (error) {
    container.innerHTML = '<div class="home-empty">Error al cargar datos</div>'
    return
  }
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

  if (!state.pinturas.length) {
    const { data } = await db.from('paints').select('*').order('brand').order('name')
    if (data) state.pinturas = data
  }

  // Agregaciones
  let totalModels = 0, paintedModels = 0, totalPts = 0
  const byStatusEntries = {}
  const byStatusModels = {}
  const byGame = {}

  for (const m of minis) {
    const mod = modelsFor(m)
    const { pts } = ptsFor(m)
    const totalForMini = pts * m.qty

    totalModels += mod
    totalPts += totalForMini
    byStatusEntries[m.status] = (byStatusEntries[m.status] || 0) + 1
    byStatusModels[m.status] = (byStatusModels[m.status] || 0) + mod
    if (m.status === 'pintada') paintedModels += mod

    for (const { pts: gamePts, gameSlug: slug } of ptsPerGame(m)) {
      if (!byGame[slug]) byGame[slug] = { totalPts: 0, paintedPts: 0 }
      byGame[slug].totalPts += gamePts * m.qty
      if (m.status === 'pintada') byGame[slug].paintedPts += gamePts * m.qty
    }
  }

  const pctGlobal = totalModels ? Math.round(paintedModels / totalModels * 100) : 0
  const pendientes = totalModels - paintedModels
  const pctPendiente = totalModels ? Math.round(pendientes / totalModels * 100) : 0

  // Hero: preferencia guardada en localStorage
  const heroOptions = minis.filter(m => HERO_PRIORITY.includes(m.status))
  let hero = pickHero(minis)
  const savedId = Number(localStorage.getItem('wt_heroMiniId'))
  if (savedId) {
    const saved = minis.find(m => m.id === savedId && HERO_PRIORITY.includes(m.status))
    if (saved) hero = saved
    else localStorage.removeItem('wt_heroMiniId')
  }

  // Pinturas usadas por la mini hero
  let heroMiniPaints = []
  if (hero) {
    const { data: mpData } = await db
      .from('mini_paints')
      .select('id, paint_id, paints(name, brand, color_hex)')
      .eq('mini_id', hero.id)
    heroMiniPaints = mpData || []
  }

  const inQueue = minis
    .filter(m => IN_PROGRESS_STATUSES.includes(m.status) && (!hero || m.id !== hero.id))
    .sort((a, b) => (STATUS_ORDER[a.status] - STATUS_ORDER[b.status]) ||
                    (new Date(b.created_at) - new Date(a.created_at)))
    .slice(0, 3)
  const ultimas = minis.slice(0, 3)

  container.innerHTML = `
    ${hero ? renderHero(hero, heroOptions, heroMiniPaints) : renderHeroEmpty()}
    ${renderSummary({ totalModels, paintedModels, pctGlobal, totalPts })}
    ${renderByGame(byGame)}
    ${renderQueue(inQueue)}
    ${renderBacklog({ pendientes, pctPendiente, byStatusEntries, byStatusModels, totalModels })}
    ${renderLast(ultimas)}
  `

  bindHomeEvents(container)
}

function renderHero(m, heroOptions, miniPaints) {
  const { pts } = ptsFor(m)
  const totalPts = pts * m.qty
  const factions = (m.factions || []).join(' + ')
  const photo = m.photo_url
    ? `<img class="home-hero-photo" src="${m.photo_url}" alt="">`
    : ''
  const progress = m.paint_progress || 0

  const selectorHtml = heroOptions.length > 1 ? `
    <div class="home-hero-selector">
      ${heroOptions.map(opt => `
        <button class="home-hero-sel-pill ${opt.id === m.id ? 'active' : ''}"
                data-action="select-hero" data-mini-id="${opt.id}">
          ${escapeHtml(opt.name)}
        </button>
      `).join('')}
    </div>
  ` : ''

  const addedPaintIds = new Set(miniPaints.map(mp => mp.paint_id))

  const paintsHtml = `
    <div class="home-hero-paints">
      <div class="home-hero-section-label">// pinturas usadas</div>
      ${miniPaints.map(mp => `
        <div class="home-hero-paint-row">
          ${mp.paints?.color_hex
            ? `<div class="home-hero-paint-swatch" style="background:${mp.paints.color_hex}"></div>`
            : `<div class="home-hero-paint-swatch home-hero-paint-swatch-none"></div>`
          }
          <span class="home-hero-paint-name">${escapeHtml(mp.paints?.name || '')}</span>
          <span class="home-hero-paint-brand">${escapeHtml(mp.paints?.brand || '')}</span>
          <button class="home-hero-paint-remove"
                  data-action="remove-mini-paint"
                  data-mp-id="${mp.id}"
                  data-paint-id="${mp.paint_id}"
                  title="Quitar">✕</button>
        </div>
      `).join('')}
      <div class="home-hero-paint-add-wrap">
        <input type="text" class="home-hero-paint-search" id="hero-paint-search"
               placeholder="Añadir pintura…" autocomplete="off"
               data-mini-id="${m.id}"
               data-added="${[...addedPaintIds].join(',')}">
        <div class="hero-paint-results" id="hero-paint-results"></div>
      </div>
    </div>
  `

  return `
    <div class="home-hero" data-mini-id="${m.id}">
      ${photo}
      <div class="home-hero-eyebrow">
        <span class="home-hero-pulse"></span>
        Continúa donde lo dejaste
      </div>
      ${selectorHtml}
      <div class="home-hero-name">${escapeHtml(m.name)}</div>
      <div class="home-hero-fac">${escapeHtml(factions)}</div>
      <div class="home-hero-meta">${modelsFor(m)} modelo${modelsFor(m) !== 1 ? 's' : ''}${totalPts ? ` · ${totalPts.toLocaleString()} pts` : ''}</div>

      <div class="home-hero-progress-row">
        <div class="home-hero-progress-bar">
          <div class="home-hero-progress-fill" style="width:${progress}%"></div>
        </div>
        <input class="home-hero-progress-input" type="number" min="0" max="100"
               value="${progress}" data-action="update-progress" data-mini-id="${m.id}">
        <span class="home-hero-progress-pct">%</span>
      </div>

      ${paintsHtml}

      <div class="home-hero-cta-row">
        <button class="home-hero-cta" data-action="continue" data-mini-id="${m.id}">
          ${m.status === 'pintando' ? 'Continuar pintando' : 'Abrir mini'} →
        </button>
      </div>

      <div class="home-hero-quick">
        <span class="home-hero-quick-label">// cambiar a:</span>
        ${STATUSES.map(s => `
          <button class="home-hero-quick-pill ${m.status === s.value ? 'active' : ''}"
                  data-action="quick-status" data-mini-id="${m.id}" data-new-status="${s.value}">
            ${s.label}
          </button>
        `).join('')}
      </div>
    </div>
  `
}

function renderHeroEmpty() {
  return `
    <div class="home-hero home-hero-empty">
      <div class="home-hero-eyebrow">// nada en proceso</div>
      <div class="home-hero-name">Empieza una mini</div>
      <div class="home-hero-fac">Marca una mini como Pintando o Imprimada para verla aquí.</div>
      <div class="home-hero-cta-row">
        <button class="home-hero-cta" data-action="goto-coleccion">Ir a la colección →</button>
      </div>
    </div>
  `
}

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
        <span>// más en cola · ${items.length}</span>
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
      ` : `<div class="home-empty-inline">// nada más en proceso</div>`}
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
// Event handlers
// ---------------------------------------------------------------------------

function onHeroPaintSearch(query, miniId) {
  const results = document.getElementById('hero-paint-results')
  if (!results) return
  const q = query.trim().toLowerCase()
  if (!q) { results.innerHTML = ''; return }

  const input = document.getElementById('hero-paint-search')
  const added = new Set((input?.dataset.added || '').split(',').map(Number).filter(Boolean))

  const matches = state.pinturas
    .filter(p => !added.has(p.id) && (
      p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)
    ))
    .slice(0, 8)

  if (!matches.length) {
    results.innerHTML = '<div class="hero-paint-empty">Sin resultados</div>'
    return
  }
  results.innerHTML = matches.map(p => `
    <div class="hero-paint-result" data-action="hero-paint-result"
         data-paint-id="${p.id}" data-mini-id="${miniId}">
      ${p.color_hex
        ? `<div class="hero-paint-result-swatch" style="background:${p.color_hex}"></div>`
        : `<div class="hero-paint-result-swatch hero-paint-result-swatch-none"></div>`
      }
      <span>${escapeHtml(p.name)}</span>
      <span class="hero-paint-result-brand">${escapeHtml(p.brand)}</span>
    </div>
  `).join('')
}

async function saveProgress(miniId, value) {
  await db.from('minis').update({ paint_progress: value }).eq('id', miniId)
  const fill = document.querySelector('.home-hero-progress-fill')
  if (fill) fill.style.width = value + '%'
}

async function handleAddMiniPaint(miniId, paintId) {
  const { error } = await db.from('mini_paints').insert({ mini_id: miniId, paint_id: paintId })
  if (error) return
  document.getElementById('hero-paint-search').value = ''
  document.getElementById('hero-paint-results').innerHTML = ''
  await cargarHome()
}

async function handleRemoveMiniPaint(mpId) {
  await db.from('mini_paints').delete().eq('id', mpId)
  await cargarHome()
}

function bindHomeEvents(container) {
  if (container.dataset.bound === '1') return
  container.dataset.bound = '1'

  container.addEventListener('click', async e => {
    // Cerrar resultados al clicar fuera del buscador
    if (!e.target.closest('.home-hero-paint-add-wrap')) {
      const r = document.getElementById('hero-paint-results')
      if (r) r.innerHTML = ''
    }

    const actionEl = e.target.closest('[data-action]')
    if (!actionEl) return
    const action = actionEl.dataset.action
    const id = actionEl.dataset.miniId ? Number(actionEl.dataset.miniId) : null

    if (action === 'continue' || action === 'open-mini') {
      if (id) abrirEdicion(id)
    } else if (action === 'quick-status') {
      e.stopPropagation()
      const newStatus = actionEl.dataset.newStatus
      if (id && newStatus) {
        await cambiarStatusRapido(id, newStatus)
        cargarHome()
      }
    } else if (action === 'goto-coleccion') {
      cambiarTab('coleccion')
    } else if (action === 'select-hero') {
      if (id) {
        localStorage.setItem('wt_heroMiniId', id)
        await cargarHome()
      }
    } else if (action === 'hero-paint-result') {
      const paintId = Number(actionEl.dataset.paintId)
      if (paintId && id) await handleAddMiniPaint(id, paintId)
    } else if (action === 'remove-mini-paint') {
      const mpId = actionEl.dataset.mpId
      if (mpId) await handleRemoveMiniPaint(mpId)
    }
  })

  container.addEventListener('input', e => {
    if (e.target.id === 'hero-paint-search') {
      onHeroPaintSearch(e.target.value, Number(e.target.dataset.miniId))
    }
  })

  container.addEventListener('change', e => {
    if (e.target.dataset.action === 'update-progress') {
      const val = Math.min(100, Math.max(0, Number(e.target.value) || 0))
      e.target.value = val
      saveProgress(Number(e.target.dataset.miniId), val)
    }
  })
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]))
}
