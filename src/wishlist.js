import { db } from './db.js'
import { state } from './state.js'

export async function cargarWishlist() {
  const { data, error } = await db.from('minis').select('*')
    .eq('status', 'wishlist').order('name', { ascending: true })
  if (error) { console.error(error); return }
  state.wishlistActuales = data || []
  renderWishlist()
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
    const gameStr = juegosUnicos.map(s => gameAcronym[s] || s.toUpperCase()).join(' · ')
    const factionsStr = (mini.factions || []).join(' · ')
    const meta = [gameStr, factionsStr, mini.notes].filter(Boolean).join(' · ')
    const pts = juegosUnicos.reduce((found, slug) => {
      if (found) return found
      const fac = (mini.factions || []).find(f => state.factions.find(x => x.name === f && x.game_slug === slug))
      const p = fac ? state.unitMap[`${mini.name}|${fac}|${slug}`] : null
      return p ? p * mini.qty : null
    }, null)
    return `
      <div class="wish-item" data-mini-id="${mini.id}">
        <div>
          <div class="wish-name">${mini.name}</div>
          <div class="wish-meta">${meta}</div>
        </div>
        ${pts ? `<span class="wish-pts">${pts.toLocaleString()} pts</span>` : ''}
      </div>
    `
  }).join('')
}
