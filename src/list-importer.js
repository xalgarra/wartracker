import { db } from './db.js'
import { state, ensureMinisFull } from './state.js'
import { mostrarError, mostrarExito } from './toast.js'
import { escapeHtml } from './utils.js'
import { cargarLists } from './lists.js'

let _parsedRows = []  // [{ raw, name, qty, miniId, miniName, include }, ...]

// ---------------------------------------------------------------------------
// Apertura / cierre
// ---------------------------------------------------------------------------

export function abrirListImporter() {
  const gameSelect = document.getElementById('list-import-game')
  gameSelect.innerHTML = '<option value="">Selecciona juego…</option>' +
    state.games.map(g => `<option value="${g.slug}">${escapeHtml(g.name)}</option>`).join('')

  document.getElementById('list-import-faction').innerHTML = '<option value="">— Selecciona facción —</option>'
  document.getElementById('list-import-faction').disabled = true
  document.getElementById('list-import-name').value = ''
  document.getElementById('list-import-target').value = ''
  document.getElementById('list-import-text').value = ''
  document.getElementById('list-import-preview').innerHTML = ''

  const saveBtn = document.getElementById('btn-list-import-save')
  saveBtn.disabled = true
  saveBtn.textContent = 'Crear lista'
  _parsedRows = []

  document.getElementById('modal-list-import-bg').classList.add('open')
}

export function cerrarListImporter() {
  document.getElementById('modal-list-import-bg').classList.remove('open')
  _parsedRows = []
}

// ---------------------------------------------------------------------------
// Selects dependientes
// ---------------------------------------------------------------------------

export function onImportGameChange() {
  const slug = document.getElementById('list-import-game').value
  const sel = document.getElementById('list-import-faction')
  if (!slug) {
    sel.innerHTML = '<option value="">— Selecciona facción —</option>'
    sel.disabled = true
    return
  }
  const factions = state.factions
    .filter(f => f.game_slug === slug)
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))
  sel.innerHTML = '<option value="">— Selecciona facción —</option>' +
    factions.map(f => `<option value="${escapeHtml(f.name)}">${escapeHtml(f.name)}</option>`).join('')
  sel.disabled = false
}

// ---------------------------------------------------------------------------
// Parseo + matching
// ---------------------------------------------------------------------------

export async function onImportProcess() {
  const game    = document.getElementById('list-import-game').value
  const faction = document.getElementById('list-import-faction').value
  const text    = document.getElementById('list-import-text').value

  if (!game || !faction) { mostrarError('Selecciona juego y facción'); return }
  if (!text.trim())      { mostrarError('Pega el texto de la lista'); return }

  const candidates = parseText(text)
  if (!candidates.length) { mostrarError('No se detectaron unidades en el texto'); return }

  await ensureMinisFull()
  const minisFaccion = (state.minisFull || []).filter(m => (m.factions || []).includes(faction))

  _parsedRows = candidates.map(c => {
    const norm = normalize(c.name)
    let match = minisFaccion.find(m => normalize(m.name) === norm)
    if (!match) match = minisFaccion.find(m => normalize(m.name).includes(norm) || norm.includes(normalize(m.name)))
    return {
      ...c,
      miniId:   match?.id || null,
      miniName: match?.name || null,
      include:  !!match,
    }
  })

  renderPreview()
  updateSaveLabel()
}

function renderPreview() {
  const owned   = _parsedRows.map((r, i) => ({ ...r, idx: i })).filter(r => r.miniId)
  const missing = _parsedRows.filter(r => !r.miniId)

  const ownedHtml = owned.length
    ? owned.map(r => `
        <label class="list-import-row">
          <input type="checkbox" ${r.include ? 'checked' : ''} data-action="toggle-row" data-idx="${r.idx}">
          <span class="list-import-row-qty">×${r.qty}</span>
          <span class="list-import-row-name">${escapeHtml(r.miniName)}</span>
          <span class="list-import-row-from">de "${escapeHtml(r.raw)}"</span>
        </label>
      `).join('')
    : '<div class="list-import-empty">Ninguna unidad coincide con tu colección</div>'

  const missingHtml = missing.length
    ? `<div class="list-import-missing-title">No tienes en colección (se omitirán):</div>` +
      missing.map(r => `<div class="list-import-missing-row">${escapeHtml(r.raw)}</div>`).join('')
    : ''

  document.getElementById('list-import-preview').innerHTML = `
    <div class="list-import-section">
      <div class="list-import-section-title">${owned.length} unidad${owned.length !== 1 ? 'es' : ''} reconocida${owned.length !== 1 ? 's' : ''}</div>
      ${ownedHtml}
    </div>
    ${missingHtml ? `<div class="list-import-section list-import-missing">${missingHtml}</div>` : ''}
  `
}

