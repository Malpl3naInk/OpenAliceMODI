import { useEffect } from 'react'
import { PageHeader } from '../components/PageHeader'
import { inboxLive } from '../live/inbox'
import { useInboxRead } from '../live/inbox-read'
import { useInboxSelection } from '../live/inbox-selection'
import type { InboxEntry, InboxKind } from '../api/inbox'

const KIND_COLORS: Record<InboxKind, string> = {
  status: 'bg-accent/15 text-accent',
  done: 'bg-green/15 text-green',
  blocked: 'bg-red/15 text-red',
  question: 'bg-amber-500/15 text-amber-400',
}

const KIND_LABELS: Record<InboxKind, string> = {
  status: 'Status',
  done: 'Done',
  blocked: 'Blocked',
  question: 'Question',
}

interface InboxPageProps {
  visible: boolean
}

/**
 * Inbox detail pane — rendered in the editor area. The list lives in
 * `InboxSidebar` (Chat-sidebar-shape); selecting a row in the sidebar
 * updates `useInboxSelection`, which this component watches.
 *
 * Default-select-latest is handled by the sidebar (it owns the list);
 * this component just reflects whatever is selected. When nothing is
 * selected it shows an empty state.
 *
 * Mark-read: when this pane becomes visible AND there's a selection,
 * mark all newer-than-the-latest entries read. Mirrors the
 * NotificationsInboxPage timing.
 */
export function InboxPage({ visible }: InboxPageProps) {
  const entries = inboxLive.useStore((s) => s.entries)
  const loading = inboxLive.useStore((s) => s.loading)
  const selectedId = useInboxSelection((s) => s.selectedEntryId)
  const markAllRead = useInboxRead((s) => s.markAllRead)
  const lastSeen = useInboxRead((s) => s.lastSeenTs)

  useEffect(() => {
    if (visible && entries.length > 0) markAllRead()
  }, [visible, entries.length, markAllRead])

  const selected = entries.find((e) => e.id === selectedId) ?? null

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <PageHeader
        title="Inbox"
        description={`${entries.length} total · workspace status updates`}
      />
      <div className="flex-1 overflow-y-auto min-h-0">
        {loading && entries.length === 0 ? (
          <div className="px-6 py-8 text-text-muted text-sm">Loading…</div>
        ) : entries.length === 0 ? (
          <EmptyState />
        ) : !selected ? (
          <div className="px-6 py-8 text-text-muted text-sm">
            Select an entry from the sidebar.
          </div>
        ) : (
          <Detail entry={selected} unread={selected.ts > lastSeen} />
        )}
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="px-6 py-16 text-center max-w-[520px] mx-auto">
      <div className="text-[15px] text-text mb-2">No inbox messages yet</div>
      <p className="text-[13px] text-text-muted leading-relaxed">
        Workspaces will push status updates here as they work — finished
        analysis, blocked tasks, questions back to you. The integration
        path is still being designed; for now you can seed entries via
        <code className="mx-1 px-1 py-0.5 rounded bg-bg-tertiary text-[11px]">POST /api/inbox/seed</code>
        for testing.
      </p>
    </div>
  )
}

function Detail({ entry, unread }: { entry: InboxEntry; unread: boolean }) {
  return (
    <div className="max-w-[820px] mx-auto py-6 px-4 md:px-8">
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="text-[13px] font-medium text-text">
          {entry.workspaceLabel ?? entry.workspaceId}
        </span>
        {entry.kind && (
          <span className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded ${KIND_COLORS[entry.kind]}`}>
            {KIND_LABELS[entry.kind]}
          </span>
        )}
        {unread && (
          <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-accent/15 text-accent">
            New
          </span>
        )}
        <span className="text-[11px] text-text-muted/70 tabular-nums ml-auto">
          {formatAbsolute(entry.ts)}
          <span className="mx-1.5 text-text-muted/40">·</span>
          {formatRelative(entry.ts)}
        </span>
      </div>

      <div className="text-[13px] text-text whitespace-pre-wrap break-words leading-relaxed border-t border-border pt-4">
        {entry.text}
      </div>

      <div className="mt-6 flex items-center gap-2 text-[12px] text-text-muted">
        <span className="font-mono text-text-muted/60">workspace: {entry.workspaceId}</span>
      </div>
    </div>
  )
}

function formatAbsolute(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatRelative(ts: number): string {
  const diff = Date.now() - ts
  if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return `${Math.floor(diff / 86_400_000)}d ago`
}
