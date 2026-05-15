/**
 * InboxStore — workspace-scoped push surface. Parallel to NotificationsStore
 * but explicitly built for the workspace era: every entry is anchored to a
 * `workspaceId`, treating the inbox as "agent (employee) → user about
 * workspace (issue) progress" — Linear-inbox style.
 *
 * Why parallel to NotificationsStore instead of extending it: the older
 * store carries pre-workspace assumptions (heartbeat / cron / manual sources,
 * ConnectorCenter lastInteraction coupling, Telegram inline-on-active). Wiring
 * inbox semantics through that would require either widening NotificationSource
 * with a workspace-shaped sentinel and bolting on workspaceId everywhere, or
 * a backwards-compat shim that papers over the conflation. New track is
 * cheaper; old track stays in place serving its existing users and quietly
 * retires when the workspace surface absorbs its remaining use cases.
 *
 * v0 contract: append-only, single JSONL at `data/inbox/entries.jsonl`,
 * `workspaceId` is required (no manual / sentinel-workspace entries — keeps
 * the inbox semantically clean from day one). No connector subscription,
 * no outputGate, no dedup. The write side is deliberately left without a
 * production caller in v0 — only a dev `/seed` HTTP endpoint exists — until
 * the workspace integration pathway is decided.
 */

import { randomUUID } from 'node:crypto'
import { readFile, appendFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { EventEmitter } from 'node:events'

export type InboxKind = 'status' | 'done' | 'blocked' | 'question'

export interface InboxInput {
  workspaceId: string
  /** Display snapshot of the workspace label at write time. Optional because
   *  the writer may not always have it; readers fall back to workspaceId. */
  workspaceLabel?: string
  text: string
  kind?: InboxKind
}

export interface InboxEntry extends InboxInput {
  id: string
  ts: number
}

export interface InboxReadOpts {
  /** Newest-first slice limit. Default 100. */
  limit?: number
  /** Cursor — return entries strictly older than this id. */
  before?: string
  /** Filter by workspace. */
  workspaceId?: string
}

export interface IInboxStore {
  append(input: InboxInput): Promise<InboxEntry>
  /** Returns entries newest-first up to `limit`. Empty array when file is missing. */
  read(opts?: InboxReadOpts): Promise<{ entries: InboxEntry[]; hasMore: boolean }>
  /** Subscribe to live appends. Returns a dispose function. */
  onAppended(listener: (entry: InboxEntry) => void): () => void
}

const INBOX_FILE = join(process.cwd(), 'data', 'inbox', 'entries.jsonl')

// ==================== JSONL store ====================

export interface InboxStoreOptions {
  /** Override the on-disk path; default `data/inbox/entries.jsonl`. */
  filePath?: string
}

export function createInboxStore(opts: InboxStoreOptions = {}): IInboxStore {
  const filePath = opts.filePath ?? INBOX_FILE
  const emitter = new EventEmitter()
  emitter.setMaxListeners(50)

  async function append(input: InboxInput): Promise<InboxEntry> {
    if (!input.workspaceId) {
      throw new Error('InboxStore.append: workspaceId is required')
    }
    const entry: InboxEntry = {
      ...input,
      id: randomUUID(),
      ts: Date.now(),
    }
    await mkdir(dirname(filePath), { recursive: true })
    await appendFile(filePath, JSON.stringify(entry) + '\n')
    emitter.emit('appended', entry)
    return entry
  }

  async function read(opts: InboxReadOpts = {}): Promise<{ entries: InboxEntry[]; hasMore: boolean }> {
    let raw: string
    try {
      raw = await readFile(filePath, 'utf-8')
    } catch (err: unknown) {
      if (err instanceof Error && 'code' in err && (err as NodeJS.ErrnoException).code === 'ENOENT') {
        return { entries: [], hasMore: false }
      }
      throw err
    }

    let all = raw
      .split('\n')
      .filter((l) => l.trim())
      .map((l) => JSON.parse(l) as InboxEntry)

    if (opts.workspaceId) {
      all = all.filter((e) => e.workspaceId === opts.workspaceId)
    }

    let scoped = all
    if (opts.before) {
      const idx = all.findIndex((e) => e.id === opts.before)
      scoped = idx >= 0 ? all.slice(0, idx) : []
    }

    const limit = opts.limit ?? 100
    const window = scoped.slice(-limit)
    const entries = [...window].reverse()
    const hasMore = window.length < scoped.length
    return { entries, hasMore }
  }

  function onAppended(listener: (entry: InboxEntry) => void): () => void {
    emitter.on('appended', listener)
    return () => {
      emitter.off('appended', listener)
    }
  }

  return { append, read, onAppended }
}

// ==================== In-memory store (tests) ====================

export function createMemoryInboxStore(): IInboxStore {
  const entries: InboxEntry[] = []
  const emitter = new EventEmitter()
  emitter.setMaxListeners(50)

  async function append(input: InboxInput): Promise<InboxEntry> {
    if (!input.workspaceId) {
      throw new Error('InboxStore.append: workspaceId is required')
    }
    const entry: InboxEntry = {
      ...input,
      id: randomUUID(),
      ts: Date.now(),
    }
    entries.push(entry)
    emitter.emit('appended', entry)
    return entry
  }

  async function read(opts: InboxReadOpts = {}): Promise<{ entries: InboxEntry[]; hasMore: boolean }> {
    let scoped = opts.workspaceId ? entries.filter((e) => e.workspaceId === opts.workspaceId) : entries
    if (opts.before) {
      const idx = scoped.findIndex((e) => e.id === opts.before)
      scoped = idx >= 0 ? scoped.slice(0, idx) : []
    }
    const limit = opts.limit ?? 100
    const window = scoped.slice(-limit)
    return { entries: [...window].reverse(), hasMore: window.length < scoped.length }
  }

  function onAppended(listener: (entry: InboxEntry) => void): () => void {
    emitter.on('appended', listener)
    return () => {
      emitter.off('appended', listener)
    }
  }

  return { append, read, onAppended }
}
