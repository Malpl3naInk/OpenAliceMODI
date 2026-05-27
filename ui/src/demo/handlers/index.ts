import { authHandlers } from './auth'
import { tradingHandlers } from './trading'
import { workspacesHandlers } from './workspaces'
import { eventsHandlers } from './events'
import { chatHandlers } from './chat'
import { inboxHandlers } from './inbox'
import { personaHeartbeatHandlers } from './personaHeartbeat'
import { channelsHandlers } from './channels'
import { cronHandlers } from './cron'
import { toolsSimulatorHandlers } from './toolsSimulator'
import { marketHandlers } from './market'
import { configKeysHandlers } from './configKeys'
import { agentStatusHandlers } from './agentStatus'
import { notificationsNewsHandlers } from './notificationsNews'
import { devMiscHandlers } from './devMisc'
import { catchAllHandlers } from './catchAll'

// Order matters: catchAll must be LAST. MSW resolves handlers in registration
// order; catchAll's broad `/api/*` pattern would shadow specific routes if
// placed earlier.
export const handlers = [
  ...authHandlers,
  ...tradingHandlers,
  ...workspacesHandlers,
  ...eventsHandlers,
  ...chatHandlers,
  ...inboxHandlers,
  ...personaHeartbeatHandlers,
  ...channelsHandlers,
  ...cronHandlers,
  ...toolsSimulatorHandlers,
  ...marketHandlers,
  ...configKeysHandlers,
  ...agentStatusHandlers,
  ...notificationsNewsHandlers,
  ...devMiscHandlers,
  ...catchAllHandlers,
]
