import type pg from 'pg'
import type { Clock } from '../clock.js'
import { transaction } from '../db.js'
import { ConflictError, NotFoundError } from '../domain/errors.js'
import { cancelStatus, checkLimit, checkMaintenance, checkSlot } from '../domain/rules.js'
import * as repo from './repo.js'

export type Service = ReturnType<typeof makeService>

export function makeService(pool: pg.Pool, clock: Clock) {
  async function listRooms() {
    return repo.findRooms(pool)
  }

  async function listRoomBookings(roomId: string, from: Date, to: Date) {
    const room = await repo.findRoom(pool, roomId)
    if (!room) throw new NotFoundError('salle inconnue')
    return repo.findRoomBookings(pool, roomId, from, to)
  }

  async function createBooking(roomId: string, memberId: string, start: Date, end: Date) {
    checkSlot(start, end)

    try {
      return await transaction(pool, async (client) => {
        const room = await repo.findRoom(client, roomId)
        if (!room) throw new NotFoundError('salle inconnue')

        const memberFound = await repo.lockMember(client, memberId)
        if (!memberFound) throw new NotFoundError('membre inconnu')

        checkMaintenance(room, start, end)
        checkLimit(await repo.countUpcoming(client, memberId, clock()))

        return repo.insertBooking(client, roomId, memberId, start, end)
      })
    } catch (error: any) {
      // 23P01 = violation de la contrainte no_overlap
      if (error.code === '23P01') throw new ConflictError('créneau déjà réservé')
      throw error
    }
  }

  async function getBooking(id: string) {
    const booking = await repo.findBooking(pool, id)
    if (!booking) throw new NotFoundError('réservation inconnue')
    return booking
  }

  async function cancelBooking(id: string) {
    return transaction(pool, async (client) => {
      const booking = await repo.findBooking(client, id, true)
      if (!booking) throw new NotFoundError('réservation inconnue')

      const now = clock()
      const status = cancelStatus(booking, now)
      await repo.updateStatus(client, id, status, now)
    })
  }

  async function listMemberBookings(memberId: string) {
    if (!(await repo.memberExists(pool, memberId))) throw new NotFoundError('membre inconnu')
    return repo.findMemberBookings(pool, memberId)
  }

  return { listRooms, listRoomBookings, createBooking, getBooking, cancelBooking, listMemberBookings }
}
