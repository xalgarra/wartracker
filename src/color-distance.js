// Distancia cromática perceptual (CIE Lab Δ E76).
// Útil para "qué pintura de mi rack se parece más a este color".
// Δ E < 1: indistinguible · 1-2: muy similar · 2-10: similar · 10-50: notable · >50: distinto

export function hexToRgb(hex) {
  if (!hex) return null
  const h = String(hex).replace('#', '').trim()
  if (h.length !== 6) return null
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  if ([r, g, b].some(v => Number.isNaN(v))) return null
  return { r, g, b }
}

function linearize(c) {
  const v = c / 255
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
}

export function rgbToLab({ r, g, b }) {
  const lr = linearize(r), lg = linearize(g), lb = linearize(b)
  // sRGB linear → XYZ (D65)
  const x = lr * 0.4124564 + lg * 0.3575761 + lb * 0.1804375
  const y = lr * 0.2126729 + lg * 0.7151522 + lb * 0.0721750
  const z = lr * 0.0193339 + lg * 0.1191920 + lb * 0.9503041
  // XYZ → Lab (referencia D65)
  const f = t => t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116
  const fx = f(x / 0.95047), fy = f(y / 1.0), fz = f(z / 1.08883)
  return { L: 116 * fy - 16, a: 500 * (fx - fy), bb: 200 * (fy - fz) }
}

export function hexToLab(hex) {
  const rgb = hexToRgb(hex)
  return rgb ? rgbToLab(rgb) : null
}

export function deltaE(lab1, lab2) {
  if (!lab1 || !lab2) return Infinity
  const dL = lab1.L - lab2.L
  const da = lab1.a - lab2.a
  const db = lab1.bb - lab2.bb
  return Math.sqrt(dL * dL + da * da + db * db)
}

// Devuelve [{ brand, name, hex, type, distance, similarity }] del catálogo completo,
// excluyendo la marca de referencia.
export function nearestCatalogPaints(targetHex, brandCatalogs, excludeBrand, limit = 5) {
  const targetLab = hexToLab(targetHex)
  if (!targetLab) return []

  const results = []
  for (const [brand, catalog] of Object.entries(brandCatalogs)) {
    if (brand === excludeBrand) continue
    for (const p of catalog) {
      if (!p.hex) continue
      const d = deltaE(targetLab, hexToLab(p.hex))
      results.push({ brand, name: p.name, hex: p.hex, type: p.type, distance: d,
        similarity: Math.max(0, Math.round(100 - d * 1.25)) })
    }
  }
  return results.sort((a, b) => a.distance - b.distance).slice(0, limit)
}

// Agrupa pinturas del inventario por similitud de color (ΔE < threshold).
// Devuelve grupos de 2+ pinturas ordenados por tamaño descendente.
export function findOverlaps(paints, threshold = 8) {
  const valid = paints.filter(p => p.color_hex)
  const labs  = valid.map(p => hexToLab(p.color_hex))
  const n     = valid.length

  // Union-Find
  const parent = valid.map((_, i) => i)
  function find(i) { return parent[i] === i ? i : (parent[i] = find(parent[i])) }
  function union(i, j) { parent[find(i)] = find(j) }

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (deltaE(labs[i], labs[j]) < threshold) union(i, j)
    }
  }

  const groups = {}
  for (let i = 0; i < n; i++) {
    const root = find(i)
    if (!groups[root]) groups[root] = []
    groups[root].push(valid[i])
  }

  return Object.values(groups)
    .filter(g => g.length >= 2)
    .sort((a, b) => b.length - a.length)
}

// Devuelve [{ paint, distance, similarity }] ordenado por mayor similitud.
// similarity ∈ [0, 100] aprox: 100 = idéntico, ~0 cuando Δ E ≥ 80.
export function nearestPaints(targetHex, paints, opts = {}) {
  const { limit = 8, onlyInStock = false, excludeId = null } = opts
  const targetLab = hexToLab(targetHex)
  if (!targetLab) return []

  return paints
    .filter(p => p.color_hex)
    .filter(p => !onlyInStock || p.in_stock)
    .filter(p => excludeId == null || p.id !== excludeId)
    .map(p => {
      const d = deltaE(targetLab, hexToLab(p.color_hex))
      return {
        paint: p,
        distance: d,
        similarity: Math.max(0, Math.round(100 - (d * 1.25))),
      }
    })
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit)
}
