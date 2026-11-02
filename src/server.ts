import { makeService } from './app/service.js'
import { systemClock } from './clock.js'
import { createPool } from './db.js'
import { buildApp } from './http/routes.js'

const pool = createPool()
const service = makeService(pool, systemClock)
const app = buildApp(service)

await app.listen({ port: 3000 })
console.log('API sur http://localhost:3000')
