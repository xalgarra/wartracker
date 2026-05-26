// =====================================================================
// idea-modal.js — Modal para acciones sobre una idea: editar, vincular
// a mini, promover (sesión/proyecto), eliminar.
//
// Sigue el patrón de los modales existentes (mini-modal, paint-modal):
//   - Una función `abrirIdeaModal(idea)` exportada
//   - El modal vive en un overlay con [data-modal-root]
//   - Cerrar con ESC, click en backdrop o botón ✕
//
// Este archivo es esqueleto. Cablea las acciones con ideas.js.
// =====================================================================

import { IDEA_CATEGORIES, catColor, catLabel, updateIdea, deleteIdea,
         promoteIdeaToSession, promoteIdeaToProject } from './ideas.js';
import { state } from './state.js';
import { mostrarError } from './toast.js';

let mode = 'view'; // 'view' | 'edit' | 'link'
let current = null;

export function abrirIdeaModal(idea) {
  if (!idea) return;
  current = idea;
  mode = 'view';
  renderModal();
}

function cerrar() {
  current = null;
  document.querySelector('[data-idea-modal-root]')?.remove();
  document.removeEventListener('keydown', onEsc);
}

function onEsc(e) { if (e.key === 'Escape') cerrar(); }

function renderModal() {
  // Quitar anterior si existe
  document.querySelector('[data-idea-modal-root]')?.remove();
  if (!current) return;

  const root = document.createElement('div');
  root.className = 'idea-modal-backdrop';
  root.setAttribute('data-idea-modal-root', '');

  root.innerHTML = `
    <div class="idea-modal" role="dialog" aria-modal="true">
      <button class="idea-modal-close" data-action="idea-modal-close">✕</button>
      ${mode === 'view' ? viewBody() : ''}
      ${mode === 'edit' ? editBody() : ''}
      ${mode === 'link' ? linkBody() : ''}
    </div>
  `;

  document.body.appendChild(root);
  document.addEventListener('keydown', onEsc);

  root.addEventListener('click', (e) => {
    if (e.target === root) return cerrar();
    handleAction(e);
  });
  root.addEventListener('submit', handleSubmit);
}

// ─── Vista "actions" ────────────────────────────────────────────────
function viewBody() {
  const linkedMini = current.mini_id
    ? state.minis?.find(m => m.id === current.mini_id)
    : null;
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
        <span class="idea-action-name">
          ${linkedMini ? 'Cambiar mini vinculada' : 'Vincular a una mini'}
        </span>
        <span class="idea-action-desc">
          ${linkedMini ? escapeHtml(linkedMini.name) : 'Conecta con colección o wishlist'}
        </span>
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

    <button class="idea-action danger" data-action="idea-delete">
      <span class="idea-action-glyph">🗑</span>
      <span class="idea-action-body">
        <span class="idea-action-name">Eliminar</span>
        <span class="idea-action-desc">La idea se borra de la lista</span>
      </span>
    </button>
  `;
}

// ─── Vista "edit" ───────────────────────────────────────────────────
function editBody() {
  return `
    <form data-action="idea-save-edit">
      <header class="idea-modal-head">
        <div class="idea-modal-title">Editar idea</div>
        <div class="idea-modal-sub">Texto libre y categoría opcional</div>
      </header>

      <textarea name="text" rows="3" maxlength="500" autofocus
                class="idea-edit-input">${escapeHtml(current.text)}</textarea>

      <div class="idea-edit-label">Categoría</div>
      <div class="idea-cat-row">
        <button type="button" class="idea-cat-pick ${!current.category ? 'active' : ''}"
                data-action="idea-cat-pick" data-cat="">Ninguna</button>
        ${IDEA_CATEGORIES.map(c => `
          <button type="button"
                  class="idea-cat-pick ${current.category === c.id ? 'active' : ''}"
                  data-action="idea-cat-pick" data-cat="${c.id}">
            <span class="idea-cat-dot" style="background:${catColor(c.id)}"></span>
            ${c.label}
          </button>`).join('')}
      </div>

      <button type="submit" class="primary-btn">Guardar cambios</button>
      <button type="button" class="link-btn" data-action="idea-cancel-edit">Cancelar</button>
    </form>
  `;
}

// ─── Vista "link" ───────────────────────────────────────────────────
function linkBody() {
  const minis = [...(state.minis || [])]; // incluye wishlist (mismo schema)
  return `
    <header class="idea-modal-head">
      <div class="idea-modal-title">Vincular a mini</div>
      <div class="idea-modal-sub">De tu colección o wishlist</div>
    </header>

    <div class="idea-link-search">
      <input type="text" placeholder="Be'lakor, Intercessors…"
             data-action="idea-link-filter" autofocus />
    </div>

    ${current.mini_id ? `
      <button class="link-btn danger" data-action="idea-link-clear">
        × Quitar vínculo actual
      </button>` : ''}

    <div class="idea-link-results" data-idea-link-results>
      ${minis.map(m => renderMiniOption(m)).join('')}
    </div>

    <button type="button" class="link-btn" data-action="idea-back-view">← Volver</button>
  `;
}

function renderMiniOption(m) {
  const isCurrent = current.mini_id === m.id;
  return `
    <button class="idea-link-result" data-action="idea-link-pick" data-mini="${m.id}">
      <div class="idea-link-result-body">
        <div class="idea-link-result-name">
          ${escapeHtml(m.name)}
          ${isCurrent ? '<span class="ok-tick">✓ vinculada</span>' : ''}
        </div>
        <div class="idea-link-result-meta">
          ${escapeHtml(m.faction)} · ${m.wishlist ? 'wishlist' : 'colección'}
        </div>
      </div>
    </button>
  `;
}

// ─── Acciones (delegated) ───────────────────────────────────────────
async function handleAction(e) {
  const t = e.target.closest('[data-action]');
  if (!t) return;
  const a = t.dataset.action;

  switch (a) {
    case 'idea-modal-close': cerrar(); break;
    case 'idea-edit':        mode = 'edit'; renderModal(); break;
    case 'idea-cancel-edit': mode = 'view'; renderModal(); break;
    case 'idea-link':        mode = 'link'; renderModal(); break;
    case 'idea-back-view':   mode = 'view'; renderModal(); break;

    case 'idea-cat-pick':
      current = { ...current, category: t.dataset.cat || null };
      renderModal();
      break;

    case 'idea-link-pick':
      await updateIdea(current.id, { mini_id: t.dataset.mini });
      cerrar();
      break;
    case 'idea-link-clear':
      await updateIdea(current.id, { mini_id: null });
      cerrar();
      break;
    case 'idea-link-filter':
      // filtrado client-side; reimprime resultados con state.minis filtradas
      break;

    case 'idea-promote-session':
      await promoteIdeaToSession(current);
      cerrar();
      break;
    case 'idea-promote-project':
      await promoteIdeaToProject(current);
      cerrar();
      break;
    case 'idea-delete':
      if (!confirm('¿Eliminar esta idea?')) return;
      await deleteIdea(current.id);
      cerrar();
      break;
  }
}

async function handleSubmit(e) {
  if (e.target.dataset.action !== 'idea-save-edit') return;
  e.preventDefault();
  const text = e.target.querySelector('textarea[name="text"]').value.trim();
  if (!text) return mostrarError('La idea no puede estar vacía');
  await updateIdea(current.id, { text, category: current.category || null });
  cerrar();
}

function escapeHtml(s) {
  return String(s)
    .replaceAll('&','&amp;').replaceAll('<','&lt;')
    .replaceAll('>','&gt;').replaceAll('"','&quot;');
}
