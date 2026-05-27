import type { EventLogEntry } from '../../api/types'

export const demoEvent: EventLogEntry = {
  seq: 1,
  ts: Date.now(),
  type: 'demo.welcome',
  payload: { message: 'Demo mode active — events stream is idle after this entry.' },
}
