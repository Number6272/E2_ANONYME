import Fastify from 'fastify'
import type { Service } from '../app/service.js'
import { BadRequestError, ConflictError, NotFoundError } from '../domain/errors.js'
import type { Booking, Room } from '../domain/types.js'

// "2026-11-04T14:00:00.000Z" -> "2026-11-04T14:00:00Z"
function iso(date: Date) {
  return date.toISOString().replace('.000Z', 'Z')
}

function toJson(b: Booking) {
  return {
    id: b.id,
    roomId: b.roomId,
    memberId: b.memberId,
    start: iso(b.start),
    end: iso(b.end),
    status: b.status,
  }
}

function roomJson(r: Room) {
  return {
    id: r.id,
    name: r.name,
    capacity: r.capacity,
    maintenanceStart: r.maintenanceStart ? iso(r.maintenanceStart) : null,
    maintenanceEnd: r.maintenanceEnd ? iso(r.maintenanceEnd) : null,
  }
}

function parseDate(value: unknown) {
  const date = new Date(String(value))
  if (typeof value !== 'string' || isNaN(date.getTime())) {
    throw new BadRequestError('date invalide : ' + value)
  }
  return date
}

export function buildApp(service: Service) {
  const app = Fastify()

  // Erreur du domaine -> code HTTP
  app.setErrorHandler((error: any, _req, reply) => {
    if (error instanceof BadRequestError) return reply.code(400).send({ error: error.message })
    if (error instanceof NotFoundError) return reply.code(404).send({ error: error.message })
    if (error instanceof ConflictError) return reply.code(409).send({ error: error.message })
    if (error.statusCode === 400) return reply.code(400).send({ error: error.message }) // JSON mal formé
    console.error(error)
    return reply.code(500).send({ error: 'erreur serveur' })
  })

  app.get('/rooms', async () => {
    const rooms = await service.listRooms()
    return rooms.map(roomJson)
  })

  app.get('/rooms/:id/bookings', async (req) => {
    const { id } = req.params as { id: string }
    const { from, to } = req.query as { from?: string; to?: string }
    const bookings = await service.listRoomBookings(id, parseDate(from), parseDate(to))
    return bookings.map(toJson)
  })

  app.post('/rooms/:id/bookings', async (req, reply) => {
    const { id } = req.params as { id: string }
    const body = (req.body ?? {}) as { memberId?: unknown; start?: unknown; end?: unknown }
    if (typeof body.memberId !== 'string') throw new BadRequestError('memberId manquant')

    const booking = await service.createBooking(id, body.memberId, parseDate(body.start), parseDate(body.end))
    return reply.code(201).header('Location', `/bookings/${booking.id}`).send(toJson(booking))
  })

  app.get('/bookings/:id', async (req) => {
    const { id } = req.params as { id: string }
    return toJson(await service.getBooking(id))
  })

  app.delete('/bookings/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    await service.cancelBooking(id)
    return reply.code(204).send()
  })

  app.get('/members/:id/bookings', async (req) => {
    const { id } = req.params as { id: string }
    const bookings = await service.listMemberBookings(id)
    return bookings.map(toJson)
  })

  return app
}
