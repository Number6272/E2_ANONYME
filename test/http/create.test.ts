import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { app, pool, post, resetDb } from './setup.js'

beforeEach(resetDb)
afterAll(() => pool.end())

describe('POST /rooms/:id/bookings', () => {
  it('201 + Location', async () => {
    const res = await post('room-1', 'member-3', '2026-11-04T14:00:00Z', '2026-11-04T16:00:00Z')
    expect(res.statusCode).toBe(201)
    expect(res.headers.location).toBe(`/bookings/${res.json().id}`)
    expect(res.json()).toMatchObject({ roomId: 'room-1', memberId: 'member-3', status: 'confirmed' })
  })

  it('400 si le créneau est invalide ou le JSON incomplet', async () => {
    expect((await post('room-1', 'member-3', '2026-11-04T14:30:00Z', '2026-11-04T16:00:00Z')).statusCode).toBe(400)
    const res = await app.inject({ method: 'POST', url: '/rooms/room-1/bookings', payload: { memberId: 'member-3' } })
    expect(res.statusCode).toBe(400)
  })

  it('404 si la salle ou le membre est inconnu', async () => {
    expect((await post('room-9', 'member-3', '2026-11-04T14:00:00Z', '2026-11-04T16:00:00Z')).statusCode).toBe(404)
    expect((await post('room-1', 'member-9', '2026-11-04T14:00:00Z', '2026-11-04T16:00:00Z')).statusCode).toBe(404)
  })

  it('409 si member-1 a déjà 2 réservations à venir', async () => {
    const res = await post('room-2', 'member-1', '2026-11-04T14:00:00Z', '2026-11-04T16:00:00Z')
    expect(res.statusCode).toBe(409)
  })

  it('409 si la salle est en maintenance', async () => {
    const res = await post('room-4', 'member-3', '2026-11-06T14:00:00Z', '2026-11-06T16:00:00Z')
    expect(res.statusCode).toBe(409)
  })
})
