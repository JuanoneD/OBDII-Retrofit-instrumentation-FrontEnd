import { describe, expect, it } from 'vitest'
import {
  calculateFuelPercentage,
  calculateTripEfficiency,
  FuelValidationError,
  extractNewFactor,
  formatMetric,
  parseFuelAmount,
} from './fuel.js'

describe('parseFuelAmount', () => {
  it('aceita separador decimal brasileiro', () => {
    expect(parseFuelAmount('42,5')).toBe(42.5)
  })

  it('aceita separador decimal internacional', () => {
    expect(parseFuelAmount('18.75')).toBe(18.75)
  })

  it('rejeita valor vazio ou não positivo', () => {
    expect(() => parseFuelAmount('')).toThrow(FuelValidationError)
    expect(() => parseFuelAmount('0')).toThrow(FuelValidationError)
  })
})

describe('extractNewFactor', () => {
  it('encontra o novo fator na resposta direta', () => {
    expect(extractNewFactor({ newFactor: 1.2345 })).toBe(1.2345)
  })

  it('encontra o fator em respostas aninhadas', () => {
    expect(
      extractNewFactor({ data: { fuelConsumptionFactor: 0.9876 } }),
    ).toBe(0.9876)
  })

  it('encontra o fator no envelope real de dispositivos', () => {
    expect(
      extractNewFactor({
        device: [{ fuelConsumptionFactor: 0.0088 }],
        totalDevice: 1,
      }),
    ).toBe(0.0088)
  })

  it('retorna null quando o backend não envia o fator', () => {
    expect(extractNewFactor({ message: 'ok' })).toBeNull()
  })
})

describe('métricas de combustível', () => {
  it('calcula a porcentagem limitada entre zero e cem', () => {
    expect(calculateFuelPercentage(25, 50)).toBe(50)
    expect(calculateFuelPercentage(60, 50)).toBe(100)
    expect(calculateFuelPercentage(-5, 50)).toBe(0)
  })

  it('calcula eficiência apenas quando há consumo', () => {
    expect(calculateTripEfficiency(120, 10)).toBe(12)
    expect(calculateTripEfficiency(120, 0)).toBeNull()
  })

  it('formata números para exibição em português', () => {
    expect(formatMetric(42.5)).toBe('42,5')
    expect(formatMetric(null)).toBe('—')
  })
})
