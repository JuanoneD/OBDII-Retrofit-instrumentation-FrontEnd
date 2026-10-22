import { ApiError, apiRequest } from './apiClient.js'

function extractToken(payload) {
  const token = payload?.Token || payload?.token

  if (typeof token !== 'string' || !token.trim()) {
    throw new ApiError('A API não retornou um token de acesso válido.')
  }

  return token.trim()
}

export async function loginUser({ email, password }) {
  const payload = await apiRequest('/user/login', {
    method: 'POST',
    body: { email: email.trim(), password },
    fallbackMessage: 'Não foi possível entrar. Confira a conexão com a API.',
  })

  return extractToken(payload)
}

export async function registerUser({ name, email, password }) {
  const payload = await apiRequest('/user', {
    method: 'POST',
    body: { username: name.trim(), email: email.trim(), password },
    fallbackMessage: 'Não foi possível criar a conta.',
  })

  return extractToken(payload)
}

export function logoutUser(token) {
  return apiRequest('/user/logout', {
    method: 'POST',
    token,
    fallbackMessage: 'Não foi possível encerrar a sessão no servidor.',
  })
}
