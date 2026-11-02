import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { getCache } from '../../src/cache.js'
import { app, pool, post, resetDb } from './setup.js'

const planning = '/rooms/room-1/bookings?from=2026-11-02T00:00:00Z&to=2026-11-09T00:00:00Z'
const key = 'planning:room-1:2026-11-02T00:00:00.000Z:2026-11-09T00:00:00.000Z'

beforeEach(resetDb)
afterAll(() => pool.end())

describe('cache Valkey du planning', () => {
  it('le planning est mis en cache', async () => {
    await app.inject({ url: planning })
    expect(await getCache(key)).not.toBeNull()
  })

  it('une réservation apparaît tout de suite', async () => {
    expect((await app.inject({ url: planning })).json()).toHaveLength(1)
    await post('room-1', 'member-3', '2026-11-04T14:00:00Z', '2026-11-04T16:00:00Z')
    expect((await app.inject({ url: planning })).json()).toHaveLength(2)
  })

  it('une annulation disparaît tout de suite', async () => {
    expect((await app.inject({ url: planning })).json()).toHaveLength(1)
    await app.inject({ method: 'DELETE', url: '/bookings/booking-1' })
    expect((await app.inject({ url: planning })).json()).toHaveLength(0)
  })
})
