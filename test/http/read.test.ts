import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { app, pool, resetDb } from './setup.js'

beforeEach(resetDb)
afterAll(() => pool.end())

describe('routes de lecture', () => {
  it('GET /rooms -> 200 avec 4 salles', async () => {
    const res = await app.inject({ url: '/rooms' })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toHaveLength(4)
  })

  it('GET /rooms/:id/bookings -> 200 avec le planning de la semaine', async () => {
    const res = await app.inject({ url: '/rooms/room-1/bookings?from=2026-11-02T00:00:00Z&to=2026-11-09T00:00:00Z' })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual([
      { id: 'booking-1', roomId: 'room-1', memberId: 'member-1', start: '2026-11-03T18:00:00Z', end: '2026-11-03T20:00:00Z', status: 'confirmed' },
    ])
  })

  it('GET /rooms/:id/bookings -> 400 sans from/to, 404 si salle inconnue', async () => {
    expect((await app.inject({ url: '/rooms/room-1/bookings' })).statusCode).toBe(400)
    expect((await app.inject({ url: '/rooms/room-9/bookings?from=2026-11-02T00:00:00Z&to=2026-11-09T00:00:00Z' })).statusCode).toBe(404)
  })

  it('GET /bookings/:id -> 200 ou 404', async () => {
    expect((await app.inject({ url: '/bookings/booking-1' })).statusCode).toBe(200)
    expect((await app.inject({ url: '/bookings/inconnu' })).statusCode).toBe(404)
  })

  it('GET /members/:id/bookings -> 200 ou 404', async () => {
    const res = await app.inject({ url: '/members/member-1/bookings' })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toHaveLength(2)
    expect((await app.inject({ url: '/members/member-9/bookings' })).statusCode).toBe(404)
  })
})
