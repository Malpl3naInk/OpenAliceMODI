import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Read the backend web port from `data/config/connectors.json` (single
 * source of truth). Defaults to 3002 — the schema default — if the file
 * doesn't exist yet or is malformed, with a clear warning so contributors
 * notice instead of silently proxying to a stale port.
 *
 * This intentionally does NOT consult `OPENALICE_WEB_PORT` env: that env
 * channel is for guardian → backend at spawn time. Vite is contributor-dev
 * tooling, started independently by the developer, and pairs naturally
 * with `pnpm dev` which reads from the same config file.
 */
function readBackendPort(): number {
  const configPath = resolve(__dirname, '..', 'data', 'config', 'connectors.json')
  try {
    const raw = readFileSync(configPath, 'utf-8')
    const parsed = JSON.parse(raw) as { web?: { port?: number } }
    const port = parsed.web?.port
    if (typeof port === 'number' && port > 0 && port <= 65535) return port
    console.warn(`[vite] ${configPath}: web.port missing or invalid, falling back to 3002`)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.warn(`[vite] could not read ${configPath} (${msg}), falling back to 3002`)
  }
  return 3002
}

const backendPort = readBackendPort()

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Dev server on port 5173 with API proxy to the backend.
  // Backend port is read from `data/config/connectors.json` (web.port) so
  // changing the backend port in one place propagates to Vite automatically.
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: `http://localhost:${backendPort}`,
        // WS upgrade forwarding — required for /api/workspaces/pty.
        ws: true,
      },
    },
  },
  build: {
    // Output lives inside the package (was '../dist/ui' — a leftover from
    // when the UI was bolted on as an afterthought to a Telegram-only
    // engine; cf. memory: linear-vscode-hybrid). Keeping the output inside
    // ui/ lets turbo's default `outputs: ['dist/**']` track it correctly
    // and eliminates the "rm -rf dist → dist/ui never rebuilds" footgun.
    outDir: 'dist',
    emptyOutDir: true,
  },
})
