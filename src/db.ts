import pg from 'pg'
import { readFileSync } from 'node:fs'

export function createPool(url = process.env.DATABASE_URL) {
  return new pg.Pool({ connectionString: url })
}

export async function runSqlFile(pool: pg.Pool, path: string) {
  const sql = readFileSync(path, 'utf8')
  await pool.query(sql)
}
