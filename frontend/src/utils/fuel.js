const FACTOR_KEYS = [
  'newFactor',
  'fuelConsumptionFactor',
  'novoFator',
  'factor',
]

function isNumeric(value) {
  return value !== null && value !== '' && Number.isFinite(Number(value))
}

export class FuelValidationError extends Error {
  constructor(message) {
    super(message)
    this.name = 'FuelValidationError'
  }
}

export function parseFuelAmount(rawValue) {
  const value = String(rawValue ?? '').trim()

  if (!value) {
    throw new FuelValidationError('Informe quantos litros foram abastecidos.')
  }

  const normalized = value.includes(',')
    ? value.replace(/\./g, '').replace(',', '.')
    : value
  const amount = Number(normalized)

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new FuelValidationError('Use um valor maior que zero, como 42,5.')
  }

  if (amount > 1000) {
    throw new FuelValidationError('Confira o valor informado em litros.')
  }

  return amount
}

export function extractNewFactor(payload) {
  if (typeof payload === 'number' && Number.isFinite(payload)) {
    return payload
  }

  if (!payload || typeof payload !== 'object') {
    return null
  }

  if (Array.isArray(payload)) {
    for (const item of payload) {
      const factor = extractNewFactor(item)

      if (factor !== null) {
        return factor
      }
    }

    return null
  }

  for (const key of FACTOR_KEYS) {
    const candidate = payload[key]

    if (isNumeric(candidate)) {
      return Number(candidate)
    }
  }

  for (const nestedKey of ['data', 'result', 'device']) {
    const nestedFactor = extractNewFactor(payload[nestedKey])

    if (nestedFactor !== null) {
      return nestedFactor
    }
  }

  return null
}

export function formatFuelFactor(value) {
  if (!isNumeric(value)) {
    return '—'
  }

  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(Number(value))
}

export function formatMetric(value, maximumFractionDigits = 1) {
  if (!isNumeric(value)) {
    return '—'
  }

  const number = Number(value)

  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  }).format(number)
}

export function calculateFuelPercentage(level, capacity) {
  if (!isNumeric(level) || !isNumeric(capacity)) {
    return null
  }

  const numericLevel = Number(level)
  const numericCapacity = Number(capacity)

  if (numericCapacity <= 0) {
    return null
  }

  return Math.min(100, Math.max(0, (numericLevel / numericCapacity) * 100))
}

export function calculateTripEfficiency(distance, consumption) {
  if (!isNumeric(distance) || !isNumeric(consumption)) {
    return null
  }

  const numericDistance = Number(distance)
  const numericConsumption = Number(consumption)

  if (numericConsumption <= 0) {
    return null
  }

  return numericDistance / numericConsumption
}
