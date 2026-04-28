/**
 * Motor de recomendaciones de hobby — función pura, sin efectos laterales.
 * Recibe los datos ya cargados y devuelve máximo 3 recomendaciones priorizadas.
 *
 * Prioridades:
 * 1. Assembly risk alto (solo comprada/montada)
 * 2. Proyectos activos con minis pendientes
 * 3. Minis casi terminadas (>= 70%)
 * 4. Minis imprimadas o en pintura
 * 5. Minis compradas (backlog de montaje)
 *
 * Reglas PM:
 * - Nunca recomendar minis ya pintadas
 * - Nunca duplicar una mini en el resultado
 * - Excluir minis que pertenezcan a proyectos activos de las recomendaciones individuales
 * - Max 3 resultados
 */

const MAX_RECS = 3

const ACTION_REASONS = {
  review_before_gluing: 'Evita recovecos y manchas antes de avanzar.',
  continue:             'Buen punto de entrada, no necesita preparación extra.',
  finish:               'Cerrar una mini da impulso para el resto.',
  assemble:             'Montar es un primer paso sin necesitar mucho tiempo.',
  prime:                'Lista para imprimar y empezar a pintar.',
  paint_accessible_parts: 'Pinta lo que puedes alcanzar ahora, el resto después.',
}

export function getRecommendations(minis, projects) {
  const recs = []
  const seenMiniIds = new Set()

  // IDs de minis en proyectos activos — excluidas de recomendaciones individuales
  const activeProjMiniIds = new Set(
    projects
      .filter(p => p.status === 'activo')
      .flatMap(p => (p.project_minis || []).map(pm => Number(pm.mini_id)))
  )

  // Minis elegibles: no wishlist, no pintadas
  const eligible = minis.filter(m => m.status !== 'wishlist' && m.status !== 'pintada')

  // ── Prioridad 1: Assembly risk alto, solo en fases tempranas ──────────────
  for (const m of eligible) {
    if (recs.length >= MAX_RECS) break
    if (seenMiniIds.has(m.id) || activeProjMiniIds.has(m.id)) continue
    if (m.assembly_risk === 'high' && (m.status === 'comprada' || m.status === 'montada')) {
      seenMiniIds.add(m.id)
      recs.push({
        type: 'mini',
        id: m.id,
        title: `Revisa el montaje de ${m.name}`,
        subtitle: 'Puede tener zonas difíciles de pintar si está totalmente montada.',
        progress: m.paint_progress || null,
        action: 'review_before_gluing',
        reason: ACTION_REASONS.review_before_gluing,
      })
    }
  }

  // ── Prioridad 2: Proyectos activos ────────────────────────────────────────
  const projStats = projects
    .filter(p => p.status === 'activo')
    .map(p => {
      const projMinis = (p.project_minis || [])
        .map(pm => minis.find(m => m.id === Number(pm.mini_id)))
        .filter(Boolean)
      const unpainted = projMinis.filter(m => m.status !== 'pintada')
      const avgProgress = projMinis.length
        ? Math.round(projMinis.reduce((s, m) => s + (m.paint_progress || 0), 0) / projMinis.length)
        : 0
      return { project: p, remaining: unpainted.length, avgProgress }
    })
    .filter(ps => ps.remaining > 0)
    .sort((a, b) => a.remaining - b.remaining || b.avgProgress - a.avgProgress)

  for (const { project, remaining, avgProgress } of projStats) {
    if (recs.length >= MAX_RECS) break
    recs.push({
      type: 'project',
      id: project.id,
      title: `Avanza en ${project.name}`,
      subtitle: `${remaining} mini${remaining !== 1 ? 's' : ''} pendiente${remaining !== 1 ? 's' : ''} en este proyecto.`,
      progress: avgProgress,
      action: 'continue',
      reason: ACTION_REASONS.continue,
    })
  }

  // ── Prioridad 3: Casi terminadas (>= 70%) ─────────────────────────────────
  const byProgress = [...eligible].sort((a, b) => (b.paint_progress || 0) - (a.paint_progress || 0))
  for (const m of byProgress) {
    if (recs.length >= MAX_RECS) break
    if (seenMiniIds.has(m.id) || activeProjMiniIds.has(m.id)) continue
    if ((m.paint_progress || 0) >= 70) {
      seenMiniIds.add(m.id)
      recs.push({
        type: 'mini',
        id: m.id,
        title: `Termina ${m.name}`,
        subtitle: `Está al ${m.paint_progress}%, puede ser una victoria rápida.`,
        progress: m.paint_progress,
        action: 'finish',
        reason: ACTION_REASONS.finish,
      })
    }
  }

  // ── Prioridad 4: Imprimada o en pintura ───────────────────────────────────
  for (const m of eligible) {
    if (recs.length >= MAX_RECS) break
    if (seenMiniIds.has(m.id) || activeProjMiniIds.has(m.id)) continue
    if (m.status === 'imprimada' || m.status === 'pintando') {
      seenMiniIds.add(m.id)
      recs.push({
        type: 'mini',
        id: m.id,
        title: `Continúa con ${m.name}`,
        subtitle: 'Ya está lista para avanzar sin preparar demasiado.',
        progress: m.paint_progress || null,
        action: 'continue',
        reason: ACTION_REASONS.continue,
      })
    }
  }

  // ── Prioridad 5: Backlog de montaje (comprada) ────────────────────────────
  for (const m of eligible) {
    if (recs.length >= MAX_RECS) break
    if (seenMiniIds.has(m.id) || activeProjMiniIds.has(m.id)) continue
    if (m.status === 'comprada') {
      seenMiniIds.add(m.id)
      recs.push({
        type: 'mini',
        id: m.id,
        title: `Monta ${m.name}`,
        subtitle: 'Paso pequeño para desbloquear pintura más adelante.',
        progress: null,
        action: 'assemble',
        reason: ACTION_REASONS.assemble,
      })
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
