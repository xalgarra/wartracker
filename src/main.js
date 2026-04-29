import { db } from './db.js'
import { state } from './state.js'
import { STATUSES, PAINT_TYPES, UNIT_TYPES, PAINT_BRANDS } from './constants.js'
import { login, logout, toggleDarkMode, mostrarApp } from './auth.js'
import { cerrarModalProyecto, guardarProyecto, completarProyecto, eliminarProyecto, onProjPhotoSelected, removeProjPhoto } from './project-modal.js'
import { cambiarTab } from './init.js'
import { onBusqueda, onFiltroType, onOrdenar, actualizarFiltroFacciones, cargarMinis, cambiarStatusRapido } from './minis.js'
import { abrirModal, abrirEdicion, cerrarModal, guardarMini, eliminarMini, onPhotoSelected, removePhoto, actualizarFacciones, actualizarUnidades, onUnitChange } from './mini-modal.js'
import { onCatalogSearch, quickAddPintura, filtrarYRenderPinturas, setPaintSort } from './paints.js'
import { abrirModalPintura, abrirEdicionPintura, cerrarModalPintura, toggleColorPicker, onPaintBrandInput, onPaintNameInput, buscarColorExterno, guardarPintura, eliminarPintura } from './paint-modal.js'
import { abrirCamara, cerrarCamara, capturarPote, reintentarCamara, confirmarPoteCamara } from './camera.js'
import { exportarJSON } from './export.js'
import { abrirArmyImporter, cerrarArmyImporter, onArmyGameChange, onArmyFactionChange, guardarEjercito } from './army-importer.js'

// Populate static selects from constants (single source of truth)
;(function populateSelects() {
  const statusOpts = STATUSES.map(s => `<option value="${s.value}">${s.label}</option>`).join('')
  document.getElementById('filtro-status').innerHTML =
    '<option value="">Todos los estados</option>' + statusOpts
  document.getElementById('status').innerHTML =
    statusOpts + '<option disabled>──────────</option><option value="wishlist">Wishlist</option>'

  document.getElementById('filtro-paint-type-panel').innerHTML =
    PAINT_TYPES.map(t => `
      <label class="filter-cb-label">
        <input type="checkbox" class="paint-type-cb" value="${t}">
        ${t.charAt(0).toUpperCase() + t.slice(1)}
      </label>
    `).join('')
  document.getElementById('paint-type').innerHTML =
    PAINT_TYPES.map(t => `<option value="${t}">${t.charAt(0).toUpperCase() + t.slice(1)}</option>`).join('')

  document.getElementById('filtro-type').innerHTML =
    '<option value="">Todos los tipos</option>' +
    UNIT_TYPES.map(t => `<option value="${t.value}">${t.label}</option>`).join('')

  document.getElementById('brands-list').innerHTML =
    PAINT_BRANDS.map(b => `<option value="${b}">`).join('')
})()

// Status quick-pick
const statusPicker = document.getElementById('status-picker')

function abrirStatusPicker(badge) {
  const miniId = Number(badge.dataset.miniId)
  const current = badge.dataset.status
  const rect = badge.getBoundingClientRect()

  statusPicker.innerHTML = STATUSES.map(s => `
    <div class="status-picker-item${s.value === current ? ' current' : ''}"
         data-mini-id="${miniId}" data-new-status="${s.value}">
      <span class="legend-dot ${s.value}"></span>${s.label}
    </div>
  `).join('')

  statusPicker.style.top = (rect.bottom + 4) + 'px'
  statusPicker.style.left = rect.left + 'px'
  statusPicker.classList.add('open')

  requestAnimationFrame(() => {
    const r = statusPicker.getBoundingClientRect()
    if (r.right > window.innerWidth - 8) statusPicker.style.left = (window.innerWidth - r.width - 8) + 'px'
  })
}

function cerrarStatusPicker() { statusPicker.classList.remove('open') }

statusPicker.addEventListener('click', async e => {
  const item = e.target.closest('[data-new-status]')
  if (!item) return
  cerrarStatusPicker()
  await cambiarStatusRapido(Number(item.dataset.miniId), item.dataset.newStatus)
})

document.addEventListener('click', e => {
  if (!statusPicker.classList.contains('open')) return
  if (!e.target.closest('#status-picker') && !e.target.closest('[data-action="status-quick"]')) cerrarStatusPicker()
})

document.addEventListener('keydown', e => { if (e.key === 'Escape') cerrarStatusPicker() })

