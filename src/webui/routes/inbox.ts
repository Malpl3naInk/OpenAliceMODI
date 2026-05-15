/**
 * Inbox HTTP route — read history + dev-only seed.
 *
 *   GET  /history?limit=&before=&workspaceId=   paginated, newest-first
 *   POST /seed                                  dev-only: append an entry
 *
 * The UI polls /history every 20s (mirrors notifications). The production
 * write path is deliberately not wired yet — Inbox v0 is a UI-shaped
 * commitment; the integration question (MCP tool from workspace? webhook?
 * something else?) is parked until product direction is decided. /seed
 * exists as a manual test entry point and will be removed once a real
 * writer lands.
 */
import { Hono } from 'hono'
import type { IInboxStore, InboxKind } from '../../core/inbox-store.js'

const VALID_KINDS: ReadonlySet<InboxKind> = new Set(['status', 'done', 'blocked', 'question'])

export interface InboxRoutesDeps {
  inboxStore: IInboxStore
}

export function createInboxRoutes(deps: InboxRoutesDeps) {
  const app = new Hono()

  app.get('/history', async (c) => {
    const limit = Number(c.req.query('limit')) || 100
    const before = c.req.query('before') || undefined
    const workspaceId = c.req.query('workspaceId') || undefined
    const result = await deps.inboxStore.read({ limit, before, workspaceId })
    return c.json(result)
  })

  app.post('/seed', async (c) => {
    let body: unknown
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: 'invalid json' }, 400)
    }
    const b = body as Partial<{
      workspaceId: string
      workspaceLabel: string
      text: string
      kind: string
    }>
    if (!b.workspaceId || typeof b.workspaceId !== 'string') {
      return c.json({ error: 'workspaceId required' }, 400)
    }
    if (!b.text || typeof b.text !== 'string') {
      return c.json({ error: 'text required' }, 400)
    }
    const kind = b.kind && VALID_KINDS.has(b.kind as InboxKind) ? (b.kind as InboxKind) : undefined
    try {
      const entry = await deps.inboxStore.append({
        workspaceId: b.workspaceId,
        workspaceLabel: typeof b.workspaceLabel === 'string' ? b.workspaceLabel : undefined,
        text: b.text,
        kind,
      })
      return c.json({ entry })
    } catch (err) {
      return c.json({ error: String(err) }, 500)
    }
  })

  return app
}
