import pg from 'pg'
import { readFileSync } from 'node:fs'

export function createPool(url = process.env.DATABASE_URL) {
  return new pg.Pool({ connectionString: url })
}

export async function runSqlFile(pool: pg.Pool, path: string) {
  const sql = readFileSync(path, 'utf8')
  await pool.query(sql)
}

// Exécute fn dans une transaction : COMMIT si tout va bien, ROLLBACK sinon
export async function transaction<T>(pool: pg.Pool, fn: (client: pg.PoolClient) => Promise<T>) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}
