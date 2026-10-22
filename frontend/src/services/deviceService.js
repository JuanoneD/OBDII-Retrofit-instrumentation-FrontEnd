import { extractNewFactor } from '../utils/fuel.js'
import { ApiError, apiRequest } from './apiClient.js'

const NUMBER_FIELDS = [
  'gasolineLevel',
  'tankCapacity',
  'fuelConsumptionFactor',
  'totalDistance',
  'tripConsumption',
]

function normalizeDevice(device) {
  if (!device || typeof device !== 'object' || Array.isArray(device)) {
    return null
  }

  const normalized = {
    ...device,
    idDevice: String(device.idDevice || device.id || ''),
    name: String(device.name || ''),
  }

  for (const field of NUMBER_FIELDS) {
    const rawValue = device[field]
    const value = rawValue === null || rawValue === '' ? Number.NaN : Number(rawValue)
    normalized[field] = Number.isFinite(value) ? value : null
  }

  return normalized.idDevice ? normalized : null
}

function devicesFromPayload(payload) {
  const rawDevices = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.device)
      ? payload.device
      : payload?.device
        ? [payload.device]
        : []

  return rawDevices.map(normalizeDevice).filter(Boolean)
}

export async function listDevices({ token }) {
  const payload = await apiRequest('/devices', {
    token,
    fallbackMessage: 'Não foi possível carregar os dispositivos.',
  })

  return devicesFromPayload(payload)
}

export async function getDevice({ deviceId, token }) {
  const payload = await apiRequest(
    `/devices?idDevice=${encodeURIComponent(deviceId)}`,
    {
      token,
      fallbackMessage: 'Não foi possível carregar os dados do dispositivo.',
    },
  )
  const device = devicesFromPayload(payload)[0]

  if (!device) {
    throw new ApiError('A API não retornou os dados do dispositivo.', 404, payload)
  }

  return device
}

export function addDevice({ idDevice, name, token }) {
  return apiRequest('/user/addDevice', {
    method: 'POST',
    token,
    body: { idDevice, name: name.trim() },
    fallbackMessage: 'Não foi possível adicionar o dispositivo.',
  })
}

export async function resetTrip({ deviceId, token }) {
  await apiRequest(
    `/devices/resetTrip?idDevice=${encodeURIComponent(deviceId)}`,
    {
      method: 'POST',
      token,
      fallbackMessage: 'Não foi possível resetar a viagem.',
    },
  )

  return getDevice({ deviceId, token })
}

export async function recalculateFuel({ deviceId, refueledGas, token }) {
  const recalculatePayload = await apiRequest(
    `/devices/resetAndRecalculate?idDevice=${encodeURIComponent(deviceId)}`,
    {
      method: 'POST',
      token,
      body: { refueledGas },
      fallbackMessage: 'Não foi possível recalibrar o combustível.',
    },
  )
  const device = await getDevice({ deviceId, token })

  return {
    device,
    recalculatePayload,
    newFactor: extractNewFactor(device),
  }
}

export { ApiError }
