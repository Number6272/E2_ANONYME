import { Redis } from 'ioredis'

const valkey = new Redis(process.env.VALKEY_URL ?? 'redis://localhost:6379', {
  enableOfflineQueue: false,
  maxRetriesPerRequest: 0,
})
valkey.on('error', () => {})

export async function getCache(key: string) {
  try {
    return await valkey.get(key)
  } catch {
    return null
  }
}

export async function setCache(key: string, value: string) {
  try {
    await valkey.set(key, value, 'EX', 300)
  } catch {}
}

export async function clearCache(prefix: string) {
  try {
    const keys = await valkey.keys(prefix + '*')
    if (keys.length > 0) await valkey.del(...keys)
  } catch {}
}
