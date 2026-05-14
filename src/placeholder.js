// Hues (HSL) para los placeholders — uno por cada hash mod 8
const HUES = [24, 210, 140, 320, 270, 45, 175, 0]

export function getPlaceholderHue(faction, name) {
  const str = faction || name || ''
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0
  return HUES[h % HUES.length]
}

export function getInitials(name) {
  return (name || '?').trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()
}
