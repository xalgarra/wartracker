import { describe, test, expect, vi } from 'vitest'

vi.mock('../db.js', () => ({ db: {} }))
vi.mock('../toast.js', () => ({ mostrarError: () => {}, mostrarExito: () => {} }))
vi.mock('../state.js', () => ({ state: { games: [], factions: [], unitMap: {}, listsActuales: [], listaEnDetalle: null } }))

import { getPtsForGame, calcularPtsLista, calcularPtsPintadosLista, pctPintado } from '../lists.js'

const factions = [
  { name: 'Space Marines', game_slug: '40k' },
  { name: 'Stormcast', game_slug: 'aos' },
  { name: 'Disciples of Tzeentch', game_slug: 'aos' },
  { name: 'Thousand Sons', game_slug: '40k' },
]
const unitMap = {
  'Tactical Squad|Space Marines|40k': 130,
  'Lord-Celestant|Stormcast|aos': 200,
  'Pink Horrors|Disciples of Tzeentch|aos': 120,
  'Pink Horrors|Thousand Sons|40k': 150,
}

// ─── getPtsForGame ────────────────────────────────────────────────────────────

describe('getPtsForGame', () => {
  test('devuelve pts correctos para el juego indicado', () => {
    const mini = { name: 'Tactical Squad', factions: ['Space Marines'] }
    expect(getPtsForGame(mini, '40k', unitMap, factions)).toBe(130)
  })

  test('devuelve 0 si la mini no es del juego indicado', () => {
    const mini = { name: 'Tactical Squad', factions: ['Space Marines'] }
    expect(getPtsForGame(mini, 'aos', unitMap, factions)).toBe(0)
  })

  test('cross-game: devuelve pts del juego correcto según game_slug', () => {
    const mini = { name: 'Pink Horrors', factions: ['Disciples of Tzeentch', 'Thousand Sons'] }
    expect(getPtsForGame(mini, 'aos', unitMap, factions)).toBe(120)
    expect(getPtsForGame(mini, '40k', unitMap, factions)).toBe(150)
  })

  test('devuelve 0 si factions está vacío', () => {
    const mini = { name: 'Unknown', factions: [] }
    expect(getPtsForGame(mini, '40k', unitMap, factions)).toBe(0)
  })
})

// ─── calcularPtsLista ─────────────────────────────────────────────────────────

describe('calcularPtsLista', () => {
  const minis = [
    { id: '1', name: 'Tactical Squad', factions: ['Space Marines'], status: 'comprada' },
    { id: '2', name: 'Pink Horrors', factions: ['Disciples of Tzeentch', 'Thousand Sons'], status: 'pintada' },
  ]

  test('suma pts de todas las entradas', () => {
    const entries = [{ mini_id: '1', qty: 1 }, { mini_id: '2', qty: 1 }]
    expect(calcularPtsLista(entries, minis, '40k', unitMap, factions)).toBe(130 + 150)
  })

  test('respeta qty', () => {
    const entries = [{ mini_id: '1', qty: 2 }]
    expect(calcularPtsLista(entries, minis, '40k', unitMap, factions)).toBe(260)
  })

  test('lista vacía devuelve 0', () => {
    expect(calcularPtsLista([], minis, '40k', unitMap, factions)).toBe(0)
  })

  test('ignora mini_id desconocido', () => {
    const entries = [{ mini_id: 'unknown', qty: 1 }]
    expect(calcularPtsLista(entries, minis, '40k', unitMap, factions)).toBe(0)
  })
})

// ─── calcularPtsPintadosLista ─────────────────────────────────────────────────

describe('calcularPtsPintadosLista', () => {
  const minis = [
    { id: '1', name: 'Tactical Squad', factions: ['Space Marines'], status: 'comprada' },
    { id: '2', name: 'Pink Horrors', factions: ['Disciples of Tzeentch', 'Thousand Sons'], status: 'pintada' },
    { id: '3', name: 'Lord-Celestant', factions: ['Stormcast'], status: 'pintada' },
  ]

  test('solo suma minis pintadas', () => {
    const entries = [
      { mini_id: '1', qty: 1 },
      { mini_id: '2', qty: 1 },
    ]
    // mini 1 no está pintada, mini 2 sí (40k)
    expect(calcularPtsPintadosLista(entries, minis, '40k', unitMap, factions)).toBe(150)
  })

  test('devuelve 0 si ninguna pintada', () => {
    const entries = [{ mini_id: '1', qty: 1 }]
    expect(calcularPtsPintadosLista(entries, minis, '40k', unitMap, factions)).toBe(0)
  })

  test('respeta qty en pintadas', () => {
    const entries = [{ mini_id: '3', qty: 2 }]
    expect(calcularPtsPintadosLista(entries, minis, 'aos', unitMap, factions)).toBe(400)
  })
})

// ─── pctPintado ───────────────────────────────────────────────────────────────

describe('pctPintado', () => {
  test('100% cuando todo pintado', () => {
    expect(pctPintado(200, 200)).toBe(100)
  })

  test('0% cuando nada pintado', () => {
    expect(pctPintado(200, 0)).toBe(0)
  })

  test('redondea al entero más cercano', () => {
    expect(pctPintado(300, 100)).toBe(33)
  })

  test('total 0 devuelve 0 sin dividir por cero', () => {
    expect(pctPintado(0, 0)).toBe(0)
  })
})
