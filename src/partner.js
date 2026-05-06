import { db } from './db.js'
import { invalidateMinis } from './state.js'
import { STATUSES } from './constants.js'
import { escapeHtml, compressImage } from './utils.js'
import { mostrarError, mostrarExito } from './toast.js'

const STATUS_LABEL  = Object.fromEntries(STATUSES.map(s => [s.value, s.label]))
const IN_PROGRESS   = ['pintando', 'imprimada', 'montada']

let _inProgress = []
let _wishlist   = []

export async function cargarPartner() {
  const container = document.getElementById('partner-content')
  if (!container) return
  container.innerHTML = '<div class="home-empty">Cargando…</div>'

  const [{ data: progress }, { data: wishlist }] = await Promise.all([
    db.from('minis')
      .select('id, name, status, photo_url, paint_progress')
      .in('status', IN_PROGRESS)
      .order('created_at', { ascending: false }),
    db.from('minis')
      .select('id, name, factions, notes, wishlist_priority, partner_bought')
      .eq('status', 'wishlist')
      .order('wishlist_priority', { ascending: false })
      .order('name')
  ])

  _inProgress = progress || []
  _wishlist   = wishlist || []

  _render(container)
  _bindEvents(container)
}

function _render(container) {
  container.innerHTML = _renderProgress() + _renderWishlist()
}

function _renderProgress() {
  if (!_inProgress.length) return `
    <div class="home-block">
      <div class="home-block-h"><span>// en proceso</span></div>
      <div class="home-empty-inline">Nada en proceso ahora mismo</div>
    </div>`

  return `
    <div class="home-block">
      <div class="home-block-h"><span>// en proceso · actualizar</span></div>
      <div class="partner-progress-list">
        ${_inProgress.map(m => `
          <div class="partner-mini-row" data-mini-id="${m.id}">
            ${m.photo_url
              ? `<img class="partner-mini-thumb" src="${m.photo_url}" alt="">`
              : `<div class="partner-mini-thumb partner-mini-thumb--empty"></div>`}
            <div class="partner-mini-info">
              <div class="partner-mini-name">${escapeHtml(m.name)}</div>
              <span class="badge badge-status ${m.status}">${STATUS_LABEL[m.status] || m.status}</span>
            </div>
            <div class="partner-mini-controls">
              <div class="partner-pct-wrap">
                <input type="number" class="partner-pct-input" min="0" max="100"
                       value="${m.paint_progress || 0}" data-mini-id="${m.id}">
                <span class="partner-pct-label">%</span>
              </div>
              <label class="partner-photo-label" for="partner-photo-${m.id}" title="Subir foto">
                📷
                <input type="file" id="partner-photo-${m.id}" accept="image/*"
                       class="partner-photo-input" data-mini-id="${m.id}" style="display:none">
              </label>
            </div>
          </div>`).join('')}
      </div>
    </div>`
}

function _renderWishlist() {
  const unbought = _wishlist.filter(m => !m.partner_bought)
  const bought   = _wishlist.filter(m => m.partner_bought)

  const renderItem = (m, isBought) => `
    <div class="partner-wish-row ${isBought ? 'partner-wish-row--bought' : ''}">
      <div class="partner-wish-info">
        <span class="partner-wish-name">${escapeHtml(m.name)}</span>
        ${m.notes ? `<span class="partner-wish-notes">${escapeHtml(m.notes)}</span>` : ''}
      </div>
      ${m.wishlist_priority > 0
        ? `<span class="partner-wish-priority">${'★'.repeat(Math.min(m.wishlist_priority, 3))}</span>`
        : ''}
      <button class="partner-bought-btn ${isBought ? 'partner-bought-btn--undo' : ''}"
              data-action="${isBought ? 'wish-unmark' : 'wish-bought'}"
              data-mini-id="${m.id}">
        ${isBought ? 'Deshacer' : 'Comprado ✓'}
      </button>
    </div>`

  return `
    <div class="home-block">
      <div class="home-block-h"><span>// wishlist · para regalos</span></div>
      ${unbought.length
        ? unbought.map(m => renderItem(m, false)).join('')
        : '<div class="home-empty-inline">Wishlist vacía o todo comprado 🎉</div>'}
      ${bought.length ? `
        <div class="partner-bought-section">
          <div class="partner-bought-header">// comprado</div>
          ${bought.map(m => renderItem(m, true)).join('')}
        </div>` : ''}
    </div>`
}

function _bindEvents(container) {
  if (container.dataset.bound === '1') return
  container.dataset.bound = '1'

  container.addEventListener('change', async e => {
    if (e.target.classList.contains('partner-pct-input')) {
      const val    = Math.min(100, Math.max(0, Number(e.target.value) || 0))
      e.target.value = val
      const miniId = Number(e.target.dataset.miniId)
      const patch  = val >= 100 ? { paint_progress: 100, status: 'pintada' } : { paint_progress: val }
      const { error } = await db.from('minis').update(patch).eq('id', miniId)
      if (error) { mostrarError('Error actualizando progreso'); return }
      invalidateMinis()
      if (val >= 100) {
        mostrarExito('¡Mini pintada! ✓')
        const idx = _inProgress.findIndex(x => x.id === miniId)
        if (idx >= 0) _inProgress.splice(idx, 1)
        _render(container)
      } else {
        const m = _inProgress.find(x => x.id === miniId)
        if (m) m.paint_progress = val
      }
    }

    if (e.target.classList.contains('partner-photo-input')) {
      const miniId     = Number(e.target.dataset.miniId)
      const file       = e.target.files[0]
      if (!file) return
      const compressed = await compressImage(file)
      const path       = `${miniId}_${Date.now()}.jpg`
      const { error: upErr } = await db.storage.from('mini-photos').upload(path, compressed)
      if (upErr) { mostrarError('Error subiendo foto'); return }
      const { data: { publicUrl } } = db.storage.from('mini-photos').getPublicUrl(path)
      const { error: dbErr } = await db.from('minis').update({ photo_url: publicUrl }).eq('id', miniId)
      if (dbErr) { mostrarError('Error guardando foto'); return }
      const row = container.querySelector(`.partner-mini-row[data-mini-id="${miniId}"]`)
      if (row) {
        let thumb = row.querySelector('.partner-mini-thumb')
        if (thumb.tagName === 'IMG') {
          thumb.src = publicUrl
        } else {
          const img = document.createElement('img')
          img.className = 'partner-mini-thumb'
          img.src = publicUrl
          thumb.replaceWith(img)
        }
      }
      const m = _inProgress.find(x => x.id === miniId)
      if (m) m.photo_url = publicUrl
      mostrarExito('Foto actualizada ✓')
      e.target.value = ''
    }
  })

  container.addEventListener('click', async e => {
    const btn = e.target.closest('[data-action]')
    if (!btn) return
    const action = btn.dataset.action
    if (action !== 'wish-bought' && action !== 'wish-unmark') return
    const miniId   = Number(btn.dataset.miniId)
    const isBought = action === 'wish-bought'
    const { error } = await db.from('minis').update({ partner_bought: isBought }).eq('id', miniId)
    if (error) { mostrarError('Error actualizando wishlist'); return }
    const m = _wishlist.find(x => x.id === miniId)
    if (m) m.partner_bought = isBought
    _render(container)
  })
}
