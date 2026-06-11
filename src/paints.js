import { db } from './db.js'
import { state } from './state.js'
import { BRAND_CATALOGS } from './paint-colors.js'
import { PAINT_BRANDS } from './constants.js'
import { mostrarError } from './toast.js'
import { comparePaintColors } from './paint-sort.js'

let paintSort = 'nombre'
export function setPaintSort(sort) { paintSort = sort; filtrarYRenderPinturas() }

let paintBrandFilter = ''
export function setPaintBrandFilter(brand) { paintBrandFilter = brand; filtrarYRenderPinturas() }

export async function cargarPinturas() {
  const { data, error } = await db.from('paints').select('*').order('brand').order('name')
  if (error) { mostrarError('Error al cargar pinturas'); return }
  state.pinturas = data || []

  const marcasUsuario = [...new Set(state.pinturas.map(p => p.brand))].sort()
  const todasLasMarcas = [...new Set([...PAINT_BRANDS, ...marcasUsuario])]
  document.getElementById('brands-list').innerHTML = todasLasMarcas.map(b => `<option value="${b}">`).join('')

  const brandSel = document.getElementById('catalog-brand-select')
  if (brandSel) {
    const cur = brandSel.value || 'Citadel'
    brandSel.innerHTML = todasLasMarcas.map(b => `<option value="${b}"${b === cur ? ' selected' : ''}>${b}</option>`).join('')
  }

  const marcaSel = document.getElementById('filtro-paint-marca')
  if (marcaSel) {
    const cur = marcaSel.value
    marcaSel.innerHTML = `<option value="">Todas</option>` + marcasUsuario.map(b => `<option value="${b}"${b === cur ? ' selected' : ''}>${b}</option>`).join('')
  }

  filtrarYRenderPinturas()
}

