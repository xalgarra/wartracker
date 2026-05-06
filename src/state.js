import { db } from './db.js'

export const state = {
  games: [],
  factions: [],
  units: [],
  unitMap: {},
  typeMap: {},
  minisActuales: [],
  wishlistActuales: [],
  pinturas: [],
  miniEnEdicion: null,
  paintEnEdicion: null,
  tabActual: 'home',
  filtroNombre: '',
  filtroType: '',
  ordenar: 'reciente',
  sortDir: 'desc',
  listsActuales: [],
  listaEnDetalle: null,
  // Caches compartidas entre vistas. null = invalidada (se refetchea al próximo uso).
  minisFull: null,
  proyectosActivos: null,
}

export function invalidateMinis() { state.minisFull = null }
export function invalidateProyectos() { state.proyectosActivos = null }

export async function ensureMinisFull() {
  if (state.minisFull) return state.minisFull
  const { data } = await db.from('minis')
    .select('*')
    .neq('status', 'wishlist')
    .order('created_at', { ascending: false })
  state.minisFull = data || []
  return state.minisFull
}
