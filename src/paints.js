import { db } from './db.js'
import { state } from './state.js'
import { CITADEL_CATALOG, PAINT_COLORS } from '../js/paint-colors.js'

export async function cargarPinturas() {
  const { data, error } = await db.from('paints').select('*').order('brand').order('name')
  if (error) { console.error(error); return }
  state.pinturas = data || []
  filtrarYRenderPinturas()
}

export function filtrarYRenderPinturas() {
  const busqueda = (document.getElementById('busqueda-paint')?.value || '').trim().toLowerCase()
  const tipo = document.getElementById('filtro-paint-type')?.value || ''
  const stock = document.getElementById('filtro-paint-stock')?.value || ''

  let filtered = state.pinturas
  if (busqueda) filtered = filtered.filter(p =>
    p.name.toLowerCase().includes(busqueda) || p.brand.toLowerCase().includes(busqueda)
  )
  if (tipo) filtered = filtered.filter(p => p.type === tipo)
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
      <div class="paint-item" onclick="abrirEdicionPintura(${p.id})">
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

export function abrirModalPintura() {
  state.paintEnEdicion = null
  document.getElementById('modal-paint-title').textContent = 'Añadir pintura'
  document.getElementById('btn-eliminar-paint').style.display = 'none'
  document.getElementById('paint-brand').value = ''
  document.getElementById('paint-name').value = ''
  document.getElementById('paint-type').value = 'base'
  document.getElementById('paint-has-color').checked = false
  document.getElementById('paint-color-hex').style.display = 'none'
  document.getElementById('paint-color-hex').value = '#aaaaaa'
  document.getElementById('paint-qty').value = 1
  document.getElementById('paint-in-stock').checked = true
  document.getElementById('modal-paint-bg').classList.add('open')
}

export function abrirEdicionPintura(id) {
  const paint = state.pinturas.find(p => p.id === id)
  if (!paint) return
  state.paintEnEdicion = paint
  document.getElementById('modal-paint-title').textContent = 'Editar pintura'
  document.getElementById('btn-eliminar-paint').style.display = 'block'
  document.getElementById('paint-brand').value = paint.brand
  document.getElementById('paint-name').value = paint.name
  document.getElementById('paint-type').value = paint.type
  const hasColor = !!paint.color_hex
  document.getElementById('paint-has-color').checked = hasColor
  document.getElementById('paint-color-hex').style.display = hasColor ? 'inline-block' : 'none'
  if (hasColor) document.getElementById('paint-color-hex').value = paint.color_hex
  document.getElementById('paint-qty').value = paint.quantity || 1
  document.getElementById('paint-in-stock').checked = paint.in_stock
  document.getElementById('modal-paint-bg').classList.add('open')
}

export function cerrarModalPintura() {
  state.paintEnEdicion = null
  document.getElementById('modal-paint-bg').classList.remove('open')
}

export function toggleColorPicker(cb) {
  document.getElementById('paint-color-hex').style.display = cb.checked ? 'inline-block' : 'none'
}

export function onPaintBrandInput() {
  const brand = document.getElementById('paint-brand').value.trim()
  const datalist = document.getElementById('paint-names-list')
  if (brand === 'Citadel' || !brand) {
    datalist.innerHTML = CITADEL_CATALOG.map(p => `<option value="${p.name}">`).join('')
  } else {
    const colors = PAINT_COLORS[brand]
    datalist.innerHTML = colors ? Object.keys(colors).map(n => `<option value="${n}">`).join('') : ''
  }
  onPaintNameInput()
}

export function onPaintNameInput() {
  const brand = document.getElementById('paint-brand').value.trim()
  const name  = document.getElementById('paint-name').value.trim()
  if (!name) return
  const entry = brand === 'Citadel' || !brand
    ? CITADEL_CATALOG.find(p => p.name.toLowerCase() === name.toLowerCase())
    : null
  if (entry) {
    if (entry.hex) {
      document.getElementById('paint-has-color').checked = true
      document.getElementById('paint-color-hex').style.display = 'inline-block'
      document.getElementById('paint-color-hex').value = entry.hex
    }
    if (entry.type) document.getElementById('paint-type').value = entry.type
  } else {
    const hex = PAINT_COLORS[brand]?.[name]
    if (hex) {
      document.getElementById('paint-has-color').checked = true
      document.getElementById('paint-color-hex').style.display = 'inline-block'
      document.getElementById('paint-color-hex').value = hex
    }
  }
}

export function buscarColorExterno() {
  const brand = document.getElementById('paint-brand').value.trim()
  const name  = document.getElementById('paint-name').value.trim()
  const q = encodeURIComponent(`${brand} ${name} paint hex color`)
  window.open(`https://www.google.com/search?q=${q}`, '_blank')
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
    const safeName = p.name.replace(/'/g, "\\'")
    const onclick = isOwned ? '' : `onclick="quickAddPintura('${safeName}','${p.type}','${p.hex || ''}')" `
    return `
      <div class="catalog-result${isOwned ? ' owned' : ''}" ${onclick}>
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
    if (error) { console.error(error); return }
  } else {
    const payload = { brand: 'Citadel', name, type, in_stock: true, quantity: 1 }
    if (hex) payload.color_hex = hex
    const { error } = await db.from('paints').insert(payload)
    if (error) { console.error(error); return }
  }
  document.getElementById('catalog-search').value = ''
  document.getElementById('catalog-results').style.display = 'none'
  await cargarPinturas()
}

export async function guardarPintura() {
  const brand = document.getElementById('paint-brand').value.trim()
  const name = document.getElementById('paint-name').value.trim()
  const type = document.getElementById('paint-type').value
  if (!brand || !name) { alert('Introduce marca y nombre'); return }

  const hasColor = document.getElementById('paint-has-color').checked
  const payload = {
    brand,
    name,
    type,
    color_hex: hasColor ? document.getElementById('paint-color-hex').value : null,
    in_stock: document.getElementById('paint-in-stock').checked,
    quantity: parseInt(document.getElementById('paint-qty').value) || 1
  }

  let error
  if (state.paintEnEdicion) {
    ;({ error } = await db.from('paints').update(payload).eq('id', state.paintEnEdicion.id))
  } else {
    ;({ error } = await db.from('paints').insert(payload))
  }
  if (error) { alert('Error: ' + error.message); return }

  cerrarModalPintura()
  await cargarPinturas()
}

export async function eliminarPintura() {
  if (!state.paintEnEdicion) return
  if (!confirm(`¿Eliminar "${state.paintEnEdicion.name}"?`)) return
  const { error } = await db.from('paints').delete().eq('id', state.paintEnEdicion.id)
  if (error) { alert('Error: ' + error.message); return }
  cerrarModalPintura()
  await cargarPinturas()
}
