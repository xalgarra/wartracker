import { IDEA_CATEGORIES, catColor, catLabel, updateIdea, deleteIdea,
         promoteIdeaToSession, promoteIdeaToProject } from './ideas.js'
import { state } from './state.js'
import { escapeHtml } from './utils.js'

// mode: 'view' | 'edit' | 'link' | 'confirm-delete'
let mode = 'view'
let current = null

export function abrirIdeaModal(idea) {
  if (!idea) return
  current = { ...idea }
  mode = 'view'
  renderModal()
}

function cerrar() {
  current = null
  document.querySelector('[data-idea-modal-root]')?.remove()
  document.removeEventListener('keydown', onEsc)
}

function onEsc(e) { if (e.key === 'Escape') cerrar() }

function renderModal() {
  document.querySelector('[data-idea-modal-root]')?.remove()
  if (!current) return

  const root = document.createElement('div')
  root.className = 'idea-modal-backdrop'
  root.setAttribute('data-idea-modal-root', '')

  root.innerHTML = `
    <div class="idea-modal" role="dialog" aria-modal="true">
      <button class="idea-modal-close" data-action="idea-modal-close">✕</button>
      ${mode === 'view'           ? viewBody()          : ''}
      ${mode === 'edit'           ? editBody()          : ''}
      ${mode === 'link'           ? linkBody()          : ''}
      ${mode === 'confirm-delete' ? confirmDeleteBody() : ''}
    </div>
  `

  document.body.appendChild(root)
  document.addEventListener('keydown', onEsc)

  root.addEventListener('click', e => {
    if (e.target === root) { cerrar(); return }
    handleAction(e)
  })
  root.addEventListener('submit', handleSubmit)
  root.addEventListener('input', handleInput)

  if (mode === 'link') {
    root.querySelector('[data-idea-link-filter]')?.focus()
  }
}

// ── Vistas ───────────────────────────────────────────────────────────
function viewBody() {
  const linkedMini = current.mini_id
    ? [...(state.minisFull || []), ...(state.wishlistActuales || [])].find(m => m.id === Number(current.mini_id))
    : null
  return `
    <header class="idea-modal-head">
      <div class="idea-modal-title">${escapeHtml(current.text)}</div>
      <div class="idea-modal-sub">
        ${current.category ? catLabel(current.category) : 'Sin categoría'}
        ${linkedMini ? ` · vinculada a ${escapeHtml(linkedMini.name)}` : ''}
      </div>
    </header>

    <button class="idea-action" data-action="idea-edit">
      <span class="idea-action-glyph">✎</span>
      <span class="idea-action-body">
        <span class="idea-action-name">Editar</span>
        <span class="idea-action-desc">Cambiar texto o categoría</span>
      </span>
    </button>

    <button class="idea-action" data-action="idea-link">
      <span class="idea-action-glyph">⚓</span>
      <span class="idea-action-body">
        <span class="idea-action-name">${linkedMini ? 'Cambiar mini vinculada' : 'Vincular a una mini'}</span>
        <span class="idea-action-desc">${linkedMini ? escapeHtml(linkedMini.name) : 'Conecta con tu colección'}</span>
      </span>
    </button>

    <div class="idea-action-divider">Convertir en…</div>

    <button class="idea-action" data-action="idea-promote-session">
      <span class="idea-action-glyph promote">▶</span>
      <span class="idea-action-body">
        <span class="idea-action-name">Sesión de hobby</span>
        <span class="idea-action-desc">Empezar a cronometrar ahora</span>
      </span>
    </button>

    <button class="idea-action" data-action="idea-promote-project">
      <span class="idea-action-glyph promote">☰</span>
      <span class="idea-action-body">
        <span class="idea-action-name">Proyecto activo</span>
        <span class="idea-action-desc">Mover a "lo que estoy haciendo"</span>
      </span>
    </button>

    <button class="idea-action danger" data-action="idea-confirm-delete">
      <span class="idea-action-glyph">🗑</span>
      <span class="idea-action-body">
        <span class="idea-action-name">Eliminar</span>
        <span class="idea-action-desc">La idea se borra de la lista</span>
      </span>
    </button>
  `
}

function editBody() {
  return `
    <form data-action="idea-save-edit">
      <header class="idea-modal-head">
        <div class="idea-modal-title">Editar idea</div>
      </header>
      <textarea name="text" rows="3" maxlength="500" autofocus class="idea-edit-input">${escapeHtml(current.text)}</textarea>
      <div class="idea-edit-label">Categoría</div>
      <div class="idea-cat-row">
        <button type="button" class="idea-cat-pick ${!current.category ? 'active' : ''}" data-action="idea-cat-pick" data-cat="">Ninguna</button>
        ${IDEA_CATEGORIES.map(c => `
          <button type="button" class="idea-cat-pick ${current.category === c.id ? 'active' : ''}" data-action="idea-cat-pick" data-cat="${c.id}">
            <span class="idea-cat-dot" style="background:${catColor(c.id)}"></span>${c.label}
          </button>`).join('')}
      </div>
      <button type="submit" class="btn-primary" style="margin-top:14px;width:100%">Guardar cambios</button>
      <button type="button" class="btn-link" data-action="idea-cancel-edit" style="margin-top:8px;display:block;width:100%;text-align:center">Cancelar</button>
    </form>
  `
}

