import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    env: loadEnv('', process.cwd(), ''), // lit le fichier .env
    fileParallelism: false, // les tests HTTP partagent la même base
  },
})
