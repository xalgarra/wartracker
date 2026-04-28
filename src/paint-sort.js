// ─── hexToHsl ────────────────────────────────────────────────────────────────

/**
 * Convierte HEX (#RRGGBB o #RGB) a HSL.
 * @param {string|null|undefined} hex
 * @returns {{ h: number, s: number, l: number } | null}
 *   h ∈ [0, 360)  s ∈ [0, 100]  l ∈ [0, 100]
 */
export function hexToHsl(hex) {
  if (!hex || typeof hex !== 'string') return null

  let raw = hex.trim().replace(/^#/, '')
  if (raw.length === 3) raw = raw[0]+raw[0]+raw[1]+raw[1]+raw[2]+raw[2]
  if (raw.length !== 6 || !/^[0-9a-fA-F]{6}$/.test(raw)) return null

  const r = parseInt(raw.slice(0, 2), 16) / 255
  const g = parseInt(raw.slice(2, 4), 16) / 255
  const b = parseInt(raw.slice(4, 6), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l   = (max + min) / 2

  if (max === min) return { h: 0, s: 0, l: l * 100 }

  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

  let h = 0
  if      (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
  else if (max === g) h = ((b - r) / d + 2) / 6
  else                h = ((r - g) / d + 4) / 6

  return { h: h * 360, s: s * 100, l: l * 100 }
}

// ─── Buckets ──────────────────────────────────────────────────────────────────

// Orden visual de izquierda a derecha / arriba a abajo en la UI.
// Modifica aquí si quieres reordenar grupos.
const BUCKET_ORDER = [
  'black', 'gray', 'white',
  'brown',
  'red', 'orange', 'yellow', 'green', 'teal', 'blue', 'purple', 'pink',
]

/**
 * Clasifica un color HSL en un bucket visual con nombre.
 * Aquí viven todos los umbrales — ajusta si el resultado no convence.
 *
 * Lógica de prioridad:
 *   1. Muy oscuro (L < 12)                         → negro
 *   2. Sin saturación (S < 10)                      → blanco / gris
 *   3. Tono cálido desaturado u oscuro              → marrón
 *   4. Resto cromático ordenado como arcoíris       → rojo…rosa
 *
 * @param {{ h: number, s: number, l: number }} hsl
 * @returns {string}
 */
export function getColorBucket({ h, s, l }) {
  // 1. Negro absoluto: muy oscuro independientemente del tono.
  //    Evita que azules navy, rojos vino o marrones oscuros
  //    queden desperdigados por el arcoíris.
  if (l < 12) return 'black'

  // 2. Acromático: sin saturación apreciable.
  //    El hue de estos colores es matemáticamente inestable
  //    y no aporta información visual.
  if (s < 10) {
    if (l > 82) return 'white'
    return 'gray'
  }

  // 3. Marrón: tono en la zona cálida (naranja-amarillo oscuro)
  //    con baja saturación O baja luminosidad.
  //    Captura: Rhinox Hide, Steel Legion Drab, Zandri Dust,
  //             Baneblade Brown, Dryad Bark…
  //    Deja pasar a 'orange': Trollslayer Orange, Fire Dragon Bright…
  if (h >= 10 && h <= 52 && (s < 50 || l < 32)) return 'brown'

  // 4. Arcoíris cromático.
  //    Los rangos de hue son aproximados — hay un leve solapamiento
  //    intencional en los límites rojo/naranja y azul/morado.
  if (h >= 348 || h < 12)  return 'red'
  if (h < 38)               return 'orange'
  if (h < 68)               return 'yellow'
  if (h < 155)              return 'green'
  if (h < 195)              return 'teal'
  if (h < 258)              return 'blue'
  if (h < 292)              return 'purple'
  return 'pink'
}

// ─── Clave de ordenación interna ─────────────────────────────────────────────

function colorSortKey(hsl) {
  const bucket    = getColorBucket(hsl)
  const bucketIdx = BUCKET_ORDER.indexOf(bucket)

  switch (bucket) {
    // Acromáticos: de oscuro a claro dentro de cada grupo.
    case 'black':
    case 'gray':
    case 'white':
      return [bucketIdx, hsl.l, 0]

    // Marrones: por tono (tierra clara → oscura), luego luminosidad.
    case 'brown':
      return [bucketIdx, hsl.h, hsl.l]

    // Cromáticos: por tono exacto dentro del bucket, luego oscuro→claro.
    // El arcoíris fluye suavemente y dentro de cada color
    // las versiones más oscuras (base/shade) preceden a las claras (layer/highlight).
    default:
      return [bucketIdx, hsl.h, hsl.l]
  }
}

// ─── Comparador público ───────────────────────────────────────────────────────

/**
 * Comparador listo para usar con Array.sort().
 * Las pinturas sin color_hex válido van al final.
 *
 * @param {{ color_hex?: string | null }} a
 * @param {{ color_hex?: string | null }} b
 * @returns {number}
 *
 * @example
 * if (paintSort === 'color') {
 *   filtered = [...filtered].sort(comparePaintColors)
 * }
 */
export function comparePaintColors(a, b) {
  const hslA = hexToHsl(a.color_hex)
  const hslB = hexToHsl(b.color_hex)

  if (!hslA && !hslB) return 0
  if (!hslA) return  1   // sin color → al final
  if (!hslB) return -1

  const keyA = colorSortKey(hslA)
  const keyB = colorSortKey(hslB)

  for (let i = 0; i < keyA.length; i++) {
    const diff = keyA[i] - keyB[i]
    if (diff !== 0) return diff
  }
  return 0
}