// Event delegation for dynamically rendered lists (replaces window.* globals)
document.getElementById('lista').addEventListener('click', e => {
  const badge = e.target.closest('[data-action="status-quick"]')
  if (badge) { abrirStatusPicker(badge); return }
  const card = e.target.closest('[data-mini-id]')
  if (card) abrirEdicion(Number(card.dataset.miniId))
})
document.getElementById('lista-wishlist').addEventListener('click', e => {
  const item = e.target.closest('[data-mini-id]')
  if (item) abrirEdicion(Number(item.dataset.miniId))
})
document.getElementById('lista-pinturas').addEventListener('click', e => {
  const item = e.target.closest('[data-paint-id]')
  if (item) abrirEdicionPintura(Number(item.dataset.paintId))
})
document.getElementById('catalog-results').addEventListener('click', e => {
  const item = e.target.closest('[data-action="quick-add"]')
  if (item) quickAddPintura(item.dataset.name, item.dataset.type, item.dataset.hex || '')
})

// Auth
document.getElementById('btn-export')?.addEventListener('click', exportarJSON)
document.getElementById('btn-login')?.addEventListener('click', login)
document.getElementById('btn-logout')?.addEventListener('click', logout)
document.getElementById('btn-theme')?.addEventListener('click', toggleDarkMode)
document.getElementById('email')?.addEventListener('keydown', e => { if (e.key === 'Enter') login() })
document.getElementById('password')?.addEventListener('keydown', e => { if (e.key === 'Enter') login() })

// Tabs
document.getElementById('tab-home')?.addEventListener('click', () => cambiarTab('home'))
document.getElementById('tab-coleccion')?.addEventListener('click', () => cambiarTab('coleccion'))
document.getElementById('tab-stats')?.addEventListener('click', () => cambiarTab('stats'))
document.getElementById('tab-wishlist')?.addEventListener('click', () => cambiarTab('wishlist'))
document.getElementById('tab-pinturas')?.addEventListener('click', () => cambiarTab('pinturas'))
document.getElementById('tab-listas')?.addEventListener('click', () => cambiarTab('listas'))

// FAB — context-aware: opens paint modal when on pinturas tab
document.getElementById('btn-fab')?.addEventListener('click', () => {
  if (state.tabActual === 'pinturas') {
    abrirModalPintura()
  } else {
    abrirModal(abrirModalPintura)
  }
})

// Army importer
document.getElementById('btn-army-import')?.addEventListener('click', abrirArmyImporter)
document.getElementById('modal-army-bg')?.addEventListener('click', e => { if (e.target.id === 'modal-army-bg') cerrarArmyImporter() })
document.getElementById('btn-cerrar-army')?.addEventListener('click', cerrarArmyImporter)
document.getElementById('army-game')?.addEventListener('change', onArmyGameChange)
document.getElementById('army-faction')?.addEventListener('change', onArmyFactionChange)
document.getElementById('btn-army-guardar')?.addEventListener('click', guardarEjercito)

// Coleccion filters
document.getElementById('filtro-game')?.addEventListener('change', actualizarFiltroFacciones)
document.getElementById('filtro-faction')?.addEventListener('change', cargarMinis)
document.getElementById('filtro-status')?.addEventListener('change', cargarMinis)
document.getElementById('filtro-type')?.addEventListener('change', onFiltroType)
document.getElementById('busqueda')?.addEventListener('input', e => onBusqueda(e.target.value))

// Sort buttons
document.querySelectorAll('.sort-btn:not(.sort-paint-btn)').forEach(btn => {
  btn.addEventListener('click', () => onOrdenar(btn))
})

// Mini modal
document.getElementById('modal-bg')?.addEventListener('click', e => { if (e.target.id === 'modal-bg') cerrarModal() })
document.getElementById('btn-cerrar-modal')?.addEventListener('click', cerrarModal)
document.getElementById('btn-guardar-mini')?.addEventListener('click', guardarMini)
document.getElementById('btn-eliminar')?.addEventListener('click', eliminarMini)
document.getElementById('game')?.addEventListener('change', actualizarFacciones)
document.getElementById('faction')?.addEventListener('change', actualizarUnidades)
document.getElementById('unit-select')?.addEventListener('change', onUnitChange)
document.getElementById('photo-input')?.addEventListener('change', e => onPhotoSelected(e.target))
document.getElementById('btn-remove-photo')?.addEventListener('click', removePhoto)

