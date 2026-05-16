import { state } from './state.js'
import { db } from './db.js'
import { mostrarError } from './toast.js'
import { escapeHtml } from './utils.js'

export const IDEA_CATEGORIES = [
  { id: 'tecnica', label: 'Técnica', hue: 220 },
  { id: 'mini',    label: 'Mini',    hue: 305 },
  { id: 'compra',  label: 'Compra',  hue: 70  },
  { id: 'lista',   label: 'Lista',   hue: 15  },
  { id: 'otros',   label: 'Otros',   hue: 280 },
]

export function catLabel(id) {
  return IDEA_CATEGORIES.find(c => c.id === id)?.label || null
}
export function catColor(id) {
  const c = IDEA_CATEGORIES.find(x => x.id === id)
  return c ? `oklch(0.70 0.13 ${c.hue})` : null
}

function findMini(id) {
  if (!id) return null
  const nid = Number(id)
  return (state.minisFull || []).find(m => m.id === nid)
    || (state.wishlistActuales || []).find(m => m.id === nid)
    || null
}

// ── Carga inicial ────────────────────────────────────────────────────
export async function loadIdeas() {
  try {
    const { data, error } = await db
      .from('hobby_ideas')
      .select('id,text,category,mini_id,order_index,status,created_at')
      .eq('status', 'open')
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: false })
    if (error) throw error
    state.ideas = data || []
  } catch (e) {
    state.ideas = []
    mostrarError('No se pudieron cargar las ideas')
    console.error(e)
  }
}

// ── Render: widget en Home ───────────────────────────────────────────
export function mountIdeas(el) {
  if (!el) return
  el.addEventListener('click', handleIdeasClick)
  el.addEventListener('submit', handleComposerSubmit)
  el.addEventListener('keydown', handleComposerEnter)
  renderIdeasWidget(el)
}

export function renderIdeasWidget(el, { max = 6 } = {}) {
  if (!el) return
  const ideas = state.ideas || []
  const visible = ideas.slice(0, max)
  const overflow = Math.max(0, ideas.length - max)

  el.innerHTML = `
    <div class="ideas-card" data-ideas-root>
      <div class="ideas-card-head">
        <span class="ideas-card-eyebrow">IDEAS</span>
        ${ideas.length > 0
          ? `<button class="ideas-card-action" data-action="ideas-open-full">Ver todas · ${ideas.length}</button>`
          : ''}
      </div>

      <div class="ideas-list">
        ${visible.length === 0
          ? `<div class="ideas-empty">
               <div class="ideas-empty-title">Sin ideas todavía</div>
               <div class="ideas-empty-desc">Apunta cosas que quieres hacer en algún momento — técnicas, minis, compras.</div>
             </div>`
          : visible.map(renderIdeaRow).join('')}
      </div>

      ${renderComposer()}

      ${overflow > 0
        ? `<button class="ideas-overflow" data-action="ideas-open-full">Hay ${overflow} idea${overflow !== 1 ? 's' : ''} más → ver todas</button>`
        : ''}
    </div>
  `
}

function renderIdeaRow(idea) {
  const linked = findMini(idea.mini_id)
  const color = catColor(idea.category)
  return `
    <div class="idea-row" data-action="ideas-open-actions" data-id="${idea.id}">
      <div class="idea-body">
        <div class="idea-text">${escapeHtml(idea.text)}</div>
        ${(idea.category || linked) ? `
          <div class="idea-meta">
            ${idea.category ? `<span class="idea-cat"><span class="idea-cat-dot" style="background:${color}"></span>${catLabel(idea.category)}</span>` : ''}
            ${linked ? `<span class="idea-link" data-action="ideas-open-mini" data-id="${linked.id}"><span class="idea-link-glyph">⚓</span>${escapeHtml(linked.name)}</span>` : ''}
          </div>` : ''}
      </div>
      <span class="idea-chev">›</span>
    </div>
  `
}

function renderComposer() {
  return `
    <form class="idea-composer" data-action="ideas-submit-composer">
      <input type="text" name="text" maxlength="500" placeholder="Apunta una idea…" autocomplete="off" />
      <button type="submit" class="idea-composer-add" aria-label="Añadir idea">＋</button>
    </form>
  `
}

