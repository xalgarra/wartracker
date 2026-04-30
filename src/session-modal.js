import { db } from './db.js'
import { escapeHtml } from './utils.js'
import { mostrarError } from './toast.js'
import { getMinis, getProyectos } from './home.js'

let _selectedMiniIds = new Set()

export function abrirModalSession() {
  _selectedMiniIds = new Set()
  document.getElementById('session-date').value = new Date().toISOString().slice(0, 10)
  document.getElementById('session-duration').value = ''
  document.getElementById('session-notes').value = ''
  _renderMinis()

  if (!document.getElementById('modal-session-bg').dataset.bound) {
    _bindEvents()
    document.getElementById('modal-session-bg').dataset.bound = '1'
  }
  document.getElementById('modal-session-bg').classList.add('open')
}

export function cerrarModalSession() {
  document.getElementById('modal-session-bg').classList.remove('open')
}

function _renderMinis() {
  const container = document.getElementById('session-mini-list')
  if (!container) return

  const proyectos = getProyectos()
  const allMinis  = getMinis()
  const seen      = new Set()
  const result    = []

  for (const p of proyectos) {
    for (const pm of (p.project_minis || [])) {
      const m = allMinis.find(x => x.id === Number(pm.mini_id))
      if (m && !seen.has(m.id)) { seen.add(m.id); result.push(m) }
    }
  }
  for (const m of allMinis) {
    if (!seen.has(m.id) && ['pintando', 'imprimada', 'montada'].includes(m.status)) {
      seen.add(m.id); result.push(m)
    }
  }

  container.innerHTML = result.length
    ? result.map(m => `
        <label class="session-mini-item">
          <input type="checkbox" class="session-mini-cb" value="${m.id}">
          <span>${escapeHtml(m.name)}</span>
        </label>`).join('')
    : '<div class="session-mini-empty">Sin minis en proceso actualmente</div>'
}

function _bindEvents() {
  const modal = document.querySelector('#modal-session-bg .modal')
  modal.addEventListener('change', e => {
    const cb = e.target.closest('.session-mini-cb')
    if (!cb) return
    const id = Number(cb.value)
    if (cb.checked) _selectedMiniIds.add(id)
    else _selectedMiniIds.delete(id)
    cb.closest('.session-mini-item').classList.toggle('selected', cb.checked)
  })
}

export async function guardarSession() {
  const date = document.getElementById('session-date').value
  if (!date) { mostrarError('Fecha requerida'); return }

  const durVal       = document.getElementById('session-duration').value
  const duration_min = durVal ? Number(durVal) : null
  const notes        = document.getElementById('session-notes').value.trim() || null

  const btn = document.getElementById('btn-guardar-session')
  if (btn) btn.disabled = true
  try {
    const { data, error } = await db.from('hobby_sessions')
      .insert({ date, duration_min, notes })
      .select('id').single()
    if (error) { mostrarError('Error guardando sesión'); return }

    if (_selectedMiniIds.size) {
      const rows = [..._selectedMiniIds].map(mini_id => ({ session_id: data.id, mini_id }))
      await db.from('hobby_session_minis').insert(rows)
    }

    cerrarModalSession()
    const { cargarSessions, refreshSessionsBlock } = await import('./sessions.js')
    await cargarSessions()
    refreshSessionsBlock()
  } finally {
    if (btn) btn.disabled = false
  }
}
