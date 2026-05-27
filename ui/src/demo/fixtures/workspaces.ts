import type { Workspace, TemplateInfo, SessionRecord } from '../../components/workspace/api'

export const DEMO_WORKSPACE_ID = 'demo-ws'
export const DEMO_SESSION_ID = 'demo-session'

const demoSession: SessionRecord = {
  id: DEMO_SESSION_ID,
  wsId: DEMO_WORKSPACE_ID,
  agent: 'claude',
  name: 'c1',
  createdAt: new Date().toISOString(),
  lastActiveAt: new Date().toISOString(),
  state: 'running',
  agentSessionId: null,
  pid: 0,
  startedAt: Date.now(),
}

export const demoWorkspace: Workspace = {
  id: DEMO_WORKSPACE_ID,
  tag: 'demo',
  dir: '/demo/workspaces/demo',
  createdAt: new Date().toISOString(),
  template: 'demo-template',
  spawnedFromVersion: '0.1.0',
  currentVersion: '0.1.0',
  upgradeAvailable: null,
  agents: ['claude'],
  sessions: [demoSession],
  agentOverride: { claude: false, codex: false },
}

export const demoTemplate: TemplateInfo = {
  name: 'demo-template',
  displayName: 'Demo Template',
  description: 'A read-only demo template — workspace creation is disabled in demo mode.',
  groupOrder: 0,
  defaultAgents: ['claude'],
  version: '0.1.0',
  hasReadme: false,
}
