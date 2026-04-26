import { describe, test, expect, vi } from 'vitest'

vi.mock('../db.js', () => ({ db: {} }))
vi.mock('../mini-modal.js', () => ({ abrirEdicion: () => {} }))
vi.mock('../minis.js', () => ({ cambiarStatusRapido: () => {} }))
vi.mock('../init.js', () => ({ cambiarTab: () => {} }))

import { pickHero, modelsFor } from '../home.js'

// ─── pickHero ────────────────────────────────────────────────────────────────

describe('pickHero', () => {
  test('devuelve null con lista vacía', () => {
    expect(pickHero([])).toBeNull()
  })

  test('elige pintando primero', () => {
    const minis = [
      { id: 1, status: 'comprada' },
      { id: 2, status: 'pintando' },
      { id: 3, status: 'imprimada' },
    ]
    expect(pickHero(minis).id).toBe(2)
  })

  test('elige imprimada si no hay pintando', () => {
    const minis = [
      { id: 1, status: 'comprada' },
      { id: 2, status: 'imprimada' },
      { id: 3, status: 'montada' },
    ]
    expect(pickHero(minis).id).toBe(2)
  })

  test('elige montada si no hay imprimada ni pintando', () => {
    const minis = [
      { id: 1, status: 'comprada' },
      { id: 2, status: 'montada' },
    ]
    expect(pickHero(minis).id).toBe(2)
  })

  test('elige comprada como último recurso', () => {
    const minis = [
      { id: 1, status: 'comprada' },
      { id: 2, status: 'pintada' },
    ]
    expect(pickHero(minis).id).toBe(1)
  })

  test('pintada no activa como hero', () => {
    const minis = [{ id: 1, status: 'pintada' }]
    expect(pickHero(minis)).toBeNull()
  })
})

// ─── modelsFor ───────────────────────────────────────────────────────────────

describe('modelsFor', () => {
  test('models null cuenta como 1 × qty', () => {
    expect(modelsFor({ qty: 3, models: null })).toBe(3)
  })

  test('models × qty', () => {
    expect(modelsFor({ qty: 2, models: 10 })).toBe(20)
  })

  test('qty=1 models=1 devuelve 1', () => {
    expect(modelsFor({ qty: 1, models: 1 })).toBe(1)
  })

  test('models=0 devuelve 0', () => {
    expect(modelsFor({ qty: 5, models: 0 })).toBe(0)
  })
})