export function onPreviewToggle(idx) {
  const row = _parsedRows[idx]
  if (!row) return
  row.include = !row.include
  updateSaveLabel()
}

export function updateSaveLabel() {
  const n = _parsedRows.filter(r => r.miniId && r.include).length
  const btn = document.getElementById('btn-list-import-save')
  if (!btn) return
  btn.textContent = n > 0 ? `Crear lista con ${n} unidad${n !== 1 ? 'es' : ''}` : 'Crear lista'
  const nameOk = !!document.getElementById('list-import-name').value.trim()
  btn.disabled = n === 0 || !nameOk
}

// ---------------------------------------------------------------------------
// Guardar
// ---------------------------------------------------------------------------

export async function guardarListaImportada() {
  const name      = document.getElementById('list-import-name').value.trim()
  const game      = document.getElementById('list-import-game').value
  const faction   = document.getElementById('list-import-faction').value
  const targetVal = document.getElementById('list-import-target').value
  if (!name)              { mostrarError('Escribe un nombre'); return }
  if (!game || !faction)  { mostrarError('Selecciona juego y facción'); return }

  const selected = _parsedRows.filter(r => r.miniId && r.include)
  if (!selected.length) { mostrarError('No hay unidades para añadir'); return }

  const btn = document.getElementById('btn-list-import-save')
  btn.disabled = true

  try {
    const { data: { user } } = await db.auth.getUser()
    const { data: list, error } = await db.from('army_lists')
      .insert({
        name,
        game,
        faction,
        target_points: targetVal ? parseInt(targetVal, 10) : null,
        user_id: user.id,
      })
      .select('id').single()
    if (error) throw error

    const rows = selected.map(r => ({
      list_id: list.id,
      mini_id: r.miniId,
      qty:     r.qty,
      user_id: user.id,
    }))
    const { error: insertError } = await db.from('army_list_units').insert(rows)
    if (insertError) throw insertError

    mostrarExito(`Lista creada con ${selected.length} unidad${selected.length !== 1 ? 'es' : ''}`)
    cerrarListImporter()
    await cargarLists()
  } catch (e) {
    mostrarError('Error guardando lista: ' + (e?.message || ''))
    btn.disabled = false
  }
}

// ---------------------------------------------------------------------------
// Helpers de parseo
// ---------------------------------------------------------------------------

export function normalize(s) {
  return String(s || '').toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ').trim()
}

export function parseText(text) {
  const lines = text.split(/[\r\n]+/).map(l => l.trim()).filter(Boolean)
  const out = []
  for (const line of lines) {
    // Saltar cabeceras y totales típicos de exports
    if (/^[+]+\s/.test(line)) continue
    if (/^[A-Z][A-Z\s]+:?$/.test(line) && line.length < 30) continue
    if (/total/i.test(line) && /\d/.test(line)) continue

    // Quitar costes en paréntesis/corchetes y bullets
    let cleaned = line
      .replace(/\(\s*\d+\s*pts?\s*\)/gi, '')
      .replace(/\(\s*\d+\s*\)/g, '')
      .replace(/\[\s*\d+\s*pts?\s*\]/gi, '')
      .replace(/\[\s*\d+\s*\]/g, '')
      .replace(/\d+\s*pts?\s*$/i, '')
      .replace(/^[\s•·\-+*●▪]+/, '')
      .replace(/^\d+\.\s*/, '')
      .trim()
    if (cleaned.length < 2) continue

    // Patrones: "5x Boyz", "Boyz x5", "5 Boyz"
    let qty = 1, name = cleaned
    let m
    if ((m = cleaned.match(/^(\d+)\s*[x×]\s*(.+)/i)))      { qty = +m[1]; name = m[2] }
    else if ((m = cleaned.match(/^(.+?)\s*[x×]\s*(\d+)\s*$/i))) { qty = +m[2]; name = m[1] }
    else if ((m = cleaned.match(/^(\d+)\s+(.+)/)))         { qty = +m[1]; name = m[2] }

    name = name.replace(/[,;:].*$/, '').trim()
    if (name.length < 2) continue
    out.push({ raw: line, name, qty })
  }
  return out
}