export function filtrarYRenderPinturas() {
  const busqueda = (document.getElementById('busqueda-paint')?.value || '').trim().toLowerCase()
  const tipos = [...document.querySelectorAll('.paint-type-cb:checked')].map(cb => cb.value)
  const stock = document.querySelector('.paint-stock-radio:checked')?.value || ''

  let filtered = state.pinturas
  if (paintBrandFilter) filtered = filtered.filter(p => p.brand === paintBrandFilter)
  if (busqueda) filtered = filtered.filter(p =>
    p.name.toLowerCase().includes(busqueda) || p.brand.toLowerCase().includes(busqueda)
  )
  if (tipos.length) filtered = filtered.filter(p => tipos.includes(p.type))
  if (stock === '1') filtered = filtered.filter(p => p.in_stock)
  if (stock === '0') filtered = filtered.filter(p => !p.in_stock)

  if (paintSort === 'color') {
    filtered = [...filtered].sort(comparePaintColors)
  }

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
  const brand = document.getElementById('catalog-brand-select')?.value || 'Citadel'
  const q = query.trim().toLowerCase()
  const results = document.getElementById('catalog-results')
  if (!q || q.length < 2) { results.style.display = 'none'; results.innerHTML = ''; return }

  const catalog = BRAND_CATALOGS[brand]
  if (catalog) {
    const matches = catalog.filter(p => p.name.toLowerCase().includes(q)).slice(0, 12)
    if (!matches.length) {
      results.innerHTML = '<div class="catalog-empty">Sin resultados</div>'
      results.style.display = 'block'
      return
    }
    results.innerHTML = matches.map(p => {
      const isOwned = state.pinturas.some(x => x.brand === brand && x.name.toLowerCase() === p.name.toLowerCase() && x.type === p.type)
      const existente = isOwned ? state.pinturas.find(x => x.brand === brand && x.name.toLowerCase() === p.name.toLowerCase() && x.type === p.type) : null
      const swatchClass = p.hex ? '' : ' catalog-swatch-none'
      const swatchStyle = p.hex ? `style="background:${p.hex}"` : ''
      const dataAttrs = `data-action="quick-add-brand" data-brand="${brand}" data-name="${p.name.replace(/"/g, '&quot;')}" data-type="${p.type}" data-hex="${p.hex || ''}"`
      return `
        <div class="catalog-result${isOwned ? ' owned' : ''}" ${dataAttrs}>
          <div class="catalog-swatch${swatchClass}" ${swatchStyle}></div>
          <div class="catalog-result-info">
            <span class="catalog-result-name">${p.name}</span>
            <span class="catalog-result-type">${p.type}</span>
          </div>
          ${isOwned
            ? `<span class="catalog-owned-mark">×${existente?.quantity || 1} +1</span>`
            : '<span class="catalog-add-btn">+</span>'}
        </div>
      `
    }).join('')
  } else {
    const matches = state.pinturas.filter(p => p.brand === brand && p.name.toLowerCase().includes(q)).slice(0, 12)
    const nameEsc = query.trim().replace(/"/g, '&quot;')
    const brandEsc = brand.replace(/"/g, '&quot;')
    results.innerHTML = matches.map(p => {
      const swatchStyle = p.color_hex ? `style="background:${p.color_hex}"` : ''
      const swatchClass = p.color_hex ? '' : ' catalog-swatch-none'
      return `
        <div class="catalog-result owned" data-action="catalog-increment" data-id="${p.id}">
          <div class="catalog-swatch${swatchClass}" ${swatchStyle}></div>
          <div class="catalog-result-info">
            <span class="catalog-result-name">${p.name}</span>
            <span class="catalog-result-type">${p.type}</span>
          </div>
          <span class="catalog-owned-mark">×${p.quantity || 1} +1</span>
        </div>
      `
    }).join('') + `
      <div class="catalog-result" data-action="catalog-open-modal" data-brand="${brandEsc}" data-name="${nameEsc}">
        <div class="catalog-swatch catalog-swatch-none"></div>
        <div class="catalog-result-info">
          <span class="catalog-result-name">${query.trim()}</span>
          <span class="catalog-result-type">Nueva pintura ${brand}</span>
        </div>
        <span class="catalog-add-btn">+</span>
      </div>
    `
  }
  results.style.display = 'block'
}

export function abrirPaintStats() {
  const panel = document.getElementById('paint-stats-panel')
  renderPaintStats()
  panel.style.display = 'flex'
}

export function cerrarPaintStats() {
  document.getElementById('paint-stats-panel').style.display = 'none'
}

function renderPaintStats() {
  const body = document.getElementById('paint-stats-body')
  const paints = state.pinturas
  if (!paints.length) return

  const total   = paints.reduce((s, p) => s + (p.quantity || 1), 0)
  const inStock = paints.filter(p => p.in_stock).reduce((s, p) => s + (p.quantity || 1), 0)
  const noColor = paints.filter(p => !p.color_hex).length

  // Por marca
  const byBrand = {}
  for (const p of paints) byBrand[p.brand] = (byBrand[p.brand] || 0) + (p.quantity || 1)
  const brandsSorted = Object.entries(byBrand).sort((a, b) => b[1] - a[1])
  const maxBrand = brandsSorted[0][1]

  // Por tipo
  const byType = {}
  for (const p of paints) byType[p.type] = (byType[p.type] || 0) + (p.quantity || 1)
  const typesSorted = Object.entries(byType).sort((a, b) => b[1] - a[1])
  const maxType = typesSorted[0][1]

  // Paleta: pinturas con color ordenadas por tono
  const conColor = paints.filter(p => p.color_hex).sort((a, b) => {
    const hue = hex => {
      const r = parseInt(hex.slice(1,3),16)/255
      const g = parseInt(hex.slice(3,5),16)/255
      const bl = parseInt(hex.slice(5,7),16)/255
      const max = Math.max(r,g,bl), min = Math.min(r,g,bl), d = max - min
      if (!d) return 0
      let h = max === r ? (g-bl)/d : max === g ? 2+(bl-r)/d : 4+(r-g)/d
      return ((h*60)+360)%360
    }
    return hue(a.color_hex) - hue(b.color_hex)
  })

  const barRow = (label, count, max, cls = '') => `
    <div class="ps-bar-row">
      <span class="ps-bar-label">${label}</span>
      <div class="ps-bar-track">
        <div class="ps-bar-fill ${cls}" style="width:${Math.round(count/max*100)}%"></div>
      </div>
      <span class="ps-bar-count">${count}</span>
    </div>
  `

  body.innerHTML = `
    <div class="ps-section">
      <div class="ps-kpis">
        <div class="ps-kpi">
          <span class="ps-kpi-num">${total}</span>
          <span class="ps-kpi-label">total</span>
        </div>
        <div class="ps-kpi ps-kpi--stock">
          <span class="ps-kpi-num">${inStock}</span>
          <span class="ps-kpi-label">en stock</span>
        </div>
        <div class="ps-kpi ps-kpi--nostock">
          <span class="ps-kpi-num">${total - inStock}</span>
          <span class="ps-kpi-label">sin stock</span>
        </div>
        <div class="ps-kpi ps-kpi--nocolor">
          <span class="ps-kpi-num">${noColor}</span>
          <span class="ps-kpi-label">sin color</span>
        </div>
      </div>
    </div>

    <div class="ps-section">
      <div class="ps-section-title">Por marca</div>
      ${brandsSorted.map(([b, n]) => barRow(b, n, maxBrand)).join('')}
    </div>

    <div class="ps-section">
      <div class="ps-section-title">Por tipo</div>
      ${typesSorted.map(([t, n]) => barRow(t, n, maxType, `ps-bar-fill--${t}`)).join('')}
    </div>

    ${conColor.length ? `
    <div class="ps-section">
      <div class="ps-section-title">Paleta del rack <span class="ps-section-sub">${conColor.length} colores</span></div>
      <div class="ps-palette">
        ${conColor.map(p => `<div class="ps-palette-swatch" style="background:${p.color_hex}" title="${p.name} (${p.brand})"></div>`).join('')}
      </div>
    </div>` : ''}
  `
}

export async function incrementarPintura(id) {
  const p = state.pinturas.find(x => x.id === Number(id))
  if (!p) return
  const { error } = await db.from('paints').update({ quantity: (p.quantity || 1) + 1 }).eq('id', p.id)
  if (error) { mostrarError('Error: ' + error.message); return }
  document.getElementById('catalog-search').value = ''
  document.getElementById('catalog-results').style.display = 'none'
  await cargarPinturas()
  document.getElementById('catalog-search').focus()
}

export async function quickAddPintura(brand, name, type, hex) {
  const existente = state.pinturas.find(p => p.brand === brand && p.name.toLowerCase() === name.toLowerCase() && p.type === type)
  if (existente) {
    const { error } = await db.from('paints').update({ quantity: (existente.quantity || 1) + 1 }).eq('id', existente.id)
    if (error) { mostrarError('Error: ' + error.message); return }
  } else {
    const payload = { brand, name, type, in_stock: true, quantity: 1 }
    if (hex) payload.color_hex = hex
    const { error } = await db.from('paints').insert(payload)
    if (error) { mostrarError('Error: ' + error.message); return }
  }
  document.getElementById('catalog-search').value = ''
  document.getElementById('catalog-results').style.display = 'none'
  await cargarPinturas()
  document.getElementById('catalog-search').focus()
}