function linkBody(query = '') {
  const all = [...(state.minisFull || []), ...(state.wishlistActuales || [])]
  const results = query
    ? all.filter(m => m.name.toLowerCase().includes(query.toLowerCase()) || (m.factions || []).some(f => f.toLowerCase().includes(query.toLowerCase())))
    : all
  const currentMiniId = Number(current.mini_id)
  return `
    <header class="idea-modal-head">
      <div class="idea-modal-title">Vincular a mini</div>
      <div class="idea-modal-sub">De tu colección o wishlist</div>
    </header>
    <div class="idea-link-search">
      <input type="text" placeholder="Busca por nombre o facción…" data-idea-link-filter autocomplete="off" value="${escapeHtml(query)}" />
    </div>
    ${current.mini_id ? `<button class="btn-link" style="color:oklch(0.6 0.18 25);padding:8px 4px" data-action="idea-link-clear">× Quitar vínculo actual</button>` : ''}
    <div class="idea-link-results">
      ${results.slice(0, 40).map(m => `
        <button class="idea-link-result" data-action="idea-link-pick" data-mini="${m.id}">
          <div class="idea-link-result-body">
            <div class="idea-link-result-name">${escapeHtml(m.name)}${m.id === currentMiniId ? '<span class="ok-tick">✓</span>' : ''}</div>
            <div class="idea-link-result-meta">${escapeHtml((m.factions || [])[0] || '')} · ${m.status === 'wishlist' ? 'wishlist' : 'colección'}</div>
          </div>
        </button>`).join('')}
      ${results.length === 0 ? '<p style="padding:12px;font-size:12px;color:var(--fg3)">Sin resultados</p>' : ''}
    </div>
    <button type="button" class="btn-link" data-action="idea-back-view" style="margin-top:8px;display:block;width:100%;text-align:center">← Volver</button>
  `
}

function confirmDeleteBody() {
  return `
    <header class="idea-modal-head">
      <div class="idea-modal-title">¿Eliminar esta idea?</div>
      <div class="idea-modal-sub">${escapeHtml(current.text)}</div>
    </header>
    <button class="idea-action danger" data-action="idea-delete">
      <span class="idea-action-glyph">🗑</span>
      <span class="idea-action-body">
        <span class="idea-action-name">Sí, eliminar</span>
      </span>
    </button>
    <button class="idea-action" data-action="idea-cancel-delete">
      <span class="idea-action-body">
        <span class="idea-action-name">Cancelar</span>
      </span>
    </button>
  `
}

// ── Handlers ─────────────────────────────────────────────────────────
async function handleAction(e) {
  const t = e.target.closest('[data-action]')
  if (!t) return
  const a = t.dataset.action

  switch (a) {
    case 'idea-modal-close':      cerrar(); break
    case 'idea-edit':             mode = 'edit'; renderModal(); break
    case 'idea-cancel-edit':      mode = 'view'; renderModal(); break
    case 'idea-link':             mode = 'link'; renderModal(); break
    case 'idea-back-view':        mode = 'view'; renderModal(); break
    case 'idea-confirm-delete':   mode = 'confirm-delete'; renderModal(); break
    case 'idea-cancel-delete':    mode = 'view'; renderModal(); break

    case 'idea-cat-pick':
      current = { ...current, category: t.dataset.cat || null }
      renderModal()
      break

    case 'idea-link-pick':
      await updateIdea(current.id, { mini_id: t.dataset.mini })
      cerrar()
      break
    case 'idea-link-clear':
      await updateIdea(current.id, { mini_id: null })
      cerrar()
      break

    case 'idea-promote-session':
      await promoteIdeaToSession(current)
      cerrar()
      break
    case 'idea-promote-project':
      await promoteIdeaToProject(current)
      cerrar()
      break

    case 'idea-delete':
      await deleteIdea(current.id)
      cerrar()
      break
  }
}

async function handleSubmit(e) {
  if (e.target.dataset.action !== 'idea-save-edit') return
  e.preventDefault()
  const text = e.target.querySelector('textarea[name="text"]').value.trim()
  if (!text) return
  await updateIdea(current.id, { text, category: current.category || null })
  cerrar()
}

function handleInput(e) {
  if (!e.target.hasAttribute('data-idea-link-filter')) return
  const query = e.target.value
  const modal = document.querySelector('.idea-modal')
  if (!modal) return
  // re-render only the results section
  const resultsEl = modal.querySelector('.idea-link-results')
  if (!resultsEl) return
  const all = [...(state.minisFull || []), ...(state.wishlistActuales || [])]
  const results = query
    ? all.filter(m => m.name.toLowerCase().includes(query.toLowerCase()) || (m.factions || []).some(f => f.toLowerCase().includes(query.toLowerCase())))
    : all
  const currentMiniId = Number(current.mini_id)
  resultsEl.innerHTML = results.slice(0, 40).map(m => `
    <button class="idea-link-result" data-action="idea-link-pick" data-mini="${m.id}">
      <div class="idea-link-result-body">
        <div class="idea-link-result-name">${escapeHtml(m.name)}${m.id === currentMiniId ? '<span class="ok-tick">✓</span>' : ''}</div>
        <div class="idea-link-result-meta">${escapeHtml((m.factions || [])[0] || '')} · ${m.status === 'wishlist' ? 'wishlist' : 'colección'}</div>
      </div>
    </button>`).join('') || '<p style="padding:12px;font-size:12px;color:var(--fg3)">Sin resultados</p>'
}
