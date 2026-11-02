import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { app, pool, resetDb } from './setup.js'

beforeEach(resetDb)
afterAll(() => pool.end())

describe('DELETE /bookings/:id', () => {
  it('204 et statut cancelled (plus de 24 h avant)', async () => {
    expect((await app.inject({ method: 'DELETE', url: '/bookings/booking-2' })).statusCode).toBe(204)
    expect((await app.inject({ url: '/bookings/booking-2' })).json().status).toBe('cancelled')
  })

  it('204 et statut late_cancelled (moins de 24 h avant)', async () => {
    expect((await app.inject({ method: 'DELETE', url: '/bookings/booking-3' })).statusCode).toBe(204)
    expect((await app.inject({ url: '/bookings/booking-3' })).json().status).toBe('late_cancelled')
  })

  it('409 si on annule deux fois, 404 si inconnue', async () => {
    await app.inject({ method: 'DELETE', url: '/bookings/booking-2' })
    expect((await app.inject({ method: 'DELETE', url: '/bookings/booking-2' })).statusCode).toBe(409)
    expect((await app.inject({ method: 'DELETE', url: '/bookings/inconnu' })).statusCode).toBe(404)
  })
})
