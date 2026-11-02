import { makeService } from '../../src/app/service.js'
import { createPool, runSqlFile } from '../../src/db.js'
import { buildApp } from '../../src/http/routes.js'
import { fixedClock } from '../clock.js'

export const pool = createPool()
export const app = buildApp(makeService(pool, fixedClock))

// Chaque test repart des données de départ
export async function resetDb() {
  await pool.query('TRUNCATE bookings, members, rooms')
  await runSqlFile(pool, 'db/seed.sql')
}

export function post(roomId: string, memberId: string, start: string, end: string) {
  return app.inject({ method: 'POST', url: `/rooms/${roomId}/bookings`, payload: { memberId, start, end } })
}
