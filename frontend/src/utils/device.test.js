import { describe, expect, it } from 'vitest'
import { formatMacInput, isValidMac, normalizeMac } from './device.js'

describe('utilitários de MAC', () => {
  it('formata letras minúsculas e separadores durante a digitação', () => {
    expect(formatMacInput('aa-bb-cc-dd-ee-ff')).toBe('AA:BB:CC:DD:EE:FF')
  })

  it('valida somente um MAC completo', () => {
    expect(isValidMac('AA:BB:CC:DD:EE:FF')).toBe(true)
    expect(isValidMac('AA:BB:CC')).toBe(false)
  })

  it('normaliza um MAC válido e rejeita um incompleto', () => {
    expect(normalizeMac('aabbccddeeff')).toBe('AA:BB:CC:DD:EE:FF')
    expect(normalizeMac('aabb')).toBe('')
  })
})
