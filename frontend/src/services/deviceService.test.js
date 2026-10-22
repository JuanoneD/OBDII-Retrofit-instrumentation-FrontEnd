import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  addDevice,
  ApiError,
  listDevices,
  recalculateFuel,
  resetTrip,
} from './deviceService.js'

function response(payload, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: vi
      .fn()
      .mockResolvedValue(payload === null ? '' : JSON.stringify(payload)),
  }
}

const DEVICE = {
  idDevice: 'AA:BB:CC:DD:EE:FF',
  name: 'Veículo de teste',
  gasolineLevel: 45,
  tankCapacity: 50,
  fuelConsumptionFactor: 1.2345,
  totalDistance: 120,
  tripConsumption: 10,
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('deviceService', () => {
  it('lista e normaliza os dispositivos do envelope da API', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        response({
          device: [{ ...DEVICE, gasolineLevel: '45.5' }],
          totalDevice: 1,
        }),
      ),
    )

    await expect(listDevices({ token: 'abc' })).resolves.toEqual([
      { ...DEVICE, gasolineLevel: 45.5 },
    ])
  })

  it('envia o contrato esperado e recarrega após o recálculo', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response(null))
      .mockResolvedValueOnce(response({ device: [DEVICE], totalDevice: 1 }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await recalculateFuel({
      deviceId: 'AA:BB:CC:DD:EE:FF',
      refueledGas: 4.4,
      token: 'Bearer token-de-teste',
    })

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      '/api/devices/resetAndRecalculate?idDevice=AA%3ABB%3ACC%3ADD%3AEE%3AFF',
      expect.objectContaining({
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: 'Bearer token-de-teste',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refueledGas: 4.4 }),
      }),
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/devices?idDevice=AA%3ABB%3ACC%3ADD%3AEE%3AFF',
      expect.objectContaining({
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: 'Bearer token-de-teste',
        },
      }),
    )
    expect(result.newFactor).toBe(1.2345)
    expect(result.device).toEqual(DEVICE)
  })

  it('vincula um dispositivo usando MAC e nome', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response(null))
    vi.stubGlobal('fetch', fetchMock)

    await addDevice({
      idDevice: DEVICE.idDevice,
      name: ' Meu carro ',
      token: 'abc',
    })

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/user/addDevice',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          idDevice: DEVICE.idDevice,
          name: 'Meu carro',
        }),
      }),
    )
  })

  it('reseta a viagem e atualiza o dispositivo', async () => {
    const updatedDevice = { ...DEVICE, totalDistance: 0, tripConsumption: 0 }
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response(null))
      .mockResolvedValueOnce(
        response({ device: [updatedDevice], totalDevice: 1 }),
      )
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      resetTrip({ deviceId: DEVICE.idDevice, token: 'abc' }),
    ).resolves.toEqual(updatedDevice)

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      '/api/devices/resetTrip?idDevice=AA%3ABB%3ACC%3ADD%3AEE%3AFF',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('transforma a resposta 401 em erro de sessão', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(null, 401)))

    await expect(listDevices({ token: 'invalido' })).rejects.toMatchObject({
      name: 'ApiError',
      status: 401,
      message: 'Sua sessão expirou. Entre novamente para continuar.',
    })
  })

  it('mantém os erros da API identificáveis pela tela', () => {
    expect(new ApiError('Falha', 400)).toBeInstanceOf(Error)
  })
})
