import type pg from 'pg'
import { clearCache, getCache, setCache } from '../cache.js'
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
    const key = `planning:${roomId}:${from.toISOString()}:${to.toISOString()}`
    const cached = await getCache(key)
    if (cached) {
      return JSON.parse(cached).map((b: any) => ({ ...b, start: new Date(b.start), end: new Date(b.end) }))
    }

    const room = await repo.findRoom(pool, roomId)
    if (!room) throw new NotFoundError('salle inconnue')
    const bookings = await repo.findRoomBookings(pool, roomId, from, to)
    await setCache(key, JSON.stringify(bookings))
    return bookings
  }

  async function createBooking(roomId: string, memberId: string, start: Date, end: Date) {
    checkSlot(start, end)

    try {
      const booking = await transaction(pool, async (client) => {
        const room = await repo.findRoom(client, roomId)
        if (!room) throw new NotFoundError('salle inconnue')

        const memberFound = await repo.lockMember(client, memberId)
        if (!memberFound) throw new NotFoundError('membre inconnu')

        checkMaintenance(room, start, end)
        checkLimit(await repo.countUpcoming(client, memberId, clock()))

        return repo.insertBooking(client, roomId, memberId, start, end)
      })
      await clearCache(`planning:${roomId}:`)
      return booking
    } catch (error: any) {
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
    const booking = await transaction(pool, async (client) => {
      const booking = await repo.findBooking(client, id, true)
      if (!booking) throw new NotFoundError('réservation inconnue')

      const now = clock()
      const status = cancelStatus(booking, now)
      await repo.updateStatus(client, id, status, now)
      return booking
    })
    await clearCache(`planning:${booking.roomId}:`)
  }

  async function listMemberBookings(memberId: string) {
    if (!(await repo.memberExists(pool, memberId))) throw new NotFoundError('membre inconnu')
    return repo.findMemberBookings(pool, memberId)
  }

  return { listRooms, listRoomBookings, createBooking, getBooking, cancelBooking, listMemberBookings }
}