// ── Render: pantalla completa ────────────────────────────────────────
export function renderIdeasScreen(el) {
  if (!el) return
  const ideas = state.ideas || []
  const filter = state.ideasFilter || 'todas'
  const filtered = filter === 'todas' ? ideas : ideas.filter(i => i.category === filter)

  el.innerHTML = `
    <div class="ideas-screen">
      <header class="ideas-screen-head">
        <button class="md-back" data-action="ideas-close-full">‹</button>
        <h2>Ideas</h2>
      </header>
      <div class="ideas-screen-composer">${renderComposer()}</div>
      <div class="ideas-filters">
        <button class="ideas-filter ${filter === 'todas' ? 'active' : ''}" data-action="ideas-set-filter" data-filter="todas">Todas · ${ideas.length}</button>
        ${IDEA_CATEGORIES.map(c => {
          const n = ideas.filter(i => i.category === c.id).length
          if (!n) return ''
          return `<button class="ideas-filter ${filter === c.id ? 'active' : ''}" data-action="ideas-set-filter" data-filter="${c.id}">
            <span class="idea-cat-dot" style="background:${catColor(c.id)}"></span>${c.label} · ${n}
          </button>`
        }).join('')}
      </div>
      <div class="ideas-screen-list" data-sortable-root>
        ${filtered.map(renderDraggableRow).join('')}
      </div>
      ${filtered.length === 0
        ? `<div class="ideas-empty" style="padding:24px"><div class="ideas-empty-title">Sin resultados</div><div class="ideas-empty-desc">Cambia el filtro para ver otras ideas.</div></div>`
        : ''}
      <p class="ideas-screen-foot">Orden manual · arrastra <span style="color:var(--fg2)">⋮⋮</span> para reordenar</p>
    </div>
  `
  initSortable(el.querySelector('[data-sortable-root]'))
}

function renderDraggableRow(idea) {
  const linked = findMini(idea.mini_id)
  const color = catColor(idea.category)
  return `
    <div class="idea-row idea-row-drag" draggable="true" data-action="ideas-open-actions" data-id="${idea.id}">
      <span class="idea-grip" aria-hidden="true">⋮⋮</span>
      <div class="idea-body">
        <div class="idea-text">${escapeHtml(idea.text)}</div>
        ${(idea.category || linked) ? `
          <div class="idea-meta">
            ${idea.category ? `<span class="idea-cat"><span class="idea-cat-dot" style="background:${color}"></span>${catLabel(idea.category)}</span>` : ''}
            ${linked ? `<span class="idea-link" data-action="ideas-open-mini" data-id="${linked.id}"><span class="idea-link-glyph">⚓</span>${escapeHtml(linked.name)}</span>` : ''}
          </div>` : ''}
      </div>
      <span class="idea-chev">›</span>
    </div>
  `
}

// ── Event handlers ───────────────────────────────────────────────────
function handleIdeasClick(e) {
  const t = e.target.closest('[data-action]')
  if (!t) return
  const { action, id, filter } = t.dataset

  if (action === 'ideas-open-mini') {
    e.stopPropagation()
    import('./mini-detail.js').then(m => m.abrirDetalleMini(Number(id)))
    return
  }

  switch (action) {
    case 'ideas-open-actions': {
      const idea = (state.ideas || []).find(i => i.id === id)
      if (idea) import('./idea-modal.js').then(m => m.abrirIdeaModal(idea))
      break
    }
    case 'ideas-open-full':
      openFullScreen()
      break
    case 'ideas-close-full':
      closeFullScreen()
      break
    case 'ideas-set-filter':
      state.ideasFilter = filter
      renderIdeasScreen(document.querySelector('[data-ideas-screen]'))
      break
  }
}

function handleComposerSubmit(e) {
  if (e.target.dataset.action !== 'ideas-submit-composer') return
  e.preventDefault()
  const input = e.target.querySelector('input[name="text"]')
  const text = (input.value || '').trim()
  if (!text) return
  input.value = ''
  input.focus()
  createIdea(text)
}

function handleComposerEnter(e) {
  if (e.key === 'Escape' && document.querySelector('[data-ideas-screen]')) closeFullScreen()
}

// ── CRUD ─────────────────────────────────────────────────────────────
export async function createIdea(text, { category = null, mini_id = null } = {}) {
  const min = (state.ideas || []).reduce((m, i) => Math.min(m, i.order_index), 0)
  const optimistic = { id: `tmp-${Date.now()}`, text, category, mini_id, order_index: min - 1, status: 'open', created_at: new Date().toISOString() }
  state.ideas = [optimistic, ...(state.ideas || [])]
  rerenderActive()
  try {
    const { data, error } = await db
      .from('hobby_ideas')
      .insert({ text, category, mini_id, order_index: optimistic.order_index })
      .select()
      .single()
    if (error) throw error
    state.ideas = state.ideas.map(i => i.id === optimistic.id ? data : i)
    rerenderActive()
  } catch (e) {
    state.ideas = (state.ideas || []).filter(i => !String(i.id).startsWith('tmp-'))
    rerenderActive()
    mostrarError('No se pudo crear la idea')
    console.error(e)
  }
}

