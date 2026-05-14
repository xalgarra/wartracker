import { db } from './db.js'
import { state, loadMiniPaints } from './state.js'
import { mostrarError } from './toast.js'

// ─── Pure helpers (exported for tests) ──────────────────────────────────────

export function mergePaintList(existing, additions) {
  const seen = new Set(existing.map(p => p.id))
  return [...existing, ...additions.filter(p => !seen.has(p.id))]
}

export function recipeFreshPaints(recipePaints, existingPaints) {
  const existingIds = new Set(existingPaints.map(p => p.id))
  return recipePaints.filter(p => !existingIds.has(p.id))
}

// ─── DB operations ───────────────────────────────────────────────────────────

export async function addMiniPaints(miniId, paintIds) {
  if (!paintIds.length) return
  const rows = paintIds.map(paint_id => ({ mini_id: miniId, paint_id }))
  const { error } = await db.from('mini_paints').upsert(rows, { onConflict: 'mini_id,paint_id' })
  if (error) { mostrarError('No se pudieron añadir las pinturas'); return }
  await loadMiniPaints(miniId)
  const { rerenderMiniDetail } = await import('./mini-detail.js')
  rerenderMiniDetail(miniId)
}

export async function removeMiniPaint(miniId, paintId) {
  const { error } = await db
    .from('mini_paints')
    .delete()
    .eq('mini_id', miniId)
    .eq('paint_id', paintId)
  if (error) { mostrarError('No se pudo quitar la pintura'); return }
  await loadMiniPaints(miniId)
  const { rerenderMiniDetail } = await import('./mini-detail.js')
  rerenderMiniDetail(miniId)
}

export async function applyRecipeToMini(miniId, recipeId) {
  const { data: rps, error } = await db
    .from('recipe_paints')
    .select('paint_id')
    .eq('recipe_id', recipeId)
  if (error) { mostrarError('No se pudo cargar la receta'); return }
  await addMiniPaints(miniId, rps.map(r => r.paint_id))
}
