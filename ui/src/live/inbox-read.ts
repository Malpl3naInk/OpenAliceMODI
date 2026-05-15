import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { inboxLive } from './inbox'

interface InboxReadState {
  /** Wall-clock ms of the latest inbox entry the user has seen. */
  lastSeenTs: number
}

interface InboxReadActions {
  markAllRead: () => void
}

/**
 * Tracks "latest inbox entry timestamp the user has acknowledged."
 * Combined with `inboxLive.entries` this yields an unread count without
 * per-entry state. Persists to localStorage so unread state survives
 * reloads. Parallel to useNotificationsRead.
 */
export const useInboxRead = create<InboxReadState & InboxReadActions>()(
  persist(
    (set) => ({
      lastSeenTs: 0,
      markAllRead: () => {
        const { entries } = inboxLive.getState()
        if (entries.length === 0) return
        const latest = entries[0].ts
        set((s) => (s.lastSeenTs >= latest ? s : { lastSeenTs: latest }))
      },
    }),
    { name: 'openalice.inbox-read.v1', version: 1 },
  ),
)

export function useUnreadInboxCount(): number {
  const lastSeen = useInboxRead((s) => s.lastSeenTs)
  return inboxLive.useStore((s) =>
    s.entries.reduce((n, e) => (e.ts > lastSeen ? n + 1 : n), 0),
  )
}
