// src/home.js — Fase 1 Dashboard ("Inicio")
// Pantalla de entrada que responde a: cómo va mi colección, qué tengo
// pendiente y qué puedo hacer ahora.
//
// Carga datos vía Supabase (mismo patrón que stats.js). Usa state.units /
// state.unitMap / state.factions ya cargados por init.js.

import { db } from './db.js'
import { state } from './state.js'
import { STATUSES, STATUS_ORDER } from './constants.js'
import { abrirEdicion } from './mini-modal.js'
import { cambiarStatusRapido } from './minis.js'
import { cambiarTab } from './init.js'

const STATUS_LABEL = Object.fromEntries(STATUSES.map(s => [s.value, s.label]))

// Prioridad para el hero: pintando > imprimada > montada > comprada
const HERO_PRIORITY = ['pintando', 'imprimada', 'montada', 'comprada']
// "En cola": estados que el usuario ya ha empezado, ordenados por urgencia
const IN_PROGRESS_STATUSES = ['pintando', 'imprimada', 'montada']

function pickHero(minis) {
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

function modelsFor(mini) {
  return (mini.models != null ? mini.models : 1) * mini.qty
}

export async function cargarHome() {
  const container = document.getElementById('home-content')
  if (!container) return
  container.innerHTML = '<div class="home-empty">Cargando…</div>'

  const { data: minis, error } = await db
    .from('minis')
    .select('id, name, factions, status, qty, models, photo_url, created_at')
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

  // ---- agregaciones ----
  let totalModels = 0, paintedModels = 0, totalPts = 0, paintedPts = 0
  const byStatusEntries = {}
  const byStatusModels = {}
  const byGame = {}

  for (const m of minis) {
    const mod = modelsFor(m)
    const { pts, gameSlug } = ptsFor(m)
    const totalForMini = pts * m.qty

    totalModels += mod
    totalPts += totalForMini
    byStatusEntries[m.status] = (byStatusEntries[m.status] || 0) + 1
    byStatusModels[m.status] = (byStatusModels[m.status] || 0) + mod
    if (m.status === 'pintada') {
      paintedModels += mod
      paintedPts += totalForMini
    }

    if (gameSlug) {
      if (!byGame[gameSlug]) byGame[gameSlug] = { totalPts: 0, paintedPts: 0, models: 0, painted: 0 }
      byGame[gameSlug].totalPts += totalForMini
      byGame[gameSlug].models += mod
      if (m.status === 'pintada') {
        byGame[gameSlug].paintedPts += totalForMini
        byGame[gameSlug].painted += mod
      }
    }
  }

  const pctGlobal = totalModels ? Math.round(paintedModels / totalModels * 100) : 0
  const pendientes = totalModels - paintedModels
  const pctPendiente = totalModels ? Math.round(pendientes / totalModels * 100) : 0

  const hero = pickHero(minis)
  const inQueue = minis
    .filter(m => IN_PROGRESS_STATUSES.includes(m.status) && (!hero || m.id !== hero.id))
    .sort((a, b) => (STATUS_ORDER[a.status] - STATUS_ORDER[b.status]) ||
                    (new Date(b.created_at) - new Date(a.created_at)))
    .slice(0, 3)
  const ultimas = minis.slice(0, 3) // ya viene ordenado desc por created_at

  // ---- HTML ----
  container.innerHTML = `
    ${hero ? renderHero(hero) : renderHeroEmpty()}
    ${renderSummary({ totalModels, paintedModels, pctGlobal, totalPts })}
    ${renderByGame(byGame)}
    ${renderQueue(inQueue)}
    ${renderBacklog({ pendientes, pctPendiente, byStatusEntries, byStatusModels, totalModels })}
    ${renderLast(ultimas)}
  `

  // listeners delegados
  bindHomeEvents(container)
}

function renderHero(m) {
  const { pts } = ptsFor(m)
  const totalPts = pts * m.qty
  const factions = (m.factions || []).join(' + ')
  const photo = m.photo_url
    ? `<img class="home-hero-photo" src="${m.photo_url}" alt="">`
    : ''
  return `
    <div class="home-hero" data-mini-id="${m.id}">
      ${photo}
      <div class="home-hero-eyebrow">
        <span class="home-hero-pulse"></span>
        Continúa donde lo dejaste
      </div>
      <div class="home-hero-name">${escapeHtml(m.name)}</div>
      <div class="home-hero-fac">${escapeHtml(factions)}</div>
      <div class="home-hero-meta">${modelsFor(m)} modelo${modelsFor(m) !== 1 ? 's' : ''}${totalPts ? ` · ${totalPts.toLocaleString()} pts` : ''}</div>

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

function bindHomeEvents(container) {
  // Un único listener delegado
  if (container.dataset.bound === '1') return
  container.dataset.bound = '1'

  container.addEventListener('click', async e => {
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
        // Refresca el dashboard tras el cambio
        cargarHome()
      }
    } else if (action === 'goto-coleccion') {
      cambiarTab('coleccion')
    }
  })
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]))
}
