import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { app, pool, post, resetDb } from './setup.js'

beforeEach(resetDb)
afterAll(() => pool.end())

describe('règle : pas de chevauchement (garantie par la base)', () => {
  it('409 si le créneau chevauche booking-1 (room-1, 3 nov. 18 h - 20 h)', async () => {
    const res = await post('room-1', 'member-3', '2026-11-03T19:00:00Z', '2026-11-03T21:00:00Z')
    expect(res.statusCode).toBe(409)
  })

  it('201 si le créneau commence pile à la fin du précédent', async () => {
    const res = await post('room-1', 'member-3', '2026-11-03T20:00:00Z', '2026-11-03T22:00:00Z')
    expect(res.statusCode).toBe(201)
  })

  it('une seule des deux requêtes simultanées passe', async () => {
    const [a, b] = await Promise.all([
      post('room-3', 'member-2', '2026-11-04T14:00:00Z', '2026-11-04T16:00:00Z'),
      post('room-3', 'member-3', '2026-11-04T15:00:00Z', '2026-11-04T17:00:00Z'),
    ])
    expect([a.statusCode, b.statusCode].sort()).toEqual([201, 409])
  })

  it('un créneau annulé peut être réservé à nouveau', async () => {
    await app.inject({ method: 'DELETE', url: '/bookings/booking-1' })
    const res = await post('room-1', 'member-3', '2026-11-03T18:00:00Z', '2026-11-03T20:00:00Z')
    expect(res.statusCode).toBe(201)
  })
})
