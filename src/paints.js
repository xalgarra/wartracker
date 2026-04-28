import { db } from './db.js'
import { state } from './state.js'
import { CITADEL_CATALOG } from '../js/paint-colors.js'
import { PAINT_BRANDS } from './constants.js'
import { mostrarError } from './toast.js'

export async function cargarPinturas() {
  const { data, error } = await db.from('paints').select('*').order('brand').order('name')
  if (error) { mostrarError('Error al cargar pinturas'); return }
  state.pinturas = data || []

  const marcasUsuario = [...new Set(state.pinturas.map(p => p.brand))]
  const todasLasMarcas = [...new Set([...PAINT_BRANDS, ...marcasUsuario])]
  document.getElementById('brands-list').innerHTML = todasLasMarcas.map(b => `<option value="${b}">`).join('')

  filtrarYRenderPinturas()
}

export function filtrarYRenderPinturas() {
  const busqueda = (document.getElementById('busqueda-paint')?.value || '').trim().toLowerCase()
  const tipos = [...document.querySelectorAll('.paint-type-cb:checked')].map(cb => cb.value)
  const stock = document.getElementById('filtro-paint-stock')?.value || ''

  let filtered = state.pinturas
  if (busqueda) filtered = filtered.filter(p =>
    p.name.toLowerCase().includes(busqueda) || p.brand.toLowerCase().includes(busqueda)
  )
  if (tipos.length) filtered = filtered.filter(p => tipos.includes(p.type))
  if (stock === '1') filtered = filtered.filter(p => p.in_stock)
  if (stock === '0') filtered = filtered.filter(p => !p.in_stock)

  const lista = document.getElementById('lista-pinturas')
  if (!filtered.length) {
    lista.innerHTML = `<div class="empty">${state.pinturas.length ? 'Sin resultados' : 'No hay pinturas registradas — pulsa + para añadir'}</div>`
    return
  }
  lista.innerHTML = filtered.map(p => {
    const swatch = p.color_hex
      ? `<div class="paint-swatch" style="background:${p.color_hex}"></div>`
      : `<div class="paint-swatch paint-swatch-none"></div>`
    const stockBadge = p.in_stock ? '' : '<span class="badge badge-sin-stock">Sin stock</span>'
    const qtyBadge = (p.quantity || 1) > 1 ? `<span class="badge-qty">×${p.quantity}</span>` : ''
    return `
      <div class="paint-item" data-paint-id="${p.id}">
        ${swatch}
        <div class="paint-info">
          <span class="paint-name">${p.name}</span>
          <span class="paint-brand">${p.brand}</span>
        </div>
        <div class="paint-tags">
          <span class="badge-paint-type">${p.type}</span>
          ${qtyBadge}
          ${stockBadge}
        </div>
      </div>
    `
  }).join('')
}

export function onCatalogSearch(query) {
  const q = query.trim().toLowerCase()
  const results = document.getElementById('catalog-results')
  if (!q || q.length < 2) { results.style.display = 'none'; results.innerHTML = ''; return }

  const owned = new Set(
    state.pinturas.filter(p => p.brand === 'Citadel').map(p => p.name.toLowerCase())
  )
  const matches = CITADEL_CATALOG.filter(p => p.name.toLowerCase().includes(q)).slice(0, 12)

  if (!matches.length) {
    results.innerHTML = '<div class="catalog-empty">Sin resultados</div>'
    results.style.display = 'block'
    return
  }

  results.innerHTML = matches.map(p => {
    const isOwned = owned.has(p.name.toLowerCase())
    const swatchClass = p.hex ? '' : ' catalog-swatch-none'
    const swatchStyle = p.hex ? `style="background:${p.hex}"` : ''
    const dataAttrs = isOwned ? '' : `data-action="quick-add" data-name="${p.name.replace(/"/g, '&quot;')}" data-type="${p.type}" data-hex="${p.hex || ''}"`
    return `
      <div class="catalog-result${isOwned ? ' owned' : ''}" ${dataAttrs}>
        <div class="catalog-swatch${swatchClass}" ${swatchStyle}></div>
        <div class="catalog-result-info">
          <span class="catalog-result-name">${p.name}</span>
          <span class="catalog-result-type">${p.type}</span>
        </div>
        ${isOwned
          ? '<span class="catalog-owned-mark">✓ tengo</span>'
          : '<span class="catalog-add-btn">+</span>'}
      </div>
    `
  }).join('')
  results.style.display = 'block'
}

export async function quickAddPintura(name, type, hex) {
  const existente = state.pinturas.find(p => p.brand === 'Citadel' && p.name.toLowerCase() === name.toLowerCase())
  if (existente) {
    const { error } = await db.from('paints').update({ quantity: (existente.quantity || 1) + 1 }).eq('id', existente.id)
    if (error) { mostrarError('Error: ' + error.message); return }
  } else {
    const payload = { brand: 'Citadel', name, type, in_stock: true, quantity: 1 }
    if (hex) payload.color_hex = hex
    const { error } = await db.from('paints').insert(payload)
    if (error) { mostrarError('Error: ' + error.message); return }
  }
  document.getElementById('catalog-search').value = ''
  document.getElementById('catalog-results').style.display = 'none'
  await cargarPinturas()
  document.getElementById('catalog-search').focus()
}
