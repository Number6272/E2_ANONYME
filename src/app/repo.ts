import type pg from 'pg'
import type { Booking, Room } from '../domain/types.js'

type Db = pg.Pool | pg.PoolClient

function toRoom(row: any): Room {
  return {
    id: row.id,
    name: row.name,
    capacity: row.capacity,
    maintenanceStart: row.maintenance_start,
    maintenanceEnd: row.maintenance_end,
  }
}

function toBooking(row: any): Booking {
  return {
    id: row.id,
    roomId: row.room_id,
    memberId: row.member_id,
    start: row.start_at,
    end: row.end_at,
    status: row.status,
  }
}

export async function findRooms(db: Db) {
  const res = await db.query('SELECT * FROM rooms ORDER BY id')
  return res.rows.map(toRoom)
}

export async function findRoom(db: Db, id: string) {
  const res = await db.query('SELECT * FROM rooms WHERE id = $1', [id])
  return res.rows[0] ? toRoom(res.rows[0]) : null
}

// FOR UPDATE : verrouille le membre jusqu'à la fin de la transaction
export async function lockMember(db: Db, id: string) {
  const res = await db.query('SELECT id FROM members WHERE id = $1 FOR UPDATE', [id])
  return res.rows.length > 0
}

export async function memberExists(db: Db, id: string) {
  const res = await db.query('SELECT id FROM members WHERE id = $1', [id])
  return res.rows.length > 0
}

export async function countUpcoming(db: Db, memberId: string, now: Date) {
  const res = await db.query(
    `SELECT count(*)::int AS n FROM bookings
     WHERE member_id = $1 AND status = 'confirmed' AND start_at > $2`,
    [memberId, now],
  )
  return res.rows[0].n as number
}

export async function insertBooking(db: Db, roomId: string, memberId: string, start: Date, end: Date) {
  const res = await db.query(
    `INSERT INTO bookings (room_id, member_id, start_at, end_at)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [roomId, memberId, start, end],
  )
  return toBooking(res.rows[0])
}

export async function findBooking(db: Db, id: string, lock = false) {
  const sql = 'SELECT * FROM bookings WHERE id = $1' + (lock ? ' FOR UPDATE' : '')
  const res = await db.query(sql, [id])
  return res.rows[0] ? toBooking(res.rows[0]) : null
}

export async function updateStatus(db: Db, id: string, status: string, now: Date) {
  await db.query('UPDATE bookings SET status = $2, cancelled_at = $3 WHERE id = $1', [id, status, now])
}

// Planning d'une salle : réservations confirmées qui touchent [from, to)
export async function findRoomBookings(db: Db, roomId: string, from: Date, to: Date) {
  const res = await db.query(
    `SELECT * FROM bookings
     WHERE room_id = $1 AND status = 'confirmed' AND start_at < $3 AND end_at > $2
     ORDER BY start_at`,
    [roomId, from, to],
  )
  return res.rows.map(toBooking)
}

export async function findMemberBookings(db: Db, memberId: string) {
  const res = await db.query('SELECT * FROM bookings WHERE member_id = $1 ORDER BY start_at', [memberId])
  return res.rows.map(toBooking)
}
