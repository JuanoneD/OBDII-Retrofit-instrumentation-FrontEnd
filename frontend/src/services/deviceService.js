import { extractNewFactor } from '../utils/fuel.js'
import { ApiError, apiRequest } from './apiClient.js'

const NUMBER_FIELDS = [
  'gasolineLevel',
  'tankCapacity',
  'fuelConsumptionFactor',
  'totalDistance',
  'tripConsumption',
]

function normalizeBoolean(value) {
  return value === true || value === 1 || String(value).toLowerCase() === 'true'
}

function normalizeDevice(device) {
  if (!device || typeof device !== 'object' || Array.isArray(device)) {
    return null
  }

  const normalized = {
    ...device,
    idDevice: String(device.idDevice || device.id || ''),
    name: String(device.name || ''),
    diagnoseMode: normalizeBoolean(device.diagnoseMode),
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

function normalizeDtc(dtc) {
  if (!dtc || typeof dtc !== 'object' || Array.isArray(dtc)) {
    return null
  }

  const code = String(dtc.code || '').trim().toUpperCase()

  if (!code) {
    return null
  }

  return {
    code,
    title: String(dtc.title || 'Código não encontrado na base'),
    description: String(dtc.description || ''),
    receivedAt: dtc.receivedAt ? String(dtc.receivedAt) : '',
  }
}

function dtcsFromPayload(payload) {
  const rawDtcs = Array.isArray(payload) ? payload : payload?.dtcs

  return Array.isArray(rawDtcs)
    ? rawDtcs.map(normalizeDtc).filter(Boolean)
    : []
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

export function setDiagnosticMode({ deviceId, diagnoseMode, token }) {
  return apiRequest(
    `/devices/setOperationMode?idDevice=${encodeURIComponent(deviceId)}`,
    {
      method: 'POST',
      token,
      body: { diagnoseMode: Boolean(diagnoseMode) },
      fallbackMessage: 'Não foi possível alterar o modo diagnóstico.',
    },
  )
}

export async function getDtcs({ deviceId, token }) {
  const payload = await apiRequest(
    `/devices/getDTCs?idDevice=${encodeURIComponent(deviceId)}`,
    {
      token,
      fallbackMessage: 'Não foi possível carregar os códigos de falha.',
    },
  )

  return dtcsFromPayload(payload)
}

export { ApiError }
