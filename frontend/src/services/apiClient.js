const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(
  /\/$/,
  '',
)
const REQUEST_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT_MS) || 12000

export class ApiError extends Error {
  constructor(message, status = 0, payload = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }
}

export function normalizeToken(token = '') {
  return String(token).trim().replace(/^(?:Bearer|Token)\s+/i, '')
}

function firstValidationMessage(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return null
  }

  for (const value of Object.values(payload)) {
    if (Array.isArray(value) && value.length > 0) {
      return String(value[0])
    }

    if (typeof value === 'string' && value.trim()) {
      return value
    }
  }

  return null
}

function getApiErrorMessage(status, payload, fallbackMessage) {
  const backendMessage =
    payload?.detail ||
    payload?.message ||
    payload?.title ||
    payload?.error ||
    firstValidationMessage(payload)

  if (backendMessage) {
    return backendMessage
  }

  const messages = {
    400: 'Os dados enviados não foram aceitos. Confira os campos.',
    401: 'Sua sessão expirou. Entre novamente para continuar.',
    403: 'Você não tem permissão para realizar esta ação.',
    404: 'O conteúdo solicitado não foi encontrado.',
    409: 'Este e-mail já está cadastrado.',
    500: 'O servidor encontrou um problema. Tente novamente em instantes.',
  }

  return (
    messages[status] ||
    fallbackMessage ||
    'Não foi possível concluir a solicitação.'
  )
}

async function readResponse(response) {
  const text = await response.text()

  if (!text) {
    return null
  }

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

export async function apiRequest(
  path,
  { method = 'GET', token = '', body, fallbackMessage } = {},
) {
  const controller = new AbortController()
  const timeout = globalThis.setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT,
  )
  const headers = { Accept: 'application/json' }
  const normalizedToken = normalizeToken(token)

  if (normalizedToken) {
    headers.Authorization = `Bearer ${normalizedToken}`
  }

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    })
    const payload = await readResponse(response)

    if (!response.ok) {
      throw new ApiError(
        getApiErrorMessage(response.status, payload, fallbackMessage),
        response.status,
        payload,
      )
    }

    return payload
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new ApiError('A API demorou para responder. Tente novamente.')
    }

    if (error instanceof ApiError) {
      throw error
    }

    throw new ApiError(
      fallbackMessage ||
        'Não foi possível conectar ao backend. Verifique a API e tente novamente.',
    )
  } finally {
    globalThis.clearTimeout(timeout)
  }
}
