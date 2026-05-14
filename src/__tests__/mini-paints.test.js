import { describe, test, expect, vi } from 'vitest'

vi.mock('../db.js', () => ({ db: {} }))

import { mergePaintList, recipeFreshPaints } from '../mini-paints.js'

const P1 = { id: '1', name: 'Agrax Earthshade', color_hex: '#5a4a30' }
const P2 = { id: '2', name: 'Nuln Oil', color_hex: '#1a1a1a' }
const P3 = { id: '3', name: 'Reikland Fleshshade', color_hex: '#b06040' }

describe('mergePaintList', () => {
  test('añade nuevas pinturas sin duplicados', () => {
    const result = mergePaintList([P1], [P2, P3])
    expect(result).toHaveLength(3)
    expect(result.map(p => p.id)).toEqual(['1', '2', '3'])
  })

  test('ignora pinturas que ya existen en existing', () => {
    const result = mergePaintList([P1, P2], [P2, P3])
    expect(result).toHaveLength(3)
    expect(result.filter(p => p.id === '2')).toHaveLength(1)
  })

  test('existing vacío devuelve todas las additions', () => {
    const result = mergePaintList([], [P1, P2])
    expect(result).toEqual([P1, P2])
  })

  test('additions vacío devuelve existing intacto', () => {
    const result = mergePaintList([P1], [])
    expect(result).toEqual([P1])
  })
})

describe('recipeFreshPaints', () => {
  test('devuelve sólo las pinturas que NO están en existing', () => {
    const fresh = recipeFreshPaints([P1, P2, P3], [P1])
    expect(fresh.map(p => p.id)).toEqual(['2', '3'])
  })

  test('devuelve array vacío si todas ya existen', () => {
    const fresh = recipeFreshPaints([P1, P2], [P1, P2])
    expect(fresh).toHaveLength(0)
  })

  test('devuelve todas si existing está vacío', () => {
    const fresh = recipeFreshPaints([P1, P2], [])
    expect(fresh).toEqual([P1, P2])
  })
})
