import { describe, it, expect, beforeEach } from 'vitest'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  createInboxStore,
  createMemoryInboxStore,
  type IInboxStore,
  type InboxEntry,
} from './inbox-store.js'

describe('InboxStore (in-memory)', () => {
  let store: IInboxStore

  beforeEach(() => {
    store = createMemoryInboxStore()
  })

  it('append assigns id + ts and returns the entry', async () => {
    const before = Date.now()
    const entry = await store.append({
      workspaceId: 'ws-1',
      workspaceLabel: 'chat-with-kimi',
      text: 'hello',
      kind: 'status',
    })
    expect(entry.id).toMatch(/^[0-9a-f-]{36}$/)
    expect(entry.workspaceId).toBe('ws-1')
    expect(entry.workspaceLabel).toBe('chat-with-kimi')
    expect(entry.text).toBe('hello')
    expect(entry.kind).toBe('status')
    expect(entry.ts).toBeGreaterThanOrEqual(before)
  })

  it('append rejects missing workspaceId', async () => {
    await expect(
      // @ts-expect-error — exercising runtime guard
      store.append({ text: 'orphan' }),
    ).rejects.toThrow(/workspaceId is required/)
  })

  it('read returns entries newest-first', async () => {
    await store.append({ workspaceId: 'ws-1', text: 'first' })
    await store.append({ workspaceId: 'ws-1', text: 'second' })
    await store.append({ workspaceId: 'ws-1', text: 'third' })
    const { entries, hasMore } = await store.read()
    expect(entries.map((e) => e.text)).toEqual(['third', 'second', 'first'])
    expect(hasMore).toBe(false)
  })

  it('read respects limit and reports hasMore', async () => {
    for (let i = 0; i < 5; i++) await store.append({ workspaceId: 'ws-1', text: `n${i}` })
    const { entries, hasMore } = await store.read({ limit: 3 })
    expect(entries.map((e) => e.text)).toEqual(['n4', 'n3', 'n2'])
    expect(hasMore).toBe(true)
  })

  it('read filters by workspaceId', async () => {
    await store.append({ workspaceId: 'ws-a', text: 'a1' })
    await store.append({ workspaceId: 'ws-b', text: 'b1' })
    await store.append({ workspaceId: 'ws-a', text: 'a2' })
    const { entries } = await store.read({ workspaceId: 'ws-a' })
    expect(entries.map((e) => e.text)).toEqual(['a2', 'a1'])
  })

  it('read uses `before` cursor to paginate older', async () => {
    const e1 = await store.append({ workspaceId: 'ws-1', text: 'first' })
    const e2 = await store.append({ workspaceId: 'ws-1', text: 'second' })
    const e3 = await store.append({ workspaceId: 'ws-1', text: 'third' })
    const { entries } = await store.read({ before: e3.id, limit: 100 })
    expect(entries.map((e) => e.id)).toEqual([e2.id, e1.id])
  })

  it('onAppended fires on append, dispose stops further notifications', async () => {
    const seen: InboxEntry[] = []
    const dispose = store.onAppended((e) => seen.push(e))
    await store.append({ workspaceId: 'ws-1', text: 'a' })
    await store.append({ workspaceId: 'ws-1', text: 'b' })
    expect(seen).toHaveLength(2)
    dispose()
    await store.append({ workspaceId: 'ws-1', text: 'c' })
    expect(seen).toHaveLength(2)
  })

  it('multiple subscribers all receive events', async () => {
    const a: string[] = []
    const b: string[] = []
    store.onAppended((e) => a.push(e.text))
    store.onAppended((e) => b.push(e.text))
    await store.append({ workspaceId: 'ws-1', text: 'x' })
    expect(a).toEqual(['x'])
    expect(b).toEqual(['x'])
  })
})

describe('InboxStore (JSONL persistence)', () => {
  let dir: string
  let path: string
  let store: IInboxStore

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'oa-inbox-'))
    path = join(dir, 'entries.jsonl')
    store = createInboxStore({ filePath: path })
  })

  it('persists across new store instances on the same file', async () => {
    await store.append({ workspaceId: 'ws-1', text: 'persisted', kind: 'done' })
    const fresh = createInboxStore({ filePath: path })
    const { entries } = await fresh.read()
    expect(entries).toHaveLength(1)
    expect(entries[0].text).toBe('persisted')
    expect(entries[0].workspaceId).toBe('ws-1')
    expect(entries[0].kind).toBe('done')
    await rm(dir, { recursive: true, force: true })
  })

  it('returns empty when file does not exist', async () => {
    const missing = createInboxStore({ filePath: join(dir, 'absent.jsonl') })
    const { entries, hasMore } = await missing.read()
    expect(entries).toEqual([])
    expect(hasMore).toBe(false)
    await rm(dir, { recursive: true, force: true })
  })
})
