/**
 * TraderHub client — the hosted-boards seam.
 *
 * The hub (https://traderhub.openalice.ai, self-hostable via baseUrl) serves
 * the same reference contract this module builds locally, but with its own
 * upstream keys and caching. Resolution order per board:
 *
 *   hub (enabled + reachable) → local build (user's own keys) → loud error
 *
 * The hub is a convenience layer, never a correctness dependency: with it
 * disabled or down, behavior is exactly the pre-hub behavior. meta.origin
 * says which path served — loud, never silent.
 *
 * Security boundary: hub responses are DATA only. Shape-checked, never
 * interpreted as configuration or instructions.
 */

import type { ReferenceMeta } from './types.js'

export interface HubConfig {
  enabled: boolean
  baseUrl: string
}

/** Official hosted hub. Overridable via marketData.hub.baseUrl. */
export const DEFAULT_HUB_URL = 'https://traderhub.openalice.ai'

const TIMEOUT_MS = 5_000
/** After a failure, skip the hub for this long — one timeout is annoying,
 *  paying it on every board load is a tax. */
const BREAKER_MS = 60_000

export type HubFetcher = <T extends { meta: ReferenceMeta }>(board: string) => Promise<T | null>

/** Returns null when the hub is disabled, open-circuited, unreachable, or
 *  returns a non-contract shape — the caller falls through to local. */
export function createHubFetcher(cfg: HubConfig | undefined, opts?: { timeoutMs?: number; breakerMs?: number }): HubFetcher {
  const timeoutMs = opts?.timeoutMs ?? TIMEOUT_MS
  const breakerMs = opts?.breakerMs ?? BREAKER_MS
  let downUntil = 0

  return async function hubBoard<T extends { meta: ReferenceMeta }>(board: string): Promise<T | null> {
    if (!cfg?.enabled || !cfg.baseUrl) return null
    if (Date.now() < downUntil) return null
    try {
      const res = await fetch(`${cfg.baseUrl.replace(/\/$/, '')}/api/reference/${board}`, {
        signal: AbortSignal.timeout(timeoutMs),
        headers: { Accept: 'application/json' },
      })
      if (!res.ok) throw new Error(`hub returned ${res.status}`)
      const data: unknown = await res.json()
      if (!data || typeof data !== 'object' || !('meta' in data)) {
        throw new Error('hub returned a non-contract shape')
      }
      const payload = data as T
      return { ...payload, meta: { ...payload.meta, origin: 'hub' as const } }
    } catch {
      downUntil = Date.now() + breakerMs
      return null
    }
  }
}

/** Stamp a locally-built board so the origin is always explicit. */
export function markLocal<T extends { meta: ReferenceMeta }>(board: T): T {
  return { ...board, meta: { ...board.meta, origin: 'local' as const } }
}
