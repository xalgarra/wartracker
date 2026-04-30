import { db } from './db.js'
import { escapeHtml } from './utils.js'

let _sessions = []
export const getSessions = () => _sessions

export async function cargarSessions() {
  const { data } = await db
    .from('hobby_sessions')
    .select('id, date, duration_min, notes, hobby_session_minis(mini_id, minis(name))')
    .order('date', { ascending: false })
    .limit(20)
  _sessions = data || []
}

export function renderSessionsBlock() {
  const thisMonth = new Date().toISOString().slice(0, 7)
  const sessionsThisMonth = _sessions.filter(s => s.date.startsWith(thisMonth)).length
  const streak = calcStreak(_sessions)

  const recentHtml = _sessions.slice(0, 5).map(s => {
    const names = (s.hobby_session_minis || []).map(sm => sm.minis?.name).filter(Boolean)
    const label = names.length ? names.join(', ') : (s.notes || '—')
    const dur   = s.duration_min ? `${s.duration_min}min` : ''
    const date  = new Date(s.date + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
    return `
      <div class="session-row">
        <span class="session-date">${date}</span>
        ${dur ? `<span class="session-dur">${dur}</span>` : ''}
        <span class="session-label">${escapeHtml(label)}</span>
      </div>`
  }).join('')

  return `
    <div class="home-block home-block--sessions">
      <div class="home-block-h">
        <span>// sesiones</span>
        <button class="btn-log-session" data-action="log-session">+ registrar</button>
      </div>
      <div class="session-stats-row">
        <span class="session-stat">${sessionsThisMonth} este mes</span>
        ${streak > 1 ? `<span class="session-stat session-streak">${streak} días seguidos</span>` : ''}
      </div>
      ${recentHtml || '<div class="home-empty-inline">// sin sesiones aún — registra tu primera</div>'}
    </div>`
}

export function refreshSessionsBlock() {
  const container = document.getElementById('home-content')
  if (!container) return
  const block = container.querySelector('.home-block--sessions')
  if (!block) return
  const tmp = document.createElement('div')
  tmp.innerHTML = renderSessionsBlock()
  block.replaceWith(tmp.firstElementChild)
}

function calcStreak(sessions) {
  if (!sessions.length) return 0
  const dateSet = new Set(sessions.map(s => s.date))
  const today   = new Date().toISOString().slice(0, 10)
  if (!dateSet.has(today) && !dateSet.has(prevDay(today))) return 0
  let streak = 0
  let cur    = dateSet.has(today) ? today : prevDay(today)
  while (dateSet.has(cur)) { streak++; cur = prevDay(cur) }
  return streak
}

function prevDay(d) {
  const dt = new Date(d + 'T12:00:00')
  dt.setDate(dt.getDate() - 1)
  return dt.toISOString().slice(0, 10)
}
