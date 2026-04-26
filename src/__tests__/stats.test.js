import { describe, test, expect } from 'vitest'
import { calcularGlobales } from '../stats.js'

describe('calcularGlobales', () => {
  test('colección vacía devuelve ceros', () => {
    expect(calcularGlobales([])).toEqual({ total: 0, pintados: 0, pct: 0 })
  })

  test('mini sin models cuenta como 1 modelo', () => {
    const r = calcularGlobales([{ qty: 1, models: null, status: 'comprada' }])
    expect(r.total).toBe(1)
  })

  test('qty multiplica los modelos', () => {
    const r = calcularGlobales([{ qty: 3, models: null, status: 'comprada' }])
    expect(r.total).toBe(3)
  })

  test('models × qty', () => {
    const r = calcularGlobales([{ qty: 2, models: 10, status: 'comprada' }])
    expect(r.total).toBe(20)
  })

  test('solo status=pintada cuenta para pintados', () => {
    const minis = [
      { qty: 1, models: null, status: 'pintada' },
      { qty: 1, models: null, status: 'pintando' },
      { qty: 1, models: null, status: 'comprada' },
    ]
    const r = calcularGlobales(minis)
    expect(r.total).toBe(3)
    expect(r.pintados).toBe(1)
  })

  test('pct redondeado correctamente', () => {
    // 1 pintada de 3 = 33.33% → 33
    const minis = [
      { qty: 1, models: null, status: 'pintada' },
      { qty: 2, models: null, status: 'comprada' },
    ]
    expect(calcularGlobales(minis).pct).toBe(33)
  })

  test('100% cuando todo pintado', () => {
    const r = calcularGlobales([{ qty: 5, models: 3, status: 'pintada' }])
    expect(r.total).toBe(15)
    expect(r.pintados).toBe(15)
    expect(r.pct).toBe(100)
  })

  test('0% cuando nada pintado', () => {
    const minis = [
      { qty: 2, models: null, status: 'comprada' },
      { qty: 1, models: 5, status: 'montada' },
    ]
    const r = calcularGlobales(minis)
    expect(r.pintados).toBe(0)
    expect(r.pct).toBe(0)
  })

  test('mezcla de models null y con valor', () => {
    const minis = [
      { qty: 2, models: 5, status: 'pintada' },  // 10 pintados
      { qty: 3, models: null, status: 'pintada' }, // 3 pintados
    ]
    const r = calcularGlobales(minis)
    expect(r.total).toBe(13)
    expect(r.pintados).toBe(13)
  })
})
