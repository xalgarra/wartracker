/**
 * paint-sort.js
 * Ordenación visual de pinturas (Citadel / Vallejo / Army Painter) por color.
 *
 * Por qué ordenar solo por hue no funciona:
 *   · El hue de colores muy oscuros (L < 0.12) es inestable y matemáticamente
 *     arbitrario — Abaddon Black puede tener hue 0° o 200°.
 *   · Los grises tienen hue = 0 por defecto y acaban entre los rojos.
 *   · Un azul marino oscuro y un celeste tienen el mismo hue pero son mundos
 *     distintos; sin ponderar L el resultado visual es caótico.
 *   · Los marrones son naranjas desaturados: el hue los manda a la zona
 *     naranja/roja mezclados con colores vivos.
 *   · Los vinos/burgundy tienen hue ~330–350°, igual que los rosas brillantes.
 */

// ─── hexToHSL ────────────────────────────────────────────────────────────────

/**
 * Convierte HEX (#RRGGBB o #RGB) a HSL.
 *
 * @param {string|null|undefined} hex
 * @returns {{ h: number, s: number, l: number } | null}
 *   h ∈ [0, 360)  ·  s ∈ [0, 1]  ·  l ∈ [0, 1]
 */
export function hexToHSL(hex) {
  if (!hex || typeof hex !== 'string') return null

  let raw = hex.trim().replace(/^#/, '')
  if (raw.length === 3) raw = raw.split('').map(c => c + c).join('')
  if (raw.length !== 6 || !/^[0-9a-fA-F]{6}$/.test(raw)) return null

  const r = parseInt(raw.slice(0, 2), 16) / 255
  const g = parseInt(raw.slice(2, 4), 16) / 255
  const b = parseInt(raw.slice(4, 6), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l   = (max + min) / 2

  if (max === min) return { h: 0, s: 0, l }

  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

  let h
  switch (max) {
    case r:  h = (g - b) / d + (g < b ? 6 : 0); break
    case g:  h = (b - r) / d + 2;                break
    default: h = (r - g) / d + 4
  }

  return { h: (h / 6) * 360, s, l }
}

// ─── Buckets ──────────────────────────────────────────────────────────────────

const BUCKET_ORDER = [
  'black', 'gray', 'white',
  'brown',
  'red', 'orange', 'yellow', 'green', 'teal', 'blue', 'purple', 'pink',
]

/**
 * Clasifica un color HSL en uno de los 12 buckets visuales.
 * Todos los umbrales están aquí — ajusta este fichero si el resultado
 * no convence para alguna gama de pinturas.
 *
 * Orden de prioridad (importa: las reglas anteriores tienen precedencia):
 *   1. Negro:      muy oscuro, hue irrelevante
 *   2. Acromático: sin saturación apreciable → gris / blanco
 *   3. Marrón:     tono cálido desaturado u oscuro
 *   4. Vino:       rojo/rosa oscuro con saturación media → evita caer en pink
 *   5. Arcoíris:   resto cromático por rangos de hue
 *
 * @param {number} h  hue ∈ [0, 360)
 * @param {number} s  saturation ∈ [0, 1]
 * @param {number} l  lightness ∈ [0, 1]
 * @returns {string}
 */
export function getColorBucket(h, s, l) {

  // ── 1. Negro absoluto ───────────────────────────────────────────────────────
  // Cualquier color con L muy bajo es perceptualmente negro,
  // independientemente del hue (azul navy, granate, marrón oscuro, etc.).
  // Sin esta regla esos colores rompen el arcoíris.
  if (l < 0.12) return 'black'

  // ── 2. Acromático (gris / blanco) ──────────────────────────────────────────
  // Umbral a 0.10 (no 0.08) para capturar grises con ligero tinte cromático:
  // Contrast Apothecary White, Stormfiend, Frostheart… tienen S ≈ 0.05–0.09
  // y el hue no aporta información visual útil en ese rango.
  if (s < 0.10) {
    if (l > 0.80) return 'white'
    return 'gray'
  }

  // ── 3. Marrón ───────────────────────────────────────────────────────────────
  // Rango de hue 10–55° = zona naranja-amarillo terroso.
  //   s < 0.55 → tierras, cueros, madera (Zandri Dust, Steel Legion Drab…)
  //   l < 0.35 → marrones muy oscuros aunque estén más saturados
  //              (Rhinox Hide, Mournfang Brown, Dryad Bark)
  // Los naranjas vivos como Trollslayer Orange (s ≈ 0.95) NO entran aquí.
  if (h >= 10 && h <= 55 && (s < 0.55 || l < 0.35)) return 'brown'

  // ── 4. Vino / Burgundy ──────────────────────────────────────────────────────
  // Colores en la zona roja extendida (320–360°) que son oscuros y con
  // saturación media → visualmente son granates/borgoña, NO rosas ni magentas.
  // Sin esta regla, Targor Rageshade o Sigvald Burgundy acaban entre los pinks.
  //
  // Condiciones:
  //   h ≥ 320° o h < 20°     → zona roja extendida (incluye rosas oscuros)
  //   l < 0.40               → suficientemente oscuro para ser "vino"
  //   0.15 < s ≤ 0.75        → algo saturado pero no un rosa brillante
  //                            (los rosas vivos con s > 0.75 quedan en 'pink')
  const isWineZone = h >= 320 || h < 20
  if (isWineZone && l < 0.40 && s > 0.15 && s <= 0.75) return 'red'

  // ── 5. Arcoíris cromático ────────────────────────────────────────────────────
  // Los rangos están calibrados para pinturas Citadel/Vallejo, no para
  // colores web ideales. El rojo "envuelve" alrededor de 0°.
  if (h >= 348 || h < 12)  return 'red'
  if (h < 38)               return 'orange'
  if (h < 68)               return 'yellow'
  if (h < 155)              return 'green'
  if (h < 195)              return 'teal'
  if (h < 258)              return 'blue'
  if (h < 292)              return 'purple'
  return 'pink'
}

// ─── Clave de ordenación ─────────────────────────────────────────────────────

/**
 * Genera un array de valores para comparar dos colores del mismo bucket.
 * Orden interno: luminosidad → saturación → hue (todos ascendentes).
 * Resultado visual: oscuro/apagado primero, claro/vivo después.
 * Encaja con la progresión Shade → Base → Layer → Highlight de Citadel.
 */
function sortKey(hsl) {
  return [
    BUCKET_ORDER.indexOf(getColorBucket(hsl.h, hsl.s, hsl.l)),
    hsl.l,   // 1. luminosidad  (oscuro → claro)
    hsl.s,   // 2. saturación   (apagado → vivo)
    hsl.h,   // 3. hue          (tiebreaker)
  ]
}

// ─── Comparador público ───────────────────────────────────────────────────────

/**
 * Comparador listo para usar con Array.sort().
 * Las pinturas sin color_hex válido o con HEX inválido van al final.
 *
 * @param {{ color_hex?: string | null }} a
 * @param {{ color_hex?: string | null }} b
 * @returns {number}
 *
 * @example
 * filtered = [...filtered].sort(comparePaintColors)
 */
export function comparePaintColors(a, b) {
  const hslA = hexToHSL(a.color_hex)
  const hslB = hexToHSL(b.color_hex)

  if (!hslA && !hslB) return 0
  if (!hslA) return  1   // sin color → al final
  if (!hslB) return -1

  const kA = sortKey(hslA)
  const kB = sortKey(hslB)

  for (let i = 0; i < kA.length; i++) {
    const diff = kA[i] - kB[i]
    if (diff !== 0) return diff
  }
  return 0
}
