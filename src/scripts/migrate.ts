import { readdirSync } from 'node:fs'
import { createPool, runSqlFile } from '../db.js'

const pool = createPool()

await pool.query('CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY)')
const res = await pool.query('SELECT name FROM schema_migrations')
const done = res.rows.map((row) => row.name)

for (const file of readdirSync('db/migrations').sort()) {
  if (done.includes(file)) continue
  console.log('migration :', file)
  await runSqlFile(pool, `db/migrations/${file}`)
  await pool.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file])
}

console.log('migrations OK')
await pool.end()
