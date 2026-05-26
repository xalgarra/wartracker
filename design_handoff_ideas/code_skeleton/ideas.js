// =====================================================================
// ideas.js — módulo "Ideas" (cosas que el usuario quiere hacer en
// algún momento). Vive en la columna derecha de Home (la que hoy
// muestra "PLAN DE LA SEMANA" vacía) y se apila en mobile.
//
// Sigue las convenciones del proyecto:
//   - Estado global en `state` (importado de ./state.js)
//   - Sin reactividad: cambias `state` y llamas a render*()
//   - Event delegation con data-action en el contenedor
//   - Errores con mostrarError() del toast, nunca alert()
//   - Modal con patrón de los existentes (mini-modal, paint-modal…)
//
// Este archivo es UN ESQUELETO. Las firmas y la estructura están
// fijadas para que cuadre con la spec del README. Lo que toca:
//   1) Conectar `db.js` a las cuatro queries marcadas con TODO_DB
//   2) Cablear `mountIdeas()` desde home.js
//   3) Abrir el modal de acciones (idea-modal.js) desde data-action
// =====================================================================

import { state } from './state.js';
import { db } from './db.js';
import { mostrarError } from './toast.js';
import { abrirIdeaModal } from './idea-modal.js';

// ─── Catálogo de categorías ──────────────────────────────────────────
// (sincronizado con el CHECK constraint del SQL)
export const IDEA_CATEGORIES = [
  { id: 'tecnica', label: 'Técnica',  hue: 220 },
  { id: 'mini',    label: 'Mini',     hue: 305 },
  { id: 'compra',  label: 'Compra',   hue: 70  },
  { id: 'lista',   label: 'Lista',    hue: 15  },
  { id: 'otros',   label: 'Otros',    hue: 280 },
];

export function catLabel(id) {
  return IDEA_CATEGORIES.find(c => c.id === id)?.label || null;
}
export function catColor(id) {
  const c = IDEA_CATEGORIES.find(x => x.id === id);
  return c ? `oklch(0.70 0.13 ${c.hue})` : null;
}

// ─── Carga inicial ───────────────────────────────────────────────────
// Llamar UNA vez tras login (en init.js, junto al resto de cargas).
export async function loadIdeas() {
  try {
    // TODO_DB: SELECT * FROM hobby_ideas WHERE status='open'
    //          ORDER BY order_index ASC, created_at DESC
    const { data, error } = await db
      .from('hobby_ideas')
      .select('id,text,category,mini_id,order_index,status,created_at')
      .eq('status', 'open')
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: false });
    if (error) throw error;
    state.ideas = data || [];
  } catch (e) {
    state.ideas = [];
    mostrarError('No se pudieron cargar las ideas');
    console.error(e);
  }
}

// ─── Render: widget en Home (columna derecha) ────────────────────────
// `el` es el contenedor donde va el widget. Mismo método que el resto
// de secciones de home.js.
export function renderIdeasWidget(el, { max = 6 } = {}) {
  if (!el) return;
  const ideas = state.ideas || [];
  const visible = ideas.slice(0, max);
  const overflow = Math.max(0, ideas.length - max);

  el.innerHTML = `
    <div class="ideas-card" data-ideas-root>
      <div class="ideas-card-head">
        <span class="ideas-card-eyebrow">IDEAS</span>
        <button class="ideas-card-action" data-action="ideas-open-full">
          Ver todas${ideas.length ? ` · ${ideas.length}` : ''}
        </button>
      </div>

      <div class="ideas-list">
        ${visible.length === 0
          ? `<div class="ideas-empty">
               <div class="ideas-empty-title">Sin ideas todavía</div>
               <div class="ideas-empty-desc">
                 Apunta cosas que quieres hacer en algún momento —
                 técnicas, minis, compras.
               </div>
             </div>`
          : visible.map(renderIdeaRow).join('')}
      </div>

      ${renderComposer()}

      ${overflow > 0
        ? `<button class="ideas-overflow" data-action="ideas-open-full">
             Hay ${overflow} idea${overflow !== 1 ? 's' : ''} más → ver todas
           </button>`
        : ''}
    </div>
  `;

  // Un solo listener por contenedor (event delegation)
  el.addEventListener('click', handleIdeasClick);
  el.addEventListener('submit', handleComposerSubmit);
  el.addEventListener('keydown', handleComposerEnter);
}

