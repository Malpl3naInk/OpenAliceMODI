import { fetchJson } from './client'

export type InboxKind = 'status' | 'done' | 'blocked' | 'question'

export interface InboxEntry {
  id: string
  ts: number
  workspaceId: string
  workspaceLabel?: string
  text: string
  kind?: InboxKind
}

export interface InboxHistoryResponse {
  entries: InboxEntry[]
  hasMore: boolean
}

export const inboxApi = {
  async history(
    opts: { limit?: number; before?: string; workspaceId?: string } = {},
  ): Promise<InboxHistoryResponse> {
    const qs = new URLSearchParams()
    if (opts.limit != null) qs.set('limit', String(opts.limit))
    if (opts.before) qs.set('before', opts.before)
    if (opts.workspaceId) qs.set('workspaceId', opts.workspaceId)
    return fetchJson(`/api/inbox/history?${qs}`)
  },

  /** Dev-only — appends an inbox entry. The production write path is not
   *  wired yet (see backend route doc). Useful for UI development and
   *  manual smoke tests. */
  async seed(body: { workspaceId: string; workspaceLabel?: string; text: string; kind?: InboxKind }): Promise<{ entry: InboxEntry }> {
    return fetchJson('/api/inbox/seed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  },
}
