import { describe, expect, it } from 'vitest'
import { BadRequestError } from '../../src/domain/errors.js'
import { checkSlot } from '../../src/domain/rules.js'

const d = (s: string) => new Date(s)

describe('règle : créneau de 1 h à 4 h, heure pleine, entre 10 h et 23 h', () => {
  it('accepte 14 h - 16 h', () => {
    expect(() => checkSlot(d('2026-11-04T14:00:00Z'), d('2026-11-04T16:00:00Z'))).not.toThrow()
  })

  it('accepte 10 h - 11 h et 19 h - 23 h (les limites)', () => {
    expect(() => checkSlot(d('2026-11-04T10:00:00Z'), d('2026-11-04T11:00:00Z'))).not.toThrow()
    expect(() => checkSlot(d('2026-11-04T19:00:00Z'), d('2026-11-04T23:00:00Z'))).not.toThrow()
  })

  it('refuse moins de 1 h et plus de 4 h', () => {
    expect(() => checkSlot(d('2026-11-04T14:00:00Z'), d('2026-11-04T14:30:00Z'))).toThrow(BadRequestError)
    expect(() => checkSlot(d('2026-11-04T14:00:00Z'), d('2026-11-04T19:00:00Z'))).toThrow(BadRequestError)
  })

  it('refuse un début qui n\'est pas une heure pleine', () => {
    expect(() => checkSlot(d('2026-11-04T14:30:00Z'), d('2026-11-04T16:30:00Z'))).toThrow(BadRequestError)
  })

  it('refuse avant 10 h et après 23 h', () => {
    expect(() => checkSlot(d('2026-11-04T09:00:00Z'), d('2026-11-04T11:00:00Z'))).toThrow(BadRequestError)
    expect(() => checkSlot(d('2026-11-04T22:00:00Z'), d('2026-11-05T00:00:00Z'))).toThrow(BadRequestError)
  })
})