function renderIdeaRow(idea) {
  const linked = idea.mini_id
    ? state.minis?.find(m => m.id === idea.mini_id)
    : null;
  const color = catColor(idea.category);

  return `
    <div class="idea-row" data-action="ideas-open-actions" data-id="${idea.id}">
      <div class="idea-body">
        <div class="idea-text">${escapeHtml(idea.text)}</div>
        ${(idea.category || linked) ? `
          <div class="idea-meta">
            ${idea.category ? `
              <span class="idea-cat">
                <span class="idea-cat-dot" style="background:${color}"></span>
                ${catLabel(idea.category)}
              </span>` : ''}
            ${linked ? `
              <span class="idea-link" data-action="ideas-open-mini" data-id="${linked.id}">
                <span class="idea-link-glyph">⚓</span>
                ${escapeHtml(linked.name)}
              </span>` : ''}
          </div>` : ''}
      </div>
      <span class="idea-chev">›</span>
    </div>
  `;
}

function renderComposer() {
  return `
    <form class="idea-composer" data-action="ideas-submit-composer">
      <input
        type="text"
        name="text"
        maxlength="500"
        placeholder="Apunta una idea…"
        autocomplete="off"
      />
      <button type="submit" class="idea-composer-add" aria-label="Añadir idea">＋</button>
    </form>
  `;
}

// ─── Render: pantalla completa "Ideas" ───────────────────────────────
// Se abre desde el botón "Ver todas". Implementación recomendada: una
// vista que sustituye temporalmente el contenido principal (similar al
// patrón de Recetas/Listas), NO un modal — porque queremos drag & drop
// y filtros.
export function renderIdeasScreen(el) {
  if (!el) return;
  const ideas = state.ideas || [];
  const filter = state.ideasFilter || 'todas';
  const filtered = filter === 'todas'
    ? ideas
    : ideas.filter(i => i.category === filter);

  el.innerHTML = `
    <div class="ideas-screen">
      <header class="ideas-screen-head">
        <button class="back-btn" data-action="ideas-close-full">‹</button>
        <h2>Ideas</h2>
      </header>

      <div class="ideas-screen-composer">${renderComposer()}</div>

      <div class="ideas-filters">
        <button class="ideas-filter ${filter === 'todas' ? 'active' : ''}"
                data-action="ideas-set-filter" data-filter="todas">
          Todas · ${ideas.length}
        </button>
        ${IDEA_CATEGORIES.map(c => {
          const n = ideas.filter(i => i.category === c.id).length;
          if (n === 0) return '';
          return `
            <button class="ideas-filter ${filter === c.id ? 'active' : ''}"
                    data-action="ideas-set-filter" data-filter="${c.id}">
              <span class="idea-cat-dot" style="background:${catColor(c.id)}"></span>
              ${c.label} · ${n}
            </button>`;
        }).join('')}
      </div>

      <div class="ideas-screen-list" data-sortable-root>
        ${filtered.map(i => renderDraggableIdea(i)).join('')}
      </div>

      <p class="ideas-screen-foot">
        Orden manual · arrastra <span style="color:var(--fg2)">⋮⋮</span> para reordenar
      </p>
    </div>
  `;
  initSortable(el.querySelector('[data-sortable-root]'));
}

function renderDraggableIdea(idea) {
  return `
    <div class="idea-row idea-row-drag" draggable="true"
         data-action="ideas-open-actions" data-id="${idea.id}">
      <span class="idea-grip" aria-hidden="true">⋮⋮</span>
      ${renderIdeaRow(idea).replace('<div class="idea-row"', '<div class="_inner"')}
    </div>
  `;
}

// ─── Event handlers (delegated) ──────────────────────────────────────
function handleIdeasClick(e) {
  const t = e.target.closest('[data-action]');
  if (!t) return;
  const action = t.dataset.action;
  const id = t.dataset.id;

  switch (action) {
    case 'ideas-open-actions':
      // No abrir el modal si el click fue sobre el chip de mini
      if (e.target.closest('[data-action="ideas-open-mini"]')) return;
      abrirIdeaModal(state.ideas.find(i => i.id === id));
      break;
    case 'ideas-open-full':
      openFullScreen();
      break;
    case 'ideas-close-full':
      closeFullScreen();
      break;
    case 'ideas-set-filter':
      state.ideasFilter = t.dataset.filter;
      renderIdeasScreen(document.querySelector('[data-ideas-screen]'));
      break;
    case 'ideas-open-mini':
      // Abrir detalle de mini vinculada (delega en el módulo de minis)
      import('./mini-modal.js').then(m => m.abrirMiniModal(id));
      break;
  }
}

function handleComposerSubmit(e) {
  if (e.target.dataset.action !== 'ideas-submit-composer') return;
  e.preventDefault();
  const input = e.target.querySelector('input[name="text"]');
  const text = (input.value || '').trim();
  if (!text) return;
  createIdea(text).then(() => {
    input.value = '';
    input.focus();
  });
}

function handleComposerEnter(e) {
  // Soporta Enter sin necesidad de tocar el botón
  if (e.key !== 'Enter') return;
  const form = e.target.closest('[data-action="ideas-submit-composer"]');
  if (!form) return;
  // El submit nativo ya dispara handleComposerSubmit
}

