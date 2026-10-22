import { afterEach, describe, expect, it, vi } from 'vitest'
import { loginUser, logoutUser, registerUser } from './authService.js'

function response(payload, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: vi.fn().mockResolvedValue(payload ? JSON.stringify(payload) : ''),
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('authService', () => {
  it('faz login e lê o token retornado pelo backend', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response({ token: 'abc123' }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      loginUser({ email: ' usuario@teste.com ', password: 'senha' }),
    ).resolves.toBe('abc123')

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/user/login',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          email: 'usuario@teste.com',
          password: 'senha',
        }),
      }),
    )
  })

  it('cria a conta com login automático', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response({ token: 'novo-token' }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      registerUser({
        name: ' Maria ',
        email: 'maria@teste.com',
        password: 'segredo',
      }),
    ).resolves.toBe('novo-token')

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/user',
      expect.objectContaining({
        body: JSON.stringify({
          username: 'Maria',
          email: 'maria@teste.com',
          password: 'segredo',
        }),
      }),
    )
  })

  it('envia o Token ao fazer logout', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response(null))
    vi.stubGlobal('fetch', fetchMock)

    await logoutUser('Token abc123')

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/user/logout',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer abc123' }),
      }),
    )
  })
})
