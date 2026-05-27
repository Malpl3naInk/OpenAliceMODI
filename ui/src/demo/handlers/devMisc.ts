import { http, HttpResponse } from 'msw'

export const devMiscHandlers = [
  http.get('/api/dev/registry', () =>
    HttpResponse.json({ connectors: [], lastInteraction: null }),
  ),
  http.post('/api/dev/send', () => HttpResponse.json({ ok: true })),
  http.get('/api/dev/sessions', () => HttpResponse.json({ sessions: [] })),

  http.get('/api/version', () =>
    HttpResponse.json({
      current: '0.21.0-demo',
      latest: null,
      hasUpdate: false,
      releaseUrl: null,
      releaseNotes: null,
      publishedAt: null,
      error: null,
    }),
  ),

  http.get('/api/topology', () =>
    HttpResponse.json({ eventTypes: [], producers: [], listeners: [] }),
  ),

  http.get('/api/media/:date/:name', () => new HttpResponse(null, { status: 404 })),
]
