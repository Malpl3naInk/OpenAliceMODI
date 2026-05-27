import { http, HttpResponse } from 'msw'

export const personaHeartbeatHandlers = [
  http.get('/api/persona', () =>
    HttpResponse.json({ content: '# Demo Persona\n\nDemo mode — persona is read-only.', path: '/demo/persona.md' }),
  ),
  http.put('/api/persona', () => HttpResponse.json({ ok: true })),

  http.get('/api/heartbeat/status', () => HttpResponse.json({ enabled: false })),
  http.post('/api/heartbeat/trigger', () => new HttpResponse(null, { status: 204 })),
  http.put('/api/heartbeat/enabled', () => HttpResponse.json({ enabled: false })),
  http.get('/api/heartbeat/prompt-file', () =>
    HttpResponse.json({ content: '', path: '/demo/heartbeat.md' }),
  ),
  http.put('/api/heartbeat/prompt-file', () => new HttpResponse(null, { status: 204 })),
]