// ─── CRUD (cablear con Supabase) ─────────────────────────────────────
export async function createIdea(text, { category = null, mini_id = null } = {}) {
  try {
    const min = Math.min(0, ...(state.ideas || []).map(i => i.order_index));
    const optimistic = {
      id: `tmp-${Date.now()}`,
      text, category, mini_id,
      order_index: min - 1,
      status: 'open',
      created_at: new Date().toISOString(),
    };
    state.ideas = [optimistic, ...(state.ideas || [])];
    rerenderActive();

    // TODO_DB
    const { data, error } = await db
      .from('hobby_ideas')
      .insert({ text, category, mini_id, order_index: optimistic.order_index })
      .select()
      .single();
    if (error) throw error;

    state.ideas = state.ideas.map(i => i.id === optimistic.id ? data : i);
    rerenderActive();
  } catch (e) {
    state.ideas = (state.ideas || []).filter(i => !i.id.startsWith('tmp-'));
    rerenderActive();
    mostrarError('No se pudo crear la idea');
    console.error(e);
  }
}

export async function updateIdea(id, patch) {
  const prev = (state.ideas || []).find(i => i.id === id);
  if (!prev) return;
  state.ideas = state.ideas.map(i => i.id === id ? { ...i, ...patch } : i);
  rerenderActive();
  try {
    // TODO_DB
    const { error } = await db.from('hobby_ideas').update(patch).eq('id', id);
    if (error) throw error;
  } catch (e) {
    state.ideas = state.ideas.map(i => i.id === id ? prev : i);
    rerenderActive();
    mostrarError('No se pudo actualizar la idea');
    console.error(e);
  }
}

export async function deleteIdea(id) {
  const prev = state.ideas;
  state.ideas = state.ideas.filter(i => i.id !== id);
  rerenderActive();
  try {
    // TODO_DB
    const { error } = await db.from('hobby_ideas').delete().eq('id', id);
    if (error) throw error;
  } catch (e) {
    state.ideas = prev;
    rerenderActive();
    mostrarError('No se pudo eliminar la idea');
    console.error(e);
  }
}

export async function reorderIdeas(newOrderIds) {
  // newOrderIds: array de ids en el orden visible (de arriba a abajo)
  const map = new Map(newOrderIds.map((id, idx) => [id, idx]));
  state.ideas = (state.ideas || [])
    .map(i => ({ ...i, order_index: map.get(i.id) ?? i.order_index }))
    .sort((a, b) => a.order_index - b.order_index);
  rerenderActive();
  try {
    // Una sola query con UPSERT por id
    const rows = newOrderIds.map((id, idx) => ({ id, order_index: idx }));
    const { error } = await db.from('hobby_ideas').upsert(rows);
    if (error) throw error;
  } catch (e) {
    mostrarError('No se pudo guardar el orden');
    console.error(e);
    // Recarga para volver a un estado consistente
    await loadIdeas();
    rerenderActive();
  }
}

// Promociones: convertir una idea en sesión o proyecto
export async function promoteIdeaToSession(idea) {
  // Abrir el modal de "Iniciar sesión" prellenado con idea.text como nota.
  // Después de guardar la sesión, marcar la idea como status='promoted'.
  // (Se cablea en idea-modal.js → sessions.js)
}
export async function promoteIdeaToProject(idea) {
  // Igual con project-modal.js.
}

// ─── Helpers ─────────────────────────────────────────────────────────
function rerenderActive() {
  const widget = document.querySelector('[data-ideas-root]');
  if (widget) renderIdeasWidget(widget.parentElement);
  const screen = document.querySelector('[data-ideas-screen]');
  if (screen) renderIdeasScreen(screen);
}

function openFullScreen() {
  // Recomendación: monta un contenedor con [data-ideas-screen] que
  // tape el contenido de Home (similar al patrón de Recetas).
  // Si tienes router de tabs, considera ruta `home/ideas`.
}
function closeFullScreen() {
  // Quita el contenedor full-screen y vuelve a renderizar Home.
}

function initSortable(root) {
  // Implementación sugerida: HTML5 drag & drop nativo. Mantén
  // simple — al `dragend`, calcula el nuevo orden de ids y llama a
  // reorderIdeas(). Si tienes SortableJS en el bundle, úsalo, pero
  // no merece la pena añadir dep solo para esto.
}

function escapeHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

// ─── Entrypoint para home.js ─────────────────────────────────────────
// Llamar desde renderHome() pasando el elemento donde vive la columna
// derecha (la que ahora muestra "PLAN DE LA SEMANA" vacío).
export function mountIdeas(targetEl) {
  renderIdeasWidget(targetEl);
}