export async function updateIdea(id, patch) {
  const prev = (state.ideas || []).find(i => i.id === id)
  if (!prev) return
  state.ideas = state.ideas.map(i => i.id === id ? { ...i, ...patch } : i)
  rerenderActive()
  try {
    const { error } = await db.from('hobby_ideas').update(patch).eq('id', id)
    if (error) throw error
  } catch (e) {
    state.ideas = state.ideas.map(i => i.id === id ? prev : i)
    rerenderActive()
    mostrarError('No se pudo actualizar la idea')
    console.error(e)
  }
}

export async function deleteIdea(id) {
  const prev = state.ideas
  state.ideas = state.ideas.filter(i => i.id !== id)
  rerenderActive()
  try {
    const { error } = await db.from('hobby_ideas').delete().eq('id', id)
    if (error) throw error
  } catch (e) {
    state.ideas = prev
    rerenderActive()
    mostrarError('No se pudo eliminar la idea')
    console.error(e)
  }
}

export async function reorderIdeas(newOrderIds) {
  const map = new Map(newOrderIds.map((id, idx) => [id, idx]))
  state.ideas = (state.ideas || [])
    .map(i => ({ ...i, order_index: map.has(i.id) ? map.get(i.id) : i.order_index }))
    .sort((a, b) => a.order_index - b.order_index)
  rerenderActive()
  try {
    const rows = newOrderIds.map((id, idx) => ({ id, order_index: idx }))
    const { error } = await db.from('hobby_ideas').upsert(rows)
    if (error) throw error
  } catch (e) {
    mostrarError('No se pudo guardar el orden')
    console.error(e)
    await loadIdeas()
    rerenderActive()
  }
}

// stubs para MVP — se implementan en siguiente fase
export async function promoteIdeaToSession() {}
export async function promoteIdeaToProject() {}

// ── Helpers ──────────────────────────────────────────────────────────
function rerenderActive() {
  const widgetEl = document.getElementById('home-ideas-sidebar')
  if (widgetEl) renderIdeasWidget(widgetEl)
  const screenEl = document.querySelector('[data-ideas-screen]')
  if (screenEl) renderIdeasScreen(screenEl)
}

function openFullScreen() {
  if (document.querySelector('[data-ideas-screen]')) return
  const overlay = document.createElement('div')
  overlay.setAttribute('data-ideas-screen', '')
  overlay.style.cssText = 'position:fixed;inset:0;z-index:50;background:var(--bg);overflow-y:auto;'
  document.body.appendChild(overlay)
  renderIdeasScreen(overlay)
  overlay.addEventListener('click', handleIdeasClick)
  overlay.addEventListener('submit', handleComposerSubmit)
  overlay.addEventListener('keydown', handleComposerEnter)
}

function closeFullScreen() {
  document.querySelector('[data-ideas-screen]')?.remove()
}

function initSortable(root) {
  if (!root) return
  let dragId = null

  root.addEventListener('dragstart', e => {
    const row = e.target.closest('[data-id]')
    if (!row) return
    dragId = row.dataset.id
    setTimeout(() => row.classList.add('dragging'), 0)
  })
  root.addEventListener('dragend', e => {
    e.target.closest('[data-id]')?.classList.remove('dragging')
    root.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'))
    dragId = null
  })
  root.addEventListener('dragover', e => {
    e.preventDefault()
    const row = e.target.closest('[data-id]')
    if (!row || row.dataset.id === dragId) return
    root.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'))
    row.classList.add('drag-over')
  })
  root.addEventListener('drop', e => {
    e.preventDefault()
    const target = e.target.closest('[data-id]')
    if (!target || !dragId || target.dataset.id === dragId) return
    const ids = [...root.querySelectorAll('[data-id]')].map(r => r.dataset.id)
    const from = ids.indexOf(dragId)
    const to = ids.indexOf(target.dataset.id)
    if (from === -1 || to === -1) return
    ids.splice(from, 1)
    ids.splice(to, 0, dragId)
    reorderIdeas(ids)
  })
}
