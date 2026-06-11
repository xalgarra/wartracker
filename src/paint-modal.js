import { db } from './db.js'
import { state } from './state.js'
import { BRAND_CATALOGS, PAINT_COLORS } from './paint-colors.js'
import { mostrarError } from './toast.js'
import { cargarPinturas } from './paints.js'
import { nearestCatalogPaints } from './color-distance.js'
import { escapeHtml } from './utils.js'

export function abrirModalPintura() {
  state.paintEnEdicion = null
  document.getElementById('modal-paint-title').textContent = 'Añadir pintura'
  document.getElementById('btn-eliminar-paint').style.display = 'none'
  document.getElementById('btn-paint-find-similar').style.display = 'none'
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

  const findSimilarBtn = document.getElementById('btn-paint-find-similar')
  if (hasColor) {
    findSimilarBtn.textContent = paint.in_stock ? '🎨 Buscar similares' : '🎨 Buscar sustituto en mi rack'
    findSimilarBtn.style.display = 'block'
    renderEquivalents(paint.color_hex, paint.brand)
  } else {
    findSimilarBtn.style.display = 'none'
    document.getElementById('paint-equivalents').style.display = 'none'
  }

  document.getElementById('modal-paint-bg').classList.add('open')
}

export async function buscarSimilares() {
  const paint = state.paintEnEdicion
  if (!paint?.color_hex) return
  cerrarModalPintura()
  const { abrirColorSearch } = await import('./paint-color-search.js')
  abrirColorSearch(paint.color_hex, {
    label: paint.in_stock ? `Similares a ${paint.name}` : `Sustituto de ${paint.name} (sin stock)`,
    excludeId: paint.id,
    onlyInStock: !paint.in_stock,  // si está sin stock, solo mostramos opciones que sí tienes
  })
}

export function abrirModalPinturaConMarca(brand, name = '') {
  abrirModalPintura()
  document.getElementById('paint-brand').value = brand
  if (name) document.getElementById('paint-name').value = name
  onPaintBrandInput()
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
  const catalog = BRAND_CATALOGS[brand] || (brand ? null : BRAND_CATALOGS['Citadel'])
  datalist.innerHTML = catalog ? catalog.map(p => `<option value="${p.name}">`).join('') : ''
  onPaintNameInput()
}

export function onPaintNameInput() {
  const brand = document.getElementById('paint-brand').value.trim()
  const name  = document.getElementById('paint-name').value.trim()
  if (!name) return
  const catalog = BRAND_CATALOGS[brand] || BRAND_CATALOGS['Citadel']
  const entry = catalog.find(p => p.name.toLowerCase() === name.toLowerCase())
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

export async function guardarPintura() {
  const brand = document.getElementById('paint-brand').value.trim()
  const name = document.getElementById('paint-name').value.trim()
  const type = document.getElementById('paint-type').value
  if (!brand || !name) { mostrarError('Introduce marca y nombre'); return }

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
    const existente = state.pinturas.find(
      p => p.brand.toLowerCase() === brand.toLowerCase() && p.name.toLowerCase() === name.toLowerCase() && p.type === type
    )
    if (existente) {
      ;({ error } = await db.from('paints').update({ quantity: (existente.quantity || 1) + (payload.quantity || 1) }).eq('id', existente.id))
    } else {
      ;({ error } = await db.from('paints').insert(payload))
    }
  }
  if (error) { mostrarError('Error: ' + error.message); return }

  cerrarModalPintura()
  await cargarPinturas()
}

export async function eliminarPintura() {
  if (!state.paintEnEdicion) return
  if (!confirm(`¿Eliminar "${state.paintEnEdicion.name}"?`)) return
  const { error } = await db.from('paints').delete().eq('id', state.paintEnEdicion.id)
  if (error) { mostrarError('Error: ' + error.message); return }
  cerrarModalPintura()
  await cargarPinturas()
}

function renderEquivalents(hex, brand) {
  const container = document.getElementById('paint-equivalents')

  const userBrands = new Set(state.pinturas.map(p => p.brand))
  userBrands.delete(brand)
  if (!userBrands.size) { container.style.display = 'none'; return }

  const filteredCatalogs = Object.fromEntries(
    Object.entries(BRAND_CATALOGS).filter(([b]) => userBrands.has(b))
  )
  const results = nearestCatalogPaints(hex, filteredCatalogs, brand, 20)
  if (!results.length) { container.style.display = 'none'; return }

  const enriched = results.map(r => {
    const owned = state.pinturas.find(
      p => p.brand === r.brand && p.name.toLowerCase() === r.name.toLowerCase()
    )
    return { ...r, inStock: owned?.in_stock ?? false, owned: !!owned }
  })

  const matchClass = d => d < 5 ? 'great' : d < 12 ? 'good' : d < 25 ? 'ok' : 'far'

  const rowHtml = r => `
    <div class="equiv-row equiv-row--${matchClass(r.distance)}">
      <div class="equiv-swatch" style="background:${r.hex}"></div>
      <div class="equiv-info">
        <span class="equiv-name">${escapeHtml(r.name)}</span>
        <span class="equiv-brand">${escapeHtml(r.brand)} · ${escapeHtml(r.type)}</span>
      </div>
      <div class="equiv-right">
        ${r.owned ? `<span class="equiv-stock ${r.inStock ? 'equiv-stock--yes' : 'equiv-stock--no'}">${r.inStock ? 'En stock' : 'Sin stock'}</span>` : ''}
        <span class="equiv-sim equiv-sim--${matchClass(r.distance)}">${r.similarity}%</span>
      </div>
    </div>
  `

  const visible = enriched.slice(0, 5)
  const hidden  = enriched.slice(5)

  container.style.display = 'block'
  container.innerHTML = `
    <div class="equivalents-title">Equivalentes en catálogo</div>
    ${visible.map(rowHtml).join('')}
    ${hidden.length ? `
      <div class="equiv-more-rows" style="display:none">${hidden.map(rowHtml).join('')}</div>
      <button class="equiv-ver-mas" type="button">Ver ${hidden.length} más</button>
    ` : ''}
  `

  container.querySelector('.equiv-ver-mas')?.addEventListener('click', function () {
    container.querySelector('.equiv-more-rows').style.display = 'block'
    this.style.display = 'none'
  })
}
