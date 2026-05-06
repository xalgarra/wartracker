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
