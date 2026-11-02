import { createPool, runSqlFile } from '../db.js'

const pool = createPool()
await runSqlFile(pool, 'db/seed.sql')
console.log('données de départ insérées')
await pool.end()
