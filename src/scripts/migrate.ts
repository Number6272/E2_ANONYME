import { readdirSync } from 'node:fs'
import { createPool, runSqlFile } from '../db.js'

const pool = createPool()
const files = readdirSync('db/migrations').sort()

for (const file of files) {
  console.log('migration :', file)
  await runSqlFile(pool, `db/migrations/${file}`)
}

console.log('migrations OK')
await pool.end()
