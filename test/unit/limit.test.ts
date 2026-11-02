import { describe, expect, it } from 'vitest'
import { ConflictError } from '../../src/domain/errors.js'
import { checkLimit } from '../../src/domain/rules.js'

describe('règle : au plus 2 réservations à venir', () => {
  it('accepte avec 0 ou 1 réservation à venir', () => {
    expect(() => checkLimit(0)).not.toThrow()
    expect(() => checkLimit(1)).not.toThrow()
  })

  it('refuse avec 2 réservations à venir', () => {
    expect(() => checkLimit(2)).toThrow(ConflictError)
  })
})
