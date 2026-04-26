import { db } from './db.js'
import { state } from './state.js'
import { STATUSES, PAINT_TYPES, UNIT_TYPES, PAINT_BRANDS } from './constants.js'
import { login, logout, toggleDarkMode, mostrarApp } from './auth.js'
import { cambiarTab } from './init.js'
import { onBusqueda, onFiltroType, onOrdenar, actualizarFiltroFacciones, cargarMinis } from './minis.js'
import { abrirModal, abrirEdicion, cerrarModal, guardarMini, eliminarMini, onPhotoSelected, removePhoto, actualizarFacciones, actualizarUnidades, onUnitChange } from './mini-modal.js'
import { abrirModalPintura, abrirEdicionPintura, cerrarModalPintura, toggleColorPicker, onPaintBrandInput, onPaintNameInput, buscarColorExterno, onCatalogSearch, quickAddPintura, guardarPintura, eliminarPintura, filtrarYRenderPinturas } from './paints.js'
import { abrirCamara, cerrarCamara, capturarPote, reintentarCamara, confirmarPoteCamara } from './camera.js'

// Populate static selects from constants (single source of truth)
;(function populateSelects() {
  const statusOpts = STATUSES.map(s => `<option value="${s.value}">${s.label}</option>`).join('')
  document.getElementById('filtro-status').innerHTML =
    '<option value="">Todos los estados</option>' + statusOpts
  document.getElementById('status').innerHTML =
    statusOpts + '<option disabled>──────────</option><option value="wishlist">Wishlist</option>'

  const paintTypeOpts = PAINT_TYPES.map(t =>
    `<option value="${t}">${t.charAt(0).toUpperCase() + t.slice(1)}</option>`
  ).join('')
  document.getElementById('filtro-paint-type').innerHTML =
    '<option value="">Todos los tipos</option>' + paintTypeOpts
  document.getElementById('paint-type').innerHTML = paintTypeOpts

  document.getElementById('filtro-type').innerHTML =
    '<option value="">Todos los tipos</option>' +
    UNIT_TYPES.map(t => `<option value="${t.value}">${t.label}</option>`).join('')

  document.getElementById('brands-list').innerHTML =
    PAINT_BRANDS.map(b => `<option value="${b}">`).join('')
})()

// Expose functions needed by dynamically generated HTML onclick attributes
window.abrirEdicion = abrirEdicion
window.abrirEdicionPintura = abrirEdicionPintura
window.quickAddPintura = quickAddPintura

// Auth
document.getElementById('btn-login')?.addEventListener('click', login)
document.getElementById('btn-logout')?.addEventListener('click', logout)
document.getElementById('btn-theme')?.addEventListener('click', toggleDarkMode)
document.getElementById('email')?.addEventListener('keydown', e => { if (e.key === 'Enter') login() })
document.getElementById('password')?.addEventListener('keydown', e => { if (e.key === 'Enter') login() })

// Tabs
document.getElementById('tab-coleccion')?.addEventListener('click', () => cambiarTab('coleccion'))
document.getElementById('tab-stats')?.addEventListener('click', () => cambiarTab('stats'))
document.getElementById('tab-wishlist')?.addEventListener('click', () => cambiarTab('wishlist'))
document.getElementById('tab-pinturas')?.addEventListener('click', () => cambiarTab('pinturas'))

// FAB — context-aware: opens paint modal when on pinturas tab
document.getElementById('btn-fab')?.addEventListener('click', () => {
  if (state.tabActual === 'pinturas') {
    abrirModalPintura()
  } else {
    abrirModal(abrirModalPintura)
  }
})

// Coleccion filters
document.getElementById('filtro-game')?.addEventListener('change', actualizarFiltroFacciones)
document.getElementById('filtro-faction')?.addEventListener('change', cargarMinis)
document.getElementById('filtro-status')?.addEventListener('change', cargarMinis)
document.getElementById('filtro-type')?.addEventListener('change', onFiltroType)
document.getElementById('busqueda')?.addEventListener('input', e => onBusqueda(e.target.value))

// Sort buttons
document.querySelectorAll('.sort-btn').forEach(btn => {
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
document.getElementById('filtro-paint-type')?.addEventListener('change', filtrarYRenderPinturas)
document.getElementById('filtro-paint-stock')?.addEventListener('change', filtrarYRenderPinturas)

// Catalog search (pinturas tab)
document.getElementById('catalog-search')?.addEventListener('input', e => onCatalogSearch(e.target.value))
document.getElementById('catalog-search')?.addEventListener('focus', e => onCatalogSearch(e.target.value))
document.addEventListener('click', e => {
  if (!e.target.closest('.catalog-search-section')) {
    const r = document.getElementById('catalog-results')
    if (r) r.style.display = 'none'
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
