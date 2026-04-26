import { describe, test, expect, beforeEach, vi } from 'vitest'

vi.mock('../db.js', () => ({ db: {} }))

import { state } from '../state.js'
import { getTypeForMini, calcularPtsPorJuego } from '../minis.js'

const FACTIONS = [
  { name: 'Thousand Sons', game_slug: '40k' },
  { name: 'Disciples of Tzeentch', game_slug: 'aos' },
  { name: 'Adepta Sororitas', game_slug: '40k' },
]

const TYPE_MAP = {
  'Rubric Marines|Thousand Sons|40k': 'élite',
  'Exalted Sorcerer|Thousand Sons|40k': 'personaje',
  'Pink Horrors of Tzeentch|Disciples of Tzeentch|aos': 'infantería',
}

const UNIT_MAP = {
  'Rubric Marines|Thousand Sons|40k': 115,
  'Pink Horrors of Tzeentch|Thousand Sons|40k': 115,
  'Pink Horrors of Tzeentch|Disciples of Tzeentch|aos': 160,
}

beforeEach(() => {
  state.factions = FACTIONS
  state.typeMap = TYPE_MAP
  state.unitMap = UNIT_MAP
})

// ─── getTypeForMini ──────────────────────────────────────────────────────────

describe('getTypeForMini', () => {
  test('devuelve el tipo correcto', () => {
    expect(getTypeForMini({ name: 'Rubric Marines', factions: ['Thousand Sons'] })).toBe('élite')
  })

  test('devuelve null si la unidad no está en typeMap', () => {
    expect(getTypeForMini({ name: 'Unidad Desconocida', factions: ['Thousand Sons'] })).toBeNull()
  })

  test('devuelve null con factions vacío', () => {
    expect(getTypeForMini({ name: 'Rubric Marines', factions: [] })).toBeNull()
  })

  test('devuelve null con facción desconocida', () => {
    expect(getTypeForMini({ name: 'Rubric Marines', factions: ['Facción Inexistente'] })).toBeNull()
  })

  test('prueba la primera facción con tipo disponible (multi-facción)', () => {
    const mini = { name: 'Pink Horrors of Tzeentch', factions: ['Thousand Sons', 'Disciples of Tzeentch'] }
    // Thousand Sons no tiene Pink Horrors en typeMap, Disciples of Tzeentch sí
    expect(getTypeForMini(mini)).toBe('infantería')
  })
})

// ─── calcularPtsPorJuego ─────────────────────────────────────────────────────

describe('calcularPtsPorJuego', () => {
  test('devuelve los puntos para una mini con una facción', () => {
    const mini = { name: 'Rubric Marines', factions: ['Thousand Sons'], qty: 1 }
    const pts = calcularPtsPorJuego(mini, ['40k'], FACTIONS, UNIT_MAP)
    expect(pts).toEqual([115])
  })

  test('multiplica pts por qty', () => {
    const mini = { name: 'Rubric Marines', factions: ['Thousand Sons'], qty: 3 }
    const [pts40k] = calcularPtsPorJuego(mini, ['40k'], FACTIONS, UNIT_MAP)
    expect(pts40k * mini.qty).toBe(345)
  })

  test('null para juego sin puntos en unitMap', () => {
    const mini = { name: 'Unidad Sin Puntos', factions: ['Thousand Sons'], qty: 1 }
    const pts = calcularPtsPorJuego(mini, ['40k'], FACTIONS, UNIT_MAP)
    expect(pts).toEqual([null])
  })

  test('mini cross-game devuelve pts distintos por juego', () => {
    const mini = { name: 'Pink Horrors of Tzeentch', factions: ['Thousand Sons', 'Disciples of Tzeentch'], qty: 1 }
    const pts = calcularPtsPorJuego(mini, ['40k', 'aos'], FACTIONS, UNIT_MAP)
    expect(pts[0]).toBe(115)  // 40k
    expect(pts[1]).toBe(160)  // aos
  })

  test('juegos sin facciones relevantes devuelven null', () => {
    const mini = { name: 'Rubric Marines', factions: ['Thousand Sons'], qty: 1 }
    const pts = calcularPtsPorJuego(mini, ['aos'], FACTIONS, UNIT_MAP)
    expect(pts).toEqual([null])
  })
})

// ─── lógica de filtros ───────────────────────────────────────────────────────

describe('filtro por nombre', () => {
  const minis = [
    { name: 'Rubric Marines', factions: ['Thousand Sons'] },
    { name: 'Exalted Sorcerer', factions: ['Thousand Sons'] },
    { name: 'Seraphim Squad', factions: ['Adepta Sororitas'] },
  ]

  test('búsqueda parcial case-insensitive', () => {
    const q = 'rubric'
    const r = minis.filter(m => m.name.toLowerCase().includes(q))
    expect(r).toHaveLength(1)
    expect(r[0].name).toBe('Rubric Marines')
  })

  test('sin resultados con búsqueda sin coincidencias', () => {
    const r = minis.filter(m => m.name.toLowerCase().includes('grey knights'))
    expect(r).toHaveLength(0)
  })

  test('búsqueda vacía devuelve todo', () => {
    const q = ''
    const r = q ? minis.filter(m => m.name.toLowerCase().includes(q)) : minis
    expect(r).toHaveLength(3)
  })
})

describe('filtro por tipo', () => {
  const minis = [
    { name: 'Rubric Marines', factions: ['Thousand Sons'] },
    { name: 'Exalted Sorcerer', factions: ['Thousand Sons'] },
  ]

  test('filtra por tipo correcto', () => {
    const r = minis.filter(m => getTypeForMini(m) === 'élite')
    expect(r).toHaveLength(1)
    expect(r[0].name).toBe('Rubric Marines')
  })

  test('tipo inexistente devuelve lista vacía', () => {
    const r = minis.filter(m => getTypeForMini(m) === 'vehículo')
    expect(r).toHaveLength(0)
  })
})
