import { db } from './db.js'
import { state } from './state.js'
import { CITADEL_CATALOG } from '../js/paint-colors.js'
import { toggleColorPicker, cargarPinturas } from './paints.js'

export async function abrirCamara(context = 'catalog') {
  state.cameraContext = context
  const overlay = document.getElementById('camera-overlay')
  overlay.classList.add('open')
  document.getElementById('camera-result').style.display = 'none'
  document.getElementById('camera-scanning').style.display = 'none'

  try {
    state.cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
    })
    document.getElementById('camera-video').srcObject = state.cameraStream
  } catch (e) {
    alert('No se puede acceder a la cámara: ' + e.message)
    cerrarCamara()
  }
}

export function cerrarCamara() {
  if (state.cameraStream) { state.cameraStream.getTracks().forEach(t => t.stop()); state.cameraStream = null }
  document.getElementById('camera-overlay').classList.remove('open')
  state.cameraPendingPaint = null
}

export async function capturarPote() {
  const video = document.getElementById('camera-video')

  if (!video.videoWidth || !video.videoHeight) {
    alert('La cámara aún no está lista. Espera un momento e intenta de nuevo.')
    return
  }

  const MAX_W = 800
  const scale = Math.min(1, MAX_W / video.videoWidth)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(video.videoWidth * scale)
  canvas.height = Math.round(video.videoHeight * scale)
  canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)

  document.getElementById('camera-scanning').style.display = 'flex'
  document.getElementById('camera-result').style.display = 'none'

  try {
    const base64 = canvas.toDataURL('image/jpeg', 0.95).split(',')[1]
    const { data, error } = await db.functions.invoke('hyper-action', {
      body: { image: base64, mediaType: 'image/jpeg' }
    })
    if (error) throw error
    const rawName = (data.name || '').trim()

    if (!rawName || rawName === '?') {
      alert('No se ha podido leer el nombre. Asegúrate de que la etiqueta esté bien iluminada y centrada.')
      document.getElementById('camera-scanning').style.display = 'none'
      return
    }

    const q = rawName.toLowerCase()
    const words = q.split(/\s+/).filter(w => w.length > 2)
    const found = CITADEL_CATALOG.find(p => p.name.toLowerCase() === q)
      || CITADEL_CATALOG.find(p => p.name.toLowerCase().includes(q))
      || CITADEL_CATALOG.find(p => words.length > 0 && words.every(w => p.name.toLowerCase().includes(w)))
      || CITADEL_CATALOG.find(p => words.some(w => p.name.toLowerCase().includes(w)))

    state.cameraPendingPaint = found || { name: rawName.substring(0, 60), type: 'base', hex: null }

    document.getElementById('camera-result-name').textContent = state.cameraPendingPaint.name
    document.getElementById('camera-result-type').textContent = state.cameraPendingPaint.type
    const swatch = document.getElementById('camera-result-swatch')
    swatch.style.background = state.cameraPendingPaint.hex || 'var(--subtle)'
    swatch.style.border = state.cameraPendingPaint.hex ? '2px solid rgba(0,0,0,0.1)' : '2px dashed var(--border)'

    document.getElementById('camera-scanning').style.display = 'none'
    document.getElementById('camera-result').style.display = 'block'
  } catch (e) {
    console.error(e)
    alert('Error al identificar: ' + e.message)
    document.getElementById('camera-scanning').style.display = 'none'
  }
}

export function reintentarCamara() {
  document.getElementById('camera-result').style.display = 'none'
  state.cameraPendingPaint = null
}

export async function confirmarPoteCamara() {
  if (!state.cameraPendingPaint) return
  const p = state.cameraPendingPaint

  if (state.cameraContext === 'modal') {
    document.getElementById('paint-brand').value = 'Citadel'
    document.getElementById('paint-name').value = p.name
    document.getElementById('paint-type').value = p.type || 'base'
    if (p.hex) {
      const cb = document.getElementById('paint-has-color')
      cb.checked = true
      toggleColorPicker(cb)
      document.getElementById('paint-color-hex').value = p.hex
    }
    cerrarCamara()
    return
  }

  const existente = state.pinturas.find(q => q.brand === 'Citadel' && q.name.toLowerCase() === p.name.toLowerCase())
  if (existente) {
    const { error } = await db.from('paints').update({ quantity: (existente.quantity || 1) + 1 }).eq('id', existente.id)
    if (error) { alert('Error: ' + error.message); return }
  } else {
    const payload = { brand: 'Citadel', name: p.name, type: p.type, in_stock: true, quantity: 1 }
    if (p.hex) payload.color_hex = p.hex
    const { error } = await db.from('paints').insert(payload)
    if (error) { alert('Error: ' + error.message); return }
  }
  cerrarCamara()
  await cargarPinturas()
}
