import { db } from './db.js'
import { state } from './state.js'

export async function cargarStats() {
  const container = document.getElementById('stats-content')
  container.innerHTML = '<div class="stats-empty">Cargando...</div>'

  const { data: minis, error } = await db.from('minis').select('name, factions, status, qty, models')
    .neq('status', 'wishlist')
  if (error || !minis) { container.innerHTML = '<div class="stats-empty">Error al cargar datos</div>'; return }

  let gTotalModelos = 0, gModelosPintados = 0
  for (const mini of minis) {
    const modelos = (mini.models != null ? mini.models : 1) * mini.qty
    gTotalModelos += modelos
    if (mini.status === 'pintada') gModelosPintados += modelos
  }
  const pctPintada = gTotalModelos ? Math.round(gModelosPintados / gTotalModelos * 100) : 0

  const factionStats = {}

  for (const mini of minis) {
    for (const faction of (mini.factions || [])) {
      const fc = state.factions.find(f => f.name === faction)
      if (!fc) continue

      if (!factionStats[faction]) {
        factionStats[faction] = {
          game_slug: fc.game_slug,
          counts: {},
          modelCounts: {},
          qty: 0,
          modelos: 0,
          modelosPintados: 0,
          points: 0,
          pointsPainted: 0,
          minis: []
        }
      }

      const s = factionStats[faction]
      const modelos = (mini.models != null ? mini.models : 1) * mini.qty

      s.counts[mini.status] = (s.counts[mini.status] || 0) + 1
      s.modelCounts[mini.status] = (s.modelCounts[mini.status] || 0) + modelos
      s.qty += mini.qty
      s.modelos += modelos
      if (mini.status === 'pintada') s.modelosPintados += modelos

      const pts = state.unitMap[`${mini.name}|${faction}|${fc.game_slug}`]
      if (pts) {
        s.points += pts * mini.qty
        if (mini.status === 'pintada') s.pointsPainted += pts * mini.qty
      }
      s.minis.push({ name: mini.name, status: mini.status, qty: mini.qty, models: mini.models || null, pts: pts || null })
    }
  }

  if (!Object.keys(factionStats).length) {
    container.innerHTML = '<div class="stats-empty">Aún no hay minis en la colección</div>'
    return
  }

  const statuses = ['comprada', 'montada', 'imprimada', 'pintando', 'pintada']
  const statusLabel = { comprada: 'Comprada', montada: 'Montada', imprimada: 'Imprimada', pintando: 'Pintando', pintada: 'Pintada' }

  const byGame = {}
  for (const [faction, s] of Object.entries(factionStats)) {
    if (!byGame[s.game_slug]) byGame[s.game_slug] = []
    byGame[s.game_slug].push({ faction, ...s })
  }

  const gameOrder = state.games.map(g => g.slug)
  const sortedGames = Object.keys(byGame).sort((a, b) => gameOrder.indexOf(a) - gameOrder.indexOf(b))

  const summaryHTML = `
    <div class="stats-summary">
      <div class="stats-summary-item">
        <span class="stats-summary-value">${gTotalModelos.toLocaleString()}</span>
        <span class="stats-summary-label">modelos</span>
      </div>
      <div class="stats-summary-item">
        <span class="stats-summary-value">${gModelosPintados.toLocaleString()}</span>
        <span class="stats-summary-label">pintados</span>
      </div>
      <div class="stats-summary-item">
        <span class="stats-summary-value stats-summary-pct">${pctPintada}%</span>
        <span class="stats-summary-label">pintado</span>
      </div>
    </div>
  `

  container.innerHTML = summaryHTML + sortedGames.map(gameSlug => {
    const gameName = state.games.find(g => g.slug === gameSlug)?.name || gameSlug
    const armies = byGame[gameSlug].sort((a, b) => a.faction.localeCompare(b.faction))

    const totalPts = armies.reduce((sum, a) => sum + a.points, 0)
    const totalPainted = armies.reduce((sum, a) => sum + a.pointsPainted, 0)

    return `
      <div class="stats-game-section">
        <div class="stats-game-title">
          <span class="badge badge-game-${gameSlug}">${gameName}</span>
          ${totalPts ? `<span class="stats-total">${totalPts.toLocaleString()} pts totales · ${totalPainted.toLocaleString()} pts pintados</span>` : ''}
        </div>
        ${armies.map((a, idx) => {
          const totalEntradas = Object.values(a.counts).reduce((s, v) => s + v, 0)
          const segs = statuses
            .filter(st => a.modelCounts[st])
            .map(st => `<div class="progress-seg ${st}" style="width:${(a.modelCounts[st] / a.modelos * 100).toFixed(1)}%"></div>`)
            .join('')

          const legend = statuses
            .filter(st => a.counts[st])
            .map(st => `<span class="stats-legend-item"><span class="legend-dot ${st}"></span>${a.counts[st]} ${statusLabel[st].toLowerCase()}</span>`)
            .join('')

          const sortedMinis = [...a.minis].sort((x, y) => {
            const si = statuses.indexOf(x.status) - statuses.indexOf(y.status)
            return si !== 0 ? si : x.name.localeCompare(y.name)
          })
          const miniRows = sortedMinis.map(m => `
            <div class="stats-mini-row">
              <span class="stats-mini-name">${m.name}${m.qty > 1 ? ` <span class="stats-mini-qty">×${m.qty}</span>` : ''}${m.models ? ` <span class="stats-mini-qty">(${m.models * m.qty} mod.)</span>` : ''}</span>
              <span class="stats-mini-right">
                ${m.pts ? `<span class="stats-mini-pts">${(m.pts * m.qty).toLocaleString()} pts</span>` : ''}
                <span class="badge badge-status ${m.status}">${statusLabel[m.status]}</span>
              </span>
            </div>
          `).join('')

          return `
            <details class="stats-army"${idx === 0 ? ' open' : ''}>
              <summary>
                <div>
                  <span class="stats-army-name">${a.faction}</span>
                  <span class="stats-army-meta">${totalEntradas} entrada${totalEntradas !== 1 ? 's' : ''} · ${a.modelos} modelo${a.modelos !== 1 ? 's' : ''} · ${a.modelosPintados} pintado${a.modelosPintados !== 1 ? 's' : ''}</span>
                </div>
                <div class="stats-army-summary-right">
                  ${a.points ? `<span class="stats-pts">${a.points.toLocaleString()} pts${a.pointsPainted ? ` · <span class="stats-pts-painted">${a.pointsPainted.toLocaleString()} pint.</span>` : ''}</span>` : ''}
                  <span class="stats-chevron">˅</span>
                </div>
              </summary>
              <div class="progress-bar">${segs}</div>
              <div class="stats-legend">${legend}</div>
              <div class="stats-army-minis">${miniRows}</div>
            </details>
          `
        }).join('')}
      </div>
    `
  }).join('')
}
