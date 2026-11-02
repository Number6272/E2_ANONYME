import { BadRequestError, ConflictError } from './errors.js'
import type { Booking, Room } from './types.js'

const HOUR = 60 * 60 * 1000

// Règle 1 : 1 h à 4 h, heure pleine, entre 10 h et 23 h (UTC)
export function checkSlot(start: Date, end: Date) {
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new BadRequestError('dates invalides')
  }
  const hours = (end.getTime() - start.getTime()) / HOUR
  if (hours < 1 || hours > 4) {
    throw new BadRequestError('un créneau dure de 1 h à 4 h')
  }
  if (start.getTime() % HOUR !== 0) {
    throw new BadRequestError('un créneau commence à une heure pleine')
  }
  const startHour = start.getUTCHours()
  const endHour = startHour + hours
  if (startHour < 10 || endHour > 23) {
    throw new BadRequestError('un créneau est entre 10 h et 23 h')
  }
}

// Règle 3 : au plus 2 réservations à venir
export function checkLimit(upcomingCount: number) {
  if (upcomingCount >= 2) {
    throw new ConflictError('2 réservations à venir maximum')
  }
}

// Règle 5 : pas de réservation pendant une maintenance
export function checkMaintenance(room: Room, start: Date, end: Date) {
  if (!room.maintenanceStart || !room.maintenanceEnd) return
  if (start < room.maintenanceEnd && end > room.maintenanceStart) {
    throw new ConflictError('salle en maintenance')
  }
}

// Règle 4 : statut d'annulation
export function cancelStatus(booking: Booking, now: Date) {
  if (booking.status !== 'confirmed') {
    throw new ConflictError('réservation déjà annulée')
  }
  if (booking.start <= now) {
    throw new ConflictError('réservation déjà commencée')
  }
  const hoursLeft = (booking.start.getTime() - now.getTime()) / HOUR
  return hoursLeft < 24 ? 'late_cancelled' : 'cancelled'
}
