import { describe, expect, it } from 'vitest'
import { ConflictError } from '../../src/domain/errors.js'
import { cancelStatus } from '../../src/domain/rules.js'
import type { Booking } from '../../src/domain/types.js'
import { NOW } from '../clock.js'

function booking(start: string, status: Booking['status'] = 'confirmed'): Booking {
  const s = new Date(start)
  return { id: 'b', roomId: 'room-1', memberId: 'member-1', start: s, end: new Date(s.getTime() + 3600_000), status }
}

describe('règle : annulation (horloge fixe au 2 nov. 2026, 9 h)', () => {
  it('cancelled si le créneau commence dans 24 h ou plus', () => {
    expect(cancelStatus(booking('2026-11-03T09:00:00Z'), NOW)).toBe('cancelled')
    expect(cancelStatus(booking('2026-11-10T14:00:00Z'), NOW)).toBe('cancelled')
  })

  it('late_cancelled si le créneau commence dans moins de 24 h', () => {
    expect(cancelStatus(booking('2026-11-02T19:00:00Z'), NOW)).toBe('late_cancelled')
  })

  it('refuse une réservation déjà annulée', () => {
    expect(() => cancelStatus(booking('2026-11-10T14:00:00Z', 'cancelled'), NOW)).toThrow(ConflictError)
    expect(() => cancelStatus(booking('2026-11-10T14:00:00Z', 'late_cancelled'), NOW)).toThrow(ConflictError)
  })

  it('refuse une réservation déjà commencée', () => {
    expect(() => cancelStatus(booking('2026-10-28T19:00:00Z'), NOW)).toThrow(ConflictError)
  })
})
