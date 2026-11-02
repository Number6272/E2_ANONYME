import { describe, expect, it } from 'vitest'
import { ConflictError } from '../../src/domain/errors.js'
import { checkMaintenance } from '../../src/domain/rules.js'
import type { Room } from '../../src/domain/types.js'

const room4: Room = {
  id: 'room-4',
  name: 'Salle Björk',
  capacity: 3,
  maintenanceStart: new Date('2026-11-05T00:00:00Z'),
  maintenanceEnd: new Date('2026-11-08T00:00:00Z'),
}
const room1: Room = { ...room4, id: 'room-1', maintenanceStart: null, maintenanceEnd: null }
const d = (s: string) => new Date(s)

describe('règle : salle en maintenance', () => {
  it('refuse un créneau pendant la maintenance', () => {
    expect(() => checkMaintenance(room4, d('2026-11-06T14:00:00Z'), d('2026-11-06T16:00:00Z'))).toThrow(ConflictError)
  })

  it('accepte avant et après la maintenance', () => {
    expect(() => checkMaintenance(room4, d('2026-11-04T14:00:00Z'), d('2026-11-04T16:00:00Z'))).not.toThrow()
    expect(() => checkMaintenance(room4, d('2026-11-08T10:00:00Z'), d('2026-11-08T12:00:00Z'))).not.toThrow()
  })

  it('accepte une salle sans maintenance', () => {
    expect(() => checkMaintenance(room1, d('2026-11-06T14:00:00Z'), d('2026-11-06T16:00:00Z'))).not.toThrow()
  })
})
