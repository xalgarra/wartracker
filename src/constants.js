export const STATUSES = [
  { value: 'comprada',  label: 'Comprada' },
  { value: 'montada',   label: 'Montada' },
  { value: 'imprimada', label: 'Imprimada' },
  { value: 'pintando',  label: 'Pintando' },
  { value: 'pintada',   label: 'Pintada' },
]

export const STATUS_ORDER = Object.fromEntries(STATUSES.map((s, i) => [s.value, i]))

export const PAINT_TYPES = [
  'base', 'layer', 'shade', 'dry', 'contrast',
  'technical', 'air', 'spray', 'texture', 'primer',
]

export const UNIT_TYPES = [
  { value: 'único',          label: 'Único' },
  { value: 'personaje',      label: 'Personaje' },
  { value: 'infantería',     label: 'Infantería' },
  { value: 'élite',          label: 'Élite' },
  { value: 'caballería',     label: 'Caballería' },
  { value: 'vehículo',       label: 'Vehículo' },
  { value: 'monstruo',       label: 'Monstruo' },
  { value: 'aeronave',       label: 'Aeronave' },
  { value: 'artillería',     label: 'Artillería' },
  { value: 'faction terrain', label: 'Faction Terrain' },
]

export const PAINT_BRANDS = [
  'Citadel', 'Vallejo', 'Army Painter', 'Scale75',
  'Reaper', 'AK Interactive', 'Warcolours', 'Green Stuff World',
]
