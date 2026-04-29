/**
 * Motor de recomendaciones de hobby — función pura, sin efectos laterales.
 * Devuelve máximo 2 recomendaciones: 1 primaria + 1 secundaria opcional.
 *
 * Prioridades:
 * 1. Terminar  — minis con progreso >= 70%
 * 2. Continuar — imprimada o pintando
 * 3. Revisar montaje — riesgo alto en fase temprana
 * 4. Montar    — backlog comprada
 *
 * Reglas:
 * - Nunca recomendar minis de proyectos activos (ya aparecen arriba)
 * - Nunca recomendar minis ya pintadas
 * - Máximo 1 recomendación por tipo de acción
 * - Máximo 2 recomendaciones en total
 */

export function getRecommendations(minis, projects) {
  const seenMiniIds  = new Set()
  const seenActions  = new Set()
  const recs         = []

  const activeProjMiniIds = new Set(
    projects
      .filter(p => p.status === 'activo')
      .flatMap(p => (p.project_minis || []).map(pm => Number(pm.mini_id)))
  )

  const eligible = minis.filter(m =>
    m.status !== 'wishlist' &&
    m.status !== 'pintada' &&
    !activeProjMiniIds.has(m.id)
  )

  function tryAdd(mini, action, title, subtitle) {
    if (recs.length >= 2)           return false
    if (seenMiniIds.has(mini.id))   return false
    if (seenActions.has(action))    return false
    seenMiniIds.add(mini.id)
    seenActions.add(action)
    recs.push({
      type: 'mini',
      id: mini.id,
      title,
      subtitle,
      progress: mini.paint_progress || null,
      action,
    })
    return true
  }

  // ── 1. Terminar (>= 70%) ──────────────────────────────────────────────────
  const byProgress = [...eligible].sort((a, b) => (b.paint_progress || 0) - (a.paint_progress || 0))
  for (const m of byProgress) {
    if ((m.paint_progress || 0) < 70) break
    if (tryAdd(m, 'finish', `Termina ${m.name}`, `Al ${m.paint_progress}%, queda poco.`)) break
  }

  // ── 2. Continuar (imprimada o pintando) ───────────────────────────────────
  for (const m of eligible) {
    if (m.status === 'imprimada' || m.status === 'pintando') {
      if (tryAdd(m, 'continue', `Continúa con ${m.name}`, 'Lista para pintar.')) break
    }
  }

  // ── 3. Revisar montaje (assembly risk alto, fase temprana) ────────────────
  for (const m of eligible) {
    if (m.assembly_risk === 'high' && (m.status === 'comprada' || m.status === 'montada')) {
      if (tryAdd(m, 'review_before_gluing', `Revisa el montaje de ${m.name}`, 'Riesgo de recovecos difíciles de alcanzar después.')) break
    }
  }

  // ── 4. Montar (backlog) ───────────────────────────────────────────────────
  for (const m of eligible) {
    if (m.status === 'comprada') {
      if (tryAdd(m, 'assemble', `Monta ${m.name}`, 'Primer paso para desbloquear pintura.')) break
    }
  }

  return recs
}

/**
 * Determina el tipo de empty state:
 * 'all_painted' | 'only_wishlist' | 'empty' | null (hay recomendaciones)
 */
export function getEmptyState(minis) {
  if (!minis.length) return 'empty'
  const nonWishlist = minis.filter(m => m.status !== 'wishlist')
  if (!nonWishlist.length) return 'only_wishlist'
  if (nonWishlist.every(m => m.status === 'pintada')) return 'all_painted'
  return null
}