// Project modal
document.getElementById('modal-project-bg')?.addEventListener('click', e => { if (e.target.id === 'modal-project-bg') cerrarModalProyecto() })
document.getElementById('btn-cerrar-modal-project')?.addEventListener('click', cerrarModalProyecto)
document.getElementById('btn-guardar-project')?.addEventListener('click', guardarProyecto)
document.getElementById('btn-completar-project')?.addEventListener('click', completarProyecto)
document.getElementById('btn-eliminar-project')?.addEventListener('click', eliminarProyecto)
document.getElementById('proj-photo-input')?.addEventListener('change', e => onProjPhotoSelected(e.target))
document.getElementById('btn-remove-proj-photo')?.addEventListener('click', removeProjPhoto)

// Paint modal
document.getElementById('modal-paint-bg')?.addEventListener('click', e => { if (e.target.id === 'modal-paint-bg') cerrarModalPintura() })
document.getElementById('btn-cerrar-modal-paint')?.addEventListener('click', cerrarModalPintura)
document.getElementById('btn-guardar-pintura')?.addEventListener('click', guardarPintura)
document.getElementById('btn-eliminar-paint')?.addEventListener('click', eliminarPintura)
document.getElementById('paint-brand')?.addEventListener('input', onPaintBrandInput)
document.getElementById('paint-name')?.addEventListener('input', onPaintNameInput)
document.getElementById('paint-has-color')?.addEventListener('change', e => toggleColorPicker(e.target))
document.getElementById('btn-color-search')?.addEventListener('click', buscarColorExterno)
document.getElementById('busqueda-paint')?.addEventListener('input', filtrarYRenderPinturas)
document.getElementById('filtro-paint-stock-btn')?.addEventListener('click', e => {
  e.stopPropagation()
  document.getElementById('filtro-paint-stock-wrap').classList.toggle('open')
})
document.getElementById('filtro-paint-stock-panel')?.addEventListener('change', e => {
  const radio = e.target.closest('.paint-stock-radio')
  if (!radio) return
  const labels = { '': 'Todas', '1': 'En stock', '0': 'Sin stock' }
  const btn = document.getElementById('filtro-paint-stock-btn')
  btn.textContent = labels[radio.value]
  btn.classList.toggle('active', radio.value !== '')
  document.getElementById('filtro-paint-stock-wrap').classList.remove('open')
  filtrarYRenderPinturas()
})

// Dropdown tipo pintura con checkboxes
document.getElementById('filtro-paint-type-btn')?.addEventListener('click', e => {
  e.stopPropagation()
  document.getElementById('filtro-paint-type-wrap').classList.toggle('open')
})
document.getElementById('filtro-paint-type-panel')?.addEventListener('change', () => {
  const checked = [...document.querySelectorAll('.paint-type-cb:checked')].map(cb => cb.value)
  const btn = document.getElementById('filtro-paint-type-btn')
  btn.textContent = checked.length === 0 ? 'Tipo'
    : checked.length <= 2 ? checked.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(', ')
    : `${checked.length} tipos`
  btn.classList.toggle('active', checked.length > 0)
  filtrarYRenderPinturas()
})
// Paint sort
document.querySelectorAll('.sort-paint-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.sort-paint-btn').forEach(b => b.classList.remove('active'))
    btn.classList.add('active')
    setPaintSort(btn.dataset.sort)
  })
})

// Catalog search (pinturas tab)
document.getElementById('catalog-search')?.addEventListener('input', e => onCatalogSearch(e.target.value))
document.getElementById('catalog-search')?.addEventListener('focus', e => onCatalogSearch(e.target.value))
document.addEventListener('click', e => {
  if (!e.target.closest('.catalog-search-section')) {
    const r = document.getElementById('catalog-results')
    if (r) r.style.display = 'none'
  }
  if (!e.target.closest('#filtro-paint-type-wrap')) {
    document.getElementById('filtro-paint-type-wrap')?.classList.remove('open')
  }
  if (!e.target.closest('#filtro-paint-stock-wrap')) {
    document.getElementById('filtro-paint-stock-wrap')?.classList.remove('open')
  }
})

// Camera
document.getElementById('btn-camera-catalog')?.addEventListener('click', () => abrirCamara('catalog'))
document.getElementById('btn-camera-modal')?.addEventListener('click', () => abrirCamara('modal'))
document.getElementById('camera-capture-btn')?.addEventListener('click', capturarPote)
document.getElementById('btn-cerrar-camara')?.addEventListener('click', cerrarCamara)
document.getElementById('btn-reintentar-camara')?.addEventListener('click', reintentarCamara)
document.getElementById('btn-confirmar-camara')?.addEventListener('click', confirmarPoteCamara)

// Bootstrap: restore session on load
db.auth.getSession().then(({ data: { session } }) => {
  if (session) mostrarApp()
})
