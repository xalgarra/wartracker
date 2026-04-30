import { db } from './db.js'
import { state } from './state.js'
import { escapeHtml } from './utils.js'

let _bound = false

export async function cargarWishlist() {
  const { data, error } = await db.from('minis').select('*')
    .eq('status', 'wishlist')
    .order('wishlist_priority', { ascending: false })
    .order('name', { ascending: true })
  if (error) { console.error(error); return }
  state.wishlistActuales = data || []
  renderWishlist()
  _bindWishlistEvents()
}

export function renderWishlist() {
  const lista = document.getElementById('lista-wishlist')
  if (!state.wishlistActuales.length) {
    lista.innerHTML = '<div class="empty">La wishlist está vacía — pulsa + para añadir</div>'
    return
  }
  const gameAcronym = { aos: 'AoS', '40k': '40K' }
  lista.innerHTML = state.wishlistActuales.map(mini => {
    const juegosUnicos = [...new Set(
      (mini.factions || []).map(f => state.factions.find(fc => fc.name === f)?.game_slug).filter(Boolean)
    )]
    const gameStr    = juegosUnicos.map(s => gameAcronym[s] || s.toUpperCase()).join(' · ')
    const factionsStr = (mini.factions || []).join(' · ')
    const meta       = [gameStr, factionsStr, mini.notes].filter(Boolean).join(' · ')
    const pts        = juegosUnicos.reduce((found, slug) => {
      if (found) return found
      const fac = (mini.factions || []).find(f => state.factions.find(x => x.name === f && x.game_slug === slug))
      const p   = fac ? state.unitMap[`${mini.name}|${fac}|${slug}`] : null
      return p ? p * mini.qty : null
    }, null)
    const prio     = mini.wishlist_priority || 0
    const prioBadge = prio > 0 ? `<span class="wish-prio-stars">${'★'.repeat(Math.min(prio, 3))}</span>` : ''
    const boughtBadge = mini.partner_bought
      ? `<span class="wish-partner-badge">🎁 en camino</span>`
      : ''
    return `
      <div class="wish-item" data-mini-id="${mini.id}">
        <div class="wish-item-main">
          <div class="wish-name">${escapeHtml(mini.name)}${prioBadge}</div>
          <div class="wish-meta">${escapeHtml(meta)}${boughtBadge}</div>
        </div>
        ${pts ? `<span class="wish-pts">${pts.toLocaleString()} pts</span>` : ''}
        <div class="wish-prio-btns" data-mini-id="${mini.id}">
          <button class="wish-prio-btn" data-wish-action="prio-up" data-mini-id="${mini.id}" title="Más prioridad">▲</button>
          <button class="wish-prio-btn" data-wish-action="prio-down" data-mini-id="${mini.id}" title="Menos prioridad">▼</button>
        </div>
      </div>
    `
  }).join('')
}

function _bindWishlistEvents() {
  if (_bound) return
  _bound = true
  document.getElementById('lista-wishlist').addEventListener('click', async e => {
    const prioBtn = e.target.closest('[data-wish-action]')
    if (prioBtn) {
      e.stopPropagation()
      const miniId = Number(prioBtn.dataset.miniId)
      const delta  = prioBtn.dataset.wishAction === 'prio-up' ? 1 : -1
      const mini   = state.wishlistActuales.find(m => m.id === miniId)
      if (!mini) return
      const newPrio = Math.max(0, Math.min(3, (mini.wishlist_priority || 0) + delta))
      await db.from('minis').update({ wishlist_priority: newPrio }).eq('id', miniId)
      mini.wishlist_priority = newPrio
      renderWishlist()
    }
  })
}
