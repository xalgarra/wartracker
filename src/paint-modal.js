import { db } from './db.js'
import { state } from './state.js'
import { CITADEL_CATALOG, PAINT_COLORS } from '../js/paint-colors.js'
import { mostrarError } from './toast.js'
import { cargarPinturas } from './paints.js'

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
